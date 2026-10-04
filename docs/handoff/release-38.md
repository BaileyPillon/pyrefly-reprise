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

---

# Release 38 integration, part 2a (branch rel38-int2, 2026-10-04)

Integrator pass, part 2a, built by a Sonnet sub-agent of the driver session in worktree `D:/pyrefly-r29-text`, from `origin/main` fad09603 (part 1, above). Bailey's
go-ahead for release 38 is quoted in part 1. This part merges the two lanes whose merged re-checks passed, **r38-restage** and **r38-motion**. **Nothing here is
deployed and no release was cut**: no release worktree and no shared `dist/` was touched. The gates below ran on the tested tip **d82414b3**, which is now `origin/main`
(pushed `fad09603..d82414b3`, a fast-forward) and the shared main tree's HEAD; this record is a docs-only commit on top of it (plus one frame under `docs/screenshots/release-38/`).

## What merged, in order (each a `--no-ff` merge, `npx tsc --noEmit` clean after each; the numbering continues part 1's seven)

| # | Branch @ tip | Merge sha | Game case | What it is |
|---|---|---|---|---|
| 8 | r38-restage @ 8ce64ca2 | 658393e2 | the table's rows FFX only (Chapter II, Yunalesca); the roster, the hold and the per-axis write rule are shared plumbing, both games, and behave as before for a fight with no row | PR-0310, D-353 ask 4: Chapter II is staged from a per-chapter table (party -0.10 / +0.04, fiends +0.75 / -0.47) so the party and the fiends stop touching at rest; Chapter III's table is written and **switched off** (`CHAPTER_III_STAGED = false` in `stageTable.ts`, so Chapter III plays as origin/main does); Natus option N left off ([r38-restage.md](r38-restage.md)) |
| 9 | r38-motion @ 54480b0d | 2d7cc1d3 | SKILL TRAVEL both games; RUN-IN FFX-2 only; the PlaceOwner hand-over is shared plumbing, inert in FFX; LOW EFFECTS plays today's attack | D-354 ask 5: SKILL TRAVEL (spells, skills and shots cross the field, and the number and the HP row wait for the landing), the FFX-2 run-in to the foe and home with a stand-off search, and a girl out on a run owns her place so the MAX mix stops adding its share to her home at every Attack ([r38-motion.md](r38-motion.md)) |
| - | integration commit d82414b3 | - | slots FFX only, RUN-IN FFX-2 only, the hand-over guard both and inert in FFX | tests only: `tests/unit/r38-merged-staging.test.ts`, the guard on the resolution below |

Merge 8 had no conflict. **Merge 9 conflicted in two files**, both resolved exactly as the merged re-check recorded them
(`D:/Tools/pyrefly-scratch/2026-10-04/mr-recheck/resolution.md`, the re-check's scratch merge 363353d3; my resolver scripts are `resolve-staging.mjs` and `resolve-beats.mjs`
in `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int2/harness/`, both CRLF-preserving; the Beats one also refuses a hunk that is not the expected shape). No merge touched
`docs/handoff/NOW.md` (`git diff fad09603 d82414b3 -- docs/handoff/NOW.md` is empty). Nothing else conflicted; the other files both sides edit auto-merged and I read them
(`KeySlots.ts`: motion's three `export` keywords beside r38-keys' additions; `MaxMix.ts`: restage's and r38-pushin's hunks side by side).

## The conflicts, resolved (verbatim)

### `src/engine/fx/mix/staging.ts` (three hunks)

1. Imports, keep both (restage's hold flag, motion's hand-over):

```ts
import { STAGE_HOLD_KEY } from '../../StageRelax.ts';
import { placeOwned } from '../../motion/PlaceOwner.ts';
```

2. Header comment, restage's first line plus motion's two added lines:

```ts
 * by the stage (an arrival, a spot) is respected and the mix's share is put back on top of it.
 * A figure that is out on a run of its own (`motion/PlaceOwner.ts`, RUN-IN) is no re-seat: it is left alone, record
 * and all, until it is home (r38-motion repair; before it, every run added the share to the girl's home once more).
```

3. `Staging.release()`, motion's loop with restage's fourth argument (`null`: no slot share):

```ts
  release(): void {
    for (const a of [...this.recs.keys()]) {
      // Out on a run: her position holds none of the share now, and she returns to the place that does. Keep the record, so the
      // next write takes the old share off and puts the new plan's on, once.
      if (placeOwned(a)) continue;
      this.write(a, 1, 0, null);
      this.recs.delete(a);
    }
    this.plan.clear();
  }
```

`apply` merged by itself (restage's `side ? shiftOf(side, a) : null` argument on the line below motion's `if (placeOwned(a)) continue;`). The result: `git diff origin/r38-restage HEAD -- src/engine/fx/mix/staging.ts`
is **44 lines**, motion's additions only (the import, the two comment lines, the guard line in `apply`, the loop in `release`); `git diff 363353d3 d82414b3 -- src/engine/fx/mix/staging.ts`
is **empty**, so the file is byte for byte the re-check's resolved one. The file is 215 lines.

### `src/engine/BattlePresenterBeats.ts` (two adjacent import lines)

r38-keys (part 1, already on main) added the `telegraphHold` import under the KeySlots line; r38-motion changed the KeySlots line (it adds `menuBlocks`) and added two imports under it.
Keep all of them: motion's KeySlots line (the old line plus `menuBlocks`, nothing else; the resolver checks that), then `telegraphHold`, then motion's two:

