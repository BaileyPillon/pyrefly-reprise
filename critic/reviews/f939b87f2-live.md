```text
Build / artifact / target version: main f939b87f2 / bundle 4LVgaz0l / artifactHash a63f8a4a4dab4106d81c1b4c80b04f76c08379af7daeeea226f028ed3a599ed2 (live at https://echoesofspira.com/, deployed 2026-10-15T18:49:25Z; target version: none, the two new hidden chapters have no approved tile)
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (the focused review owns it: critic/reviews/f939b87f-focused.json)
Ship: N/A (a live review does not gate ship; the focused report recorded SHIP with changedArea FAIL; the majors that release discloses are F939-01 the open Sensor card hides Yenke at Kimahri's first menu, F939-03 Angra Mainyu very hard on the Active clock, PR-0380 carried; this pass saw F939-01 again exactly as disclosed)
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score)
Targets: not assessed (the board is unchanged and still reads 0 OF 18 BEATEN)
Top issues: none new. Informational only: LV-1 cancelled prefetch requests (ERR_ABORTED, no status, no console error); LV-2 four wrong assumptions of my own harness, corrected and re-run; LV-3 one transient page.goto timeout, repeated
Coverage: tested = all 5251 downloadable files byte-compared (--full), title and board, the 'gagazet' chapter to Kimahri's first turn with the cancel path and Lancet on a brother ("Kimahri learns Thrust Kick"), 'angra' to its first menu with the cancel path, the 'daigoro' and 'fayth' openings, pause / H / Escape / P / the PAUSE chip, prerendered music fetched and playing, the 390x844 first menu, four older door words, one setting through reload; reused = the focused review's code-level findings, because dist-gate is byte-identical to the live code; not tested = the full CHK-024 upgrade matrix, a fight to results in either new chapter, Lancet on Yenke and a learned Rage in use, continuity and the data audit (the deep review's), formal cold-load timing, listening, other viewport shapes, a real phone, Safari, a gamepad
Next required review and why: the deep review of this live build (the marker's `deep` obligation, carried from earlier builds) is still owed; this pass settles only `live`
Elapsed review time / repeated work avoided: about 63 active minutes (the 33 min 50 s --full download ran in the background while the smoke was built, so it added no time); wall clock about 3 h 10 min because the session waited about 2 h 10 min for a usage-limit reset; nothing the focused review did was repeated, its candidate is hash-identical in code
```

