# Plan — making the score sound modern, not 16-bit

**Status:** proposal. Nothing here is built, nothing is downloaded. Hard rule 11
(ask before downloading) and hard rule 9 (end state first) both apply: the first
deliverable after Bailey's approval is a **three-sketch audition**, not a rewrite.

**Game-aware classification (hard rule 14): BOTH.** Everything below is the
offline renderer, the sample libraries, the reverb and the performance model —
`tools/audio/**`, `src/audio/render.ts`, `src/audio/voices/**`. That plumbing
renders all 21 cues: the FFX chapters (1–3) and the FFX-2 chapters (4–5) share
one `renderCue` path, one seating map and one master chain
(`tools/audio/render.mjs`). `critic/CHECKS.md` CHK-020 puts shared plumbing in
the "both" case. **Absence test:** remove FFX-2 from the project and every
diagnosis below still holds for `battle-ffx`, `boss-seymour`, `boss-jecht`;
remove FFX and every one still holds for `boss-shuyin`, `boss-vegnagun`. No
finding here is true of one game and not the other. The *arrangements* are of
course per game (THEMES.md), and this plan changes no notes.

**Source of the complaint.** Bailey, 2026-09-21: *"music is too reminsicent of
snes music instead of the more modern final fantasy titles and clair obscur."*
Earlier, 2026-09-18, about the older fully-synthesised audio: *"too arcade-y"*
(`docs/audio/OWNER-VERDICT.md`, superseded but naming the same failure mode).
2026-09-19, about the current sampled build: *"Right direction, keep refining."*
The standing bar: *"the music and sound effects need to be beautiful and capture
the very essence and soul of final fantasy x / clair obscur: expedition 33."*

So this is not a rewrite of the notes. THEMES.md and the 21 scores stay. What
changes is **what plays them and how it is performed**.

---

## 1. Diagnosis — why this code reads as 16-bit

Every item is a property of *our* renderer, with the file that causes it. None
of this is a general complaint about sampled orchestras.

### 1.1 Two of the three libraries are General-MIDI-class fonts

`tools/audio/libs.mjs` lines 26–45 declares exactly three libraries:

| Library | What it is | Dynamic layers | Articulations |
|---|---|---|---|
| Salamander Grand Piano V3 | a real 16-velocity-layer concert grand | 16 | sustain + release |
| Sonatina Symphonic Orchestra (SF2 conversion) | a 2008-era free orchestra, converted to SoundFont | essentially **one** per instrument | sustain, pizz, a few shorts |
| FluidR3 GM/GM2 | a **General MIDI** font — the format's whole purpose is one patch per GM program number | 1–2 | none |

Sonatina carries the orchestra. FluidR3 — a GM font, the direct descendant of
the sound-card era Bailey is hearing — is still doing load-bearing work for
`strings-trem`, `choir-ooh`, `bell`, `celesta`, `mallet`, `vibraphone`,
`harpsichord` (`src/audio/voices/presets/sustained.ts` lines 76, 155;
`keys.ts` lines 52, 62, 73, 94, 113). A GM font under a melody line is, almost
by definition, the SNES/soundcard timbre.

The one place the score does *not* sound like that is the piano, because
Salamander is a real multi-velocity instrument. That is the shape of the fix.

### 1.2 One dynamic layer means velocity is only volume plus a tilt filter

`tools/audio/sampler.mjs` line 15 states the model honestly: *"velocity picks
the layer AND opens a gentle tilt filter."* With a one-layer library there is no
layer to pick, so velocity collapses to **gain plus a one-pole low-pass**
(`sampler.mjs` lines 95, 302–308, 361).

A real orchestral *forte* is not a *piano* turned up with the treble rolled
back: the bow bites, the brass overblows, the timbre changes shape. Volume-plus-
LPF is exactly the dynamic model an SNES sample channel had. This is the single
strongest cause of the complaint.

### 1.3 There is no dynamic movement *inside* a note

