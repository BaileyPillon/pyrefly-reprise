# Release 38 integration, part 1 (branch rel38-int, 2026-10-04)

Integrator pass for release 38, part 1, built by a Sonnet sub-agent of the driver session in worktree `D:/pyrefly-r29-text`, from
`origin/main` 77f0d157 (release 37.1 is main f4244e1f, bundle DhiL5vEz; the commits since are records). Bailey's go-ahead for release 38
(2026-10-03): "all your recommendations, godspeed" and "I'll go with all your recommendations thank you <3". Part 1 is the lanes that have
passed their independent checks. **Nothing here is deployed and no release was cut**: no release worktree (`D:/pyrefly-rel37`,
`D:/pyrefly-rel371`) and no `dist/` was touched; the driver cuts release 38 later. The gates below ran on the tested tip **029fd952**;
this record is a docs-only commit on top of it (plus four frames under `docs/screenshots/release-38/`).

## What merged, in order (each a `--no-ff` merge, `npx tsc --noEmit` clean after every one)

| # | Branch @ tip | Merge sha | Game case | What it is |
|---|---|---|---|---|
| 1 | r38-bytes @ 61708db6 | c3a0a5fd | both (shared build plumbing); the one visible effect FFX-2 only (Paine's living pause portrait in WebKit) | D-351: the painted art ships as lossless-exact WebP (480 files) or PNG (417: 284 recompressed, 133 as they are), the art resolver, the whole-set browser load gate in the deploy, 8-bit depth maps ([r38-bytes.md](r38-bytes.md)) |
| 2 | r38-advisor-card @ a88b8cc7 | e5e21a48 | both, each fixed in its own HUD (FFX `advisorRoomy`, FFX-2 `advisorLane` `CHIP_GRAZE`) | PR-0330: the move-advisor card keeps its detail lines under the colossus framing ([r38-advisor-card.md](r38-advisor-card.md)) |
| 3 | r38-polish @ 7020c47a | 36c53186 | D-359 both; FOC371-01 FFX only; FOC371-02/-03/-04 FFX-2 only | The "Guide's pick" tag is gone; Chapter IX's night-sakura arrival on a hurried opening; the Trigger Happy slab and Lady Luck's reels above the intent card, 14 px floor ([r38-polish.md](r38-polish.md)) |
| 4 | r38-bushido @ 5130a951 | 61e48371 | FFX only | PR-0308, D-348: Bushido plays the Overdrive chosen (lengths 8/7/7/6, the GameFAQs order labelled our estimate, a Square button), Swordplay wiring with today's numbers ([r38-bushido.md](r38-bushido.md)) |
| 5 | r38-pushin @ ca6c63e5 | 205ab08a | FFX-2 only | D-346: the DRESSPHERE SHOT's push-in where no clean full close shot exists, and on the phone ([r38-pushin.md](r38-pushin.md)) |
| 6 | r38-keys @ 161bf590 | 7f393c09 | FFX only (one shared plumbing line no FFX-2 or FF7 id reaches) | D-355, D-357: the telegraph hold for Seymour Flux and Braska's Final Aeon, the Overdrive key family alias for Lulu's Fury; **dormant until the paintings are installed** ([r38-keys.md](r38-keys.md)) |
| 7 | r38-rename @ 8822f81a | fcc43ba4 | both (the product's name) | D-368: the player-facing title is Echoes of Spira; the repo, folders, internal names and save keys keep "pyrefly" ([r38-rename.md](r38-rename.md)) |

No merge had a conflict. Both `r38-bytes` and `r38-rename` edit `src/app/screens/frontend/titleMarkup.ts` and `AGENTS.md`; git merged both hunks
cleanly and I read the result (the wordmark `Echoes` / `of Spira` and `logicalArtUrl` in the retina-srcset line; the title line and the new art-proof
rows in `AGENTS.md`). No merge touched `docs/handoff/NOW.md` (`git diff origin/main HEAD -- docs/handoff/NOW.md` is empty at the tip).

## Integration commits (each with its game case)

| Sha | Game case | What |
|---|---|---|
| bb9e02c0 | FFX only | The r38-polish check's disclosure 1 (FOC371-01 at `fast` and `skip`), below |
| 35415146 | both (critic tooling only) | `readPick` in `critic/runner/lib/supp.mjs` no longer records `badge`; `critic/runner/lib/README.md` says "no badge" from release 38 on is D-359, not a regression |
| 029fd952 | per decision (below) | `docs/target/decisions.json`: `delivery` to `implemented` for D-346 (FFX-2), D-348 (FFX), D-351 (both), D-355 (FFX), D-359 (both), D-368 (both); six lines, the one-decision-per-line layout untouched; `critic-policy-adoptions` passes (12). "implemented" is not "verified" |

### FOC371-01 at `fast` and `skip` (bb9e02c0, FFX only)

The check found the compressed Chapter IX arrival ran on the wall clock while the opening obeys the playback speed (`fast` 0.32, `skip` 0): at `fast` the
night and tree stayed 1.35 s past the first menu and across the first enemy action; at `skip` Yojimbo and Daigoro were still coming in 0.33 to 0.36 s after it.
The named fix ("run the arrival at the playback speed's factor") was not enough on its own: the first menu opens at no fixed time (0.56 to 1.65 s after the
card at `fast`, 0.21 to 1.29 s at `skip` in my runs), and one of three first `fast` runs still ended the arrival 266 ms after the menu. What is built
(`src/scenes/openingMark.ts`, `cavern-stolen-fayth.ts`, one line in `BattleScreen.ts`):

- `hurriedArrivalPace(scene)`: 1 at normal, 1 / 0.32 at `fast`, finished in one frame at `skip`, read live (the player can hold R1 mid-arrival), only for a hurried fight; and
  **a command menu that is up takes it to at least `MENU_PACE` (32), a whole arrival over in about 90 ms**: that is the guarantee that nothing plays behind the first menu.
- The figures' last alpha and place are set by the frame that starts before the end of their ramp (`from < yojimboIn[1]`), not by a fixed 50 ms window a fast clock steps over.
- A full opening (scene tapped through) and normal speed are untouched. `cavern-stolen-fayth.ts` is 396 lines, `BattleScreen.ts` did not grow.

Measured the check's way (the r38-checks-a `arrival.mjs`, headless GPU Chromium, real keys, seed 1, 1600x900; `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int/out/`):

| Build | Speed | Runs | Drawn in the first 3 frames after the menu | Arrival against the first menu |
|---|---|---|---|---|
| r38-polish bundle (the check's), same harness | fast | 1 | no (Yojimbo full 137 ms after the menu) | visible until 1,087 ms **after** the menu |
| r38-polish bundle | skip | 1 | no (Yojimbo full 345 ms after the menu) | visible until 1,509 ms after the menu |
| integrated, code-only bundle | fast | 6 | 6 of 6 | over 339 to 711 ms **before** the menu |
| integrated, code-only bundle | skip | 3 | 3 of 3 | none shown (once 0.54 tree when the debug hook set the speed after the card) |
| **integrated, the full production build** | normal, hurried | 2 | 2 of 2 (Daigoro 312 and 309 ms, Yojimbo 546 and 541 ms; the check: 308 to 320, 544 to 556) | visible 2.52 s, over 603 and 657 ms before the menu |
| the full production build | fast | 3 | 3 of 3 | visible 763 to 994 ms, over 356 to 475 ms before the menu |
| the full production build | skip | 2 | 2 of 2 | a 160 to 173 ms sliver (the debug hook set `skip` about 200 ms after the card); figures full before the menu |
| the full production build | normal, tapped | 1 | yes (Daigoro 695 ms, Yojimbo 1,160 ms, visible 5.01 s; the check: 690 to 705, 1,160 to 1,170, 5.00 to 5.02) | unchanged |

The menu coupling, read in the real game: the getter the battle screen puts on the scene reports `menu: true` from the exact frame `awaitingMenu` is true (0 ms offset, no
early or missed frame); with a menu forced up while the arrival was at full strength (veil 0.72, tree 1.0) it was gone 65 to 70 ms later at normal speed and 49 ms later at `fast`.
0 console errors and 0 404s in every run. 29 tests in `tests/unit/chapters/cavern-hurried-arrival.test.ts`; an addendum is in [r38-polish.md](r38-polish.md).

## Gates (on the tested tip 029fd952)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean after each of the seven merges, after each fix commit, and at the tip |
| Full suite `npx vitest run --testTimeout=60000 --maxWorkers=4` | **784 files passed, 5 skipped (789); 11,535 tests passed, 44 skipped, 1 todo; 0 failed; exit 0; 471 s** (log `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int/logs/full-suite.log`). None of the three known load timeouts (`strategy-ffx2-bahamut`, `sin-fins-core-bench`, `ui-pause-stack`) fired |
| `node tools/orphans.mjs` | 1208 modules, 1184 reachable from `src/main.ts`, **24 orphaned**: the same 24 as before the merges |
| Approved-art verifier `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` | approved 586 ok, judge-locked 48 ok, **0 mismatched, 0 missing** |
| `node tools/audio/qa.mjs --strict` | exit 0, 0 cues and 0 sfx with findings; 88.49 MB of the 90 MB budget |
| `node tools/critic-plan.mjs` | **review DEEP; before the deploy a FOCUSED review of the production candidate; after the deploy live verification, then the DEEP review on the live build (this build owes it); obligations live + focused + deep; NOT the save-data class** (no `SaveData.ts`, schema, migration or settings key in the range). Why: `index.html`, `src/main.ts`, `MoveAdvisor.ts` and its stylesheets, `portrait.ts`, `restPoses.ts`, `chapterPanel.ts` are "global layout, input and boot"; `overdrive.ts` "FFX CTB engine"; `ArtManifest.ts`, `PaintedArt.ts` "asset loader and manifests"; `BattlePresenterBeats.ts` "battle presenter and lifecycle"; `vite.config.ts` "build configuration and dependencies". Games: both. Checks: CHK-002 003 004 006 007 008 009 010 012 013 015 016 017 018 019 020 021 022 023. 47 shipped files, 174 with no product effect |
| Scratch production build `npx vite build --outDir D:/Tools/pyrefly-scratch/2026-10-04/rel38-int/dist --emptyOutDir` (a wrapper config changing only `cacheDir`; art derivation in its default `exact` mode; never `dist/`) | 14 s. `scope exact: 480 lossless WebP, 284 recompressed PNG, 133 unchanged; art 686.9 MB -> 554.1 MB (saves 132.9 MB)`; bundle `assets/index-vULu0TkU.js` (3,703,794 bytes; live 37.1 is 3,679,258), CSS `index-De9sl9AK.css`; **0 `.map` files**; `fx-assets verify` of the build's `fx/` PASS |
| `node tools/art-derive.mjs verify --dir <build>` | **PASS**: 897 masters (480 WebP, 417 PNG, 764 pixel-compared), 0 problems, 10 s |
| `node tools/art-derive.mjs audit --dir <build>` (the reference audit) | **PASS**: 724 text files; 2 art names in pages and styles, each a shipped file; the bundle names 490 art files (10 shipped, 480 derived masters mapped at run time), **0 dangling**; 43 names built at run time |
| `PYREFLY_BROWSER=gpu node tools/art-browser-load.mjs --dir <build> --port 6985` (the full-set load gate) | **PASS** in 21 s: 897 art files (480 WebP, 284 recompressed PNG, 133 PNG as shipped) and 44 other images; **Chromium 153.0.8010.12: 941 of 941** and **WebKit 26.6: 941 of 941** loaded and decoded at their masters' sizes, 0 failed; portrait plates living **20 of 20 in both** |
| Bytes and headroom, counted as the deploy counts them (`buildManifest` plus the manifest it writes plus `.nojekyll`; `harness/bytes-manifest.mjs`) | the build is 1,716 files, 662,090,465 bytes; with `artifact-manifest.json` (240,165 bytes) and `.nojekyll`: **1,718 files, 662,330,630 bytes; headroom 137,669,370** under the strict 800,000,000 (the lane's own build before the other lanes: 662,321,381 and 137,678,619). The decode check names only Paine's two flat catchlight layers (`art/portrait-parts/paine/{1x,2x}/eyeR-catch.png`), both listed in `critic/policy.json`: 0 problems after the filter. By type: `.webp` 512 files 294,044,028 B, `.png` 429 files 271,355,745 B, `.mp3` 28 files 88,494,023 B, `.js` 3 files 4,868,050 B, `.json` 720 files 2,684,942 B. Release 38 still ships on GitHub Pages |
| `PYREFLY_SCAN_DIST=<build> vitest run tests/unit/player-facing-title.test.ts` (the rename's build scan, ON, named) | 25 passed, 1 skipped: no player-facing copy of the old title in the source or in what ships |
| Headless smoke on that build (PYREFLY_BROWSER=gpu; a static server on 6982 with an empty fallback root so a missing file would 404; stopped by PID) | **Title at 1600x900 and 390x844**: tab title `Echoes of Spira`, wordmark `Echoes` over `of Spira`, description starts `Echoes of Spira`, the old name nowhere in the rendered text or meta; 0 console errors, 0 404s. **Chapter I (seymour-flux, FFX) and Chapter IV (ffx2-bahamut, FFX-2)**, real keys from the title: two turns each following the advisor card (Chapter I: Tidus White Magic > Hastega, then Kimahri Overdrive > Mighty Guard; Chapter IV: White Magic > Shell, then Skill > Magic Break on Bahamut), the next actor's menu opening each time; **no `.mad__badge` and no "guide's pick" text** on any card, smallest card text 14.2 px, no overflow, 0 clipped; **0 console errors, 0 404s**. Frames: `docs/screenshots/release-38/` |
| Dry-run merges of the still-pending lanes onto this tip (`git merge-tree`, nothing written to the tree) | r38-restage, r38-lady-luck-grid, r37-ui-floor, r38-evrae, r38-guide-jegged merge **cleanly**; **r38-motion has one conflict**, `src/engine/BattlePresenterBeats.ts`, two adjacent import lines (it adds `menuBlocks`, `motionAllowed` and the `SkillTravel` import; r38-keys adds the `telegraphHold` import): keep both |

## Not merged here, still to come (the driver's list)

- **r38-motion** (54480b0d) and **r38-restage** (8ce64ca2): merged re-check running. r38-motion needs the two-import union above.
- **r38-lady-luck-grid** (68cc4153) and **r37-ui-floor** (58fae0f9): check running. When lady-luck-grid merges, its `ui-ffx2-minigame-layer.test.ts` reads the plain selector (z-index 5) and keeps passing while the effective rule in the merged tree is `.ffx2hud > .ffx2hud__minigame { z-index: 15 }` (r38-polish, FOC371-02): it must read the effective rule (the polish check, disclosure 3).
- **r38-evrae** (e3a96f9c): re-check running; it ships only with its art.
- **r38-guide-jegged** (8e85c1e2): waits for Bailey's look at the screenshots.
- **The art install** after those: the r38-keys paintings (below) and whatever else is staged. The builder's estimate (not measured) is that D-332's adopted art, about 150 MB of `@2x` masters and 14.6 MB of images, is 13 to 16 MB more than the 137.7 MB of headroom, so the strict 800,000,000-byte line is the thing to settle before it goes in (D-369 records the move to Cloudflare Pages, with R2 for single files over 25 MB).

## Disclosures from the lane checks (carry into the focused review; majors are not regressions unless marked)

### r38-bytes (D-351; checks: first FAIL B1/B2, re-check FAIL B3, then the builder's Repair 2)
- The lane note ends at the builder's Repair 2 (the 64-byte floor and the whole-set load gate); **a third independent check, if one was run, is not recorded on the branch**. This integration re-ran its gates on the merged tree (above): 941 of 941 in both engines, 480 WebP and 417 PNG, 764 pixel-compared.
- Real Safari, iOS and Firefox are not covered (Firefox will not start on this machine; Playwright's WebKit is a Windows build). WebKit's 30-byte edge is measured, not sourced, hence the 64-byte floor.
- A pixel-identity pass in WebKit over the whole set is not a tool yet (the load and size check is). The real-pause script (`pause-living.mjs`) is scratch.
- **A deploy now needs Playwright's Chromium and WebKit installed** (both are here); a missing one fails the gate, and `npx playwright install` is a download (official source; D-370's standing permission covers it, and the handoff that uses it records it).
- Load time to the first command menu on a cold cache: +0.2 to +0.3 s on this desktop (inside the spread), about +0.7 s on a 4x-throttled phone, and about 1 s faster on a 50 Mbit/s line (a third fewer image bytes). The art decodes 1.48 times slower per megapixel.
- `tools/art-derive.mjs plan` and `warm` ignore `PYREFLY_ART_CACHE` (the Vite plugin, which a build uses, honours it).

### r38-advisor-card (PR-0330; Check 2: no blocker)
- **Chapter III's fix is probabilistic**: `FULL_CARD_HEIGHT = 68` against a 69 box leaves one grid px, and the HUD snaps boss rectangles to a 4 px quantum, so 2 of 35 runs at 1600x900 and 1 of 18 at 2000x1012 fell back to the 7-line compact card (it holds about 93 percent of runs). A robust fix measures the card in the HUD. Not a regression (live 36 shows the compact card in most runs).
- The first menu card is sometimes not on screen at all at Chapter III 2000x1012 (7 of 24 branch runs, 2 of 17 live 36 runs): the same symptom on both builds, untraced.
- Chapter IX gets today's rig card (8 lines), not the first repair's 12. FFX-2 Vegnagun still covers the boss by about 22,000 to 30,000 px^2 on live and branch alike (pre-existing).

### r38-polish (PASS, no blocker)
- Disclosure 1 (FOC371-01 off the default speed) is **closed by bb9e02c0** (above).
- "Nothing on screen changes but the tag" is not exact: the badge used to make the lead row wrap, so `fitCard` shed a row at some boards; without it the card keeps it. Chapter I at 1600x900 now prints the effect line "Speeds the party's turns up" (it is in the Chapter I frame in `docs/screenshots/release-38/`), Chapter II at 1280x720 the same, and the Chapter I card at 1280x720 is 25 px shorter. It fits and loses no text, but it is a visible change beyond the tag.
- The minigame layer is z-index 15 here and 5 on r38-lady-luck-grid; 15 wins when both are merged. In 33 Trigger Happy windows no numeral was covered; **Lady Luck's reels, which can stay up for 20 s under Active ATB, were not proven**: a numeral on Bahamut on the phone would rise into the reels. Decide before Lady Luck ships: keep 15, or let it be 5 on desktop.
- `BattleScreen.ts` (929) and `FFX2BattleHud.ts` (1,290) were over 400 lines and grew (+2, +8). The PR-0342 "foreign blue tree" finding should be re-scoped, not closed by removing the arrival. `docs/target/targets.json` (Bailey's registry, untouched) could now say the chamber tile's arrival plays for both openings.

### r38-bushido (re-check after the repair: no blocker)
- **Swordplay zone and speed per tier are still owed**: the ordering (stronger tier, narrower zone, faster marker) is sourced, the numbers are not (`ffx-combat-core.md` 5.3 is `[estimate]`), so every tier holds today's pair (`zonePercent` 12.22, `travelMs` 1,059) and live Swordplay plays as before. Bailey's yes to the estimates, or sourced numbers, makes it a four-row edit.
- The GameFAQs order is reconstructed from `research/` (D3 plus the NA/JP table; only Shooting Star's full GF-KB order is recorded, Banishing Blade's none) and **labelled "our estimate"** in the data, the research note and the handoff; the GF-KB page sits behind a Cloudflare check that did not clear. Shooting Star's GF-KB order matches no other source (a possible typo in the guide). The Steam HD copy (`D:/Tools/ffx-hd`) settles it later.
- Square (K, pad button 2) has no on-screen hint beyond the chip. `rollDefaultMinigame` draws `int(0, len - 1)` instead of `int(0, 6)`, so a seeded auto-played Dragon Fang can differ from before (no replay log depends on it).

### r38-pushin (no blocker)
- The push is subtle, about 1.22x on a desktop window (the strongest the neighbours allow): some will read it as "barely a shot". On the phone some changes still get no shot (the rules working; the count varies by run). One-off 21 to 38 ms search hitch on the frame that starts a desktop push. An enemy action starting inside a push was not provoked (the hand-back is the full shot's shared, tested path).
- The name plate is exempt from the push's panel check only; the full shot still counts it as a panel, which may be why Paine's full shot never finds a frame at Trema. Dropping `ffx2sf` from `hudPanels`' `SKIP` regex would make the push rarer: Bailey's call.

### r38-keys (PASS, no blocker)
- **The hold is 1.14 s as played, not 0.95 s** at the default `steady` pacing (x1.2); 0.95 s only with `?pace=current`. One constant, `TELEGRAPH_HOLD_MS`, sets it. Every Lance of Atrophy and every Ultimate Jecht Shot holds (4.3 and 2.35 times a fight); "first use only" is not built. The red heartbeat closes with the hold; no cue plays in it. A pause during the hold uses up what is left of it (how every presenter wait behaves).
- **The paintings are not installed anywhere**: every proof used an overlay. The install and the manifest line (`telegraph` for Flux and Braska, `od-fury` for Lulu) are owed to the integrator, and the install is what turns the hold on. The three sidecars still say "PREVIEW CANDIDATE (preview-picks, not approved, not installed)" and name a `D:` candidate path: rewrite them before hashing. The six files add 1,905,966 bytes, which fits in the 137.67 MB headroom.
- The decision registry says D-355 `implemented` in the sense of "wired": the hold code is merged and does nothing until the boss's own telegraph painting exists.

### r38-rename (D-368): no independent-check section is recorded on the lane branch; the builder's gates only
- I ran what the builder could not: the full suite on the merged tree (the lane ran none), the build scan of `player-facing-title.test.ts` on the scratch build (pass), and a real-input look at the title and the pause path on the production build (the title frames at 1600x900 and 390x844 are in `docs/screenshots/release-38/`).
- **The no-script line is never visible** (pre-existing, both builds): by the page's own CSS the no-JS frame is solid black. The words are updated; showing them is a CSS change outside a rename.
- **The hidden FF7 pause now reads "Echoes of Spira · Final Fantasy VII"**; Spira is FFX's world. Bailey's call. The approved Title tile (`docs/screenshots/mockups/A-title.jpg`) still shows the old name (`targets.json` is his registry, untouched). Owner-facing pages and tools still carry the old name (`docs/audio/audition.html`, the art-watch gallery, the `deploy-pages.mjs` header, `docs/ART-PIPELINE.md`, `AUDIO-GUIDE.md`, `SPRITE-GUIDE.md`).

## For Bailey (gathered from the lanes)

- **Title:** look at `docs/screenshots/release-38/title-1600x900.jpg` and `title-390x844.jpg`. The wordmark is text in the Ink & Gold serif, "Echoes" over "of Spira"; a painted logo, typographic options for the stack, and whether the hidden FF7 pause should print a different brand line are yours.
- **Advisor card:** the "Guide's pick" tag is gone (D-359). One visible side effect to know: at some sizes the card now keeps a row it used to shed (Chapter I prints "Speeds the party's turns up").
- **Telegraph hold (D-355):** the pause is 1.14 s at the default pacing, not 0.95 s; "first use only", Omnis later, and a cue are open. Nothing shows until the three paintings are installed.
- **Swordplay:** yes to the estimates in `ffx-combat-core.md` 5.3, or wait for sourced numbers (a four-row edit). **Bushido order:** the GameFAQs order is "our estimate" until the Steam copy is checked.
- **Dressphere push-in:** subtle by design (1.22x); the name-plate question for the full shot.
- **Lady Luck reels over numerals (z-index 15 or 5)** before Lady Luck ships.

## For the driver (practical)

- **fx maps:** the shared backup `D:/Tools/pyrefly-art-backup/fx` now matches `tools/fx/fx-assets.json` on this tip (`fx-assets verify --dir` PASS), and so does this worktree's `public/fx`; **the shared main tree's `public/fx` still holds the old 16-bit maps** (8 entries differ). Run `node tools/fx-assets.mjs restore` in `D:/Final Fantasy` after it fast-forwards, and in the release worktree before a build, or the deploy's fx check fails and the build ships 3.6 MB more.
- **Release tree inputs:** this worktree's `public/audio`, `fonts` and `fx` equal the shared tree's except `audio/candidates/*` (never ships) and the `fonts/*/OFL.txt` CRLF versus LF (about 0.5 KB); so the bytes above stand for a release cut, within that.
- **Servers and scratch:** I started three static servers (6980, 6981, 6982, PIDs 67420, 83936, 84548) and stopped all by PID; ports 6980 to 6989 are free. Scratch is `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int/` (the full build `dist/` about 640 MB, harness, runs, logs). Parked to `F:/pyrefly-parked/2026-10-04/rel38-int/`: an accidental `selftest.mjs` build (636 MB; I ran `node critic/runner/lib/selftest.mjs --help` and it ran the self-test and wrote a build under C: temp; moved off C:, nothing deleted), and my first-try arrival runs. Never run that selftest with a flag expecting help.
- **Junctions to unlink later (from the r38-rename note):** `D:\pyrefly-r38-rename\node_modules` and `D:\pyrefly-r38-rename\public\art` are junctions into the main tree: `cmd /c rmdir "<link>"` each (no `/s`) before that worktree is ever removed, and never `git worktree remove` first.
- The untracked wrapper configs `.rel38int-vite-tmp.config.mjs` and `.rel38int-vite-full-tmp.config.mjs` in `D:/pyrefly-r29-text` are agent scratch (parked at the end); nothing from them is committed.

## Decisions delivery updated (029fd952)

`docs/target/decisions.json`: D-346, D-348, D-351, D-355, D-359 and D-368 read `delivery: implemented` (built on `rel38-int`, not deployed; none is "verified"). The
focused review of the production candidate and the deep review on the live build settle them.

## Layout facts

Changed src files over 400 lines (house rule 7), all already over on main and disclosed by their lanes: `FFX2BattleHud.ts` 1,290, `BattleScreen.ts` 929, `PaintedArt.ts` 860,
`portrait.ts` 761, `MoveAdvisor.ts` 703, `hudSafeZones.ts` 543 (three `export` keywords, did not grow), `chapterPanel.ts` 502, `overdrive.ts` 472 (did not grow). The files this pass wrote:
`openingMark.ts` 99, `cavern-stolen-fayth.ts` 396 and `cavern-stolen-fayth-arrival.ts` 398 stay under 400.
