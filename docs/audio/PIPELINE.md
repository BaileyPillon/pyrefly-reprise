# Audio pipeline — pre-rendered cues

How the music and sound effects get made, how to change an instrument, and how
to check the result without being able to hear it.

For the *compositions* — the note data, the tracker syntax, the rule against
transcribing anybody's melody — see [`../AUDIO-GUIDE.md`](../AUDIO-GUIDE.md).
This file is only about how those notes become sound.

---

## Why this exists

Bailey's verdict on the original audio: *"the sound effects and music are really
bad. too arcade-y and not at all final fantasy or clair obscur inspired."*

The scores were not the problem. The problem was that every note was an
oscillator, synthesised in the browser at load time. A sawtooth stack with a
filter on it is a synthesiser, and no amount of arranging makes it a string
section.

So the scores stayed exactly as they were, and what plays them changed:

```
src/audio/tracks/*.ts          the same note data as before
        │
        ▼
tools/audio/render.mjs         OFFLINE, on the build machine
        │  ├── voices resolved to real recorded instruments
        │  ├── players seated on a concert platform
        │  ├── mixed through one shared hall
        │  └── mastered to -16 LUFS, limited under -1 dBTP
        ▼
public/audio/music/*.mp3  +  public/audio/manifest.json     (committed)
        │
        ▼
MusicLoader  ──►  if the manifest lists the cue: fetch + decode it
             └─►  otherwise: synthesise it, exactly as before
```

The last line is the important one. **The pre-rendered path is additive.** No
manifest, a failed fetch, a codec the browser rejects, or a cue nobody has
rendered yet all fall back to the original oscillator render. Audio never goes
silent because of this pipeline.

---

## Rendering

```bash
npm run audio:render -- --only=boss-seymour        # one cue
npm run audio:render -- --only=title,chapter-select
npm run audio:render -- --all                      # all 20 cues + the sfx sprite
npm run audio:render -- --all --audition            # also write docs/audio/audition/
npm run audio:instruments                           # the instrument map, then exit
```

Needs the sample libraries installed — see [`CREDITS.md`](CREDITS.md). It
refuses to start without them rather than quietly rendering something worse.

Useful flags: `--wav` keeps the pre-encode WAV for close listening, `--rate=N`
changes the render rate, `--no-encode` measures without running ffmpeg,
`--out=DIR` writes somewhere other than `public/audio`.

Roughly 10-20 s per cue, about six minutes for everything. It is single-process
on purpose: the three libraries are 1.9 GB of sample data, loaded once and
shared across every cue, and giving each worker its own copy would need memory
this machine does not reliably have.

---

## Adding or changing an instrument

**You should never need to open `tools/audio/`.** An instrument is plain data in
`src/audio/voices/presets/<group>.ts`, and the groups mirror the synthesised
voices next door: `keys`, `sustained`, `percussion`, `band`, `electronic`.

To make the horns darker and slower to speak:

```ts
// src/audio/voices/presets/sustained.ts
brass: {
  name: 'brass',
  about: 'Horn section under trombones — the weight in a boss tutti.',
  seat: 'horn',
  layers: [
    { lib: 'sonatina', name: 'Horn Section', pan: -0.2 },
    { lib: 'sonatina', name: 'Trombone Section', pan: 0.25, gain: 0.6 },
  ],
  attackSec: 0.08,        // was 0.045 — slower to speak
  releaseSec: 0.5,
  timingJitterMs: 16,
  gain: 0.65,             // was 0.72 — a little further back
},
```

To add a new one, give it a name no score uses yet and it is immediately
available as a channel's `instrument`:

```ts
'english-horn': {
  name: 'english-horn',            // must equal the key; a test enforces this
  about: 'Cor anglais — the lonely reed above a held string chord.',
  seat: 'oboe',
  layers: [{ lib: 'sonatina', name: 'English Horn' }],
  attackSec: 0.05,
  releaseSec: 0.45,
  timingJitterMs: 9,
},
```

Then `npm run audio:instruments` to confirm it resolved, and re-render any cue
that uses it.

### The knobs, and what they are for

