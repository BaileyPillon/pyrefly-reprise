# Audio credits and licences

Pyrefly Reprise ships **no sampled instruments**. It ships MP3s that were
rendered offline from our own scores, using free sample libraries that live on
the build machine and are never committed to this repository.

This file records what those libraries are, where they came from, what their
licences require, and what has to appear in the game's credits.

---

## What ships, and what does not

| | Where | In git? | In the build? |
|---|---|---|---|
| Sample libraries (`.sf2`, ~1.9 GB) | `D:/Tools/audio-libs/` | no | no |
| Rendered cues (`public/audio/**`, ~84 MB) | repo | **yes** | yes |
| Scores, instruments, DSP (`src/audio/`) | repo | yes | yes |

The libraries are an input to the build, in the same way a font or a compiler
is. Nothing recorded by any of them reaches a player except as part of a
performance of an original Pyrefly Reprise composition.

> **The music itself is original.** Every note in `src/audio/tracks/` was
> written for this project. Nothing is transcribed from Final Fantasy, Clair
> Obscur or any other work — see `docs/AUDIO-GUIDE.md`. Swapping oscillators
> for recorded instruments does not change that, and does not make any of these
> libraries a co-author of the compositions.

---

## Libraries used

### Salamander Grand Piano V3

- **Used for**: `piano`
- **Licence**: Creative Commons Attribution 3.0 (CC-BY 3.0)
- **Attribution required**: **yes** — "Salamander Grand Piano by Alexander Holm, CC-BY 3.0"
- **Author**: Alexander Holm
- **Source**: <https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html>
- **File fetched**: `SalamanderGrandPiano-SF2-V3+20200602.tar.xz` (310,397,984 bytes)
- **SHA-256**: `15edb061d7ba60d58332f72dba8f8ce40988048cc703f935e6320f37d650e213`
- **Unpacks to**: `salamander/SalamanderGrandPiano-V3+20200602.sf2` (1.27 GB)

A stereo Yamaha C5 sampled at 16 velocity layers across the full 88 keys. It is
the reason the title theme and the menus sound like a piano in a room rather
than a synthesised bell, and it is worth its size on disk.

### Sonatina Symphonic Orchestra (SF2 conversion)

- **Used for**: strings, brass, woodwinds, choir, harp, timpani, orchestral percussion
- **Licence**: Creative Commons Sampling Plus 1.0
- **Attribution required**: **yes** — "Sonatina Symphonic Orchestra by Mattias Westlund, CC Sampling Plus 1.0"
- **Author**: Mattias Westlund. SF2 conversion by "Symphony2".
- **Source**: <https://ftp.osuosl.org/pub/musescore/soundfont/> (MuseScore's mirror)
- **File fetched**: `Sonatina_Symphonic_Orchestra_SF2.zip` (417,656,133 bytes)
- **SHA-256**: `8ce01d7f3d6ecdbf0dc2a749f69e88e65917a57422a1741c3d1aaa5ed92bf71c`
- **Unpacks to**: `sonatina/Sonatina_Symphonic_Orchestra.sf2` (495 MB)

Note on the licence: CC Sampling Plus permits commercial and non-commercial use
of the samples **as part of a larger work**, which is exactly what a rendered
cue is, and forbids redistributing the library itself. Shipping the renders and
not the `.sf2` is both what we want technically and what the licence asks for.

### FluidR3 GM/GM2

- **Used for**: celesta, tubular bells, marimba, organs, guitars, basses, drum kits, synth patches, tremolo strings
- **Licence**: MIT
- **Attribution required**: not strictly, but we credit it anyway
- **Author**: Frank Wen
- **Source**: <https://ftp.osuosl.org/pub/musescore/soundfont/fluid-soundfont.tar.gz>
- **File fetched**: `fluid-soundfont.tar.gz` (130,294,103 bytes)
- **SHA-256**: `c815769e44d86f1507b946a6c48c997c7f650699aea1ec4b11ba66e3415c26b9`
- **Unpacks to**: `fluidr3/FluidR3 GM2-2.SF2` (148 MB)

The general-MIDI workhorse. It fills every gap the two orchestral libraries
leave — the band and machina register in particular, where Sonatina has nothing
to offer.

---

### Voxengo impulse responses (audition candidates only)