```ts
import { armOdKey, endOdKey, menuBlocks, odApex, odOpensAction, showOdOnOpen, telegraphUp } from './KeySlots.ts'; // r37 slots: a move's own key painting, the boss telegraph painting (empty until installed)
import { telegraphHold } from './TelegraphHold.ts'; // r38 keys (FFX only): the boss's telegraph painting held before Flux's and Braska's headline moves
import { motionAllowed } from './motion/MotionGate.ts'; // r38-motion: BATTLE SPECTACLE's two motion looks share one gate
import { landFlight, launchShot, planSkill, revealBlow, settleFlight } from './motion/SkillTravel.ts'; // r38-motion SKILL TRAVEL (both games); a no-op without a shot
```

The rest of the file merged by itself: `git diff fad09603 d82414b3 -- src/engine/BattlePresenterBeats.ts` is motion's changes only (the run-in before the blow, `lungeFor`, `planSkill`, `launchShot`, `shotLanded`, `revealBlow`,
`actionEnd(ctx, endedId?)`), and r38-keys' `telegraphHold` use is untouched.

### The guard (d82414b3)

Neither lane had a test of the combination (slots active and a girl out on a run): `r38-place-owner.test.ts` carries a verbatim **copy** of restage's `Staging` with the comment "when r38-restage
lands, drop this copy". The re-check's scratch test of the real merged class is now `tests/unit/r38-merged-staging.test.ts` (185 lines, 6 tests; its body is the re-check's unchanged, only the header and the imports
changed): the slots land once and hold; 30 runs out and back along her own lane and 30 with a change of depth leave every figure within 0.001; without the hand-over a depth change walks her (the control); a figure
that arrives while another is out stands on its slot from its first write and never steps; `release()` puts a figure that is home back on the stage's seat and keeps an owned figure's record, so the share goes on
once when she is home. The re-check showed two wrong resolutions fail it (restage's `release` loop taken verbatim; no `placeOwned` guard in `apply`). The copy in `r38-place-owner.test.ts` is **left in place** (nothing is
deleted here); dropping it is a follow-up.