Mode: headless Chromium launched by Playwright from node scripts, `PYREFLY_BROWSER=gpu` for every run (ANGLE, NVIDIA GeForce RTX 5070 Ti, Direct3D11; never SwiftShader, never the Claude-in-Chrome tools or the browser pane). No canvas was black, so the one-time fallback was not needed. Every run used a fresh browser context and a `?cb=` cache-busting URL. Scratch and evidence: `D:/pyrefly-r49/.live-f939-tmp/` (results/*.json, shots/*.png).

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/f939b87f2.json --url https://echoesofspira.com/ --changed-from critic/artifacts/ea431aa0.json --full
```

```json
{
 "result": "PASS",
 "artifactHash": "a63f8a4a4dab4106d81c1b4c80b04f76c08379af7daeeea226f028ed3a599ed2",
 "liveManifest": "match",
 "checked": 5251,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

PASS: the live manifest names this artifact and every compared file is byte-identical with the right content type. The manifest lists 5252 files (10.8 GB); `_headers` is read by Cloudflare and never served, so it is the one file not downloaded. `index.html` as a browser asks for it is identical to the artifact once Cloudflare's Web Analytics beacon (366 bytes and the line feed after it) is cut out. The run took 33 min 50 s. The deploy's own check had compared 79 files; this one compared all of them. (The diff from ea431aa0 is 33 added files, the two chapters' paintings, figures, portraits and pause plates plus the new bundle, its fayth-table chunk and its worker; 3 changed, `art/derived.json`, `art/manifest.json` and `index.html`; 3 removed, the previous bundle, chunk and worker.)

Two more identity facts: `window.__pyrefly.build()` read `{sha: f939b87f, bundle: index-4LVgaz0l.js}` in all 26 contexts I opened, and `dist-gate`, the production candidate the focused review used, is byte-identical to the live manifest for `index.html`, the five files under `assets/`, `art/manifest.json` and `art/derived.json`. The manifest's two `problems` lines (`art/portrait-parts/paine/{1x,2x}/eyeR-catch.png` decode to a flat colour) are the entries `intentionalFlatImages` in policy.json declares, and the previous build carried the same two.

## Step 2: real-input smoke (CHK-016)

Real input only: `page.keyboard.press` for keys, `page.mouse.move` then `page.mouse.click` for clicks. The debug API was read for state (screen, chapter, phase, `awaitingMenu`, battle log, combatants, `audioDebug()`), never used to act. Each capture is shot between two state reads and records the screen, chapter, game, phase, `awaitingMenu`, the `#ui > [data-screen]` roots against the screen stack, and that no title root remains. Final evidence set: 12 contexts, 60 captures, 0 unverified.

| Run | What | Viewport | Input | Checks | Result |
|---|---|---|---|---|---|
| s1b-gagazet | title, board, 'gagazet', first turn, cancel, Lancet, pause, option, reload | 1600x900 | keys, plus real clicks on START BATTLE, the Special row, the PAUSE chip, the Options tab | 31 | all OK, 18 captures |
| s1-gagazet | the same by keys only | 1600x900 | keys | 29 | 28 OK; the failure was my own `pause--bare` class assumption (LV-2), the panels did hide |
| s2c-angra | title, board, 'angra', first menu, cancel, pause | 1600x900 | keys | 9 | all OK, 7 captures |
| s3-daigoro, s3-fayth | the two openings | 1600x900 | keys | 5 + 5 | all OK, 3 captures each |
| s4d-phone | 'gagazet' first menu, cancel | 390x844 | click on START BATTLE, keys | 9 | all OK, 6 captures |
| s5-* (six) | leblanc, experiment, mushroom, valefor, limit, a wrong word | 1600x900 | keys | 6 | all OK, 1 capture each |

**Title and board.** Title, Enter (the second press takes, see LV-2), chapter select asserted. The board reads `0 OF 18 BEATEN` with 18 tiles and total 18, and neither `biran-yenke` nor `ffx2-angra-mainyu` is on it (no hidden card, no leak into the count). At 390x844 it reads the compact `0 /18`.

**'gagazet' (FFX only).** Typing the word on the board opens party prep for `biran-yenke` (game `ffx`). START BATTLE (Enter in s1, a real click in s1b and s4d) leads to the opening scene on the painted Mt. Gagazet plate, then to Kimahri's first player turn: screen `battle`, chapter `biran-yenke`, phase `command:kimahri`, `awaitingMenu` true, rows Attack / Special / Items, Kimahri alone against Biran 3208 HP and Yenke 2406 HP (the numbers the focused review named). Cancel path: ArrowDown to Special, Enter opens target selection on Biran (the Special row holds one move, Lancet), ArrowRight moves the reticle to Yenke, Escape returns to the top menu with Special selected and the screen still `battle` (a second Escape at the top menu opens the pause). Lancet: Enter in s1, a real click on the Special row in s1b, confirmed with Enter on Biran. The banner "Kimahri LEARNS THRUST KICK" drew on screen (`.ig-banner__chip`, captured), the battle log carried `Kimahri learns Thrust Kick`, the events were action-start, mp-damage, damage, heal, message, overdrive-gauge, action-end, and at the next menu Kimahri's gauge was 100, `unlockedOverdriveIds` was `[jump, thrust-kick]` and an Overdrive row had appeared. The first-menu frame shows the open Sensor card over Yenke: F939-01, as disclosed.

**'angra' (FFX-2 only).** The word opens party prep for `ffx2-angra-mainyu` (game `ffx2`). After the opening scene the first menu was waiting about 27 s after the battle started: Rikku's Attack / Skill / Change / Item, with Yuna, Rikku and Paine against Angra Mainyu (333,444 HP), Tawrich and Zarich (5,440 HP each). Enter on Attack opens the target step (the HUD reads `WAIT - ATB HELD`, Zarich ringed, "Enter confirm, left and right change target, Esc back"), Escape returns to the same menu with the same rows. Escape at the top menu opens the pause, P resumes to the same menu. I did not fight it.

**'daigoro' and 'fayth'.** Both words opened their party prep on the first attempt (the one failed `fayth` open the focused review could not reproduce, its F939-05, did not happen: one try, it opened). The openings draw paintings: Tourist Trap's cavern, mean luminance 76.3 with 1.5 % near-black pixels (focused candidate 76.7), and the Fahrenheit deck against the sky, 109.2 with 0.3 % (focused candidate 111.1). Plates `ffx2-tourist-trap-cavern.webp` (2,700,818 bytes) and `exp-fayth-deck.webp` (3,424,618 bytes) answered 200 `image/webp`. The second line of each opening was equally bright.

**Pause.** On the gagazet menu: Escape opened the pause (stack `battle,pause`, panels shown); H hid the panels (`pause--bare` on the pause view, `panelsHidden` true, tabs and body measured hidden, "H show panels - Esc resume" left on the painting, stored `pausePanelsHidden: true`); H again restored them (false); Escape resumed to the same menu (phase `command:kimahri`, `awaitingMenu`, the frame counter still advancing after the resume: 3030, then 3067 0.6 s later); P opened and closed it the same way; a real click on the PAUSE chip opened it and Escape closed it.

**Music (network log and state; nothing was listened to).** Twenty audio files were fetched across the runs, 227 responses, every one 200 `audio/mpeg`: `title`, `chapter-select`, `scene-gagazet`, `boss-challenge`, `victory-ffx`, `defeat-ffx`, `pause`, the SFX sprites and the parity pack for FFX; `scene-bevelle-underground`, `boss-ffx2-fallen-aeons`, `victory-ffx2`, `defeat-ffx2` for the Angra run; `scene-fahrenheit` and `boss-evrae` for the fayth chapter, `scene-chateau-leblanc`, `boss-experiment` and `boss-ff7-guard` for the leblanc, experiment and limit doors. `audioDebug().playing` followed title, chapter-select, scene-gagazet, boss-challenge, pause, boss-challenge; the loader reported source `prerendered` for title, chapter-select, scene-gagazet and pause, `prerendered.manifest` was true, the music was not muted and its gain reached 1. (For the battle cue the loader's entry was already released when sampled, so its source read null; its file had been fetched 200.)

**390x844.** Same flow, a real click on START BATTLE started the chapter (no Enter needed), the three command rows sit inside the viewport in a two-column grid, `scrollWidth` equals the viewport (no horizontal scroll), target selection shows the touch layout's `Special -> Biran Ronso` and `Back` buttons inside the viewport, Escape cancels to the top menu. A desktop browser at a phone size is not a phone.

**Older door words.** `leblanc` opens `exp-leblanc` (FFX-2), `experiment` opens `ffx2-masterpiece-theatre` (FFX-2), `mushroom` opens `sinspawn-gui` (FFX), `valefor` opens `ffx2-valefor-besaid` (FFX-2), `limit` goes straight to the FF7 battle, `wrongword` opens nothing (the cursor moved from Seymour Flux to Lady Yunalesca on the way, as board keys do). These are the results the focused review recorded for the candidate.

**Whole run.** 0 console errors, 0 page errors, 0 responses with status >= 400, 0 image or audio responses served as `text/html`, over 26 contexts and 4,484 requests (the first exploration, with its own logger, also read 0 and 0).

## Step 3: reload smoke (CHK-024, light)

In the pause OPTIONS tab (Tab to it in s1, a real click on the tab in s1b), ArrowLeft on MASTER VOLUME took it from 0.8 to 0.7 and the save blob held 0.7 at once. After `page.reload()`: `pyrefly-reprise:save:v1` read 0.7, `audioDebug().volumes.master` read 0.7 at boot before any key (the game applied it, not only stored it), the settings object differed from the one before in `masterVolume` alone, and the two storage keys were unchanged. Done twice, same result. The full upgrade matrix (fresh player, returning player, a save from the previous live build, invalid or truncated storage, the reset flow) is not part of this pass and was not run.

## Findings (all informational)

- **LV-1, cancelled prefetches.** 121 requests ended `net::ERR_ABORTED` over the 26 contexts (63 in the final set). None carries a status, none logged a console error, and every painting that was shown had loaded. They are cancelled speculative loads: other chapters' plates dropped when the player leaves the board, and the 1x `art/pause/<member>.webp` request cancelled each time the pause opens while `art/pause/<member>.2x.webp` answers 200. Not counted as 404s. Worth a look someday as wasted requests, not a defect.
- **LV-2, my harness assumed what the game does not do** (a harness failure, not a product failure; each was corrected and the scenario re-run, and the first runs are kept in `.live-f939-tmp/results`): an Enter pressed in the first second after the title appears is ignored (a second press took in every run; probably the title's fade-in, not traced); in FFX-2 the command menu can be waiting while the engine phase reads `play:*` or `script:*` (I had asserted `command:*`), and the character whose menu is open is named by the move advisor (`.mad__actor`), not by the party panel; the 390x844 layout draws its own target panel and the board count as `0 /18`; the `pause--bare` class is not on the `.pause` element I queried (the panels did hide, as the screenshot and the stored setting show).
- **LV-3, one transient timeout.** The first start of the corrected gagazet run timed out in `page.goto` at the 30 s default with no response, while other agents' headless browsers were running on this GPU; curl read the page in 0.26 s a minute later, and the repeat with a 90 s limit booted in 2.5 s. Treated as host contention, not as a product failure; it shot nothing.
- **F939-01 seen again.** The open Sensor card sits over Yenke at Kimahri's first menu on live, as the focused report disclosed (I closes it). Not a new finding.

## Not tested

The full CHK-024 upgrade matrix; a fight to results in either new chapter (Angra was not attempted, by the brief); Lancet on Yenke, a learned Rage in the picker, Jump and the guard behaviour; continuity (CHK-026, CHK-027), the data audit (CHK-008, CHK-011), same-seed pairs and the first-time-fan lens, all the deep review's; the formal cold-load timing (`coldload.mjs`, throttled run; informally the page was ready in 2.5 s unthrottled); audio by ear (agents cannot hear; fetches, routing and state only); other viewport shapes (2000x1012, 4:3, 1440p, 4K), a real phone, Safari or WebKit, a gamepad; the other chapters of this release through a real flow.

## Settlement

No product code was touched, nothing was committed, pushed or deployed, no server was started, no process was left running, and nothing under `critic/pending/` was edited by hand. `node tools/critic-clear.mjs --report critic/reviews/f939b87f2-live.json` was run to settle this build's `live` obligation; its output is in the task result.