`src/audio/score.ts` line 17: `Note = [start, dur, pitch, velocity?]`. One
velocity per note, fixed for its whole length. The sampler then loops the
sustain portion (`sampler.mjs` header, "sustain looping"), so a held string or
choir note is a **static looped sample at constant amplitude**.

Modern FF and Expedition 33 are built on the opposite: a string line swells and
recedes *within* the phrase (CC1/CC11 expression), a choir breathes, a cello
crescendos into the appoggiatura. Our engine has no way to express that at all.
This is a missing *format* feature, not a missing sample.

### 1.4 There is no legato — only overlapping release tails

`sampler.mjs` header: *"a real release tail past the note-off, which is what the
sequencer's overlap-mixing turns into legato."* That is a re-articulation
crossfade, not legato. Every note in a melodic line starts with its own attack
transient. A solo violin phrase therefore reads as a **plucked or keyed**
instrument playing a violin sample, which is the classic tracker tell.

### 1.5 Round robins exist in code but not in the data

`sampler.mjs` line 230 `groupRoundRobin()` only returns a bucket when a
key/velocity zone holds more than one region. SF2 GM fonts and the Sonatina
conversion do not ship alternate takes, so the map is empty in practice and the
same sample fires every time.

### 1.6 Repeated notes are **bit-identical**, including their humanisation

`src/audio/render.ts` lines 178–188:

```ts
const key = `${channel.instrument}|${midi}|${durSec.toFixed(3)}|${velocity.toFixed(3)}${perfKey}`;
let rendered = useCache ? cache.get(key) : undefined;
if (!rendered) {
  rendered = voice({ sampleRate, freq: midiToFreq(midi), dur: durSec, velocity, seed: hashSeed(key) });
  if (useCache) cache.set(key, rendered);
}
```

The cache key carries **no per-occurrence component**, and the seed is derived
from that same key. Two occurrences of the same pitch, at the same quantised
duration and quantised velocity, are the identical buffer — same round-robin
choice, same timing jitter, same everything. Worse, the quantisation makes the
hit likely: `velocity` is snapped to 1/64 (line 171) and `durSec` to 5 ms (line
173), so a repeated quaver in an ostinato collides almost every time.

A 150 bpm battle ostinato is therefore a literal copy-paste of one waveform.
That is *precisely* what "machine-gunning" sounds like, and it is the second
strongest cause. It is also cheap to fix: put the note's index or start beat in
the seed while keeping the buffer cache keyed as it is for the dry mix, or drop
the cache for sustained sections.

### 1.7 Onsets sit on the grid; humanisation is jitter, not phrasing

`render.ts` line 174 places each note at `tempo.secondsAt(startBeat)` exactly.
The only looseness is `timingJitterMs` applied *inside* the voice
(`score.ts` lines 40–49, 77–80; `render.mjs` lines 104–110) — random,
symmetrical, and (per 1.6) identical for repeated notes. Real ensembles are not
randomly late: a section spreads *behind* the beat by instrument mass, a soloist
leans *into* an appoggiatura and releases after it, a phrase breathes at its
arch. `tempo.ts` gives us a tempo map — good — but there is nothing at the note
or phrase level.

### 1.8 The hall is one algorithmic room for everything

`tools/audio/render.mjs` lines 221–233 builds a single `Hall` (FDN, RT60 2.2 s,
pre-delay 19 ms) for every cue; `src/audio/dsp/hall.ts` line 104 is a
feedback-delay-network, not convolution. Its own header admits why it replaced
Freeverb: comb filters ring. An FDN is better, but it still has no real early-
reflection pattern of a real room. The one cue-level sense of *place* we have is
the seating send (`render.mjs` lines 117–132), which is a pan and a send amount.

Expedition 33 and the modern FF scores are recordings *of a room*. Convolution
with a real concert-hall impulse response is the difference between "reverb on
the instruments" and "an orchestra in a hall."

### 1.9 The synthetic choir is the weakest voice in the set

