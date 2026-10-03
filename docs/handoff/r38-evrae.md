# r38-evrae: Evrae re-staged to E1-H (D-360), Chapter VIII, FFX only

Lane of release 38, built 2026-10-03 by a Sonnet sub-agent of the driver from `origin/main` 4b7adea6 on branch **`r38-evrae`** (worktree `D:/pyrefly-fb-camera`).
**Pushed, not merged, not deployed. Nothing was written under `public/art` or `docs/target/approved-hashes.json`.** Paper preflight: [../plans/r38-evrae-review.md](../plans/r38-evrae-review.md).

## Game case (rule 14): FFX only
Evrae is Chapter VIII's boss (`evrae-airship`); the airship range mechanic has no X-2 counterpart (`research/ffx-evrae-airship.md` §0.4); D-360. Chapters XVII and XVIII
(Sin, FFX) share the deck scene and its slot object and **do not move** (Chapter XVII measured live vs branch: same gap, the Fin on the same FAR spot, boxes within the camera's sway). FFX-2: nothing.

## What it is
Bailey adopted E1-H ("I'll go with all your recommendations"): Evrae's approved idle is repainted with the neck arch lengthened about 165 px so the head stays and the coil
stands right of the party; party, camera and Evrae's scale unchanged; the tail loop is dropped. This lane (1) assembles the E1-H idle set, (2) re-derives every other installed
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

## The code (two files, data only)
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
- Tight clearances: the coil's right edge is 34 px from the turn rail at 2560x1080 (47 at 1600x900).
- A small dark fragment sits at the bottom-left of every key (the kept strip); it is far under the deck line and never visible at NEAR (none in any frame).
- Not checked: a real defeat on the new hurt (Evrae's ko points at hurt), the advisor card next to the longer figure beyond the frames above, the phone at other sizes, FAR's own painting.
- Reproduce: `proof/tools/` (the scratch tooling); the dev-only overlay is `tools/zz-r38-evrae.tmp.vite.config.mjs` + `zz-r38-evrae.tmp.overlay-plugin.mjs` in the worktree (agent scratch, untracked, copied into `proof/tools/`; the plugin is the preview-picks branch's).
