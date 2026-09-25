# Poses repair cycle 1: head scales re-measured, failed slots back on the standing painting (2026-09-25)

**Game case: FFX-2 only.** These are the 22 FFX-2 dressphere poses installed on Bailey's word
(D-179: "I'll go with your recommendations for everything").

The independent verifier found two blockers:

- **V-1:** the head-matched `scale` in the sidecars was wrong for some poses. Rikku Alchemist's
  item pose grew in Chapter XIII.
- **V-2:** six failed slots showed a neighbouring painting instead of the standing painting.

Both are fixed here.

## V-1: the scales

**What went wrong.** The judge read one distance, eye line to chin, by eye. On several paintings
its chin point sat on the mouth or on a scarf edge, not on the chin:

- Paine Dark Knight item, Rikku Alchemist item, White Mage and Black Mage poses;
- the Rikku Alchemist and White Mage idles, whose open grins hide the jaw line.

The builder's in-game proof (the pose's size over the idle's equals the sidecar) only showed that
the engine applies the sidecar. It never checked the reading itself.

**How it was re-measured** (scratch tools in `D:/Tools/pyrefly-scratch/pose-rescale/`):

1. **Eye spacing.** Each iris is found by its colour (the centroid of the iris-coloured pixels),
   seeded by the judge's eye point. Where that point missed the iris, it was reseeded by hand. The
   marks were checked on crops.
2. **Eye line to chin.** The judge's chin point was checked on marked crops, and 13 were corrected
   (`chinsCorrected` in `head-measure.json`). Chins under a scarf, a collar or hands give no
   reading.
3. **Ratios.** Each ratio is idle over pose, so it is the scale that makes the pose's head the
   idle's size. (The engine draws the pose's pixels at `scale` times the idle's pixel size.)
4. **When the two readings agree** within about 6 percent, the scale is their mean.
5. **When they disagree,** the head's turn or tilt decides. A face turned further than the idle
   has narrower eye spacing, and a raised or lowered face is shorter from eye line to chin. Either
   one inflates its ratio, so the reading the pose does not shorten is used. Each pose's reason is
   in the table and in its sidecar's `scaleNote`.
6. **Visual check.** `heads-1.jpg` to `heads-4.jpg` show, for every pose, the idle head, the
   installed scale and the corrected scale. The grid is 10 idle pixels and the eye lines are
   aligned.

