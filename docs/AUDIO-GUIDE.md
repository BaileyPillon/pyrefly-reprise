# Audio Guide — music and SFX

Everything you hear in Pyrefly Reprise is **generated code**. There are no audio
files in the repo (the WAVs in `docs/audio/` are rendered previews, not runtime
assets), and every note is an original composition.

> **Rule, no exceptions:** never transcribe a Square Enix melody. Match *mood,
> tempo, instrumentation and harmonic language* — minor keys with a major lift,
> 150 bpm rock-orchestral battle, choir-and-timpani dread — and write your own
> tunes over that. The same rule covers SFX: the victory sting is an original
> rising triad, not the famous one.

## How it fits together

```
score.ts / harmony.ts        note data + composing helpers  (plain objects)
        │
        ▼
instruments.ts ── voices/    one note  → Float32 stereo buffer
        │            └── dsp/  oscillators, ADSR, filters, LFO, delay, reverb, clipper, panner
        ▼
render.ts   renderTrack(track, sampleRate) → { left, right, loopStartSample, loopEndSample }
        │
        ├── Node:    tools/render-track.mjs → docs/audio/*.wav
        └── Browser: worker.ts → MusicLoader → AudioBuffer → AudioManager
```

`dsp/`, `voices/`, `instruments.ts`, `score.ts`, `harmony.ts`, `render.ts`,
`tracks/` and `sfx/` are **platform-free**: no DOM, no Web Audio, no Node APIs.
That is what lets the offline preview and the in-game playback be sample-identical.
Only `AudioManager.ts`, `MusicLoader.ts` and `worker.ts` touch browser APIs.

Because `tools/render-track.mjs` loads these modules through Node's type
stripping, the audio modules must avoid TypeScript constructs that cannot be
erased: **no `enum`, no `namespace`, no parameter properties** (`constructor(private x)`),
no `import x = require()`. Plain types, interfaces, `as`, and `!` are all fine.

## Rendering previews

```bash
node tools/render-track.mjs all --out=docs/audio/     # 3 tracks + the SFX montage
node tools/render-track.mjs title                     # one track
node tools/render-track.mjs sfx-demo --seconds=3      # the SFX reel
node tools/render-track.mjs battle-ffx --rate=22050   # smaller/faster preview
```

It writes 16-bit PCM stereo WAV with a `smpl` chunk carrying the loop points, then
prints length, loop range, peak, RMS, note count and render time. It **fails
(exit 1)** if a file has non-finite samples, peaks at 0.95 or higher, or blows the
size budget. Tracks longer than ~85 s automatically drop to 22050 Hz so each
preview stays under 15 MB; the game always renders at the AudioContext's own rate.

On Node < 22.18: `node --experimental-strip-types tools/render-track.mjs all`.

Current output:

| file | rate | length | loop | peak |
|---|---|---|---|---|
| `docs/audio/title.wav` | 22050 | 1:49 | 0:15 → 1:45 | 0.89 |
| `docs/audio/battle-ffx.wav` | 44100 | 1:19 | 0:06.4 → 1:16.8 | 0.89 |
| `docs/audio/boss-dread.wav` | 22050 | 1:30 | 0:10.7 → 1:25.3 | 0.89 |
| `docs/audio/sfx-demo.wav` | 44100 | 0:03 | — | 0.89 |

## The track format

```ts
export const myTrack: Track = {
  name: 'my-track',
  bpm: 96,
  timeSig: [4, 4],
  loop: { start: 16, end: 128 },   // BEATS, not seconds
  length: 128,                     // total beats
  tailSec: 3,                      // extra seconds rendered for tails
  gain: 1,
  fx: {
    reverb: { room: 0.8, damp: 0.3, width: 0.95, preDelay: 0.02 },
    delay: { timeBeats: 0.75, feedback: 0.3, damp: 2600 },
  },
  channels: [
    {
      name: 'melody',              // label for the render report
      instrument: 'piano',         // key in INSTRUMENTS
      volume: 1,
      pan: -0.06,                  // -1 left .. 1 right
      transpose: 0,                // semitones
      notes: tracker('C4:1 E4:1 G4:2'),
      fx: { reverb: 0.3, delay: 0.1 },  // send amounts into the track buses
    },
  ],
};
```