| Field | What it does |
|---|---|
| `layers` | Which library patches to stack. Two or three slightly detuned is how one recorded desk becomes a section. |
| `seat` | Where on the platform it sits — see `seating.ts`. Decides pan and how wet it is. |
| `gain`, `pan`, `tuneCents` | Overall trim. |
| `velocityCurve` | How hard velocity drives loudness. `1` is a volume slider; `1.4` (default) reads like a player's dynamics. |
| `velocityTilt` | Soft notes get darker as well as quieter. Set `false` for a library with real velocity layers — Salamander's piano has sixteen and does not need help. |
| `attackSec` | Extra attack. A slow bow, a breathy entry. |
| `releaseSec` | Tail past note-off. **This is what makes legato legato**: overlapping tails are how separate events become a phrase. |
| `timingJitterMs` | Deterministic per-note start jitter. A section is never exactly together, and without a few ms here it attacks on one sample and reads as a synth. The single most valuable field in this table. |
| `drum` | GM percussion note to fire. `pitchRef` lets a tuned drum still follow the score. |
| `amp` | Amp-style drive and cabinet filter, for the electric guitars. |
| `caveat` | Say so when the result is a stand-in, not the real instrument. |

### Seating

`seating.ts` holds the platform: `pan` (audience perspective) and `depth`
(0 at the front edge, 1 at the back wall). Depth sets how much of an instrument
goes into the hall, which is what makes a back-row choir sound further away than
a front-row harp without anyone touching a reverb control.

Changing the apparent room for everything at once is one line — `sendOf()`.

---

## Checking it without ears

An agent cannot hear whether a cue sounds like an orchestra, so the renderer
measures instead, and exits non-zero if a cue fails. Bailey does the listening;
these only stop obviously broken audio from reaching him.

| Check | Target | Why |
|---|---|---|
| Integrated loudness | -16 LUFS ±2 (ITU-R BS.1770-4) | Consistent cue to cue, and quiet enough that effects sit on top. |
| True peak | under -1 dBTP | Sample peak is not enough: an MP3 decoder reconstructs between our samples and overshoots. |
| Loop seam | wrap no harder than the entry | See below. |
| Spectral balance | air ≤ -12 dB, presence ≤ -5 dB, downward tilt above 250 Hz | The direct test for "arcade-y". |

The spectral test deserves a word, because the obvious version of it is wrong.
"1-4 kHz must not be the loudest band" rejects good music — a flute-led cue
genuinely peaks there. What actually separates an orchestra in a hall from a
stack of oscillators is the **tilt**: above the low mids a recorded ensemble
slopes steadily down, because instrument bodies radiate less up there and the
hall absorbs what is left. A saw wave has harmonics at 1/n forever and comes out
nearly flat. So the check is the slope, with room for one band (a piccolo, a
cymbal) to buck it.

For the record, measured before and after on three cues — band energy in dB
relative to the loudest band, and the average tilt per band:

| cue | | low-mid | mid | high-mid | presence | air | tilt |
|---|---|---|---|---|---|---|---|
| `boss-seymour` | oscillators | -8.5 | -18.8 | -26.9 | -34.2 | -44.7 | -9.05 |
| | sampled | -3.9 | -6.5 | -17.2 | -32.6 | **-48.2** | -11.06 |
| `chapter-select` | oscillators | 0.0 | -6.7 | -14.1 | -22.2 | -31.3 | -7.82 |
| | sampled | 0.0 | -3.4 | -7.6 | -18.9 | **-35.0** | -8.75 |
| `boss-jecht` | oscillators | -6.9 | -12.5 | -16.6 | -20.4 | -21.8 | -3.72 |
| | sampled | -2.3 | -1.8 | 0.0 | -13.1 | **-33.0** | -7.70 |

`boss-jecht` is the clearest case. The oscillator render's air band sat 21.8 dB
down with a tilt of only -3.72 — very nearly flat to 16 kHz, which is precisely
the fizz "arcade-y" describes. The sampled render puts air 33 dB down. All three
cues also gained substantial low-mid weight: the orchestra has a body now.

---

## Loops

A cue ships as **intro + loop body + the first 3 s of the loop body again**, and
the manifest carries `loopStart` / `loopEnd` in seconds. The game plays it with
`AudioBufferSourceNode.loop`, so playback wraps inside the buffer, and the
repeated head means any constant decoder offset still lands on identical music.

Two things had to be right for that to be seamless, and the second was a real
bug this pipeline found:

1. **`foldTail`** wraps everything still ringing past `loopEnd` back over the
   start of the loop, so nothing is cut off. This was already there.
