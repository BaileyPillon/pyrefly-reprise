# FF7 Guard Scorpion · effects with eye candy, higher fidelity (options, 2026-09-27)

**Game case: FF7 only** (AGENTS.md rule 14). The hidden, experimental Guard Scorpion fight. Nothing
here changes an FFX or FFX-2 chapter. **Options only (rule 9): nothing is built, installed or wired.**

**Why:** Bailey, 2026-09-27, on a frame of the live fight: "i need tons of eye candy it needs to be
higher fidelity than the original in this regard", then the sides switch ("cant you just have the
characters and enemy switch sides? not mirrored just literally switch sides") and "i'll go with all
of your recommendations" for plan A (richer effects options with glow, particles and light spilling
onto the fighters). This round follows `docs/concepts/ff7-options-2026-09-27` (A1 hard light, A2
painted glow, A3 hybrid) and the house spell-FX option B (`docs/concepts/spell-fx-2026-09-26`).

**Sides:** the party stands on the LEFT facing screen-right, Guard Scorpion on the RIGHT facing
screen-left. None of our paintings faces that way yet, and **a painting is never mirrored**, so every
fighter here is a **placeholder maquette** drawn facing its new way and labelled so in each frame.
The maquettes keep the canon sides: facing right in three-quarter view shows a figure's right side,
so Barret's gun-arm (his right arm) is the near arm and Cloud's pauldron (his left shoulder) is on
the far side. The backdrop plate is not flipped either (it is nearly symmetrical). The new
right-facing paintings are a separate art round.

## The sheet (1080 px wide, each part under 1 MB and under 2000 px tall)

| Part | What |
|---|---|
| `sheet-1-overview-tail-laser-three-ways.jpg` | Tail Laser in all three, the comparison, the recommendation |
| `sheet-2-option-1-A3-plus-laser-bolt.jpg`, `sheet-3-option-1-A3-plus-braver-scope.jpg` | 1 · A3 plus |
| `sheet-4-option-2-spectacle-laser-bolt.jpg`, `sheet-5-option-2-spectacle-braver-scope.jpg` | 2 · Spectacle |
| `sheet-6-option-2-flash-frames-and-reduced-motion.jpg` | 2 · its flash frames and the calm (reduced-motion) version |
| `sheet-7-option-3-cel-light-laser-bolt.jpg`, `sheet-8-option-3-cel-light-braver-scope.jpg` | 3 · Cel light |

Each option is shown at the key moment of **Tail Laser** (one beam swept across both party members,
key frame on Cloud, a scorch where it dragged across the floor), **Bolt** (Cloud on Guard Scorpion),
**Braver** (Cloud's Limit, at the hit) and **Search Scope's lock-on** ("Locked On Target").

## The options

1. **A3 plus: hard light, cast glow.** FF7's polygon vocabulary (flat tapered beams, jagged bolts,
   faceted bursts) with a glow pass and bloom, and the effect's colour thrown onto the fighters: a rim
   on the side facing the light, a tint that falls off with distance, a light pool on the floor and a
   shadow thrown away from it. Moderate eye candy; cheapest; light on a phone.
2. **Spectacle.** The same shapes buried in layered particles (the house spell-FX option B method),
   hot sparks, embers along the scorch, anamorphic flare streaks, heat haze, charge rings on the
   emitter, electric arcs crawling over the boss on Bolt, afterimages and debris on Braver, a short
   camera shake on hits, heavy bloom, and **one flash frame** (about 17 ms, never repeated) on the two
   big hits. The lock-on stays calm (no flash, no shake). **Reduced motion / Reduce flashes** gives the
   calm version: no shake, no haze, no flash, particles at 40 % (part 6). The most eye candy; the
   heaviest (it needs spell-FX B's particle cap on a phone).
3. **Cel light.** Anime-style: flat stepped colour bands with a hard ink edge, speed lines, stepped
   bursts, and hard-edged cel light on the fighters (a flat rim band, a two-step floor pool, a crisp
   shadow). No bloom. Bold and graphic; cheap; right only if the new paintings go cel-lit.

## Recommendation: 2 · Spectacle, built on top of 1

Bailey asked for "tons of eye candy", higher fidelity than the original. Option 2 is the only one
that clearly delivers that, and it grows out of spell-FX option B, which Bailey already liked. Build
it as layers: 1 (FF7's shapes, glow, cast light) underneath, then the particle, spark, haze, shake and
flash layers, so the calm reduced-motion version falls out of the same code. Choose 3 only if the art
round picks a cel-lit look. A pick approves only what Bailey names (for example "2, but no shake").

## What the sources say, and what is ours

- `research/ff7-guard-scorpion.md` (branch `ff7-integration`): Tail Laser is the counter while the
  tail is up, on **all opponents**; Search Scope does no damage and prints **"Locked On Target"**;
  Cloud's Limit is Braver. Damage numbers drawn are illustrative values inside its tables: Tail Laser
  72 to 77 each (75, 73), Bolt 90 to 96 (93), Braver 116 to 124 (121).
- Braver is "a jump upwards followed by a downward slash" (FF Wiki "Braver (Final Fantasy VII)",
  revid 3921199, as cited in `docs/concepts/ff7-options-2026-09-27/README.md`).
- The look of every effect here is **ours**: no written source describes how FF7 draws Bolt, Tail
  Laser, Braver's trail or the lock-on, and this round goes past the original on purpose. The glow,
  particles, cast light, haze, shake and flash are 2026 additions, not claims about 1997.
- `research/ff7-battle-staging.md` §4: FF7's battle camera moves anyway, which is part of why Bailey's
  side switch reads fine.

## How it was made (no game code changed; no retail material)

- **Original only (rule 8):** no FF7 image, model, sprite, screenshot or font was used as input,
  reference or trace. The backdrop is our painting and the FF7 band is the builder's real frame of our
  own fight (the clean plate `base-empty.jpg` from the options round's scratch assets). Every effect
  and every placeholder figure is drawn in code.
- **Code:** `src/scene.js` (switched layout, placeholder maquettes, cast light, rims, shadows, floor
  pools), `src/kit.js` (shapes, particles, sparks, bloom, heat haze, shake, ink edge), `src/fx.js` (the
  four moments in the three treatments, and the frame compositor), `src/parts.js` (the sheet). It
  imports the window, numeral and asset loader from `docs/concepts/ff7-options-2026-09-27/src/base.js`.
- **Render (once, headless):** `node docs/concepts/ff7-effects-hifi-2026-09-27/src/render.mjs [part ...]`
  with `PYREFLY_BROWSER=gpu`: one headless Chromium and a static server on 127.0.0.1:7010 (serving
  `docs/concepts` at `/` and `D:/Tools/pyrefly-scratch/ff7-options` at `/s/`), both closed at the end.
- No ComfyUI render was queued for this round.

## Open for Bailey

1. Pick 1, 2 or 3, or a mix (recommended: 2 on top of 1).
2. Shake and the one-frame flash: keep, or keep only for Limits.
3. The new right-facing paintings (Cloud, Barret, Guard Scorpion) are owed from the art round; these
   frames will be redrawn over them once one is picked.
