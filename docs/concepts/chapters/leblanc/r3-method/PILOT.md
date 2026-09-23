# Art method r3 pilot: Leblanc cast (repair) and hurt (a vs b)

**FFX-2 only** (chapter 6, Leblanc). The method is shared plumbing, but this pilot tests it on
Leblanc only. Run on 2026-09-23 under `docs/plans/art-method-r3/METHOD-CHECK.md` section 3
(P0 to P7). Nothing went into `public/art` or `docs/target/approved-hashes.json`. There were no
downloads and no `src/` or `tests/` edits. Every candidate lives in
`D:/Tools/pyrefly-lora/leblanc/r3/`. The scores below are **my own self-scores, not a pass**. An
independent 1:1 judge has not seen this yet.

Sheet: `sheet.jpg` (idle | cast.r2.2 | pilot cast, whole and 1:1 crops, provenance maps,
hurt (a) vs (b) at 1:1 and in battle).

## Result in one paragraph

**Cast.** The transplant puts the idle's own obi, knot, tassel and medallion on cast.r2.2, and
it removes the second tassel and its beads. Outside the mask and band, the file is
byte-identical to r2.2. The obi median is 1.17 CIEDE2000 from idle's (r2.2: 6.75). The tassel
is 2.09 (r2.2: 15.72). The choker carries the idle's row of studs, but it misses two gates. Its
median is 7.18 (r2.2: 11.53; bar 3), because at 13 px tall the warped part's edge pixels and the
ring lock lighten it. There is also a smudge at its right end that a judge can name at 2x. Of the
three pass-2 gates, the literal seam-gradient and invented-colour gates both read FAIL. The
controls in the tables show both are measurement limits, not re-invention.

**Hurt (b).** The bake passes every number: 96.95 % idle pixels, head chord 1.000, height
98.3 %. It leans back cleanly with no hinge or tear. At 1:1, though, the eyes-shut face over
the idle's unchanged smirk reads as amused as much as hurt, and the neck patch uncovered under
the jaw is a flat grey-beige shape.

**Self-verdicts:** obi 7, choker 7 on identity, with the seam and colour gates failing.
(b) reads-as-hurt 6. That fails rule 3, so **(b) is dead and hurt ships as (a)** unless an
independent judge scores it at 7 or more. At game size (b) reads a little more as a recoil.
**Transplant: NOT dead by the kill rule as I score it, but the cast does not pass rule 2.**
An independent judge decides.

## Anchors (P0)

| | before | after |
|---|---|---|
| `public/art/characters/leblanc/idle.png` sha256 | `4fea45f98bf44e7aa6aebf0004a2f845f268ebf974992bdd559b3b5258c9094b` | `4fea45f9...afab`, unchanged |
| installed `cast.png` (= cast.r2.2 `...choker82202.nk1.sm82302`) | `49d3c55f0875cc5c9ee2a1fd45966b4dd936268572d2ab3518d536d98a880d66` | `49d3c55f...0d66`, unchanged |
| `verify-approved.mjs` | ok 115, mismatched 0, missing 0 | ok 115, mismatched 0, missing 0 |

GPU gate: `/queue` was empty for 3 consecutive minutes before the first prompt. After that it
ran one prompt at a time behind an empty queue, and ComfyUI was never restarted. No frame was
all black (max RGB 255 on every output).

## GPU (summed from the ComfyUI history API, `gpu-ledger.json`)

| Step | Prompts | GPU min |
|---|---|---|
| P3 seam repaint (obi, choker x 4 seeds, d 0.25/0.35) | 8 | 2.02 |
| P4 hole repaint, 3 passes x 4 seeds (d 0.30/0.45) | 12 | 2.91 |
| P4 eye wince, 2 variants x 4 seeds (d 0.50/0.60) | 8 | 1.38 |
| P6 cast re-run (obi, choker x 4 seeds) | 8 | 1.75 |
| **Total** (plan 22, cap 60) | **36** | **8.09** |

SAM (P1) ran on the CPU (0 GPU). The warps, locks, fills, merges and gates are CPU only.

## P1 atlas (`atlas.py`, SAM 2.1 hiera-small, CPU, snapped to ink)

