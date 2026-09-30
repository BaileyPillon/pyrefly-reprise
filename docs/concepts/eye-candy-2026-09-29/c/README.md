# Option C, "Spectacle Combat" (eye-candy options round, 2026-09-29)

Branch `fx-c`, behind `?fx=c` (or `?fx=all`), default OFF. It is a prototype and must not be merged into `main` until Bailey picks.
Without the parameter nothing is installed: there is no port, no pass and no CSS class, so the build is `main` exactly.
Runtime switches:
- `__pyrefly.fx.set('c', false)`
- `__pyrefly.fx.sub('<id>', false)`, where the ids are `hitstop`, `shake`, `splash`, `heat`, `orbit` and `foil`
- `__pyrefly.fx.dial(name, v)`, where the names are `shake`, `sparks`, `impact`, `spells`, `hitstop`, `splash`, `heat`, `orbit` and `all`
- `__pyrefly.fx.freeze(on)`

## What it does, in six lines

1. **Hits land hard.** Velocity-stretched streaks fly off each blow, with a double shock ring and a four-armed glint. On the first hit the field freezes for a moment (hit-stop), and the camera takes a trauma-model shake with a dolly kick. The blow's colour is cast onto the fighters nearby.
2. **An impact frame (C1).** For two frames on a heavy blow or on the payoff of an Overdrive or Special, the canvas turns to ink and paper. The luma is posterised, the edge lines turn gold (FFX) or pink (FFX-2), and ink speed lines radiate from the blow. It is the most striking frame in the set (`stills/*-impact-on.jpg`).
3. **Spell layers on top of the approved option-B spells (D-227).** These live in the 3D field, so the bloom takes them:
   - fire: a domain-warped flame column with embers and heat haze;
   - ice: faceted crystal spikes that burst from the floor and shatter into glints;
   - lightning: branching bolts that crawl four times in 200 ms;
   - non-elemental magic (Flare): nova rings.
4. **Overdrive and Special splash (C6).** The approved painting slides in on a -12° Ink & Gold slab over crisp CSS speed lines, and the ability's name is stamped on it. The HUD, the numerals and the letterbox stay above it. The first play is the full 0.7 s beat, and repeats are a 250 ms flash. Confirm or Esc skips it.
5. **Payoffs.**
   - Mega Flare (FFX-2, Chapter IV): a pink shock shell swells over the party, with a floor ring and debris.
   - Aerospark (FFX-2, Chapter XVI): a violet-white lightning lance runs from Ixion's horn.
   - FFX Overdrives: gold ribbons wind round the target.
   - Every sent fiend: a light pillar, embers off the burn edge and a column of pyreflies.
6. **Foil numerals (C7)**, gold in FFX and pink in FFX-2, with a hard 2 px ink shadow and one sheen sweep (CSS only, no blur). There is also a **victory arc (C9)**: 12° round the party with a rise, a push, a rim swell and a warm floor glow. Chapter IV holds instead (research §2.2: no celebration), with only a slow push.

**At rest, C adds nothing on purpose.** C is combat only, so the `rest` pairs are identical by design. Stack it with A or B (option D) for a richer idle frame.

## Per game (rule 14)