`D:/Tools/audio-libs/ir/voxengo/` — Voxengo's free impulse-response set, made with
Impulse Modeler by Aleksey Vaneev, downloaded 2026-09-22 with Bailey's yes (NOW.md,
the five-item list, item 5). The licence (`license.txt` beside the files) grants
royalty-free use for any purpose, commercial included, and restricts only
redistributing the IR files themselves, which we never do: only music convolved
with them is published. Used so far by `tools/audio/modern/render-evrae.mjs`
(the "Musikvereinsaal" file) for the Chapter VIII modern-sound candidates in
`public/audio/candidates/modern-*.mp3`. Since music v2 (2026-09-30) shipped cues use
its "Direct Cabinet N2" file for the guitar cabinet (below), so the credit "Impulse responses: Voxengo (Aleksey Vaneev)" applies.

### Per cue: `scene-macalania-temple` (Chapter VII, FFX only, 2026-09-29)

"The Frozen Temple", original (rule 8): the score is
`src/audio/tracks/scene-macalania-temple.ts`, ported note for note from sketch A
(`tools/audio/scores/2026-09-24/macalania-scene-a-frozen-temple.mjs`); its only borrowed
material is this project's own `HYMN_HEAD`. The shipped MP3 is three steps, none of which adds
a credit:

1. the sketch rendered offline with the libraries above (Sonatina strings, harp and choir,
   FluidR3 glockenspiel, celesta and chimes);
2. the Direction B restyle of that render (ACE-Step v1 3.5B through ComfyUI, the model already
   on disk: `docs/audio/downloads-2026-09-27.md`; lossless master
   `D:/Tools/pyrefly-scratch/direction-b-0927-work/master/macalania-a.wav`);
3. the R1 "focus" remaster (`tools/audio/remaster.py` through `tools/audio/remaster-ship.py`):
   numpy and the ffmpeg already on this machine; no impulse response file, no network call, no
   download.

D-278: the driver picked sketch A in R1 from measurements, not by ear (rule 13); Bailey can swap
it. Nothing here changes the credits below.

### The whole score in R1 (both games, 2026-09-29, D-283)

Bailey, 2026-09-29: "all your recommendations, full speed ahead." Twenty-three more cues now
ship the same three steps as `scene-macalania-temple` above (every cue in
`docs/audio/soundtrack-r1-2026-09-29.json` with `"pass": true`): the cue's own score rendered
with the libraries on this page, the Direction B restyle of that render
(`docs/audio/direction-b-2026-09-27.md`; lossless masters in
`D:/Tools/pyrefly-scratch/direction-b-0927-work/master/`), and remaster R1 "focus"
(`tools/audio/remaster-score.mjs` over `remaster-ship.py` and `remaster.py`: numpy and the
ffmpeg on this machine, no impulse-response file, no network call, no download).
`boss-vegnagun` and `scene-bevelle-underground` failed a stereo gate in R1 and still ship their
plain sampled render.

**The ACE-Step model's licence: Apache-2.0.** Read on 2026-09-29 from the Hugging Face API:
`ACE-Step/ACE-Step-v1-3.5B` (sha 82cd0d7b, card and tags `license:apache-2.0`) and the ComfyUI
repackage `Comfy-Org/ACE-Step_ComfyUI_repackaged` (sha e39503e8, `license:apache-2.0`, which
lists `all_in_one/ace_step_v1_3.5b.safetensors`, the file name on this disk). Apache-2.0 puts
its notice conditions on redistributing the model, which this project does not do; it claims
nothing over the model's output. A courtesy line for the credits screen, not an obligation:

```
Music restyled with ACE-Step v1 3.5B (ACE Studio and StepFun) — Apache-2.0
```

Open: the on-disk checkpoint's hash was not compared with the repackage's published file, so
"the file on disk is that upload" rests on the file name and `docs/audio/downloads-2026-09-27.md`.

### Music v2: route S and route N2 (2026-09-30)

