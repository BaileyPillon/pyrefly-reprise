# Music briefs for ElevenLabs Music

Groundwork (plan: [`elevenlabs-plan.md`](elevenlabs-plan.md)). Bailey, 2026-10-07: "For music voice overs use Eleven Labs please. We need this really bad." This file is
the written brief for every moment of music in every chapter, ready to send to a text-to-music model once Bailey connects the service. **Nothing here has been heard or
generated** (rule 13); every take is a candidate until Bailey picks it by ear from the audition page.

## The two hard limits

1. **Original music only.** A prompt gives **mood, tempo, key or mode, instrumentation, structure and energy**. It never names a composer, a publisher, a
   franchise, a character, a place, a track or a melody, and never asks the model to reproduce or imitate one (the service rejects such prompts anyway: a
   `bad_prompt` error with a suggestion). `tools/audio/elevenlabs.mjs` refuses a brief whose prompt contains a franchise, character or place name.
2. **The score's identity stays ours.** `docs/audio/THEMES.md` fixes six original themes and the resemblance guards (no chanted choir text, no repeated-note chug, no
   shouted vocal, and so on). A text prompt cannot carry a melody, so a take can match a cue's **mood, form and sound** but not its **notes**. Two ways to keep the
   notes ours are open (the plan explains each and the pilot tests them): a **composition plan** that copies our cue's section structure and durations, and, if the
   service's reference-audio route is available through the API, **our own route S render as the reference** (our melody, their sound; unconfirmed, see the plan).

## How a take becomes a cue

The service returns one linear track with a natural ending. The game needs an intro plus a loop body (`docs/audio/PIPELINE.md`, "Loops"). So every brief asks for a
**steady tempo, no fade-out, no final cadence**, and the loop is made in our ship chain, not by the model:

1. Generate (`node tools/audio/elevenlabs.mjs music --brief <id> --takes 3 --yes --max-credits N`), candidates land outside the repo.
2. Screen without ears: tempo within 3 percent of the brief (autocorrelation, as `tools/audio/modern/render-b-score.mjs` did), no clipping, no silence, real stereo
   (L/R correlation and side/mid inside the THEMES gate), no words in a wordless cue (a listening check Bailey or the audition page makes, since agents cannot hear).
3. Bailey picks by ear (the audition page); only a pick goes on.
4. Choose bar-aligned loop points near the brief's `loop` targets, crossfade the seam (the 18 ms rule, last in the chain), master to -16 LUFS and at most -1 dBTP, encode at
   LAME V0, write the manifest entry with six-decimal loop points, run `node tools/audio/qa.mjs --strict`.
5. Budget: music plus the SFX sprites sit at 88.5 MB of the 90 MB cap (`AUDIO_BUDGET_BYTES`, D-306). A replacement cue swaps bytes for bytes; a new cue needs a decision.
6. Credit line: the game's credits gain an AI-music disclosure line, and the service's content-credential option (`sign_with_c2pa`) is worth turning on for shipped files.

## Where music plays, chapter by chapter

Cue records are `src/data/chapter-*.ts` (`music`), play order from the scripts. "Own" and "stand-in" are from `THEMES.md` ("The chapter cue map"); a stand-in is an
existing cue borrowed from another chapter (D-209: a stand-in never counts as finished), and the **owed** column lists the cue each chapter still lacks, which is
where new music matters most. Title, chapter select and pause are shared by both games and are listed once, below the table.