| | FFX (Chapters I and VII) | FFX-2 (Chapters IV and XVI) |
|---|---|---|
| Palette | Gold and ivory, navy ink | Pink and magenta, plum ink |
| Hit-stop | 85 ms on every heavy blow; 40 ms on an ordinary first hit | 55 ms on crits only; 28 ms on an ordinary first hit; never on chain hits 2 and later (ATB pace) |
| Shake | Max 0.16, roll 1.6°, 18 Hz | Max 0.20, roll 2.2°, 24 Hz |
| Streaks | Round gold | Pink, with four-point glints at the heads |
| Splash | Ivory slab with gold rules; the party member's approved attack painting | Pink slab with 8 px corners and four-point stars. Ixion: `characters/x2-ixion/overdrive.png`. **Bahamut: slab and name only**: the approved Chapter IV plate shows Yuna, not the boss, and no Bahamut painting is approved |
| Specials | Gold ribbons (Spiral Cut and the others) | Mega Flare shell; Aerospark lance (**a new Special look: needs Bailey's yes, D-233**) |
| Send-off | Gold edge, warm pyreflies | The same pyreflies (canon in both games) with a violet-pink edge and 20 % four-point glints (ours) |
| Victory | 2.6 s arc | 2.2 s arc plus one sparkle sweep; Chapter IV holds (push only) |

Chapter VII sends nobody: the Guardians yield, Seymour leaves a body and Anima is dismissed. So C adds no dissolve there.

## Re-offers (declined on 19 Sep; each is its own sub-switch, strike them one by one)

- `hitstop` re-offers the goal of **hit-feel**. Main already ships an 85 ms presenter sleep; C adds a real presentation freeze (the engine and the HUD never stop).
- `splash` re-offers the goal of **overdrive-cinematic**, by another method: one splash beat, not the four-cut camera.

## Phone tier, Reduce motion, Low effects

- **Phone** (`min(w, h) < 600`):
  - 60 % of the streaks;
  - 8 ice spikes and no lightning branches, with 2 bolt passes instead of 4;
  - no heat haze;
  - an 8° victory arc;
  - the send-off gets no pillar and fewer motes.

  Measured: the phone passes its gate with this tier, so no lighter tier was needed.
- **Reduce motion**: no hit-stop, no shake or kick, no impact frame, no victory arc and no send-off. The splash becomes a static 200 ms fade, and the numeral sheen is off.
- **REDUCE FLASHES** (read defensively until r31-access lands): the impact frame is one frame at 35 % toward ivory with no inversion, lightning is a single bolt, and the exposure lifts are capped at about 0.06 to 0.08.
- **Low effects**: no streaks and no spell layers (today's burst and the approved `low` spell tier). The impact frame, hit-stop, shake, splash (lines static), foil and victory arc stay.

## Frame times (`perf.json`; ON = `?fx=c`, OFF = `?fx=off`, vsync on, combat window of `autoBattle`)

| Chapter | Desktop 1600×900: p50 / p95 ON | p95 OFF | Phone 390×844, 4× CPU: p50 / p95 ON | p95 OFF |
|---|---|---|---|---|
| I Seymour Flux | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.8 |
| VII Macalania | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.8 |
| IV Bahamut | 16.7 / 16.7 | 16.7 | 16.7 / 16.8 | 16.8 |
| XVI Ixion | 16.7 / 16.7 | 16.7 | 16.7 / 16.7 | 16.8 |

- **All eight runs pass the spec §8 gate:** p95 ≤ 17.0 ms on the desktop and ≤ 33.4 ms on the phone, and ON is no worse than OFF by more than 0.3 ms.
- **Where the cost is:**
  - The particles are simulated in the vertex shader, so after the first upload each frame costs one uniform.
  - The post pass is enabled only on the frames that need it.
- **Caveats:**
  - The phone run throttles the CPU only; the GPU is still the desktop card.
  - Uncapped headroom was not measured: the harness waits by frame count, which runs out before the menu appears with vsync off.
  - The p99 of 33 ms on the phone is the same ON and OFF.

## The dials: how far each goes and where it starts to hurt

Each dial is `?fxdial=name:v` or `__pyrefly.fx.dial(name, v)`, with 1 = as shipped here and a range of 0 to 3.

| Dial | What it scales | Where it starts to hurt |
|---|---|---|
| `sparks` | Streak count | Above about 1.6, a multi-hit reel buries the target in lines and the numerals lose their ground |
| `shake` | Trauma added per blow | Above about 1.4 on FFX, the calm of CTB turns into jitter; at 2 or more the HUD reads as moving against the frame |
| `impact` | The impact frame (0 = off) | It is on or off. More than one per action or more than three a second is blocked by the flash budget, because the ink frame is a flash risk |
| `hitstop` | Freeze length | Above about 1.5 (130 ms FFX), hits start to feel laggy rather than heavy. FFX-2 above about 1.3 fights the ATB pace |
| `spells` | Flame gain (capped at 1.6); 0 = no layers | Above about 1.3 the flame core clips to white on big bosses (Bahamut, Seymour); the first build did exactly that |
| `heat` | Heat-haze strength | Above about 1.5 the painting behind the fire visibly smears, and the approved painting should stay the star |
| `orbit` | Victory arc (0 = none) | The yaw is capped at 12° because the figures are flat paintings; more shows the card edge. The dial only goes down |
| `splash` | 0 = no splash | — |

The first build drove every colour at 3 to 5× HDR, which bloomed into white discs that erased the figure hit and washed the HUD behind it. The shipped values keep effect cores at about 1.2 to 2 (linear), so thin lines bloom and broad shapes do not.

## Capture notes

- **Stills.** There are seven moments per chapter: rest, hit, impact, spell, splash, special and victory. Each is ON and OFF of the same frozen frame (`__pyrefly.fx.freeze`); C hides, and does not clear, for the OFF shot. They are 1600×900, JPEG q88.
- **`autoBattle('intended')` at normal speed.**
  - Chapter I uses seed 3, because seed 1 loses the fight.
  - Chapter IV's spell is **INJECTED**: a fire (Black Mage -ra) on Bahamut at the first menu. The fight casts no elemental spell at seed 1.
- **Phone stills.** The four phone stills are INJECTED spell moments at the first menu. They are 390×844 at deviceScaleFactor 3, saved at 2×.
- **Clips.** There is one 8-second clip per chapter round the Overdrive or Special, at 1600×900, H.264, 2.0 to 2.9 MB each.
- **`captions.json`** names the one thing to look at in each file.

## Known faults and open points

- **The seeded battle log was not compared ON and OFF** (spec C check 1). The engine never sees C (ports only), but FFX-2's ATB runs in real time, so a capture's freezes change which turns happen. That is why Mega Flare needed a second run.
- **The HUD crispness crop test** (spec C check 3) was **not run**. Nothing in C filters DOM: the HUD, the numerals and the splash are unblurred by construction.
- **Bahamut's splash has no painting.** It needs a decision: an approved Bahamut painting, or slab and name only.
- The Chapter IV splash title sits partly under the telegraph's CHARGING chip.
- **The FFX-2 party Specials get the slab and name only.** There is no approved splash painting for them.
- **The ice spikes sit around the approved option-B shards.** On a small target they read as a frosty glow rather than crisp crystal.
- **The victory difference is modest in a still.** The arc reads in motion (clips).
- **Aerospark's look is new and needs Bailey's yes** (D-233).