A note is a tuple: `[startBeat, durationBeats, pitch, velocity?]`, where pitch is
a MIDI number (60 = C4) or a name (`"C4"`, `"F#3"`, `"Bb5"`) and velocity defaults
to 0.8. Velocity drives **both loudness and brightness**, like a real key.

Loop points are beats and are converted to exact sample offsets. Anything that
still rings after `loop.end` is folded back over `loop.start` by the renderer, so
the reverb tail of the last bar is already present at the top of the loop and the
seam does not chop.

Register the track in `src/audio/tracks/index.ts`.

## Tracker strings

`tracker(src, options)` (aliased `line`) turns a compact string into `Note[]`:

```
"C4:1 E4 G4:2 | C4+E4+G4:4 | -:2 A4:1@0.5 ~:1 |"
```

| token | meaning |
|---|---|
| `C4` `F#3` `Bb5` `60` | a note (name or raw MIDI) |
| `A+B+C` | chord — every member shares the step |
| `-` `r` `.` | rest |
| `~` | tie: extends the previous step instead of striking again |
| `:N` | step length in beats — **sticky**, omit it to reuse the last one |
| `@V` | velocity 0..1 for this step |
| `\|` | barline; ignored, but validated when you pass `checkBars` |

Options: `start` (first beat), `velocity`, `gate` (0.5 = staccato, 1 = legato),
`transpose`, `scale` (multiplies every step — `0.5` turns a quarter-note line into
eighths) and `checkBars: 4`, which **throws** if a `|` does not land on a bar
boundary. Always pass `checkBars` when writing a long melody; it catches a
mistyped duration immediately instead of at the mixing stage.

## Composing helpers (`harmony.ts`)

| helper | use |
|---|---|
| `chordLine(['Am','F','C','G'], { start, octave, center, dur, roll })` | one sustained chord per bar; `center` voice-leads every tone within a sixth of that MIDI note, `roll` staggers the tones into a gentle strum |
| `arpLine(chords, { pattern, step, octave, center, dur, accent })` | arpeggio across a chord sequence. `pattern` indexes chord tones: with a triad 0/1/2 are root/third/fifth and 3/4/5 are the same an octave up |
| `drumLine('x..X..g.', { step, pitch, velocity, times })` | step sequencer: `x` hit, `X` accent, `g` ghost, `o` open/long, `.` rest |
| `chordRoots(chords, octave)` | MIDI roots for bass lines |
| `motif(pattern, barStarts, roots)` | stamp a relative-pitch riff at each bar with a per-bar root (pitches in `pattern` are semitone offsets) |
| `barStarts(firstBeat, bars, barBeats)` | `[16, 20, 24, …]` |
| `repeatNotes`, `transposeNotes`, `shiftNotes`, `scaleVelocity`, `concatNotes`, `notesEnd` | the usual surgery |
| `degree(root, SCALES.minor, n)`, `SCALES` | scale-degree sketching (major, minor, harmonicMinor, dorian, phrygian, lydian, mixolydian, pentatonicMinor) |
| `chordMidis('Dm7', { octave, center, bassOctaves })` | raw chord tones. Qualities: maj m dim aug 5 sus2 sus4 6 m6 7 maj7 m7 m7b5 dim7 add9 madd9 9 m9 maj9 7sus4, plus slash bass (`G/B`) |

## Instruments

Named in `INSTRUMENTS` (`src/audio/instruments.ts`); `INSTRUMENT_NOTES` has the
one-line descriptions used by the debug list.

**Keys / plucked** — `piano` (inharmonic partial stack, hammer noise, two detuned
halves), `harp` (Karplus-Strong that rings past release), `pluck`, `bell`,
`celesta`, `mallet`.

**Sustained** — `pad` (six detuned saws, slow filter opening), `strings`
(seven-saw ensemble, bowed attack, vibrato), `strings-low`, `strings-short`
(spiccato, for ostinati), `choir` (triangle stack through three formants plus
breath), `brass`, `brass-stab`, `bass`, `bass-sub`, `pwm-lead`.

**Percussion** — `kick`, `taiko`, `timpani` (tuned by the note), `snare`, `hat`
(note *duration* decides closed vs open), `shaker`, `crash`, `tom`.

**SFX family** (playable from note data) — `sfx-blip`, `sfx-sweep`, `sfx-noise`,
`sfx-zap`, `sfx-shimmer`.

