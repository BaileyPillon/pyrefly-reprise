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

> **Since 2026-10-07 some cues are not performances of those scores.** Bailey
> picked, by ear, takes that the ElevenLabs Music API generated from our own
> written briefs, for the cues listed under "Music from ElevenLabs" below. Those
> shipped files are AI-generated; the score of each such cue stays in
> `src/audio/tracks/` as the synth fallback. The prompts name no composer,
> franchise, character or melody, and nobody has checked the takes for
> resemblance to existing music.

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
`public/audio/candidates/modern-*.mp3`. **Since music v2 and D-302 (both 2026-09-30) shipped cues use it**: music v2 uses its "Direct Cabinet N2" file for the guitar cabinet (below), and the
recorded SFX set's room and hall tails (`public/audio/sfx/sprite-v2.mp3`, below) are convolved with
these files, so the credit "Impulse responses: Voxengo (Aleksey Vaneev)" is now owed (the IR files
themselves are still never published).

### The recorded SFX set (`public/audio/sfx/sprite-v2.mp3`, D-302, 2026-09-30)

Bailey, 2026-09-30 ~14:25 EDT: "I'll go with all your recommendations" (the new recorded, layered
set with the full hookup, `docs/AUDIO-GUIDE.md` "The recorded set"). Built outside the repo in
`D:/Tools/pyrefly-scratch/audio-0930/sfx` from recordings downloaded for it (40 files, 87.3 MB, every
one from its official host with a SHA-256 on receipt; `tools/sources.json` there and
`D:/Tools/downloads.md`) and from libraries already on this disk: VCSL (Versilian Community Sample
Library, CC0: glockenspiel, hand chimes, tubular bells, bell tree, wine glasses, gongs, cymbals,
claves, sleigh bells, tambourine, finger cymbals), VSCO 2 Community Edition (CC0: timpani, bass drum,
snare), the Sonatina choir (CC Sampling Plus 1.0, above) and the Voxengo impulse responses (above).
Only renders ship; no source file is committed or published. The sources a shipped cue uses:

| Source (author) | Licence | Official page | Archive SHA-256 (first 16) | Used |
|---|---|---|---|---|
| kenney_impact-sounds.zip (Kenney) | CC0 1.0 | https://kenney.nl/assets/impact-sounds | `029d734af1582474` | 18 files |
| kenney_rpg-audio.zip (Kenney) | CC0 1.0 | https://kenney.nl/assets/rpg-audio | `6dbeaf8544da958d` | 11 files |
| kenney_interface-sounds.zip (Kenney) | CC0 1.0 | https://kenney.nl/assets/interface-sounds | `f2193d072726d675` | 1 files |
| kenney_sci-fi-sounds.zip (Kenney) | CC0 1.0 | https://kenney.nl/assets/sci-fi-sounds | `119340f351a5098a` | 8 files |
| 80-CC0-RPG-SFX_0.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/80-cc0-rpg-sfx | `1c2f06ff4e8563b5` | 2 files |
| sfx_breaking_and_falling.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx | `e6ee04d91c5f4d30` | 12 files |
| water-splash-slime-sfx.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/40-cc0-water-splash-slime-sfx | `7cd39abb49d4362a` | 5 files |
| 100-CC0-SFX_0.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/100-cc0-sfx | `a5c135878c132f1c` | 1 files |
| 25-CC0-bang-sfx.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/25-cc0-bang-firework-sfx | `c0c9ecc11e2dc0d1` | 3 files |
| 100-CC0-wood-metal-SFX.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/100-cc0-metal-and-wood-sfx | `be6eba63b03409ac` | 7 files |
| sfx_100_v2.zip (rubberduck) | CC0 1.0 | https://opengameart.org/content/100-cc0-sfx-2 | `0fc61b4494e2e893` | 3 files |
| swishes.zip (artisticdude) | CC0 1.0 | https://opengameart.org/content/swishes-sound-pack | `7980215241b739a7` | 11 files |
| rpg_sound_pack.zip (artisticdude) | CC0 1.0 | https://opengameart.org/content/rpg-sound-pack | `f80754a9c04854e3` | 1 files |
| sword_clash_-_starninjas_0.zip (StarNinjas) | CC0 1.0 | https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes | `f363c80ea1627548` | 1 files |
| Nosferatu_thunderclap_-_Richard_Humphries.wav (Richard Humphries) | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Nosferatu_thunderclap_-_Richard_Humphries.wav | `338c2d76c4457403` | 1 files |
| 439280_schots_angry-tiger.wav (schots) | CC0 | https://commons.wikimedia.org/wiki/File:439280_schots_angry-tiger.wav | `497b4584308d85e2` | 1 files |
| Yellowstone_sound_library_-_Grizzly_Bear_vocalizations_-_001.mp3 (NPS & MSU Acoustic Atlas / Jennifer Jerrett) | Public domain | https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Grizzly_Bear_vocalizations_-_001.mp3 | `23b9fed12b150866` | 1 files |
| Ocean_Waves_on_a_Tropical_Beach.ogg (Jarrod stanley) | CC0 | https://commons.wikimedia.org/wiki/File:Ocean_Waves_on_a_Tropical_Beach.ogg | `bae2fc0a0c1d36f4` | 1 files |
| WWS_Bonfireignition.ogg (Work With Sounds / Werstas) | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:WWS_Bonfireignition.ogg | `370b9f33284c9433` | 1 files |
| Windglockenspiel.Koshi.ogg (Membeth.) | CC0 | https://commons.wikimedia.org/wiki/File:Windglockenspiel.Koshi.ogg | `1f8b33ad604ef9ff` | 1 files |
| Glass_breaking_(Gravity_Sound).wav (Gravity Sound) | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Glass_breaking_(Gravity_Sound).wav | `9aaaaea0df692ee6` | 1 files |