`sustained.ts` lines 138–176: `choir` and `soprano` are both the single Sonatina
`Mixed Choir` patch, and `soprano`'s own caveat in the file says so — *"derived
from the mixed-choir samples, not a solo-soprano recording."* `choir-ooh` is
FluidR3 program 53 (GM "Voice Oohs"). A GM choir patch is the single most
recognisable "this is a soundcard" sound there is, and the choir is load-bearing
in exactly the cues that must land hardest (`boss-yu-yevon`, `boss-yunalesca`,
`boss-vegnagun`, the endings).

### 1.10 Narrow delivered dynamics

`tools/audio/master.mjs` `masterToTarget()` normalises every cue to **−16 LUFS**
with a 2:1 bus compressor. The target is right for a game (SFX must sit on top),
but it is applied per cue with a boost cap, so quiet scene cues and tutti battle
cues arrive at nearly the same loudness, and within a cue the compressor plus a
one-velocity library leaves very little peak-to-average movement. The MP3 stage
(`render.mjs` line 206, `-q:a 5`, ~130 kbps VBR) is not the problem, but it is
the last place to leave a hall tail — worth re-checking at q3 once there is a
real tail to lose.

### Summary of causes, ranked by how much each is likely costing us

1. One dynamic layer → velocity = volume + tilt (1.2)
2. Bit-identical repeated notes (1.6)
3. No intra-note expression curve (1.3)
4. GM/Sonatina timbres, especially the choir (1.1, 1.9)
5. No legato transitions (1.4)
6. Algorithmic hall instead of a real room (1.8)
7. Grid onsets, random jitter instead of phrasing (1.7)
8. Flat delivered dynamics (1.10)

Note that **2, 3, 5 and 7 need no downloads at all.** They are our code.

---

## 2. Option A — better free libraries, real halls, and a real performance model

Three parts: what plays the notes, what room they are in, and how they are
played. The third part is where most of the gain is.

### A1. Libraries (downloads — each needs Bailey's yes, hard rule 11)

```
VSCO 2 Community Edition (WAV + SFZ) | https://github.com/sgossner/VSCO-2-CE/releases/tag/1.1.0 | ~1.9 GB WAV (≈3 GB with all formats) | CC0 1.0 Universal (public domain)
VSCO 2 CE official SFZ patches (sfz branch) | https://github.com/sgossner/VSCO-2-CE/tree/sfz | included in the above | CC0 1.0 Universal
Versilian Community Sample Library (VCSL) | https://github.com/sgossner/VCSL | ~20–75 MB per instrument; whole repo ≈1–2 GB | CC0 1.0 Universal
Virtual Playing Orchestra 3.2 — wave files | https://virtualplaying.com/go/virtual-playing-orchestra-v3-2-wave-files-archive/ | 603 MB | mixed CC (see risk note below)
Virtual Playing Orchestra 3.3 — Performance Orchestra SFZ scripts | https://virtualplaying.com/go/virtual-playing-orchestra-v3-3-performance-scripts/ | 357 KB | same as above
Virtual Playing Orchestra 3.3 — Standard Orchestra SFZ scripts | https://virtualplaying.com/go/virtual-playing-orchestra-v3-3-standard-scripts/ | 536 KB | same as above
sfizz-render (Windows binary, SFZ → WAV from a MIDI file) | https://github.com/sfztools/sfizz-render/releases | a few MB | BSD-2-Clause
```

**What each buys.**

- **VSCO 2 CE** — the safest and probably the biggest single win. Real chamber-
  orchestra recordings, multiple dynamics on many instruments, and **CC0**,
  which means `docs/audio/CREDITS.md` gets simpler rather than more complicated
  and there is no question at all about shipping the rendered MP3s. It is a
  *chamber* orchestra, which suits the Clair Obscur side of the brief (intimate,
  solo-forward) better than it suits a Nobuo-scale tutti; the FFX battle cues may
  still want Sonatina or VPO underneath for weight.
