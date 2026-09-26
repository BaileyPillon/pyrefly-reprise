# B1 · Spell and skill effects · options round (2026-09-26)

**Game case: both, with two skins.** Shared effect plumbing is "both"; the look splits by game (FFX gold
and round motes, FFX-2 pink and four-point sparkles), and so does one mechanic the effects must show
(Holy: one hit in FFX, 12 x 8 hits in FFX-2).

**The problem (plan top-ten item 4).** The live build draws one tinted bloom for Fire, Blizzard, Holy,
a heal and a sword hit alike: `VFX.ts` has three primitives and `makeVfxPort` uses the element only to
pick a colour. See `clip-today-live-build.mp4` (recorded from the live URL, headless GPU).

Nothing here is built. These are options for Bailey to pick from (AGENTS.md rule 9). A pick approves
only what Bailey names.

## How the options were made

- **Frames:** real-engine plates of the live build, Chapter I (FFX, Seymour Flux, Mt. Gagazet) and
  Chapter IV (FFX-2, Bahamut, Bevelle Underground), captured headless with the HUD off (`capture.mjs`),
  with each combatant's screen rectangle from the debug API.
- **Effects:** mocked in Canvas 2D over those plates (`fx.html`, `fx-lib.js`, `fx-b.js`, `fx-ac.js`),
  every frame a pure function of time, rendered headless and piped into ffmpeg (`render.mjs`,
  port 6010, closed at the end). The build would use GPU point sprites and quads.
- **Option A's paintings** are original ComfyUI pilots (`comfy-pilot.mjs`, animagine-xl-4.0, two seeds
  per effect, on black; no retail frames). The mock **derives** its frames from one painting (scale,
  reveal, dissolve), so A is shown as a sketch: a built sheet needs 6 to 8 consistent painted frames.
- **Option C's glyphs** are drawn stand-ins for painted ones.
- Every set: Fire, Blizzard/Ice, Thunder, Water, Holy/White, a heal (Cure/Cura), a physical hit, and
  one special per game (FFX: Tidus's Overdrive Spiral Cut; FFX-2: Bahamut's Mega Flare).

## The options

### A · Painted flipbooks
- **Plays:** each spell is a painted sheet of 6 to 8 frames on a billboard over the target, added over
  today's bloom. The most "painted" of the three; it matches the backdrops.
- **Cost:** ART-7, about 9 effects x 2 skins x 6 to 8 frames, 2 to 4 GPU hours plus judging. The risk is
  frame-to-frame flicker: diffusion does not animate consistently.
- **Phone:** one textured quad per effect, the cheapest to draw; about 1 to 2 MB of texture per sheet,
  loaded per chapter.
- **Reduce flashes (D-220):** screen washes capped at 35 %, white tinted ivory, one wash per action; the
  painting's brightest frames get an opacity ceiling.

### B · Shader particles
- **Plays:** each element has its own shape and timing. Fire is a column rising from a scorched ground
  decal. Ice grows from the floor. Thunder is one vertical bolt with a hard flash. Water is a ring and a
  sphere. Holy is falling pillars (FFX, one burst; FFX-2, eight strikes). Cure is rising motes. The hit
  is a slash arc with sparks.
- **Cost:** code only, 0 GPU. It takes one engine batch: a registry keyed by ability id that falls back
  to the element and then to today's bloom, about 10 effects, and a unit test that every castable
  ability resolves to an effect.
- **Phone:** GPU point sprites and a few quads, 200 to 600 particles at the peak, with counts scaled by
  the quality tier. The low and reduced tiers keep today's bloom (plan).