Downloaded but unused by any shipped cue (so nothing to credit): Kenney UI Audio and Digital Audio,
rubberduck's creature and sci-fi packs, StarNinjas' sword pack, the Magic SFX Preview Pack (CC-BY 3.0),
and eleven Wikimedia Commons files. Not used at all: Sonniss GDC bundles, Freesound and Pixabay (they
need an account), BBC Sound Effects (its licence excludes this use). No retail game audio was used as
a source or as a reference.

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

### Music from ElevenLabs (2026-10-07)

The cues below ship a take generated by the **ElevenLabs Music API** (model `music_v2_5`), an AI music
service, instead of a render of our score. Each was generated on 2026-10-07 from a written brief of ours,
chosen by Bailey by ear, and mastered here: one gain to -16 LUFS, the loop cut and a LAME V0 encode, no
EQ, no stereo repair, no reverb. Nothing was uploaded to the service as a reference. The record,
`docs/audio/music-elevenlabs-2026-10-07.json`, holds for each cue the full request, the raw take's hash, the
time and credits spent, and the hashes and measurements of the files that ship. The briefs (mood, tempo, key,
instruments, structure) are in `docs/audio/music-briefs.md` on branch `elevenlabs-groundwork`.

- **Licence.** ElevenLabs' Terms of Use (1(c)), as read in `docs/audio/elevenlabs-plan.md` on that branch,
  let a paid plan use the output commercially and keep a free plan non-commercial. These takes were
  generated on Bailey's paid Creator plan (the driver's brief of 2026-10-07; not checked against the
  account), none on the free plan. That plan document records no attribution condition for a paid plan; the
  reading has not been checked against the current Terms. Confirm the plan, the date and the Terms on the
  day a build ships, and keep the record, `D:/Tools/elevenlabs/usage.jsonl` and each `take-1.json` sidecar.
- **Provenance.** The API returned no request id for any take (`requestId` is null in each sidecar), and
  `sign_with_c2pa` was not set.
- **Originality.** The prompts are ours and name no composer, franchise, character, melody or lyric. No
  resemblance check against existing music has been run on any take: agents cannot hear (rule 13).
- **Sound.** Each take is a 128 kbps MP3, so it is band-limited at about 16.6 to 17.1 kHz, and the shipped V0
  file is a transcode of it. Most takes are wider than the stereo gate in `THEMES.md` allows; the rows there say
  which.

#### `boss-seymour` (FFX only: Chapter I, and Chapter XII as its stand-in): take A

Brief `boss-seymour-a`, take 1; generated 2026-10-07 12:38 UTC (1,470 credits). The raw take is an MP3 at
128 kbps, 98.04 s, SHA-256 `ef3674f365b83a726bff40995874d951f26d1ddb376d54aa8299de324d030184`. The prompt, as
sent (`music_length_ms` 98000, `force_instrumental` false):

```
Gothic orchestral battle music at 132 BPM in C-sharp minor. A low pipe organ and double basses carry a slow, courteous, sinister six-note figure; staccato low strings and timpani drive a steady pulse; dark brass answers in long chords; a sustained wordless choir sings open vowels only, no words and no rhythmic chanting. It builds in three waves from a quiet organ and tolling bell to a full orchestra, with a hushed organ-only passage in the middle, and ends on a held tense chord. Elegant, menacing contempt, never frantic. Steady tempo, no tempo changes, no fade-out, no final cadence.
```

