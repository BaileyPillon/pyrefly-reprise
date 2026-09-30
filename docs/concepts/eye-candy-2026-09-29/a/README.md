# Option A, "Golden-Hour Cinema" (eye-candy options round, 2026-09-29)

Prototype on branch `fx-a`, behind `?fx=a` (default off: without the switch the branch draws exactly
like main). Nothing here is merged or deployed; Bailey picks first (AGENTS.md rule 9).

## What it is, in six lines

1. **Light that comes from the painting.** Each room's own light sources (Gagazet's moon, Macalania's
   skylight and twin braziers, Bevelle's grated skylight and lamps, Djose's work lamps and high opening)
   throw screen-space **shafts** that turn slowly into distinct beams, and light the **air** round them.
2. **Selective bloom.** Lights, spells and motes bloom; paint, snow and costumes never do (every figure
   writes the bloom mask under A, so no approved costume is ever haloed).
3. **Lens streaks** on compact light peaks: FFX gets a long **anamorphic horizontal** streak (cinema
   glass), FFX-2 gets **four-point stars** (the rhyme with its sparkle cursor and `spark4`).
4. **A per-chapter colour look**: a 32-cube LUT built at run time from the painting's own palette (no image
   file): deeper contrast, richer mids, a soft shoulder that keeps highlight detail.
5. **Cinema finish**: film grain stepped at 24 frames a second, a tinted elliptical vignette, the backdrop
   softened by mip bias (sharper figures, a focus pull while a command menu is open), and the figures' rim
   light taken from the painting's key colour.
6. **Big moments**: spells gain a halo under their approved strokes; big spells, Overdrives and Specials
   fire a lens flare and make the room's light **swell** and settle.

The approved paintings are never touched: everything is a pass, a light or a sampling choice at draw time
(`verify-approved`: 338 ok, 0 mismatched, 0 missing). The HUD is DOM above the canvas, so none of it can
blur, bloom or tint the HUD (checked below).

## Per game (rule 14)

| | FFX (Ch I Gagazet, Ch VII Macalania): "Golden Hour" | FFX-2 (Ch IV Bevelle, Ch XVI Djose): "Pink Hour" |
|---|---|---|
| Grade | shadows lean to the painting's own sky, only the brightest tenth leans gold; S-curve 0.38 | shadows violet `#3A1E5C`, highlights pink `#F7B6D9`; S-curve 0.42, richer mids |
| Bloom | soft and wide (radius 0.8), tinted toward the painting's key | tighter (radius 0.5), stronger, magenta-leaning |
| Streaks | anamorphic horizontal, gold (silver at Gagazet) | four-point stars, pink-white |
| Beams | slow (CTB calm) | 1.6x faster (ATB pace) |
| Flare | gold anamorphic line across the frame, three ghost discs, 600 ms | pink `spark4` star, three hex ghosts, 450 ms |
| Swell on a big spell | +35 %, settles over 1.4 s | +45 %, settles over 1.0 s |

Nothing adds a particle or a mote: the canon air table is untouched (Macalania `absent` until Seymour's
death, Bevelle "steam, not motes", Gagazet and Djose `unattested`). The shafts and haze are light the
paintings already paint. FF7 is out of scope and never switches A on.

## Tiers and flags

- **full** (desktop): everything above.
- **phone** (short side under 600 CSS px): device pixel ratio capped at 1.5, two shaft sources at 24
  samples, streaks at half the taps, a 3-pass halo, no flare ghosts.
- **low** (the Low effects setting): today's whole-frame bloom exactly, no shafts, streaks, halo, flare
  or swell; only the nearly free look, grain, vignette, backdrop softening and rim stay.
  Still: `flags/ch1-seymour-flux-low-effects-on.jpg`.
- **Reduce motion**: the beams stand still, no breathing, a still grain, no focus-pull easing, no lens
  flare and no swell. Still: `flags/ch1-seymour-flux-reduce-motion-on.jpg`.