Adding one: write a `Voice` — `(ctx: VoiceCtx) => Stereo` — in `src/audio/voices/`,
returning a buffer that already contains its release tail, then register it. It
must be deterministic: use `ctxNoise(ctx)` for randomness, never `Math.random()`,
or the note cache and the tests will disagree with themselves.

## Mixing notes

- Channel `volume` is linear; keep melodies at ~1 and beds at 0.3–0.6.
- Reverb and delay are **track-level buses** with per-channel sends. Drums want
  0.05–0.2, leads 0.2–0.3, choir and bells 0.5–0.6.
- The master chain normalises to 0.6, applies a gentle cubic soft clip, then
  normalises to `targetPeak` (0.89). Peak is therefore always < 0.95 by
  construction — the tool still checks.
- Identical notes (same instrument, pitch, rounded duration and velocity) are
  rendered once and cached, so repeated ostinati are nearly free. Write your
  arpeggios with the helpers and the cache does the rest.

## SFX bank

28 cues in `src/audio/sfx/` (`ui.ts`, `battle.ts`, `magic.ts`), built from the
`kit.ts` helpers `tone`, `noiseBurst`, `fmTone` and `voiceNote`:

`cursor-move` `confirm` `cancel` `error` `menu-open` `menu-close` `coin-tick`
`status-applied` `overdrive-full` · `sword-slash-1` `sword-slash-2` `hit-1`
`hit-2` `critical` `ko-fall` `footstep` `victory-fanfare` `boss-roar`
`machina-whir` · `magic-charge` `fire` `ice` `thunder` `water` `holy` `cure`
`summon` `pyrefly`

Add one by exporting `{ about, render(sampleRate) }` from the right file; it is
picked up by the registry, the debug list and the test that renders every cue.

## Using it in the game

```ts
import { audio } from './audio/index.ts';

audio.installUnlockListeners();          // once at boot; first click/keypress starts the context
audio.setMusicVolume(save.musicVolume);
audio.setSfxVolume(save.sfxVolume);

await audio.playMusic('title', { fade: 2 });        // queued if audio is still locked
audio.playSfx('cursor-move');
audio.playSfx('hit-1', { pan: -0.3, pitch: 1.05, volume: 0.9 });

audio.duck(0.3);                          // dialogue / summon cut-in
audio.unduck();

audio.playMusic('battle-ffx', { fade: 0.8 });       // crossfades from the title theme
audio.stopMusic(1.5);
audio.setMuted(true);
console.table(audio.debug().sfx);         // names, descriptions, what is cached
```

`playMusic` renders in a Worker the first time and caches the AudioBuffer, so the
second call is instant; if Workers are unavailable it renders on the main thread
instead. Playback uses `AudioBufferSourceNode` with `loop`, `loopStart` and
`loopEnd` taken from the rendered sample offsets, so loops are seamless and free.
Call `audio.preload(['battle-ffx'])` during a cutscene to hide the render cost.

## The three tracks

| track | key / tempo | shape |
|---|---|---|
| `title` — *"Tide, Remembered"* | A minor → C major lift, 64 bpm | 28 bars. Piano arpeggio intro (bars 1–4), melody (5–12), major-lift B section with strings (13–20), return with cello counter-line (21–28). Loop 16 → 112 beats. |
| `battle-ffx` — *"Hold the Trail"* | E minor, 150 bpm | 48 bars. Kit + bass riff intro, brass-stab A, string-ostinato B with brass lead, half-time bridge with a two-bar snare build, climax lead, riff reprise, four-bar turnaround. Loop 16 → 192. |
| `boss-dread` — *"The Unsent Hymn"* | D minor / Phrygian, 90 bpm | 32 bars. Drone and bell toll, slow choir hymn over a low-string heartbeat, rising brass/timpani B section, the hymn again in bare parallel fifths, collapse back to the drone. Loop 16 → 128. |

## Checklist for a new track

1. Sketch the form in bars and write the chord arrays first.
2. Melodies with `tracker(..., { checkBars: 4 })`; beds with `chordLine`/`arpLine`;
   drums with `drumLine`; riffs with `motif`.
3. Set `loop.start` after the intro and `loop.end = length`.
4. Register it in `tracks/index.ts` and add a blurb to `TRACK_BLURBS`.
5. `node tools/render-track.mjs <name>` and listen to the WAV.
6. `npm test` — the suite checks every track's loop, note ranges, instruments and
   that a real render is finite, audible and below 0.95.
