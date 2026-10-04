# r38-evrae: Evrae re-staged to E1-H (D-360), Chapter VIII, FFX only

Lane of release 38, built 2026-10-03 by a Sonnet sub-agent of the driver from `origin/main` 4b7adea6 on branch **`r38-evrae`** (worktree `D:/pyrefly-fb-camera`).
**Pushed, not merged, not deployed. Nothing was written under `public/art` or `docs/target/approved-hashes.json`.** Paper preflight: [../plans/r38-evrae-review.md](../plans/r38-evrae-review.md).
**Repaired 2026-10-04** after the independent check failed it on the turn rail (16:10, 4:3) and the phone camera: see **Repair** at the end of this file. The sections up to "Check" are the builder's and the checker's record and keep their numbers; where a number there has changed, Repair says so (the pin is now 3.8923, the stand-back and the phone flag are new).

## Game case (rule 14): FFX only
Evrae is Chapter VIII's boss (`evrae-airship`); the airship range mechanic has no X-2 counterpart (`research/ffx-evrae-airship.md` §0.4); D-360. Chapters XVII and XVIII
(Sin, FFX) share the deck scene and its slot object and **do not move** (Chapter XVII measured live vs branch: same gap, the Fin on the same FAR spot, boxes within the camera's sway). FFX-2: nothing.

## What it is
Bailey adopted E1-H ("I'll go with all your recommendations"): Evrae's approved idle is repainted with the neck arch lengthened about 165 px so the head stays and the coil
stands right of the party; party, camera and Evrae's scale unchanged at 16:9 and wider (below 16:9 NEAR's camera stands back, see Repair); the tail loop is dropped. This lane (1) assembles the E1-H idle set, (2) re-derives every other installed
Evrae key to that geometry as an **install-ready package**, (3) moves Evrae's slot and pins it, and (4) proves it in the running build.

## The package
`D:/Tools/pyrefly-art-backup/candidates/2026-10-03-day/evrae-restage/install-ready/` (`manifest.json`: target paths, bytes, sha256, the approved file each replaces and its old hash, the lock sets, the backup list).
It is **1,257,782 bytes smaller** than what it replaces (8,256,536 vs 9,514,318 including sidecars): no cost against the 800 MB line.

| File (target `public/art/characters/evrae/`) | Canvas | Bytes (was) | What it is | Replaces (lock set) |
|---|---|---|---|---|
| `idle.png`, `idle-near.png` (byte twins) | 1136x784 | 737,530 (803,854) | the E1-H idle: the approved pixels moved (cut at x 448, 165 px pipe, 200 px cropped at the left, tail loop dropped, its two cut ends tapered, the hidden strip below the deck line kept for the rest-roll); the pipe repainted by the mockup's masked SDXL inpaint cand-2 | `chapter:evrae:2026-09-23` |
| `idle@2x.png` | 2272x1568 | 4,479,489 (5,438,028) | the same operations on the 2x master; its pipe is the same repaint; the 1x is its Lanczos | `bailey:2026-10-01-art` |
| `attack.png` | 1264x784 | 798,525 (831,490) | the approved attack (D-325) on the E1-H transform: aligned on the idle canvas by its registration (2, 14), loop dropped, pipe inserted at the cut; 64 px of canvas margin on both sides (its head reaches 26 px left of the idle's crop); the pipe is a **new masked SDXL repaint** (below) | `bailey:2026-10-02-art` |
| `hurt.png` | 1136x874 | 727,593 (798,624) | **the approved derive re-run on the E1-H idle**: the same call (reproduced to 0 differing pixels on the approved idle first) with every x shifted by the 200 px crop; head and first 230 columns of the neck match the approved hurt to within 5 of 14,399 painted pixels; the lengthened neck takes the bend | `chapter:evrae:2026-09-23` |
| `breath-charge.png` | 1136x784 | 749,619 (819,666) | `breath_inplace.py` re-run on the E1-H idle (A=66, CX=240, X0=182, X1=328; again reproduced to 0 differing pixels first): the throat sac hangs from the same place under the head | `chapter:evrae:2026-09-23` |
| the six `.json` sidecars | | | width/height/baseline as measured, the decision, the method, what each replaces | with their image |

Not in the install list: **`optional/ko.png`** (`ko` is never drawn: `BattlePresenterDepartures.departurePoses` points Evrae's ko at `hurt`, the defeat is the fall D-031; registered anyway with a 63 px left pad
so the heap keeps its approved offset from the body, in case it is ever wired) and **`not-installed/cast.png`** (no cast key is installed; Decision 1 was never answered; the cycle-2 cast re-derived with the same recipe, 1216x784).
`idle-far` (FAR's streak) is untouched. No `@2x` exists for attack/hurt/breath-charge today, so none is made. Read in the running build (the actor's pose map): `ko` resolves to the **hurt** painting (so the defeat shows the E1-H hurt) and `cast` to the **attack** painting (so the attack key is what plays whenever Evrae acts, any ability).

**Keys that did not re-derive cleanly, and why (the list the brief asked for):**
1. `ko`: not applicable (a heap has no raised arch and no tail loop) and never drawn; optional re-registration only.
2. `cast`: not installed; derived as a candidate only.
3. `attack`: the pipe is generated, not derived (the approved attack is itself a generated painting, method W); the scale pattern is slightly larger than its neighbours' small diamonds, the top rim is a straight line where the neighbours carry spines, and the belly band is plain tan there (the approved attack's own belly plates fade out right at the cut, so it reads as native).
Everything else re-derived by pixel operations from the approved or E1-H pixels; the only invented pixels in the package are the two 165 px pipes (idle: mockup cand-2, seed 910002, denoise 0.7; attack: below).