- REDUCE FLASHES (read defensively until r31-access lands the setting): flare peak 0.35, no ghosts, no swell.

## The dials: how far each goes, and where it starts to hurt

Every strength is a multiplier, `?fxdial=name:value` (0 to 3, 1 = as tuned) or `__pyrefly.fx.dial(name, v)`;
`all` scales them all. Sub-effects switch off with `?fxsub=-name`. `dials/` holds the Macalania and
Bevelle frames at `all` 0.5, 1 and 1.6.

| Dial | What it scales | Comfortable | Starts to hurt |
|---|---|---|---|
| `all` | everything | 0.6 to 1.2 | above 1.4 the bright paint (Macalania's right window, Djose's lamp) loses its drawn detail; below 0.5 it reads like today |
| `bloom` | selective bloom strength | 0.7 to 1.3 | above 1.5 the lights become blobs and the moon's disc is lost |
| `shafts` | beam strength | 0.6 to 1.4 | above 1.6 the beams wash the figures nearest the source (Tidus under Gagazet's moon) |
| `haze` | the lit air round each source | 0.5 to 1.3 | above 1.5 a flat fog covers the paint round the lamp or moon |
| `streaks` | anamorphic / star streaks | 0.5 to 1.5 | above 2 the streaks cross the figures' faces |
| `look` | the LUT mix (up to 1.5) | 0.7 to 1.0 | above 1.2 the paintings' own colours shift (skin goes too warm or too pink) |
| `rim` | rim strength and width | 0.6 to 1.2 | above 1.4 the rim reads as an outline, not light |
| `grain` | film grain | 0.5 to 1.5 | above 2 it reads as noise on the dark FFX-2 rooms |
| `vignette` | extra vignette | 0.5 to 1.5 | above 2 the HUD corners sit on black |
| `dof` | backdrop softening and the menu pull | 0.5 to 1.3 | above 1.6 the paintings lose their brushwork at rest; this is the one that most costs "the painting is the star" |
| `halo` | the spells' halo | 0.6 to 1.2 | above 1.5 a hit's spark lines drown in white |
| `flare` | the lens flare size and peak | 0.6 to 1.3 | above 1.5 the Spiral Cut / Mega Flare flare covers the target |

## Captures

Stills 1600x900 JPEG q88, each moment frozen (`__pyrefly.fx.freeze`) and shot ON, then the same frame OFF.
`captions.json` says what to look at in each. Moments: at rest (with the HUD, and `rest-clean` with the HUD
hidden), a physical hit, a spell, the Overdrive or Special, the victory.

Folders:
- `stills/<chapter>-<moment>-<on|off>.jpg`: six moments per chapter (five in Ch IV and Ch XVI, see below); `rest` has the
  HUD as the player sees it, and `rest-clean` hides it (debug trigger `hud:off`) so the room itself can be judged.
- `phone/<chapter>.jpg` (and `-off`): 390x844 at DPR 3, saved at 2x, the phone tier, at the first hit or spell.
- `clips/<chapter>.mp4`: 8 s at 1600x900 with A on, round a spell or Special (H.264, 2.1 to 3.5 MB). Playwright's
  recorder drops frames while it records, so the motion is steppier than the game.
- `flags/`: the Low effects tier and Reduce motion in Chapter I.
- `dials/`: Macalania and Bevelle at rest with `all` at 0.5, 1.0 and 1.6, beside OFF.
- `hud/hud-identity.json`, `perf.json`, `captions.json` (file, chapter, moment, on/off, tier, injected, what to look at).

Moments and how they were reached (every one by the real auto-battle `intended`, unless marked):
- Chapter I runs on **seed 3**: on seed 1 the auto-battle loses to Seymour Flux, so there is no victory. Its
  victory frame is the winning blow as the victory beat begins (about a second before the results screen).
- **Spiral Cut (Ch I and VII) is INJECTED**: the auto-battle wins before Tidus's Overdrive gauge fills. The
  approved Spiral Cut effect is played by its own debug trigger (`spellfx:spiral:<boss>:1.5`, presentation only,
  held just past its blow). The engine is never touched. The preview also fires A's flare and swell, as a real
  landing does.
- **Aerospark (Ch XVI) is UNVERIFIED**: the party won before Ixion used it. Nothing was faked, and no Aerospark
  look exists yet (the spec flags this as Bailey's call).
- Mega Flare (Ch IV) is real (auto-battle, about 93 s in). Ch IV has **no spell still (UNVERIFIED)**: nobody cast a drawn
  elemental spell before the win; its halo and flare show in the Mega Flare frame.
- Freezing stops the battle, the effects and A's clocks, but the DOM HUD's own animations (gauges, a fading info
  card) and a boss's dissolve keep running. So a few pairs differ outside A: Ch I's hit shows a target card in
  only one shot, and Ixion's victory shows its dissolve a moment apart.

## Frame times

| Chapter | Desktop 1600x900, p50 / p95 ms, A on (off) | Phone 390x844 DPR 3, CPU 4x, p50 / p95 ms, A on (off) | Uncapped desktop p50 / p95, A on (off) |
|---|---|---|---|
| Ch I Seymour Flux (FFX) | rest 16.7 / 16.7 (16.7 / 16.7); action 16.7 / 16.7 (16.7 / 16.7) | rest 16.7 / 16.7 (16.7 / 16.7); action 16.7 / 16.8 (16.7 / 16.7) | rest 1.2 / 1.4 (0.9 / 1.2); action 0.8 / 1.1 (0.8 / 1.1) |
| Ch VII Macalania (FFX) | rest 16.7 / 16.8 (16.7 / 16.7); action 16.7 / 16.8 (16.7 / 16.8) | rest 16.7 / 16.7 (16.7 / 16.8); action 16.7 / 16.8 (16.7 / 16.8) | rest 0.8 / 0.9 (0.8 / 1.4); action 0.8 / 1.2 (0.7 / 1) |
| Ch IV Bahamut (FFX-2) | rest 16.7 / 16.8 (16.7 / 16.8); action 16.7 / 16.7 (16.7 / 16.7) | rest 16.7 / 16.7 (16.7 / 16.8); action 16.7 / 16.7 (16.7 / 16.8) | rest 1.1 / 1.6 (1.1 / 2.3); action 1.1 / 1.6 (1 / 1.9) |
| Ch XVI Ixion (FFX-2) | rest 16.7 / 16.7 (16.7 / 16.7); action 16.7 / 16.7 (16.7 / 16.8) | rest 16.7 / 16.8 (16.7 / 16.7); action 16.7 / 16.8 (16.7 / 16.8) | rest 0.7 / 1 (0.9 / 2.5); action 0.6 / 2.1 (0.9 / 1.3) |

Reading: with vsync, option A costs nothing measurable. Every window holds the 60 Hz interval (p95 16.7 to 16.8 ms)
exactly as the same page with A off, on the desktop and on the phone tier under a 4x CPU throttle. That meets the
spec's gate reading (p95 at most 17.0 ms desktop and 33.4 ms phone, and no worse than `?fx=off` by more than 0.3 ms).
The phone gate of 33 ms is met with 2x margin. The Chapter I phone action window has one slow frame in a hundred
(p99 33.4 ms) with A on; the same happens in Ch VII with A off, so it is the throttled battle, not A. The uncapped
figures (about 1 ms) measure frame submission only. The GPU is the desktop 5070 Ti even in the phone run (CDP
throttles only the CPU), so a real phone's fill rate is untested: that is why the phone tier drops to DPR 1.5, two
shaft sources, 24 samples and half-length streaks. The whole method is in `perf.json`.

## Checks

- `tsc --noEmit` clean; `tests/unit/eyecandy-flags.test.ts` and `tests/unit/look-lut.test.ts` pass, and the
  presenter and spell-FX suites pass with the switch off (202 tests).
- `node tools/orphans.mjs`: no new orphans.
- `verify-approved`: 338 ok, 0 mismatched, 0 missing.
- HUD identity (`hud/hud-identity.json`): the canvas hidden, the HUD shot with A on and off. It is
  pixel-identical in Ch VII. In Ch IV and Ch XVI the only differing pixels are in the party panel's
  gauges, and a control pair shot with A **off both times** differs in exactly the same box by the same
  amount: that is the HUD's own gauge animation, not A. In Ch I the control differs by more (20,256 pixels)
  than ON against OFF (3,835 pixels).

## Known faults

1. **Overdrive and Special peaks white out the centre for a moment.** At Spiral Cut's blow (and Mega Flare's
   impact), the approved burst, the selective bloom, the swell and the halo stack up, and the figures inside the
   burst disappear for about a third of a second (`stills/ch7-macalania-special-on.jpg`). Turning `halo` and
   `bloom` to 0.7 keeps the drama and shows the figures; I left it bold because Bailey asked for bold.
2. **Gagazet's moon becomes a sunburst.** The painted disc sits inside its glow. Purists may prefer `bloom` 0.7
   there.
3. **Past `all` 1.3 it breaks** (`dials/`). The look extrapolates beyond its LUT (orange blotches in Macalania's
   windows), the rims turn into outlines, and Bevelle's skylight swamps Bahamut and the party. The `look` dial
   accepts up to 1.5 by design, to show that edge.
4. **Where this departs from the spec:**
   - A1 uses a local-contrast bright-pass (a light is brighter than the paint round it, and pale paint is damped)
     instead of the spec's derived emissive mask PNGs. So `public/fx/`, `tools/fx/emissive-mask.mjs` and
     `find-light.mjs` do not exist, and nothing derived from a painting is committed. The light positions in
     `sceneLooks.ts` were placed by eye on the paintings and checked on the captures.
   - FFX gets **anamorphic streaks on its lights** at rest. The spec gave FFX an anamorphic streak only in the big
     spell flare, and stars to FFX-2 only. This is my addition for "cinema", and it stays game-aware
     (horizontal in FFX, four-point in FFX-2). Strike it with `?fxsub=-streaks`.
   - The menu focus pull reads the command menu from the DOM (`.ig-cmd-stack`) instead of through a
     `stage.fx.focus()` port.
   - The spec's +0.08 vignette on a telegraph is not built. The vignette deepens only in the swell after a big
     spell.
5. **Not measured:** the spec's "figure luma within 3 %" guard (the rim is deliberately stronger), GPU time
   per pass, and a real phone.
6. The Chapter I Reduce motion still shows the battle's opening line over the moon, so it proves the flag
   more than the look.
7. FF7's hidden fight never switches A on (A reads only `ffx` and `ffx2` scenes).

No model or asset was downloaded for option A (so no `downloads.md` entry), and nothing was rendered on the GPU.

## Files

`src/engine/fx/EyeCandy.ts` (switch, tiers, dials, frame probe), `src/debug/fxApi.ts` (`__pyrefly.fx`),
`src/engine/fx/spellTaps.ts`, `src/engine/fx/a/` (`GoldenHour.ts` controller, `GlowPass.ts` shafts, beams,
haze and streaks, `LookLut.ts`, `sceneLooks.ts` per-room data, `OverlayGlow.ts`, `LensFlare.ts`,
`KeyRim.ts`, `BackdropFocus.ts`); hooks in `Renderer.ts`, `BloomMask.ts`, `GradeShader.ts`, `FxBatch.ts`,
`SpellFxLayer.ts`, `BattleScreen.ts`, `App.ts`, `scenes/index.ts`. Every hook is inert without `?fx=a`.
