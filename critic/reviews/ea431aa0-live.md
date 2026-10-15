```text
Build / artifact / target version: main ea431aa0 / bundle DzeCyPSw / artifactHash fc8fe7f6762e356d248c6885226fd7e4dd97887ed2a0caa328902ec506becf04 (deployed 2026-10-15T00:38:27Z from D:/pyrefly-r48 under the owner override, replacing b8aa6f96); a live check has no approved target version
Review: live
Deployment: PASS (the exact artifact is what the site serves and every flow the change names ran on it; the whole run's 5 console errors and 5 404s are the two polish findings already on record, FOC48-01 and FOC46-04, both in hidden chapters)
Changed area: NOT APPLICABLE (a live review does not assess it; the focused review that preceded this deploy, critic/reviews/ea431aa0-focused.json, read changedArea FAIL on a carried check and ship SHIP)
Ship: N/A (a live review does not gate ship)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none that fails the deployment. Re-observed on live, both already on record: FOC48-01 (polish, new Tourist Trap chapter: its scene key names a painting the build does not hold, so the prep is a flat page and the opening scene plays on black; the page asks for art/backdrops/ffx2-tourist-trap-cavern.png and the host answers 404) and FOC46-04 (polish, hidden Fayth chapter: art/backdrops/exp-fayth-deck.png, flat prep). One new observation, LV48-1 (polish): under Itchy a greyed row with a long name (White Magic) shows no reason anywhere at 1600x900 (the reason measures 1.9 px) and the top bar reads the generic "Open the White Magic menu."; the greyed Attack, Skill and Item rows show it.
Coverage: tested = artifact identity (5221 of 5222 files byte-identical, content types, live manifest, the page as a browser receives it, the 4 removed files 404 at both addresses, the 4 new files at both, all 1291 text files through the path gate: 0 hits, with a control it refuses); the board ("of 18", no new card) and the door words (daigoro, valefor, leblanc, experiment, mushroom, fayth, limit); Tourist Trap and Valefor at Besaid from the title to their first menus with pause, hide, resume; the FFX-2 first menu under Itchy and the FFX-2 Silence card; the FFX Silence card; LV43-2 on 4 runs; a light reload; console and 404 sweep. reused = none. not tested = see section 4 (a win or loss of the new chapters, the RC7 rule lanes as played, other sizes and the phone, audio by ear, the full upgrade matrix).
Next required review and why: the deep obligation in critic/pending/ea431aa0.json stays open (a live review cannot settle it; it carries the debt of 57 earlier builds and the build went out under the owner override); the owner's ear for the two new chapters' stand-in cues (CHK-B1)
Elapsed review time / repeated work avoided: about 50 minutes, 29 of them the byte comparison (10.3 GB, 16-way), which ran while I wrote the smoke; the counted browser runs started after it finished (4.8 minutes, nothing of mine beside them); five uncounted shakedown runs (four on the shared link) are counted nowhere; the previous live check's wrapper, smoke and static scripts were reused (re-pointed, rebuilt around this change), none of its results
```

Browser: headless Chromium driven by Playwright from node, **PYREFLY_BROWSER=gpu** (the four chapter first-menu captures read mean luminance 73.1 to 87.2, so no black canvas and no fallback), a fresh browser and a fresh context per part (storage empty: `storageAtStart` 0 on every chapter run, an empty HTTP cache), a cache-busting query on every page URL, 1600x900, real key presses only. Every capture asserts the screen (and `awaitingMenu` for a battle) first (CHK-016). Debug-assisted steps, named where they occur: Itchy and the Escape flag on the Chapter IV party (2.4), the Silence status on a party member in FFX-2 and FFX (2.5), the Zombie set aside in FFX Chapter I.

## 1. Exact artifact (CHK-017): PASS

Run in D:/pyrefly-r48: `verifyLive()` from `tools/artifact-manifest.mjs` with `--full` semantics (the marker's planned review is deep) against `critic/artifacts/ea431aa0.json`, through the 16-way prefetch wrapper `critic/reviews/ea431aa0-live-verify.mjs` (the previous check's wrapper, re-pointed). Every file except the host-read `_headers` was fetched with a `?v=<time>` query; its sha256 and content type were compared with the manifest, in order, with the bodies dropped once hashed.