Bailey, 2026-09-30: "I'll go with all your recommendations". The 16 FFX cues now ship **route S**: the cue's
own score played offline by the free sample libraries below in a measured concert hall, mixed and mastered,
with **no AI**. The 7 FFX-2 cues ship **route N2**: the same kind of route S render (a band arrangement of the
cue's own score), restyled by ACE-Step 1.5 at denoise 0.25-0.30; `boss-vegnagun` and `scene-farplane` ship
their route S render (no N2 take passed the pick rule). `title`, `pause` and `chapter-select` are unchanged
(the R1 section above). Records: `docs/audio/music-v2-2026-09-30.json`, `docs/handoff/music-v2.md`; renderers
and every iteration in `D:/Tools/pyrefly-scratch/audio-v2/ffx` and `ffx2`. Every library lives on this disk
under `D:/Tools/audio-libs/` (downloads recorded in `D:/Tools/downloads.md`) and none is committed or
shipped: only our renders are. Nothing ships locally only.

| Library or tool | Used in music v2 for | Licence | Credit |
|---|---|---|---|
| VSCO 2 Community Edition (Versilian Studios) | strings, brass, winds, oboe, solo violin, pizzicato, organ, harp, timpani, tubular bells, glockenspiel, marimba | CC0 | thanks (not required) |
| VCSL, Versilian Community Sample Library (Versilian Studios) | Steinway B piano, Flemish harpsichord, vibraphone, suspended cymbal, bass drum, shaker, anvil | CC0 | thanks |
| Sonatina Symphonic Orchestra (Mattias Westlund) | choir, alto flute (samples processed) | CC Sampling Plus 1.0 | **required** (already listed) |
| Salamander Grand Piano V3 (Alexander Holm) | piano in `boss-shuyin` and `ending-ffx2` | CC-BY 3.0 | **required** (already listed) |
| Karoryfer Black And Blue Basses, Karoryfer Shinyguitar, Karoryfer x bigcat cello (Karoryfer Samples, bigcat instruments) | electric bass, the guitars (`boss-jecht`, the FFX-2 band), solo cello (Gagazet's cello rise) | CC0 | thanks |
| DRSKit 2.1 (DrumGizmo team: Deva, Lars Muldjord; Jes Eiler of DRSDrums) | the drum kit | CC-BY 4.0 | **required** |
| Arvedi Auditorium room impulse responses (Miotello et al., Zenodo, doi:10.5281/zenodo.20098848) | the hall (decoded to stereo, direct sound removed) | CC-BY 4.0 | **required** |
| Voxengo free impulse responses (Aleksey Vaneev), "Direct Cabinet N2" | the guitar speaker cabinet | Voxengo licence: royalty-free for any use, the IR files not redistributed | courtesy |
| jRhodes3d (Jeff Learman) | the Rhodes part of the FFX-2 band | music made with it: CC0 (the samples are CC BY-NC only if redistributed, which we never do) | thanks |
| Surge XT 1.3.4 (Surge Synth Team) | synth pads, sub and alarm in the FFX-2 band (factory patches) | GPL-3 for the synth; its audio output is ours | thanks |
| sfizz 1.2.3 | renders the Karoryfer and jRhodes programs | BSD-2 | none (a tool) |
| ACE-Step 1.5 turbo (2B) and XL turbo (4B) (ACE Studio and StepFun) | the N2 restyle of five FFX-2 cues, over our own renders only | MIT; its output is ours, no model file ships | courtesy |

No retail audio was used anywhere (rule 8): every input is our own score or our own render of it.

## What must appear in the game credits

Four entries, verbatim (the last two since music v2, 2026-09-30):

```
Salamander Grand Piano by Alexander Holm — CC-BY 3.0
Sonatina Symphonic Orchestra by Mattias Westlund — CC Sampling Plus 1.0
Drum kit: DRSKit 2.1 by the DrumGizmo team (Deva, Lars Muldjord) and Jes Eiler of DRSDrums, drumgizmo.org — CC-BY 4.0
Hall acoustics: "The Sound of the Violin's Home: A Higher-Order Room Impulse Response Dataset of the Arvedi Auditorium in Cremona", F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci, Zenodo, doi:10.5281/zenodo.20098848 — CC-BY 4.0 (decoded to stereo, direct sound removed)
```

and, as a courtesy rather than an obligation:

```
FluidR3 GM soundfont by Frank Wen — MIT
Impulse responses: Voxengo (Aleksey Vaneev)
Music restyled with ACE-Step 1.5 (ACE Studio and StepFun) — MIT
Also used, CC0: VSCO 2 Community Edition and VCSL (Versilian Studios); Black And Blue Basses, Shinyguitar and the Karoryfer x bigcat cello (Karoryfer Samples, bigcat instruments); jRhodes3d (Jeff Learman); Surge XT (Surge Synth Team)
```

> **TODO for whoever owns the credits screen.** These are not yet wired into
> any in-game credits data — at the time of writing there is no credits screen
> to wire them into. They must be on it before release. This is a licence
> condition for four of the sources above, not a nicety.

The same two entries cover the sound effects as well as the music: since the
redesign, an effect's bells, glass, harp, choir, tam-tam, timpani and solo
strings are played by these libraries in `public/audio/sfx/sprite.mp3` exactly
as the music's are. No separate attribution is needed, and none of them is a
co-author of the designs.

---

## What the sound effects do NOT use

The brief allowed free CC0 foley packs (Kenney, OpenGameArt) as an extra source
for cloth, footsteps, debris and the like. **Nothing was downloaded.** Every
non-musical layer in the bank — cloth, air, grit, spray, sparks — is
band-limited noise generated by our own DSP, sitting under recorded orchestral
material.

Two reasons, and the second is the real one:

1. A download is a decision with a licence attached to it, and the owner makes
   those. The libraries above were installed under an explicit instruction; no
   equivalent instruction covers a foley pack.
2. It is honest about what the bank actually is. `SOUND-DESIGN.md` says the
   same thing in its caveats: the synthesised movement layers are the least
   convincing part of the effects and the first thing to replace if Bailey
   wants recorded foley.

If a pack is ever added, it goes through **Rules for adding another library**
below, with its licence, source, size and hash recorded here first.

---

## Installing the libraries on a new machine

Only needed to *re-render* audio. Playing the game, running the tests and
building the site all work without any of this, because the renders are
committed.

```bash
mkdir -p D:/Tools/audio-libs/_dl && cd D:/Tools/audio-libs/_dl

curl -L -O https://ftp.osuosl.org/pub/musescore/soundfont/fluid-soundfont.tar.gz
curl -L -O https://ftp.osuosl.org/pub/musescore/soundfont/Sonatina_Symphonic_Orchestra_SF2.zip
curl -L -O 'https://freepats.zenvoid.org/Piano/SalamanderGrandPiano/SalamanderGrandPiano-SF2-V3+20200602.tar.xz'

# Verify before unpacking. This machine has unstable RAM and has silently
# corrupted large downloads before; a half-bad soundfont produces audio that
# is subtly wrong rather than obviously broken, which is far worse.
sha256sum -c <<'EOF'
c815769e44d86f1507b946a6c48c997c7f650699aea1ec4b11ba66e3415c26b9 *fluid-soundfont.tar.gz
8ce01d7f3d6ecdbf0dc2a749f69e88e65917a57422a1741c3d1aaa5ed92bf71c *Sonatina_Symphonic_Orchestra_SF2.zip
15edb061d7ba60d58332f72dba8f8ce40988048cc703f935e6320f37d650e213 *SalamanderGrandPiano-SF2-V3+20200602.tar.xz
EOF

mkdir -p ../fluidr3 ../sonatina ../salamander
tar xzf fluid-soundfont.tar.gz -C ../fluidr3
unzip -q Sonatina_Symphonic_Orchestra_SF2.zip -d ../sonatina
tar xJf 'SalamanderGrandPiano-SF2-V3+20200602.tar.xz' -C ../salamander --strip-components=1
```

Then check the renderer can see all three:

```bash
npm run audio:instruments        # ends with "Libraries found: ..."
```

Set `PYREFLY_AUDIO_LIBS` to use a different root.

### Rules for adding another library

1. **Free licences only.** CC0, CC-BY, CC Sampling Plus, MIT and similar are
   fine. Anything that needs paying for needs Bailey's say-so first — do not
   assume, and do not use it in the meantime.
2. **Official sources only**: the project's own page, or its GitHub releases.
   Not a reupload, not a torrent, not a "soundfont pack" aggregator.
3. **Never run a downloaded executable.** Every library here is a data file
   inside an archive. An installer is a reason to walk away.
4. **Verify the archive** — size against `Content-Length`, an integrity test
   (`gzip -t`, `unzip -t`, `tar t`), and a published hash where one exists.
   Record the size and SHA-256 here.
5. **Record it here**: what it is used for, its licence, whether attribution is
   required, and the exact attribution string if so.
6. **Never commit it**, and never add it to `public/`.