- **Reduce flashes:** every flash is a parameter. Washes cap at 35 %, white becomes ivory, and there is
  one wash per action (FFX-2 Holy's eight become one). The actor flash caps at 0.35, with no change to
  timing. See `clip-*-reduce-flashes-off-vs-on.mp4` (top: off, bottom: on).

### C · Particles plus an element glyph
- **Plays:** option B's particles at 60 % density, plus a painted element glyph that flashes over the
  target. FFX gets a gold brush circle around a sign; FFX-2 gets a pink diamond chip with the spell's
  name.
- **Cost:** B plus 7 to 9 painted glyphs per game (a small GPU or hand job). It has two catches. First,
  the HUD already names the action, so the glyph repeats it. Second, the FFX signs here are stand-ins:
  only the aeons' Yevon seals are sourced (visual-bible, aeon descent).
- **Phone:** as B, with 40 % fewer particles, plus one quad.
- **Reduce flashes:** as B. The glyph never flashes.

## FFX vs FFX-2 (rule 14)

- **Skin:** research/ffx-vs-ffx2-presentation.md §9 row 2 says "one motion language, two skins; never
  show FFX-2 chrome in an FFX chapter". So FFX gets a gold cast ring with eight points (the Yevon-glyph
  ring idea, visual-bible) and round motes. FFX-2 gets a pink ring and four-point sparkles, its cursor
  shape.
- **Holy:** one hit in FFX (ffx-combat-core §2: one Holy entry, power 100, no hit count). In FFX-2 it is 12 x 8 hits (ffx2-combat-core, the
  corrected ladder), so the FFX-2 Holy strikes eight times.
- **Mega Flare:** violet motes converge on Bahamut's chest (visual-bible, Bevelle particles). The core
  colour is marked [estimate] there.
- **Gap:** no source in `research/` describes the retail spell animations themselves, so every look
  here is ours and is labelled that way.

## Recommendation: B

Use **B for the six elements, the heal and the hit.** Later, and only if Bailey likes the look, add A's
paintings for the Overdrives and boss specials, as single paintings animated by the shader rather than
6 to 8 diffusion frames. The reasons:

- The element reads from its shape and motion, not only its colour, and that is the complaint.
- It costs no GPU while seven art jobs are queued.
- It is deterministic and testable.
- The two game skins and REDUCE FLASHES are parameters.

C's glyph repeats the action name the HUD already shows. A's frame flicker is unproven until ART-7's
pilot sheet exists.

**Open:** D-220 Q7 (how soft REDUCE FLASHES is) is still open. The mock uses the §5.2 proposal.

## Files

| What | Files |
|---|---|
| Sheet, in parts (1080 px wide, each under 1 MB and at most 2000 px tall) | `sheet-1-today-and-options.jpg`, `sheet-2..4-ffx-option-{A,B,C}.jpg`, `sheet-5..7-ffx2-option-{A,B,C}.jpg`, `sheet-8-ffx-reduce-flashes.jpg`, `sheet-9-ffx2-reduce-flashes.jpg`, `sheet-10-option-A-pilots.jpg` |
| Clips (MP4 H.264 High, 1280x720, 30 fps, about 1 MB each) | `clip-{ffx,ffx2}-{A,B,C}-magic.mp4` (Fire, Ice, Thunder, Water; 7.6 s), `clip-{ffx,ffx2}-{A,B,C}-light.mp4` (Holy, Cure, the hit, the special; 7.9 s) |
| Reduce flashes | `clip-ffx-reduce-flashes-off-vs-on.mp4`, `clip-ffx2-reduce-flashes-off-vs-on.mp4` (1280x1440, 7 s, off on top) |
| Today | `clip-today-live-build.mp4` (7.3 s, the live build) |
| A still per element per option | `stills/<game>-<option>-<element>[-reduced].jpg` |
| Tools | `capture.mjs`, `probe.mjs`, `lib.mjs`, `comfy-pilot.mjs`, `render.mjs`, `sheet.py`, `fx*.js`, `fx.html` |

The scratch files (plates, rects, the pilot PNGs and the today recordings) are in the session scratchpad
`spellfx/` folder on C:. The pilot PNGs are also in ComfyUI's output under `pyrefly-spellfx/`. They are
not committed.