- **VCSL** — CC0, broad and shallow: the odd instrument we do not have (a real
  glockenspiel, taiko, tubular bells, ethnic percussion, some vocal material) to
  replace the FluidR3 patches named in 1.1. Small per-instrument downloads, so
  we can take only what we need.
- **Virtual Playing Orchestra** — 168 SFZ patches built *from* Sonatina, VSCO 2
  and others, with a "Performance" script set that adds keyswitched/CC-driven
  articulation handling, i.e. legato-ish behaviour we do not have. **Licence
  risk:** the wave files are an aggregate of CC Sampling Plus 1.0, CC BY-SA 3.0,
  CC BY-SA 4.0 and CC0 material. The author states he enforces no restriction on
  music made with it, but the ShareAlike components deserve a careful read before
  we take it, because our situation (redistributing *rendered* audio inside a
  public fan project) is exactly the case ShareAlike language is written about.
  **Recommendation: hold VPO back until the CC0 route has been auditioned.** If
  CC0 alone gets us there, we never have to have this conversation.
- **sfizz-render** — the pragmatic answer to "our renderer only reads SF2". See
  A4.

**Felt / soft piano.** I found no felt piano that is simultaneously (a) SFZ, (b)
free, and (c) unambiguously clear about redistributing rendered audio. The
candidates are Pianobook's felt pianos (SFZ format, licence stated per
instrument, must be read on each page) and Jon Meyer's Kawai Felt Piano (WAV +
Kontakt, requires an email signup — which is account creation, so Bailey would
have to do it). **Cheaper first move, zero download:** Salamander already has 16
velocity layers. A felt piano is mostly *low velocity layers only*, plus a
darker filter and a proportionally louder hammer/mechanical noise. We can add a
`piano-felt` preset that clamps Salamander to its bottom layers with a tilt and
a touch of key noise and hear it in the audition before deciding whether a real
felt library is needed. That belongs in A3, not in a download list.

**Solo violin and cello with legato.** VSCO 2 CE and VPO both have solo strings;
neither has true recorded legato transitions. The free libraries that do (the
Performance Samples freebies, Slinky Violin, Minimalist Violins) are mostly
Kontakt-only, and the Kontakt ones cannot be driven from our offline Node
renderer at all. Realistically our solo lines get *simulated* legato (A3) rather
than recorded legato. That is honest, and it is a large improvement over what we
have now, which is no legato of any kind.

**Choir.** This is the weakest link and I do not have a clean free answer. The
CC0 material I found (VCSL vocals, Signature Sounds' CC0 children's choirs) is
sample material rather than a playable sustained choir, and the good free choirs
are Kontakt. This is the strongest argument for the hybrid in Option C.

### A2. Concert-hall impulse responses (downloads)

```
OpenAIR — real acoustic space IRs (concert halls, churches) | https://www.openair.hosted.york.ac.uk/ | a few MB per space | per-space, mostly CC BY / CC BY-SA — read each page
Théâtre Acoustique Room IR Library | https://www.lieuxperdus.com/convolver/download/ | tens of MB, 48 kHz 24-bit stereo | stated on the download page — read before taking
Voxengo free impulse response pack | https://www.voxengo.com/impulses/ | ~10 MB | free for any use, per Voxengo's page
```

**What it buys.** A convolution stage in place of `hallFor()`. Two sends rather
than one — a short "stage" IR for early reflections and a long hall tail — gives
the depth cue the seating map is currently only faking with pan and send level.
An IR convolution in Node is an FFT overlap-add, a couple of hundred lines, and
it is offline so cost does not matter. Keep `Hall` as the browser fallback.

Licence note: an IR is a recording of a room, and CC BY on an IR obliges
attribution in `CREDITS.md` — trivial — while CC BY-SA raises the same
redistribution question as VPO. Prefer the unambiguous ones.

### A3. The performance work in our own renderer (no downloads)

This is where I would spend first, and it is the part no download can substitute
for. In rough order of payoff per hour:

