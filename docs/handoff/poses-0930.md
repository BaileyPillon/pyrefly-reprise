# Handoff: the 2026-09-30 approved poses (Sleep, Low HP, Bahamut splash, Paine Songstress)

Branch `poses-0930` (worktree `D:/pyrefly-fb-onboard`, from main 9299b319). **Not pushed, not merged, not deployed;
nothing written under `public/art` or to `docs/target/approved-hashes.json`** (release 33's deep review reads main's
`public/art` through a junction). Release 34 material.

Bailey, 2026-09-30 ~09:40 EDT, verbatim: "all your recommendations, godspeed" (D-298; Kimahri held, D-299).
Paper preflight (late, disclosed): `docs/plans/poses-0930-review.md`; `critic-plan --paths` says DEEP (focused before
deploy, deep after).

## Game case (rule 14)

- **Both games, each its own rule**: the Sleep hunch (both sources describe the same look) and the low-HP painting,
  per character. FFX: the slouch, HP **below 50 %** of max, the same line as the HUD's yellow digits
  (`FFX_HP_YELLOW_BELOW`, research/ffx-combat-core.md V8 "HP < 50 % of max"). FFX-2: the kneel, HP **below 33 %**,
  the HUD's gold digits (`hpClass`, research/ffx2-combat-core.md §4.9). Sources: research/status-display.md §2 and §3.
- **FFX-2 only**: the Bahamut Mega Flare splash (Chapter IV) and Paine's Songstress attack and hurt.

## What is built

**(A) The `sleep` and `critical` pose slots** (`src/ui/common/restPoses.ts`, wired in `withStatusLooks.ts`;
`BattlePresenterArt.PARTY_POSES` gains the two names with fallbacks to `idle`).
- A party member **rests** in: KO → the presenter's KO pose (this module stands aside); **Petrify** (both) and
  **Stop** (FFX-2) → HOLD the painting it had; **Sleep** → `sleep` (over low HP); **low HP** → `critical`; else `idle`.
  Zombie, Berserk, Curse and Pointless are tints on whatever painting is up, so they combine.
- Only a request for a resting pose (idle, sleep, critical) is turned into the current rest, through the figure's
  own `setPose` (wrapped per figure, restored on unmount). Every presenter pose (ready, attack, cast, item, hurt,
  defend, victory, ko) is untouched, and every "back to idle" (action end, flinch return, revive, spherechange)
  lands on the right painting. A stale rest request after a hit woke the sleeper lands on the current rest.
- **Fallback**: a figure without its own painting for the pose (Kimahri, every FFX-2 dressphere except Gunner,
  Warrior and Thief) keeps today's standing painting (`paints(id, pose)` is asked first; the pose map falls back to
  idle).
- **Status marks stay on top, on the painted head**: while a sleep or critical painting is up, the marks (Z's,
  bubbles, stars, halo) anchor on that painting's own head (`headTop` in its sidecar, fractions of the opaque box,
  read by eye: `docs/concepts/poses-2026-09-30/heads-top.jpg`); otherwise the field's standing head as before.
