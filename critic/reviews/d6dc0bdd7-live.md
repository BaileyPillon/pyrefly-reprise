```text
Build / artifact / target version: main d6dc0bdd7 (Release 51) / bundle zpfxlH3Y / artifactHash be83da6643c2f1d6176404b8c621507d340a0f4a144cdd9fe5ca47b65cd28b79 (live at https://echoesofspira.com/, deployed 2026-10-17T16:41:34Z; target version: none, Chapter XXVII has no approved tile in docs/target/targets.json)
Review: live
Deployment: PASS (exact artifact byte-identical, all 5309 downloadable files; the r51 changes under test work live on the intended states at 1600x900 and 390x844; LIVE-R50-01 is verified fixed live)
Changed area: NOT APPLICABLE (the focused review owns it: critic/reviews/d6dc0bdd7-focused.json recorded changedArea PASS and ship SHIP)
Ship: N/A (a live review does not gate ship); this pass adds no critical and no major issue; it closes LIVE-R50-01 (the art/backdrops/mirror-aeons.png 404) as verified fixed on the live build; nothing it found is a regression
Milestone: not assessed
Quality: not assessed (a live review does not recompute the score)
Targets: not assessed (no target tile covers Chapter XXVII)
Top issues: none new. Observations only (not defects): the Dark Aeons' hurt painting sits 2.1 to 3.2 percent of the idle's height lower than the idle (the long-registered party reads 1.4 to 2.4 percent: the same order, a little less); 159 net::ERR_ABORTED prewarm requests across 10 contexts (cancelled by screen changes, no status, no console error)
Coverage: tested = all 5309 downloadable files byte-compared (--full); Chapter XXVII on the board (BOSS and LOCATION rows), party prep, Act I and Act II first menus, the Dark paintings, the guide cards, the Guide tab, desktop and phone; Chapter XIII's Mix row by key, click and tap, desktop and phone; Seymour Flux (FFX, Kimahri's Overdrive) and Bahamut (FFX-2) first turns, desktop and phone; pause, H, P; prerendered music; reload; reused = the continuity harness figures of the focused review (same commit, byte-identical artifact); not tested = see below
Next required review and why: the deep review (the marker's `deep` obligation, carried from earlier builds) is still owed; this pass settles only `live`
Elapsed review time / repeated work avoided: about 76 minutes wall clock (the --full download ran about 40 of them in the background beside the smoke); nothing from an earlier scratch folder was reused
```

Mode: headless Chromium launched by Playwright from node scripts, `PYREFLY_BROWSER=gpu` for every run (never SwiftShader, never the Claude-in-Chrome tools or the browser pane, no headed window at any time). No canvas was black, so no fallback was needed. Every run used a fresh browser context, a `?livesmoke=<ms>` cache-busting URL, and real key presses (and a real mouse click on the desktop, a real touch tap on the phone). Quiet rules: `D:/Tools/pyrefly-scratch/GPU-QUIET` was checked before every browser launch (it never existed during this review); `DESKTOP-QUIET` appeared at 14:10 EDT and no browser run after it was headed (all were headless). Evidence is beside this report in `critic/reviews/d6dc0bdd7-live/` (the result JSONs and logs of every run, the verify-live output, the scripts, and 30 or so frames). The scripts are in `critic/reviews/d6dc0bdd7-live/scripts/`.

Harness iterations that are NOT evidence: my first Dark Mirror run pressed Escape to dismiss a card and opened the pause screen over the battle (so its "first menu" frame was the pause screen and its staged-id read was empty); the first Chapter XIII run pressed Enter on Rikku's Attack while looking for a Skill submenu that the Alchemist's top menu does not have (Attack, Mix, Item, Change). Both were harness defects, were found by reading the frames and the logs, and were fixed; every result below is from the corrected final runs.