1. **Break the identical-note cache (1.6).** Add the note's channel index and
   start beat to the seed, so every occurrence gets its own round-robin pick,
   its own micro-timing and its own micro-detune, while keeping a cache keyed
   including that seed for genuinely repeated renders. Immediate, audible, and
   it costs render time rather than quality. *~2 agent-hours.*
2. **An expression curve per note (1.3).** Extend `Note` with an optional fifth
   element — a shape, e.g. `{ swell: 0.3 }` or a small breakpoint list — and
   have the sampler apply it as a gain *and* a brightness envelope across the
   held portion. Additive, so every existing score still parses (the format is
   a contract: `docs/CONTRACTS.md` + an entry in `docs/CONTRACT-CHANGES.md`).
   Then a phrase-level helper in `harmony.ts` that applies an arch across a slur
   so an arranger does not hand-write 40 swells. *~8 agent-hours.*
3. **True dynamic-layer crossfade (1.2).** Once VSCO 2 CE is in, drive the layer
   choice *continuously* — crossfade between the p and f recordings by the
   expression curve rather than hard-switching by velocity. This is the single
   change that makes a *forte* a different sound and not a louder one.
   *~6 agent-hours,* and it depends on A1 and A4.
4. **Simulated legato (1.4).** When two notes in a channel overlap or abut
   within a slur, suppress the second attack transient, pitch-glide the first
   into it over 40–90 ms, and keep one continuous sustain loop. *~6 agent-hours.*
5. **Ensemble spread and phrasing (1.7).** Replace symmetrical jitter with:
   per-desk onset spread that scales with section size, a small consistent lean
   behind the beat for low strings and brass, a forward lean into appoggiaturas,
   and a release that is late on phrase ends. *~5 agent-hours.*
6. **Divisi and release tails.** Let a section preset render a chord as
   independent desks with their own seeds rather than one stacked voice, and let
   a phrase end render its full bow release rather than the `tailFloor` default.
   *~4 agent-hours.*
7. **Dynamic range across the set (1.10).** Keep −16 LUFS as the *battle*
   reference and let scene cues sit deliberately quieter against it, with the
   difference measured and recorded in `tools/audio/measure.mjs`'s report rather
   than normalised away. *~3 agent-hours.*

### A4. How SFZ gets into a Node renderer

Our engine reads SF2 (`tools/audio/sf2.mjs`). VSCO 2 CE, VCSL and VPO are SFZ +
WAV. Three ways, cheapest first:

- **(i) A minimal SFZ reader.** SFZ is a text format; we need a useful subset —
  `sample`, `lokey/hikey/pitch_keycenter`, `lovel/hivel`, `loop_mode`,
  `loop_start/loop_end`, `volume`, `pan`, `seq_position`, `xfin_*/xfout_*`. Map
  it onto the same region shape `sf2.mjs` already produces and the sampler does
  not change at all. This also gives us `seq_position` — real round robins —
  and the velocity crossfade opcodes we need for A3.3. *~10 agent-hours,* and it
  keeps everything deterministic, in-process and testable. **Preferred.**
- **(ii) sfizz-render as an external step.** Emit a MIDI file per channel, shell
  out to `sfizz_render`, mix the stems back in Node. Fast to stand up, but it
  costs us determinism guarantees, the seating/expression hooks, and adds a
  binary dependency — and our note-level expression model would have to become
  MIDI CC. Good as a *sanity check* on (i), poor as the pipeline.
- **(iii) Convert SFZ → SF2 offline.** Loses the very opcodes we want. Rejected.

### A5. What Bailey would hear, and the risks

**Would hear:** the same tunes, with a *forte* that bites instead of just being
louder; an ostinato that no longer machine-guns; string lines that breathe
across a phrase instead of sitting flat; melodic lines that connect; and the
whole orchestra in a real room with depth front-to-back. The piano stays as good
as it is and gains a felt variant. The choir improves least.