**14 changed, 8 kept** (a kept pose's readings already sit within about 5 percent of its scale):

| Pose | Installed | Corrected | Eye spacing | Eye line to chin | Basis |
|---|---|---|---|---|---|
| paine-black-mage/attack | 0.93 | **1.05** | 1.04 | 1.06 | agree |
| paine-black-mage/cast | 1.00 | 1.00 | 1.11 | 1.02 | kept; three-quarter turn shortens her eye spacing |
| paine-black-mage/item | 0.95 | **1.03** | 1.01 | 1.05 | agree |
| paine-black-mage/victory | 1.14 | 1.14 | 1.12 | 1.17 | kept |
| paine-dark-knight/attack | 1.19 | **0.92** | 0.83 | chin hidden | eye spacing is a floor (the idle is turned further); eye line to mouth, 0.97, is a ceiling |
| paine-dark-knight/item | 1.35 | **0.98** | 0.99 | 0.97 | agree; the judge's chin point was on the mouth |
| paine-warrior/victory | 1.24 | **1.01** | 1.01 | 1.25 | turned like the idle; the smile raises the chin |
| rikku-alchemist/cast | 0.96 | 0.96 | 0.92 | 1.12 | kept; the idle's grin lengthens its face |
| rikku-alchemist/hurt | 1.30 | **1.08** | one eye | chin hidden | the open iris matches the idle's (a floor) |
| rikku-alchemist/item | 1.46 | **1.15** | 1.20 | chin hidden | also within 5 percent of the verifier's 1.14 (eye to chin) and 1.10 (headband) |
| rikku-alchemist/victory | 1.09 | **1.16** | 1.16 | chin hidden | eye spacing |
| rikku-black-mage/attack | 1.52 | **1.26** | 1.24 | 1.29 | agree |
| rikku-black-mage/cast | 1.23 | **1.04** | 1.28 | 1.04 | an upturned three-quarter face shortens her eye spacing |
| rikku-gunner/cast | 0.99 | 0.99 | 1.01 | chin hidden | kept |
| rikku-gunner/victory | 0.99 | 0.99 | 1.03 | chin hidden | kept |
| rikku-thief/ko | 1.31 | 1.31 | 1.28 (closed eyes) | chin hidden | kept |
| rikku-white-mage/attack | 1.13 | **0.94** | 0.89 | 1.09 | the idle's grin lengthens its face |
| yuna-black-mage/item | 1.66 | **1.34** | 1.21 | 1.48 | the two readings straddle it (a turned, lowered face); mean |
| yuna-dark-knight/attack | 1.11 | **1.00** | 1.02 | 0.97 | agree |
| yuna-gunner/item | 1.09 | 1.09 | 1.12 | 1.33 | kept; the lowered face shortens eye to chin |
| yuna-songstress/item | 1.38 | 1.38 | 1.36 | 1.32 | kept |
| yuna-warrior/victory | 1.36 | **1.28** | 1.28 | 1.29 | agree |

**Confidence.**

- The agreeing rows are good to about 3 to 5 percent.
- These four are judgement within about 8 percent:
  - Paine Dark Knight attack: collar over the chin, turned differently from the idle;
  - Rikku Alchemist hurt: one eye visible, head thrown back;
  - Rikku Black Mage cast: upturned three-quarter face;
  - Rikku White Mage attack.

**Where the files are.**

- Only the sidecar `.json` files changed. No PNG was touched: `verify-approved.mjs` gives 224 ok
  before and after.
- The sidecars are in `public/art` (gitignored, local).
- Backups of the old and new sidecars: `D:/Tools/pyrefly-art-backup/20260925-pose-rescale/before/`
  and `after/`.

## V-2: failed slots show the standing painting

`src/engine/BattlePresenterArt.ts`:

- An FFX-2 dressphere painting (`<girl>-<dressphere>`, `isDresspherePainting`) now resolves
  `cast`, `item` and `ko` straight to the idle when that slot has no painting. It uses
  `DRESSPHERE_POSE_FALLBACKS`.
- FFX figures and every enemy keep the old chain: cast to attack, item to cast, ko to hurt.

Before, seven failed slots showed a neighbour:

- Yuna Dark Knight, Paine Dark Knight and Rikku White Mage cast showed their attack painting.
- Rikku Black Mage and Rikku Gunner item showed their cast painting.
- Rikku Alchemist ko showed her hurt painting.
- Yuna Songstress cast showed her attack painting. That slot was judged and failed, and it had
  borrowed since before this install.

`resolved-pose-maps-after.json` is the game's own `resolvePoseMap` run in the dev build. It
shows every one of the seven on `idle.png`. `tests/unit/engine/dressphere-pose-fallbacks.test.ts`
pins both the new dressphere rule and the unchanged FFX and enemy chain.

## In-game proof, real keys (`frames/`)

The runs were headless, in gpu mode, on a dev server started for these runs. Each went through
the title, chapter select and party prep with real keys, then used real-key commands. The script
is `D:/Tools/pyrefly-scratch/pose-repair1/run.mjs`, adapted from the verifier's own.

- **XIII at 1600x900 and 390x844:**
  - The line-up poses show at their corrected scales. The in-game ratio equals the new sidecar:
    Paine Dark Knight attack 0.92 and item 0.98, Rikku Alchemist item 1.15, hurt 1.08 and
    victory 1.16.
  - Yuna and Paine Dark Knight cast Darkness on their standing painting: `*-idle-for-cast.jpg`,
    with URL `idle.png`.
- **IV at 1600x900:**
  - Yuna Black Mage item shows at 1.34, Rikku Black Mage cast at 1.04 and Yuna Warrior victory
    at 1.28.
  - Rikku Black Mage and Rikku Gunner use a Potion on their standing painting:
    `*-idle-for-item.jpg`.
  - Rikku Black Mage attack is staged. Black Mage has no Attack command.
- **Before and after:** `cmp-XIII-390x844-rikku-alchemist-item.jpg` is the verifier's case.
  Rikku no longer stands taller than Yuna, who is nearer the camera.
  `cmp-IV-1600x900-yuna-black-mage-item.jpg` shows Yuna Black Mage's item pose.

**Labelled debug steps (in each json's `debugNotes`):**

- Party HP is topped up so the fight lasts.
- Enemy HP is set to 1 for the victory moment. The XIII victory is a separate short run
  (`*-victory.json`), because in the long run Rikku was changed out of Alchemist before the end.
- The first IV run was lost at turn 33, so its two victories come from a second run
  (`IV-1600x900-b.json`).