| | |
|---|---|
| Files in the artifact / compared | 5222 / 5221 (all but `_headers`) |
| Mismatched / missing / wrong content type / errors | 0 / 0 / 0 / 0 |
| Live `artifact-manifest.json` | match (hash fc8fe7f6...) |
| `index.html` as a browser receives it | identical once Cloudflare's Web Analytics beacon (366 bytes and the line feed) is removed |
| Hashed file caching | `assets/exp-fayth-table-qvhITO2F.js`: public, max-age=31536000, immutable |
| Fetched / time | 10280 MB in 1735 s (29 minutes; shared with four short shakedown runs); finished 2026-10-15T01:12:54Z; result `critic/artifacts/ea431aa0-verify-live.json` |
| Against the previous build b8aa6f96 | 4 files added (`index-DzeCyPSw.js`, `index-Bu4qsaVc.css`, `worker-D9zpfPtz.js`, `exp-fayth-table-qvhITO2F.js`), 1 changed (`index.html`), 4 removed (the old bundle, stylesheet, worker and fayth table): the 4 removed files answer 404 at both addresses (`echoesofspira.com` and `echoes-of-spira.baileypillon.workers.dev`), both addresses serve `index-DzeCyPSw.js` and `index-Bu4qsaVc.css`, and the 4 new files are served at both with the manifest's sha256. Every image, audio file and art JSON is the byte-identical file b8aa6f96 shipped (the comparison above covers them all) |
| The page itself | `window.__pyrefly.build()` read `{sha: ea431aa0, bundle: index-DzeCyPSw.js}` and the document loaded `index-DzeCyPSw.js` and `index-Bu4qsaVc.css` in the five browser parts that read them |
| Text of the site | all 1291 text files downloaded from live: 1291 of 1291 sha256 equal the manifest; `node tools/dist-local-paths.mjs --dir <the download> --json`: exit 0, 1291 scanned, 0 hits; the same gate over a made-up folder (a drive path, a sidecar key outside the list, a claude.ai link) exits 1 with 4 hits; `/__ffx-local/` answers 404 at both addresses; the live `audio/manifest.json` equals the shipped one |
| Manifest decode notes | the two notes of the manifest (`art/portrait-parts/paine/1x/eyeR-catch.png` and `2x`: "decodes to a single flat colour") are the same two every earlier build's manifest carries |

## 2. Real-input smoke (CHK-016): PASS

`critic/reviews/ea431aa0-live-smoke.mjs` counted run 2: 7 browser parts, 69 assertions, 0 failed, 4.8 minutes (2026-10-15T01:22:00Z to 01:26:45Z); counted run 1 (01:13Z to 01:19Z, before the real-key Itchy steps of 2.4 were added) read 66 assertions, 0 failed, and the same facts. `critic/reviews/ea431aa0-live-static.mjs` (no browser): 11 assertions, 0 failed. Console errors 5 and HTTP 404s 5 for the whole run, all of them the two known findings (2.8); audio requests 89 (all 200, 27 distinct files, every one a file of the artifact, none of the three retired files), image or audio URLs answered as HTML 0.

### 2.1 The board and the door words

- **The board** (fresh profile, from the title by Enter): the strip reads "0 of 18 chapters beaten" (`aria-label`) and "of 18 beaten /18"; 18 tiles, exactly the 18 listed chapters (11 FFX, 7 FFX-2), none of the six hidden ids (`exp-leblanc`, `ffx2-masterpiece-theatre`, `sinspawn-gui`, `exp-fayth`, `ffx2-tourist-trap`, `ffx2-valefor-besaid`): no new card. Shot `board-doors-board.jpg`.
- **`daigoro` and `valefor`** (typed with real keys on the board): a word with a wrong letter in it (`daiggoro`, `valgefor`) resets silently and the board stays; the right word opens that chapter's party prep (screen `party-prep`, chapter `ffx2-tourist-trap` and `ffx2-valefor-besaid` asserted); Escape returns to the board (1 press); the word again, then on to the battle (2.2, 2.3).
- **The other words**: `leblanc` opens `exp-leblanc`, `experiment` opens `ffx2-masterpiece-theatre`, `mushroom` opens `sinspawn-gui` and `fayth` opens `exp-fayth`, each its own party prep (chapter asserted), and Escape returned to the board each time. The near-misses `daigoru` and `valefar` open nothing.
- **`limit`** (the FF7 secret word, observed only; this build does not touch it): the board left after 2.9 s under the swirl that holds it while the fight loads, the FF7 Guard Scorpion fight reached its first menu 5.6 s later (`awaitingMenu`; cue `boss-ff7-guard`, gain 1; 0 console errors). Shot `door-limit-after-limit.jpg`.