**Risks:** render time goes up several-fold (offline, so this only costs
patience); breaking the note cache changes every cue's bytes, so every
`artifact-manifest` hash and the `qa.mjs` baselines move at once; the `Note`
format change touches a contract; a chamber library under FFX battle cues may
read as *smaller* rather than more modern, which is exactly what the audition is
for; the choir may still be the thing Bailey hears as "SNES" after all this work.

**Total: roughly 45–55 agent-hours** including the SFZ reader, the convolution
stage, preset remapping for 21 cues, and tests. It is a track, not a patch.

---

## 3. Option B — a local generative route on the RTX 5070 Ti through ComfyUI

ComfyUI is already installed at `D:/Tools/ComfyUI` and has a `models/audio_encoders`
tree, so the plumbing exists. Two open-weight candidates:

### ACE-Step

```
ACE-Step model weights (v1.5-turbo class) | https://huggingface.co/ACE-Step (see the model card linked from https://github.com/ace-step/ACE-Step) | ≈4.8 GB for the turbo checkpoint, plus ~1.2 GB text encoder and ~0.3 GB VAE; optional language models 1.4–3.8 GB | Apache-2.0 (free for commercial use)
ACE-Step ComfyUI custom nodes (for cover / repaint / audio2audio) | https://github.com/ace-step/ACE-Step-ComfyUI | small (code only) | see the repo's own licence before taking
```

- **Licence:** Apache-2.0 on the model. Clean.
- **Size / VRAM:** the turbo checkpoint is around 4.8 GB; ACE-Step is documented
  as running on consumer hardware from about 4 GB VRAM, generating a full song
  in seconds on a 3090-class card. A 5070 Ti is comfortably above that.
- **Audio-to-audio:** this is the crux. ACE-Step's own repository advertises
  **cover / repaint / edit**, i.e. conditioning on an existing audio input,
  which is exactly what "restyle our render, keep our melody" needs.
  **But ComfyUI's *native* support announcement explicitly said cover and
  repaint were not yet supported** — those features come through the ACE-Step
  custom-node pack (or the third-party `ComfyUI-AceMusic` pack). So this route
  requires a custom-node install, not just a model file, and that is a second
  approval and a second licence read.

### Stable Audio Open 1.0

```
Stable Audio Open 1.0 (ComfyUI repackaged checkpoint) | https://huggingface.co/Comfy-Org/stable-audio-open-1.0_repackaged | ≈4.7 GB | Stability AI Community License (free commercial use under US$1M revenue)
```

- **Size / VRAM:** ~4.7 GB, about 12 GB VRAM — fits, but with less headroom.
- **Length:** variable length **up to 47 s**, stereo 44.1 kHz.
- **Audio-to-audio:** version 1.0 is documented as text-to-audio; I found no
  audio-to-audio or style-transfer path for it. It is also tuned for **sound
  effects, samples and short loops, not full songs.**
- **Verdict for our purpose: not suitable as a restyler.** It cannot take our
  composed theme as input, so our leitmotifs would not survive. It *could* be
  useful later for one-shot textures and SFX beds, which is a separate question.

### The concrete workflow, if we take it

1. Render a cue exactly as today with `tools/audio/render.mjs`, but export the
   clean 32-bit float WAV before MP3 (the renderer already writes one).