| Ch | Game | Scene (before the fight) | Battle | Phase change | Victory | Music moments inside the scenes | Owed (brief ids) |
|---|---|---|---|---|---|---|---|
| 1 `seymour-flux` | FFX | `scene-gagazet` (cut to silence at the first line, back in as the reveal starts) | `boss-seymour` | none | `victory-ffx` | silence for the grieving; the aftermath has no cue; the dream reveal sits on a fayth hum | none |
| 2 `yunalesca` | FFX | `scene-zanarkand-dome` | `boss-yunalesca` | none | `victory-ffx` | the memory scene plays in the dome's own cue; silence in the aftermath | none |
| 3 `braskas-final-aeon` | FFX | `scene-dreams-end` | `boss-jecht` | `boss-yu-yevon` from the first possessed aeon (the chant sound opens the gauntlet) | `victory-ffx`, then `ending-ffx` after the results | silence for Jecht's goodbye (a mid beat on his knock-out); the chant before the gauntlet | none |
| 4 `ffx2-bahamut` | FFX-2 | `scene-bevelle-underground` | `boss-ffx2-aeon` | none | **none: the results are silent** | silence after the kill | none |
| 5 `ffx2-vegnagun-shuyin` | FFX-2 | `scene-farplane` | `boss-vegnagun` (four limbs) | `boss-shuyin` when Shuyin steps out (cut to silence first) | `victory-ffx2`, then `ending-ffx2` after the results | the Farplane voices, the song as staging, a whistle in the glen | none |
| 6 `ffx2-leblanc` (also the hidden `exp-leblanc`) | FFX-2 | `scene-bevelle-underground` (stand-in) | `boss-ffx2-aeon` (stand-in) | none (two between-act beats) | `victory-ffx2`; `scene-farplane` under the reveal | the farce, then the reveal that stops it | `owed-scene-chateau-leblanc`, `owed-boss-leblanc`, `owed-scene-disquiet` |
| 7 `seymour-anima-macalania` | FFX | `scene-macalania-temple` | `boss-seymour-macalania` | none (Anima is a mid beat) | `victory-ffx` | silence for the sending that is stopped | none |
| 8 `evrae-airship` | FFX | `scene-fahrenheit` | `boss-evrae` | none | `victory-ffx` | silence on the kill; the airship leaves | none |
| 9 `yojimbo-cavern` | FFX | `scene-gagazet` (stand-in) | `boss-yojimbo` (starts inside the scene when she appears) | none | `victory-ffx` | silence for Lulu's grief | no decision names an IX scene cue: open |
| 10 `seymour-natus` | FFX | `scene-gagazet` (stand-in: the record's scene cue plays under the opening narration) | `boss-seymour-macalania` (stand-in; starts when Seymour comes through the gate) | none | `victory-ffx` | the story is told in narration | `owed-boss-natus` |
| 11 `ffx2-fallen-aeons` | FFX-2 | `scene-farplane` | `boss-ffx2-aeon` (one cue for every aeon fight, by choice) | none (three links) | `victory-ffx2` | the field bed under the banter | `owed-boss-fallen-aeons` |
| 12 `seymour-omnis` | FFX | `scene-dreams-end` (stand-in) | `boss-seymour` (stand-in) | none | `victory-ffx` | silence for the sending | `owed-boss-omnis` |
| 13 `ffx2-trema` | FFX-2 | `scene-bevelle-underground` (also Paragon's link) | `boss-ffx2-aeon` as Trema's phase | the seam between Paragon and Trema | `victory-ffx2` | a dungeon floor, then a man | `owed-boss-trema` |
| 14 `isaaru-via-purifico` | FFX | `scene-gagazet` (stand-in) | `boss-yojimbo` (stand-in) | none (three aeons in turn) | `victory-ffx` | silence on the stairs | `owed-boss-isaaru` |
| 15 `ffx2-den-of-woe` | FFX-2 | `scene-bevelle-underground` (stand-in) | `boss-shuyin` (stand-in) | none (three shades back to back) | `victory-ffx2` | pyreflies remembering someone else | `owed-boss-den-of-woe` |
| 16 `ffx2-ixion-djose` | FFX-2 | `scene-bevelle-underground` (stand-in); the Abyss plays `scene-farplane`, the wake `scene-bevelle-underground` | `boss-ffx2-aeon` (by choice) | none | `victory-ffx2` | the fall, the Songstress dress, four whistles | `owed-scene-djose`, `owed-scene-abyss` |
| 17 `sin-fins-core` | FFX | `scene-fahrenheit` (stand-in) | `boss-evrae` (stand-in) | a fin torn away between links | `victory-ffx` | a whole country singing; no cue yet | `owed-sin-assault` |
| 18 `sin-face` | FFX | `scene-fahrenheit` (stand-in) | `boss-evrae` (stand-in) | none | `victory-ffx` | the mouth opens; the dive in silence | `owed-sin-countdown` |

Shared by both games: `title` (the first thing heard), `chapter-select` (the board), `pause` (the held breath). `battle-ffx` and `boss-dread` are registered general-purpose cues that
no chapter's record names today; they have no brief here.

## The cues: mood, tempo, instrumentation, length and loop

All figures except mood are read from `src/audio/tracks` (bpm, meter, loop and length in seconds are `beats x 60 / bpm`) and `THEMES.md` (key, the one emotion). "Loop" is
the current cue's loop body: a replacement should land bar-aligned within a second or two of it, or the manifest simply carries the new points.

| Brief id | Game | Mood: the one emotion | Key, bpm, meter | Instrumentation | Length, loop (s) |
|---|---|---|---|---|---|
| `title` | both | A story that is already over, told anyway | A minor, 58, 4/4 | solo piano, a flute cameo, low string drone | 91.0, 8.3 to 91.0 |
| `chapter-select` | both | Unhurried choosing; nothing here can hurt you yet | B minor, 84, 3/4 | flute, harp, celesta, string quartet | 72.9, 4.3 to 72.9 |
| `pause` | both | The game holding its breath | E Aeolian, 46, 4/4 | one wordless voice over a tenor drone | 47.0, 5.2 to 47.0 |
| `scene-gagazet` | FFX | The mountain does not care | B minor, 72, 4/4 | one horn, one cello, a drone, wind | 103.3, 40.0 to 103.3 |
| `boss-seymour` | FFX | Contempt that has convinced itself it is mercy | C# minor, 132, 4/4 | pedal organ, double basses, strings, brass, timpani | 98.2, 7.3 to 98.2 |
| `scene-zanarkand-dome` | FFX | Warmth remembered, which is worse than cold | B minor, 48, 4/4 | solo piano, celesta, a distant wordless soprano, then strings | 130.0, 10.0 to 130.0 |
| `boss-yunalesca` | FFX | A rite that will finish with or without you | F Phrygian, 132, 6/8 | harp, wordless choir canon, brass | 100.9, 10.9 to 100.9 |
| `scene-dreams-end` | FFX | Unmoored | no tonic, 76, 4/4 | celesta music box, planing pads | 101.1, 12.6 to 101.1 |
| `boss-jecht` | FFX | Two people talking over each other, and both are right | D minor, 144, 4/4 | drop-D guitars, bass, kit, strings, brass | 106.7, 6.7 to 106.7 |
| `boss-yu-yevon` | FFX | No end | E Aeolian, 40, 4/4 | wordless choir over one drone | 210.0, 6.0 to 210.0 |
| `victory-ffx` | FFX | Relief, not triumph | C major, 120, 4/4 | brass fanfare, then pluck, piano, strings, flute | 72.0, 8.0 to 72.0 |
| `ending-ffx` | FFX | Permission to stop | B minor to B major, 58, 4/4 | solo piano, then strings and wordless choir | 115.9, 33.1 to 115.9 |
| `scene-macalania-temple` | FFX | Ice pretending to be masonry, and something behind the door | F# minor, 56, 4/4 | high quartal strings, glockenspiel, alto flute, harp | 60.0, 12.9 to 60.0 |
| `boss-seymour-macalania` | FFX | Polite, and wrong | C# minor, 126, 4/4 | harpsichord, pizzicato, oboe, violins, cellos, low brass | 121.9, 7.6 to 121.9 |
| `scene-fahrenheit` | FFX | No time, and no way back | D minor, 104, 4/4 | wind, piano, violins, flute | 73.8, 9.2 to 73.8 |
| `boss-evrae` | FFX | The ship is the weapon; keep your distance | A minor, 144, 4/4 | taiko, strings, horns, piano, distant flute | 80.0, 6.7 to 80.0 |
| `boss-yojimbo` | FFX | Grief under control, and it cracks once | C Aeolian, 132, 4/4 | solo cello, felt piano, violin, horns, timpani | 87.3, 14.5 to 87.3 |
| `scene-bevelle-underground` | FFX-2 | The machine under the cathedral | G minor, 100, 4/4 | synth bass, pluck arpeggio, 808, low clarinet | 105.6, 19.2 to 105.6 |
| `boss-ffx2-aeon` | FFX-2 | A pop star fighting a god, and enjoying it | Bb minor to Db major, 160, 4/4 | supersaw stabs, synth bass, breakbeats | 114.0, 12.0 to 114.0 |
| `scene-farplane` | FFX-2 | Rest without forgetting | E major, 92, 4/4 | pad, harp, flute, electric piano, soft 808, celesta | 104.3, 20.9 to 104.3 |
| `boss-vegnagun` | FFX-2 | Something enormous, and nobody is driving | F minor, 168, 4/4 | organ, low brass, metal, hats, alarm tones | 91.4, 11.4 to 91.4 |
| `boss-shuyin` | FFX-2 | Grief that has curdled | C# minor, 154, 4/4 | piano, band, electric piano, strings | 99.7, 12.5 to 99.7 |
| `victory-ffx2` | FFX-2 | That was fun | Eb major, 128, 4/4 | synth-brass fanfare, 808 groove, flute | 67.5, 7.5 to 67.5 |
| `ending-ffx2` | FFX-2 | The second goodbye is gentler, because it can be | Bb major to C, 84, 4/4 | electric piano, flute, strings, supersaw pad, soft drums | 114.3, 11.4 to 114.3 |

The owed cues have no current length: their targets are below, from the research and the sketches already on `audition.html`.

## The pilot (the first thing Bailey hears)

Three sketches of one boss theme, then (optionally) three of an FFX-2 one, each with today's shipped cue beside them as the control. They are three **different ideas**, not
three rolls of one: an orchestral reading, a hybrid-band reading, and our own structure rebuilt as a composition plan.

```music boss-seymour-a
{"cue":"boss-seymour","game":"ffx","pilot":"a","lengthMs":98000,"instrumental":false,"model":"music_v2_5","bpm":132,"meter":"4/4","key":"C# minor","loop":{"startSec":7.3,"endSec":98.2},"prompt":"Gothic orchestral battle music at 132 BPM in C-sharp minor. A low pipe organ and double basses carry a slow, courteous, sinister six-note figure; staccato low strings and timpani drive a steady pulse; dark brass answers in long chords; a sustained wordless choir sings open vowels only, no words and no rhythmic chanting. It builds in three waves from a quiet organ and tolling bell to a full orchestra, with a hushed organ-only passage in the middle, and ends on a held tense chord. Elegant, menacing contempt, never frantic. Steady tempo, no tempo changes, no fade-out, no final cadence."}
```

```music boss-seymour-b
{"cue":"boss-seymour","game":"ffx","pilot":"a","lengthMs":98000,"instrumental":true,"model":"music_v2_5","bpm":132,"meter":"4/4","key":"C# minor","loop":{"startSec":7.3,"endSec":98.2},"prompt":"Modern hybrid orchestral-rock boss battle at 132 BPM in C-sharp minor. A tight live drum kit with a half-time feel, a growling bass guitar, low staccato strings and brass stabs; a quiet pipe organ sits low under the band and never takes the lead; a clean-to-crunchy electric guitar plays a stately falling line over the middle section and a soaring lead near the end. Aristocratic and cold rather than furious. No choir, no vocals, no repeated-note chugging riff. Steady tempo, no fade-out, no final cadence."}
```

```music boss-seymour-c
{"cue":"boss-seymour","game":"ffx","pilot":"a","model":"music_v2_5","bpm":132,"meter":"4/4","key":"C# minor","loop":{"startSec":7.3,"endSec":98.2},"plan":{"positive_global_styles":["gothic orchestral battle music","132 BPM","C-sharp minor","pipe organ","double basses","strings","brass","timpani","aristocratic","menacing","steady tempo"],"negative_global_styles":["vocals","lyrics","chanting","pop","electronic drums","tempo change","fade out","final cadence"],"sections":[{"section_name":"invocation","positive_local_styles":["quiet pedal organ","tolling bell","sparse","slow build"],"negative_local_styles":["drums"],"duration_ms":7000,"lines":[]},{"section_name":"the courtesy","positive_local_styles":["low staccato strings pulse","organ under","dark brass chords","restrained"],"negative_local_styles":["loud"],"duration_ms":22000,"lines":[]},{"section_name":"the mass","positive_local_styles":["full orchestra","timpani","brass","sustained wordless choir vowels"],"negative_local_styles":["words"],"duration_ms":24000,"lines":[]},{"section_name":"the hush","positive_local_styles":["organ alone","eerie","bare"],"negative_local_styles":["drums","brass"],"duration_ms":12000,"lines":[]},{"section_name":"the rise","positive_local_styles":["building strings and brass","second climax","timpani roll"],"negative_local_styles":["resolution"],"duration_ms":22000,"lines":[]},{"section_name":"the turn","positive_local_styles":["timpani roll","held tense dominant chord"],"negative_local_styles":["final cadence","fade out"],"duration_ms":11000,"lines":[]}]}}
```

Optional, FFX-2 (a second pilot, because the two games sound different, rule 14):

```music boss-ffx2-aeon-a
{"cue":"boss-ffx2-aeon","game":"ffx2","pilot":"b","lengthMs":100000,"instrumental":true,"model":"music_v2_5","bpm":160,"meter":"4/4","key":"Bb minor to Db major","loop":{"startSec":12.0,"endSec":114.0},"prompt":"Hybrid pop-orchestral boss battle at 160 BPM in B-flat minor. Bright supersaw chord stabs over an octave-pumping synth bass, a four-on-the-floor kick that turns to breakbeats, a jazzy chromatic bridge, and a chorus that lifts to D-flat major where the hook turns hopeful. Glossy, fast, confident, a pop star fighting a god and enjoying it. Instrumental, no vocals. Steady tempo, no fade-out, no final cadence."}
```

```music boss-ffx2-aeon-b
{"cue":"boss-ffx2-aeon","game":"ffx2","pilot":"b","lengthMs":100000,"instrumental":true,"model":"music_v2_5","bpm":160,"meter":"4/4","key":"Bb minor to Db major","loop":{"startSec":12.0,"endSec":114.0},"prompt":"Energetic rock-and-brass battle theme at 160 BPM in B-flat minor. Punchy live drums, a driving electric bass, crunchy rhythm guitars, a tight brass section playing syncopated stabs, a bright synth lead on the hook, and a bridge that thins to bass and hi-hats before slamming back. Playful and heroic, never grim. Instrumental, no vocals. Steady tempo, no fade-out, no final cadence."}
```

```music boss-ffx2-aeon-c
{"cue":"boss-ffx2-aeon","game":"ffx2","pilot":"b","model":"music_v2_5","bpm":160,"meter":"4/4","key":"Bb minor to Db major","loop":{"startSec":12.0,"endSec":114.0},"plan":{"positive_global_styles":["pop orchestral battle music","160 BPM","B-flat minor","supersaw stabs","synth bass","breakbeats","energetic","glossy"],"negative_global_styles":["vocals","lyrics","slow","tempo change","fade out","final cadence"],"sections":[{"section_name":"count-in","positive_local_styles":["kick and bass only"],"negative_local_styles":["melody"],"duration_ms":6000,"lines":[]},{"section_name":"riff","positive_local_styles":["hook as minor supersaw stabs","four on the floor"],"negative_local_styles":["breakdown"],"duration_ms":18000,"lines":[]},{"section_name":"call and response","positive_local_styles":["breakbeat","stabs answered by strings"],"negative_local_styles":["four on the floor"],"duration_ms":18000,"lines":[]},{"section_name":"chorus lift","positive_local_styles":["relative major","hook turns hopeful","bigger"],"negative_local_styles":["minor"],"duration_ms":18000,"lines":[]},{"section_name":"bridge build","positive_local_styles":["jazzy chords","density builds across all layers"],"negative_local_styles":["drop"],"duration_ms":18000,"lines":[]},{"section_name":"peak and turn","positive_local_styles":["riff in octaves","peak","short turnaround"],"negative_local_styles":["final cadence","fade out"],"duration_ms":22000,"lines":[]}]}}
```

## The production briefs (one per cue; text prompt, one take per roll)

Each is the first thing to send for that cue after the pilot has told us which idea Bailey likes. A cue with a wordless voice sets `instrumental` false: listen for words and reject any take that has them.

```music title
{"cue":"title","game":"both","lengthMs":91000,"instrumental":true,"model":"music_v2_5","bpm":58,"meter":"4/4","key":"A minor","loop":{"startSec":8.3,"endSec":91.0},"prompt":"Sparse, melancholy solo piano piece at 58 BPM in A minor. A lone flute plays four soft notes, then the piano answers with a slow rising phrase that never finishes, over gentle broken chords and one low string drone. Intimate, nostalgic, like a story that is already over being told anyway. Quiet dynamics, much silence and natural room reverb, no drums, no vocals. No fade-out; it ends unresolved on a held note."}
```

```music chapter-select
{"cue":"chapter-select","game":"both","lengthMs":73000,"instrumental":true,"model":"music_v2_5","bpm":84,"meter":"3/4","key":"B minor","loop":{"startSec":4.3,"endSec":72.9},"prompt":"Unhurried chamber waltz in 3/4 at 84 BPM in B minor. A solo flute plays four slow notes alone, then a pause; then harp and celesta begin an oom-pah-pah waltz under a gentle melody, and a string quartet joins and doubles the tune. Warm, calm, spacious, French-impressionist colour. No drums, no vocals. Loops cleanly: no final chord, no fade-out."}
```

```music pause
{"cue":"pause","game":"both","lengthMs":47000,"instrumental":false,"model":"music_v2_5","bpm":46,"meter":"4/4","key":"E natural minor","loop":{"startSec":5.2,"endSec":47.0},"prompt":"One wordless female voice sings a slow, plain, modal phrase over a low sustained male drone, and nothing else. 46 BPM, E natural minor, a vast quiet reverb, no percussion, no strings, no piano. Reverent, holding its breath. Open vowel sounds only, absolutely no words. Loops without a seam."}
```

```music scene-gagazet
{"cue":"scene-gagazet","game":"ffx","lengthMs":103000,"instrumental":true,"model":"music_v2_5","bpm":72,"meter":"4/4","key":"B minor","loop":{"startSec":40.0,"endSec":103.3},"prompt":"Bleak high-mountain ambience at 72 BPM in B minor. A single unaccompanied horn plays four slow notes once, then a long silence, then a solo cello answers once, then a single low drone with distant cold wind for the rest. Vast, cold, indifferent. No percussion, no other melody. Loops on the drone."}
```

```music boss-seymour
{"cue":"boss-seymour","game":"ffx","lengthMs":98000,"instrumental":false,"model":"music_v2_5","bpm":132,"meter":"4/4","key":"C# minor","loop":{"startSec":7.3,"endSec":98.2},"prompt":"Gothic orchestral battle music at 132 BPM in C-sharp minor, led by the pilot's chosen idea. Pipe organ and double basses, staccato strings, timpani, dark brass, sustained wordless choir vowels only. Three waves of build, a hushed organ passage, a tense held ending. Elegant contempt, never frantic. Steady tempo, no fade-out."}
```

```music scene-zanarkand-dome
{"cue":"scene-zanarkand-dome","game":"ffx","lengthMs":130000,"instrumental":false,"model":"music_v2_5","bpm":48,"meter":"4/4","key":"B minor","loop":{"startSec":10.0,"endSec":130.0},"prompt":"Slow nocturne for solo piano at 48 BPM in B minor: rolling six-note broken chords in the left hand, the melody an octave up, soft and pedalled, never accented. A celesta doubles the peak and lets it ring; a distant wordless soprano sings alone in the middle while the piano drops out; strings enter warmly for the first time near the end. Warmth remembered, which is worse than cold. No drums, no words."}
```

```music boss-yunalesca
{"cue":"boss-yunalesca","game":"ffx","lengthMs":101000,"instrumental":false,"model":"music_v2_5","bpm":132,"meter":"6/8","key":"F Phrygian","loop":{"startSec":10.9,"endSec":100.9},"prompt":"Ritual gothic orchestral battle music in 6/8 at 132 BPM in F Phrygian. A galloping harp figure alone at first, then a wordless choir enters as a strict four-voice canon, entries three beats apart, over low strings; cold and mechanical, constant dynamics, the voices never settle into a chord; later brass doubles the line. No cadence. A rite that will finish with or without you. Wordless vowels only, no words, no vibrato."}
```

```music scene-dreams-end
{"cue":"scene-dreams-end","game":"ffx","lengthMs":101000,"instrumental":true,"model":"music_v2_5","bpm":76,"meter":"4/4","key":"no tonal centre","loop":{"startSec":12.6,"endSec":101.1},"prompt":"Unmoored dreamlike ambient music at 76 BPM with no tonal centre. A celesta music box plays a bent four-note rising figure alone, then major triads move in parallel by whole steps beneath it and never resolve; soft pads and glass harmonics; no percussion, no drums, no vocals. A city that never was."}
```

```music boss-jecht
{"cue":"boss-jecht","game":"ffx","lengthMs":107000,"instrumental":true,"model":"music_v2_5","bpm":144,"meter":"4/4","key":"D minor","loop":{"startSec":6.7,"endSec":106.7},"prompt":"Rock-orchestral boss battle at 144 BPM in D minor. Double-tracked drop-D electric guitars and bass play a rough syncopated riff that lands off the beat, tight live drums, brass stabs; a lyrical melody for strings and brass in a half-time bridge in D major; then in the climax the two ideas collide, the riff entering two beats late under the melody, like two people talking over each other. Heroic, proud, affectionate. No vocals, no repeated-note chugging."}
```

```music boss-yu-yevon
{"cue":"boss-yu-yevon","game":"ffx","lengthMs":210000,"instrumental":false,"model":"music_v2_5","bpm":40,"meter":"4/4","key":"E natural minor","loop":{"startSec":6.0,"endSec":210.0},"prompt":"A vast dread ritual at 40 BPM in E natural minor. A wordless choir sings a very slow, plain, modal hymn over one low drone, with no percussion and no attack. The last phrase is sung unaccompanied and never resolves, and a second choir a fifth higher enters eight beats late so it ends as bare open fifths. About three and a half minutes. Open vowels only, no words. No end."}
```

```music victory-ffx
{"cue":"victory-ffx","game":"ffx","lengthMs":72000,"instrumental":true,"model":"music_v2_5","bpm":120,"meter":"4/4","key":"C major","loop":{"startSec":8.0,"endSec":72.0},"prompt":"Short orchestral victory fanfare then a warm relaxed loop at 120 BPM in C major. The fanfare opens on one long brass note, then falls and arches by step and closes on a gentle plagal amen chord; then eight bars of plucked strings, piano and soft strings with no tension, a flute playing a simple major phrase over the last two bars. Relief, not triumph. Instrumental."}
```

```music ending-ffx
{"cue":"ending-ffx","game":"ffx","lengthMs":116000,"instrumental":false,"model":"music_v2_5","bpm":58,"meter":"4/4","key":"B minor to B major","loop":{"startSec":33.1,"endSec":115.9},"prompt":"Solo piano states a slow, aching minor melody at 58 BPM in B minor; strings enter and build; the full orchestra and a wordless choir restate it, and the final chord turns to B major and rings for several seconds; a quiet piano coda. Permission to stop. Open vowels only, no words."}
```

```music scene-macalania-temple
{"cue":"scene-macalania-temple","game":"ffx","lengthMs":60000,"instrumental":true,"model":"music_v2_5","bpm":56,"meter":"4/4","key":"F# minor","loop":{"startSec":12.9,"endSec":60.0},"prompt":"Frozen temple ambience at 56 BPM in F-sharp minor. High quartal string chords held one bar at a time, irregular glockenspiel drips with no two gaps the same, an alto flute that wanders without a pulse and never lands on the home note, harp open fifths; near the end the ice warms once to a major seventh chord and a chime sounds. Ice pretending to be masonry, and something behind the door. No drums, no vocals."}
```

```music boss-seymour-macalania
{"cue":"boss-seymour-macalania","game":"ffx","lengthMs":122000,"instrumental":true,"model":"music_v2_5","bpm":126,"meter":"4/4","key":"C# minor","loop":{"startSec":7.6,"endSec":121.9},"prompt":"Polite baroque chamber battle music at 126 BPM in C-sharp minor. A harpsichord plays a stately pavane with plucked strings on beats two and four; an oboe carries a six-note figure an octave higher than a low register; violins take it, cellos answer in contrary motion, a chromatic decline never reaches home; then a rise with low brass and a struck bell and a plagal close. Polite, and wrong. No organ, no choir, no drums, no vocals."}
```

```music scene-fahrenheit
{"cue":"scene-fahrenheit","game":"ffx","lengthMs":74000,"instrumental":true,"model":"music_v2_5","bpm":104,"meter":"4/4","key":"D minor","loop":{"startSec":9.2,"endSec":73.8},"prompt":"Wind and engine underscore at 104 BPM in D minor. High wind, a distant clang, a piano in open fifths turning over like an engine; violins sing a slow rising phrase and let it fall; a flute plays a quickening ship figure; the peak closes on a plagal amen. No drums. No time, and no way back. Instrumental."}
```

```music boss-evrae
{"cue":"boss-evrae","game":"ffx","lengthMs":80000,"instrumental":true,"model":"music_v2_5","bpm":144,"meter":"4/4","key":"A minor","loop":{"startSec":6.7,"endSec":80.0},"prompt":"Pursuit battle at altitude at 144 BPM in A minor. Engine-room clangs and taiko open; strings drive a rising pursuit phrase with a rest every two bars over piano sparkle; horns take it while violins sing above; a quiet airy middle with a distant flute and one beat of dead stop; then fast sixteenth-note strings at the same tempo. The ship is the weapon; keep your distance. No choir, no organ, no vocals."}
```

```music boss-yojimbo
{"cue":"boss-yojimbo","game":"ffx","lengthMs":88000,"instrumental":true,"model":"music_v2_5","bpm":132,"meter":"4/4","key":"C natural minor","loop":{"startSec":14.5,"endSec":87.3},"prompt":"Restrained grief battle music at 132 BPM in C natural minor. A solo cello plays a rising-fifth line over felt piano with no pulse; then bowed eighths and taiko join, a violin takes the line an octave up and the cello answers; horns hold; the strain climbs; one full-orchestra chord cuts everything but the piano; control returns, quieter, ending on a plagal amen. No dominant chords. Grief under control; it cracks once. Instrumental."}
```

```music scene-bevelle-underground
{"cue":"scene-bevelle-underground","game":"ffx2","lengthMs":106000,"instrumental":true,"model":"music_v2_5","bpm":100,"meter":"4/4","key":"G minor","loop":{"startSec":19.2,"endSec":105.6},"prompt":"Industrial electronic-orchestral underscore at 100 BPM in G minor. A plucked arpeggio over a dark fading-in pad, a half-time 808 groove, a synth bass figure, one short solemn phrase on low clarinet played once and never repeated; a breakdown where the drums drop out and the bass holds its notes; the groove returns thicker. The machine under the cathedral. Instrumental."}
```

```music boss-ffx2-aeon
{"cue":"boss-ffx2-aeon","game":"ffx2","lengthMs":114000,"instrumental":true,"model":"music_v2_5","bpm":160,"meter":"4/4","key":"Bb minor to Db major","loop":{"startSec":12.0,"endSec":114.0},"prompt":"Hybrid pop-orchestral boss battle at 160 BPM in B-flat minor, led by the pilot's chosen idea. Bright supersaw stabs over octave-pumping synth bass, four-on-the-floor then breakbeats, a jazzy bridge, a chorus lifting to D-flat major. Glossy and confident, a pop star fighting a god and enjoying it. Instrumental. Steady tempo, no fade-out."}
```

```music scene-farplane
{"cue":"scene-farplane","game":"ffx2","lengthMs":104000,"instrumental":true,"model":"music_v2_5","bpm":92,"meter":"4/4","key":"E major","loop":{"startSec":20.9,"endSec":104.3},"prompt":"Serene ambient pop-orchestral music at 92 BPM in E major. Pad and harp fade in; a flute sings a plain rising phrase; an electric piano answers over a soft 808 pulse and shaker; celesta motes and open fourths float above; the end recedes and lifts back into the start. Rest without forgetting. Instrumental, no vocals."}
```

```music boss-vegnagun
{"cue":"boss-vegnagun","game":"ffx2","lengthMs":91000,"instrumental":true,"model":"music_v2_5","bpm":168,"meter":"4/4","key":"F minor","loop":{"startSec":11.4,"endSec":91.4},"prompt":"Mechanical industrial metal-orchestral boss battle at 168 BPM in F minor. A huge pipe organ swell and metal clangs open; the groove lurches through alternating three-and-a-half and four-and-a-half beat bars; low brass in bare octaves with perfectly constant note lengths and no swing; alarm tones; a four-bar hush to bass, metal and hi-hats, then the band slams back. Something enormous, and nobody is driving. No vocals."}
```

```music boss-shuyin
{"cue":"boss-shuyin","game":"ffx2","lengthMs":100000,"instrumental":true,"model":"music_v2_5","bpm":154,"meter":"4/4","key":"C# minor","loop":{"startSec":12.5,"endSec":99.7},"prompt":"Tragic rock-orchestral boss battle at 154 BPM in C-sharp minor. A solo piano riff alone, then the full band with a sorrowful synth lead; a half-time middle where electric piano and strings carry the melody slowly; the riff returns with the hook passed between registers; the climax doubles it in octaves. Grief that has curdled. Instrumental, no vocals."}
```

```music victory-ffx2
{"cue":"victory-ffx2","game":"ffx2","lengthMs":68000,"instrumental":true,"model":"music_v2_5","bpm":128,"meter":"4/4","key":"Eb major","loop":{"startSec":7.5,"endSec":67.5},"prompt":"Bright pop synth-brass fanfare then an 808 results groove at 128 BPM in E-flat major. The fanfare lands on a ninth chord with a clap and a crash; the groove has pumping synth bass, electric-piano stabs and a plucked arpeggio; a flute answers; the fullest phrase doubles the hook over a glowing pad. That was fun. Instrumental."}
```

```music ending-ffx2
{"cue":"ending-ffx2","game":"ffx2","lengthMs":115000,"instrumental":true,"model":"music_v2_5","bpm":84,"meter":"4/4","key":"Bb major to C major","loop":{"startSec":11.4,"endSec":114.3},"prompt":"Gentle pop ballad instrumental at 84 BPM in B-flat major rising to C major. An electric-piano vamp, a flute verse, a chorus with strings and a supersaw pad, a bare piano bridge, a second chorus where soft 808 drums, claps and hi-hats finally enter, a final chorus a step higher with celesta and a bell, and a quiet coda back to B-flat. The second goodbye is gentler, because it can be. No vocals."}
```

### Owed cues (no cue exists yet; D-209 says a stand-in never counts as finished)

Targets come from `THEMES.md` (owed column), `docs/plans/chapter-leblanc-review.md` section 6 and the sketches on `audition.html`; the lengths are proposals.

```music owed-scene-chateau-leblanc
{"cue":"scene-chateau-leblanc","game":"ffx2","lengthMs":75000,"instrumental":true,"model":"music_v2_5","bpm":120,"meter":"4/4","key":"major","loop":{"startSec":8.0,"endSec":75.0},"prompt":"Light-footed caper music at 120 BPM in a major key: a muted rhythm section, tiptoe pizzicato strings, stop-start phrasing with sudden silences, a joke in the percussion (a woodblock answering a triangle), a cheeky muted trumpet. Comic stealth in a grand house. Instrumental."}
```

```music owed-boss-leblanc
{"cue":"boss-leblanc","game":"ffx2","lengthMs":45000,"instrumental":true,"model":"music_v2_5","bpm":168,"meter":"4/4","key":"F major","loop":{"startSec":4.0,"endSec":45.0},"prompt":"Swinging big-band boss battle at 168 BPM in F major with nothing in a minor key. A brass fanfare announces itself and arrives late on the second beat, twice, as if late to its own party; a trombone answers each phrase by sliding down a tone, four times; one bar near the end borrows a chord that does not belong, purely for joy, and walks back out. The music is on the trio's side and the trio is ridiculous. Instrumental."}
```

```music owed-scene-disquiet
{"cue":"scene-disquiet","game":"ffx2","lengthMs":15000,"instrumental":true,"model":"music_v2_5","bpm":60,"meter":"4/4","key":"no home note","loop":{"startSec":0.0,"endSec":15.0},"prompt":"A short unsettling sting at 60 BPM. It begins by cutting a cheerful phrase off mid-note with no cadence and no cymbal to cover the join, then one full second of silence, then a static chord built from stacked fourths with no home note, and no melody at all; the only event is one low machine tone sliding down a semitone and stopping. The sound of a room that has just become a different kind of room."}
```

```music owed-boss-natus
{"cue":"boss-natus","game":"ffx","lengthMs":105000,"instrumental":false,"model":"music_v2_5","bpm":126,"meter":"4/4","key":"C# minor","loop":{"startSec":8.0,"endSec":105.0},"prompt":"Menacing orchestral battle music at 126 BPM in C-sharp minor for a polite man who has become a monster. Low pipe-organ pedal and contrabasses carry a six-note courtly figure; strings and low brass; the melody's chromatic decline keeps going until it turns whole-tone and the scale loses its home note, at which moment the organ pedal drops away and the floor goes. Sustained wordless choir vowels only. Used once, never again. No chanting, no drums-and-guitar rock."}
```

```music owed-boss-fallen-aeons
{"cue":"boss-fallen-aeons","game":"ffx2","lengthMs":110000,"instrumental":true,"model":"music_v2_5","bpm":150,"meter":"4/4","key":"E minor","loop":{"startSec":10.0,"endSec":110.0},"prompt":"Poignant pop-orchestral battle at 150 BPM in E minor for fighting friends who have been twisted. Driving bass and drums, shimmering synth arpeggios, a sad strings countermelody that keeps trying to become hopeful, a bridge where everything thins to piano and a single held pad, then a final push. Affection under attack. Instrumental, no vocals."}
```

```music owed-boss-omnis
{"cue":"boss-omnis","game":"ffx","lengthMs":105000,"instrumental":false,"model":"music_v2_5","bpm":132,"meter":"4/4","key":"C# minor","loop":{"startSec":8.0,"endSec":105.0},"prompt":"A final, vast, tragic battle at 132 BPM in C-sharp minor for a man whose cruelty has run out of room. Pipe organ, low brass and strings in a large hollow space; a courtly six-note figure now complete and unmoored, whole-tone steps with no home note; sustained wordless choir; it should feel exhausted as well as huge, and end suspended. Open vowels only, no words, no chanting."}
```

```music owed-boss-trema
{"cue":"boss-trema","game":"ffx2","lengthMs":100000,"instrumental":false,"model":"music_v2_5","bpm":120,"meter":"4/4","key":"E natural minor","loop":{"startSec":9.0,"endSec":100.0},"prompt":"A cold ritual battle at 120 BPM in E natural minor in which a plain, old, prayer-like four-chord progression is turned against itself: a slow wordless choir over organ, joined by a driving electronic pulse and strings, the chords stacked in the wrong order so the prayer turns mechanical; calm and inevitable rather than angry. Open vowels only, no words."}
```

```music owed-boss-isaaru
{"cue":"boss-isaaru","game":"ffx","lengthMs":95000,"instrumental":false,"model":"music_v2_5","bpm":112,"meter":"4/4","key":"E natural minor","loop":{"startSec":8.0,"endSec":95.0},"prompt":"A sorrowful, devout duel at 112 BPM in E natural minor in a red-lit maze: a slow plain modal prayer for wordless voices over a low drone, with strings and low drums gradually driving a steady pulse under it, then falling back to the bare voices; a calm dignified sadness, two sides who respect each other. Open vowels only, no words."}
```

```music owed-boss-den-of-woe
{"cue":"boss-den-of-woe","game":"ffx2","lengthMs":100000,"instrumental":true,"model":"music_v2_5","bpm":150,"meter":"4/4","key":"C# minor","loop":{"startSec":10.0,"endSec":100.0},"prompt":"Tragic rock-electronic battle music at 150 BPM in C-sharp minor for three friends remembered as shadows made of feeling. A sorrowful synth-and-piano hook in the minor, heavy guitars and drums, a middle section where one instrument at a time drops out as each shade rises, then all three together. Grief that will not finish. Instrumental, no vocals."}
```

```music owed-scene-djose
{"cue":"scene-djose","game":"ffx2","lengthMs":75000,"instrumental":true,"model":"music_v2_5","bpm":96,"meter":"4/4","key":"A minor","loop":{"startSec":8.0,"endSec":75.0},"prompt":"Ominous field music at 96 BPM in A minor for a mountain temple full of monsters and a missing friend: a dry synth pulse, a low distorted electric bass, metallic percussion, a lonely electric-guitar line played once, wind. Tense and practical, the sound of machine-faction country. Instrumental."}
```

```music owed-scene-abyss
{"cue":"scene-abyss","game":"ffx2","lengthMs":75000,"instrumental":true,"model":"music_v2_5","bpm":70,"meter":"4/4","key":"E major","loop":{"startSec":8.0,"endSec":75.0},"prompt":"A white, silent, fog-filled afterlife at 70 BPM in E major: slow wide pads, bowed glass, a distant solo female voice humming on one vowel, a harp playing one note at a time, a gentle pulse so quiet it is felt, not heard. A love that is not your own. Instrumental apart from the single hum, no words."}
```

```music owed-sin-assault
{"cue":"sin-assault","game":"ffx","lengthMs":90000,"instrumental":true,"model":"music_v2_5","bpm":140,"meter":"4/4","key":"A minor","loop":{"startSec":7.0,"endSec":90.0},"prompt":"A heroic aerial assault at 140 BPM in A minor: pounding taiko and low strings, soaring horns, rising ostinato strings, a plain slow hymn-like theme in the brass over the top; a country singing below and an airship diving on a colossus. Driving, defiant, not triumphant. Instrumental, no vocals."}
```

```music owed-sin-countdown
{"cue":"sin-countdown","game":"ffx","lengthMs":90000,"instrumental":true,"model":"music_v2_5","bpm":100,"meter":"4/4","key":"D minor","loop":{"startSec":6.0,"endSec":90.0},"prompt":"A countdown at 100 BPM in D minor: a quiet ticking pulse that tightens as the music goes, strings in a rising sequence, a single sustained brass note growing, no drum fills, with the pulse speeding up in small steps toward a single huge held chord that never arrives. Dread, time running out. Instrumental."}
```