- **REDUCE MOTION**: nothing new moves (the swap is the figure's usual crossfade); with the OS reduced-motion
  preference the marks' running animations are 0 while the paintings still swap (3 Z animations without it).
- **Decided here (question 1 below)**: the `ready` pose (the command menu for that member) keeps the standing
  painting and its turn ring, so a low-HP member stands up while choosing a command and slouches again after.

**(B) Bahamut's Mega Flare splash**: `splashArtFor` returns `characters/ffx2-bahamut/splash.png` for FFX-2
Bahamut's Special (Mega Flare is his only entry in `SPECIALS`) once the manifest lists it; before the install it
returns null (slab, lines, name, as today; no 404). FFX's Bahamut and every other splash unchanged.

**(C) Paine Songstress attack and hurt**: art only; the dressphere pose map already reads `attack` and `hurt`
when the manifest lists them (they fall back to standing today).

**(D) The staged install package**: `D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/`
- `characters/<id>/<slot>.png | .json | .prov.json` under the exact public/art paths: 21 PNGs (18 sleep/critical, Paine
  Songstress attack + hurt, `ffx2-bahamut/splash.png`), each sidecar with size, baseline, the measured `scale`, facing,
  the recipe, `headTop`, `game`, `status`, `candidateOf` + `candidateSha256`, `decision: D-298`.
- `hashes.json` (the 21 PNG hashes), `install.mjs` (dry run by default), `work/` (every tool and measurement).
- **Auron critical cand-4: the floor patch was removed cleanly** (pixels made transparent only, no repaint: the
  floor, its dark shadow strokes and the white backdrop it trapped between the coat and the sword; the sword's gold
  end cap kept). `work/fix_auron_floor.py` + report; before/after `docs/concepts/poses-2026-09-30/auron-critical-floor-fix.jpg`.
  cand-45 was not needed. Every other PNG is the candidate byte for byte.
- **Scales re-measured** against each installed idle (the boss-pose method: gridded head crops, `work/heads.py`,
  `work/headscale.py`), held inside that install's stature gate (at least 0.60 for a bend, hunch, kneel or lunge);
  `docs/concepts/poses-2026-09-30/scales.json` + `scale-check.jpg`. The overnight agents' eye scales were often 15
  to 40 % high; the measured ones:

| Painting | Scale (overnight guess) | Rule |
|---|---|---|
| Yuna sleep / critical | 0.80 (1.15) / 1.00 (1.15) | head match |
| Auron sleep / critical | 1.00 (1.2) / **0.64** (0.8) | critical: head match 0.45 would stand 0.43 of the idle; raised to the 0.60 stature floor (a close-up render, head about twice the idle's share) |
| Wakka sleep / critical | 1.00 / 1.05 | head match |
| Lulu sleep / critical | 0.80 / 0.72 | head match |
| Rikku (FFX) sleep / critical | 0.80 / 0.80 | head match |
| Tidus sleep / critical | 1.00 (1.15) / 0.95 (1.05) | head match |
| Yuna Gunner sleep / critical | 1.00 / **0.99** | critical: head match 0.90 would stand 0.55; stature floor |
| Paine Warrior sleep / critical | 0.90 / 0.90 | head match |
| Rikku Thief sleep / critical | 1.05 / 1.05 | body height (the Thief rule, her idle's head is 1.4 to 1.7x) |
| Paine Songstress attack / hurt | 1.05 (1.1) / **0.66** (0.65) | hurt: head match 0.57 would stand 0.52; stature floor |

## THE INSTALL, for the driver, AFTER release 33 is live

```
cd "D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses"
node install.mjs --dry-run                       # lists 42 files, the manifest step, the lock; writes nothing
node install.mjs --apply                         # --repo="D:/Final Fantasy" is the default
node D:/Tools/pyrefly-lora/tools/verify-approved.mjs   # ROOT = the repo: 0 mismatched, 0 missing expected
cd "D:/Final Fantasy" && npx vitest run tests/unit/engine/pose-install-0930.test.ts tests/unit/rest-poses.test.ts tests/unit/bahamut-splash.test.ts tests/unit/engine/pose-install-songstress-0929.test.ts
```
`--apply` checks the package against `hashes.json`, copies each PNG + sidecar into `public/art/characters/<id>/`
(refuses before writing anything if any target holds different bytes; a target with the same bytes is skipped),
runs `node tools/gen/manifest.mjs` and checks every new state is listed, then adds the set
`bailey:2026-09-30-poses` (Bailey's words, D-298, one entry per PNG) to `docs/target/approved-hashes.json` in the
file's own format. Run twice: the second run copies nothing and leaves the hash file alone (rehearsed on a scratch
copy of the repo: 42 copied then 0; the hash-file diff was insertions only). Nothing is deleted. Then commit
`docs/target/approved-hashes.json` (the art itself is gitignored) and set D-296 and D-298 `delivery: implemented`.
Merge `poses-0930` (the code) in the same release: before the install, the code alone changes nothing visible
(every rest pose falls back to standing; the splash stays slab-only).

## Proof (production build of the branch, the staged art by request routing)

`vite build --outDir D:/Tools/pyrefly-scratch/poses-0930-install/dist` (not `npm run build`, whose `prebuild` would
touch the shared manifest), `vite preview` on 8731 (stopped), headless Chromium on the GPU,
`docs/concepts/poses-2026-09-30/final/src/proof.mjs` (routes every `art/characters/<id>/<file>` of the package and
adds the new states to the served manifest, as install.mjs would). Every JSON in `final/shots/` lists what was
STAGED. Sheets, approved candidate left and build right: `final/*-target-vs-build.jpg`; key frames also in
`docs/screenshots/poses-0930/`.

| Moment | What the live actors showed (read off the figures) |
|---|---|
| Ch I (FFX) desktop + phone | Yuna `sleep` (sleep.png) with the Z's on her bowed head; Auron `critical` (critical.png) while Wakka attacks; after Auron's own Attack **by real keys**: ready (idle.png) → attack → critical within 0.2 to 0.6 s; Auron and Wakka both `critical` |
| Ch IV (FFX-2) desktop + phone | Yuna Gunner `sleep`; Paine Warrior's Attack by real keys: ready → attack → `critical` (the kneel); **Bahamut's own Mega Flare** reached in the fight (autoBattle "intended") with the new painting in the cut-in: 1656 px natural, drawn 828 px tall at bottom-right, opacity 1 |
| Ch XIII (FFX-2) desktop + phone | Paine Songstress Attack by real keys: songstress/attack.png; a real enemy hit: songstress/hurt.png, world height 1.057 |
| REDUCE MOTION (OS preference), Ch I desktop | the paintings swap the same; status-mark animations 0 (3 without) |

STAGED, labelled in each JSON: Sleep and HP written into the engine state before the presenter's own `syncHud` (the
module reacts by itself; the script never calls `setPose`); reserve members switched in with the engine's Switch
rows (Ch I); Yuna dressed as Gunner (Ch IV opens in White Mage) and Paine as Songstress (Ch XIII opens in Dark
Knight) with `stage.setArt`; party HP topped up and Itchy lifted while waiting for events. **0 page errors, 0
console errors, 0 responses of 400 or more** in every run.

Distance from the target: the same paintings in the same moments. The Paine Warrior kneel and the Yuna sleep read
smaller than on the overnight composites, which drew them at the agents' guessed scales (1.15); the measured head
match is 0.90 and 0.80. The Mega Flare title stamps over the dragon's wing (the build's title sits at 30 % for the
CHARGING slab, fx-d must-fix 6; the approved mock drew it at 7 %); it stays on top and readable.

## Gates

`npx tsc --noEmit` clean. New tests: `tests/unit/rest-poses.test.ts` (14: the source table per game, HUD agreement
for every HP 1..100, precedence, fallback, action poses untouched, stale rest, hold, KO/revive, dispose, the marks'
head, the pose map, and a real Chapter I battle through the tap: 378 rest checks, 39 in the critical painting, the
event transcript identical with and without the tap), `tests/unit/bahamut-splash.test.ts` (3),
`tests/unit/engine/pose-install-0930.test.ts` (the package now; the installed files and the lock once installed).
Full suite once: 694 files passed, 1 failed: `strategy-ffx2-bahamut` "heal-only route" timeout (15 s), the known
load timeout on main, an engine test this branch does not touch. `node tools/orphans.mjs`: 24 (unchanged; the new
module is reachable). Changed files are all under 400 lines. No CONTRACTS file touched; nothing under `src/battle`.

## Not done / open

- The in-battle proof covers the moments the brief named; Lulu, Rikku (FFX), Tidus and Rikku Thief are proven by the
  pose-map test and the scale sheet only.
- Tidus sleep keeps the pilot's disclosed defects (the blade tip cut at the canvas edge, a thin orange stroke by the
  feet); byte for byte as approved.
