# Requests — arranger, group "ffx-general"

Things the seven cues in this group (`battle-ffx`, `boss-dread`, `victory-ffx`,
`ending-ffx`, `scene-gagazet`, `scene-zanarkand-dome`, `scene-dreams-end`)
wanted and could not have. Ranked by how much each one would change what
Bailey hears. Nothing here is urgent enough to have blocked a render: every
cue ships, and every workaround is commented where it lands.

---

## 1. The 70-instrument palette is really a 41-instrument palette

**What happened.** The handoff lists seventy instruments an arranger may name
in a channel. Forty-one of them work. The other twenty-nine — `horn`,
`cello-solo`, `violin-solo`, `soprano`, `oboe`, `clarinet`, `bassoon`,
`trumpet`, `trombone`, `pizzicato`, `strings-trem`, `organ-rock`,
`guitar-clean`, `glockenspiel`, `chimes`, `tam-tam`, `drum-kit` and the rest —
exist as **sampled presets only**. A channel naming one renders beautifully
offline and then fails `tests/unit/audio-registry.test.ts`, because that test
requires every channel's instrument to resolve in `INSTRUMENTS`
(`src/audio/instruments.ts`), which is the synthesised fallback the runtime
uses when an MP3 does not decode. `getInstrument()` throws on a name it does
not know, so the test is right: a cue built on a sampled-only voice would go
silent rather than degrade.

**What it cost this group, specifically.** The bible names three of these by
hand, and all three had to be approximated:

| THEMES.md asks for | cue | what it got | how close |
|---|---|---|---|
| "one unaccompanied horn" | `scene-gagazet` | `brass` (horn section + trombones) | The call is noble and it is not one player. This is the most audible of the three. |
| "solo cello, once, unaccompanied" | `scene-gagazet` | `strings-low` (cello + bass sections) | Right instrument, wrong number of them. |
| "a distant wordless soprano" | `scene-zanarkand-dome` | `choir`, written high and quiet, sent hard into the hall | Arguably safer — the resemblance guard forbids a solo female voice singing the tune straight — but it is a section, not a person. |

**The ask.** Give `INSTRUMENTS` a stand-in for each sampled-only name. It does
not have to be a new synthesis model; a thin alias is enough, because the
fallback only has to be *plausible and non-silent*: `horn → brass`,
`cello-solo → strings-low`, `soprano → choir`, `oboe`/`clarinet` → `flute`,
and so on. One map, thirty lines, and the whole advertised palette becomes
real for every arranger at once.

`src/audio/voices/presets/ffx-general.ts` already holds `horn-lone`,
`choir-men` and `alto-flute`, written and ready; they are unreachable until
this lands. The menus group raises the same request as its own #1, so it is
score-wide, not ours.

---

## 2. Tempo map (the bible's own request 1) — DELIVERED

`scene-zanarkand-dome` has to hold two tempi that the bible gives different
numbers: the nocturne at 48 bpm and the hymn inside it at 56. A track has one
`bpm`, so the hymn is played at 48 and is slower than it was written to be.
It works — a dusk scene can take it — but it is a compromise, and it is the
second-most audible thing on this list.

`ending-ffx` wants it more. `agogic()` shifts a note inside a fixed grid; it
cannot bend the pulse, and bending the pulse is half of what makes the last
eight bars of FAREWELL sound played rather than typed. The written rubato is
in there (8% breaths at the ends of bars 4, 8 and 12) and it is doing what it
can.

`Track.tempo?: Array<[beat, bpm]>` with linear interpolation, exactly as
THEMES.md §Renderer requests describes it.

**It landed, and this group has spent it.** `src/audio/tempo.ts` gives steps,
ramps (rit./accel.) and fermatas, and both renders honour it. What the two
cues above do with it now:

- `scene-zanarkand-dome` plays the hymn at **56**, the tempo the bible wrote
  it at, and the nocturne around it at 48 — the compromise described above is
  gone. Breaths at bars 4 and 8, an accelerando into the climb, a broadening
  onto bar 11 and a ritardando on the last ache.
- `ending-ffx` has the map the bible asked for, and is the cue that shows what
  it is worth: four written breaths, `accel.` into the climb, 58 → 54 on the
  arrival, a **1.5 s fermata** before the prayer answers, and the 18%
  ritardando THEMES.md names onto the last cadence in the game. 115.9 s
  written, 122.7 s played: nearly seven seconds of the cue is bent or held
  time that a fixed grid could not have produced.
- `victory-ffx` broadens 13% onto its plagal amen and hands the results loop
  over in tempo, so the fanfare relaxes rather than stopping.
- `boss-dread` has **no map, deliberately**: "HYMN, and the Yunalesca canon —
  zero. A congregation does not rubato."

In all four, `loop.start` and `loop.end` sound the same tempo, so no wrap
lurches; `tempoWarnings()` is clean for each.

### Related, and still open: the humanisation table is a preset-level problem

THEMES.md §Humanisation asks for 14-18 ms on section strings and choir and
6-9 on a solo piano. The presets are `choir` 34, `strings` 22, `strings-low`
24, `pad` 30 and `piano` **3** — every one outside the band, and the piano is
outside it downwards, which is the direction that reads as "typed".

The four cues re-rendered in this pass say so per channel (`perform:
{ humanise }`, and `timingJitterMs: 7` for the piano), which is what the
feature is for. But `battle-ffx`, `scene-gagazet` and `scene-dreams-end` still
play the presets as written — eight channels between them, listed by the
group's score audit — and the fix belongs in
`src/audio/voices/presets/` rather than in another twenty `perform` blocks
scattered across twenty-one cues. Whoever owns the presets should move them;
the arrangers should then drop the overrides.

---

## 3. Per-note expression envelope

Every long note in this group is dead straight: the string chord under the
Picardy third in `ending-ffx`, the thirty-second drone in `scene-gagazet`, the
held fifths in the Gagazet choir. The bible's workaround — split the note into
two tied attacks at 0.55 and 0.72 — is used in `scene-gagazet`'s drone (two
overlapping bows, 18 beats apart) and it is audibly two bows, not one that
swells.

A fifth `Note` slot, or a channel-level curve, is the fix.

---

## 4. Sustain-pedal events

Both piano cues fake the pedal: `gate` near 1, a reverb send held through the
bar, and the last note of each bar shortened to 0.4 of its step to "clear" on
the bar line (`leftHand()` in `scene-zanarkand-dome`, `pianoLeft()` in
`ending-ffx`). It is a good fake. A real `pedal: Array<[beat, boolean]>` would
be a better one, and it would let the nocturne blur a bar deliberately, which
is a thing a pianist does and this one currently cannot.

---

## 5. Two small things, for completeness

- **`drumLine` cannot write an off-beat accent without a trick.** `X` is
  `velocity * 1.3` and `x` is `velocity`, so "the and-of-beat is louder than
  the downbeat" is written as `x.X...X...X...X.` — lower case on the beat. It
  works, and it reads backwards to anyone who has not been told. An explicit
  per-step velocity syntax would be clearer.
- **`shapeByBar()` counts bars from beat 0, not from the note's start.**
  Handing it a section that begins at beat 48 gives every note the table's
  last entry. Every cue in this group therefore carries its own four-line
  `sectionShape()`. Either a `start` option or a note in the docstring would
  save the next arranger twenty minutes.
