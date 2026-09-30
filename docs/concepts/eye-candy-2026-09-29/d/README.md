# Option D, "All Three Together" (A + B + C; eye-candy options round, 2026-09-29)

Branch `fx-d` in `D:/pyrefly-r29-plate`, cut from `fx-a` with `fx-b` and `fx-c` merged in (`--no-ff`, every
effect kept). One switch turns all three on: `?fx=d` (the same as `?fx=all`). With no parameter the build draws
exactly like main. A prototype for Bailey to pick from: nothing is pushed, merged into `main` or deployed.

## What it is, in six lines

1. **A's light**: each room's own lights throw slow beams and light the air, selective bloom (lights and spells,
   never paint or costumes), a per-chapter colour look from the painting's own palette, grain, vignette, rim.
2. **B's depth and life**: each approved painting cut into depth plates that part as the camera arcs on the idle
   rig; weather, lamps and ice light alive between the plates; cast shadows; Macalania's ice floor mirrors everyone.
3. **C's combat**: streak sparks, shock rings, a real hit-stop, trauma shake, the two-frame ink impact frame, 3D
   spell layers over the approved spells, the Overdrive and Special splash, the payoffs, foil numerals, the victory arc.
4. **Balanced where they overlap** (`FX_OVERLAP` in `src/engine/fx/EyeCandy.ts`): with A and B both on, A's bloom
   0.75x, haze 0.5x and beams 0.8x, B's lamp halos 0.4x; with A and C both on, A's flare 0.7x.
5. **A yields to C in combat** (`src/engine/fx/fxShared.ts`): C writes a combat energy (a Special 1, a spell 0.7,
   a heavy blow 0.45, a hit 0.25, fading over about 0.9 s) and A's bloom keeps `1 - 0.9 x energy` of its strength
   and drops its own swell while C is lit. At rest the energy is 0 and A is unchanged. Without it, Mega Flare's
   ring and Spiral Cut's arc bloomed into a white disc that hid the target.
6. **One clock**: C's hit-stop also holds B's drift and weather, so a freeze reads as one held frame.

Each option alone is exactly as its own branch drew it (unit tests `eyecandy-flags`, `fx-d-balance`).

## Per game (rule 14)

| | FFX (Ch I Gagazet, Ch VII Macalania) | FFX-2 (Ch IV Bevelle, Ch XVI Djose) |
|---|---|---|
| Room | Golden Hour grade; moon rays through blizzard veils and snow at three depths; brazier streaks and skylight beams mirrored in Macalania's ice | Pink Hour grade (violet shadows, pink highlights); four-point lamp stars through banked steam; Djose's amber lamp in dusty air, arcs, the cold beam |
| Combat | gold streaks, navy-and-gold ink frame, ivory splash slab, gold ribbons, gold anamorphic flare | pink streaks with four-point glints, plum-and-pink ink frame, pink slab, Mega Flare shell and pink star flare, Ixion's lance |
| Pace | slow beams, calm drift, 85 ms hit-stop on heavy blows | beams 1.6x faster, drift 0.8x the FFX period, hit-stop on crits only |
| Canon | no pyreflies added (Macalania stays `absent` until Seymour dies) | no motes at Bevelle ("steam, not motes"); Chapter IV still holds at the end |

Nothing pink or four-pointed appears in the FFX chapters and no gold motes in the FFX-2 ones. FF7 never switches any of it on.

## Tiers and flags (named)