## Gates (on the tested tip d82414b3)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean after merge 8, after merge 9 with both resolutions, after the test commit, and once more at the tip (exit 0) |
| Full suite `npx vitest run --testTimeout=60000 --maxWorkers=4` | **795 files passed, 5 skipped (800); 11,670 tests passed, 44 skipped, 1 todo (11,715); 0 failed; exit 0; 455.5 s** (log `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int2/logs/full-suite.log`). None of the three known load timeouts fired. Against part 1's tip (784 files, 11,535 tests): **+11 files and +135 tests**, all new: restage's `fx-mix-roster` (7), `fx-mix-stage-hold` (12), `fx-mix-stage-table` (27); motion's `r38-skill-travel` (20), `r38-flight-fx` (17), `r38-stand-off` (7), `r38-run-in` (13), `r38-stage-motion` (11), `r38-run-in-staging` (6), `r38-place-owner` (9); and `r38-merged-staging` (6) |
| `node tools/orphans.mjs` | 1218 modules, 1194 reachable, **24 orphaned**: the same 24 (part 1: 1208 and 1184); the ten new modules (`roster.ts`, `stageTable.ts`, `BattleScreenRunIn.ts`, `MotionGate.ts`, `PlaceOwner.ts`, `SkillTravel.ts`, `StageMotion.ts`, `StageMotionPort.ts`, `StandOff.ts`, `FlightFx.ts`) are all reachable |
| Approved-art verifier `D:/Tools/pyrefly-lora/tools/verify-approved.mjs` | approved 586 ok, judge-locked 48 ok, **0 mismatched, 0 missing** (default root `D:/Final Fantasy`, and with `ROOT=D:/pyrefly-r29-text`: the same) |
| `node tools/audio/qa.mjs --strict` | exit 0, 0 cues and 0 sfx with findings; 88.49 MB of the 90 MB budget (unchanged) |
| `node tools/critic-plan.mjs` | **review DEEP; before the deploy a FOCUSED review of the production candidate; after the deploy live verification, then the DEEP review on the live build (this build owes it); obligations live + focused + deep; not the save-data class** (no `SaveData.ts`, schema, migration or settings key; no line about it in the plan). Against live 37.1 (f4244e1f): both games, checks CHK-002 003 004 006 007 008 009 010 011 012 013 014 015 016 017 018 019 020 021 022 023, targets cast, fight, pause, phone, presentation, scenes, "+ audit every changed data value against research/"; **70 shipped files, 245 with no product effect** |
| Scratch production build `npx vite build --config .rel38int2-vite-tmp.config.mjs --outDir D:/Tools/pyrefly-scratch/2026-10-04/rel38-int2/dist --emptyOutDir` (a wrapper config that changes only `cacheDir`; art derivation in its default `exact` mode; never `dist/`) | 3 s, 1,286 modules. `scope exact: 480 lossless WebP, 284 recompressed PNG, 133 unchanged; art 686.9 MB -> 554.1 MB (saves 132.9 MB)`; bundle `assets/index-B18y6bAf.js` **3,724,311 bytes** (part 1: `index-vULu0TkU.js` 3,703,794, **+20,517**; live 37.1: 3,679,258); CSS `index-De9sl9AK.css` 337,488 and both workers unchanged from part 1; **0 `.map` files**; `fx-assets verify --dir <build>/fx` PASS |
| `node tools/art-derive.mjs verify --dir <build>` | **PASS**: 897 masters (480 WebP, 417 PNG, 764 pixel-compared), 0 problems, 11 s |
| `node tools/art-derive.mjs audit --dir <build>` (the reference audit) | **PASS**: 724 text files; 2 art names in pages and styles, each a shipped file; the bundle names 490 art files (10 shipped, 480 derived masters mapped at run time), **0 dangling**; 43 names built at run time |
| `PYREFLY_BROWSER=gpu node tools/art-browser-load.mjs --dir <build> --port 7002` (the full-set load gate) | **PASS** in 23 s: 897 art files (480 WebP, 284 recompressed PNG, 133 PNG as shipped) and 44 other images; **Chromium 153.0.8010.12: 941 of 941** and **WebKit 26.6: 941 of 941** loaded and decoded at their masters' sizes, 0 failed; portrait plates living **20 of 20 in both** |
| Bytes and headroom, counted as the deploy counts them (`buildManifest` plus the manifest it writes plus `.nojekyll`; `harness/bytes-manifest.mjs`) | the build is 1,716 files, 662,110,982 bytes; with `artifact-manifest.json` (240,165 bytes) and `.nojekyll`: **1,718 files, 662,351,147 bytes; headroom 137,648,853** under the strict 800,000,000 (part 1: 662,330,630 and 137,669,370; this pass adds **20,517 bytes**, all of it the bundle: neither lane ships art). The decode check names only Paine's two flat catchlight layers (both listed in `critic/policy.json`): 0 problems after the filter. By type: `.webp` 512 files 294,044,028 B, `.png` 429 files 271,355,745 B, `.mp3` 28 files 88,494,023 B, `.js` 3 files 4,888,567 B, `.json` 720 files 2,684,942 B, `.css` 1 file 337,488 B, `.woff2` 15 files 275,100 B. artifact hash `eca4b7eebafb628fe3a405aad2f9dc54fbe3388677f0b35be130efdaa8925a2c`. Release 38 still ships on GitHub Pages |
| `PYREFLY_SCAN_DIST=<build> vitest run tests/unit/player-facing-title.test.ts` | 25 passed, 1 skipped: no player-facing copy of the old title in the source or in what ships |
| Headless smoke on that build (`PYREFLY_BROWSER=gpu`, ANGLE on an RTX 5070 Ti; a static server on 7000 with an empty fallback root so a missing file would 404; stopped by PID) | **Chapter II (Yunalesca, FFX), real keys from the title, `setSeed` before the first key, 1600x900, seeds 1 to 3, two menus each: nobody inside Yunalesca in 6 of 6 menus** (painted overlap **0 px2**, rest gap +1 by the plan and by the live frame, closest painted approach 23.1, 25.6 and 25.2 px at the first menu of the three seeds; the re-check's merge read 23.1 to 27.7 px at 1600x900 over its five seeds). **Chapter IV (ffx2-bahamut, FFX-2): 8 plain Attacks (Paine 5, Rikku 3), resting x constant**: Paine -0.744 and Rikku -1.486 before and 1 s after every Attack, spread 0 (z -1.5 and 0.1, spread 0); the run-in played every time (8 of 8 plans); a whole Attack 1,481 to 1,535 ms (Paine) and 1,521 to 1,530 (Rikku); after the settle every figure back on its rest (distance 0 for Yuna, Rikku, Paine and Bahamut). **0 console errors, 0 page errors, 0 404s** in every run. Chapter IV used the debug hooks `gotoChapter` and `autoBattle` with 99,999 HP for the party (labelled setup scaffolding, as in the re-check); the party's rest x steps by a few hundredths between runs at the mix's own re-plans (the re-check's merge read Paine -0.753 to -0.757 and Rikku -1.475 to -1.478; its disclosure 2 says why). Frame: `docs/screenshots/release-38/ch2-first-menu-1600x900.jpg` (Chapter II's first menu: Yuna, Tidus and Auron left, Yunalesca right, nobody inside her, no "Guide's pick" tag) |

## Main, the shared tree, and the fx maps

- **Pushed:** `git push origin rel38-int2:main`, `fad09603..d82414b3` (a fetch just before showed main had not moved). 92 files, nothing under `public/`, the largest blob 770 KB.
- **The shared main tree:** `git -C "D:/Final Fantasy" merge --ff-only origin/main` fast-forwarded to d82414b3. Its two dirty tracked files (`docs/handoff/NOW.md`, `research/jegged-encounter-guides-ffx-b.md`) are
  not touched by the range and were left as they were.
- **fx maps (the driver's note in part 1, now done):** in `D:/Final Fantasy` `node tools/fx-assets.mjs verify` read **FAIL (8)** after the fast-forward (the old 16-bit `depth.json` and `depth.png` of
  `bevelle-underground`, `djose-chamber-provisional`, `gagazet`, `macalania-temple`). I parked a copy of those eight files (4.0 MB, sha256-identical to the live ones) at
  `F:/pyrefly-parked/2026-10-04/rel38-int2/fx-old-16bit-main-tree/` first, then ran `node tools/fx-assets.mjs restore`: **"8 restored from D:/Tools/pyrefly-art-backup/fx"**, and `verify` after it:
  **PASS** (twice). `public/fx` is gitignored, so `git status` of the main tree is unchanged.

## Not merged here, still to come (the driver's list, replacing part 1's)

- **r38-lady-luck-grid** (68cc4153) and **r37-ui-floor** (58fae0f9): check running. **r38-evrae**: its tip is now **f4113d87** (part 1 recorded e3a96f9c), re-check running; it ships only with its art.
  **r38-guide-jegged** (8e85c1e2): waits for Bailey's look at the screenshots. Dry-run merges of all four onto d82414b3 (`git merge-tree`, nothing written to the tree): **each merges cleanly**.
  Part 1's note on lady-luck-grid stands (its `ui-ffx2-minigame-layer.test.ts` must read the effective z-index 15 rule, not the plain selector, and Lady Luck's reels over a numeral on the phone were not proven).
