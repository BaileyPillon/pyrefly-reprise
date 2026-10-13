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

#### `title` (both games: the title screen, and the painted-scene demo where M toggles it)

Brief `title`, take 1; generated 2026-10-07 13:36 UTC (1,365 credits). The raw take is an MP3 at
128 kbps, 91.04 s, SHA-256 `1c04aa5d07419e7239aca51de22a02eb29a3d64280292a5caddbd6286d5d081c`. Its first 1.9 s were silence and were cut when it was
mastered. The prompt, as sent (`music_length_ms` 91000, `force_instrumental` true):

```
Sparse, melancholy solo piano piece at 58 BPM in A minor. A lone flute plays four soft notes, then the piano answers with a slow rising phrase that never finishes, over gentle broken chords and one low string drone. Intimate, nostalgic, like a story that is already over being told anyway. Quiet dynamics, much silence and natural room reverb, no drums, no vocals. No fade-out; it ends unresolved on a held note.
```

#### Two more takes (2026-10-10, FFX-2 only)

- **`boss-bahamut`** (Chapter IV's Bahamut fight): brief `BH-M4` ("Lament (piano)"), take 1, ElevenLabs Music v2.5, original; the driver's pick under Bailey's 2026-10-10 delegation ("Whatever you recommend for sound effects and music I'll go with those recommendations"). Raw take SHA-256 `fd10f1ba454fe7d1961949e4b71169237c4d5eb4019a6553b64ea61abd92abd1`; prompt and hashes in `docs/audio/music-elevenlabs-2026-10-10.json`.
- **`boss-leblanc`** (Chapter VI's Leblanc fight and the hidden Leblanc chapter): brief `LB-M5` ("Parade of the pleased"), take 1, ElevenLabs Music v2.5, original; the driver's pick under the same delegation. Raw take SHA-256 `b8e43a22c6651b9bc11a806b63f52965562f0d6d11537113de40fa808e9871ae`; plan and hashes in the same record.
- **Processing (2026-10-11, driver item 53e; PR-0425).** The shipped files of `boss-bahamut` and `boss-leblanc` are the takes as first installed with their side channel scaled down in mid/side so that they pass the stereo gate of `THEMES.md`, one gain back to -16 LUFS, and a LAME V4 re-encode; nothing else, and the loop points and length are the same to the sample. The figures and hashes, before and after: `docs/audio/music-stereo-53e-2026-10-11.json`.

#### Batch 1 (2026-10-10)

Bailey, 2026-10-10 about 22:10 EDT, on the driver's batch-1 music picks: "ill go with all your recommendations". Each take is ElevenLabs Music v2.5, take 1, original; the prompts name no composer, franchise, character or melody. Prompts, raw-take hashes and shipped-file hashes are also in `docs/audio/music-batch1-2026-10-10.json`.

Processing (2026-10-11, driver item 53e; PR-0425): the shipped file of every cue below except `boss-ff7-guard`, which already passed, has its side channel scaled down in mid/side so that it passes the stereo gate of `THEMES.md`, one gain back to -16 LUFS (and, for `boss-sin-countdown`, a 0.63 dB look-ahead limiter on 13 samples), and a LAME V4 re-encode; nothing else, and the loop points and length are the same to the sample. The raw-take hashes are the takes as generated; the shipped-file hashes before and after are in `docs/audio/music-stereo-53e-2026-10-11.json`.

- **`boss-ffx2-fallen-aeons`** (FFX-2): brief `XI-M1` ("Breathless ceremony"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `da3e96cfcf54716503eb8befd463ba98bc55f90f972b944c46332b52bba5d894`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Breathless, ceremonial, relentless cinematic orchestral battle music at 150 BPM in 4/4 in a minor key with a bright major lift in the chorus, a duel with a summoned god, wondrous and lavish. Driving brass and percussion lead: French horns and trumpets state a proud rising theme over taiko, timpani and snare while the strings race underneath in tireless eighth notes. In the middle section a solo harp plays a flowing, rising line over the racing strings, then a large wordless choir (open 'ah' and 'oh' vowels only, no words, no lyrics) joins at the peaks and the full orchestra lifts into the bright chorus. The piece never lets up and never rests. It opens with a short drum-and-brass call for about 6 seconds and falls back to the same driving texture at the end so it can repeat. Real acoustic orchestra, real harp, real percussion and real voices recorded in a large concert hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-trema`** (FFX-2): brief `XIII-M1` ("Stately march"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `46d1a1b020122470f70809853961c7e82fff3c9846cda165c1f2febcc6c262a2`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Solemn, institutional, quietly threatening cinematic orchestral music at 108 BPM in 4/4 in a minor key, a stately march with a cold edge, the music of a faction that has built itself from the ruins of a faith, written for a duel against an ancient priest who wants the past erased. A pipe organ and low strings carry a measured, formal marching figure with snare rolls and a low drum, brass chorales that sound sacred but cold, and a high, thin wordless choir (open vowels only, no words, no lyrics). It tightens bar by bar toward a restrained but heavy climax of full brass and timpani and then settles back to the opening march so it can repeat. Controlled, unemotional, relentless, commanding. Real pipe organ, real orchestra, snare and real voices recorded in a large stone hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-seymour-natus`** (FFX): brief `X-M1` ("Fallen nobleman"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `e1e9fec6539d2e7fe1caa7e3dd82c3d3b2529f21072628a75e2d91a4f0c76644`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Grand, heavy, relentless cinematic orchestral battle music at 132 BPM in 4/4 in a minor key, written for a colossal, tragic monster that was once a refined nobleman. Pounding low strings and timpani drive from the first bar, with huge low brass and a pipe organ low in the mix, and a descending, sorrowful string theme returns under the menace again and again. A large wordless choir (open vowels only, no words, no lyrics) swells in the climaxes. It builds in three waves, ends each wave on a held, tense chord, and never resolves; after the third wave it falls back to the pounding strings and timpani so it can repeat. Monstrous, tragic, enormous. Real acoustic orchestra, real pipe organ and real choir recorded in a vast hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-isaaru`** (FFX): brief `XIV-M1` ("Duel of the summoners"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `ef67442b2faaf7aa435a33ce99e1114e7df3bbb4465f646f19b0704aa802820c`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Breathless, lavish, ceremonial cinematic battle music at 160 BPM in 4/4, a duel between summoners and their summoned gods, wondrous and relentless. It opens with a slow sacred phrase on voices and strings for about 8 seconds, then a harp-led section plays a flowing, rising line over driving strings, and it finishes with a big brass-and-timpani statement in the final section before falling back to the sacred opening phrase so it can repeat. Brass and percussion lead, harp and strings race underneath, a wordless choir (open vowels only, no words, no lyrics) peaks at the climaxes, and it never lets up. Minor key with a bright major lift in the last section. Real acoustic orchestra, real harp and real voices recorded in a large concert hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-sin-assault`** (FFX): brief `XVII-M1` ("Aerial charge"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `2ac2939c7736023fa29e41e7d98eba8b6ac1bf3af1c9f2278b400dba47899f81`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Urgent, desperate, soaring cinematic orchestral battle music at 164 BPM in 4/4 in a minor key, an aerial attack on something the size of a mountain. A driving string ostinato in sixteenth notes, urgent French horn calls, pounding timpani and taiko; brass climbs over a sacred, hymn-like wordless choir (open vowels only, no words, no lyrics) that cuts in and out; flurries of harp and woodwinds like air rushing past. Heroic but desperate. Halfway through there is a held, tense pause of a few bars (low strings and a single tolling bell), then a charge back into the full orchestra. It opens with a horn call for about 6 seconds and returns to the driving string ostinato at the end so it can repeat. Real acoustic orchestra, real harp and real voices recorded in a large concert hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-sin-countdown`** (FFX): brief `XVIII-M1` ("Against the clock"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `f35fe7c5c2ad0924cfa2d70690be9adc2d7f432b89e5d7893af2fa2251ed4f9b`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Tense, ticking, final cinematic orchestral battle music at 140 BPM in 4/4 in a minor key, a fight against a clock. A relentless pulse on woodblock, pizzicato strings and low piano keeps time like a countdown from the very first bar; tension builds in the strings and brass over it; in the last third a sacred wordless choir (open vowels only, no words, no lyrics) enters, the pulse doubles in subdivision without changing tempo, and the full orchestra answers with hard timpani and brass. Desperate, grave, with no triumphant lift. It falls back to the bare ticking pulse at the end so it can repeat. Real acoustic orchestra, real woodblock, piano and real voices recorded in a large hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-ff7-guard`** (FF7): brief `FF7-M1` ("Night infiltration"). The raw take is an MP3 (mp3_48000_320), 96.03 s, SHA-256 `0a88b4fc57572203f05f48aab825893c122a0756e28f674e05284f2dc059cc17`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Tense, rhythmic, mechanical cinematic music at 144 BPM in 4/4 in a minor key, the feeling of a night infiltration of a factory. A steady pulsing low-string and bass figure like a machine, a tight snare and rim-click pattern, sustained brass chords that swell and cut off, a rising string line, and metallic percussion such as struck steel and anvil. Urgency without panic: a repeating figure that grows layer by layer from sparse to full, then drops back to the bare pulse so it can repeat. Real instruments and real percussion recorded in a large studio. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop, no vocals.
```

#### Batch 2 (2026-10-12)

Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please. this is extremely important."; 2026-10-12: "I'll go with all of your recommendations". Each take is ElevenLabs Music v2.5, original; the prompts name no composer, franchise, character or melody. Prompts, raw-take hashes and shipped-file hashes are also in `docs/audio/music-batch2-2026-10-12.json`.

Processing (the lane, 2026-10-12): the shipped file of every cue below is cut on whole bars at a real attack with an equal-power crossfade and a 3 s run-on (a one-shot: the cue, a raised-cosine fade and 2 s of silence), one gain to -16 LUFS, the side channel scaled down in mid/side just enough to pass the stereo gate of `THEMES.md` (the loop points do not move), and a LAME V4 encode; nothing else. The raw-take hashes are the takes as generated.

- **`victory-ffx`** (FFX): brief `VF-L2` ("Relief and brass, then a walking processional"). The raw take is an MP3 (mp3_48000_320), 48.03 s, take 1, SHA-256 `544b14e3d74e4e3460d670abc27d9fe563e740773526dedc9afb82063960af86`. The prompt, as sent (`music_length_ms` 48000, `force_instrumental` true):

```
A warm, sincere orchestral victory fanfare that settles into a gentle, loopable processional, at 108 BPM in 4/4 in a bright major key, relief more than triumph. For the first seven seconds: a short snare roll lifts into a section of French horns and trumpets playing a noble, open fanfare figure over timpani and a sweeping harp, and the orchestra lands on one clear, held major chord that rings out. Then, without a pause and without changing key or tempo, the music settles into a calm, steady, walking processional that lasts for the rest of the piece: pizzicato basses and soft snare brushes keep an easy stride, a solo trumpet and a solo horn trade a simple, dignified, hopeful tune, warm strings and a harp answer, and a soft timpani marks the downbeats. It never builds to a climax and never ends: it keeps the same easy stride so that it can repeat. Sincere and grateful, a little weary, never boastful. Real acoustic orchestra and real percussion recorded in a warm hall. No vocals. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`victory-ffx2`** (FFX-2): brief `VX-L1` ("Brass swagger, then a bouncing groove"). The raw take is an MP3 (mp3_48000_320), 48.03 s, take 1, SHA-256 `9a6082b2230010879e648d4ab78528ea4abbf729bc32aaa99a35d094357369df`. The prompt, as sent (`music_length_ms` 48000, `force_instrumental` true):

```
A short, bright, cheeky victory fanfare that settles into a light, bouncy, loopable groove, at 120 BPM in 4/4 in a bright major key. For the first seven seconds: a snare roll builds, live trumpets and trombones play a swaggering fanfare figure, a piano flourish runs up, a glockenspiel sparkles, and the band lands on one clean, happy major chord. Then, without a pause and without changing key or tempo, it settles straight into a light, bouncing, medium-swing groove that lasts for the rest of the piece: an upright bass walks, a drummer plays brushes and a light ride cymbal, a piano comps bright chords, a muted trumpet and a flute trade a catchy, playful, singing figure, and pizzicato strings and a vibraphone add sparkle. It never builds to a climax and never ends: it keeps the same groove so that it can repeat. Breezy, optimistic and a little cheeky, the feeling of counting the loot after a successful caper. Real recorded instruments in a room full of players. No vocals. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`defeat-ffx`** (FFX): brief `DF-A` ("The stillness after a fall"). The raw take is an MP3 (mp3_48000_320), 10.03 s, take 2, SHA-256 `0879a0bd507ae177d2155bb66919f7b5755751e782e511212bd1e37894482ba6`. The prompt, as sent (`music_length_ms` 10000, `force_instrumental` false):

```
A short, sombre, slow orchestral cue of defeat lasting about eight seconds, at about 52 BPM in a minor key. Hushed low strings sink slowly, a solitary French horn plays one falling line, a deep bell tolls once, and a small wordless choir (open vowels only, no words, no lyrics) breathes a single dark chord that fades away into a long, natural silence. Grave, resigned, quiet sorrow: the stillness after a fall. Never loud, no drums, no climax, no resolution. Real acoustic instruments in a large stone hall with a long natural reverb tail. It does not loop and does not repeat: it simply decays to silence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop. Let the cue last a full nine seconds, with a slow, long, natural decay, so that the last notes are still faintly audible near the end.
```

- **`defeat-ffx2`** (FFX-2): brief `DX-A` ("A rueful sigh"). The raw take is an MP3 (mp3_48000_320), 8.04 s, take 1, SHA-256 `ad7cace524f9b16d38e9a8029709f4f9bfbe21bad80eef09844d13560b585722`. The prompt, as sent (`music_length_ms` 8000, `force_instrumental` true):

```
A short, soft, wistful cue of defeat lasting about eight seconds, at about 60 BPM in a minor key: a solo piano plays a slow, sighing, falling phrase, a solo cello and a warm string section sink gently beneath it, a flute breathes one drooping note, and a harp glissando slides down and fades into silence. Sad but gentle and a little rueful, like a sigh after a plan has gone wrong, not tragic. Never loud, no drums, no climax. Real acoustic instruments in a warm hall with a natural reverb tail. It does not loop: it decays to silence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`victory-bahamut`** (FFX-2): brief `VB-A` ("Piano resolve"). The raw take is an MP3 (mp3_48000_320), 40.03 s, take 1, SHA-256 `ae685dd5f8c9242b58ec3d59d3c70889c712761141681b7c20ced62afc3b9a7b`. The prompt, as sent (`music_length_ms` 40000, `force_instrumental` true):

```
A quiet, bittersweet cue of resolve after a sorrowful victory, at 76 BPM in 4/4 in a minor key that opens toward the major. For the first eight seconds: a solo grand piano plays a slow, aching, rising phrase that opens out into a warm chord, a warm string section swells softly under it, and a solo cello answers; there is no brass fanfare, no timpani roll and no triumph, only acceptance and tenderness, as if someone has set down a heavy burden. Then, without a pause and without changing key or tempo, the music settles into a quiet, steady, loopable passage that lasts for the rest of the piece: the piano plays soft, broken chords, strings hold long, warm chords, a solo cello sings a simple, consoling line, and a muted timpani marks a very quiet heartbeat every other bar. It never builds to a climax and never ends: it stays in the same hushed texture so that it can repeat. Bittersweet, tender and dignified, never loud, never triumphant. Real acoustic instruments recorded in a warm hall. No vocals. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-challenge`** (FFX): brief `CH-A` ("Cold machine pressure"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `c722b7b34c3c8249f405293cb379b0be18415eedfcfd8c78305d188507fe4d61`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Cold, relentless, oppressive cinematic battle music at 158 BPM in 4/4 in a minor key over a single low pedal, written for an enemy that is not trying to be understood. A hard, clipped, repeating low-string and bassoon ostinato with syncopated off-beat accents that keep the pulse from settling, dry hammered anvils and struck metal plates, a taiko-like low drum, and short angular stabs on low brass; cold, sustained choir-like voices (open vowels only, no words, no lyrics) float high above and never form a chord. No tune, only a short mechanical figure that repeats and grows. It starts at full pressure at once after a short four-bar intro, holds one high level, adds a new layer every half minute without changing key, and never resolves or builds to a triumphant release; it falls back to the bare ostinato at the end so it can repeat. Inhuman, unsympathetic, tense. Real acoustic orchestra and real percussion. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-jecht`** (FFX): brief `JE-A` ("Raw and defiant"). The raw take is an MP3 (mp3_48000_320), 96.07 s, take 1, SHA-256 `478808de2767ef27340cb91381f8996f4ac30ee1bcce75b8023be2558fae09e3`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Heavy, raw, defiant instrumental rock-metal battle music at 140 BPM in 4/4 in a minor key. Thick downtuned distorted electric guitars play a blunt, repeating low riff, a live drummer plays double-kick bursts and a hard snare, a growling bass guitar doubles the riff, and a short, aching string line sits underneath and surfaces in the quieter bars. Loud and personal rather than epic, angry and grieving at once, with a half-time breakdown in the middle before the riff returns. It opens with a four-bar riff intro and falls back to the main riff at the end so it can repeat. No vocals. Real recorded instruments in a live room. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no pop.
```

- **`boss-yu-yevon`** (FFX): brief `YY-A` ("Processional finale"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `0f24584279cf2b835337e4a005dec02c0cee91f1c178a6ca588e9f54910f7f51`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Vast, solemn, inevitable cinematic orchestral music at 96 BPM in 4/4 in a minor key, processional rather than frantic, the music of a final confrontation that cannot be won by force. A large mixed choir sings open vowels (no words, no lyrics) over deep sustained strings and low brass chorales, slow timpani sound on every other beat, and bells toll. It rises in long slow waves to one huge choral climax and recedes without resolving, so that it can repeat. Majestic, sorrowful, final. Real orchestra, real bells and a real choir recorded in a vast stone hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-vegnagun`** (FFX-2): brief `VG-A` ("A machine the size of a building"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `44cc7c7e68d4d3556018fcabd6ac0848235ac9b92704253dcb8d74737c6229c3`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Urgent, colossal, relentless cinematic battle music at 164 BPM in 4/4 in a minor key, the sound of a machine the size of a building waking up. A pounding low-string and bassoon ostinato in constant note lengths, thunderous taiko and timpani on every beat, snarling low brass, heavy hammered anvils and steel, and a large choir shouting short open vowels in unison like a siren (no words, no lyrics). Energy climbs in three escalating waves with no relief, the last with a rapid tightening pulse like a countdown. It opens with the ostinato alone for about 4 seconds and falls back to it so it can repeat. Menacing and awe-struck, heavy rather than heroic. Real acoustic orchestra and real percussion. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-shuyin`** (FFX-2): brief `SH-A` ("Grief with a pulse"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `b3bf22c1a3b918a57e5f17b34e7978a170b16a04a5f351f5daa3a92bc4161efe`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Slow, grieving, dirge-like cinematic orchestral music at 68 BPM in a minor key, with a steady low pulse underneath, for a last duel against a man who only wants to disappear. A solo piano and a string orchestra carry a long, aching, bittersweet line that is quietly distorted in places, as if a love song were being played at a funeral; a muted timpani heartbeat, low harp notes, and a distant solo female voice singing open vowels with no words. It rises slowly, never loud for long, and returns to near-silence so it can repeat. Tragic, tender, resigned, not heroic. Real acoustic instruments and a real voice. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-seymour-macalania`** (FFX): brief `SA-A` ("Polite and wrong"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `12b12df5907628e535e7ca9217c672c9ec74bb9392e063240bbdd5e0595201be`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Courteous, ceremonial, quietly menacing cinematic orchestral music at 126 BPM in 4/4 in a minor key, polite and slightly wrong. A string orchestra and a solo oboe state a graceful, formal theme over a harpsichord and pizzicato basses, low brass chorales, and a struck bell that rings like a temple; the cadences sound religious but resolve somewhere slightly off. It enters composed and confident, rises once to a full orchestra swell with a tolling bell, and returns to composure so it can repeat. No triumphant release. Real acoustic instruments, real harpsichord and bell, no choir. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-evrae`** (FFX): brief `EV-A` ("A ship at speed"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `0ef0a9e907a6e7861ffb9125ab4cf7b90e7478ec29b5169adfd3568b8df6dff3`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Propulsive, airborne, mechanical cinematic battle music at 144 BPM in 4/4 in a minor key, forward motion rather than aggression, the feeling of a great ship under attack. Driving eighth notes in the low strings and bass, engine-room percussion (taiko, snare and struck metal pipes), metallic pulses, a low sustained drone that reads as altitude, open fourths and fifths with air in the middle of the mix, and a short, two-bar horn-and-string figure that repeats. It opens with the engine pulse alone for about 4 seconds and falls back to it so it can repeat. No choir, no organ. Steady, urgent and wide, never sacred. Real acoustic orchestra and percussion. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-yojimbo`** (FFX): brief `YO-A` ("A duel in a held breath"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `5f6791db44a0116bc060f8f47f26a64288445e4708e49dbc8918eaa14ee3af71`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Wistful, dignified, melancholy cinematic music at 72 BPM in 4/4 in a minor key, restrained and lyrical, a character theme played during a duel rather than a boss theme. A solo cello and a solo violin carry a long, singing, aching line over felt piano and a soft string bed; a quiet pulse of pizzicato basses, no drums for the first half, then a muted frame drum and low strings join without ever becoming loud. Grief held under tight control, with one brief crack of feeling in the middle before composure returns, and it settles back to the felt piano so it can repeat. Real acoustic instruments in a warm hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-seymour-omnis`** (FFX): brief `OM-A` ("The long reckoning"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `ee103bff7704a93b311d44218a287428d00f85df9cfad313ae5bdd3b6978eca7`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Climactic, grandiose, relentless cinematic orchestral battle music at 156 BPM in 4/4 in a minor key, a long final reckoning with a villain who is past all courtesy. A pipe organ and a full string orchestra play a driving, rhythmic theme with heavy low brass, pounding timpani, and a hard live drum kit under the orchestra; the theme returns in bigger and bigger forms through four distinct sections, and a large wordless choir (open vowels only, no words, no lyrics) enters in the final third. Dark, menacing, magnificent, with a short held pause before the last section. It falls back to the organ-and-strings figure at the end so it can repeat. Real organ, orchestra, drums and choir. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-den-of-woe`** (FFX-2): brief `DW-A` ("Old comrades in the dark"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `4db9136257ab09f4b9fc84de560342f778a5e14c3dbe365e2b84b009f1596f48`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Haunted, despairing, bitter cinematic orchestral music at 104 BPM in 4/4 in a minor key, a battle in a dark hall against old comrades turned enemies. A solo piano and a string orchestra play a tense, restless pattern over a slow low pulse of cellos and basses, with dissonant held chords in the violas and muted brass, a distant tolling bell, and a thin wordless voice (open vowels only, no words, no lyrics) that appears briefly. It builds to a bitter, aching climax and falls back to the piano so it can repeat. Grief with an edge. Real acoustic instruments and a real voice. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-gui`** (FFX): brief `G1-A` ("A camp under threat"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `71a2049126fbc882309e2fe4ff378c74eba68338dbe5d688f5f7e3dc658bc9c9`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Tense, driving, urgent cinematic orchestral battle music at 144 BPM in 4/4 in a minor key, a camp under threat from something huge. Pulsing low strings and timpani, tremolo strings in the middle register, sharp brass stabs, a restless snare pattern, and a short repeating rising figure in the violins; the tension never releases and the music rises in two big waves. It opens with the pulsing low strings alone for about 4 seconds and falls back to them so it can repeat. Dread and urgency, not triumph. Real acoustic orchestra. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`boss-experiment`** (FFX-2): brief `EX-A` ("Strange machine"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `c29a37f3732da8cf15aa56f7f75a4279258fde93ef14f65d5f9569a6455a0915`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` true):

```
Energetic, tense, slightly mechanical cinematic battle music at 152 BPM in 4/4 in a minor key, a fight against a strange experimental machine. Driving low strings and a live drum kit, punchy brass stabs, a bright, fast piano figure, metallic percussion, and a bridge that thins to bass and pulse before the full band crashes back. Playful menace in the first half; in the second half the rhythm stutters and slips as the machine goes out of control, and it settles back to the driving strings and kit so it can repeat. Real recorded instruments. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-chateau-leblanc`** (FFX-2): brief `CB-1` ("Swagger with a wink"). The raw take is an MP3 (mp3_48000_320), 90 s, take 1, SHA-256 `30d6114e91e81e8f8c9b10f6946bc2f71bdb404d74c8b153cfcca47690ea35b3`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` true):

```
Swaggering, cheeky, comic big-band music at 108 BPM in a major key with a medium swing feel, the theme of a pompous villainess strutting through her own mansion. A live big band: trumpets and trombones play punchy, syncopated horn stabs and a strutting unison line, saxophones answer in smooth thirds, a clarinet adds a comic squeal, a walking upright bass, a piano comping, and a drummer playing brushes that turn to sticks on the stabs. The horn section keeps playing one extra bar before the band catches up, and there are two or three cheeky stop-time breaks where everyone halts for a beat and starts again. Playful, self-important and a little ridiculous, never sinister. It opens with a four-bar drum-and-bass strut and falls back to it so it can repeat. Real recorded instruments, a room full of players. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-bevelle-underground`** (FFX-2): brief `BU-2` ("The gears engage"). The raw take is an MP3 (mp3_48000_320), 96.03 s, take 1, SHA-256 `f161a2f676169f56825ec415a0746b77170b4f38c5ba6888e0b826687f8e855e`. The prompt, as sent (`music_length_ms` 96000, `force_instrumental` false):

```
Tense, mechanical, ritual music at 108 BPM in 4/4 in a minor key, a machine room hidden under a cathedral that wakes when it is disturbed, so that it can sit under a quiet scene and also carry a fight. A steady ticking pulse of woodblock, muted pizzicato basses and a low piano note keeps time like a mechanism; a pipe organ plays a heavy, repeating ostinato; low brass sound sacred but cold; in the middle of the piece snare and timpani hit squarely on the beat like gears meshing, low strings drive in tight eighth notes, and bowed metal plates and struck anvils ring out; thin high voices (open vowels only, no words, no lyrics) appear briefly at the peak. It tightens in two waves to a restrained but massive climax and settles back to the organ and the ticking pulse so that it can repeat. Controlled, cold and relentless, never heroic. Real organ, orchestra, percussion and voices recorded in a large stone space. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-gagazet`** (FFX): brief `GA-1` ("The mountain does not care"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `317843268ba549cec218dfc8ca186e86bcd679fccbe2a615071b282c8ec40c1e`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` true):

```
Cold, vast, indifferent music at 72 BPM in a minor key, a high mountain trail in wind and snow. A solo French horn plays slow, sparse, open phrases over a deep sustained cello drone and bowed low strings, a distant alto flute answers, a few bell-like chimes and a triangle ring in the thin air, and the pulse is only a barely audible low drum every other bar. Nothing rushes and nothing consoles; the mountain does not care. It opens with the drone alone for about 8 seconds and returns to it so it can repeat. Real acoustic horn, cello, flute and percussion recorded in a very large, cold hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-zanarkand-dome`** (FFX): brief `ZD-1` ("Warmth remembered"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `291e9784e7a9d9ba1e99329d9ad5fdd0464e78355376eaf6e11b4cb40994302d`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` true):

```
Warm, remembered, bittersweet nocturne at 48 BPM in a minor key, slow and spacious. A solo piano plays gentle, singing phrases with a great deal of silence between them, a warm string orchestra holds long soft chords underneath, a solo cello answers the piano in the gaps, and single harp notes fall like drops. No percussion at all. It feels like a warm room that someone has just left: gentle, kind and very sad, the warmth of a memory, which is worse than cold. It opens with the solo piano alone for about 8 seconds and returns to it so it can repeat. Real acoustic piano, strings, cello and harp recorded in a warm hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-dreams-end`** (FFX): brief `DE-1` ("Unmoored"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `26d2c3bbb868c917151f53d8a6933a7caf5c2d537c37d70dc75c588e1b995cb0`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` false):

```
Unmoored, dreamlike, weightless music at 76 BPM with no clear home key, a place made of memory. A celesta and a vibraphone play bent, wandering figures, soft strings move in parallel chords that slide without ever settling, bowed glasses hum, a harp plays harmonics, and a distant wordless female voice (open vowels only, no words, no lyrics) floats in and out. The pulse is only suggested by a very soft, slow, muted low drum. Gently wrong and slightly sad, with nothing to hold on to. It opens with the bowed glasses alone for about 8 seconds and returns to them so it can repeat. Real acoustic instruments and a real voice recorded in a very large, resonant hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-macalania-temple`** (FFX): brief `MT-1` ("Ice pretending to be masonry"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `6862aeebf335d6add26f10976a0a2be905e8a9035b6379f50fff0e32fbe813f8`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` true):

```
Cold, still, glittering music at 56 BPM in a minor key, a temple of ice. Glockenspiel and crotales drip single notes like water falling from icicles, an alto flute plays slow, sparse phrases, strings hold very soft stacked open fourths and fifths, a harp plays harmonics, and a bowed vibraphone shimmers under a low sustained drone. Beautiful, silent and uneasy, ice pretending to be masonry. No percussion beat at all, only the slow drip. It opens with the drips and the drone alone for about 8 seconds and returns to them so it can repeat. Real acoustic instruments recorded in a large, cold stone hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-fahrenheit`** (FFX): brief `FH-1` ("No time and no way back"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `ef1bd54e853e28a1e177f93c137fefcb5ec0e3cea35af773113e691f5d9d0889`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` true):

```
Urgent, contained, restless music at 104 BPM in 4/4 in a minor key, a ship in flight with no way back. Tremolo violins hold a nervous shimmer, a piano plays steady open fifths, a deep taiko plays a slow heartbeat, a low sustained drone like distant engines, and a solo horn calls once in a while across the open air. Wide and spare, anxious but controlled, with no time to stop and nowhere to go. It opens with the drone and the heartbeat for about 6 seconds and returns to them so it can repeat. Real acoustic orchestra, piano and taiko. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`scene-farplane`** (FFX-2): brief `FP-1` ("Rest without forgetting"). The raw take is an MP3 (mp3_48000_320), 90.03 s, take 1, SHA-256 `8491594d9b0bcfb139d301a4a8e5d66b7aa4c5f1cc7e5e719d43bc9073c18d50`. The prompt, as sent (`music_length_ms` 90000, `force_instrumental` false):

```
Peaceful, distant, wistful music at 92 BPM in a major key built on open stacked fourths and fifths, a place where the departed rest in warm light. A soft piano plays slow, gentle arpeggios, a string orchestra holds long, warm, quiet chords, a harp adds slow ripples, and a far-off wordless soprano (open vowels only, no words, no lyrics) sings long phrases from a great distance. Restful but not forgetful: a faint ache under the calm. No percussion. It opens with the piano alone for about 6 seconds and returns to it so it can repeat. Real acoustic instruments and a real voice recorded in a large, soft hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`ending-ffx`** (FFX): brief `EN-FFX` ("Permission to stop"). The raw take is an MP3 (mp3_48000_320), 100.03 s, take 1, SHA-256 `7fa352b24ef9618e32ba6af77be1c8f91edb0deedea059f232a54d22d942ba16`. The prompt, as sent (`music_length_ms` 100000, `force_instrumental` true):

```
A slow, hopeful farewell at 58 BPM. It begins in a minor key with a solo piano playing a simple, patient, singing line; warm strings, a solo cello, a French horn and a flute join one by one, and the orchestra rises slowly around the piano until at the end the harmony turns to the major key like a door opening. No drums until a soft timpani roll under the climax. Hopeful grief, tender and grateful, the feeling of being allowed to stop at last. It falls back to the opening solo piano so it can repeat. Real acoustic piano and orchestra recorded in a warm hall. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no electric guitar, no pop.
```

- **`ending-ffx2`** (FFX-2): brief `EN-FFX2` ("A gentler goodbye"). The raw take is an MP3 (mp3_48000_320), 100.03 s, take 1, SHA-256 `114376b2ae12e8d9883ad7dca335a2fa26af7aa2007c3c884f89338592627a07`. The prompt, as sent (`music_length_ms` 100000, `force_instrumental` false):

```
A warm, gentle, bittersweet goodbye at 84 BPM in 4/4 in a major key. A piano and a fingerpicked acoustic guitar carry a flowing, singing accompaniment, a string section swells softly, a drummer plays brushes, an upright bass walks underneath, a flute plays a tender countermelody, and a lone wordless female voice hums (no words, no lyrics). It begins quietly, grows to a full band, and in the last section the whole harmony lifts up a whole step for a bright, hopeful finish before it settles back to the piano and guitar so it can repeat. Kind, wistful and unhurried. Real recorded instruments in a warm room. Steady tempo, no tempo changes, no fade-out, no final cadence. Not chiptune, not SNES, not arcade, no synthesizers, no electronic drums, no pop.
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
