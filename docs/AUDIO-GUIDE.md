# Audio Guide — music and SFX

Every note in Pyrefly Reprise is an **original composition**, written as code in
`src/audio/tracks/`. This guide covers writing that music.

**What plays those notes has changed** — read
[`audio/PIPELINE.md`](audio/PIPELINE.md) before you touch instruments or
timbre. In short: the cues are now rendered offline with recorded orchestral
samples and shipped as MP3s under `public/audio/`, because the runtime
oscillator mix was, in Bailey's words, "too arcade-y". The synthesised voices
described below are still here and still run — they are the fallback whenever a
cue has not been pre-rendered — but they are no longer what a player hears.

Everything about the *scores* in this guide is unchanged, and the scores
themselves did not change when the pipeline landed. That is the point: the notes
were never the problem.

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
        ├── Node:    tools/render-track.mjs → docs/audio/*.wav        (synth preview)
        ├── Node:    tools/audio/render.mjs → public/audio/*.mp3      (SAMPLED — what ships)
        └── Browser: worker.ts → MusicLoader → AudioBuffer → AudioManager  (fallback)
```

`renderTrack` is one sequencer with four optional hooks — `voiceFor`,
`spatialise`, `reverbRender`, `master` — all defaulting to the behaviour
described here. The offline renderer passes sampled voices, orchestral seating
and a concert hall through them; the browser passes nothing and gets exactly
what it always got. See [`audio/PIPELINE.md`](audio/PIPELINE.md).

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
node tools/render-track.mjs all --out=docs/audio/     # 20 tracks + the SFX montage
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

Current output (`node tools/render-track.mjs all --out=docs/audio`, exit 0 — every peak
normalised to 0.89 by the master chain, every file inside the 15 MB budget):

| file | rate | length | loop | size |
|---|---|---|---|---|
| `title.wav` | 22050 | 1:49.0 | 0:15.0 → 1:45.0 | 9.2 MB |
| `chapter-select.wav` | 44100 | 1:20.1 | 0:08.6 → 1:17.1 | 13.5 MB |
| `scene-gagazet.wav` | 22050 | 1:37.3 | 0:13.3 → 1:33.3 | 8.2 MB |
| `boss-seymour.wav` | 22050 | 1:52.1 | 0:07.3 → 1:49.1 | 9.4 MB |
| `scene-zanarkand-dome.wav` | 22050 | 1:44.3 | 0:16.6 → 1:39.3 | 8.8 MB |
| `boss-yunalesca.wav` | 22050 | 1:43.9 | 0:08.2 → 1:40.9 | 8.7 MB |
| `scene-dreams-end.wav` | 22050 | 1:45.1 | 0:12.6 → 1:41.1 | 8.8 MB |
| `boss-jecht.wav` | 22050 | 1:49.2 | 0:06.7 → 1:46.7 | 9.2 MB |
| `boss-yu-yevon.wav` | 22050 | 2:15.0 | 0:10.0 → 2:10.0 | 11.4 MB |
| `victory-ffx.wav` | 44100 | 1:12.5 | 0:06.0 → 1:10.0 | 12.2 MB |
| `ending-ffx.wav` | 22050 | 2:45.0 | 0:29.1 → 2:40.0 | 13.9 MB |
| `scene-bevelle-underground.wav` | 22050 | 1:39.0 | 0:09.6 → 1:36.0 | 8.3 MB |
| `boss-ffx2-aeon.wav` | 22050 | 1:44.5 | 0:06.0 → 1:42.0 | 8.8 MB |
| `scene-farplane.wav` | 22050 | 1:43.1 | 0:10.4 → 1:39.1 | 8.7 MB |
| `boss-vegnagun.wav` | 22050 | 1:46.4 | 0:05.7 → 1:42.9 | 8.9 MB |
| `boss-shuyin.wav` | 22050 | 1:49.0 | 0:06.2 → 1:46.0 | 9.2 MB |
| `victory-ffx2.wav` | 44100 | 0:53.6 | 0:05.6 → 0:50.6 | 9.0 MB |
| `ending-ffx2.wav` | 22050 | 2:55.4 | 0:11.4 → 2:51.4 | 14.8 MB |
| `battle-ffx.wav` | 44100 | 1:19.3 | 0:06.4 → 1:16.8 | 13.3 MB |
| `boss-dread.wav` | 22050 | 1:30.3 | 0:10.7 → 1:25.3 | 7.6 MB |
| `sfx-demo.wav` | 44100 | 0:03.0 | — | 0.5 MB |

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

**Pop / rock / electronic** (`voices/electronic.ts`, `voices/band.ts`) — built for
the FFX-2 tracks and the rock boss:

| name | character | register | channel vol | gotchas |
|---|---|---|---|---|
| `supersaw` | 7-saw unison, wide, bright; stab or pad | C3–C6 | 0.4–0.9 | velocity opens the filter; soft velocity = warm pad |
| `synth-bass` | mono saw+square, resonant low-pass pluck | C1–C3 | 0.6–1.0 | velocity = filter "quack"; priciest voice (~30 ms per 1 s note) |
| `arp-pluck` | bright saw, very fast filter close | C4–C6 | 0.35–0.6 | built for ≤ ¼-beat sixteenths |
| `epiano` | FM tine that mellows, ping-pong tremolo | A2–C6 | 0.5–0.8 | velocity = tine brightness |
| `organ` | drawbar additive 16'/8'/4'/2⅔'/2', key click, rotary sway | C1–C4 | 0.6–1.0 | its 16' is a bass voice — don't stack `bass-sub` under it |
| `guitar-dist` | two detuned layers, asymmetric clip, cab low-pass | E2–E5 | 0.5–0.85 | **notes under 0.12 s palm-mute**; mono, so double-track at ±0.35 pan |
| `flute` | breathy sine, light 2nd/3rd harmonics | A3–C6 | 0.5–0.8 | vibrato only after ~0.45 s |
| `kick-808` | pitch-drop sub boom + click | C0–C2 | 0.7–1.0 | **note duration sets the decay** |
| `clap` | three flammed bursts + tail | any | 0.6–0.9 | fixed ~0.32 s |
| `snare-909` | tuned body + bright noise | any | 0.5–0.8 | fixed ~0.22 s |
| `metal-hit` | inharmonic FM anvil clang, pitch follows note | C2–C5 | 0.4–0.7 | bright 30 ms attack, dull ring |

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

134 cues in nine files under `src/audio/sfx/`, built from the `kit.ts` helpers
`tone`, `noiseBurst`, `fmTone` and `voiceNote`. `SfxKey` in
`battle/common/types.ts` is a plain string — **use the keys below verbatim**;
`playSfx` throws on an unknown key, and the compiler cannot catch a bad one.
`tests/unit/audio-story-cues.test.ts` checks every `sfx()` / `music()` a chapter
script names; nothing yet checks the `sfxKey` fields on ability data.

### Which key for which ability family

| family | keys |
|---|---|
| blades | `slash-light` (Tidus) · `slash-heavy` (Auron, Paine) · `dagger-flurry` (Rikku, X-2) · `sword-slash-1` `sword-slash-2` (generic) |
| other weapons | `pierce` (Kimahri) · `ball-hit` (Wakka) · `claw` (Rikku, FFX) · `gunshot` `gun-burst` (Yuna, Trigger Happy) |
| contact result | `hit-1` `hit-2` · `critical` · `whiff` (miss) · `guard` · `counter` |
| cast wind-up | `magic-charge` |
| elemental, by tier (Fire / Fira / Firaga) | `fire` `fire-2` `fire-3` · `ice` `ice-2` `ice-3` · `lightning` `lightning-2` `lightning-3` · `water` `water-2` `water-3` · `holy` `holy-2` · `gravity` `gravity-2` |
| non-elemental and dark | `flare` · `ultima` · `meteor` · `bio` · `death` · `doom-tick` · `drain` · `osmose` |
| healing and revival | `cure` `cure-2` `cure-3` · `regen` · `life` `full-life` · `esuna` · `dispel` |
| buffs | `protect` · `shell` · `reflect` (cast) `reflect-bounce` (a spell bouncing off) · `haste` · `buff-generic` |
| statuses landing | `slow` `stop` `sleep` `silence` `blind` `poison` `berserk` `confuse` `curse` · `petrify-shatter` · `debuff-generic` · `status-applied` (any) |
| items and specials | `item-use` · `phoenix-down` · `elixir` · `mp-restore` · `steal-success` `steal-fail` · `scan` |
| summons and aeons | `summon` · `summon-depart` · `aeon-overdrive` |
| KO and defeat | `ko-fall` (party member) · `dissolve-pyreflies` (FFX enemy) · `machina-destroy` (machine enemy) · `explosion` |
| enemy and boss moves | `breath-attack` · `laser-charge` → `laser-fire` · `quake` · `whip` · `boss-roar` · `machina-whir` · `boss-phase-shift` · `boss-overdrive-warning` |
| menus | `cursor-move` `confirm` `cancel` `error` · `menu-open` `menu-close` `menu-page` |
| turn flow | `battle-start` · `ctb-tick` `ctb-shift` · `turn-ready` · `overdrive-full` · `escape` |
| Overdrive minigames | Swordplay `od-cursor-tick` `od-timer-tick` `od-hit-zone` `od-miss` · Bushido `od-input` `od-sequence-complete` · Slots / Lady Luck `od-reel-spin` `od-reel-stop` · Fury `od-fury-rotation` · Mix `od-mix-select` · result `od-success` `od-fail` |
| FFX-2 systems | `chain-hit` `chain-break` · `spherechange` · `garment-grid-gate` |
| results and ambience | `victory-fanfare` (sting) · `coin-tick` · `pyrefly` · `footstep` |

The element ids in `ElementId` map straight onto the first key of each tier
(`'lightning'` → `lightning`; the older `thunder` key still works). `'none'`
goes to `flare`/`ultima`.

Playback notes:

- **`chain-hit` is meant to climb.** Step it a semitone per link:
  `audio.playSfx('chain-hit', { pitch: 2 ** (Math.min(link, 12) / 12) })`.
- `od-cursor-tick`, `od-reel-spin` and `ctb-tick` are built to retrigger fast
  without smearing; call them every frame they apply.
- `laser-charge` is ~1 s and `boss-overdrive-warning` ~2 s — schedule the
  payoff cue after them with `{ delay }`.
- Nothing in the bank is longer than 3.5 s (`ultima`).

### The catalog

**ui** (`ui.ts`)

| key | what it is |
|---|---|
| `cursor-move` | Dry tick as the finger cursor steps down a list. |
| `confirm` | Two-note rising confirm. |
| `cancel` | Two-note falling cancel. |
| `error` | Flat buzz for an illegal action. |
| `menu-open` | Window sliding open: rising airy sweep plus a soft tick. |
| `menu-close` | Window sliding shut: the open cue reversed in pitch. |
| `coin-tick` | Per-point tick for the results screen counter. |
| `status-applied` | Wobbling chime when a status lands. |
| `overdrive-full` | Gauge fills: rising shimmer into a bright chime. |

**battle** (`battle.ts`)

| key | what it is |
|---|---|
| `sword-slash-1` | Fast blade whoosh, left to right. |
| `sword-slash-2` | Heavier blade whoosh with a metallic edge, right to left. |
| `hit-1` | Solid physical impact. |
| `hit-2` | Lighter, snappier impact for glancing blows. |
| `critical` | Critical hit: impact plus a ringing metallic flash. |
| `ko-fall` | A fighter goes down: descending groan and a body thud. |
| `footstep` | Single boot on stone. |
| `victory-fanfare` | Short original victory sting: rising brass triad over timpani. |
| `boss-roar` | Low, guttural roar with a rising snarl. |
| `machina-whir` | Machina spin-up: motor whine, mechanical ticks, steam release. |

**magic** (`magic.ts`)

| key | what it is |
|---|---|
| `magic-charge` | Casting wind-up: rising filtered noise and a climbing tone. |
| `fire` | Fire spell: roaring band-swept noise with crackle. |
| `ice` | Ice spell: glassy shards and a freezing shimmer. |
| `thunder` | Thunder spell: crack, arc, and a rolling low rumble. |
| `water` | Water spell: a swelling surge with droplets. |
| `holy` | Holy: a bell struck inside a choir chord. |
| `cure` | Healing sparkle: a celesta figure rising through motes of light. |
| `summon` | Aeon arrival: rising sweep, impact boom, bell and choir bloom. |
| `pyrefly` | Pyreflies drifting up: airy, weightless tinkle. |

**weapons** (`weapons.ts`)

| key | what it is |
|---|---|
| `slash-light` | Quick single-hand sword swing, bright and fast (Tidus). |
| `slash-heavy` | Weighty two-handed cleave with a low body and a metal edge (Auron, Paine greatsword). |
| `pierce` | Spear thrust: a narrow whoosh with a sharp tip impact (Kimahri). |
| `ball-hit` | Rubbery blitzball thwack with a trailing whoosh (Wakka). |
| `claw` | Three rapid claw scratches (Rikku). |
| `dagger-flurry` | Rapid double/triple dagger cut (Rikku, X-2). |
| `gunshot` | Single pistol shot: a sharp crack and a low thump, kept short (Yuna). |
| `gun-burst` | Five-round pistol burst (Yuna). |
| `whiff` | A swing that misses: air only, no impact. |
| `guard` | Metal block: a bright clank with a short ring. |
| `counter` | Parry tick immediately followed by a counter-hit. |

**enemy** (`enemy.ts`)

| key | what it is |
|---|---|
| `breath-attack` | Roaring elemental breath blast (Braska's Final Aeon, dark Bahamut). |
| `laser-charge` | Rising laser charge-up whine, about a second (Vegnagun). |
| `laser-fire` | Sustained laser beam discharge (Vegnagun). |
| `explosion` | Big explosion: crack, boom and settling debris. |
| `quake` | Long low rumble with falling debris (Yu Yevon, Gagazet tremor). |
| `whip` | Tentacle whip lash with a sharp crack (Seymour's aeons). |
| `dissolve-pyreflies` | An FFX enemy dies and dissolves into drifting light motes: soft, beautiful, a little sad. |
| `machina-destroy` | Machina destroyed: sparking mechanical explosion (Vegnagun wreckage). |
| `boss-phase-shift` | Boss changes form: an ominous low swell into an impact (Seymour, Yunalesca). |
| `boss-overdrive-warning` | Tense charging build before a boss ultimate, about two seconds. |
| `petrify-shatter` | Stone crackle building into a shatter. |

**flow** (`flow.ts`)

| key | what it is |
|---|---|
| `ctb-tick` | Very quiet tick as the turn-order list advances. |
| `ctb-shift` | Soft two-step shuffle when the turn order changes. |
| `turn-ready` | Gentle chime: a party member can act. |
| `menu-page` | Tab or page switch inside a menu. |
| `battle-start` | Encounter transition: glassy shatter and swirl, about a second. |
| `escape` | Running away: a quick downward whoosh. |
| `od-cursor-tick` | Swordplay cursor tick, built to sound good repeated fast. |
| `od-timer-tick` | Slightly tense Overdrive countdown tick. |
| `od-hit-zone` | Bright success hit of a timing bar. |
| `od-miss` | Dull timing-bar failure. |
| `od-input` | Bushido button-sequence press. |
| `od-sequence-complete` | Bushido sequence cleared: a bright flourish. |
| `od-reel-spin` | Short spinning-reel clatter, about 0.3 s, designed to be retriggered rapidly. |
| `od-reel-stop` | Reel lands with a clunk. |
| `od-fury-rotation` | Lulu's Fury stick-rotation counter tick, with a rising feel. |
| `od-mix-select` | Rikku Mix ingredient pick. |
| `od-success` | Overdrive minigame result: good. |
| `od-fail` | Overdrive minigame result: poor. |
| `chain-hit` | FFX-2 chain-combo hit: a bright short ping, meant to be pitch-stepped upward per hit. |
| `chain-break` | Chain combo ends. |
| `spherechange` | Dressphere change: whoosh, sparkle and a bright pop-chord bloom, about 1.2 s. |
| `garment-grid-gate` | Garment Grid gate bonus chime. |

**spells** (`spells.ts`)

| key | what it is |
|---|---|
| `fire-2` | Bigger fire: two rolling waves of roaring noise with heavier crackle. |
| `fire-3` | Firestorm: a sub-bass whoomp, two waves of roaring flame, and a searing swell. |
| `ice-2` | Bigger ice: a denser shard cluster and a longer freezing shimmer. |
| `ice-3` | Glacial burst: crystalline shard hail, a deep-frozen sub impact, and a wide shimmering swell. |
| `lightning` | Lightning bolt: a sharp electric crack with a crackling arc and short rumble. |
| `lightning-2` | Bigger lightning: a double crack, a longer crackling arc, and a heavier rumble. |
| `lightning-3` | Thunderstorm strike: a triple crack, roaring arc, sub-bass impact, and a wide rolling swell. |
| `water-2` | Bigger water: two swelling surges and a denser scatter of droplets. |
| `water-3` | Tidal water: a deep surge, twin swells, a wide spray of droplets, and a crashing swell. |
| `holy-2` | Grand holy: a cathedral bell peal inside a wide choir chord with a radiant sweep. |
| `gravity` | Demi: space warping inward, a pitch-bending low whoomp. |
| `gravity-2` | Gravity crush: a heavier inward implosion with a crushing sub impact. |
| `flare` | Flare: an intense implosion collapsing inward before a white-hot detonation. |
| `ultima` | Ultima: a long rising charge, a colossal detonation, and a shimmering aftermath. |
| `bio` | Bio: a bubbling toxic ooze hiss with sickly gurgles. |
| `death` | Death: a hushed, cold descending choir breath and a single bell toll. |
| `doom-tick` | Doom: an ominous countdown tick. |
| `drain` | Drain: a reverse-swelling hiss that pulls life toward the caster. |
| `osmose` | Osmose: a glassy, high reverse-swell siphoning MP toward the caster. |
| `meteor` | Meteor: incoming whistles plummeting down into multiple heavy impacts. |

**support** (`support.ts`)

| key | what it is |
|---|---|
| `cure-2` | Bigger cure: a fuller rising celesta figure through more motes of light. |
| `cure-3` | Full-scale cure: a radiant rising figure, a warm swelling foundation, and a wide shimmer bloom. |
| `regen` | Regen: a gentle recurring shimmer of restorative motes. |
| `life` | Life: a warm rising choir swell and a bright bell as the fallen stand again. |
| `full-life` | Full-Life: a radiant full choir swell with a peal of bells. |
| `esuna` | Esuna: a sparkling sweep upward as the ailment lifts. |
| `dispel` | Dispel: a glassy pop as buffs strip away. |
| `protect` | Protect: a solid low chime with a resonant shielding hum. |
| `shell` | Shell: an airy, glassy chime that domes overhead. |
| `reflect` | Reflect: a mirrored shimmer standing the spell back up. |
| `reflect-bounce` | Reflect bounce: a spell ricocheting back off the mirrored wall. |
| `haste` | Haste: a run of accelerating ticks rising in pitch. |
| `slow` | Slow: decelerating ticks with a sagging pitch. |
| `stop` | Stop: a tick that halts mid-swing into a frozen shimmer. |
| `sleep` | Sleep: drowsy descending lullaby notes. |
| `silence` | Silence: sound sucked inward until nothing remains. |
| `blind` | Blind: a dark smoky whoosh across the eyes. |
| `poison` | Poison: a sickly wobbling drone. |
| `berserk` | Berserk: an angry distorted growl surging up. |
| `confuse` | Confuse: a dizzy wobbling spiral of pitch. |
| `curse` | Curse: a dissonant sting as abilities are sealed away. |
| `scan` | Scan: a sci-fi analysis sweep dotted with blips. |
| `steal-success` | Steal (success): a quick grab and a bright pickup jingle. |
| `steal-fail` | Steal (fail): a quick grab and an empty-handed thud. |
| `item-use` | Item use: a bottle uncorks with a small sparkle. |
| `phoenix-down` | Phoenix Down: a soft feather whoosh into a warm restorative burst. |
| `elixir` | Elixir: a luxurious, fuller restorative shimmer. |
| `mp-restore` | MP restore: a cool blue shimmer refilling the well. |
| `buff-generic` | A generic positive status landing. |
| `debuff-generic` | A generic negative status landing. |
| `summon-depart` | Aeon departure: the reverse of arrival, rising up and away into the air. |
| `aeon-overdrive` | Aeon overdrive: a charging roar building into a colossal choir swell. |

#### Story ambiences (`story.ts`)

For `sfx()` steps in chapter scripts: longer (up to ~3.8 s) and softer than combat
cues, warmed right after the menu cues because a player reaches a chapter's
opening cutscene before its battle. Sustained voices are built from cheap
filtered oscillators rather than the `choir` / `pad` instruments, which cost 3-4x
the heaviest combat cue over a three-second hold.

| key | sound |
|---|---|
| `wind-high-altitude` | Thin, cold summit wind: a low bed and a narrow keening whistle, drifting across the stereo field. |
| `wind-gust` | A single gust that swells in, whistles past left to right, and drops away. |
| `kimahri-roar` | A Ronso roar of grief rather than threat: a torn, falling cry over breath. Not `boss-roar`. |
| `fayth-hum` | The fayth humming: a soft wordless chord that blooms and hangs, with a high shimmer. |
| `dome-echo` | One sound in a vast stone hall, answered by echoes that darken as they fade. |
| `yu-yevon-chant` | A low, wrong chant: two voices a half-step apart over a sub drone. |
| `machina-groan` | Old machina under strain: an inharmonic metal groan with creaks. |
| `farplane-voices` | Many distant voices rising out of the Farplane, each from a different place. |
| `lenne-song` | A wordless sung phrase on this project's own `LENNE` leitmotif. |
| `whistle-answer` | A two-finger whistle, then a fainter one answering from far off. |

### Adding a cue

Export `{ about, render(sampleRate) }` from the file that fits its family. It is
picked up by the registry, the debug list and the test that renders every cue.
A name may live in only one file (`tests/unit/audio-registry.test.ts` fails on a
clash), and a cue that other agents should reference goes into the family table
above and the `SFX_CATALOG` list in that test.

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

## Music keys

`MUSIC_KEYS` in `tracks/index.ts` is the final list (CONTRACT-CHANGES §8). Every
key resolves in `playMusic` today: a key without its own composition plays a
**stand-in** (`STAND_INS`), and registering the real track in `COMPOSED` retires
the stand-in automatically. `isStandIn(key)` says which is which; `trackNames()`
lists only real compositions, so previews never render duplicates.

| key | plays for | game |
|---|---|---|
| `title` | title screen | — |
| `chapter-select` | chapter select menu | — |
| `scene-gagazet` | Mt. Gagazet, before Seymour | FFX |
| `boss-seymour` | Seymour Flux | FFX |
| `scene-zanarkand-dome` | Zanarkand Dome | FFX |
| `boss-yunalesca` | Yunalesca | FFX |
| `scene-dreams-end` | inside Sin, Dream's End | FFX |
| `boss-jecht` | Braska's Final Aeon | FFX |
| `boss-yu-yevon` | Yu Yevon, the final battle | FFX |
| `victory-ffx` | victory + results | FFX |
| `ending-ffx` | ending / credits | FFX |
| `scene-bevelle-underground` | Bevelle Underground | FFX-2 |
| `boss-ffx2-aeon` | the corrupted aeon | FFX-2 |
| `scene-farplane` | the Farplane | FFX-2 |
| `boss-vegnagun` | Vegnagun | FFX-2 |
| `boss-shuyin` | Shuyin | FFX-2 |
| `victory-ffx2` | victory + results | FFX-2 |
| `ending-ffx2` | ending / credits | FFX-2 |
| `scene-fahrenheit` | the Fahrenheit's deck, Chapter VIII (Evrae), before the fight | FFX |
| `boss-evrae` | Evrae, Chapter VIII | FFX |

`battle-ffx` and `boss-dread` stay registered as general-purpose battle and dread cues.

## Leitmotifs

`tracks/motifs.ts` holds the score's shared cells as semitone offsets from a
tonic. Stamp one with `cell(PATTERN, startBeat, tonic, velocity?)`, stretch it
with `augment(pattern, factor)`. Every cell is derived from this repo's own
tracks.

| cell | shape | where it lives |
|---|---|---|
| `PYREFLY_RISE` | dominant below, tonic, 2nd, minor 3rd held — 5 beats | the title's question; Gagazet's flute memory; Zanarkand's unanswered rise; bent whole-tone in Dream's End; the FFX ending's piano intro |
| `PYREFLY_RISE_MAJOR` | the same with a major 3rd | chapter select; the FFX ending's climax; Jecht's bridge; Yu Yevon's triumph; the Farplane; the FFX-2 ending's cameo |
| `PYREFLY_SIGH` | the minor 3rd falling home — 4 beats | Zanarkand Dome; Yu Yevon's answer |
| `SENDING` | tonic held, up a minor 3rd, stepping home — 8 beats | boss-dread's hymn; Yunalesca's chant; Seymour's low brass; Yu Yevon's dread |
| `SPHERE_HOOK` | syncopated leap to the 5th, down to the 3rd, up to the 6th — 4 beats | FFX-2: Bevelle (minor), the corrupted aeon's riff, victory-ffx2's fanfare, the FFX-2 ending's verse |
| `LENNE` | dorian love-and-loss line with the raised 6th — 8 beats | Shuyin's hook; the Farplane's answer; the FFX-2 ending's chorus (in major) |

**Harmony rule for any stamped or held line:** check every note of half a beat
or longer against its bar's chord. A note a semitone *above* a chord tone (a
minor 2nd or 9th) is a clash; a semitone *below* one reads as a major-7th colour
and is fine. A cell stamped at a fixed pitch does not follow the chords, so pick
chords its pitches belong to — and a major-key cell stamped on a minor chord's
root plays a major 3rd against it.

## Track notes

| track | key / tempo | shape |
|---|---|---|
| `title` — *"Tide, Remembered"* | A minor → C major lift, 64 bpm | 28 bars. Piano arpeggio intro (bars 1–4), melody (5–12), major-lift B section with strings (13–20), return with cello counter-line (21–28). Loop 16 → 112 beats. |
| `battle-ffx` — *"Hold the Trail"* | E minor, 150 bpm | 48 bars. Kit + bass riff intro, brass-stab A, string-ostinato B with brass lead, half-time bridge with a two-bar snare build, climax lead, riff reprise, four-bar turnaround. Loop 16 → 192. |
| `boss-dread` — *"The Unsent Hymn"* | D minor / Phrygian, 90 bpm | 32 bars. Drone and bell toll, slow choir hymn over a low-string heartbeat, rising brass/timpani B section, the hymn again in bare parallel fifths, collapse back to the drone. Loop 16 → 128. |
| `chapter-select` — *"Threshold, Unhurried"* | F lydian, 84 bpm, 3/4 | 36 bars. Harp alone with the augmented rising cell (1–4), celesta motif over settling arpeggios (5–12), strings enter (13–20), fullest texture peaking on C6 (21–28), strings fade onto C7 (29–36). Loop 12 → 108. |
| `scene-gagazet` — *"Where the Horns Fell Silent"* | B minor with a dorian G#, 72 bpm | 28 bars. Wind and a low hum (1–4), a hushed flute climb answered by an open-fifth clan horn call (5–12), the peak with taiko thunder and the rising cell as a memory (13–20), fragments thinning to the tonic (21–28). Loop 16 → 112. |
| `scene-zanarkand-dome` — *"Where the Tide Stopped"* | E minor, 58 bpm | 24 bars. Piano dyads and a toll (1–4), the sigh as a fixed anchor over moving chords (5–12), the rising cell left unanswered while celesta and low strings swell (13–20), the sigh thins out (21–24). Loop 16 → 96. |
| `boss-yunalesca` — *"Rite Without End"* | F harmonic minor, 6/8, 132 bpm | 74 bars. Harp gallop alone (1–6); a fixed-pitch choir chant of the augmented Sending cell over chords chosen to hold it (7–38); her final form — diminished bite, the chant a 4th higher, then compressed to double speed (39–70); one quiet breath (71–74). Loop 18 → 222. |
| `scene-dreams-end` — *"A City That Never Was"* | whole-tone drift, 76 bpm | 32 bars. Celesta music box alone (1–4), major triads on whole-step roots under a chord-blind music box (5–20), augmented chords where the music box finally fits and the bent rise returns on pwm-lead (21–28), recede (29–32). Loop 16 → 128. |
| `victory-ffx` — *"Bright After the Storm"* | C major, 120 bpm | 35 bars. A one-shot broken-chord brass fanfare and tutti hit (1–3), then four 8-bar choruses of a pluck tune that vary — anticipations, an octave-leap peak over a piano counter-melody, a sparse close on G. Loop 12 → 140. |
| `ending-ffx` — *"Tide, Answered"* | D major, 66 bpm | 44 bars. Solo piano quoting the minor rise (1–8), strings enter and build (9–20), strings and choir state the augmented major rise twice over a bVI–bVII–I lift (21–36), quiet piano coda (37–44). Loop 32 → 176. |
| `boss-seymour` — *"Ascension of the Unmaker"* | C# minor, 132 bpm | 60 bars. Organ and choir invocation (1–4); a choir chant over a chromatic lament bass harmonised on every half-bar (5–12); the organ settles to a pedal while low brass states the augmented Sending cell (13–20); the full mass (21–28); an eerie organ solo (29–32); a build (33–36); the chant again, louder (37–44); an extended second climax (45–56); a timpani turn onto the dominant (57–60). Loop 16 → 240. |
| `boss-jecht` — *"Blitz for Two"* | D minor, 144 bpm | 64 bars. Kit and bass tease (1–4); a double-tracked drop-D riff with brass stabs (5–20); a developed guitar solo over power chords (21–28); a half-time bridge where brass sings the major rising cell in D major — the father's pride (29–36); the riff crashes back in D minor (37–44); a busier solo climbing to a bent G5 (45–52); full riff and turnaround (53–64). Loop 16 → 256. |
| `boss-yu-yevon` — *"What the Tide Keeps"* | B minor → D major, 96 bpm | 52 bars. Drone, organ and toll (1–4); the choir's Sending cell in dread over held breaths (5–16); brass and strings answer with the sigh while taiko and spiccato strings drive in eighths (17–28); a sixteenth-note build (29–36); the D-major climax with the rising cell augmented in choir and brass (37–48); organ and timpani ease back to the dread (49–52). Loop 16 → 208. |
| `scene-bevelle-underground` — *"Iron Undertow"* | G minor, 100 bpm | 40 bars. Arp-pluck alone as a dark pad fades in (1–4); a half-time 808 groove with only the first three notes of the minor Sphere hook (5–12); a thicker groove and the full hook (13–20); a breakdown where the drums drop out and the bass holds its roots under an exposed augmented fragment (21–28); drums return with the hook doubled (29–36); turnaround (37–40). Loop 16 → 160. |
| `boss-ffx2-aeon` — *"Static Coronation"* | Bb minor → Db major, 160 bpm | 68 bars. Count-in kick and bass (1–4); the Sphere hook recast in minor as a chord-aware supersaw riff over four-on-the-floor (5–16); breakbeat call-and-response (17–28); the chorus lifts to the relative major where the hook turns hopeful (29–40); a bridge that builds in density across all layers (41–52); the riff reprise in octaves, the peak (53–64); turnaround (65–68). Loop 16 → 272. |
| `scene-farplane` — *"Where the Pyreflies Rest"* | E major, 92 bpm | 38 bars. Pad and harp fade in (1–4); the flute sings the major rising cell — FFX at peace (5–14); the epiano answers with the first half of Lenne's line as a soft 808 pulse and shaker enter (15–24); both themes interweave with celesta motes (25–34); the outro recedes, then lifts back into the loop (35–38). Loop 16 → 152. |
| `victory-ffx2` — *"Sphere Shine"* | Eb major, 128 bpm | 27 bars. A one-shot synth-brass fanfare states the Sphere hook on Eb and Ab, then lands an Eb9 hit with clap and crash (1–3); an 808 groove with synth-bass pump, epiano stabs and arp-pluck while the pwm-lead riffs on the hook (4–11); reharmonised with the flute answering (12–19); the fullest phrase, hook doubled over a glow pad (20–27). On minor chords the hook takes its minor form. Loop 12 → 108. |
| `ending-ffx2` — *"Wherever the Tide Takes Me"* | Bb major → C major, 84 bpm | 60 bars. Epiano vamp (1–4); a flute verse on the Sphere hook stretched to twice its length (5–20); pre-chorus and a chorus carrying Lenne's line in major over supersaw pad and strings (21–32); a bare epiano bridge on a borrowed iv (33–36); the second chorus, where soft 808, clap and hats finally enter (37–48); the final chorus up a whole step with FFX's rising cell in celesta and bell (49–56); a quiet coda pivoting back to Bb (57–60). Loop 16 → 240. |
| `boss-vegnagun` — *"Iron Verdict"* | F minor, 168 bpm | 72 bars. Organ swell and teaser clangs (1–4); the groove, with every phrase lurching through a 3½-beat and a 4½-beat bar (5–20); a four-bar hush to bass, metal and hats, then the band slams back (21–28); the lurch again with the alarm an octave up (29–44); a system-overload breakdown that builds from an organ pedal (45–52); the fortissimo assault (53–68); a snare-roll turn onto C7 (69–72). Loop 16 → 288. |
| `boss-shuyin` — *"The Weight of a Thousand Years"* | C# minor, 154 bpm | 68 bars. Piano riff alone (1–4); full band with Lenne's cell as a pwm hook (5–20); half-time, epiano and strings carry the cell augmented in dorian (21–36); the riff returns with the hook passed between registers and a piano answer (37–52); the climax with the hook in octaves (53–60); a dominant turn (61–68). Loop 16 → 272. |
| `boss-evrae` — *"Open Sky, Closed Gate"* | A minor, 144 bpm | 48 bars. Engine room: clangs out of true, taiko, the drone opens (1–4); the pursuit phrase — FAREWELL_RISE driven at speed, a rest in every two bars — on strings over a piano sparkle (5–12); horns take it while the violins sing above (13–20); the air: a hat, piano open fifths, FAREWELL_RISE and FAREWELL_FALL on a distant flute, then one beat of dead stop (21–28); sixteenths under the same tempo, the tune in octaves (29–36); piano alone on the tune over the engine (37–44); bVI–bVII twice into the loop (45–48). Loop 16 → 192. NEAR/FAR balances of the same notes: `rangeVariant` in `fahrenheit.ts`, auditioned via `tools/audio/render-range.mjs`. |
| `scene-fahrenheit` — *"Within the Hour"* | D minor, 104 bpm | 32 bars. Wind (a high string fourth), a distant clang, the piano engine turning over (1–4); FAREWELL_RISE at double length then FAREWELL_FALL on violins (5–12); the ship figure on flute as the engine quickens, a fourth above the battle (13–20); Bevelle over the cloud line, the peak closing on the AMEN over the iv6 (21–28); back to wind and engine, bVI–bVII home (29–32). No kit. Loop 16 → 128. |

## Checklist for a new track

1. Sketch the form in bars and write the chord arrays first.
2. Melodies with `tracker(..., { checkBars: 4 })`; beds with `chordLine`/`arpLine`;
   drums with `drumLine`; riffs with `motif`.
3. Set `loop.start` after the intro and `loop.end = length`.
4. Register it in `tracks/index.ts`: add it to `COMPOSED`, delete its `STAND_INS`
   line if it had one, and add a blurb to `TRACK_BLURBS`. Check every held note
   against the harmony rule under "Leitmotifs".
5. `node tools/render-track.mjs <name>` and listen to the WAV.
6. `npm test` — the suite checks every track's loop, note ranges, instruments and
   that a real render is finite, audible and below 0.95.