| Tier | When | What D draws |
|---|---|---|
| `full` | desktop (short side 600 px or more) | everything |
| **`phone`** (D's phone tier) | short side under 600 px | the union of each option's own phone tier: A at device pixel ratio 1.5, two beam sources at 24 samples, half-length streaks, no flare ghosts; B at 2 plates of 1024, particles 55 %, no floor reflection, drift 0.6x; C at 60 % streaks, 8 ice spikes, no lightning branches, no heat haze, an 8 degree victory arc. Measured inside its gate, so no lighter `phone-lite` tier was needed |
| `low` | the Low effects setting | A to today's whole-frame bloom (look, grain, vignette, rim kept); B at 2 plates, 30 % particles, no haze, reflection, shadows or sway; C to today's spell tier, no streaks or layers |
| Reduce motion | the setting or the OS | no drift or idle sway, no weather, beams stand still, no flare or swell, no hit-stop, shake, impact frame or victory arc; the plates, look, still halos, shadows and still reflection stay |

Both flags are read every frame, so a change on the OPTIONS rows applies at once.

## The dials: how far each goes, and where it starts to hurt (in D)

Every strength is `?fxdial=name:value` (0 to 3, 1 = as shipped) or `__pyrefly.fx.dial(name, v)`, and it multiplies
the overlap balance above. The per-option tables in `../a/README.md`, `../b/README.md` and `../c/README.md` still hold;
what changes when all three are on:

| Dial | In D at 1 | Where it starts to hurt in D |
|---|---|---|
| `all` | the balanced look shown here | above about 1.2 the rest frames go hazy (A's air on B's veils) and Gagazet's moon becomes a sun; below 0.6 the rest frame reads close to today again |
| `bloom` | A's bloom at 0.75x at rest, yielding in combat | above 1.3 (1.0x effective) the moon and Bevelle's skylight flare into blobs again; the combat yield keeps the payoff readable up to about 1.5 |
| `lamps` | B's halos at 0.4x | above 1.5 (0.6x effective) A blooms them a second time: Gagazet's moon doubles into a sunburst and Djose's lamp becomes a white window |
| `haze` | A's lit air at 0.5x | above 1.6 the air over B's blizzard and steam turns into flat fog and the paintings lose contrast (the first unbalanced D, `F:/pyrefly-parked/2026-09-29/fx-d-capture-prebalance`) |
| `weather` | B's snow, steam, dust | above 1.5 in D (2 alone), because A blooms the out-of-focus flakes into extra moons |
| `shafts` | A's beams at 0.8x | above 1.5 the beams wash the party nearest the source |
| `flare` | A's flare at 0.7x | above 1.4 the flare and C's payoff cover the target together |
| `sparks`, `shake`, `hitstop`, `spells`, `impact`, `splash` | as C | as in C's table; A's bloom yields to them, so they read as lines even at 1.5 |
| `drift`, `reflect`, `shadow`, `sway` | as B | as in B's table |

## Captures

Production build of `fx-d` (vite build to `D:/Tools/pyrefly-scratch/eye-candy/d/dist`), served on port 5824,
headless Chrome on the real GPU (`PYREFLY_BROWSER=gpu`), `autoBattle('intended')` at normal speed.

- `stills/<chapter>-<moment>-<on|off>.jpg`: 1600x900 JPEG q88, frozen at the moment's peak, shot ON, then all
  three options switched off and the same frame shot OFF. Moments: `rest` (HUD as played), `rest-clean` (the same
  frame, HUD hidden with the debug trigger `hud:off`), `hit`, `spell`, `impact`, `splash`, `special`, `victory`.
  Every moment was reached in all four chapters. Chapter I runs on seed 3 (seed 1 loses the fight). **Chapter IV's
  spell is INJECTED**: a fire on Bahamut at the first menu, because the seeded fight casts no elemental spell.
- `phone/<chapter>.jpg`: 390x844 at device pixel ratio 3, saved at 2x, D's phone tier, an INJECTED spell at the first menu.
- `clips/<chapter>.mp4` (+ `-poster.jpg`): 8 s at 1600x900 round the Overdrive or Special, H.264, 2.4 to 3.4 MB.
  Playwright's recorder drops frames, so motion is steppier than the game.
- `perf.json`, `captions.json` (file, chapter, moment, on/off, tier, injected, what to look at).
- `web/`: the 1280-wide stills and 1280-wide clips the options page uses.

The clips and frame times were recorded on the build before the last fix (`cfd68e52`), which only changes what
happens when a capture switches C off and on inside a frozen frame; play never does that, so they stand.

## Frame times (`perf.json`; ON = `?fx=d`, OFF = `?fx=off`, vsync on, 24 s of combat)

| Chapter | Desktop 1600x900 p50 / p95 ON | p95 OFF | Phone 390x844, CPU 4x, p50 / p95 ON | p95 OFF | Gate |
|---|---|---|---|---|---|
| I Seymour Flux (FFX) | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.8 | pass |
| VII Macalania (FFX) | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.8 | pass |
| IV Bahamut (FFX-2) | 16.7 / 16.8 | 16.8 | 16.7 / 16.7 | 16.7 | pass |
| XVI Ixion (FFX-2) | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.7 | pass |

All eight runs hold 60 fps: p95 at most 17.0 ms desktop and 33.4 ms phone, and ON no worse than OFF by more than
0.3 ms (spec section 8). The phone's slow frames (p99 33.3 to 33.4 ms in Chapters I and VII) happen ON and OFF alike:
they are the throttled battle, not D. The phone run throttles the CPU only and still renders on the desktop RTX, so
a real phone GPU is untested; uncapped headroom was not measured.

## Checks

- `npx tsc --noEmit` clean. `tests/unit/eyecandy-flags.test.ts`, `fx-d-balance.test.ts`, `look-lut.test.ts`,
  `fx-b-living.test.ts`, `fx-c-spectacle.test.ts`: 41 tests pass. `node tools/orphans.mjs`: no fx module orphaned.
- No approved painting is touched (every effect is a pass, a layer, a light or the camera); B's derived depth maps
  stay in `public/fx/` on the branch.
- The HUD is DOM above the canvas: nothing in A, B or C filters it (see A's HUD identity check).

## Known faults

1. **The biggest moments are still very bright.** With the combat yield, Mega Flare and Spiral Cut keep their target
   readable, but the frame around the blow still goes pale-violet or gold for a beat. That is the "maximum" end;
   `?fxdial=bloom:0.8,flare:0.8` calms it.
2. **Gagazet's moon is a starburst**, not the painted disc (A's streaks on B's halo). `?fxsub=-streaks` keeps the disc.
3. **B's drift makes every run frame the room a little differently**, so ON and OFF are the same frozen frame but two
   runs of the same chapter are not.
4. **Re-offers** (declined on 19 Sep, each its own sub-switch): C's `hitstop` (hit-feel) and `splash`
   (overdrive-cinematic), B's `sway` (cutout-animation). Aerospark's lance is a new Special look that needs a yes (D-233).
5. **Inherited**: Bahamut's splash has no painting (slab and name only); the Djose work lamp runs warm; the Chapter IV
   splash title sits partly under the CHARGING chip; B's derived depth maps in a public repo are still an open question.
6. The capture harness chooses the victory frame on the victory beat, while the last turn's HUD cards are still up.
