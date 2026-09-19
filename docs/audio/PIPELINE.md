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
| `timingJitterMs` | Deterministic per-note start jitter. A section is never exactly together, and without a few ms here it attacks on one sample and reads as a synth. The single most valuable field in this table. One channel can overrule it — see [Per-channel performance overrides](#per-channel-performance-overrides). |
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

## Tempo maps — making the pulse bend

Until recently a `Track` had one `bpm` and nothing else, so rubato had to be
written into the note values. That can move a note; it cannot move the *pulse*,
and the accompaniment stays on the grid under a melody that is trying to
breathe. THEMES.md called a tempo map "the single biggest quality item left".

A tempo map is an optional list of marks on `Track`, in beats. Both renders
honour it — the offline sampled one and the browser's procedural fallback —
because there is only one sequencer and this is a property of its clock.

```ts
// src/audio/tracks/ending-ffx.ts
import { rit, aTempo, fermata, tempoMap } from '../score.ts';

export const endingTrack: Track = {
  name: 'ending-ffx',
  bpm: 72,
  tempo: tempoMap(
    [64, 76],              // step: the second verse leans forward a little
    rit(120, 128, 54),     // hold 76 to beat 120, then slow evenly to 54 by 128
    fermata(128, 1.8),     // 1.8 s of held time after the downbeat of bar 33
    aTempo(128),           // ...and back to the written 72
  ),
  timeSig: [4, 4],
  loop: { start: 32, end: 160 },
  // ...
};
```

That is the whole syntax. Written out longhand, a mark is
`{ beat, bpm?, curve?, holdSec?, label? }`:

| Field | Means |
|---|---|
| `beat` | Where it takes effect. Marks run in non-decreasing beat order. |
| `bpm` | The tempo from here. Omit it to anchor **the tempo already sounding** (which is how a ramp gets a starting point); `'base'` means the track's own `bpm`. |
| `curve` | `'step'` (default) jumps on this beat; `'ramp'` glides across the whole span from the previous mark. |
| `holdSec` | Time stops for this long *immediately after* the beat — a fermata. The note struck on that beat is held through it; everything later moves back. |
| `label` | Printed in the render report. `'rit.'`, `'a tempo'`. |

`rit`, `accel`, `fermata` and `aTempo` build those marks; `[beat, bpm]` is
shorthand for a plain step. Mix them freely — `tempoMap()` flattens.

**What it changes.** Everywhere a beat becomes a time, it goes through the
curve: note starts, note *lengths* (the same half-note is longer at the end of
a ritardando than at the start, which is what a ritardando is), the track's
total length, and both loop points. The delay bus is the one exception — a
delay line is one fixed length, and a delay that retuned itself mid-rit. would
be a pitch shift, not an echo.

**Mind the loop.** If the tempo at `loop.end` is not the tempo at `loop.start`,
every wrap lurches: the waveform is continuous and the pulse is not. The
renderer says so, per cue:

```
  rendering ending-ffx ... 14.2s  2:41.0  3.51 MB  -16.0 LUFS  -1.22 dBTP  ok
      tempo: tempo@64→76  rit.@128→54 +1.8s  a tempo@128→72
      tempo: loop body 104.213 s through the map
  ending-ffx: tempo map — tempo at loop.end is 54.0 bpm but the loop restarts at
  76.0 bpm — the wrap will lurch; finish the rit. before loop.end or a tempo
  back onto it
```

**A track with no `tempo` is byte-identical to how it rendered before any of
this existed** — the clock is still one multiplication by `60/bpm`, in the same
order, and `tests/unit/audio-tempo.test.ts` hashes `boss-dread` against a
render from the pre-tempo-map code to prove it. So none of the twenty-one
shipped MP3s needs re-rendering. **A cue that gains a map does: re-render it.**

## Per-channel performance overrides

`timingJitterMs` belongs to the voice preset, which is right — a string section
is never exactly together and that is a property of string sections. But two
cues can want the same instrument played differently, and THEMES.md names two
places where machine timing *is* the point: Vegnagun, and the Yunalesca canon,
both `<= 3 ms` out of voices whose presets ask for 14-22.

So a channel may override its preset, for that channel only:

```ts
// src/audio/tracks/boss-vegnagun.ts
channels: [
  {
    name: 'machine ostinato',
    instrument: 'strings-short',
    perform: { timingJitterMs: 2 },   // the preset's 16 ms, for this desk only
    notes: ostinato,
  },
  {
    name: 'rite choir',
    instrument: 'choir',
    perform: { humanise: 0.15 },      // 15% of whatever the preset asks for
    notes: canon,
  },
  {
    name: 'strings',
    instrument: 'strings',
    perform: { velocityJitter: 0.03 },  // +/-0.03 on top of the written shape
    notes: bed,
  },
],
```

| Field | Means |
|---|---|
| `timingJitterMs` | Replaces the preset's figure. `0` is a machine. Offline only: the runtime oscillator voices have never had start jitter, so there is nothing there to override. |
| `humanise` | Multiplies whatever jitter is in force after that. `0` quantised, `1` as written. |
| `velocityJitter` | Deterministic +/- velocity spread per note, on top of the written shape. Applies to **both** renders, because velocity is a sequencer-level number. THEMES.md's ceiling is `0.04` and anything larger throws. |

Two channels naming the same instrument with different `perform` get different
voices and different note-cache entries, so one cue pulling a kit tight does
not drag every other cue that uses it. A channel with **no** `perform` keeps
the exact cache key — and therefore the exact per-note seed, and therefore the
exact samples — it had before the field existed.

Boss-fight accents are exempt from all of this on purpose: `0.95` on the
and-of-beat against `0.80` on the downbeat is written velocity, and no
humaniser may level it. `velocityJitter` adds to the written shape, it does not
flatten it.

## Rendering while somebody else is rendering

`public/audio/manifest.json` is one file that several agents write. The old
code read it at the top of a six-minute run, held that snapshot, and wrote the
whole object back at the end — so two overlapping renders meant the second
one's write was built from before the first one finished, and **the first
one's cues vanished from the manifest** while their MP3s sat on disk unlisted.
An unlisted cue silently falls back to the oscillator render, which is the one
failure this whole pipeline exists to prevent. It shipped a `title` entry whose
`loopEnd` was eleven seconds past the end of the file it named.

`tools/audio/manifest-io.mjs` fixes it three ways, all three needed:

1. **A lock.** `open(path, 'wx')` is atomic, so exactly one process holds
   `manifest.json.lock`. The lock carries its owner's pid: a crashed render's
   lock is taken immediately rather than blocking the next one forever, and a
   live owner is respected.
2. **Re-read inside the lock.** The merge is against what is on disk *now*.
   A render replaces only the cues it rendered; every other key is copied
   through untouched, and the entries are written in sorted order so the diff
   in a commit is only what changed.
3. **Atomic rename.** A temp file in the same directory, renamed over the
   target, retried through the EPERM Windows raises while another process has
   it open. A reader sees the whole old file or the whole new one, never a
   half-written one.

Entries are merged **as each cue finishes**, not at the end, so a crash half
way through leaves the cues that did finish listed and correct.

Anything else that edits the manifest uses the same module — `seam-probe.mjs
--fix` does:

```js
import { updateManifest, mergeIntoManifest, musicEntry } from './manifest-io.mjs';

// Add or replace entries:
await mergeIntoManifest(outRoot, {
  sampleRate,
  music: {
    [name]: musicEntry({
      name, loopStartSample, loopEndSample, totalSamples, sampleRate,
      bytes, lufs, truePeakDb,
    }),
  },
});

// Or edit whatever is live, under the lock:
await updateManifest(outRoot, (live) => {
  live.music[name].loopEnd = corrected;
});
```

Use `musicEntry()` rather than building the object by hand: it is what writes
**loop points to six decimals**, and four decimals is 4.4 samples at 44.1 kHz
— enough to put the wrap beside the sample the seam crossfade matched. See
[Loops](#loops) below for what that sounded like.

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

### Checking it again, after the encoder

The renderer measures what it is about to hand to ffmpeg. That is the wrong
side of the encode for three of the gates, so there is a second pass that
decodes the shipped MP3s the way a browser will and measures those instead.

```
node tools/audio/qa.mjs [--json=PATH] [--only=cue,cue] [--strict]
node tools/audio/seam-probe.mjs [cue ...] [--fix]
node tools/audio/themes-audit.mjs [cue ...] [--verbose]
node tools/audio/integration.mjs            # the game, in a real browser
```

It is worth running because the two passes have disagreed, every time for a
reason worth knowing:

- **True peak moves.** The music path limits to 0.4 dB under the ceiling
  because MDCT quantisation overshoots whatever it is given; the sprite path
  limited to exactly −1 dB and shipped at **−0.80 dBTP**. Same bug, one file,
  one line.
- **The manifest can disagree with the file.** Several agents render into one
  `manifest.json`, and it used to be read-modify-write, so a slow render saved
  an entry another agent had already replaced. That shipped a `title` entry
  whose `loopEnd` was 11 s past the end of the file it named. The write is
  locked now (see [Rendering while somebody else is
  rendering](#rendering-while-somebody-else-is-rendering)), but keep the check:
  only something that opens the file can see a manifest that lies about it.
- **`themes-audit.mjs` reads the score, not the audio**, and asks the question
  no measurement can: is the theme `THEMES.md` promises actually in this cue?
  It searches for each cell as an *interval* sequence, because every legal
  transformation in the bible — transposition, augmentation, re-barring into
  3/4 — keeps the intervals and moves only the pitches.

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

3. **The manifest has to say where the seam is to the sample.** Both of the
   above make the waveform continuous at one exact sample, and the first
   version of the manifest then rounded the loop points to four decimal places
   — which at 44.1 kHz is 4.4 samples. The wrap therefore landed one or two
   samples beside the sample that had been crossfaded, and stepped by whatever
   the waveform happened to be doing in between: up to 0.13 (−17 dBFS) on
   `ending-ffx`, nearly five times the largest step anywhere else in that cue.
   A single-sample impulse, once per loop, on the quietest music in the game.

   Loop points are written with six decimals now, which resolves to a
   twentieth of a sample. `tests/unit/audio-shipped-files.test.ts` fails if any
   entry drifts back off a sample boundary, and `tools/audio/seam-probe.mjs
   --fix` re-derives the right values from the audio without re-rendering it.

Hence the seam test compares the wrap against **the entry into the loop**
rather than against zero. A cue whose loop opens on a downbeat has a real
transient at `loopStart`, and the listener already accepted it on the first
pass. The goal is not "no step", it is "the wrap sounds exactly like the first
time round".

---

## Sound effects

All 134 cues render into one sprite, `public/audio/sfx/sprite.mp3`, with the
manifest storing each cue's offset and duration. One request beats a hundred
and thirty-four, and LAME's gapless header makes the offsets land accurately
after `decodeAudioData`.

**The effects are sampled too.** An effect is a layered design in B minor (see
[`SOUND-DESIGN.md`](SOUND-DESIGN.md)), and its `note` layers — glass, bells,
harp, choir, tam-tam, timpani, a solo cello — resolve to the same recorded
instruments the music uses when the sprite is rendered, and to the synthesised
voices when the browser has to cover for it. Only air, sub weight and metallic
ring are synthesised, and they sit under recorded material rather than being
the sound itself.

Render them on their own with `npm run audio:render -- --sfx`, which touches no
music file. Each cue is trimmed, levelled to its category's target (measured as
the loudest 400 ms, K-weighted) and held under -1 dBTP; the tool fails if a cue
is more than 3 LU off its category or the sprite goes over 3.5 MB.

The runtime also puts a send from the SFX bus into a `ConvolverNode` loaded
with the impulse response of **the same hall the music was mixed in**
(`src/audio/dsp/hall.ts`, rendered on the fly — no download), so a sword hit and
the strings behind it decay into one room instead of sounding pasted on.

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
| `tools/audio/manifest-io.mjs` | The manifest, locked: one writer at a time, re-read before write, atomic rename. |
| `src/audio/tempo.ts` | Beat-to-seconds through a tempo map. Every note time in the engine goes through it. |
| `src/audio/voices/presets/` | **The instrument data. Start here.** |
| `src/audio/sfx/design.ts` | The sound-design vocabulary and the rules it enforces. |
| `src/audio/sfx/materials.ts` | The palette: glass, bells, harp, choir, cloth, sub, steel. |
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
