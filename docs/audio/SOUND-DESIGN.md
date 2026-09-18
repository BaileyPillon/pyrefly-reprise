# Sound design — the effects

Bailey's verdict covered the effects as well as the music: *"the sound effects
and music are really bad. too arcade-y and not at all final fantasy or clair
obscur inspired."*

For the effects the diagnosis was slightly different from the music's. The
scores were fine and only their timbre was wrong; the effects were wrong at the
level of **material**. A menu tick was a filtered pulse wave, a denial was a
square-wave buzz, a sword was band-passed noise and an FM zap. No amount of
mixing rescues that, because the ear identifies an oscillator in about 15 ms.

So every one of the 134 effects was redesigned from scratch, out of the
materials the score is made of.

---

## The three rules that do most of the work

From `THEMES.md` § "Sound-effect rules", and now enforced in code rather than
trusted to whoever writes the next cue:

1. **One pitch set.** Everything pitched is in B minor — the tonic triad plus
   the 2 (C#) and the b6 (G), the two degrees that ache in the farewell theme.
   A cursor tick is the 5. A confirmation rises to the tonic. A refusal is the
   b6 leaning on the 5. Nothing else in the game is allowed to be pitched, and
   a unit test fails the build if an interface cue strays outside the set.
2. **One room.** Effects are rendered dry-ish and share the music's hall
   through a `ConvolverNode` send at runtime (UI 0.12, magic 0.35, impacts
   0.25). A sword and the strings behind it decay into the same building.
3. **Soft attacks, and a ceiling on the top end.** Minimum 6 ms fade-in on
   every menu sound, and a low-pass over every finished cue (10-13 kHz by
   category). Instant attacks and energy at 14 kHz are most of what "cheap"
   means.

Plus one rule that is really a taste: **nothing is harsh**. There is no square
wave, no saw, no pulse, no bit-crush and no error buzz anywhere in the bank —
the vocabulary in `design.ts` does not contain them. A denial is two soft bells
a whole tone apart, damped in 200 ms.

---

## How an effect is written now

An effect is **data**: a list of layered materials, struck at times.

```ts
critical: {
  about: 'Critical: the impact, an orchestral stab on the tonic triad, and a tam-tam opening behind it.',
  category: 'flourish',
  length: 2.4,
  layers: [
    cloth({ at: 0, dur: 0.06, gain: 0.2 }),          // movement, 40 ms early
    bodyHit({ at: 0.04, vel: 0.9, gain: 0.6 }),      // a real bass drum
    subImpact({ at: 0.04, freq: SUB.home, ... }),    // weight at 61.7 Hz
    ...stab(CHORDS.tonicLow, { at: 0.045, ... }),    // brass + short strings + timpani
    tamTam({ at: 0.05, dur: 1.4, vel: 0.7 }),        // the hall opening
    steelRing({ at: 0.05, freq: 1568, ... }),        // the edge, on the b6
  ],
},
```

`materials.ts` holds the palette — `glass`, `bell`, `toll`, `harpRoll`,
`choirBloom`, `sopranoLine`, `shimmer`, `cloth`, `whoosh`, `breath`,
`steelRing`, `subImpact`, `bodyHit`, `timpani`, `tamTam`, `cymbalSwell`,
`stab`, `lowStrings`, `pizz`, `scatter`, `suction`, `drone`, `motif` — already
in the right key, at the right brightness, with the right attack. An author
reaches for a gesture, not for a filter.

### The two render paths

The same design renders twice, and this is the important part:

```
src/audio/sfx/*.ts  (the designs)
        │
        ├── tools/audio/render.mjs ──► recorded instruments from the sample
        │                              libraries ──► public/audio/sfx/sprite.mp3
        │                              (this is what a player hears)
        │
        └── the browser ────────────► the synthesised voices in src/audio/voices
                                       (the safety net for the ~200 ms before the
                                        sprite has decoded, and for any browser
                                        that will not decode it)
```

Same arrangement, same rules, same timing either way. Only the timbre of each
layer differs — which is exactly the axis the pre-render exists to improve, and
it means a cue can never drift between the two paths. The game still ships no
third-party audio: the libraries stay on the build machine (`CREDITS.md`).

The sampled bank has 66 instruments and the synthesised one has 40, so
`RUNTIME_STAND_INS` names the nearest relative for the difference (a
synthesised "tam-tam" is a cymbal swell with the top rolled off). Those
stand-ins are honestly worse. That is the point of shipping the render.

### Categories

A cue's category decides its loudness, its top end and its minimum attack.
Levelling is per category rather than per cue, because a cursor tick *belongs*
10 dB under a summon and flattening the bank to one number is the loudest
possible way to sound cheap.

| Category | Target | Top | What is in it |
|---|---|---|---|
| `ui` | -24 LUFS | 11 kHz | ticks, chimes, counters — 28 cues |
| `ambience` | -22 | 10 kHz | wind, rooms, pyreflies, distant voices — 12 |
| `weapon` | -18 | 13 kHz | swings and shots — 14 |
| `impact` | -16 | 12 kHz | landed blows, explosions, the ground — 10 |
| `spell` | -15 | 12 kHz | magic and statuses — 50 |
| `flourish` | -14 | 13 kHz | criticals, summons, victory, Overdrives — 20 |

Measured as the loudest 400 ms, K-weighted (`measureMomentaryLufs`) — integrated
LUFS is meaningless for a 140 ms cue, and the max-short-term number is what the
brief means by "-24 LUFS short-term".

---

## Adding or changing a cue

1. Write the design in the right group file (`ui`, `battle`, `magic`,
   `weapons`, `enemy`, `flow`, `spells`, `support`, `story`). Use materials.
2. `npx vitest run tests/unit/audio-sfx-design.test.ts` — the structural rules,
   the pitch set, the instrument existence check on both paths.
3. `npm run audio:render -- --sfx` — re-renders the sprite (about 40 s) and
   updates `public/audio/manifest.json`. It refuses to run without the sample
   libraries rather than quietly shipping the synthesised version.
4. `npm run audio:render -- --sfx --audition` also writes every cue as its own
   MP3 under `docs/audio/audition/sfx/` (gitignored) — nobody can judge a menu
   tick by scrubbing to 41.7 s in a four-minute sprite.

`--sfx` on its own renders the effects and nothing else. It will not touch the
music renders, which matters while somebody else is arranging.

---

## What changed, measured

An agent cannot hear the bank, so here is the number that stands in for the
complaint. Band energies in dB relative to each cue's loudest band, and the
average tilt across low-mid → air. A recorded ensemble in a hall slopes
steadily downward; a stack of oscillators is nearly flat, which is what
"arcade-y" describes.

| cue | | low-mid | mid | high-mid | presence | air | tilt |
|---|---|---|---|---|---|---|---|
| `confirm` | oscillator | -40.6 | 0.0 | -3.6 | -10.3 | -15.3 | **+6.31** |
| | sampled | -37.7 | 0.0 | -17.5 | -35.0 | **-60.7** | -5.76 |
| `hit-1` | oscillator | -15.3 | -34.3 | -35.6 | -39.4 | -40.7 | -6.35 |
| | sampled | -17.6 | -14.7 | -38.1 | -39.4 | **-68.2** | -12.67 |
| `sword-slash-1` | oscillator | -20.6 | -4.6 | 0.0 | -2.8 | -6.8 | **+3.46** |
| | sampled | -28.4 | 0.0 | -20.1 | -19.5 | -31.7 | -0.81 |
| `ice` | oscillator | -27.1 | 0.0 | -9.2 | -12.6 | -11.1 | **+3.99** |
| | sampled | -2.4 | -2.9 | -0.8 | -4.9 | -11.0 | -2.14 |
| `fire` | oscillator | -10.8 | -10.8 | -13.9 | -13.7 | -16.9 | -1.52 |
| | sampled | -3.9 | -12.2 | -15.8 | -23.5 | -33.3 | -7.35 |
| `cure` | oscillator | -5.3 | 0.0 | -14.2 | -19.4 | -19.3 | -3.48 |
| | sampled | 0.0 | -13.3 | -14.8 | -23.6 | -25.5 | -6.37 |

Mean tilt across thirteen representative cues: **-2.24 dB per band before,
-6.31 after**. Three of them — `confirm`, `sword-slash-1`, `ice` — had a
*rising* spectrum: more energy at 8-16 kHz than at 250 Hz. That is a literal
measurement of "cheap", and it is gone.

Levels, from the render report:

```
ambience   12 cues  mean -21.9 LUFS (target -22)
flourish   20 cues  mean -14.2 LUFS (target -14)
impact     10 cues  mean -16.4 LUFS (target -16)
spell      50 cues  mean -15.0 LUFS (target -15)
ui         28 cues  mean -23.7 LUFS (target -24)
weapon     14 cues  mean -18.0 LUFS (target -18)
```

134 cues, 4:04, 2.71 MB, every cue under -1 dBTP.

---

## Honest caveats

- **No recorded foley.** The brief allowed CC0 foley packs (Kenney,
  OpenGameArt) as an additional source. Nothing was downloaded: cloth, air,
  debris and grit here are band-limited noise layers under recorded orchestral
  material, not recordings of cloth. They read as movement, they sit under the
  transient where the rule wants them, and they are the least convincing thing
  in the bank. If Bailey wants real foley, that is a download decision for him
  to make, and these layers are the ones to replace first.
- **`soprano` and `tam-tam` are stand-ins** even on the sampled path — see the
  caveats in `PIPELINE.md`. The tam-tam is a pitched-down orchestral bass drum,
  which is rounder and less shimmering than the real instrument, and it carries
  a lot of weight in this bank (every big impact and every boss moment).
- **The runtime fallback is audibly worse.** That is by design, and it only
  plays for the moment before the sprite decodes.