#### `chapter-select` (both games): take B

Brief `chapter-select-b`, take 1; generated 2026-10-07 13:05 UTC (1,200 credits). The raw take is an MP3 at
128 kbps, 80.04 s, SHA-256 `dfdd17aee800a2417a44f4c1ca0dbf1bedc53ca3c86699c067b23a1984c4cd92`. The prompt, as
sent (`music_length_ms` 80000, `force_instrumental` true):

```
Warm, cinematic and hopeful menu theme at 72 BPM in D major, 4/4. A solo grand piano opens with a gentle, singing melody over soft sustained strings; a warm cello answers; then the full string section swells softly with a light harp and a distant French horn, like the calm morning before a long journey. Emotional but restrained, spacious, beautifully recorded. No drums, no percussion, no vocals, no electronic sounds. Loops cleanly: no final chord, no fade-out.
```

#### `chapter-select-a` (both games; a selectable alternate in OPTIONS, CHAPTER MUSIC = A): take A

Brief `chapter-select`, take 1; generated 2026-10-07 13:04 UTC (1,095 credits). The raw take is an MP3 at
128 kbps, 73.04 s, SHA-256 `966af4fb31ff5c762b4bdf8647baca86ee6a1d7dee701f8a591d797e4dee4303`. The prompt, as
sent (`music_length_ms` 73000, `force_instrumental` true):

```
Unhurried chamber waltz in 3/4 at 84 BPM in B minor. A solo flute plays four slow notes alone, then a pause; then harp and celesta begin an oom-pah-pah waltz under a gentle melody, and a string quartet joins and doubles the tune. Warm, calm, spacious, French-impressionist colour. No drums, no vocals. Loops cleanly: no final chord, no fade-out.
```

Bailey chose it as a selectable alternate to the board's default (take B above; Bailey, 2026-10-07: "and A as a selectable alternate as well"). It is a new cue that replaces no file. **Unlike the other takes it is encoded at LAME V4, not V0**, because the shipping cap was not raised and V0 would not fit (the record, `alternates[].master.why`). It is mastered with one gain to -16 LUFS and the loop cut, like the others; the loop starts at bar 13 of the take and ends at bar 33.

#### `chapter-select-c` (both games; a selectable alternate in OPTIONS, CHAPTER MUSIC = C): take C

Brief `chapter-select-c`, take 1; generated 2026-10-07 13:05 UTC (1,200 credits). The raw take is an MP3 at
128 kbps, 80.04 s, SHA-256 `5c02c3af5eecad6b907b6f1961ad9fab839b4a16fe59e6f9137d22011ff46c66`. The prompt, as
sent (`music_length_ms` 80000, `force_instrumental` false):

```
Ethereal, dreamlike menu theme at 66 BPM in E minor, 3/4. A concert harp plays slow rippling arpeggios; soft glass bells and a celesta sparkle above like drifting lights over still water; a wordless solo soprano sings a long, calm, floating melody on open vowels only, no words; a low warm string pad underneath. Serene, luminous, a little sad, very spacious with natural hall reverb. No drums, no lyrics, no electronic beats. Loops cleanly: no final chord, no fade-out.
```

Bailey chose it as a selectable alternate to the board's default (take B above; Bailey, 2026-10-07: "but C as a selectable alternate"). It is a new cue that replaces no file, encoded at LAME V4 like take A. The prompt asks for a wordless solo soprano, so the take carries an **AI-generated voice** singing open vowels, no words; the credits' AI-music disclosure covers it. It is mastered with one gain to -16 LUFS and the loop cut; the loop starts at bar 9 of the take and ends at bar 29.

#### `title` (both games: the title screen, and the painted-scene demo where M toggles it)

Brief `title`, take 1; generated 2026-10-07 13:36 UTC (1,365 credits). The raw take is an MP3 at
128 kbps, 91.04 s, SHA-256 `1c04aa5d07419e7239aca51de22a02eb29a3d64280292a5caddbd6286d5d081c`. Its first 1.9 s were silence and were cut when it was
mastered. The prompt, as sent (`music_length_ms` 91000, `force_instrumental` true):