- FFX's second stance under 25 % HP is not painted (one painting stands for both bands).
- The Seymour kneel / KO candidates (D-299's note) are not part of this branch.

## Questions for Bailey

1. While a low-HP member's command menu is open, should they stay in the slouch or kneel (today: they stand, with
   the turn ring, and slouch again after acting)? No source says either way.
2. Three paintings were drawn much larger than their idles (Auron's slouch, Yuna Gunner's kneel, Paine Songstress's
   hurt), so their heads read about 1.2 to 2x the idle's at the size the body needs. Keep, or re-render those three
   at the idle's proportions?

## CHECK (independent, 2026-09-30, not the builder)

Verdict: **one blocker in the install package (Auron critical), the code passes.** Branch `poses-0930` at 329eb535,
production build of the branch to `D:/Tools/pyrefly-scratch/check-poses-0930/dist` (a scratch folder, not the shared
`dist/`), vite preview on 8881 (stopped by PID), headless Chromium on the GPU. The staged package was served by route
interception and the manifest was extended in flight. Nothing was written under `D:/Final Fantasy/public/art`: the
manifest is still Sep 29 08:25, there is no `sleep.png`, `critical.png` or `ffx2-bahamut/splash.png` there, and
`approved-hashes.json` is unchanged. Scripts, JSON records and shots are in `D:/Tools/pyrefly-scratch/check-poses-0930/`
(`check.mjs`, `splash.mjs`, `probe.mjs`, `out/`).

Game case: both games for the rest poses, each game with its own threshold. The Songstress and Bahamut paintings are
FFX-2 only.

