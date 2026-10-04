# art-install-2026-10-04: the art installed for release 38 (D-315, D-325, D-336 to D-341, D-343, D-352, D-355 to D-357)

Done in the main tree `D:/Final Fantasy` from main `54e44c23` (release 38 part 2a), by a Sonnet sub-agent of the driver session. **Not deployed.** Follows the
pattern of the 2026-10-03 install ([art-install-2026-10-03.md](art-install-2026-10-03.md)). The order was the driver's brief's (the pages' order): (1) Yuna Thief,
Rikku Warrior, Paine Thief if a shipped chapter reaches her; (2) the D-333 / D-334 re-rolls; (3) the Bahamut and Shuyin wind-ups, Flux's and Braska's Final
Aeon's telegraphs, Lulu's Fury; (4) the day-pass art; (5) the painted plate wings; (6) the 24 held images of 2026-10-02; (7) the held 2x masters in D-315's
order; **stopped at the strict 800,000,000-byte line** (D-332, D-344). Not installed, as the brief says: the Evrae E1-H and Lady Luck packages (they ship with their
code lanes), Wakka's Slots and Kimahri's Stone Breath (D-357 dropped them), a Natus telegraph (D-340).

Bailey's words: the morning page, 2026-10-03 ~12:00 EDT, "all your recommendations, godspeed" (D-336 to D-344); the Visual Options page, ~14:42 EDT, "I'll go
with all your recommendations thank you <3" (D-351 to D-357); D-332 / D-344 for the line. Game case (rule 14), per painting from the sidecar's `game`: the
dressphere figures and keys, the re-rolls, the Bahamut and Shuyin wind-ups, the plate wings, and Vegnagun, Shuyin and the x2 aeons are **FFX-2 only**;
Seymour Flux, Braska's Final Aeon, Lulu's Fury key, Tidus's two Overdrive keys and the FFX aeons are **FFX only**; the 2x masters follow their figure
(`idle@2x.json` `game`). The only code is FFX-2 only too (the White Mage's KO scale, the three face-crop rows, the wing drawing).

## What went in (119 images and 119 sidecars; 11 of the images replace a painting, backed up first)

Package: `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/` (`install.mjs`, dry run by default; `plan.json`, `hashes.json`, `replace.json`, `sets.json`,
`backup/replaced/` and `backup/at-apply-*/`, `work/` the scripts that built it). Every image is its candidate byte for byte; every sidecar is the house shape
(`width`, `height`, `baselineY`, `anchorY` on twirl keys, `scale`, `facing`, the recipe from the candidate's `.prov.json`, `game`, `status`, `candidateOf` and
`candidateSha256`, `decision`, `replaces` where it replaces). The "PREVIEW CANDIDATE" statuses of the install-ready sidecars are rewritten to the approval
before hashing. Rikku Warrior's and Paine Thief's sidecars carry a `costumeNote` saying the costume is our estimate (D-337); Yuna Thief's says sourced (visual-bible 1.14). Bytes: raw image bytes, and the **shipped delta** from the scratch production build of main measured after the step (exact-WebP shipping,
the deploy's way of counting, `bytes-manifest.mjs` in the scratch folder).

| Step | Decisions | What | Images | Raw bytes | Shipped delta |
|---|---|---|---|---|---|
| 1 | D-336, D-338 (D-337, D-352) | the three new FFX-2 figures: **Yuna Thief** 13 (idle cand-6, wind-up, attack, follow, cast, item, hurt, KO, victory, twirl start / going / forming / end), **Rikku Warrior** 11 (idle cand-12 and the same set without going and forming), **Paine Thief** 13 (idle cand-5, the full set) | 37 | 12,708,176 | +9,712,650 |
| 2 | D-341 (D-333, D-334) | the re-rolls, **replacing**: Yuna Gunner's wind-up (`ready`), Yuna Warrior's follow-through (`follow`), Yuna White Mage's hurt, KO and attack | 5 | 1,730,058 (the old: 2,708,386) | -714,359 |
| 3 | D-340 / D-352 (P6), D-355, D-357 | the **Bahamut telegraph with its 2x master** (the page's 7,745,795 bytes for P6 count it) and the **Shuyin telegraph** (FFX-2; they show on the existing charge beat), **Seymour Flux's** and **Braska's Final Aeon form 2's telegraph** (FFX; the r38-keys hold turns on), **Lulu's `od-fury`** (FFX; one file for the 19 Furies) | 5 + the master | 9,650,318 | +8,947,479 |
| 4 | D-356 | the day pass: **Paine Warrior's plant** (cand-7, under `od-x2-warrior-power-break` and `od-x2-warrior-armor-break`, the same painting twice as the Yuna Warrior apex set did), **Tidus's Slice and Dice** (cand-76) and **Energy Rain** (cand-71), **Rikku White Mage's twirl-start** (cand-33), the **seven Dark Knight re-picks** (Rikku attack, hurt, KO; Paine hurt, victory; Yuna hurt, KO), the **six mage follow-throughs** (Yuna, Rikku and Paine Black Mage; Yuna, Rikku and Paine White Mage) | 18 | 8,543,172 | +6,185,833 |
| 5 | D-343 | the **painted plate wings**: Den of Woe left cand-1 + right cand-3, Bevelle Underground left cand-3 + right cand-1 (`backdrops/wings/<plate>-left|right.png`, 646 and 716 px strips, 96 px over the plate's edge; the plates themselves are **not** replaced and keep their hashes; the code is branch `r38-wings`) | 4 | 4,863,275 | +4,507,857 |
| 6 | D-325 | the **24 held images** in D-325's order: the light-state casts of Vegnagun's tail, leg, head, body and Shuyin; Ifrit attack / KO / cast, Ixion attack / cast, Bahamut attack / KO / cast, Shiva and Anima casts, Grothia and Spathi attack / KO / cast, x2-Shiva and x2-Anima casts, x2-Anima's attack. Six **replace** attack paintings (Ifrit, Ixion, Bahamut, Grothia, Spathi, x2-Anima; old total 5,843,411). All 73 of D-325's paintings are now in | 24 | 20,366,336 | +11,793,646 |
| 7 | D-315 | the **25 held 2x masters** in the candidates README's order: Seymour at Macalania, x2-Shiva, Seymour Omnis, Seymour Flux, Mortiorchis, Yuna, Tidus, Yuna White Mage, Yuna Dark Knight, Yuna Gunner, Rikku, Guado Guardian, Mortiphasm, Yu Pagoda, Seymour Natus, Yojimbo, Isaaru, Baralai's shade, Auron, Lulu, Wakka, Rikku Alchemist, Paine Warrior, Rikku Thief, Paine Dark Knight (49 of the 52 masters are in) | 25 | 102,302,599 | +95,912,545 (+75,282,992 for the first 19, +20,629,553 for the last 6) |

The shipped delta is smaller than the raw bytes because the default `exact` derivation ships a painting as lossless WebP wherever its alpha is only 0 and 255 (most keys:
539 WebP in the build now) and as a PNG recompressed at maximum effort (or as it is, when that is not smaller) where it is not: the twirl-going and twirl-forming keys, every 2x
master and the wings.

## The line (D-332, D-344: 800,000,000 bytes, strict)

Scratch production builds of the main tree (`npx vite build --config <wrapper> --outDir D:/Tools/pyrefly-scratch/2026-10-04/art38/dist --emptyOutDir`; the wrapper
`vite-art38.config.mjs` changes only `cacheDir`; the default `exact` derivation; never `dist/`), counted as the deploy counts them (the build's files plus the
`artifact-manifest.json` the deploy writes plus the empty `.nojekyll`):

| After | Files | Bytes | Headroom |
|---|---|---|---|
| main 54e44c23, before this install | 1,718 | 662,350,682 | 137,649,318 |
| step 1 | 1,792 | 672,063,332 | 127,936,668 |
| step 2 | 1,792 | 671,348,973 | 128,651,027 |
| step 3 | 1,804 | 680,296,452 | 119,703,548 |
| step 4 | 1,840 | 686,482,285 | 113,517,715 |
| step 5 | 1,848 | 690,990,142 | 109,009,858 |
| step 6 | 1,884 | 702,783,788 | 97,216,212 |
| step 7, the first 19 masters | 1,922 | 778,066,780 | 21,933,220 |
| **step 7, 25 masters, with the final code (KoPoseScale, face-crop rows)** | **1,934** | **798,697,104** | **1,302,896** (the brief wants at least 1,000,000) |

Build alone 798,426,512 bytes (1,932 files) plus `artifact-manifest.json` 270,592. The sizing of the masters was predicted from the same derivation before they went
in (`size-masters.mjs`: cumulative 95,955,948 for the 25 against 96,216,212 available, within 33 KB of the measurement). **The next master in the order
(Rikku Dark Knight, 5,327,976 shipped) would have crossed the line.**

## What waits, and why

| What | Bytes (shipped estimate) | Why it waits |
|---|---|---|
| the 2x master of **Rikku Dark Knight** | 5,327,976 | over the line (D-315's order, 26th of 27) |
| the 2x master of **x2-Anima** | 4,947,155 | over the line |
| the 2x master of **Kimahri** (`held-2x/characters/kimahri/idle@2x.png`, 4,992,995 raw) | about 4.7 MB | **blocked, not parked for size**: it was made from Kimahri's old two-horned idle; D-324 replaced his idle with the single-horn one on 2026-10-02, so the master (its sidecar's `approvedOneX.sha256` d1d8d3cc... is not the installed idle 49978b5d...) would show two horns on a 2x device. It needs re-making from the installed idle (the D-315 method), then it goes in; `make-package.mjs` refuses any master whose 1x changed |
| **Rikku Warrior's going and forming** twirl keys | never packaged | D-338: they show a skirt where trousers were; the existing twirl keys play there (`twirlPlan` skips a missing key) |
| adopted but **not in this install's list**: the other FFX-2 apex keys of the overnight set (`3-apex-ffx2`, 19 paintings) | 6,997,743 raw | D-339 adopted them; the brief did not list them; in FFX-2 an open command menu hides them (D-357). Three ability ids there are unconfirmed (README) |
| the same: **Rikku's Mix** and **Yuna's Grand Summon** (FFX) | 326,826 + 406,680 raw | D-339 adopted; D-357 leaves them untouched ("could not be judged"); not in the brief |
| the same: the **telegraph keys that need wiring**: Yunalesca (with a 2x master), Omnis, Ixion, Ifrit, Valefor, Bahamut (FFX), Overdrive Sin, Trema, LeBlanc, Vegnagun tail (with a 2x master) and head | 19,953,871 raw (10,340,085 of it the two 2x masters) | D-355 wires the hold only for Flux and Braska's Final Aeon; Omnis is "acceptable, not now"; the others show nothing without code. (Evrae's, 6.2 MB with its master, is rejected; Natus's is held) |
| D-342's clean **gap keys** | not packaged | the brief did not list them; the README's table has 56 slots, the clean ones were never listed in a file |
| held by D-356 / D-339: Kimahri's breath and Ronso Rage, Tidus's Spiral Cut, Auron's Shooting Star and Banishing Blade; rejected: Auron's Dragon Fang, the new Rikku Berserker keys | | as those decisions say |
| the **Evrae E1-H** package (`candidates/2026-10-03-day/evrae-restage/install-ready`) | 1,257,782 **smaller** than what it replaces | ships with its code lane (the brief); it costs nothing against the line |
| the **Lady Luck** package (`candidates/2026-10-03-day/lady-luck/install-ready`, D-363) | 14,896,702 raw (idle only 1,156,626; idle + 7 keys 7,365,012) | ships with its code lane (the brief). **The headroom is now 1,302,896 bytes, so it does not fit**: it needs the line to move (D-369's Cloudflare Pages has no total cap), or three or four of the 2x masters of this install to be parked again (D-315's last ones: Paine Dark Knight, Rikku Thief, Paine Warrior, Rikku Alchemist), or a subset |

## Judgement calls, each for the driver to check

1. **Paine Thief is installed.** The brief said "only if a shipped chapter reaches her (check the FFX-2 grids)". A girl's change wheel is a ring of her dresspheres
   (`src/battle/ffx2/setup.ts` `gridNodeContents`: node 0 is the current dressphere, then `owned` in order up to the grid's node count; a spherechange moves one
   link and she may change again), so "reached" means "on the ring". Computed from the shipped builds (`ring-reach.mjs` in the scratch folder): **Rikku's warrior**
   is on the ring in all six builds (IV, V, VI, XIII, XV, XVI; the critic's PR-0311 found it in Chapter XIII), **Paine's thief** in Chapters IV
   (`warrior, gunner, thief, black-mage`), V, XIII (`dark-knight, warrior, gunner, thief, songstress`), XV and XVI, not in VI (`warrior, white-mage, gunner,
   songstress`); Yuna's thief is on every ring and one link from Gunner in Chapter VI. D-352's "cannot be reached in any shipped chapter" counted one change from
   the starting dressphere. If Bailey meant one change, Paine Thief (4,136,613 raw, 3.6 MB shipped) is the one to hold: it is in the set `bailey:2026-10-03-picks`
   and its files are listed below.
2. **The Bahamut telegraph's 2x master went in with it** (6,130,016 raw): P6's 7,745,795 bytes on the page count it, and the candidates' README says an install
   should take the 2x with the 1x so the idle's 2x master is not mixed with a 1x key.
3. **D-343 is realised as four wing hashes, not a new plate hash.** The page said the extended plate gets a new approved hash; the candidates are wing strips with
   a 96 px blend over the plate's edge, so the approved plates (`den-of-woe.png`, `bevelle-underground.png`) are untouched and keep their hashes, and the four
   strips are locked in the new set. The extended-plate files in the candidates folder were not used. **Chapter XIII does not draw the Bevelle plate**
   (`chapter-trema-ship.ts`: `sceneKey: 'via-infinito'`), so the wings show in Chapters IV and XV only.
4. **Three of D-325's attack replacements were judge-locked** (Grothia, Spathi in `chapter:isaaru:2026-09-25`; x2-Anima in `chapter:fallen-aeons:2026-09-24`); the
   morning page counted them as unpinned. D-325's yes names them (as it named Pterya's), so their entries in `judge-locked-hashes.json` moved to the new hash
   with a `supersedes` record (old hash, approval, backup), the house precedent.
5. **A file is written as a new file** (temp then rename), not over the old one: `public/art` in `D:/Final Fantasy` shares hard links with
   `D:/pyrefly-r21-road` (an old worktree), and an in-place copy would have changed that tree's paintings. The replaced paintings there keep their old bytes.
6. **`public/art/manifest.json`** was regenerated with `node tools/gen/manifest.mjs` (101 subjects, 651 poses; `states2x` lists the new masters). The three new
   figures and every new key are in it; a state nobody listed is never requested.

## Code that goes with the art (the checks needed it)

- **`src/engine/KoPoseScale.ts` (FFX-2 only):** the `yuna-white-mage` entry (0.64, for the old close-up KO) is gone, because the new KO (D-334, D-341) is a
  body-length match: 1,070 px long against a 1,151 px idle (0.93 at scale 1; the table would have drawn it at 0.64). `tests/unit/engine/ko-pose-scale.test.ts`
  gains the pin (5 tests).
- **`src/ui/common/face-crops.json` (FFX-2 only):** three new measured rows in `bodies` for `yuna-thief` (767x1176), `rikku-warrior` (648x1214) and
  `paine-thief` (735x1181). `tests/unit/ui-portrait-face-crop.test.ts` ("every dressphere a chapter can reach has a measured head") failed on the first full run
  without them: a painted dressphere with no row draws the generic head estimate in the HUD card. Measured with the repo's rig (`tools/portraits/
  measure-face-crops.mjs` probe windows read in file pixels, then checked by iris colour: Yuna's green and blue pupils, Rikku's green, Paine's red); the
  acceptance sheet (`docs/screenshots/art-install-2026-10-04/face-crops-new-rows-acceptance.png`) has the pupils on the house eye line, as the established rows do.
- **Branch `r38-wings`** (not merged): `paintPlateWings` and `Backdrop.adoptTexture`, see [r38-wings.md](r38-wings.md) on that branch.

## Checks

- `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: **753 ok, 0 mismatched, 0 missing** (634 before: +119; approved 705, judge-locked 48).
- `npx tsc --noEmit` clean. `npx vitest run`, the full suite, on the final tree: **795 files passed, 5 skipped (800); 11,677 tests passed, 44 skipped, 1 todo, 0 failed, 450 s.** An earlier full run, made while my builds and browsers were using the machine, failed four: the face-crop rows this install needed (fixed, above) and three slow tests that time out under load (`critic-release-rules`, `strategy-ffx2-bahamut` heal-only route, `ui-pause-stack`), which pass alone and in this run.
- On the final scratch build (`bytes-final.json`): `node tools/art-derive.mjs verify` PASS (1,005 masters, 539 WebP, 466 PNG, 0 problems); `audit` PASS (549 literal
  names, 0 dangling); **`node tools/art-browser-load.mjs`: 1,049 of 1,049 files load and decode at the master's size in Chromium 153 and WebKit 26.6, 0 failed, 20 of
  20 portrait plates living** (the brief's 941 before); `node tools/fx-assets.mjs verify --dir <build>/fx` PASS; `tools/art-play-audit.mjs` (real-play: every
  chapter to its first menu, pause, results): 22 of 22 scenarios pass (the title and chapter select with all 19 tiles, all 18 chapters and the unlisted FF7 fight to their first menu and pause screens, two results screens): 3,381 image requests (2,470 WebP, 911 PNG), every one answered 200 with an image, 0 HTTP errors, 0 console errors.
- The keys were looked at **in the real game** only where the brief asked (below), plus Rikku's Dark Knight hurt and KO. The other keys, the day pass and the Dark Knight KOs have been seen on the candidates'
  contact sheets at battle scale and not in a fight; their `scale` values are the candidates' by-eye proposals ("held to about +-10 percent in the in-game lineup"
  for the overnight sets, "want a look on the real battle frame" for the day pass).

## In the game (headless GPU Chromium from node, Playwright; the scratch build served on 7010; never the built-in pane)

Frames in `docs/screenshots/art-install-2026-10-04/`:

- **Chapter VI, Yuna Thief after a Change** (real keys: Change, Thief): `ch6-yuna-change-submenu-songstress-thief.jpg` (her ring: Songstress and Thief),
  `ch6-yuna-thief-twirl-forming.jpg` (the twirl with the new outfit forming, the "Yuna Thief" banner), `ch6-yuna-thief-idle.jpg` (she stands as a Thief, daggers
  drawn, HUD badge TH). All 24 `yuna-thief` requests (the sidecars and paintings of 11 states, among them the Thief's `twirl-forming` and `twirl-end`; her `twirl-start` and `twirl-going` play only when she changes out of Thief) answered 200, 0 console errors, 0 bad responses; the burst of frames shows the twirl run and the Thief land.
- **Chapter IV, the Bahamut wind-up** (`ch4-bahamut-wind-up-telegraph.jpg`): the possessed Bahamut's `telegraph` painting is up on the countdown beats (5, 4, 3, ...)
  with the heartbeat vignette; the 2x master and the 1x load with 200. Run at fast playback to reach the countdown; the pose lasted 209 ms there, so the hold at normal speed is the existing beat's.
- **Chapter I, Seymour Flux** (`ch1-seymour-flux-telegraph-hold.jpg`): `idle` then `telegraph` at 13,314 ms, `attack` at 14,447 ms: **the hold is 1,133 ms** (the second Lance 1,153 ms), the r38-keys
  lane's 1.14 s at the default pacing; three Lances, three telegraph poses, 0 errors.
- **Chapter IV, Rikku as a Dark Knight struck and downed** (`ch4-rikku-dark-knight-ko.jpg`; the party at 1 HP through the debug state, a sizing look): the new `rikku-dark-knight` hurt and KO
  paintings play (`hurt` 9,439 ms, `ko` 9,702 ms) and lie at a believable size beside Yuna the White Mage; 200 for both, 0 errors. Yuna's own KO was not caught (she heals herself or
  is not struck within the 150 s I gave it); the White Mage's KO size rests on the measurement (1,070 px against a 1,151 px idle, scale 1) and the unit pin.
- **The wings** (branch `r38-wings`, `wings-ch4-*` and `wings-ch15-*`, before and after at 2560x1080 and 2000x1012): the mirrored doubling is gone at both edges and the live camera puts
  the outer edges outside the frame in 24 of 24 rig-and-window cases; a faint join of the eye-candy slices' own edge is still visible at some rigs, as it was
  (see [r38-wings.md](r38-wings.md) "Disclosures").

## Registry changes (only what was installed)

- `docs/target/approved-hashes.json`: the new set **`bailey:2026-10-03-picks`** (70 images: words, decision list, note), **`bailey:2026-10-02-art`** extended by 24 (189),
  **`bailey:2026-10-01-art`** extended by 25 (129); the notes say what went in and what waits. 11 replaced paintings: two were locked in `bailey:2026-10-01-art` (Yuna Gunner's
  wind-up, Yuna Warrior's follow-through) and moved to the new hash with `supersedes` and `replacedBy`; three were judge-locked (below); the other six (the White Mage's hurt, KO
  and attack, Ifrit's, Ixion's and Bahamut's attacks) were in no lock.
- `docs/target/judge-locked-hashes.json`: three entries superseded (above).
- `docs/target/decisions.json` (one decision per line kept, `critic-policy-adoptions` 12 of 12): `delivery` D-325 `implemented`; D-336, D-338, D-341, D-352,
  D-355, D-356, D-357 `implemented`; D-315, D-339, D-340, D-343 `in-progress`; text appended to D-332, D-337, D-344. "implemented" is not "verified".
- `docs/target/targets.json`: no tile covers these paintings, so nothing changed.

## The exact `public/art` paths changed (for the checks that run against this tree tonight)

Everything below is under `D:/Final Fantasy/public/art/`; each `<state>` is a `<state>.png` and a `<state>.json` (a `@2x` state is `<state>@2x.png` and `<state>@2x.json`).
New unless marked **(REPLACED)**. Also: `manifest.json` regenerated. Nothing else under `public/art` was touched.

- `backdrops/wings/`: bevelle-underground-left, bevelle-underground-right, den-of-woe-left, den-of-woe-right
- `characters/anima/`: cast
- `characters/auron/`: idle@2x
- `characters/bahamut/`: attack (REPLACED), cast, ko
- `characters/baralai-shade/`: idle@2x
- `characters/braskas-final-aeon-2/`: telegraph
- `characters/ffx2-bahamut/`: telegraph, telegraph@2x
- `characters/grothia/`: attack (REPLACED), cast, ko
- `characters/guado-guardian/`: idle@2x
- `characters/ifrit/`: attack (REPLACED), cast, ko
- `characters/isaaru/`: idle@2x
- `characters/ixion/`: attack (REPLACED), cast
- `characters/lulu/`: idle@2x, od-fury
- `characters/mortiorchis/`: idle@2x
- `characters/mortiphasm/`: idle@2x
- `characters/paine-black-mage/`: follow
- `characters/paine-dark-knight/`: hurt, idle@2x, victory
- `characters/paine-thief/`: attack, cast, follow, hurt, idle, item, ko, ready, twirl-end, twirl-forming, twirl-going, twirl-start, victory
- `characters/paine-warrior/`: idle@2x, od-x2-warrior-armor-break, od-x2-warrior-power-break
- `characters/paine-white-mage/`: follow
- `characters/rikku/`: idle@2x
- `characters/rikku-alchemist/`: idle@2x
- `characters/rikku-black-mage/`: follow
- `characters/rikku-dark-knight/`: attack, hurt, ko
- `characters/rikku-thief/`: idle@2x
- `characters/rikku-warrior/`: attack, cast, follow, hurt, idle, item, ko, ready, twirl-end, twirl-start, victory
- `characters/rikku-white-mage/`: follow, twirl-start
- `characters/seymour-flux-body/`: idle@2x, telegraph
- `characters/seymour-macalania/`: idle@2x
- `characters/seymour-natus/`: idle@2x
- `characters/seymour-omnis/`: idle@2x
- `characters/shiva/`: cast
- `characters/shuyin/`: cast, telegraph
- `characters/spathi/`: attack (REPLACED), cast, ko
- `characters/tidus/`: idle@2x, od-energy-rain, od-slice-and-dice
- `characters/vegnagun-body/`: cast
- `characters/vegnagun-head/`: cast
- `characters/vegnagun-leg/`: cast
- `characters/vegnagun-tail/`: cast
- `characters/wakka/`: idle@2x
- `characters/x2-anima/`: attack (REPLACED), cast
- `characters/x2-shiva/`: cast, idle@2x
- `characters/yojimbo-cavern/`: idle@2x
- `characters/yu-pagoda/`: idle@2x
- `characters/yuna/`: idle@2x
- `characters/yuna-black-mage/`: follow
- `characters/yuna-dark-knight/`: hurt, idle@2x, ko
- `characters/yuna-gunner/`: idle@2x, ready (REPLACED)
- `characters/yuna-thief/`: attack, cast, follow, hurt, idle, item, ko, ready, twirl-end, twirl-forming, twirl-going, twirl-start, victory
- `characters/yuna-warrior/`: follow (REPLACED)
- `characters/yuna-white-mage/`: attack (REPLACED), follow, hurt (REPLACED), idle@2x, ko (REPLACED)

119 images and 119 sidecars (238 files). The replaced ones, with the sha256 they held and where the old file and its sidecar are:

- `characters/yuna-gunner/ready.png`: held `39008abdf2b42e9874c0233b3679037a6e576193ee80342c79aa46017ad53672` (457,996 bytes), replaced for D-341 (D-333); the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/yuna-gunner/ready.png` (+ `.json`)
- `characters/yuna-warrior/follow.png`: held `543cdabd481b6b7eff65ca97821103a4ef40d40097b219e82552fff70e25386d` (415,327 bytes), replaced for D-341 (D-333); the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/yuna-warrior/follow.png` (+ `.json`)
- `characters/yuna-white-mage/hurt.png`: held `f9581629c3277e3fa1a6286903fc56b27251b50d7d3d8ce7f6f6c6c16c6992b0` (466,054 bytes), replaced for D-341 (D-334); the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/yuna-white-mage/hurt.png` (+ `.json`)
- `characters/yuna-white-mage/ko.png`: held `300097d833fbd47158494a2c6353c163f34305c4a81a555d7a442ea0c7e18948` (600,630 bytes), replaced for D-341 (D-334); the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/yuna-white-mage/ko.png` (+ `.json`)
- `characters/yuna-white-mage/attack.png`: held `047796e8df6dee89ed123db76b0dc7cda43217181e3aaee2eaaf473ff8c8c458` (768,379 bytes), replaced for D-341 (D-334); the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/yuna-white-mage/attack.png` (+ `.json`)
- `characters/ifrit/attack.png`: held `1b0c3babcea387531a27833b82b1b2dd0cd0b8d0d083d8e3b396915cd22acf5c` (862,365 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/ifrit/attack.png` (+ `.json`)
- `characters/ixion/attack.png`: held `d6f0507e24c346e413b6112c4680b1ecdcb14c1e5e8d42d82aacc65e88bea0d9` (798,156 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/ixion/attack.png` (+ `.json`)
- `characters/bahamut/attack.png`: held `2fb9945ab52e782e826a70f3c43a91b95a639011bd5f779526b5021c8c0e4754` (1,022,834 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/bahamut/attack.png` (+ `.json`)
- `characters/grothia/attack.png`: held `e7b9b00b366d2f4520f70bedad1276de852583559c2791cc4806f208d9727df4` (978,948 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/grothia/attack.png` (+ `.json`)
- `characters/spathi/attack.png`: held `fb6c6538fd72b77685f4b162996aa6c0b2f04dc765ab4277fd04dd2c69d060f9` (1,111,053 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/spathi/attack.png` (+ `.json`)
- `characters/x2-anima/attack.png`: held `b84e67f3eca1bd61041d2b5ab3a6742a502211f40ccb1ea012f6efac22571d77` (1,070,055 bytes), replaced for D-325; the old file and its sidecar are in `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/backup/replaced/characters/x2-anima/attack.png` (+ `.json`)

`public/art` is local-only and gitignored; the new files are not in git. The hashes are in `docs/target/approved-hashes.json`.

## Where things are

- Package and backups: `D:/Tools/pyrefly-art-backup/approved/2026-10-04-art/`. Candidates stay where they were (`candidates/2026-10-03-overnight/install-ready/`,
  `candidates/2026-10-03-day/`, `approved/2026-10-02-art/held/`, `approved/2026-10-01-art/held-2x/`); nothing was deleted from them.
- Scratch: `D:/Tools/pyrefly-scratch/2026-10-04/art38/` (the builds `dist` and the code-only `dist-main-code`, `dist-wings-code`, the proof harness and frames `proof/`,
  `logs/`, the scripts; `dist` is the final 1,934-file build the numbers above and the load gate were taken on). The wrapper configs live there, not in the repo root. The
  scratch copy of the 2x masters used for sizing was parked (moved, not deleted) to `F:/pyrefly-parked/2026-10-04/art38/size-masters/`.
- The worktree `D:/pyrefly-r38-wings` (branch `r38-wings`) carries three junctions (`node_modules`, `public/art`, `public/fx`) into this tree: **whoever removes that
  worktree must `cmd /c rmdir` each junction first, never recursively** (the 2026-09-26 incident).
- The servers I started (static servers on 7010, 7011, 7012) were stopped by PID.