The masks and overlays are in `D:/Tools/pyrefly-lora/leblanc/r3/atlas/`, and the Lab quantiles
are in `atlas.json`. Idle masks: obi (band and knot as SAM returned them), knot, tassel with
medallion, choker, fan, plus the six rig parts (head, torso, fan arm, far arm, sleeves, legs).
cast.r2.2 masks: obi, knot, tassel, the second tassel, its two beads (added in P6), and choker.
SAM scores were 0.75 to 0.95. I looked at every overlay before using it.

## P2 transplant (`transplant.py`, `cast-landmarks.json`)

- I placed landmarks by hand on grid crops: 9 for the obi and knot, 8 for the tassel, 6 for the
  choker. The warp is piecewise-affine over the Delaunay triangulation of the destination
  points, with a least-squares affine outside it. It runs on a 2x Lanczos canvas and comes down
  once with INTER_AREA. The implied scale is about 0.885 (cast.r2.2 sidecar scale: 1.16).
- **Lab ring lock, the first look.** As literally specified, a quantile map between the ring
  just outside the mask in each file compared different materials: thigh skin against white
  dress, and neck skin against dress. It bleached the crimson and cut the choker's chroma to
  0.6 (`p2-ring`). The fix is the **material-matched ring lock**, now the default. It pairs
  each cast ring pixel with an idle ring pixel of the same a\*b\* (within 8) and takes the
  quantiles over the pairs, with 98 to 99 % of ring pixels paired. The resulting maps are
  small: L +0 to +4 and chroma 1.00 to 1.07. Clamps: L shift at most 35, chroma 0.6 to 1.4.
- The cast's own parts are removed by a Telea inpaint before the paste. The paste has a
  feathered 4 px ramp, and cast alpha is kept exactly.

## P3 seam repaint (`seam.py prep|merge`, `seam-repaint.mjs`)

Band = dilate(pasted part + removed parts, 10) minus erode(pasted part, 4), inside the figure.
It is cropped with a 25 % margin and upscaled to a 1024 short side: obi 4.1x (the band is about
20 latent cells tall), choker 12.5x. Graph: Animagine XL 4.0 Opt, `leblanc-x2-r2` 0.8, IP-Adapter
plus on idle-square + idle-head 0.3 (ease in, 0.2 to 0.6, K+V, concat),
VAEEncode + SetLatentNoiseMask, 30 steps. The prompt names only what the band shows.

**What I saw at 1:1 on the first look (P3):** the band cleaned the paste's blur at the obi's left
end and above the knot. It did **not** fix a bad pre-fill:

1. The second tassel's two beads were outside its SAM mask and were left floating.
2. The old tassel's black outline was not in its mask, so Telea dragged grey streaks down the
   new tassel's left edge.
3. On the 13 px choker, erode(P, 4) left the model most of the part, which lightened it
   (choker median dE 8.33).

## P6 re-run (the one re-run)

- The cast re-run removes the beads (`cast-landmarks-p6.json`) and grows the removed parts by
  3 px (their ink goes too). It re-pastes the whole transplanted part with a 2 px ramp
  (`--repaste 1`) instead of erode(P, 4), so the model owns only the seam. Picks: obi c2
  (seed 83101, d 0.35) and choker c1 (seed 83100, d 0.25). Result: `p6/cast.p6.png`.
- The hurt re-runs are listed under P4 below. The hole pass ran three times, one more than
  planned, because two defects surfaced. The push-pull fill made a grey block that 0.3 to 0.45
  could not lift. The fixed Telea fill then left the uncovered neck transparent, which the model
  painted as grey cloth. Those three passes are the whole of P4 and P6 for hurt. There were no
  further hurt renders.

## P5 gates (`gates.py`; P6 numbers, P3 in brackets)