- **The art install** (the r38-keys paintings and whatever else is staged) and the **800,000,000-byte line** (D-369): headroom is now 137,648,853 bytes; the estimate in part 1 (D-332's adopted art about 13 to 16 MB over it) is unchanged.
- **Cutting release 38** from a clean release worktree: `node tools/fx-assets.mjs restore` there first (the backup now matches `tools/fx/fx-assets.json`), then the plan above (focused review of the candidate before the deploy, live verification and the deep review after).
  The two lanes' own notes say what the focused review should read: a Switch-in, Chapter II's later forms and the plan's timing in every chapter (restage); the four clips' scenes, the menu rule, REDUCE MOTION and the phone frame (motion).

## Disclosures from the two lane checks (carry into the focused review; majors are not regressions unless marked)

### r38-restage (re-check on a merge with motion: PASS for Chapter II alone)
- **Chapter III is not fixed, it is off** (PR-0310 stays open there): the formation that clears the party on every seed is a bigger move than the approved picture. Chapter II's later forms are not cleared
  (form 3 reads 16,516 px2 against live's 21,278), and the fiends draw 2 to 8 percent smaller (D-353 said they would; Chapter II -2.7 to -2.9 %).
- **D1, for Bailey:** the table is nearer option B than the D-353 page's "party 0.5 left, boss 0.5 right" (party -0.10 / +0.04, fiends +0.75 / -0.47; the builder's reason is that the party's half puts a member 8 to 17 % under the
  command list). A pick approves only what he names: show `docs/screenshots/r38-restage/yunalesca-1600x900-menu1-live-vs-branch.jpg` and ask.
- Small HUD increases against live, cosmetic (Chapter II 2560x1080 menu 1: Yuna's staff ring under the ATTACK row, 0.27 of her pixels against 0.16). `?stand=` and `?standf=` (checks-only query hooks) ship in the production bundle like the product's other
  ungated, non-persistent hooks. **`framing.ts` is 398 lines (two lines of headroom): the next change there must extract first.**

### r38-motion (re-check on a merge with restage: PASS, the run-in drift repaired)
- The check's other minors stand: Darkness's slash lands 85 to 130 ms before the beam; every `x2-dark-knight-*` ability flies as a beam (`DARK = /darkness|dark-knight/`), not Darkness only; in Wait mode SKILL TRAVEL shows in FFX-2 only when no menu
  is open at the blow (D-357, as asked), so a charging spell's beam is usually suppressed (Darkness's beam in 5 of 5 casts in the check's sessions); HUD panels lie over the runner in the first frames of some runs; **on the phone the leftmost girl is clipped during the truck** (Chapter V: Yuna out of frame and Rikku half cut for about a second);
  a plain Attack is 73 % longer in Chapter IV (860 to 1,500 ms) and about twice as long in Chapter V; the first-run hitch (gaps of 33 to 356 ms at the first Paine attack, base 30 to 55) needs a quiet machine and the deep review on the live build;
  not driven in a browser: an enemy spell's party HP-row timing, two girls out at once, the Options page.
- **The party's resting x steps by a few hundredths of a world unit at the mix's own re-plans** when real menus open (on origin/main too): it is not drift, and it is why Paine reads -0.744 here and -0.753 to -0.757 in the re-check. LOW EFFECTS plays today's attack (the run is off there).
- **For Bailey:** the run is 0.6 to 0.9 s longer per plain Attack (0.27 to 0.39 s of that is the run home): is that the rhythm he wants, or should the run home be quicker; and whether FFX's physical blows (Wakka, Tidus) get a travelling shot or a run of their own
  (no source, so his yes; FFX gets no run-in today).
- This pass adds one: **the combination of slots and a run is guarded only by `r38-merged-staging.test.ts`**, because no shipped fight has both (slots are FFX only, the run is FFX-2 only).

## For the driver (practical)

- **Servers and scratch:** I started one static server (port 7000, PID 2676) and stopped it by PID; the art-browser-load gate used its own port 7002 and closed it; ports 7000 to 7009 are free. Scratch is `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int2/`
  (633 MB, nearly all of it the build `dist/`; plus the harness, runs, logs and the Vite cache `vite-cache-full`). Parked to `F:/pyrefly-parked/2026-10-04/rel38-int2/`: the wrapper config `.rel38int2-vite-tmp.config.mjs`, the eight old fx maps, and a stray 1 KB file I wrote to the Git install folder by a path typo (`/tmp_changed_int2.txt`, moved off C:).
  Nothing was deleted. The worktree `D:/pyrefly-r29-text` is on branch `rel38-int2` (equal to main d82414b3 until this record's commit); its remaining untracked files are other agents' scratch.
- **Commit trailers:** merge commit 658393e2 (r38-restage) carries no `Co-Authored-By` line (my omission; amending is banned); every later commit of this pass does.
- **Layout facts.** Files this pass changed that are over 400 lines (house rule 7), all already over on main and disclosed by the motion lane: `BattlePresenterStage.ts` 891 (+30), `BattlePresenter.ts` 766 (+13), `BattlePresenterPorts.ts` 494 (+19),
  `BattlePresenterEvents.ts` 431 (+5). Near the line: `framing.ts` 398, `BattleCamera.ts` 394, `SpellFxLayer.ts` 392. New files are all under 400 (`StageMotion.ts` 281, `FlightFx.ts` 255, `staging.ts` 215).

---

# Release 38 integration, part 2b (branch rel38-int3, 2026-10-04)

Integrator pass, part 2b, built by a Sonnet sub-agent of the driver session in worktree `D:/pyrefly-r29-text`, from `origin/main` 31e811a2 (part 2a's tested tip d82414b3, its record 54e44c23 and the art install of 2026-10-04, [art-install-2026-10-04.md](art-install-2026-10-04.md)). Bailey's go-ahead for release 38 is quoted in part 1; D-360 (Evrae E1-H) is his "I'll go with all your recommendations" (2026-10-03 ~16:25 EDT, in chat). This part merges the three lanes that were left (**r38-keyart-fix**, **r38-evrae**, **r38-wings**), installs the Evrae E1-H paintings, runs the gates on the integrated tip **bc873bdf** (pushed: main `31e811a2..bc873bdf`, a fast-forward), and records D-360 as implemented. **Nothing here is deployed**: no deploy tool was run and the shared `dist/` was not touched. The production candidate is cut from the commit that holds this record, in the clean worktree `D:/pyrefly-rel38` (detached, `dist-gate` left in place); its gate numbers are in the integrator's report to the driver, because that worktree is made after this file is committed.

## What merged, in order (each a `--no-ff` merge, `npx tsc --noEmit` clean after each; the numbering continues part 2a's nine)

| # | Branch @ tip | Merge sha | Game case | What it is |
|---|---|---|---|---|
| 10 | r38-keyart-fix @ 322783cf | 1c8e6ec6 | both (shared page and build plumbing; no game content, no pixels) | `index.html`'s title preload names its art through `%BASE_URL%`, so a 2x master Vite did not see while it built is no longer asked for at the server root (a 404 under `/pyrefly-reprise/`); `tests/unit/art-url-base.test.ts` scans the source and a build for a root-absolute art URL ([r38-keyart-fix.md](r38-keyart-fix.md)) |
| 11 | r38-evrae @ 81ba618c | 49ac43d4 | FFX only, Chapter VIII (the stand-back and the phone mark are keyed to Evrae; Sin XVII and XVIII untouched) | D-360, E1-H: NEAR's spot pinned at the centre it resolved to plus 0.9743 world less the 0.1 rail trim, `nearDollyFor` stands the NEAR rigs back below 16:9, the phone's refit leaves Evrae out, and a window that changes shape after the bind is read again between beats (the re-check's M1) ([r38-evrae.md](r38-evrae.md)). It ships **only with its paintings**, installed below |
| 12 | r38-wings @ 5aeab14f | f7131d75 | FFX-2 only (Chapter IV's Bevelle Underground plate and Chapter XV's Den of Woe plate; Chapter XIII draws neither) | D-343: `paintPlateWings` swaps each mirrored plate wing for the painted strip in place, a missing strip keeps the mirrored wing ([r38-wings.md](r38-wings.md)). Included on the check below |
| - | integration commit bc873bdf | - | FFX only (the paintings are Chapter VIII's) | the approved-hashes lock of the six Evrae paintings (next section) |

No merge had a conflict (three `ort` merges); none touched `docs/handoff/NOW.md` (`git diff origin/main bc873bdf -- docs/handoff/NOW.md` is empty). r38-wings was merged on a side branch first (`rel38-int3-wings-try`, local only), tested there, and `rel38-int3` was fast-forwarded onto it, so the history is that of a direct merge; its tip 5aeab14f already carried main 31e811a2, so only its own three commits came in. Against 31e811a2 the range changes 57 files, none under `public/`, the largest blob 2.6 MB (the lane's first-turn clip, `docs/screenshots/r38-evrae/E1H-first-turn.webm`). Every commit of this pass carries the `Co-Authored-By` line.

## The Evrae E1-H paintings (D-360, FFX only, Chapter VIII)

Installed into the shared main tree's `public/art/characters/evrae/` from `D:/Tools/pyrefly-art-backup/candidates/2026-10-03-day/evrae-restage/install-ready/` (`manifest.json` lists every file; the package says the paintings ship only with the code lane, which merge 11 is). The installer is a dry-run-first script (`D:/Tools/pyrefly-scratch/2026-10-04/rel38-int3/harness/install-evrae.mjs`, modelled on the art install's `install.mjs`): it checked every package file's size and sha256 against the manifest, checked that all 12 targets held the manifest's old bytes, **backed the 12 originals up first** (never overwritten, sha256 read back) to `D:/Tools/pyrefly-art-backup/approved/2026-10-03-evrae-e1h/replaced/characters/evrae/`, and wrote each file as a **new file** (temp, then rename): the shared tree's PNGs have three hard links and the sidecars two (an old worktree, `D:/pyrefly-r21-road`, shares them), and an in-place copy would have changed that tree's paintings.

| File | Old bytes -> new bytes | Sidecar |
|---|---|---|
| `idle.png` | 803,854 -> 737,530 | 4,335 -> 6,583 |
| `idle-near.png` (a byte twin of `idle.png`) | 803,854 -> 737,530 | 4,299 -> 6,480 |
| `idle@2x.png` | 5,438,028 -> 4,479,489 | 1,653 -> 2,553 |
| `attack.png` | 831,490 -> 798,525 | 4,141 -> 5,807 |
| `hurt.png` | 798,624 -> 727,593 | 1,949 -> 3,111 |
| `breath-charge.png` | 819,666 -> 749,619 | 2,425 -> 3,496 |

Installed set 8,258,316 bytes against 9,514,318 replaced: **1,256,002 smaller** (the brief and the package README say 1,257,782: that is the figure before the repair of 2026-10-04 rewrote the sidecars `idle.json` and `idle-near.json`, +1,780 bytes; the manifest's own `totals.byteDelta` is -1,256,002). As shipped (the scratch builds, default `exact` derivation): the old set shipped as recompressed PNG at 9,006,033 bytes, the new one ships as it is (the recompression gains nothing on these) at 8,258,316, so **-747,717 bytes** on the 800,000,000-byte line.

Registry (`docs/target/approved-hashes.json`, commit bc873bdf, +91/-14 lines, CRLF and the one-space indent kept): a new set **`bailey:2026-10-03-evrae-e1h`** (words, decision D-360, a note, the six hashes), and each of the six old entries **moved to the new hash with `replacedBy` and a `supersedes` record** (old sha256, old mtime, the approval it had, the backup path), as the art install did for Grothia, Spathi and x2-Anima: `chapter:evrae:2026-09-23` idle, idle-near, hurt, breath-charge; `bailey:2026-10-01-art` idle@2x; `bailey:2026-10-02-art` attack. No Evrae file is in `judge-locked-hashes.json`. `idle-far`, `idle-far@2x` and `ko` are untouched; the package's optional `ko` and not-installed `cast` stay out. `verify-approved.mjs`: **759 ok (approved 711, judge-locked 48), 0 mismatched, 0 missing** (the art install's 753 plus the new set's six; run with `ROOT` the worktree before the push, at its default root in the shared tree after the fast-forward). `node tools/gen/manifest.mjs --check` (the shared tree): **unchanged** (101 subjects, 651 poses; the states are the same).

## r38-wings is in: the check the brief set

The condition: its own tests pass on the merge, and a headless check at 2000x1012 and 2560x1080 in Chapters IV and XV shows no plate edge, no void and no worse seam than the mirrored wings. **Both hold, so it is merged.**

- **Tests on the merge** (the side branch): `plate-wings` 14, `den-of-woe-ship-scene` 6, `den-of-woe-ship-content` 13, `den-of-woe-look` 4, `backdrop-palette-ground` 3, `art-url-sources` 4: all pass; `tsc` clean; then the whole suite on the final tip (below).
- **The check** (headless GPU Chromium, Playwright from node, never the built-in pane): two code-only production builds served over the same `public/art`, the tip without the wings (mirrored) and with them (painted); HUD off; **every rig of each scene** (Chapter IV `ffx2-bahamut` 9 rigs, Chapter XV `ffx2-den-of-woe` 10) at 2000x1012 and 2560x1080, so 38 rig-and-window cases per build. Scripts and frames: `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int3/harness/wings-check.mjs`, `wings-compare.mjs`, `runs/wings-check/`.
- **No plate edge, no void: the same in both builds.** The wings' outer edges lie outside the live camera's frame in 37 of 38 cases in each build. The 38th is the same case in both: Chapter XV's `victory` rig at 2560x1080, left outer edge at NDC -0.994 mirrored and -0.997 painted (a hair under 8 px); in the painted frame the leftmost columns are the wing's own dark navy and no band is visible. The painted strips' outer edges land within 0.01 world units of the mirrored ones (the lane's number), so no window the mirrored wings covered is uncovered.
- **Seam.** The peak column-to-column luminance step within 14 px of the plate's edge, 28 paired seams: mean **1.61 mirrored -> 1.13 painted**, worst **7.18 -> 3.05**; 27 of 28 are not higher. The one that is (Chapter IV, 2560x1080, `idle`, left edge: 1.52 -> 3.05) is a vertical join of the kind the mirrored build also shows beside its doubled lamp pair; its frame is in the list below. By eye, in the crops: the mirrored chevron and the doubled lamp pair at Bevelle's edges and the doubled orbs at the Den's are gone; a faint vertical join remains where the eye-candy slices end and the plate meets the wing (the lane's own disclosure: "as it was with the mirrored wings").
- 8 sessions (4 per build): **0 console errors, 0 non-2xx**; the four wing strips load 200 in the painted build and are not requested in the other.
- Not run (the lane's list, unchanged): phone sizes, and the pause and cutscene screens that draw the plate alone.
- Frames, `docs/screenshots/release-38/` (mirrored above, painted below): `wings-ch4-2560x1080-action-right-mirrored-above-painted-below.jpg`, `wings-ch4-2560x1080-idle-left-mirrored-above-painted-below.jpg` (the one higher seam) and `wings-ch15-2560x1080-party-left-mirrored-above-painted-below.jpg`.

## Gates (on the tested tip bc873bdf)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean after merges 10, 11 and 12 and at the tip (exit 0, empty output) |
| Full suite `npx vitest run --testTimeout=60000 --maxWorkers=4` | **798 files passed, 5 skipped (803); 11,754 tests passed, 46 skipped, 1 todo (11,801); 0 failed; 349 s** (log `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int3/logs/full-suite.log`), run with the Evrae paintings already installed. None of the known load timeouts fired. Against the art install's tree (795 files, 11,677 tests, 44 skipped): +3 files (`art-url-base`, `evrae-e1h-slot`, `evrae-resize`), +77 tests, +2 skipped |
| `node tools/orphans.mjs` | 1220 modules, 1196 reachable, **24 orphaned**: the same 24 (part 2a: 1218 / 1194); the two new modules (`evrae-airship-aspect.ts`, `evrae-airship-window.ts`) are reachable |
| `verify-approved.mjs`, `node tools/gen/manifest.mjs --check` | 759 ok, 0 mismatched, 0 missing; manifest unchanged (above) |
| `node tools/audio/qa.mjs --strict` | exit 0, 0 cues and 0 sfx with findings; 88.49 MB of the 90 MB budget (unchanged) |
| `node tools/critic-plan.mjs` | **review DEEP; before the deploy a FOCUSED review of the production candidate; after the deploy live verification, then the DEEP review on the live build (this build owes it); obligations live + focused + deep; not the save-data class** (no `SaveData.ts`, schema, migration or settings key). Against live 37.1 (f4244e1f): both games; chapters seymour-flux, yunalesca, braskas-final-aeon, ffx2-bahamut, ffx2-vegnagun-shuyin, ffx2-leblanc, seymour-anima-macalania, evrae-airship, yojimbo-cavern, seymour-natus, ffx2-fallen-aeons, seymour-omnis, ffx2-trema, isaaru-via-puri; checks CHK-002 003 004 and 006 to 023; targets cast, fight, pause, phone, presentation, scenes, "+ audit every changed data value against research/"; **81 shipped files, 308 with no product effect** |
| Scratch production build `npx vite build --config <wrapper> --outDir D:/Tools/pyrefly-scratch/2026-10-04/rel38-int3/dist --emptyOutDir` (a wrapper that changes only `cacheDir`; the default `exact` derivation; never `dist/`) | 15 s, 1,288 modules. `scope exact: 539 lossless WebP, 323 recompressed PNG, 143 unchanged; art 837.3 MB -> 689.2 MB (saves 148.0 MB)`; bundle `assets/index-DHaa2xD1.js` **3,730,602 bytes** (part 2a: 3,724,311; live 37.1: 3,679,258); CSS `index-De9sl9AK.css` 337,488 and both workers unchanged; **0 `.map` files**; `fx-assets verify --dir <build>/fx` PASS |
| `node tools/art-derive.mjs verify --dir <build>` | **PASS**: 1,005 masters (539 WebP, 466 PNG, 862 pixel-compared), 0 problems, 10 s |
| `node tools/art-derive.mjs audit --dir <build>` | **PASS**: 832 text files; 2 art names in pages and styles, each a shipped file; the bundle names 553 art files (14 shipped, 539 derived masters mapped at run time), **0 dangling**; 43 names built at run time |
| `PYREFLY_BROWSER=gpu node tools/art-browser-load.mjs --dir <build> --port 7043` (the full-set load gate) | **PASS** in 20 s: 1,005 art files (539 WebP, 323 recompressed PNG, 143 PNG as shipped) and 44 other images; **Chromium 153.0.8010.12: 1,049 of 1,049** and **WebKit 26.6: 1,049 of 1,049** loaded and decoded at their masters' sizes, 0 failed; portrait plates living **20 of 20 in both** |
| `PYREFLY_SCAN_DIST=<build> vitest run tests/unit/art-url-base.test.ts tests/unit/player-facing-title.test.ts` | 52 passed, 2 skipped (the "build named exists" cases, which run only when the folder is missing); the three build cases ran: every art URL starts with the build's own base, no copy of the old title in the pages, scripts, sheets and manifests, and the tab title and the title, pause and error screens say "Echoes of Spira" |
| Bytes and headroom, counted as the deploy counts them (`buildManifest` plus the manifest it writes plus `.nojekyll`; `harness/bytes-manifest.mjs`) | the build is 1,932 files, 797,683,098 bytes; with `artifact-manifest.json` (270,592 bytes) and `.nojekyll`: **1,934 files, 797,953,690 bytes; headroom 2,046,310** under the strict 800,000,000 (the art install: 798,697,104 and 1,302,896; this part is **743,414 bytes lighter**, Evrae's set -747,717 and the code +4,303). The decode check names only Paine's two flat catchlight layers, both listed in `critic/policy.json`: 0 problems after the filter. By type: `.png` 478 files 388,759,272 B, `.webp` 571 files 311,817,516 B, `.mp3` 28 files 88,494,023 B, `.js` 3 files 4,894,858 B, `.json` 828 files 3,073,158 B, `.css` 1 file 337,488 B, `.woff2` 15 files 275,100 B, `.txt` 6 files 26,844 B. Artifact hash of the scratch build `eca5b98a7062d26144f92c70ca484158778816d2abdc8262ae784b84cffe38dc`. Release 38 still ships on GitHub Pages |
| Headless smoke on that build (`PYREFLY_BROWSER=gpu`, ANGLE on the RTX; a static server on 7042 with an empty fallback root so a missing file would 404, stopped by PID; real keys from the title; the Evrae lane's own measurement code on the production bundle) | **Title** at 1600x900 and 390x844: tab title `Echoes of Spira`, description starts `Echoes of Spira`, the old name nowhere in the rendered text or meta; 0 console errors, 0 failed requests. **Chapter VIII (Evrae, FFX), first menu, seed 1:** at **1600x900** the E1-H figure is on screen (the 2272x1568 `@2x` master is the active plate; `idle`, `idle@2x`, `attack`, `hurt`, `breath-charge` all 200), snout x 788, the plan's rest gap 1, **nobody inside the coil** (the party's painted pixels under the coil's projected alpha: Tidus 75 px = 0.39 % of his, Wakka 0, Rikku 0; the boxes 1.0 %, 0 and 0.14 %), **the coil 68.8 and 81.8 px from the turn rail's left edge in two runs, 0 px inside the rail's rect, 0 under any drawn part of it (nearest row gap 44 px), 0 under HUD panels**; at **1440x900 (16:10)** snout x 764, gap 1, party 0 px (boxes 0.58 %, 0, 0.06 %), **the coil 25.4 px from the rail, 0 inside it, 0 under any drawn part (nearest row gap 8 px)**, 0 under panels. Both match the lane's repair table (snout 788 and 764; coil to rail 69 and 23 px). **Chapter I (FFX):** Tidus's Attack, target confirmed, Kimahri's menu opened. **Chapter IV (FFX-2):** Yuna's White Magic > Shell (the advisor card's pick), target confirmed, Paine's menu opened 2.4 s later with the card's Magic Break (Yuna the White Mage has no Attack row, so the turn is scripted for her menu). **0 console errors, 0 page errors, 0 failed requests** in every session. Frames: `docs/screenshots/release-38/ch8-evrae-first-menu-1600x900.jpg` and `-1440x900.jpg` |

## Main, the shared tree, the decisions

- **Pushed:** `git push origin rel38-int3:main`, `31e811a2..bc873bdf` (a fetch just before showed main had not moved).
- **The shared main tree:** `git -C "D:/Final Fantasy" merge --ff-only origin/main` fast-forwarded to bc873bdf. Its two dirty tracked files (`docs/handoff/NOW.md`, `research/jegged-encounter-guides-ffx-b.md`) are not touched by the range and were left as they were. In that tree `node tools/fx-assets.mjs verify` reads PASS (the fx map list is unchanged in this range) and `verify-approved.mjs` reads 759 ok, 0 mismatched, 0 missing.
- **Decisions:** `docs/target/decisions.json` D-360 `delivery` `in-progress` -> `implemented` (one line, one decision per line kept, same length; `critic-policy-adoptions` 12 of 12). "Implemented" is not "verified": the focused review of the candidate and the deep review on the live build settle it.

## Not in this candidate, and what the line leaves

- **Not merged by this part** (the driver's list from part 2a stands, none was in this brief): r38-lady-luck-grid, r37-ui-floor, r38-guide-jegged. The Lady Luck package is not installed; the headroom is now **2,046,310 bytes** (the install note said 1,302,896), so its idle alone (1,156,626 raw) would fit and idle + 7 keys (7,365,012 raw) would not (the line is GitHub Pages'; D-369 records the move to Cloudflare Pages, which has no total cap).
- The paintings still waiting from the art install (Kimahri's master to re-make from the installed idle, the masters over the line, the held telegraph keys) are as that note lists them.

## Disclosures (carry into the focused review; majors are not regressions unless marked)

### r38-evrae (re-check PASS, M1 closed; the lane's own list stands, read it in [r38-evrae.md](r38-evrae.md))
- **The party is smaller than live's below 16:9, in Chapter VIII only** (0.82 to 0.83 of live's at 16:10, 0.61 at 4:3 and 5:4; 16:9 and wider as before): the camera is the lever that clears the rail without putting the party inside the coil. D-360 says "party, camera and Evrae's scale unchanged", which holds at 16:9 and wider only. Bailey's call: keep the camera lever, a smaller Evrae below 16:9, or both.
- The figure stands 0.1 world left of where the mockups had it (10 px at 1600x900); the phone shows less of Evrae than live (43 to 44 % of the painted figure outside the 390 px slice at 390x844, live 7.1 %); 5:4 and narrower windows are not cleared (the stand-back caps at 1.45); the mix's own menu-2 lens shift takes the coil within 4 px of the rail at 1600x900 and 1920x1080; the repo's rest gap at menu 3 reads below 1 at every desktop size (the acting member's reserved footprint against the figure's hidden strip below the deck line, in the art).
- The close rigs (`action`, `enemy`) keep the old stand-back after a resize (shared mix code, `RigWatch.baseChanged`: ask before touching); a resize while an action plays can leave 66 to 73 px of coil in the rail's rect for one menu; an open menu keeps its camera frame until the player acts.
- This pass adds two readings the lane did not record: the **16:10 first menu's nearest drawn rail part is 8 px from the coil** in my run (the lane read 12 to 16 px; another seed and sway, still no overlap), and the production bundle shows the `@2x` master as the active plate at 1600x900 in a 1x window (so the 2272x1568 canvas, not 1136x784, is what a measurement reads there).

### r38-wings (D-343)
- The faint join where the eye-candy slices end and the plate meets the wing, at some rigs, as it was with the mirrored wings (the lane's disclosure; measured here: 28 paired seams, one higher). The Chapter XV `victory` rig at 2560x1080 leaves the wing's outer edge a hair inside the frame in both builds (-0.997 painted). The four strips are local art (`public/art` is not in git): with them missing every wing stays mirrored (tested).
- Phone sizes and the screens that draw the plate alone were not run (the lane's list).

### r38-keyart-fix
- The deploy's audit strips a name's leading slash, so a page naming `/art/title/keyart.2x.webp` passes it whenever the file is in the build, whatever the base; the **build scan covers it** (`PYREFLY_SCAN_DIST=<candidate>`), and it ran here on the scratch build (three build cases, above). The release flow could run it on every candidate.

## For Bailey (gathered from the lanes)

- **Chapter VIII:** look at `docs/screenshots/release-38/ch8-evrae-first-menu-1600x900.jpg` and `-1440x900.jpg`: Evrae's coil is clear of the party and the turn rail; the neck arch is the lengthened E1-H one. The price is yours to weigh: the party is smaller than live's below 16:9, the figure stands 0.1 world left of the mockups, the phone shows less of Evrae.
- **Painted wings (Chapters IV and XV):** the three wings crops in the same folder (mirrored above, painted below): the doubled lamps and orbs are gone, a faint join remains.

## For the driver (practical)

- **Servers and scratch:** I started static servers on 7040, 7041 and 7042 (PIDs 41180, 62604, 83920) and stopped all three by PID; the art load gate opened and closed its own on 7043. Ports 7040 to 7049 are free. Scratch is `D:/Tools/pyrefly-scratch/2026-10-04/rel38-int3/` (the scratch build `dist` about 690 MB, the two code-only builds, `harness`, `runs`, `logs`, the Vite caches). I left nothing untracked in the repo and deleted nothing; the local side branch `rel38-int3-wings-try` equals merge f7131d75 and can go with the others.
- **Hard links:** the six new Evrae paintings are fresh files (link count 1); the old bytes live on in `D:/pyrefly-r21-road` and in the backup folder above.
- **The cut** is made from the commit that holds this record (`git worktree add --detach D:/pyrefly-rel38 <sha>`, sparse without `docs/screenshots`, junctions for `node_modules` and `public/art` into the shared tree, `node tools/fx-assets.mjs restore` then `verify`); both junctions must be `cmd /c rmdir`'d (no `/s`) before that worktree is ever removed, and never `git worktree remove` first.

## Layout facts

Files this part changed that are over 400 lines (house rule 7), both already over on main: `bevelle-underground.ts` 2,289 (+13) and `Backdrop.ts` 506 (+5). At the line: `evrae-airship-director.ts` 397 and `evrae-airship-deck.ts` 397 (three lines of headroom each). New files: `evrae-airship-aspect.ts` 94, `evrae-airship-window.ts` 74, `plateWings.ts` 164 (grew by 81), all under 400.