**What holds**
- Picks: all 21 PNGs match hashes.json. Each sidecar's `candidateOf` is the pick Bailey approved (Yuna 56/3, Auron 20/4,
  Wakka 45/6, Lulu 62/42, Rikku 12/10, Tidus c3/c3, Yuna Gunner 31/6, Paine Warrior 36/16, Rikku Thief c3/c1,
  Songstress A1-attack-19/H1-hurt-121, Bahamut B10-flare-55-core). Every source's sha matches the candidate, and
  every PNG is the candidate byte for byte except Auron critical (edited). There is no Kimahri file.
  `node install.mjs` (a dry run) lists exactly 42 files (21 PNGs and 21 sidecars) and the set `bailey:2026-09-30-poses`,
  and writes nothing.
- Rules checked against `research/status-display.md` §2/§3 and the HUDs. FFX: critical below 50 % (`FFX_HP_YELLOW_BELOW`,
  ffx-combat-core V8). FFX-2: below 0.33 (`hpClass`, §4.9 / §6.1). Sleep takes precedence over low HP. Petrify (both
  games) and Stop (FFX-2) hold the current painting. Stop in FFX is not a hold (FFX has no Stop status).
- In the browser, every approved rest painting was shown in its own game: 7 FFX art ids in Chapter I and 6 FFX-2 art
  ids in Chapter IV, each through 10 moments, 130 checks per device. The moments were: full HP; exactly at the
  threshold (idle); one HP below (critical); sleep with low HP (sleep); sleep at full HP; petrify set while asleep
  (hold); low HP; Stop (hold in FFX-2, none in FFX); clean. Desktop 1600x900: 130/130. Phone 390x844: 129/130. The
  one miss was the FFX-2 at-threshold moment. A probe on the same slot gives 607/1839 = idle and 606 = critical,
  repeated. The miss came from an enemy ATB hit landing during the staging (the painting follows the HUD sync, the
  same as the digits), not from the rule. STAGED: statuses and HP were written into the engine state, followed by
  `presenter.syncHud`; each figure was dressed with `stage.setArt` on one slot. The real switches and real-key
  attacks are in the builder's proof.
- Fallbacks: Kimahri, Yuna Songstress, Rikku Gunner and Paine Songstress (for sleep and critical) keep `idle.png` in
  every moment. A bare run (package not served) keeps today's idle for all 13 art ids, with 0 responses of 400 or
  more.
- The Songstress `attack` resolves to `paine-songstress/attack.png` and `hurt` to `hurt.png`. In the bare run both
  fall back to idle.
- Mega Flare splash (staged with `fx.actionOpen`): `ffx2-bahamut/splash.png` renders at 1656x1656 at opacity 0.98 on
  desktop and phone. In the bare run the page makes no request for it and there is no image (slab only).
- Every run had 0 page errors, 0 console errors and 0 responses of 400 or more.
- `tsc --noEmit` is clean. The targeted tests pass (rest-poses 14, bahamut-splash 3, pose-install-0930: 2 skips,
  expected before the install). The full suite ran once: 694 passed, 1 failed. The failure is the
  `strategy-ffx2-bahamut` "heal-only route" timeout (44 s under load). Run alone, the file passes 19/19 and that test
  takes 8.3 s. It is an engine test this branch does not touch.
- Changed files: withStatusLooks 317→324, PartyStatusWindow 93→99, BattlePresenterArt 278→284, battleSpectacle
  153→159. All are under 400 lines, and none was over 400 before.
- `git merge-tree main poses-0930` is clean (fast-forward from 9299b319). Nothing under `src/battle` changed.

**Blocker**
- B1: Auron critical (cand-4) still has a white wedge of the render backdrop, about 7,000 px, between the scabbard and
  the rear leg at x≈360–470, y≈650–820 of the 832x1116 PNG. It is visible in game as a pale sliver between his legs
  (`out/zoom2.jpg`, `out/auron-crit-w.jpg`). The trapped-white clear stopped at row 820 (the report says "below row
  820"), so the claim that the trapped white backdrop was removed holds only below that row. Fix: extend the
  trapped-white pass upward (the connected near-white region, transparency only, no repaint), then update
  hashes.json, the sidecar and prov records, and the rehearsal. Run the install only after that.

**Minor**
- Wakka critical (scale 1.05) stands 1.058 of his idle's height while hunched. In game his head reads about 10–20 %
  larger than the idle's (`out/wakka-tidus.jpg`). A candidate for Question 2's re-scale list.
- Lulu sleep (cand-62) has a small detached white object on the floor by her feet. It is byte for byte the approved
  candidate, so it is recorded here and not changed.