## Step 1: exact artifact (CHK-017)

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/d6dc0bdd7.json --url https://echoesofspira.com/ --changed-from critic/artifacts/6b638df95.json --full
```

```json
{
 "result": "PASS",
 "artifactHash": "be83da6643c2f1d6176404b8c621507d340a0f4a144cdd9fe5ca47b65cd28b79",
 "liveManifest": "match",
 "checked": 5309,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": []
}
```

PASS: the live manifest names this artifact and every compared file is byte-identical with the right content type. The manifest lists 5310 files; `_headers` is read by Cloudflare and never served, so it is the one not downloaded; `index.html` as a browser asks for it is identical to the artifact once Cloudflare's Web Analytics beacon (366 bytes and the line feed after it) is cut out. The manifest's two `problems` (art/portrait-parts/paine/1x and 2x eyeR-catch.png decode to a flat colour) are identical in the r50.1 and r50 manifests: not new. The live app reports `{sha: "d6dc0bdd", bundle: "index-zpfxlH3Y.js"}`. (Two verify-live processes were started by mistake at 12:59 and 13:00 on the same output file; the first was stopped by its PID and the second, which wrote verify-live.json, ran to the end.)

## Step 2: real-input smoke (CHK-016)

Every capture was asserted before it was read: the screen name (`chapter-select`, `party-prep`, `battle`, `pause`), the board's `selectedId`, the pending menu's actor (`awaitingMenu`), and the staged ids (`dark-mindy,dark-sandy` in Act I; `dark-yojimbo,dark-daigoro` in Act II). Every wait matched or threw.

### FFX-2, Chapter XIII (Trema), Rikku as Alchemist (both viewports)

Title, board (`selectedId` ffx2-trema), prep, the pre scene, the battle by real keys; the other girls' turns passed with real Attack keys (0 debug commands); Rikku's menu is Attack, Mix, Item, Change.

| Check | 1600x900 | 390x844 (touch) |
|---|---|---|
| Mix row present and greyed (`ig-cmd--disabled`) | yes | yes |
| Reason reads "Not built" whole (scrollWidth equals clientWidth: 50 of 50 px desktop, 83 of 83 px phone) | yes | yes |
| Old words ("needs the item picker", "Not built yet") absent | yes | yes |
| Arrow keys rest on the greyed row; the help line reads "Not built — Timed input" (desktop top line; phone footer "RIKKU · Not built — Timed input") | yes | yes |
| Enter on the row: nothing opens, the menu stays, the battle log does not move (21 to 21 desktop, 28 to 28 phone) | yes | yes |
| Click (desktop) or tap (phone) on the row: nothing opens, the log does not move, no picker words | yes | yes |
| Arrows leave the row; Rikku's Attack by real keys grows the log (21 to 28; 28 to 43) | yes | yes |
| Escape pauses, H hides and restores the panels, Escape resumes; P pauses, P resumes | yes | yes |

The phone HUD prints no dress text, so "Rikku is an Alchemist" is read there from the Alchemist's own command set (Attack, Mix, Item, Change); the desktop HUD shows the AL chip beside her. Frames: `shots/trema-desk-3-mix-selected.png`, `shots/trema-phone-3-mix-selected.png`.

### FFX, Chapter XXVII, Mirror Aeons (the Dark Mirror) (both viewports)

- **Board card** (selected with the arrow keys, 19 cards): LOCATION "Mushroom Rock Road and the Cavern" (whole), BOSS "Dark Sandy and Dark Mindy, then Dark Yojimbo" (both acts), PARTY Tidus, Yuna, Lulu. Same on the phone.
- **Backdrop (LIVE-R50-01):** the prep, the battle and the pause were all visited; no request for `art/backdrops/mirror-aeons.png` was made in any run and there were 0 responses of 400 or more in all 10 contexts (r50.1 live: 14, all that one URL). The road draws from `art/backdrops/mushroom-rock-road.webp` (200 image/webp). A direct `curl` of the old URL still answers 404: the file does not exist and nothing asks for it any more.
- **The Dark paintings are drawn:** the stage requests and draws `art/characters/dark-sandy`, `dark-mindy` and, in Act II, `dark-yojimbo` (idle, attack, cast, hurt, ko, with their sidecar JSONs), not the player's Sisters or Yojimbo; Dark Sandy and Dark Mindy in red and black in Act I, Dark Yojimbo in black beside his dog in Act II (`shots/mirror-desk-3-act1-first-menu.png`, `mirror-desk-4-act2-first-menu.png`, the contact sheets).
- **Feet (the Dark Aeons' pose registration), measured live two ways.** (a) With the battle waiting on a menu, each painted pose was forced in turn with `actor.setPose(name, {immediate: true, force: true})` (debug-assisted) and the feet line, the bottom of the pose's alpha box (`stage.projectRect`), was read against the idle's. At 1600x900: attack and cast and telegraph read within 1.1 px of the idle for all four Dark figures (Mindy 0.3, -0.1, -0.6; Sandy 0.2, 0.4, 1.1; Yojimbo 0.0, -0.2, 1.0; and the dog 0.0, 0.1, 0.8); hurt reads 5.2, 7.2, 6.7 and 3.5 px lower (2.77, 2.48, 3.19 and 3.72 percent of the idle's height); KO lies down (30 to 37 px lower, as a lying figure must). At 390x844 the same: stances within 0.3 px, hurt 2.3 and 2.9 px (2.55 and 2.07 percent). The same probe on the long-registered party at the same sizes reads hurt 3.4, 4.5, 4.3 px (Tidus, Yuna, Lulu; 1.48, 2.26 and 1.92 percent of their idle heights; desktop) and 2.4, 2.1, 1.4 px (phone), so a hurt painting that stands 1 to 3 percent lower than the idle is the house class (the Dark Aeons' 2.1 to 3.2 percent is a little more than the party's 1.4 to 2.4 percent, and the hurt painting's own alpha box, not a feet slide, is the suspected reason: the stance paintings are within 1.1 px); I did not find a figure whose stance paintings move the feet. (b) Natural play: with an in-page sampler running at 25 Hz on the real fight (Tidus's and Yuna's Attacks by real keys, then the advisor's line at skip speed in both acts), 58 (Mindy), 61 (Sandy) and 36 (Yojimbo) pose changes were seen across idle, attack, cast and hurt (the KO pose was not reached in play); each of those poses of each figure was photographed once in play (`shots/mirror-desk-pose-*.png`; the forced-pose frames are `shots/mirror-desk-static-*.png`). Natural swaps happen while the figure lunges or recoils, so a raw bottom delta across one swap mixes the swap with the movement and I do not claim a swap-level feet number from it; the swap-level measure is the continuity harness, which the focused review ran on this exact commit (CHK-026 PASS: 1093 swaps, worst feet shift 0.9 px, the Dark Aeons' swaps over tolerance 191 to 0), and the live artifact is byte-identical to the candidate it ran on. Not seen: a figure's feet visibly jumping at a swap in any frame I read.
- **No quote attributed to the game:** the in-battle guide cards (Act I: Dark Magus Sisters; Act II: Dark Yojimbo, "HP: 1,600,000", "WEAKNESSES: None. Immune to Sensor. His Luck is high...") and the pause Guide tab carry no "In Game Description" and none of the old sentences ("in the wrong colours, called up by a Yevon soldier" is gone). Observation only: the pause tab's quote line "Sandy and Mindy. Wearing the wrong colours." is attributed to Yuna and is a line of the chapter's own scene (`src/story/scripts/mirror-aeons.ts` line 49, `chapter-meta-mirror-aeons.ts`), not the game's text; the Guide tab's "designed line" is attributed to the chapter ("Mirror Aeons, The Dark Mirror").
- Act II was reached by the smoke tool's own method (the sisters set to 1 HP and the advisor's line at skip speed, debug-assisted) and its first menu, the guide card and the dog were checked; Act II was not fought to a win live.
- Pause, panels and resume on this chapter: Escape opened the pause screen ("CHAPTER XXVII · ... — THE DARK MIRROR · BATTLE 1 OF 2", hero painting of Tidus; the full location name, as designed), the Guide tab was reached with E.

### FFX, Chapter I (Seymour Flux) with an Overdrive, and FFX-2, Chapter IV (Bahamut), first turns (both viewports)

- Seymour Flux, desktop and phone: real-key turns (Tidus Attack, Yuna Attack, Kimahri's Overdrive); on Kimahri's menu the Overdrive row (the `ig-cmd--overdrive` class) opens Jump, Mighty Guard, White Wind; Escape backs out to the top menu (cancel path); opened again, the first Overdrive was taken and aimed with Enter and the battle log grew (16 to 21 desktop; 21 to 26 phone). Five turns on desktop, four on phone, every one grew the log. Escape pauses, Escape resumes.
- Bahamut, desktop and phone: Paine's and Rikku's Attack by real keys and Yuna's White Magic (first entry) by real keys (5 turns each viewport, every one grew the log); the Change row (the dressphere change, styled with the Overdrive class in FFX-2) was opened once by an earlier harness iteration (Gunner, Warrior, Black Mage) and a dressphere was changed by real keys; Escape pauses, Escape resumes. FFX-2 has no Overdrive; that row is the Dressphere Change.
- Prerendered music: `audio/music/title.mp3`, `chapter-select.mp3`, `sfx/sprite*.mp3` and the parity packs fetched (`parity-ffx-flux.mp3`, `parity-ffx-core.mp3`), every one 200; `audioDebug` reads prerendered manifest true, 41 cues, sprite decoded, the v2 pack decoded, playing `boss-seymour` (Flux), `boss-bahamut` (Bahamut), `pause` while paused; not the synth fallback.

### Console and responses

Final runs: 10 contexts (Mirror Aeons desktop and phone, Chapter XIII desktop and phone, Seymour Flux desktop and phone, Bahamut desktop and phone, the reload run, the Guide-tab run). **Console errors: 0. Page errors: 0. Responses of 400 or more: 0. Image or audio responses served as text/html: 0.** (The probe run and the three superseded Dark Mirror runs and three superseded Chapter XIII runs also read 0 errors and 0 bad responses.) **`requestfailed` events: 159, all `net::ERR_ABORTED`** (4 to 31 per context; the board's and the prep's idle prewarm of other chapters' backdrops, idle paintings and portraits, cancelled when the screen changed; they have no HTTP status and no console error, and the same files are served 200 when asked for in full). The earlier live reports did not count `requestfailed`, so I have no like-for-like count for r50.1; disclosed as an observation.

## Step 3: reload smoke (CHK-024, light)

Real keys: pause, E to the Options tab, ArrowDown and ArrowRight twice changed `settings.masterVolume` from 0.8 to 1 in `pyrefly-reprise:save:v1`; the chapter record for Bahamut read `attempts: 1`; after `page.reload()` the game came back on the title with no error, the whole save was identical, the setting read 1 and the chapter record was unchanged, and the board showed with no first-time card (the seen flags kept). The full upgrade matrix is not part of this pass; this deployment's diff holds no save-schema change on the live review's reading (see notTested).

## Issues

None new. LIVE-R50-01 (polish, `art/backdrops/mirror-aeons.png` 404): **verified FIXED live** (0 requests for it and 0 responses of 400 or more in 10 contexts; acceptance of its own entry met: "the same walk on the live host reads 0 responses >= 400 and 0 console errors").

## Not tested

- Act II fought to a win, the post scene, the results screen, the board's clear ribbon and the save's clear record, the retry (Chapter XXVII).
- The Dark Aeons' KO swap seen in play (the KO paintings were drawn only by the forced-pose probe at rest; the focused review's continuity run played the chapter to a win).
- Swap-level feet continuity of the Dark Aeons from live play (reused from the focused review's CHK-026 on the same commit; my live measure is the at-rest feet line).
- Chapter XIII's other states (Paragon and Trema's fights, any Mix executed: the row is greyed on purpose), and the other FFX-2 changes of this release (Confusion, Garment Grids, kill rewards, the stat setter) beyond first turns on Bahamut and Trema; the FFX Overdrives, counters, reach and kill rewards beyond Kimahri's Overdrive and five turns on Seymour Flux. Their numbers are pinned by the unit suites and the focused review's sweeps.
- The full CHK-024 upgrade matrix (fresh, returning, previous-build fixture, invalid storage, reset); sizes other than 1600x900 and 390x844; the cold-load timing; the Chapter XVII outcome (FOC511-02) and Braska's autoplay budget (FOC511-03), both the focused review's polish findings.

## Disclosures for the driver

1. LIVE-R50-01 is fixed live (the r50.1 live review counted 14 responses of 404; this build 0).
2. The 159 `net::ERR_ABORTED` prewarm cancellations are an observation for the record, not a defect, and the earlier reports did not count them.
3. The Dark Aeons' hurt painting's alpha-box bottom is 2.1 to 3.2 percent of the idle's height below the idle's (the party's long-registered hurt is 1.4 to 2.4 percent): the same order and a little more, suspected to be the hurt painting's own shape and not a pose-registration slide, since the attack, cast and telegraph stances are within 1.1 px of the idle and the focused review's continuity harness read 0.9 px as the worst feet shift of 1093 swaps; I did not judge the hurt offset by eye as a visible jump.
4. Quote on the Chapter pause tab, "Sandy and Mindy. Wearing the wrong colours.", is the scene's line attributed to Yuna, ours, not the game's: consistent with the rule, noted only because it is a quote on screen.
5. Two verify-live processes were started by mistake (one stopped by its PID); one clean result.