| Gate | Bar | Pilot cast | Note |
|---|---|---|---|
| MAD outside mask + band vs cast.r2.2 | 0 | **0.0**, alpha changed 0 px (P3 first run 0.0003: transparent pixels' RGB; fixed) | PASS |
| obi median CIEDE2000 vs idle | 3 | **1.17** (1.80); r2.2 6.75 | PASS |
| tassel median | 3 | **2.09** (2.32); r2.2 15.72 | PASS |
| choker median | 3 | **7.18** (8.33); r2.2 11.53; 2 px core 3.98; without the lock the core is 2.13 | **FAIL** |
| seam gradient: ring +/-2 px over the ring 10 to 14 px out | 1.5 | obi **1.64**, tassel **3.51**, choker **1.59** | **FAIL literally**. The same ratio on the idle's own parts is obi 1.65, tassel 2.73, choker 1.16. The obi is at the idle's own level (its ink outline); tassel and choker are above it |
| invented colours in the region (dE76 > 10 from all of 2,000 sampled idle colours: the measure behind "4.7 %") | 1 % | **1.47 %** (1.43 %); r2.2 same px 6.10 %; model's band pixels only **0.27 %**; the transplanted idle pixels 4.48 % | **FAIL literally**. The measure's floor on the idle's own obi, knot, tassel and choker is 3.85 %, and against every idle colour it is 0.00 %. The flagged pixels are idle pixels (tassel strands), not re-invention by the band |
| calibration of that measure | | idle vs itself 0.35 % (proposal 0.3 %); whole cast.r2.2 5.13 % (proposal 4.7 %); whole pilot cast 4.70 % | reproduced |
| cut-out margins | 16 | 16/16/16/16 | PASS |
| pre-judge head-to-body, fan count | | head, face, fan and pose pixels are cast.r2.2's exactly (MAD 0) | as r2.2 (scale check passed in round 2) |
| provenance (pilot cast, opaque px) | | grey 91.8 % r2.2 unchanged, blue 2.4 % idle warped, magenta 5.8 % generated band | |

Kill-rule reading. The band re-invents nothing: 0.27 % of its pixels are invented, at the idle's
own floor. The obi self-scores 7. The choker identity self-scores 7, since the idle's row of
studs is now there, but its colour and seam gates fail. The kill rule does not fire on my
scores. If the independent judge puts the choker at 6, it does, and the transplant is DEAD.

## P4 hurt bake (`hurt-bake.py`, `hurt.json` = v1, `hurt-v2.json` = the one used)

Every opaque pixel is an idle pixel, moved or not, except the uncovered holes and the eye box.

- **v1** (upper body 11 degrees, head 10, fan arm +22 outward) swung the fan upright beside the
  head. That read as "fan raised", and the blurred head weight sheared the hair outline. I
  rejected it at the look before any GPU was spent.
- **v2**: upper body 13 degrees about the hips, head 11 about the neck, fan arm -10 (dropped off
  the lips to under the chin). At -18 the fan covered the heart mark. Other changes:
  - A continuous distance falloff for the core and head weights. A max() of a blur and a mask
    left a step, and the step tore hair tips off.
  - The head box includes the hair tips SAM left out.
  - The neck ramp runs from -5 to +45 px, where 20 px folded.
  - Outside the core, points follow their row's spine point, so sleeves are carried, not
    swung 45 px.
  - The canvas is padded 110 px each side, because the engine centres a pose horizontally.
  - Pixels that moved under 0.25 px are copied from the idle exactly.
- Holes: 0.47 % of the opaque area (the jaw and neck behind the old fan, and the forearm's old
  place in the sleeve). They are pre-filled with Telea, opaque inside the body hull, then
  repainted in a 10 px band (pick holes3 c2, d 0.45).
- Wince in the eye box only: variant A ("closed eyes, wince, pain") at 0.5/0.6, and variant B
  ("pained expression, furrowed brow"). Variant B invented anime gloom lines or blank eyes. Pick
  A c1 (d 0.5): both eyes squeezed shut and brows knitted.

| Hurt (b) gate | Bar | Value |
|---|---|---|
| idle share (grey + blue) | >= 90 % | **96.95 %** (grey 59.1, blue 37.9, magenta 3.05, amber 0) |
| head chord vs idle | 100 +/- 2 % | **100.0 %** by area; axis widths 99.7 / 100.2 % |
| standing height vs idle | >= 95 % | **98.25 %** |
| margins / baselineY / scale | 16 / idle + pad / 1.0 | 126, 64, 126, 16 / 1132 / 1.0 |
| repainted share | <= 10 % | 3.05 % |
| stretch (area change > 12 %, left as warped idle pixels, not repainted) | | 9.5 % (shoulder, sleeve and obi sides); det range 0.67 to 1.36 |

Why the joints were not repainted: a 0.3 to 0.45 repaint over the stretched obi and sleeve
re-invents exactly the parts C1 and C5 name. The stretch is smooth, with no fold, tear or seam
at 1:1.

## P7 in battle (1600x900, `ingame.mjs`, own Vite on a free port in 5900 to 5990, PYREFLY_BROWSER=gpu)

- WebGL renderer, printed first: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)`
  (the real GPU).
- **How candidates were swapped in.** `vite.r3.config.mjs` answers `/art/characters/leblanc/*`
  and `/art/manifest.json` from `D:/Tools/pyrefly-lora/leblanc/r3/art-scratch/<variant>/`,
  which holds copies of the installed folder. `public/art` was only read.
- **Server.** Its own port was 5990, and it was stopped by PID after the run.
  - Two first attempts failed. With the default optimizer entries the dependency scan walked
    every HTML page under `docs/` and held requests for minutes; now `optimizeDeps.entries` is
    `index.html` and there is a scratch `cacheDir`.
  - An HMR full reload from another agent's `src/` edit dropped `window.__pyrefly` mid-run; now
    `hmr: false, watch: null`.
- **Variants.**
  - `r22`: the installed files.
  - `pilotA`: pilot cast, no hurt file, `hurt` removed from the manifest. The engine resolved
    hurt to the 591x1118 idle.
  - `pilotB`: pilot cast plus the bake (811x1148, baselineY 1132, scale 1). It resolved to the
    bake.
- **Figure size.** On screen she is about 81x156 px (idle) and about 101x194 (cast), so the
  whole figure is under a fifth of the frame height.
- **Cast at game size.** The pilot cast's obi reads as a crimson sash with a purple tassel where
  r2.2's reads as a narrow pink band. The difference is visible but small at this size.
- **Mid-flinch, (a) vs (b), at game size.** (a) is the idle under the warm tint. (b) visibly
  leans back, so its silhouette changes. The shut eyes and the smirk cannot be seen at this
  size, so (b) reads somewhat more as a recoil than (a).
- **Driver comparison (rule 4).** (b) wins narrowly at game size. It fails rule 3 at 1:1
  ("reads as hurt" self-scored 6: the unchanged smirk with shut eyes reads as amused), so by
  the kill rule **(b) is dead as it stands and hurt ships as (a)** until an independent judge
  scores (b) at 7 or more.
- Captures: `D:/Tools/pyrefly-lora/leblanc/r3/ingame/` (crops and full frames) and
  `ingame.json`. The game-size row of `sheet.jpg` is made from them.

## Self-scores (not a pass; bar 7, the independent judge decides)

| | Hair | Face | Skin | Obi/robe | Choker | Heart | Fan | Boots | Style | Anatomy | Reads as state | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cast.r2.2 (judge `0c46fc2`) | 7 | 8 | 8 | 6 | 6 | 8 | 8 | 8 | 7 | 8 | 8 | 6 |
| pilot cast (self) | 7 | 8 | 8 | 7 | 7 (seam and colour gates fail) | 8 | 8 | 8 | 7 (the transplant's line is a little softer than r2.2's) | 8 | 8 | 7 / rule 2 not met |
| hurt (b) (self) | 8 | 7 | 8 | 7 | 8 | 8 | 7 | 8 | 7 | 7 (neck patch) | 6 (eyes shut, but the idle's smirk stays: it reads amused as much as hurt) | 6 |

## What the pilot says about the method

1. **The transplant holds identity where the render never did.** The obi, knot, tassel and
   medallion are the idle's own pixels, 1.2 and 2.1 dE from idle, where the renders drifted by
   6.8 and 15.7. The rest of the painting is untouched.
2. **Weak spots:**
   - Thin parts (the 13 px choker): the warp's edge mixing and the ring lock lighten them past
     dE 3, and whatever the old part covered has to be invented.
   - Seams where the old part was wider than the new one.
   - The seam and invented-colour gates as written cannot tell an idle ink outline or a rare
     idle colour from a seam or re-invention. The controls in the table are needed to read them.
3. **The bake is geometrically clean but expressively limited.** Leaning an unchanged smirk
   back with the eyes shut does not read as pain at 1:1. At game size only the lean shows, and
   it helps a little. A mouth change would be the next thing to test, but the method confines
   the repaint to the eye box, so it would need a method change and a yes. Until then hurt = (a).