```
Sparse, melancholy solo piano piece at 58 BPM in A minor. A lone flute plays four soft notes, then the piano answers with a slow rising phrase that never finishes, over gentle broken chords and one low string drone. Intimate, nostalgic, like a story that is already over being told anyway. Quiet dynamics, much silence and natural room reverb, no drums, no vocals. No fade-out; it ends unresolved on a held note.
```

## What must appear in the game credits

Four entries, verbatim (the last two since music v2, 2026-09-30):

```
Salamander Grand Piano by Alexander Holm — CC-BY 3.0
Sonatina Symphonic Orchestra by Mattias Westlund — CC Sampling Plus 1.0
Drum kit: DRSKit 2.1 by the DrumGizmo team (Deva, Lars Muldjord) and Jes Eiler of DRSDrums, drumgizmo.org — CC-BY 4.0
Hall acoustics: "The Sound of the Violin's Home: A Higher-Order Room Impulse Response Dataset of the Arvedi Auditorium in Cremona", F. Miotello, G. Greco, P. Ostan, F. Del Gaudio, L. Comanducci, R. Malvermi, M. Pezzoli, F. Antonacci, Zenodo, doi:10.5281/zenodo.20098848 — CC-BY 4.0 (decoded to stereo, direct sound removed)
```

and, since the recorded SFX set (D-302), three CC BY 4.0 recordings and the impulse responses, verbatim:

```
Thunderclap by Richard Humphries (Wikimedia Commons) — CC BY 4.0
Bonfire ignition by Work With Sounds / Werstas (Wikimedia Commons) — CC BY 4.0
Glass breaking by Gravity Sound (Wikimedia Commons) — CC BY 4.0
Impulse responses: Voxengo (Aleksey Vaneev)
```

and, as a courtesy for the CC0 and public-domain sources of that set:

```
Sound effects built from recordings by Kenney, rubberduck, artisticdude, StarNinjas, schots,
the NPS & MSU Acoustic Atlas (Jennifer Jerrett), Jarrod Stanley and Membeth (CC0 / public domain),
and the Versilian Community Sample Library and VSCO 2 Community Edition (CC0)
```

and, as a courtesy rather than an obligation:

```
FluidR3 GM soundfont by Frank Wen — MIT
Impulse responses: Voxengo (Aleksey Vaneev)
Music restyled with ACE-Step 1.5 (ACE Studio and StepFun) — MIT
Also used, CC0: VSCO 2 Community Edition and VCSL (Versilian Studios); Black And Blue Basses, Shinyguitar and the Karoryfer x bigcat cello (Karoryfer Samples, bigcat instruments); jRhodes3d (Jeff Learman); Surge XT (Surge Synth Team)
```

> **Wired in (D-305, 2026-09-30).** The credits panel (pause → OPTIONS → ABOUT →
> CREDITS) prints every line above from `src/app/credits/creditsData.ts`, and
> `tests/unit/credits-attribution.test.ts` fails when a source this file marks as
> required (a CC BY or CC Sampling Plus licence cell, "**required**", "Attribution
> required: yes", or a line of a verbatim block) has no line there. **Adding a
> source here that owes a credit means adding it to `src/app/credits/audioSources.ts`
> and `creditsData.ts` too.** This is a licence condition, not a nicety.

**Owed, not wired (2026-10-07).** The ElevenLabs takes add a source that the credits panel does not list yet.
The licence as read asks for no credit, so no test fails, but `audioSources.ts` says it lists every outside
source a shipped audio file was made with, and the panel already prints the AI models used to restyle the
FFX-2 cues. The courtesy line proposed for Bailey to approve before it goes into the game, because the panel is
public text: `Music generated with ElevenLabs Music (ElevenLabs), from our own briefs`. Wiring it is one entry
in `audioSources.ts` (`id: 'elevenlabs'`, `feeds: ['music']`, `match: ['ElevenLabs']`, licence worded to
what the plan check above confirms) and one in the Music group of `creditsData.ts`. Not done in the branch that
installed the files.

The same two entries cover the sound effects as well as the music: since the
redesign, an effect's bells, glass, harp, choir, tam-tam, timpani and solo
strings are played by these libraries in `public/audio/sfx/sprite.mp3` exactly
as the music's are. No separate attribution is needed, and none of them is a
co-author of the designs.

---

## What the sound effects do NOT use

(This section describes the **first** sprite, `sprite.mp3`, and is still true of it. The second
sprite, `sprite-v2.mp3`, is built from recorded foley under Bailey's 2026-09-30 instruction; its
sources are listed above under "The recorded SFX set".)

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