2. **`crossfadeLoopSeam`** makes the *waveform* continuous. `foldTail` makes the
   loop's energy continuous but not its shape: the last sample of the loop and
   the first are two unrelated moments, and the step between them was up to
   twice the local RMS — a broadband click on every single wrap, in every cue,
   including on the old synthesised path.

   The fix is the standard one: `buf[loopStart - 1] → buf[loopStart]` is already
   continuous because it is contiguous audio, so we crossfade the last 18 ms
   before `loopEnd` into the 18 ms before `loopStart`. By the time the player
   reaches the wrap it is hearing the run-up to `loopStart`, and the loop flows.

   It runs **last**, after mastering, and that ordering matters: a compressor or
   limiter ahead of it applies a different gain either side of the wrap and
   re-opens the step it just closed. That cost an hour; please leave it where
   it is.

Hence the seam test compares the wrap against **the entry into the loop**
rather than against zero. A cue whose loop opens on a downbeat has a real
transient at `loopStart`, and the listener already accepted it on the first
pass. The goal is not "no step", it is "the wrap sounds exactly like the first
time round".

---

## Sound effects

All ~134 cues render into one sprite, `public/audio/sfx/sprite.mp3`, with the
manifest storing each cue's offset and duration. One request beats a hundred
and thirty-four, and LAME's gapless header makes the offsets land accurately
after `decodeAudioData`.

The effects are still synthesised — they are sound *design*, not performances,
and the DSP kit in `src/audio/sfx/` is the right tool for them. What changed is
where they sit: the runtime puts a send from the SFX bus into a `ConvolverNode`
loaded with the impulse response of **the same hall the music was mixed in**
(`src/audio/dsp/hall.ts`, rendered on the fly — no download). A sword hit and
the strings behind it now decay into one room instead of sounding pasted on.

A cue fired before the sprite has decoded uses its synthesised version rather
than waiting. A menu tick 200 ms late is worse than a slightly different one on
time.

---

## The parts

| File | What it is |
|---|---|
| `tools/audio/sf2.mjs` | SoundFont 2 reader: RIFF tree, the preset/instrument/sample hydra, generator merging. |
| `tools/audio/sampler.mjs` | The voice engine: nearest-sample selection, windowed-sinc resampling, velocity layers, sustain looping, release tails, timing jitter, amp modelling. |
| `tools/audio/libs.mjs` | Where the libraries live; lazy loading and caching. |
| `tools/audio/master.mjs` | Bus compressor, loudness match, look-ahead limiter. |
| `tools/audio/measure.mjs` | BS.1770 loudness, true peak, spectrum, seam. |
| `tools/audio/render.mjs` | The CLI. |
| `src/audio/voices/presets/` | **The instrument data. Start here.** |
| `src/audio/dsp/hall.ts` | The concert hall — a 16-line Jot FDN, shared by the offline mix and the runtime SFX reverb. |
| `src/audio/manifest.ts` | Manifest parsing, loop maths, eviction. Platform-free and unit-tested. |
| `src/audio/MusicLoader.ts` | Picks the route: pre-rendered, or synthesised. |

`render.ts` grew four optional hooks — `voiceFor`, `spatialise`,
`reverbRender`, `master` — and every one defaults to the old behaviour, so the
sequencer itself is not forked between offline and runtime. There is one
sequencer, and offline swaps parts of it out.

### Why the hall was rewritten

The Freeverb in `dsp/reverb.ts` is eight comb filters into four allpasses. It is
cheap and fine on a synth pad, but eight combs have eight resonant peaks, and a
string section holding a chord will find every one of them. That metallic ring
was a real part of why the mix read as "game synth". `dsp/hall.ts` is a Jot-style
feedback delay network instead: sixteen prime-length lines Hadamard-mixed every
sample, so the modal density is high enough that no single mode is audible, plus
early reflections, frequency-dependent decay and a little modulation so a long
tail breathes. `reverb.ts` stays for the SFX kit, which still wants it.

---

## Honest caveats

Three instruments are stand-ins, and say so in their own `caveat` field so the
claim cannot drift away from the data:

- **`strings-short`** — no free library we ship has a true spiccato. This is
  pizzicato plus a hard-gated sustain. Right articulation, slightly wrong bow.
- **`soprano`** — derived from the mixed-choir samples, not a solo-soprano
  recording. Convincing high and quiet; thin if written low or loud.
- **`taiko`** — a pitched-down orchestral bass drum. Close, but rounder than the
  real thing.

If any of these matters enough to fix, the answer is another free library, not a
cleverer envelope. Add it per the rules in `CREDITS.md`.
