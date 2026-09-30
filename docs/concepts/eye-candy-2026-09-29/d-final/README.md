# Eye-candy D, final build: target vs build (2026-09-30)

Bailey picked D on 2026-09-29 ("I'll go with all of your recommendations please", about 21:00 EDT), and at
about 23:45 EDT: "Ok yes I picked D so all 3 together however in the settings I want to be able to turn each one
off. Default will be on. Please." Branch `fx-d` in `D:/pyrefly-r29-plate`. Nothing pushed, merged or deployed.

**Game case: both.** FFX (Chapters I, VII and the other FFX chapters) gold and calm; FFX-2 (IV, XVI and the other
FFX-2 chapters) pink and quick, per the spec. FF7 never draws any of it and its pause has none of the rows.

## What to look at

| File | What it is |
|---|---|
| `target-vs-build-ch1-seymour-flux.jpg`, `-ch7-macalania.jpg`, `-ch4-bahamut.jpg`, `-ch16-ixion.jpg` | One row per moment (rest, hit, spell, impact, splash, special, victory): **left the options page's D frame (the target), right the final build**, 1600x900, the same seeded moments and the same capture harness |
| `target-vs-build-phone.jpg` | The four phone frames (390x844, D's phone tier), target row over build row |
| `options-target-vs-build-desk.jpg`, `-phone.jpg` | **The three new OPTIONS rows had no mockup of their own.** Left the approved A2 OPTIONS frame (`docs/concepts/r29-options/shots/`), right the build with CINEMA LIGHT, LIVING PAINTINGS and BATTLE SPECTACLE under LOW EFFECTS |
| `fixes/fix-*.jpg`, `fixes/fixes.json` | The judge's must-fix list, one sheet each: BEFORE (options page) / AFTER (final) / OFF (today, the same frozen frame as AFTER), cropped to the region the defect is about, with mean luma, clipped share (luma >= 245) and detail (mean Laplacian) |
| `stills/`, `phone/`, `captions.json` | The final build's ON frames (D is the default, no URL parameter) |
| `perf.json`, `comfort.json`, `chapters-desk.json`, `chapters-phone.json`, `rows-check.json`, `live-c.json` | The measurements below |

The build's OFF frames (every option switched off on the same frozen frame) are in
`D:/Tools/pyrefly-scratch/picks-0929/eye-candy-d/final/stills/` (not committed).

## The must-fix list: before and after (`fixes/fixes.json`)

Each fix was found by switching layers and dials one at a time on a frozen frame of the running build
(`harness/rest-probe.mjs`), not guessed.

| # | Defect (judge) | What caused it (probed) | What changed | Before -> after (region) |
|---|---|---|---|---|
| 1 | Big moments white out the target | A's flare and halo stacked on C's payoff; C's hit core | D-only flare 0.55, halo 0.7 on C's payoffs; C's core flash smaller and cooler | Ch IV special, Bahamut: clipped **24.5 % -> 7.6 %**, detail 10.3 -> 17.1. Ch I Overdrive 3.6 -> 3.1 %, Ch VII Spiral Cut 2.1 -> 1.4 %. Mega Flare itself landing on the party was also shot: party and Bahamut readable |
| 2 | Gagazet's moon becomes a starburst | A's moonbeams (rays around the source) and B's out-of-focus near flakes bloomed into extra moons | no source disc, streak threshold 0.97, moonbeams 0.6x with fewer distinct rays (0.4), near flakes smaller and fainter | moon crop: luma 174 -> 127, clipped 1.57 -> 0.08 %; the painted disc reads (see `fix-2-gagazet-moon.jpg`) |
| 3 | Haze and steam bury the backdrop | Bevelle: B's vent plumes and banked steam, bloomed by A; the four-point lamp stars. Gagazet: A's moonbeams and the far veil | Bevelle plumes 0.42 -> 0.16, banked steam 0.26/0.16 -> 0.12/0.07, lamp stars 0.6x; Gagazet far veil 0.5 -> 0.36 | Bevelle upper frame luma 63 -> 36 (OFF 33), detail 7.1 -> 7.3; Gagazet upper left luma 156 -> 111 (OFF 72) |
| 4 | Hit rings hide the fighter | the rings drew over the figure | rings drawn **behind** the fighter (render order 8, before the figures at 10) and fainter | Ch XVI hit clipped 4.1 -> 1.9 %, Ch IV hit (Yuna) 13.5 -> 5.0 %; Paine reads in the Ch XVI special |
| 5 | Phone spells clip to white-orange blobs | A's spell halo (a 3-pass blur on a small buffer), not C's layer or B | phone tier only: halo 0.2, spells 0.6, bloom 0.85 | phone boss region clipped: Ch I **16.5 -> 7.4 %**, Ch IV **11.7 -> 3.7 %** |
| 6 | Ch IV splash title under the CHARGING chip | the FFX-2 slab from the right stamped the name at the left edge | FFX-2 Specials from the right stamp the name mid-slab (`left: 30%`) | `fix-6-splash-title.jpg`: MEGA FLARE sits clear of the CHARGING slab |
| 7 | Djose's work lamp runs hot | B's warm lamp layer, then A's four-point star on the lower pane | B's warm lamp 1.2 -> 0.5 (halo 1.5 -> 0.8), Djose's streak 1.0 at threshold 0.82, no source disc on the upper lamp shaft | lamp crop: the mullions read again (`fix-7-djose-lamp.jpg`) |

What the tuning did **not** change: no new effect, no new painting, no approved painting touched, the engine and
the RNG untouched. The re-offers (B's figure sway, C's hit-stop, C's splash cut-in) and Aerospark's lance ship on
as parts of D, as Bailey approved.

## D is the default

No URL parameter draws D. `?fx=off` gives today's look for comparison and tests, and any `?fx=` wins over the
OPTIONS rows for that page load. Every part keeps its sub-switch (`?fxsub=-shafts`, `-sway`, `-hitstop`, ...).

## The three OPTIONS rows (save-data class)

- **CINEMA LIGHT** (A, Golden-Hour Cinema; FFX-2's pink hour is the same switch), **LIVING PAINTINGS** (B),
  **BATTLE SPECTACLE** (C), under LOW EFFECTS, ON/OFF exactly like it. The approved A2 frame has no help line on
  any row, so none was added (a question for Bailey).
- Real input (`rows-check.json`), 1600x900 FFX and FFX-2, 390x844 FFX-2: ArrowDown to the row, Enter flips it,
  Right flips it back, Left flips a toggle too; a mouse click and a tap flip each row; the look switches the same
  frame; after a reload the saved choice holds (all three OFF read back OFF, the fight draws today's look); 0
  console errors. `desk-*-battle-looks-off.jpg` / `-on.jpg` under `docs/screenshots/picks-0929/eye-candy-d/` show
  the same fight with the rows OFF and ON.
- Live both ways (`live-c.json`): a Chapter XVI fight started with BATTLE SPECTACLE OFF threw 0 C blows in 12 s,
  5 in the 12 s after the row went ON, 0 again after it went OFF.
- Layout: BATTLE SPECTACLE was cut to "BATTLE SPECTAC..." (160 px of text in a 150 px key cell), so the desktop
  settings key cell grew 6 %; FFX-2's fourteen settings rows ran into the objective's eyebrow at 1600x900, so on
  desktop the column now stops one row short of the objective and scrolls, as the phone's already did (the
  selected row scrolls into view; checked to BATTLE HELP). Every label and value fits at 1024x768, 1280x720,
  1600x900, 1920x1080 and 390x844.
- Save: `fxLight`, `fxLiving`, `fxSpectacle` default true; `migrateComfort` gives true to anything that is not a
  boolean; `SAVE_VERSION` stays 1 (additive fields, the `textSize` precedent). Proven on saves written by the
  release-29, release-30 and release-31a builds themselves (`tests/fixtures/saves/`, the two new ones exported
  from the parked gate dists of those releases): every clear, best time, play time, coach id, flag and setting is
  kept verbatim; the only additions are the three looks (ON) and TEXT SIZE (100 %).

## Comfort (`comfort.json`, a whole seeded fight each, Chapters I and XVI)

| | drift | weather fields | impact frames | trauma (shake) | hit-stops | A's swell/flare | particles | spell layers |
|---|---|---|---|---|---|---|---|---|
| normal | moving | on | 2 / 6 | 0.75 / 0.97 | 0 / 2 | 0 / 0.42 | 260 flakes / 70 dust | 0 / 15 |
| REDUCE MOTION | **0** | on, held still | **0** | **0** | **0** | **0** | same | same |
| LOW EFFECTS | 0.5x | on | as normal | as normal | as normal | **0** (no flare) | **30 %** (78 / 21) | **0** |

REDUCE MOTION also drops the victory orbit (`planVictory` returns null; unit-tested). LOW EFFECTS drops reflections
and heat haze (B's and C's low tiers). The phone tier held on 390x844 in every run.

## Every chapter with D on (`chapters-desk.json`, `chapters-phone.json`)

All 18 chapter ids load and reach a player turn with D on, at 1600x900 and at 390x844, 0 console errors. B draws
only in its four rooms (Gagazet, Macalania, Bevelle, Djose); the other fourteen get A's grade and bloom and C.

## Frame times (`perf.json`)

**Measured while ComfyUI was rendering on the same GPU (66 to 89 % utilisation), so every figure is pessimistic.**
Vsync on, 24 s of combat, p95 ms, ON = no parameter (D), OFF = `?fx=off`.

| Chapter | Desktop ON / OFF | Phone (390x844, DPR 3, CPU 4x) ON / OFF | Uncapped desktop combat p95 ON / OFF |
|---|---|---|---|
| I Seymour Flux | 16.8 / 16.8 | 16.8 / 16.8 | 1.3 / 1.2 |
| IV Bahamut | 16.8 / 16.7 | 16.8 / 16.7 | 2.8 / 1.7 |
| VII Macalania | 16.8 / 16.7 | 16.8 / 16.8 | 2.0 / 1.4 |
| XVI Ixion | 16.7 / 16.7 | 16.8 / 16.8 | 1.2 / 1.1 |

All eight gated runs pass (desktop <= 17.0, phone <= 33.4, ON - OFF <= 0.3). **Disclosed:** the first phone runs
of Chapters I, IV and VII failed while ComfyUI was busiest (I: ON 33.3 / OFF 66.6; VII: ON 50.1 / OFF 150; IV: ON
316.7 / OFF 16.7); the repeats above passed. OFF failing too says the machine was contended, but Chapter IV's ON
run is a warning that D on the phone tier degrades much more than today's look under a busy GPU. A clean re-run
with the GPU idle is owed, and a real phone GPU is still untested.

## Derived files

B's depth maps live in `public/fx/`, gitignored like `public/art`; `tools/fx/fx-assets.json` lists their names,
sizes and sha256; `tools/fx-assets.mjs` verifies, backs up (`D:/Tools/pyrefly-art-backup/fx`, verified PASS) and
restores them. `npm run dev` / `npm run build` run `ensure --warn`; `tools/deploy-pages.mjs` runs `ensure`
strictly before the build and verifies `dist-release/fx` after it. The artifact manifest walks every shipped file,
so `fx/` is hashed and decode-checked with no change.