2. Feed that WAV into an ACE-Step cover/repaint graph in ComfyUI with a text
   prompt describing the target ("live symphony orchestra, solo cello, felt
   piano, large concert hall, cinematic, no drums") at a **low restyle strength**
   so the melodic and harmonic content is preserved.
3. Bring the result back, re-measure with `tools/audio/measure.mjs`, re-master
   to −16 LUFS, re-encode.
4. Loop handling is the hard part — see the risks.

### What Bailey would hear, and the risks

**Would hear:** potentially the single biggest leap in "does this sound real",
because the model has learned what a recorded orchestra actually sounds like.

**Risks, and they are serious for a looping game score:**

- **Melody drift.** At any restyle strength high enough to change the timbre,
  diffusion models move notes. Our leitmotifs are the point (THEMES.md); a cue
  that comes back with a *different tune* is a failure even if it sounds better.
- **Loop points die.** `renderCue` folds the reverb tail back into the loop
  region so `[loopStart, loopEnd)` is sample-accurate and seamless
  (`render.mjs` around lines 249–262), and `seam-probe.mjs` exists to verify it.
  A diffusion pass regenerates the audio; the seam is gone, and there is no
  obvious way to get it back short of generating a long take and cutting by ear
  — which no agent on this project can do (hard rule 13).
- **47 s / context limits** versus our cues at 1:20–2:55.
- **Artefacts** on sustained strings and choir — the exact material we are
  trying to fix — plus warbling on long held notes.
- **Loudness and consistency** across 21 cues, and non-determinism: our whole
  audio pipeline is deterministic and measured (`qa.mjs`, `measure.mjs`,
  `artifact-manifest.json`). A generated cue cannot be re-derived from the repo.
- **Provenance.** Hard rule 8 is "original assets only". Our scores are original
  and stay original, but audio generated by a model trained on unknown music is a
  question Bailey should answer deliberately rather than have an agent decide.
  This is a question for Bailey below, not a judgement.
- **Nobody here can hear the result** (hard rule 13), so each iteration costs a
  round trip to Bailey via `docs/audio/audition.html`.

**Work:** ~6 agent-hours to stand up the graph and one cue; the cost is then in
iterations Bailey has to listen to, not in agent time. **Downloads: ~6.3 GB.**

---

## 4. Option C — the hybrid

Sampled rendering stays the master pipeline. Generative is used narrowly, where
it is strong and where its weaknesses do not bite:

- **The choir only.** Diagnosis 1.9 says our choir is the worst voice and A1 has
  no good free answer. Generate wordless choir *stems* as fixed-length,
  non-looping textures, audition them, and if Bailey approves, treat the chosen
  ones as **assets** layered into the sampled render at known positions. The
  sampled orchestra keeps the loop seam; the choir bed sits inside the loop
  region and loops with it.
- **Non-looping cues.** `victory-ffx`, `victory-ffx2` and the two endings loop
  but tolerate a longer, less critical seam; these are the safest candidates for
  a whole-cue restyle if Bailey wants to hear one.
- **As a target, not a product.** Restyle one cue, have Bailey listen, and use
  what he likes about it to aim the Option A performance work. This costs almost
  nothing and risks nothing.

**Risks:** two pipelines to maintain; the provenance question still applies to
anything that ships; a generated choir has to be re-auditioned whenever the
arrangement under it changes.

**Work:** Option A's hours plus ~8 for the stem workflow and the layering.

---

## 5. Recommendation

**Take Option A as the trunk, in two stages, and hold Option B as a single
experiment rather than a pipeline.**

The reasoning is in the ranking at the end of section 1: four of the eight
causes — the bit-identical repeated notes, the missing intra-note expression, the
missing legato, and the grid onsets — are **our code and need no downloads at
all**. They are also the causes that most directly produce the "tracker" quality
Bailey is describing. Buying better samples without fixing them would put better
recordings through the same 16-bit performance model.

So:

- **Stage 1 (no downloads, ~20 agent-hours):** A3 items 1, 2, 4, 5 — break the
  note cache, add the expression curve, simulated legato, ensemble phrasing —
  plus the `piano-felt` preset derived from Salamander's low layers. This is
  buildable today and does not wait on any approval except the contract change.
- **Stage 2 (after Bailey approves the downloads, ~30 agent-hours):** VSCO 2 CE
  and VCSL only — both **CC0**, which keeps `CREDITS.md` and rule 8 clean — the
  SFZ reader (A4 route i), continuous dynamic-layer crossfade, and a convolution
  hall from one clearly-licensed IR. Hold VPO and its ShareAlike question in
  reserve; hold the choir question for Option C.
- **Option B, exactly once:** one ACE-Step restyle of one cue, as a *reference*
  for the audition, so Bailey can hear how far the sampled route can be pushed
  before we commit ~50 hours to it. If it is dramatically better and Bailey
  accepts the provenance and loop-seam trade-offs, the plan is revisited.

## 6. First step after approval: the A / B / C audition (hard rule 9)

Bailey judges audio by ear (hard rule 13), so the end state is auditioned before
it is built. **The same 45 seconds of one existing cue — `battle-ffx`, the
Chapter 1 battle theme — rendered three ways, same notes, same tempo, same
master target, same loudness, unlabelled order:**

- **Sketch A — today.** The current pipeline, unchanged. The control.
- **Sketch B — the performance model.** Stage 1 only: no new samples, no new
  room. This isolates how much of the complaint is performance rather than
  timbre, which is the cheapest and most valuable thing we can learn.
- **Sketch C — the full sampled target.** Stage 1 plus VSCO 2 CE on the strings
  and brass plus a convolution hall. This needs the Stage 2 downloads, so if
  Bailey approves the plan but not the downloads, C is dropped and the audition
  runs A/B.

Delivered through `docs/audio/audition.html` (the mechanism already exists),
with a written note on what changed between each. Bailey picks or mixes, we
record liked / disliked / must remain / must change / undecided in the audio
tile's `reaction` in `docs/target/targets.json` (hard rule 15), and only then is
the track built out across all 21 cues.

A second cue should follow in the same audition if it is cheap: `scene-farplane`
or `boss-shuyin` for the FFX-2 side, so the pick is not made on a battle cue
alone. Rule 14 says this change is "both", and the audition should be able to
show that.

## 7. Questions for Bailey

1. **Downloads.** May we take the CC0 set — VSCO 2 Community Edition (~1.9 GB)
   and selected VCSL instruments (~20–75 MB each)? Each is listed above with its
   URL, size and licence.
2. **Virtual Playing Orchestra** brings a ShareAlike licence component into a
   public fan project. Hold it back, or read it carefully and decide?
3. **Generated audio.** Is model-generated music acceptable in this project at
   all, given rule 8 ("original assets only")? The scores stay ours either way;
   the question is whether a model's rendering of them may ship.
4. **The choir** is our worst voice and has no good free sampled answer. Is the
   Option C route — generated wordless choir stems, auditioned, layered — worth
   trying, or should the choir simply be used less?
5. **The audition:** `battle-ffx` alone, or `battle-ffx` plus one FFX-2 cue?
6. Would a **felt piano** download be wanted if the Salamander-derived felt
   preset does not convince, given it needs an email signup Bailey would have to
   do?

---

*Sources for the library, licence and model facts in sections 2 and 3:
[VSCO 2 CE](https://versilian-studios.com/vsco-community/) ·
[VSCO-2-CE on GitHub](https://github.com/sgossner/VSCO-2-CE) ·
[VCSL](https://github.com/sgossner/VCSL) ·
[Virtual Playing Orchestra](https://virtualplaying.com/virtual-playing-orchestra/) ·
[sfizz-render](https://github.com/sfztools/sfizz-render) ·
[OpenAIR](https://www.openair.hosted.york.ac.uk/) ·
[Voxengo impulses](https://www.voxengo.com/impulses/) ·
[Théâtre Acoustique IRs](https://www.lieuxperdus.com/convolver/download/) ·
[ACE-Step](https://github.com/ace-step/ACE-Step) ·
[ACE-Step in ComfyUI](https://blog.comfy.org/p/stable-diffusion-moment-of-audio) ·
[Stable Audio Open 1.0](https://huggingface.co/stabilityai/stable-audio-open-1.0) ·
[Stable Audio Open in ComfyUI](https://comfy.org/p/supported-models/stable-audio-open-1-0/).
Sizes and licences are as the publishers state them and must be re-checked on
the page at download time.*