### 2.2 Tourist Trap (word `daigoro`, FFX-2, hidden chapter 23)

From the title by keys, the word, the prep (shot `daigoro-prep.jpg`: a flat navy page with the party, objectives and tip; no painted wash, the known FOC48-01), 20 Enter presses through the opening scene (first line at 1.96 s after the word, narration; the scene cue `scene-bevelle-underground` was playing, gain 0.00016, the fade-in just starting; the scene is black behind the dialogue box, `daigoro-first-line.jpg`, FOC48-01 again), then the battle: enemies `x2-yojimbo` and `x2-daigoro`, first menu 12.7 s after the battle screen (`awaitingMenu` asserted). The first-menu frame `daigoro-first-menu.jpg` (mean luminance 73.1) is Yuna's turn: rows WHITE MAGIC, CHANGE, ITEM (187.7, 114.9 and 67.2 px labels), a "Yuna was poisoned." toast and the advisor's "Esuna → Yuna, cures Poison" line over the stage with Yojimbo and the dog. The cue playing was `boss-ffx2-fallen-aeons` (the chapter's borrowed battle cue), its mp3 requested and answered 200 `audio/mpeg`; only `parity-ffx2-core` was fetched of the sound packs.

### 2.3 Valefor at Besaid (word `valefor`, FFX-2, hidden chapter 24)

The same route: prep, 18 Enter presses, first line at 1.93 s with the scene cue playing (gain 0.00015), the plate behind the opening shown (`valefor-first-line.jpg`: the Besaid Temple chamber), enemy `x2-valefor`, first menu 10.3 s after the battle screen. The frame `valefor-first-menu.jpg` (mean luminance 87.2) is Paine's turn (her cut-in over the left half): rows ATTACK, SKILL, CHANGE, ITEM (104.9, 80.4, 114.9 and 67.2 px) and Valefor's "Attack, most likely 71%" card over the stage with the winged boss. Cue `boss-ffx2-fallen-aeons`, 200 `audio/mpeg`, only `parity-ffx2-core`.

### 2.4 FFX-2 first menu under Itchy (Chapter IV, debug-assisted)

FFX-2 Chapter IV (Bahamut) from the board by real keys; right after the battle screen came up (ticks 0, before any gauge filled) Itchy was put on all three girls through the debug API and the flag the menu reads for Escape forced on, the focused review's recipe. First menu 7.8 s after the battle screen; frames `ffx2-ch04-itchy-menu.jpg` (run 2) and the run-1 frame kept as `shots-run1/ffx2-ch04-itchy-menu.jpg`.

| | Run 2 (Paine's menu) | Run 1 (Yuna's menu) |
|---|---|---|
| Rows | ATTACK (grey), SKILL (grey), CHANGE, ITEM (grey), ESCAPE | WHITE MAGIC (grey), CHANGE, ITEM (grey), ESCAPE |
| Greyed rows' names | Attack 104.9 px, Skill 80.4 px, Item 67.2 px: the focused review's numbers to the decimal; none clipped | White Magic 187.7 px, Item 67.2 px; none clipped |
| Reasons | "Itchy — spherechange first", cut on desktop ("ITCHY — ..."); the top bar names the highlighted row with it: "ATTACK Itchy — spherechange first — Physical damage" | the same on Item; White Magic's reason measures 1.9 px (see LV48-1) |
| Usable | Change, Escape | Change, Escape |

Real keys under Itchy (run 2): Enter on the row the cursor rested on (the greyed Attack) was refused (the same five rows, `awaitingMenu` still true); ArrowDown twice reached Change; Enter opened its list (Gunner, Black Mage; the command rows replaced, still the player's turn); Escape returned to the same five rows (the cancel path; the game was not paused). The focused review compared this menu with live b8aa6f96, which listed only Change and Escape under Itchy; that comparison is its, not repeated here (b8aa6f96 is no longer served).

**LV48-1 (polish, observation; not a regression, live b8aa6f96 hid these rows).** On Yuna's menu (run 1, frame `shots-run1/ffx2-ch04-itchy-menu.jpg`) the greyed WHITE MAGIC row shows no reason at all: its reason measures 1.9 px at 1600x900 because the long label takes the room, and the top bar reads "Open the White Magic menu." where Paine's greyed Attack row gets "Itchy — spherechange first — Physical damage". The Itchy icon on the party chips still shows the cause, and the row is plainly greyed with its name. Next correction: give a greyed submenu row's top-bar line the same reason sentence the other rows get.

### 2.5 The Silence cards

- **FFX-2** (both runs; debug-assisted: Silence put on a living girl through the debug API, no early FFX-2 enemy casts it): `GUIDE SILENCE Yuna is silenced: no spells, Dances or Songs. Echo Screen, Esuna or a Remedy cures it.` (not the old "White Magic, Black Magic or Arcana"); the card went away when the status was removed. Frame `shots-run1/ffx2-ch04-silence-card.jpg` (the card docked on the left under the BAHAMUT panel, the status chip on Yuna's row). The live bundle carries "no spells, Dances or Songs" and not the old words (static part).
- **FFX** (Chapter I, debug-assisted, Kimahri's Zombie set aside for the read because the card prints the Zombie hint first): `GUIDE SILENCE Tidus is silenced: no White or Black Magic. Echo Screen, Esuna or a Remedy cures it.`, unchanged by this build, no Summon. The card was read from the page; the frame caught the turn cut-in and is not cited.

### 2.6 LV43-2: the scene cue at the first spoken line, counted on the 4 runs made

| Run | First line | Cue playing at the first line |
|---|---|---|
| Tourist Trap | at 1.96 s after the word (narration) | `scene-bevelle-underground` (gain 0.00016) |
| Valefor at Besaid | at 1.93 s | `scene-bevelle-underground` (gain 0.00015) |
| FFX-2 Chapter IV | at 3.1 s, Rikku | `scene-bevelle-underground` (gain 0.15) |
| FFX Chapter I | at 4.0 s, Kimahri | none, by design: its script opens with `music(null)`, the scene bed enters later |

Playing in 3 of 4 (the two earlier live checks read Chapter I the same way); run 1 read the same 3 of 4. The two new chapters' first lines come about 2 s after the word, so the cue was at the very start of its fade-in at that instant; it was named by the audio engine and its mp3 had been requested (the audio snapshot lists it as playing).

### 2.7 Pause, hide, resume

Tourist Trap, Valefor and FFX Chapter I: Escape opens the pause, H hides the panels (page text 3008 to 2529, 1830 to 1387 and 956 to 601 characters) and H restores them (back to 3008, 1830 and 956), Escape resumes (back on `battle`), P pauses, P resumes: all passed.

### 2.8 Audio, console and 404 sweep

- Audio: 89 requests over the seven parts, all 200 (`audio/mpeg` or `application/json`); in each of the four chapter runs the mp3 of the cue playing at the first menu (`boss-ffx2-fallen-aeons` twice, `boss-bahamut`, `boss-seymour`) was requested and answered 200 `audio/mpeg`, not the procedural fallback, and was the first formation's start cue from the chapter data; the sound packs fetched were that game's own only (`parity-ffx2-*` in FFX-2, `parity-ffx-*` in FFX); the FF7 fight played `boss-ff7-guard`.
- Console errors 5 and HTTP 404s 5, all known: **4 in the Tourist Trap part**, all `art/backdrops/ffx2-tourist-trap-cavern.png` (FOC48-01: the file is not in the build; the door check opens the prep once more than a plain run, so 4 asks where the focused review counted 3), and **1 in the Fayth door part**, `art/backdrops/exp-fayth-deck.png` (FOC46-04: the hidden Fayth chapter's prep; the prep is a flat navy page, `door-fayth-prep.jpg`). The other five parts read 0 and 0.

## 3. Reload (CHK-024, light): PASS

FFX Chapter I, fresh profile: REDUCE FLASHES set on through the pause screen's ACCESSIBILITY tab with real keys (`data-reduce-flashes` on `<html>`, saved `reduceFlashes` true), 5 coach tips seen and the chapter record made in the session; the page reloaded. Before any input the page read the setting back from the save (`data-reduce-flashes` on `<html>`, `reduceFlashes` true), the saved settings equal key for key to the ones before the reload (`reduceFlashes` true, `colourVision` off, `reduceMotion` false, `lowEffects` false, `textSize` 1), and the coach tips and the chapter records are the same. The full upgrade matrix is NOT part of this pass (section 4).

## 4. Not tested

- The two new chapters **played to a win or a loss and through their results screens**: the focused review did all four on the candidate (win and loss of each, through the results screen); this pass stops at the first menu and the pause. Enemy behaviour past the first menu was not watched on live.
- The **RC7 rule lanes as played** (FFX-2 automatic abilities, the SOS layer, Berserker counters, Evade & Counter, FFX's full Mix chart): CHK-023 stays as the focused review left it (UNVERIFIED: not reachable from a shipped chapter); only the visible half (the Itchy menu and both Silence cards) was read.
- The **Itchy menu at other sizes** (2000x1012 and a 390x844 phone: the focused review measured both on the candidate; only 1600x900 was read on live), the FFX-2 phone Silence card (the short sentence), and every Itchy row type (LV48-1 was seen on one).
- **Audio by ear**: the two new chapters use borrowed stand-in cues (`boss-ffx2-fallen-aeons` as the battle cue, `scene-bevelle-underground` as the scene bed; PR-0099) and only the owner's ear (CHK-B1) can judge them; a cue name and a non-zero gain are not sound.
- The **hidden Fayth chapter past its prep** (FOC46-04 was observed at the prep only) and the **FF7 fight beyond its first menu**.
- The **full upgrade matrix** (CHK-024 full): no save, schema or progress code is in this build's diff (the focused review) and a hidden-chapter clear writes only the experiments store; here only the light reload above ran on live. WebKit or Safari, a real phone, a real controller, other sizes.

## 5. Reproduction

All in `D:/pyrefly-r48`, scratch in `D:/Tools/pyrefly-scratch/2026-10-14/live-ea431aa0/` (screenshots under `shots/`, the first counted run under `shots-run1/` and `live-smoke-run1.json`, the smoke's json `live-smoke.json`, the static part's `static.json`, the progress file `critic/reviews/PROGRESS-live-ea431aa0.md`).

```
node critic/reviews/ea431aa0-live-verify.mjs                      # the byte comparison, writes critic/artifacts/ea431aa0-verify-live.json
node critic/reviews/ea431aa0-live-static.mjs                      # pages, removed and new files at both addresses, text download and the path gate, the card words in the bundle
PYREFLY_BROWSER=gpu node critic/reviews/ea431aa0-live-smoke.mjs   # the browser parts; ONLY=daigoro,valefor picks parts
```

Honest notes on method: the Itchy status, the Escape flag and both Silence statuses (and the Zombie set aside in FFX) are debug-assisted; the first-menu frames of the two new chapters were captured under the turn cut-in (the rows show; the screen and `awaitingMenu` were asserted first); the first counted run preceded the real-key Itchy steps and the second is the reported one; five short uncounted shakedown runs (the board and doors, the Itchy part twice, FFX Chapter I, the two new chapters) were made while debugging the script, four of them on the link the byte comparison was using, and are counted nowhere (on that link the scene cue was sometimes not yet loaded at the first line and a first menu took up to 33 s); the one wrong first guess of mine (the `limit` door "did not open" in a shakedown) was the swirl still holding the board while the FF7 fight loaded on the shared link, and the part now waits for it.