### The attack's pipe (the one new generated part)
Animagine XL 4.0 Opt, euler_ancestral, 28 steps, cfg 6, masked inpaint (VAEEncode + SetLatentNoiseMask) on a 4x crop of the attack's own neck, IP-Adapter Plus on the attack's own neck (our own pixels only), no ControlNet,
`tools/heal_job.mjs`. 24 renders on the shared GPU (232.8 GPU seconds, one prompt of ours pending at a time, the VRAM check before every submit, no all-black frame, ComfyUI never restarted): seeds 920001 to 920012
(IP 0.62, the idle's prompt, denoise 0.72/0.8/0.7) then 920013 to 920024 (IP 0.85, a small-scale prompt, the reference at 4x, denoise 0.66/0.72/0.78; `cand-13` ran with the character tag unescaped, a harmless prompt-weight slip, kept as a candidate).
The pick is **cand-23 (seed 920023, denoise 0.66)**. First composites pasted back with the repaint's own tone looked like dark rectangles; **frequency separation** fixed that (the init's tone, sigma 24, under the repaint's scale texture at 0.9: `heal_compose3.py`).
All 24 raws, their prov.json and the contact sheets are in `proof/attack-neck-repaint/` and `proof/sheets/`.

## The code (two files, data only; the repair adds a module, the director and one engine line: see Repair)
- `src/scenes/evrae-airship-range.ts`: `EVRAE_NEAR_SPOT_BEFORE_E1H` [2.3, -0.9, -4.7] (the data spot, kept for the shared slot table), `EVRAE_NEAR_CENTRE_X_BEFORE_E1H` 3.018, `EVRAE_E1H_SLOT_DX` 0.9743
  (= ((200 + 165) / 2) x (4.1 / 768)), `EVRAE_NEAR_SPOT` = 3.9923, -0.9, -4.7 = `RANGE_STAGING.near.evrae`.
- `src/scenes/evrae-airship-deck.ts`: `enemySpots: { evrae, cid }` = that spot (the pin); the generic enemy slot table is untouched (Chapters XVII and XVIII share it).
- No new settings key, no new switch, no type or contract change (`docs/CONTRACTS.md` lists neither file).

**The finding the mockup round missed.** It said "+0.97 on today's resolved spot (3.02)" but on this base the data spot is 2.3: the live plane centre is 3.018 at all four sizes because Evrae's wide idle counts as a
prone painting by its shape and `ProneLay` slides its plane 0.718 right along the floor, and a **pinned** figure is never slid. So the pin must be 3.018 + 0.9743 = **3.9923**; a pin of 2.3 + 0.9743 (the obvious data tweak) was measured: the head lands 0.68 world left of today's and the rest gap stays at -281.

## Measured (headless GPU Chromium, real keys title -> board -> prep -> scene -> first menu, seed 1; live = the same worktree serving the two scene files as on origin/main; branch = the E1-H package over `public/art` by a dev-only overlay)
| Size | Rest gap live -> branch | Tidus / Rikku box covered live -> branch | Head dx (branch - live) | Coil right edge to the turn rail, live -> branch | Visible figure under a HUD panel |
|---|---|---|---|---|---|
| 1600x900 | -282.8 -> **1** | 26.6 % / 55.7 % -> 1.0 % / 0 % | +5.7 px | 130 -> 47 px | 0 % -> 0 % |
| 2000x1012 | -330.5 -> **1** | 26.3 % / 56.0 % -> 1.0 % / 0 % | +6.5 px | 127 -> 51 px | 0 % -> 0 % |
| 2560x1440 | -454.2 -> **1** | 26.6 % / 56.0 % -> 1.0 % / 0 % | +9.5 px | 206 -> 76 px | 0 % -> 0 % |
| 2560x1080 | -353.3 -> **1** | 25.8 % / 56.4 % -> 0.9 % / 0 % | +7.0 px | 136 -> 34 px | 0 % -> 0 % |
| 390x844 (phone) | -135.5 -> **1** | | | the party whole, head and neck on screen, the right coil cut by the frame as before | |

- Rest gap 1 is the repo's hairline (the boxes meet but at most 2 of the 48 sample cells touch painted pixels); the mix's own plan reading agrees (1) at every size. "Nobody inside the coil" holds.
- **The head stays**: within 0.02 world (about 2 px) of today's by the planes' own numbers (the plane's mesh x and the mix's feet x differ by the roll term, 0.016 to 0.021 world, and give the offset opposite signs); the 6 to 9 px on screen include the camera's own sway between two separate runs (the party's boxes differ by up to 5 px the same way).
- **Framing unchanged**: class `colossus`, `colossusFight`, plans 1, replans 1 and the lens shift (0,-36 / 0,0 / 0,-58 / 0,0) are the same live and branch at every size.
- **No plate edge or void**: the plate and the camera are untouched; the stills show none. Phone: the right half of the coil leaves the 390 px slice as the live loop did.
- **Every key at battle scale on the real frame**: `docs/screenshots/r38-evrae/keys-installed-vs-rederived-battle-scale.jpg` (idle, attack, hurt, breath-charge, installed | re-derived). Plane centres (local x) are 0.0009, 0.0013, -0.0006 and 0.0011 world: every key registered to the idle (the installed set carried the 0.70 prone slide).
- **The scene's other rigs** (party, action, the boss's own shot, HUD off): `docs/screenshots/r38-evrae/rigs-live-vs-branch.jpg`. The head is in place in each; in the boss's own shot the old tail loop no longer crosses Rikku and Wakka; the coil's outer curve reaches the right edge of the party rig's frame without leaving it.
- **FAR swap**: with the engine's `airship.range` flipped (as Cid's order sets it) Evrae goes to the FAR spot (6.4, 3.3, -30) at scale 0.7645 and back to the pin (3.9923, -0.9, -4.7), live and branch alike; the FAR frames match.
- **First turn**: `docs/screenshots/r38-evrae/E1H-first-turn.webm` (real keys: Tidus ATTACK, Rikku ATTACK, Evrae's reply; 2.6 MB VP9).
- **Sin, Chapter XVII**: live vs branch at 1600x900: gap 1 both, the Fin at (6.99, -1.59, -30) both.
- Files: `docs/screenshots/r38-evrae/` (the four live | branch composites, the phone pair, the key sheet, two painting sheets, the clip); everything else (full frames, json, raws, tools) in `install-ready/proof/` beside the package; every number in `proof/numbers.json`.

## What the installer must do (release 38 art install)
1. Back up the 12 replaced originals (6 images, 6 sidecars; the list is `manifest.json` `backup.files`) to `D:/Tools/pyrefly-art-backup/approved/2026-10-03-evrae-e1h/replaced/characters/evrae/`. Never delete.
2. Copy `install-ready/art/characters/evrae/*` over `public/art/characters/evrae/` in one step. `ko.png`, `idle-far*` stay as they are (the optional ko only if wired).
3. `docs/target/approved-hashes.json`: the six entries in `manifest.json` `lock` get their new sha256 (old ones are listed for the `supersedes` record); then `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` and `node tools/fx-assets.mjs verify`.
4. `node tools/gen/manifest.mjs`: the states are unchanged (it must report no change).
5. **Merge `r38-evrae` in the same release.** The slot value assumes the E1-H canvas: this branch alone with the old art puts the old idle 0.97 right of its head; the old art with `main` alone is today's build. `tests/unit/chapters/evrae-e1h-slot.test.ts` checks the installed canvas against the numbers once the art is E1-H (it skips on the older art because `public/art` is gitignored).
6. Look at Chapter VIII's first menu once (a real-key frame) before the focused review.

## Checks run
`npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24 orphans, the same 24 as main. Targeted vitest (`evrae-e1h-slot` new; `evrae-deck-hold-party`, `evrae-scene`, `sin-listed`, `sin-phone-staging`, `evrae-telegraph`): green. **Full suite once at the end** (`vitest run --maxWorkers=3`, 773 s): 768 files passed, 5 skipped, **1 failed**; 11,282 tests passed, 41 skipped, 1 todo, **1 failed**: `tests/unit/strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare", a 15 s timeout on this machine (18.4 s alone here, 15.4 s on the untouched main tree at the same HEAD; its wins, 1 of 30, meet its bar). It imports only FFX-2 battle data and tactics, nothing near Evrae: pre-existing, not this change. Log summary: `install-ready/proof/logs/vitest-full-summary.txt`.
`node tools/critic-plan.mjs --paths src/scenes/evrae-airship-range.ts,src/scenes/evrae-airship-deck.ts,...`: change depth **focused** (2 shipped files, the rest no product effect; systems "effects, lighting and sprites"; checks CHK-008 CHK-013 CHK-016 CHK-017 CHK-020 CHK-021); the build-level `review: DEEP` (36 substantial checkpoints since the last deep review) is the build's, not this change's.

## Tests changed, and why
- `evrae-deck-hold-party.test.ts`: it asserted "no `enemySpots`" (R13-03's reasoning: the director re-plants Evrae). It now asserts the pin names `evrae` and `cid`.
- `evrae-scene.test.ts`: `NEAR_W` is the E1-H canvas (1136, not 1171); the turn rail is the measured one (0.878 of the width at 1600x900; the old 0.79 planning rail no longer bounds the coil, which ends 47 px before the real rail); the head check uses the true snout offset instead of the plane centre.
- `evrae-e1h-slot.test.ts` (new, 9 tests + 1 conditional): the formula, the spot's composition, the pin and its ids against the real formation, the shared slot table untouched, the formation solver and the relax step leaving a pinned Evrae and Cid alone (and moving them when unpinned), the director on the pin / FAR / the pin, and the installed canvas once it is E1-H.

## Flaws and what is open
- The neck is about a third longer than the approved arch; its pipe is generated (idle and attack), its top rim is a straight line where the neighbours carry spines; the tail loop is gone in every key (E1-HC would keep it; not chosen).
- The attack's pipe: bigger scales than its neighbours and a plain belly band (above).
- The breath-charge glow colour is still unsourced (research 12.2 names none); the sac now hangs over a level neck.
- Hurt: the neck sags in a soft S between the descent and the thrown-back head: the head is exactly the approved one, the neck is not.
- Tight clearances: the coil's right edge was 34 px from the turn rail at 2560x1080 (47 at 1600x900); the check found it under the rail at 16:10 and 4:3. Repair has the distance at every window, menu and seed.
- A small dark fragment sits at the bottom-left of every key (the kept strip); it is far under the deck line and never visible at NEAR (none in any frame).
- Not checked: a real defeat on the new hurt (Evrae's ko points at hurt), the advisor card next to the longer figure beyond the frames above, the phone at other sizes, FAR's own painting.
- Reproduce: `proof/tools/` (the scratch tooling); the dev-only overlay is `tools/zz-r38-evrae.tmp.vite.config.mjs` + `zz-r38-evrae.tmp.overlay-plugin.mjs` in the worktree (agent scratch, untracked, copied into `proof/tools/`; the plugin is the preview-picks branch's).

## Check (critic pass, 2026-10-04)

Checked by a Sonnet sub-agent of the driver that did not build this lane. Branch head `3b709a4f` (clean tree; it merges into the current `origin/main` `a6b79313` with no conflict, `git merge-tree`). Evidence and every script: `D:/Tools/pyrefly-scratch/2026-10-03/r38-evrae-check/` (`out/` frames, masks and json per capture; `summary-L.txt`, `summary-X.txt`, `summary-M.txt`, `summary-N.txt`; `table-L.md`, `table-X.md`; `*.mjs`). Nothing was written under `public/art` or `docs/target/approved-hashes.json`; no merge, no deploy; every server I started was stopped by its PID.

**Verdict: FAIL.** Two blockers, both about what the longer figure does to the framing: **B1** the coil runs under the turn rail at the first menu on every 16:10 size and on 4:3; **B2** on the phone the framing pulls the camera back and the party shrinks. Items 2, 3, 4, 5 (modulo the full suite below) and 6 hold; item 1 holds at 16:9 and 21:9 and fails below 1.7:1.

### How it was measured
- Headless GPU Chromium (`PYREFLY_BROWSER=gpu`), Playwright from node, **real keys** title -> board -> prep -> scene -> first menu, `setSeed(n)` before the first key (the only hook), then ATTACK twice for menus 2 and 3 (Tidus, Rikku, Wakka); seeds 1, 2, 3 (the first three menus were the same for all three seeds, the numbers within the noise noted below); one browser at a time; about 100 sessions.
- **live** = the real https://baileypillon.github.io/pyrefly-reprise/ (release 37.1, bundle `index-DhiL5vEz`). **branch** = that same live page with its game bundle answered by a production build of `r38-evrae` (`3b709a4f`) and Evrae's twelve files answered by the package (a scratch copy, 12 of 12 sha256 equal to the manifest); plate, party art, fonts and audio come from the live origin. Control: the *main* bundle answered the same way (`--swap=main`) reproduces the real live frame to the pixel (Evrae box 533,279,1155,696; plan gap -315), so live and branch are compared on one origin by one technique. **origin/main (local)** = a production build of the branch base with the two Evrae scene files from `origin/main`, served from localhost (this is what the builder called "live"). Dev servers with HMR and the watcher off were used for cross-checks.
- Measured per menu with the camera sway and the actors' breathing frozen: the repo's own `plate.restGap` from the mix report; every actor's painted alpha projected through its plane and the camera (HUD panels by `hudPanels()`'s own rule, the rail is `.ig-ctb`); and the figure's **visible** pixels (screenshots with the HUD hidden, with and without the actor, differenced inside the projected alpha), because the deck's geometry hides the lower coil and a mask alone over-counts.

### Blockers
**B1. The coil is under the turn rail at the first menu on every 16:10 size and on 4:3.** At menu 1: 1280x800 51 px past the rail's left edge (1,278 visible coil px inside the rail rect), 1440x900 59 px (1,621 px), 1680x1050 53 px (2,158 px), 1024x768 112 px (4,388 px); the visible figure under HUD panels is 8.1 to 8.4 % at 16:10 (live 5.1 to 5.3 %, origin/main 0.0 %) and 24.1 % at 4:3 (live 11.6 %). At 1440x900 the coil's outer loop passes behind the "Wakka / Cid / Tidus" tags (`out/L-branch-1440x900-s1/m1.jpg`). Menus 2 and 3 still touch the rail at 16:10 (1 to 9 px, up to 237 px of coil). The cause is geometry, not the mix: the scene test's own planning maths, run at 16:10, puts the plane box's right edge at 0.903 of the width against the measured rail at 0.878 (it passes at 16:9, 0.863, which is the only aspect that test checks); the figure needs about 1.7:1 or wider. Every 16:9 and 21:9 size (1280x720, 1366x768, 1600x900, 1920x1080, 2000x1012, 2560x1080, 2560x1440) clears the rail at menu 1 by 46 to 95 px. D-360 and the builder's evidence were validated at 16:9 and 21:9 only. Needs an aspect-aware answer (a smaller slot move or a shorter pipe at narrow aspects) or Bailey's decision.
**B2. On the phone (390x844) the framing pulls the camera back and the party shrinks.** The mix plans a camera at z 14.78 for the longer figure (deterministic: the dev server and the live origin, seeds 1 to 3) against 12.91 for origin/main built locally and 9.40 for the real live. Tidus is 97 px tall, against 112 (origin/main) and 161 (live): 13 % and 40 % smaller; Wakka 88 against 98 and 129, Rikku 87 against 98 and 127. The figure now fits the 390 px slice whole (0 % outside it; live cuts 7.7 % of it off), so the handoff's "the right coil cut by the frame as before" is not what the branch does. D-360 says party and camera unchanged. For Bailey: take the smaller phone party, or exclude the coil from the phone fit.

### Disclosures (none of these blocks by itself)
1. **"Live" in the builder's evidence is origin/main built locally, not the live site.** Against that reference the handoff's rest-gap and head numbers reproduce: rest gap -284 / -330 / -454 / -353 / -135 (phone) to 1, and the head stays within +1.8, +2.2, +2.9, +2.3, +2.0 and +1.0 px at six sizes (menu 1). The **real** live puts Evrae elsewhere: `ProneLay` picks its slide (a +0.70 or a -0.70 step) by timing: localhost gives +0.702, the live origin gives -0.704 with the same bundle, so against the real live the snout is +149 / +167 / +238 / +178 / +201 px to the right (1600x900 / 2000x1012 / 2560x1440 / 2560x1080 / 1440x900; phone +44) and the live's own framing differs (at 1600x900: party spread +0.35, camera 9.40, plan `ok`) where the branch's is the fallback (`fit.ok` false, camera 9.90, party on its slots: the party 4 to 5 % smaller at 1600x900, 2000x1012 and 2560x1440). The pin makes the branch the same in every environment I ran (dev server, local production build, live origin: `mesh x` 0.0009, figure box 788,285,1358,683 at 1600x900 menu 1); the E1-H mockups were drawn on the origin/main reading, which is what the branch reproduces.
2. **Menu 2 moves the whole composition.** At 16:9 and 21:9 the mix's lens goes (0,36) -> (-64,0) -> (0,36) between menus 1, 2, 3 (1600x900; -80 / -102 / -51 / -55 / -77 at 2000x1012 / 2560x1440 / 1280x720 / 1366x768 / 1920x1080): the coil's tip ends 4 to 14 px inside the rail rect at menu 2 (5 px of coil at 1600x900, 103 px at 2000x1012, 9 at 2560x1440). 2560x1080 does not shift.
3. **The repo's rest gap is below 1 at menu 3 on three sizes** (2000x1012 -292, 2560x1080 -311, 2560x1440 -415; live -341 / -363 / -485): Tidus is down by then and the metric counts his lying box against the hidden lower coil. Painted overlap there is 0.9 to 1.4 % (table). First menus: 1 at every size, 1600x900 to 2560x1440 and the phone.
4. **The package.** Stale fields in `idle.json` and `idle-near.json` (`cropBox` 22,25,1193,809 and `canvas` are the old canvas; the engine reads only width, height, baselineY, scale, anchorY, facing). The kept strip is 66 visible px at 1600x900 menu 1 (dark on the dark deck, not noticeable). At 8x on the PNG: a 1 px pale line along the idle pipe's lower edge and stray speckles near its left seam (about x 222 to 260, y 132 to 134); the breath-charge sac's lower edge has dark specks (about x 245 to 285) and the same pale line (rim 1,038 px against the approved 804), 1 to 3 px in game; the attack's generated pipe has no belly plates and no top spines (builder disclosed it), visible at 2560 px wide. None is visible at 1:1 at 1600x900.
5. The skipped test (`evrae-e1h-slot`, "with the E1-H art installed") was replicated against the package by script: idle 1136x784 baseline 768, idle-near twin byte-identical, idle@2x 2272x1568, attack 1264x784, hurt 1136x874 baseline 858, breath-charge 1136x784: every assertion holds.
6. Chapter XVIII's camera at the first menu (FAR rig, NEAR rig or between) and Chapter XVII link 3's Genais and Core x positions vary from run to run on **both** codes (controls below), so they cannot show a difference either way.
7. Two sessions flaked in my harness ("board not reached", a title Enter lost) and were re-run clean; 0 console errors and 0 failed requests in every session.

### Item by item
**1. Rest gap and painted overlap, three menus, seeds 1 to 3: FAIL (B1), passes at 16:9 and 21:9.** Live -> branch, menus 1/2/3 (branch value is the worst of three seeds; the visible-pixel and rail columns as defined above):

| Size | Rest gap, repo plan | Painted overlap, worst member, % | Visible figure under HUD panels, % | Coil px inside the rail rect (coil to rail px) | Snout dx vs live, px |
| --- | --- | --- | --- | --- | --- |
| 1600x900 | -315/-315/-302 -> 1/1/1 | 32.8/28.1/25.7 -> 0.0/0.4/1.3 | 0.9/0.8/0.0 -> 0.0/0.3/0.0 | 0 (263)/0 (262)/0 (266) -> 0 (60)/5 (-5)/0 (52) | +149 |
| 2000x1012 | -343/-309/-341 -> 1/1/-292 | 39.5/28.7/35.6 -> 0.0/0.6/1.1 | 1.0/0.8/0.0 -> 1.5/0.3/0.0 | 0 (312)/0 (294)/0 (300) -> 0 (46)/103 (-14)/0 (38) | +167 |
| 2560x1440 | -502/-502/-485 -> 1/1/-415 | 38.1/33.0/38.0 -> 0.0/0.5/0.9 | 0.9/0.9/0.0 -> 0.0/0.4/0.0 | 0 (420)/0 (418)/0 (426) -> 0 (95)/9 (-9)/0 (54) | +238 |
| 2560x1080 | -368/-330/-363 -> 1/1/-311 | 38.7/30.0/26.6 -> 0.0/0.6/1.4 | 1.1/0.9/0.0 -> 1.7/0.0/0.0 | 0 (333)/0 (313)/0 (320) -> 0 (49)/0 (47)/0 (40) | +178 |
| 1440x900 | -303/-275/-314 -> 1/1/1 | 37.2/35.4/34.4 -> 0.0/0.5/1.3 | 5.1/7.2/2.3 -> 8.1/0.1/0.3 | 0 (213)/0 (259)/0 (254) -> 1621 (-59)/37 (-2)/172 (-7) | +201 |
| 390x844 | -171/-171/-171 -> 1/1/1 | 28.4/37.0/30.3 -> 0.0/0.4/1.6 | 0.0/0.0/0.0 -> 0.0/0.0/0.0 | 0 (-379)/0 (-379)/0 (-379) -> 0 (-365)/0 (-365)/0 (-357) | +44 |

Sizes outside the brief's list, same method (menu 1/2/3):

| Size | Rest gap, repo plan | Painted overlap, worst member, % | Visible figure under HUD panels, % | Coil px inside the rail rect (coil to rail px) | Snout dx vs live, px |
| --- | --- | --- | --- | --- | --- |
| 1280x720 | -251/-251/-242 -> 1/1/1 | 29.7/24.8/25.1 -> 0.0/0.3/0.0 | 0.8/0.8/0.0 -> 0.0/0.3/0.0 | 0 (211)/0 (210)/0 (214) -> 0 (48)/3 (-4)/0 (42) | +119 |
| 1366x768 | -269/-269/-259 -> 1/1/1 | 23.5/26.9/28.6 -> 0.0/0.1/0.0 | 0.8/0.8/0.0 -> 0.0/0.4/0.0 | 0 (236)/0 (223)/0 (228) -> 0 (51)/3 (-5)/0 (45) | +127 |
| 1920x1080 | -376/-376/-364 -> 1/1/1 | 28.8/26.0/33.0 -> 0.0/0.6/0.0 | 0.9/0.9/0.0 -> 0.0/0.3/0.0 | 0 (315)/0 (313)/0 (320) -> 0 (72)/7 (-7)/0 (63) | +178 |
| 1280x800 | -269/-236/-269 -> 1/1/1 | 21.5/31.5/23.9 -> 0.0/0.1/0.0 | 5.3/6.9/2.0 -> 8.4/0.1/0.3 | 0 (190)/0 (240)/0 (235) -> 1278 (-51)/43 (-1)/152 (-6) | +178 |
| 1680x1050 | -353/-310/-353 -> 1/1/1 | 29.2/24.1/26.9 -> 0.0/0.3/0.0 | 5.3/7.0/2.0 -> 8.1/0.1/0.3 | 0 (249)/0 (315)/0 (308) -> 2158 (-53)/73 (-2)/237 (-9) | +234 |
| 1024x768 | -258/-228/-249 -> 1/1/1 | 24.8/19.4/20.4 -> 0.0/0.2/0.0 | 11.6/8.4/4.3 -> 24.1/7.7/8.4 | 0 (64)/0 (145)/0 (191) -> 4388 (-112)/2470 (-52)/2716 (-57) | +122 |

- Painted overlap (the share of a party member's painted pixels the figure's visible pixels coincide with): live 19 to 40 % at every size and menu, branch 0.0 to 1.6 %: the rest-gap goal is met everywhere. Builder's menu 1 numbers reproduce at 1600x900 against origin/main (local): Tidus box 28.0 % and Rikku 56.3 % -> 1.0 % and 0.0 % (builder 26.6 / 55.7 -> 1.0 / 0).
- Origin/main (local), menu 1, in the order 1440x900, 1600x900, 2000x1012, 2560x1080, 2560x1440, phone: plan gap -294 / -284 / -330 / -353 / -454 / -135; coil to rail +22 / +157 / +158 / +169 / +250 / -359; under panels 0.0 to 1.8 %. So against origin/main the 16:10 rail clearance went from +22 to -59 px at 1440x900.
- **No plate edge or void:** the repo's plate gate reports the same corners as live at every desktop size (0, 1 at 2000x1012 menu 1, 2 at 2560x1080); the four 12 px border bands of every frame have the same near-black share as live (0.000 to 0.036 outside the phone's bottom panel); the phone plan reports 1 canvas corner (1.7 %) off the visible slice (live 0), under the HUD; none shows in the frame. Visible figure under panels: not above live + 0.6 point at any 16:9 or 21:9 size and menu (worst 2560x1080 menu 1, 1.7 against 1.1); above it at 16:10 menu 1 (+2.8 to +3.1) and at 4:3 (+12.5).

**2. Every Evrae pose in play: PASS.**
- Head across keys at 1600x900 (screen px, snout; idle / attack / hurt / breath-charge): branch (797.7, 388.3) / (772.7, 396.2) / (825.6, 340.3) / (797.8, 388.3); live (649.1, 386.7) / (621.8, 395.0) / (678.7, 336.5) / (649.3, 386.7). Offsets from the idle: branch attack (-24.9, +7.9) hurt (+27.9, -48.0) breath (+0.1, 0.0); live (-27.3, +8.3) (+29.6, -50.3) (+0.2, 0.0): equal within 1.6 px once the camera's 5 % scale is counted. At 2560x1440 the same within 1.6 px. So no key jumps off the approved relationships (the PNGs say the same: head tips from the canvas centre -547 / -594 / -494 / -547 px against the approved -364.5 / -413 / -311.5 / -364.5, the offsets between keys differ by at most 1.5 px).
- Approved poses kept: above the dropped tail loop the idle's head side differs from the approved idle in 11 of 19,681 painted px and its body side in 15 of 91,241, the attack's head side in 2 of 27,652 (the other differences are the loop and a 25 px repaint window at each pipe end); the hurt matches the approved one in the head and first 230 neck columns in 5 of 14,399 painted px (max delta 1). **Both derives reproduce exactly:** the approved hurt call on the approved idle gives the installed hurt.png (0 of 358,148 px differ), the approved breath call gives the installed breath-charge.png (0 of 370,146), and the E1-H calls on the E1-H idle give the package's hurt (0 of 295,169) and breath-charge (0 of 308,599). The 2x idle master registers to the 1x (alpha IoU 0.9995, head tips equal); the desktop sizes draw the 2x master (2272x1568), the phone the 1x.
- Seams: none visible at 1:1 and 2x in game on idle, attack, hurt, breath-charge (frames at 1600x900 and 2560x1440, `out/pose-*`, `out/pose-sheet-1600-*.png`); the PNG-level marks are in disclosure 4. Not checked by me: the advisor card beside the longer figure (the mix leaves it out by design), the phone at other sizes than 390x844, touch targets on the smaller phone party.
- **One real defeat (seeds 1 and 2, intended strategy, normal speed from 45 % HP): PASS.** Last blow -> idle to hurt crossfade (hurt 1136x874 at 0.88 to 1) -> lurch -> the fall y -0.9 to -8.3 under the cloud veil, actor gone at about +2.8 s; the paintings shown from the last blow on are the E1-H idle and hurt only (`ko.png` never drawn); 0 console errors (`out/defeat-branch-1600b-sheet.png`).
- **FAR swap and back: PASS.** NEAR (3.9923, -0.9, -4.7) -> FAR (6.4, 3.3, -30) at scale 0.7645 -> the pin again; the snout after the round trip is within 0.9 px of before (797.6, 387.4 against 797.7, 388.3); the FAR streak sits 17 px right of live's.

**3. Without the package, and the package without the code: it must ship together.**
- Branch code + today's art (1600x900): no crash, no void, but the head floats at x 897 (origin/main 796, live 649), Tidus's box stays 20.2 % covered, the plan gap is -291 / -250 / -264, and at menu 2 the coil is 1,220 px under the rail (-32); 1440x900 -9 / -10 / -15 px; 2560x1440 -20 / +50 / +70; 2560x1080 +39 / +37 / +53. The pin value is right only for the E1-H canvas.
- Today's code + the E1-H art (1600x900): the head lands at x 548 (101 px left of live), the coil lies over the party (the visible figure covers 36 to 39 % of a member's box, plan gap -313 / -313 / -302): worse than today.
- **The art install and `r38-evrae` must land in one release, in either order of risk.** (The handoff's step 5 is right.)

**4. Chapters XVII and XVIII and the rest: PASS.** `git diff` touches only the two Evrae scene files, three tests and docs; the only readers of `RANGE_STAGING.near.evrae` are the deck and `evraeSubject` (the Fins have their own spots and the Face binds nothing). Chapter XVII, links 1 to 3 by real keys then the intended strategy at fast speed, desktop and phone: Left Fin (6.99, -1.59, -30) and phone (1.4, -3.3, -30); Right Fin (13.64, 1.09, -30) and phone (7.34, -0.7, -30); party slots; identical to live and to the main bundle on the same origin. Link 3's Genais and Core swap sides run to run on every code (live 4.95 / -0.47 desktop and -0.81 / 5.74 phone, main-on-live-origin -1.01 / 5.90, branch -0.87 / 5.82 and 4.91 / -0.44 phone): no Cid there, the pin is not involved. Chapter XVIII (no Cid): actors identical in every run; the camera at the first menu is the FAR rig, the NEAR rig or between, and the controls vary on their own (main + overlay: two runs, two states; branch without the overlay: NEAR twice; main-on-live-origin: FAR); the phone is the same in the six same-origin runs (the one real-live run had the FAR rig).

**5. Code: PASS, with one gap and the full suite below.** Layering: only `src/scenes/*` changed (data); files: deck 396 lines, range 308 (under 400); strict TS: `tsc --noEmit` clean (TypeScript 7.0.2); orphans: 24, the same 24 as `origin/main` (branch 1,203 modules, main 1,204); the game case is FFX only in the single code commit and in the new files; targeted vitest (12 files: evrae-e1h-slot, evrae-deck-hold-party, evrae-scene, evrae-telegraph, evrae-engine, sin-listed, sin-phone-staging, sin-ship-layer, sin-hud, prone-lay-pinned, gagazet-boss-spots, ui-ffx-evrae-far-streak-bounds): 117 passed, 1 skipped (the conditional installed-art test, replicated in disclosure 5). The two rewritten tests are legitimate: `evrae-deck-hold-party` asserted "no pin" and now names the two pinned ids; `evrae-scene` uses the E1-H canvas (1136), the measured rail (0.878 at 1600x900 and at 1440x900, my reading) and the true snout offset instead of the plane centre. The gap: the rail test checks 16:9 only, so it cannot see B1 (disclosed above with its 16:10 value).

**6. The package: PASS.** All 12 install files present and named as the game expects; each sha256 and size equals the manifest; sidecars are valid JSON whose width and height equal their PNG; the manifest's six old shas equal `docs/target/approved-hashes.json` (sets `chapter:evrae:2026-09-23`, `bailey:2026-10-01-art`, `bailey:2026-10-02-art`; mtimes too) and the installed originals today; new shas computed (idle and idle-near `4911670a...`, idle@2x `227b0126...`, attack `dab9623c...`, hurt `02c22daa...`, breath-charge `1b1e1297...`); the backup list has all 12 originals, each with its current sha; the set is 1,257,782 bytes smaller (8,256,536 against 9,514,318); `tools/gen/manifest.mjs` on the package: no warnings and the merged states equal the installed manifest (no change); `ko` and `cast` are not in the install set and `idle-far` is untouched.

**Full suite (once, `--maxWorkers=3`):** see the line appended below.

**Full suite (once, `--maxWorkers=3`, 1,410 s on the busy machine):** 774 files, 767 passed, 5 skipped, 2 failed; 11,281 tests passed, 41 skipped, 1 todo, 2 failed. The two are 15 s timeouts under load and neither imports the deck or its slots: `strategy-ffx2-bahamut` "heal-only route ... clears Mega Flare" (the known one; it fails alone too) and `sin-fins-core-bench` "every line ends every chain" (an engine bench: 13.1 s alone on this branch and 13.0 s alone on the main tree against the 15 s limit, passes on both when the machine is quiet). Not this change.

**Scripts** (scratch, untracked): `session.mjs` (a real-key session and its measures), `lib.mjs` and `inpage-measure.mjs` (the driver and the in-page projection), `batch.mjs` with `plan-*.json`, `poses2.mjs`, `far2.mjs`, `defeat.mjs`, `sin-links.mjs`, `build-prod.mjs` and `serve-prod.mjs` (the production builds and the overlay server), `verify-package.mjs`, `diff-keys.mjs`, `head-from-quad.mjs`, `painted-overlap.mjs`, `compact-table.mjs`.

## Repair (2026-10-04): the check's blockers B1 and B2 and its disclosures, one cycle

Done by a Sonnet sub-agent of the driver on branch `r38-evrae` from `origin/r38-evrae` `3df6d543` (worktree `D:/pyrefly-fb-camera`, no tracked changes at the start). Code commit `3f3555f9721c0aca15e9815d9d6b20d429634a4b`.
**Pushed, not merged, not deployed. Nothing was written under `public/art` or `docs/target/approved-hashes.json`; `docs/handoff/NOW.md` was not touched** (the driver owns it this session). Paper preflight:
the "Repair preflight" in [../plans/r38-evrae-review.md](../plans/r38-evrae-review.md). The art is unchanged: the package is the same 12 files, except that two sidecars were corrected (below).

### Game case (rule 14): FFX only
Chapter VIII's Evrae (`evrae-airship`); the range mechanic has no X-2 counterpart (`research/ffx-evrae-airship.md` section 0.4). What is new is read by the range director only when it binds Evrae's own fight
(`id === 'evrae'` with an actor): not by Sin's Fins (Chapter XVII), not by Chapter XVIII's face (no foe bound), not on the phone (the stand-back), never by an FFX-2 chapter. The one shared-engine line is a filter in
`ShotRules.fitPhone` for an actor whose `userData.phoneFit === false`; only Evrae's director sets that key, so it is inert for every other figure of both games. Decided from the sources and from the running build, not from memory.

### What was wrong, and what changed
| Item of the check | Cause (measured in the running build) | Change |
|---|---|---|
| **B1** the coil under the turn rail at the first menu on every 16:10 size and on 4:3 | The cameras keep a fixed vertical field, so a narrower window shows less width while the HUD's 16:9 stage keeps the rail at 0.878 of the width; no slot x can pay for it: on the 1600x900 masks the whole figure may move 20 px left before it touches Rikku (her painted pixels under it: 0.01 % at 20 px, 1.4 % at 40, 7.5 % at 60, 19.5 % at 80, 41 % at 100), and 16:10 needs about 80 px, 4:3 about 150 | **NEAR's three rigs stand back below 16:9** (`nearDollyFor`, `src/scenes/evrae-airship-aspect.ts`, applied by the director): `1 + coil depth ratio x 1.1 x (16:9 / aspect - 1)`, at most 1.45, so the coil's end keeps its 16:9 place in the window's width (a dolly moves a point's screen x by its own depth: the ratio of the coil's depth to the aim's is 1.186, from the rig and the spot). 1.145 at 16:10, 1.435 at 4:3, 1 at 16:9 and wider. The 10 % margin is what lets the mix's own fit pass at 4:3 without its 41 px shift (measured: without it 8 px of coil under the rail at menus 1 and 2). The figure also stands further left, in proportion (`nearAspectFor`: 0.25 world per unit of stand-back: 0.036 at 16:10, 0.109 at 4:3). Evrae's scale and the pin's height and depth are untouched |
| **B2** the phone camera pulled back (z 14.78) and the party shrank (Tidus 97 px against 161) | `ShotRules.fitPhone` hands the A-12 refit every staged figure; an enemy narrower than the slice at the tried distance joins the fit. The checked figure is 0.74 of the render wide against a slice room of 0.776, so it joined, and the refit stood the camera back until party and coil fitted one slice (k 1.4335). The old figure measures 0.771 to 0.779 wide, within 0.005 of the room: left out on the real site (z 9.40 in 7 of 7 loads at 390x844), in at origin/main built locally (z 12.91) | the director marks Evrae `userData.phoneFit = false` when it binds Chapter VIII's fight and `ShotRules.fitPhone` leaves a marked figure out: the camera frames the party as it always did there (z 9.40, the authored rig), the coil is cut by the frame as live's is |
| Disclosure 1: "live" in the builder's evidence was origin/main built locally | the real live puts Evrae elsewhere, because ProneLay's slide is a race (below) | the proof below compares with the **real live site and origin/main (local build)**, both |
| Disclosure 2: menu 2 moves the composition 51 to 102 px and the coil's tip ends 4 to 14 px inside the rail | the MAX mix applies a static lens shift of 4 % of the width at one of the first menus (its soft downed-footprint rule, once that menu's real panels are known): at 16:9 and wider at menu 2, at 16:10 and 4:3 at menu 1 in the checked build. origin/main does the same at other menus (lens (-64,-36) at menu 3 at 1600x900; live at 1440x900 (-58,-36) from menu 2) | `EVRAE_E1H_RAIL_TRIM_DX = -0.1` (the pin is 3.8923, was 3.9923): 10 to 15 px more room at the shifted menu at the 16:9 sizes (menu 2's coil to rail at 1600x900, 2000x1012, 2560x1440: -5, -14, -9 px in the check, +4, -4, +6 now); **no visible coil pixel inside the rail's rect at any menu, size or seed** (33 sessions, 99 captures) |
| Disclosure 3: the repo's rest gap is below 1 at menu 3 on three sizes | a KO'd Tidus's lying box meets 3 of the 48 sampled cells of the figure's hidden strip below the deck line (see below) | nothing changes it for the better: any left shift moves it across its threshold (3 px of trim already does at 1600x900), and the trim does (now at every desktop size at menu 3); the visible painted overlap there is 0.0 % in seed 1 and at most 1.5 % in seeds 2 and 3 |
| Disclosure 4: stale old-canvas fields in `idle.json` and `idle-near.json` | `cropBox`, `source`, `canvas` and `cutout` described the approved parent's 1171x784 generation | fixed in the package: `canvas` is the file's own 1136x784, `cropBox` is null, the parent's four fields moved under `parent`; the two sha256 and the totals are re-stated in `manifest.json` (originals parked); `verify-package` finds no problem |

### Measured
Headless GPU Chromium (`PYREFLY_BROWSER=gpu`), Playwright from node, **real keys** title -> board -> prep -> scene -> first menu, `setSeed(n)` before the first key, then ATTACK twice for menus 2 and 3 (Tidus, Rikku, Wakka); seeds 1, 2 and 3 (the first three menus are the same for all three seeds, except where Tidus is or is not down at menu 3); one browser at a time; the camera's sway and the actors' breathing frozen for the reads.
**repair** = a production build of the committed tree (no probes) served under the live base path `/pyrefly-reprise/`, the E1-H package over `public/art` by a dev-only overlay in a scratch server (nothing written under `public/art`); 33 sessions, 99 captures, 0 console errors, 0 failed requests.
**live** = the real site (release 37.1, bundle `index-DhiL5vEz.js`): the checker's captures plus new ones at 360x780 and seeds 2 and 3 of 1024x768, 1280x800 and 1680x1050. **origin/main** = a production build of the branch base with the two Evrae scene files from origin/main (the checker's build, plus new captures at 1280x800, 1680x1050, 1024x768, 360x780), seed 1 only (it is deterministic locally: ProneLay lands on +0.7033 every time there).
Measures as in the check: the repo's `plate.restGap` from the mix report; each actor's painted alpha projected through its plane and the camera; the figure's visible pixels (screenshots with the HUD hidden, with and without the actor, differenced inside the projected alpha); the HUD panels by `hudPanels()`'s own rule, the rail is `.ig-ctb`. Frames: `docs/screenshots/r38-evrae/repair/`.

**Table 1: the turn rail and the HUD.** Coil pixels of the visible figure inside the rail's rect, with the coil's distance to the rail's left edge in px in brackets (negative: past it), and the share of the visible figure under any HUD panel. Menus 1 / 2 / 3; the worst over seeds 1 to 3 (live and repair), seed 1 (origin/main).

| Size | Coil px in the rail rect (coil to rail px): live | origin/main | **repair** | Visible figure under HUD panels, %: live | origin/main | **repair** |
| --- | --- | --- | --- | --- | --- | --- |
| 1280x800 | 0 (190)/0 (229)/0 (184) | 0 (86)/0 (85)/0 (131) | **0 (23)/0 (22)/0 (68)** | 5.3/6.9/2.0 | 0.0/0.0/0.0 | **0.0/0.0/0.0** |
| 1440x900 | 0 (213)/0 (259)/0 (254) | 0 (22)/0 (95)/0 (148) | **0 (23)/0 (22)/0 (75)** | 5.1/7.2/2.4 | 0.0/0.0/0.0 | **0.0/0.0/0.0** |
| 1680x1050 | 0 (249)/0 (315)/0 (308) | 0 (58)/0 (123)/0 (184) | **0 (30)/0 (40)/0 (89)** | 5.3/7.0/2.1 | 5.5/0.0/0.0 | **0.0/0.0/0.0** |
| 1024x768 | 0 (64)/0 (145)/0 (141) | 1328 (-41)/0 (15)/0 (35) | **0 (60)/0 (59)/0 (55)** | 11.6/8.6/4.9 | 19.5/1.5/2.7 | **0.0/0.0/0.0** |
| 1600x900 | 0 (263)/0 (262)/0 (266) | 0 (157)/0 (156)/0 (212) | **0 (69)/0 (4)/0 (43)** | 0.9/0.8/0.0 | 0.0/0.0/0.0 | **0.0/0.3/0.0** |
| 2000x1012 | 0 (308)/0 (294)/0 (300) | 0 (158)/0 (157)/0 (180) | **0 (57)/0 (-4)/0 (49)** | 1.1/0.8/0.0 | 1.6/0.0/0.0 | **1.7/0.2/0.0** |
| 2560x1440 | 0 (420)/0 (418)/0 (426) | 0 (250)/0 (248)/0 (340) | **0 (110)/0 (6)/0 (69)** | 0.9/0.9/0.0 | 0.0/0.0/0.0 | **0.0/0.3/0.0** |
| 2560x1080 | 0 (315)/0 (313)/0 (320) | 0 (169)/0 (167)/0 (160) | **0 (61)/0 (59)/0 (52)** | 1.1/0.9/0.0 | 1.8/0.0/0.0 | **1.9/0.0/0.0** |
| 390x844 | 0 (-379)/0 (-379)/0 (-379) | 0 (-359)/0 (-364)/0 (-349) | **0 (-379)/0 (-379)/0 (-379)** | 0.0/0.0/0.0 | 0.0/0.0/0.0 | **0.0/0.0/0.0** |
| 360x780 | 0 (-335)/0 (-335)/0 (-327) | 0 (-329)/0 (-329)/0 (-321) | **0 (-349)/0 (-349)/0 (-349)** | 0.0/0.0/0.0 | 0.0/0.0/0.0 | **0.0/0.0/0.0** |
| 1280x720 | 0 (211)/0 (210)/0 (214) | n/a | **0 (66)/0 (14)/0 (35)** | 0.8/0.8/0.0 | n/a | **0.0/0.3/0.0** |
| 1366x768 | 0 (236)/0 (223)/0 (228) | n/a | **0 (59)/0 (14)/0 (37)** | 0.8/0.8/0.0 | n/a | **0.0/0.4/0.0** |
| 1920x1080 | 0 (315)/0 (313)/0 (320) | n/a | **0 (83)/0 (4)/0 (74)** | 0.9/0.9/0.0 | n/a | **0.0/0.3/0.0** |

**Table 2: nobody inside the coil.** The repo's rest gap (`plate.restGap`: 1 is the hairline "nobody inside"; negative, the depth of the overlap in px) and the worst party member's painted pixels under the visible figure, %. Menus 1 / 2 / 3; the worst over seeds.

| Size | Rest gap: live | origin/main | **repair** | Painted overlap, %: live | origin/main | **repair** |
| --- | --- | --- | --- | --- | --- | --- |
| 1280x800 | -269/-238/-269 | -252/-252/-250 | **1/1/-203** | 25.0/31.5/23.9 | 20.2/33.1/31.7 | **0.0/0.8/0.0** |
| 1440x900 | -303/-277/-314 | -294/-284/-281 | **1/1/-229** | 37.2/35.4/34.4 | 17.3/34.9/35.5 | **0.0/0.8/0.0** |
| 1680x1050 | -354/-311/-353 | -331/-331/-324 | **1/1/-267** | 30.8/34.1/32.3 | 19.3/33.7/44.2 | **0.0/0.9/1.4** |
| 1024x768 | -258/-228/-258 | -242/-234/-240 | **1/1/1** | 29.7/19.4/27.4 | 15.2/30.0/28.6 | **0.0/0.8/0.0** |
| 1600x900 | -315/-315/-303 | -284/-283/-279 | **1/1/-270** | 32.8/28.1/25.7 | 21.7/38.3/38.8 | **0.1/0.8/1.5** |
| 2000x1012 | -346/-310/-341 | -330/-331/-336 | **1/1/-303** | 39.5/28.7/35.6 | 28.1/39.6/23.3 | **0.1/0.9/1.4** |
| 2560x1440 | -503/-503/-485 | -454/-454/-444 | **1/1/-431** | 38.1/33.0/38.0 | 28.7/39.9/40.9 | **0.2/0.9/1.1** |
| 2560x1080 | -368/-330/-363 | -353/-352/-373 | **1/1/-323** | 38.7/30.0/26.6 | 26.6/40.3/28.8 | **0.1/0.8/1.4** |
| 390x844 | -171/-171/-171 | -135/-135/-135 | **1/1/-156** | 28.4/37.0/30.3 | 13.3/22.9/14.7 | **0.0/0.9/2.6** |
| 360x780 | -137/-137/-137 | -125/-125/-132 | **1/1/-137** | 29.4/40.1/17.6 | 13.2/20.2/11.6 | **0.0/0.9/2.6** |
| 1280x720 | -251/-251/-242 | n/a | **1/1/-216** | 29.7/24.8/25.1 | n/a | **0.1/0.6/0.0** |
| 1366x768 | -269/-269/-259 | n/a | **1/1/-230** | 23.5/26.9/28.6 | n/a | **0.1/0.6/0.0** |
| 1920x1080 | -376/-376/-364 | n/a | **1/1/-311** | 28.8/26.0/33.0 | n/a | **0.1/0.7/0.0** |

**Table 3: the framing.** The idle rig's camera z at menu 1 (seed 1; the authored rig is 9.40, the mix's own 1.04 back-off 9.90), Tidus's painted height in px at menus 1 / 2 / 3 (seed 1; menu 3: Tidus is down in seed 1) and as a share of the window's height at menu 1, and the snout's x at menu 1.

| Size | z: live | origin/main | **repair** | Tidus px: live | origin/main | **repair** | Tidus % of height: live -> repair | Snout x: live | origin/main | **repair** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1280x800 | 9.90 | 9.90 | **11.77** | 231/258/91 | 232/260/91 | **193/214/75** | 28.9 -> 24.1 | 515 | 636 | **679** |
| 1440x900 | 9.90 | 9.40 | **11.77** | 261/306/109 | 278/292/102 | **216/241/85** | 29.0 -> 24.0 | 579 | 774 | **764** |
| 1680x1050 | 9.90 | 9.90 | **11.77** | 304/337/119 | 307/342/119 | **253/282/99** | 29.0 -> 24.1 | 674 | 902 | **891** |
| 1024x768 | 9.90 | 9.90 | **15.50** | 223/247/82 | 224/237/87 | **136/153/53** | 29.0 -> 17.7 | 433 | 549 | **498** |
| 1600x900 | 9.40 | 9.90 | **9.90** | 277/307/103 | 262/292/102 | **264/293/103** | 30.8 -> 29.3 | 653 | 796 | **788** |
| 2000x1012 | 9.40 | 9.40 | **9.40** | 313/346/116 | 315/348/116 | **312/328/123** | 30.9 -> 30.8 | 834 | 995 | **986** |
| 2560x1440 | 9.40 | 9.90 | **9.90** | 444/494/165 | 423/466/165 | **422/466/176** | 30.8 -> 29.3 | 1043 | 1273 | **1260** |
| 2560x1080 | 9.40 | 9.40 | **9.40** | 333/369/124 | 333/372/131 | **335/372/124** | 30.8 -> 31.0 | 1103 | 1275 | **1265** |
| 390x844 | 9.40 | 12.91 | **9.40** | 161/178/63 | 112/125/44 | **160/179/63** | 19.1 -> 19.0 | 418 | 460 | **455** |
| 360x780 | 12.07 | 12.05 | **9.40** | 106/118/41 | 106/118/41 | **140/156/55** | 13.6 -> 17.9 | 404 | 404 | **399** |
| 1280x720 | 9.40 | n/a | **9.90** | 222/246/82 | n/a | **211/233/87** | 30.8 -> 29.3 | 524 | n/a | **630** |
| 1366x768 | 9.40 | n/a | **9.90** | 235/262/87 | n/a | **225/249/93** | 30.6 -> 29.3 | 559 | n/a | **673** |
| 1920x1080 | 9.40 | n/a | **9.90** | 333/369/124 | n/a | **314/350/124** | 30.8 -> 29.1 | 783 | n/a | **945** |

**Frames** (`docs/screenshots/r38-evrae/repair/`; each is the real site, the checked build and the repair, side by side): `repair-16x10-1440x900-menu1.jpg`, `repair-4x3-1024x768-menu1.jpg`, `repair-phone-390x844-menu1.jpg`, `repair-phone-360x780-menu1.jpg` (real site, origin/main, repair), `repair-16x9-1600x900-menu2.jpg` (the checked build and the repair at the shifted menu), `repair-21x9-2560x1080-menu2.jpg`.

### Why a slot move cannot fix the narrow windows (and what was tried instead)
The checker's 1600x900 masks (menu 1), the whole visible figure shifted left by d px, painted pixels of each party member the figure then covers (`sweep_masks.py`, scratch):

| d | 0 | 20 | 30 | 40 | 50 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|---|---|
| Tidus | 0.00 % | 0.10 % | 0.19 % | 0.20 % | 0.15 % | 0.08 % | 0.02 % | 0.01 % |
| Rikku | 0.00 % | 0.01 % | 0.53 % | 1.43 % | 3.58 % | 7.54 % | 19.50 % | 41.47 % |

So the room to the left is 20 to 40 px, and 16:10 needs about 80 px (61 px past the rail in the check, plus a margin) and 4:3 about 150. The alternatives were measured before the camera was chosen: a **widened vertical field of view** (Hor+ by lens: the 16:9 picture exactly,
scaled to the width) shows the plate's edge in a corner (the mix's own plate gate, replicated in `plate_check.mjs`: 0.9 % of the frame at 16:10, 3.4 % at 4:3, 6.0 % at 5:4 miss the painting, against 0.0 % for the stand-back at every one of them) and is not how this project frames a too-narrow window (the phone's A-12 refit and the mix both stand the camera back);
a **smaller Evrae** changes the one scale D-360 fixes, and costs the boss its presence against an unchanged party. The price of the stand-back is the party's size, below.

### The stand-back, in numbers
The rig stands back along its own view line about its aim (the director's existing `phoneRig` dolly), for NEAR's `idle`, `action` and `enemy` rigs only; FAR's rigs, the intro, party and victory rigs, and every other scene are as authored.

| Window | aspect | stand-back | figure's extra trim | Tidus, share of the window's height: live -> repair |
|---|---|---|---|---|
| 1600x900 (and 16:9, wider) | 1.78 | 1 | 0 | 30.8 % -> 29.3 % |
| 1440x900, 1280x800, 1680x1050 | 1.60 | 1.145 | 0.036 | 29.0 % -> 24.0 % |
| 1024x768 | 1.33 | 1.435 | 0.109 | 29.0 % -> 17.7 % |

(The 16:9 figure includes the mix's own 1.04 back-off that the checked build already had.) The party is therefore 17 % smaller than live at 16:10 and 39 % smaller at 4:3, in Chapter VIII only: that is what a camera-only answer costs, because the nearest figure shrinks fastest under a dolly. The coil's end, which the dolly is sized for, keeps its 16:9 place.
This is the one decision for Bailey in this repair (below).

### The phone (B2), in numbers
`FrameFit.fitRigToSlice` (390x844: slice 0.4219, so the room for one slice is `2 x slice x 0.92` = 0.7763 of the render's NDC width). The subjects at k = 1, measured by instrumented scratch builds (a console line per refit with every `liftFor(k)` it tried):

| Build | Evrae's box at k = 1 | In the refit? | Group at k = 1 | k chosen | Camera z | Tidus |
|---|---|---|---|---|---|---|
| 3b709a4f (checked) | 0.740 wide | yes (under 0.776) | 1.084 (-0.36 to 0.724) | 1.4335 | 14.78 | 97 px |
| origin/main local (ProneLay +0.70) | 0.771 | yes | 0.98 | 1.2839 | 12.91 | 112 px |
| the real live origin (4 loads, plus the check's 3) | 0.779 | **no**: wider than the room by 0.003 | the party's 0.65 (-0.36 to 0.29) | 1 | 9.40 | 161 px |
| **this repair** (Evrae marked out of the refit) | not asked | no | the party's 0.65 | 1 | **9.40** | **160 px** (390x844), 140 px (360x780) |

So the real site's phone camera at 390x844 is the authored rig only because the old figure's box is 0.003 wider than the slice's room (a margin, not a design), and origin/main built locally, whose old figure measures 0.771 at the same moment (its box sits 0.09 NDC further right than the real site's), takes the other branch. At 360x780 the real site's camera was z 12.07, 10.66 and 10.66 in three loads (Tidus 106 to 122 px); the repair gives the authored rig there too (z 9.40, Tidus 140 px).
The party's size and the camera at 390x844 are live's. The frame cuts more of the figure than live's does: of the painted figure, 44 % lies outside the 390 px slice at 390x844 (live 7.7 %) and 34 % at 360x780 (live 0 %, its camera being farther): the head, its first arch and the neck are in; the coil's loops are out, because the longer figure stands right of the party instead of behind it.

### ProneLay's +0.70 or -0.70: an ordering race, not the base path and not the seed
`layProneFigures` decides a wide painting's slide once, on the first frame its idle is on screen (the `laid` memo), from the figures the stage has registered by then. `PaintedStage.stage` adds every combatant concurrently
(`Promise.all(live.map(add))`), each actor registering when its own paintings have loaded, and the formation solver also spreads Evrae and the co-located Cid off their slot. A scratch build of origin/main with a console line in `layProne` (its inputs and every step's overlap sum;
same bundle, `setSeed(1)` before the first key, served under `/pyrefly-reprise/`):

| Run | Origin | Figures staged when it ran | Choice |
|---|---|---|---|
| 5 loads | localhost (unthrottled) | Tidus, Wakka, Rikku and Evrae | step +0.25 (+0.7033), every time |
| 1 load | the real live origin | Evrae and the invisible Cid at one spot, no party | step -1 (-2.8131) |
| 2 loads | the real live origin | Evrae at x 0.43 and Cid at 4.22 (spread off their shared slot), no party figure staged | step -0.25 (-0.7033) |
| 1 load | the real live origin | the party and Evrae, as on localhost | step +0.25 (+0.7033) |

With the party staged, +0.25 is the smallest slide that leaves the least overlap (every larger slide to the right ties it); with only the invisible Cid beside it, the smallest slide that clears his box is -0.25 (twice), or the farthest left (once). So where the old figure's head stood on the real site was a coin toss per page load on the desktop (the phone's camera at 390x844 was the authored rig in 7 of 7 loads there, for the margin above); nothing here depends on the base path (both runs were under `/pyrefly-reprise/`).
**The pin ends it** (`pinned` figures are never laid): the identity check below measures the final bundle's placement on three origins.
### The pinned placement is the same on three origins
One production bundle (this repair's, no probes), real keys to the first menu, seed 1, the camera's sway frozen for the read (`identity.mjs`, scratch): localhost at `/` (a build with base `/`), localhost under the live base path `/pyrefly-reprise/`, and the **real live origin** (its network, art and fonts; the game bundle answered by this build and Evrae's twelve files by the package overlay).

| Window | Evrae's position (all three origins) | Plane mesh x, roll | Snout (px) | Painted bbox | Rest gap | Lens |
|---|---|---|---|---|---|---|
| 1600x900 | 3.8923, -0.9, -4.7, pinned, `proneShift` 0 | 0.0009, roll 0.00629 | 787.69, 388.25 | 778,285,1349,683 | 1 | (0, 36) |
| 1440x900 | 3.8561, -0.9, -4.7 (the pin and the 16:10 trim 0.0362) | 0.0009, 0.00629 | 763.89, 427.16 | 755,336,1263,689 | 1 | (-58, 0) |
| 390x844 | 3.8923, -0.9, -4.7 | 0.0009, 0.00629 | 454.93, 244.60 | 449,183,790,421 | 1 | none |

Identical to the last digit, where origin/main's slide was -2.81, -0.70 or +0.70 depending on the load.

### What still holds (regression checks on this build, 1600x900 unless noted)
- **Every pose** (`poses2.mjs`): the snout at idle (787.69, 388.25); attack (-24.96, +7.85), hurt (+27.96, -48.00), breath-charge (+0.15, 0.00) from it: the checked build's offsets (-24.9, +7.9), (+27.9, -48.0), (+0.1, 0.0); 2560x1440 the same scaled. No key jumps. 0 console errors.
- **FAR swap and back** (`far2.mjs`, 1600x900 and 1440x900): NEAR (3.8923 or 3.8561, -0.9, -4.7) to FAR (6.4, 3.3, -30) at scale 0.7645 and back to the same NEAR spot; FAR's rigs and painting are as authored.
- **One real defeat** (`defeat.mjs`, the intended strategy, normal speed from 45 % HP): 759 frames, the paintings shown from the last blow on are the E1-H idle and hurt only, the fight ends in its cutscene, 0 console errors.
- **Chapters XVII and XVIII** (`sin-links.mjs`, real keys, then the intended strategy at fast speed, 1600x900 and 390x844): the Left Fin (6.99, -1.59, -30) and on the phone (1.40, -3.30, -30); the Right Fin (13.64, 1.09, -30) and (7.34, -0.70, -30); the party on its slots; the cameras (the FAR rig for links 1 and 2, the authored NEAR rig for link 3, the phone's refit 14.69 against live's 14.81): identical to the live site's and to origin/main's in the checker's records. Link 3's Genais and Core swap sides run to run on every code, as the check found. The stand-back and the phone flag read nothing there.
- **The package** (`verify-package.mjs`): 12 install files present, every sha256 and size equals the manifest, the sidecars are valid and match their PNGs, the six old hashes equal `approved-hashes.json`, 8,258,316 bytes against 9,514,318 replaced (1,256,002 smaller); `art/manifest.json` states unchanged.
- **Rest gap at the first two menus is 1 at every size and seed**; the painted overlap there is at most 0.9 %.

### Code checks
`npx tsc --noEmit` clean. `node tools/orphans.mjs`: 24 orphans, the same 24 (1,204 modules; the new module is imported by the director). Files under 400 lines: `evrae-airship-range.ts` 322, `evrae-airship-aspect.ts` 88 (new), `evrae-airship-director.ts` 374, `evrae-airship-deck.ts` 397, `ShotRules.ts` 83. Layering: `src/engine/ShotRules.ts` gains a constant and a filter, no DOM, no `three`; the scene files are data and the director. Strict TS, explicit `.ts` imports.
Targeted vitest (20 files: evrae-e1h-slot, evrae-deck-hold-party, evrae-scene, evrae-telegraph, evrae-engine, evrae-advisor, evrae-breath-hold, evrae-script, sin-listed, sin-phone-staging, sin-ship-layer, sin-hud, prone-lay-pinned, gagazet-boss-spots, ui-ffx-evrae-far-streak-bounds, presenter-shot-fit, frame-fit, frame-fit-phone-top, phone-top-band): 214 passed, 1 skipped (the conditional installed-art test, replicated against the package in the check).
Full suite once (`npx vitest run --maxWorkers=3`, 847 s on the busy machine): 774 files, 768 passed, 5 skipped, **1 failed**; 11,299 tests passed, 41 skipped, 1 todo, 1 failed: `tests/unit/strategy-ffx2-bahamut.test.ts` "heal-only route (no Shell, no Breaks) clears Mega Flare", a 15 s timeout under load that passes alone (12.8 s of 15; it imports only FFX-2 battle data and tactics): the known one, not this change (`sin-fins-core-bench`, the other known one, passed in this run).

**Tests changed or added.** `evrae-e1h-slot.test.ts`: the spot composes with the trim; `nearDollyFor` (1 at 16:9 and wider, the 16:10 and 4:3 values, monotone, capped, 1 for no window), the coil-depth ratio recomputed with three.js, the coil's end against its 16:9 place (and the plain Hor+ rule landing on it exactly), the view-line dolly, `nearAspectFor`, and the director on 16:10, 4:3, 16:9, 21:9, no window, the FAR round trip, the Fins and no-foe cases (untouched), the phone (rigs as authored, Evrae flagged). `evrae-scene.test.ts`: the rail test now runs on 21:9, 2000x1012, 16:9, 16:10, 3:2 and 4:3 with the director's stand-back and trim (it only looked at 16:9, which is how B1 got through), and one test shows the authored rig would put the figure under the rail at 16:10, 3:2 and 4:3. `presenter-shot-fit.test.ts`: the phone refit leaves a marked figure out and keeps one whose mark is anything but `false`.

### Still open, and for Bailey
1. **The party is smaller than live's below 16:9, in Chapter VIII only** (Tidus's share of the window's height: 29.0 % to 24.0 % at 16:10, to 17.7 % at 4:3; 16:9 and wider as before). The camera is the only lever that clears the rail without putting the party inside the coil, and it shrinks the nearest figure fastest. Alternatives, none built: a smaller Evrae instead (the party as live's; by the masks about 0.8x at 16:10 and 0.6x at 4:3 for the same clearance, an estimate, not measured), a mix of the two, or the checked build's coil under the rail below 16:9 (51 to 112 px past it). A widened field of view was measured and rejected (the plate's edge shows).
2. **The figure stands 0.1 world left of where the mockups had it** at 16:9 and wider (10 px at 1600x900), and up to 0.21 at 4:3; the head moves with it. Without the trim the coil's tip is 5 to 14 px under the rail at the menu where the mix shifts the stage.
3. **The repo's rest gap at menu 3 reads below 1 at every desktop size** (-203 to -431; at 1024x768 it is 1): the KO'd Tidus's lying box meets 3 of the 48 sampled cells of the figure's hidden strip below the deck line, a threshold that any left shift crosses (three px of trim already does at 1600x900; the checked build had it below 1 at three sizes). The visible painted overlap at menu 3 is 0.0 % in seed 1 (where Tidus is down) and at most 1.5 % at the desktop sizes, 2.6 % at the phones in seed 3. The hidden strip is in the art; a package without it changes the rest-roll.
4. **The mix's own lens shift** (4 % of the width at one of the first menus) still takes the coil within 4 px of the rail at 1600x900 and 1920x1080 at menu 2, and 4 px past it at 2000x1012 (no coil pixel inside the rail's rect there). The visible figure under HUD panels is 1.7 % at 2000x1012 and 1.9 % at 2560x1080 at menu 1 against live's 1.1 % (the lowest coil behind the party-stat list at camera z 9.40; the checked build had 1.5 and 1.7).
5. **The phone shows less of Evrae than live's 390x844 does**: 44 % of the painted figure lies outside the 390 px slice (live 7.7 %), 34 % at 360x780; the head, the first arch and the neck are in. At 360x780 the real live camera is z 12.07, 10.66 and 10.66 in three loads (Tidus 106 to 122 px): there is no single live party size to match; the repair's is the authored rig's (140 px, the 390x844 rig scaled).
6. **A window resized after the battle starts keeps the stand-back it had at the bind** (read once, before the opening, so the plan and the first frame agree); it is re-read at the next battle, not at the next range swap.
7. Not checked: the advisor card beside the figure at the narrow sizes beyond the frames; the phone at other widths; a real defeat on the 16:10 and 4:3 stands.
8. Sin's chapters share ProneLay's race for any wide painting they do not pin; untouched here.

### Installer notes (release 38), changed from above
Step 3 unchanged, and `manifest.json`'s two sidecar hashes changed (`idle.json` `30059fca...`, `idle-near.json` `e687f11d...`; the PNGs and the six locked hashes did not). Step 5 now merges the stand-back (`evrae-airship-aspect.ts`, the director) and the phone flag (`ShotRules.ts`) with the pin (3.8923). Step 6: look at Chapter VIII's first menu at 16:10 and 4:3 as well.

**Reproduce:** `D:/Tools/pyrefly-scratch/2026-10-04/evrae-repair/` (scratch, untracked): `build-prod.mjs` (a production build; `INSTR=prone,fit` for the probes, `BASEPATH=/`, `TRIM`, `MARG`), `serve-prod.mjs` (`/pyrefly-reprise/`, the package overlay), `session.mjs` and `batch.mjs`, `quick.mjs` and `doc-tables.mjs` (the tables), `probe-log.mjs` (ProneLay and the phone refit), `identity.mjs`, `plate_check.mjs`, `sweep_masks.py`; the frames under `out/`.
