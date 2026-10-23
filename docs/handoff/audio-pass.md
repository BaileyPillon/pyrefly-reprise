# The audio pass (conference demo; branch `audio-pass`, from `demo-motion-int`)

Written 2026-10-22 and 23 by the sound-pass sub-agent of the Echoes of Spira release driver. Bailey, 2026-10-22 ~20:50 EDT, verbatim: "You choose all sound effects and music and voice overs for me for now please" (decision 184: every pending sound-effect, music and voice-over choice is delegated to the driver, recorded as delegated, and stays his to overturn by ear). Earlier that day (178r) sound went to the same bar as the visuals ("Yes, same bar": Expedition 33 and Hades: hits, UI clicks, spells and the mix).

**Agents cannot hear (AGENTS.md rule 13).** Nothing below says anything sounds good or bad. Every pick is read off a source line or a measurement (the numbers are reproducible with the tools listed at the end), and every pick is on `docs/audio/audition.html` ("Delegated picks, 22 Oct") as a pair Bailey can overturn by ear. The plain-words list of the 18 picks is `D:/Tools/pyrefly-scratch/2026-10-22/audio/PICKS.md` (and `picks.json`); the same list is the first table of the audition section.

**Game case (rule 14):** both games, each its own tables. Chapter I (`seymour-flux`) is FFX; Chapter IV (`ffx2-bahamut`) is FFX-2. Nothing is shared between the games except the plumbing and the neutral numbers (the ducks, the makeup, the safety ceiling). The voice is FFX only (FFX-2 has no voiced battle line in the sources and its voices are not cast).

## Turn it on and off

| address | the pass |
|---|---|
| nothing | **off**: today's sound, exactly (the pin tests and the audio, voice, demo and feel suites pass unchanged) |
| `?audio=new` or `?pack=demo` | on, in Chapter I and Chapter IV only (the chapter RUN: prep, battle, pause and results; the attract reel's segments too, in demo mode) |
| `?pack=demo&audio=today` | the demo pack with today's sound (the A/B) |

Console (`window.__pyrefly`): `audioNew(on?)` pins it, `audioPass()` says what it holds (makeup, booth trim, the dip level), `audioPassLog(reset?)` is the pass's own record of every layered blow, dip, delayed landing, release, ducked line and menu cue (the page's clock, the stepper's while `simStep` runs). `sfxLog` records the layers (`layer` field).

## What changed, piece by piece

| piece | where | the number and its basis |
|---|---|---|
| **Layered hits** (a weapon base, a crack or a body, a small per-character accent) | `audio/pass/passRecipes.ts` (tables), `passPlanner.ts` (`planHit`), `passMixer.ts` (`playLayers`), `AudioManager.playPassed`, `battleSfxVoice.ts` (the facts) | The library's FFX hits are all sub and body (the v2 sword hit has 76 percent of its energy under 120 Hz, the staff hit 96) and the recorded FFX-2 hits are all crack (dagger, greatsword and gun hits: 0 to 1 percent under 500 Hz). Each missing part is cut from a cue the library already ships (no new audio). Layers sit 5 to 15 dB under their base's peak (texture 6.5, body 5, accent 15 under; `tools/audio/pass-render.mjs tune`). |
| **The base starts on its first audible sample** | `AudioManager.playPassed` (`baseSkipFor`, scans the decoded slice, cached) | The recorded dagger hit is silent for 168 ms, the greatsword's for 52.6 ms, the spear's 30.1, the staff's 21.2, the v2 sword's 12.3, heavy-enemy 18: asked for at the contact, each was heard that late. Stepped at 60 Hz in Chapter IV: dagger 168 ms late today, 1 ms after the pass. |
| **The dip before a big blow, and the thump** | `PassBeats.ts` (`attackBeat`, `landingBeat`), `AudioManager.musicDip` (own gain node between the music bus and the duck bus), `passRecipes.DIPS` and `THUMPS` | Crit: 90 ms lead, -9 dB, hold 70 ms past the blow, back over 240 ms; Overdrive and boss: 120 ms lead, -14 and -12 dB. A critical's dip is timed from the swing; a boss's from the landing wait on the presenter's own clock (a dip timed from the unscaled wait started 68 to 145 ms early in the stepped runs). Thump: `footstep` pitched to 0.78 (a critical; 8.1 dB under the critical's peak) or `v2:explosion` pitched to 0.85 (boss and Overdrive finisher; peak -16.3 dBFS at the master). |
| **Menu family** | `passRecipes.UI_FAMILY`, `AudioManager.playSfx` | Today the menu cues peak from -7.4 (error) to -22.3 dBFS at the master and run 235 to 700 ms. The family: tick -22, page -24, open -21, close -22, back -20, turn-ready -19, error -16 dBFS, each cut to 110 to 260 ms with a fade; gains per game and per bank (`tools/audio/pass-render.mjs ui`). |
| **Spell sounds on the effects' marks** | cast start: the existing `magic-charge` is asked in the same call that poses the cast (no change). Release: `PassBeats.passRelease` from `SkillTravel.launchShot` (the air of a shot leaving, `whiff` at 0.72 and 0.34, cut to the flight). Landing: `PassBeats.landingWaitMs` reads `VfxPort.markIn` when the landing cue is asked and the mixer waits that long less the cue's own silence | Measured (stepped 60 Hz): `markIn` at the landing cue was 0 in 64 of 72 Chapter I asks and 7 ms in 8, 0 in 5 of 8 Chapter IV asks and 5 ms in 3: the effect is at its mark when the cue is asked, to within a frame, and the pass delays the cue by what is left. No sound plays before its effect. |
| **Fire's five landings** | `BattlePresenterSfx.withPass`, `passMix.SPELL_STACK_DB` (-3 dB each after the first) | Offline: five `fire-2` landings 0.23 s apart peak -6.1 dBFS at the master (louder than a sword hit, -8.1) and -8.7 with the stack taken down. In a recorded Chapter I fight the stack was the loudest thing in it. |
| **Mix** | `passMix.ts`, `AudioManager` (`passTrim` before the limiter, `safety` shaper after it), `sfxGame.ts` (on for the chapter run) | See "Master loudness" below. |
| **Voice over music** | `VoiceDirector`, `passMix.VOICE_DUCK_DB` -9 (was -3.5) | Speech-band (300 to 3400 Hz) voice over music: +7.2 dB over the battle theme and only +2.9 dB over the Chapter I scene bed at today's duck; +13.2 and +8.4 at -9 dB. K-weighted gap at least +7.9 LU. |
| **Motion sounds** | `audio/pass/passMask.ts`, `motionSfxSink.ts` | The smear zip is asked 0 to 25 ms after the blow's cue on every blow (Chapter I 28 of 29 hits, Chapter IV 46 of 46) and sits 2.1 to 5.5 dB under the recorded FFX-2 hits: a zip or landing on a blow takes 12 dB off; every other motion sound keeps its measured level. An Overdrive's gather landing thud is left out. |
| **Results** | `audio/pass/passResults.ts`, `resultsMusic.ts`, `BattlePresenterBeats.victory` | Chapter IV's win plays no music (sources: silent). Chapter I's win: the results cue starts at the last blow, the 3.4 s sting is dropped (one fanfare, not two). |
| **Sound Test titles** | `audio/pass/passTitles.ts`, `MusicPlayer.trackTitle` | The 17 titles of D-830 (answered "as proposed" by D-932 P4) show while the pass is on. |
| **Attract reel** | `demoAttract.ts` | Music at its fight share, the whole mix -6 dB, each segment takes its chapter's game (recorded originals, motion sounds). |
| **Voice** | `public/audio/voice-pass/`, `VoiceBank`, `story/scripts/seymour-flux-pass.ts` | Nine in-battle lines, see "Voice". |

Files that carry the pass but are not contract files: none of `docs/CONTRACTS.md`'s list is touched (`dsl.ts` and `types.ts` are imported, not changed).

## Measured

### Master loudness of a fight (the game's own output, after its limiter, recorded in headless Chromium at normal speed; the first 12 s of the battle screen skipped; ffmpeg-class BS.1770 K-weighting, 3 s short-term blocks every 100 ms, true peak by 4x oversampling)

| | integrated | short-term p10 / p50 / p90 / max | loudest 400 ms | sample peak / true peak |
|---|---|---|---|---|
| Chapter I today (`audio=today`) | -18.6 | -20.9 / -19.2 / -16.9 / -15.4 | -13.1 | -2.0 / -2.0 dBTP |
| Chapter I with the pass | -14.6 | -17.4 / **-15.4** / -12.4 / -11.4 | -9.8 | -1.6 / **-1.6 dBTP** |
| Chapter IV today | -19.3 | -22.1 / -19.2 / -17.8 / -16.4 | -14.1 | -3.8 / -3.8 dBTP |
| Chapter IV with the pass | -15.3 | -18.1 / **-15.2** / -13.7 / -12.5 | -10.3 | -1.6 / **-1.6 dBTP** |

The target was a fight "around -16 to -14 LUFS short-term, true peak under -1 dBTP": the medians are -15.4 and -15.2, the true peak is -1.6. How: +4 dB of master makeup before the limiter (on only while a demo chapter run is, `MAKEUP_DB`), and a soft ceiling after it (a WaveShaper, linear to -3 dBFS and bending to -1.5, 4x oversampled so it bounds the true peak; a null curve passes the signal untouched when the pass is off). Two things that did not work and why: the first recording (+3.5 dB, no ceiling) reached -0.1 dBFS on the Fire stacks because the limiter (a `DynamicsCompressorNode`, threshold -2) overshoots by about 2 dB; lowering its threshold made the fight 1.1 LU louder because the node adds make-up gain of its own. The p90 is above the window (-12.4 and -13.7): the loudest tenth of a fight is the blows.

### Hit sounds against the contact frame (stepped at 60 Hz, 16/17/17 ms frames, the game's intended line, 212 to 232 s of fight; ms from the stage's impact call to the first audible sample)

| | today | with the pass |
|---|---|---|
| Chapter I (FFX), 10 hit asks | median 0.9 ms, 18 ms for the boss's blow, 12.4 for `hit-1`; all within one frame | median 0.9, max 12.5 (`hit-1`, a magic blow with no weapon base to skip); all within one frame |
| Chapter IV (FFX-2), 12 hit asks | median 18 ms; **dagger 168 ms (5 of 5), greatsword 52.6**; 6 of 12 within 20 ms | median 1 ms, max 1; **10 of 10 within 20 ms** |

Offline, every blow rendered from the shipped sprites with the pass's plan (`pass-render.mjs hits`): the audible onset moves from 0.3 to 168 ms to 0.3 to 1.0 ms; the composite peak changes by 0.0 to +2.4 dB for an ordinary blow (+2.6 to +3.7 for a critical, a big moment) and the loudest 400 ms by 0.0 to +0.6 LU. The attack (time from the first audible sample to within 6 dB of the peak) of the v2 sword hit goes from 15.7 to 0.3 ms, the dagger's from 519 to 19 ms and the greatsword's from 498 to 33 ms. Share of the first 40 ms above 2 kHz: katana 0.6 to 42 percent, spear 0.6 to 14.5, sword 3 to 9.7, staff 0.4 to 5.1 (blunt weapons get a mid "knock" instead: their layers are at 500 Hz to 2 kHz, so the share above 2 kHz barely moves for the doll and the blitzball). The FFX-2 hits go the other way: the first 250 ms of a dagger hit change from 99.8 percent above 500 Hz to 94 percent below, the shimmer arriving after the body.

### The dip, the landings, the release (stepped at 60 Hz, the final code)

- **Dips**, from the dip's start to the stage's impact call for the blow: Chapter I's boss blow (Cross Cleave's landing) **120 ms** (designed 120); Chapter IV's two critical dips **90 ms** each (designed 90) and Mega Flare's **120 ms**. Earlier versions of the scheduling read 119, 313, 188 (Chapter I) and 100, 100, 265 (Chapter IV): the first timed a boss's dip from the swing (a boss's blow landed 193 ms later than the strike beat says), the second from the unscaled landing wait (the presenter's waits run scaled by the speed and the pace, a factor of 1.2 in Chapter I). The dip is now started by a sleep on the presenter's own clock, scaled to the page's milliseconds. The target was 60 to 120 ms.
- **Landings**: `markIn` (how far the effect's own clock still was from the blow's mark when the cue was asked) was 0 in 64 of 72 Chapter I asks and 7 ms in 8, and 0 in 5 of 8 Chapter IV asks and 5 ms in 3: the effect is at its mark when the cue is asked, to within a frame, and the pass delays the cue by what is left less the cue's own silence. No landing sound plays before its effect.
- **Release**: one whoosh in Chapter I (an orb with a 140 ms flight), none in Chapter IV (its shots are gun tracers: the shot is the cue).

### Menu family

Today: 14 menu cues, 7 per game, peak -7.4 to -22.3 dBFS, 235 to 700 ms. With the family: -16 to -24 dBFS, 110 to 260 ms. The per-cue gains: `UI_FAMILY` (FFX: -7, -3, -8.5, -5, -3.5, -7.5, +3.5 dB for tick, back, error, open, close, page, your-turn; FFX-2: -7, -3, -8.5, -1, -4, -3.5, +3).

### Level ladder at the master, before the makeup (peak, dBFS; recorded fights and the offline renders)

| class | peak |
|---|---|
| music loops | -7.4 to -9.8 |
| hits (base) | -7.5 to -15 |
| big moments (crit composite, thump, the headline blows' own cues) | up to -6, thump -16 and -18 |
| spell landings | -11.6 to -20 (Fire's stack -8.7) |
| layers under a hit (texture, body, accent) | 5 to 15 dB under the base |
| voice (true peak per line) | -5.3 to -12.3 |
| release whoosh | -16.3 |
| motion sounds | lunge -13.3, dash -14.1, land -15.2, smear -17.2 (-29 on a blow) |
| menu cues | -16 to -24 |

## Voice

Chapter I's real fight voices 8 battle lines (INVENTORY 4.1: Yuna's Talk Seymour, Seymour, Yuna; Kimahri's Talk two lines; three Seymour taunts). The pass voices **nine lines** in the same slots: Seymour's four authored mid-fight lines (`seymour-half`, `seymour-lance`; text unchanged), and the two Talk exchanges in the project's own words (the retail text is not reproduced): Seymour "Lady Yuna. You need not suffer." / "Let me end it kindly." and Yuna "No. I will walk it to the end."; Kimahri "Kimahri does not fear Seymour." / "Kimahri stands. Yuna walks on." The Talk lines are new mid-battle scripts fired by the Talk command itself (`ability-used` with the ability `talk`), present only while the pass is on (`passMidFor`, `passScriptsFor`), each kept under the mid-battle beat's 8 s with its recordings (the first, longer Yuna exchange was cut at exactly 8.0 s in a recorded fight; fixed by shortening it and dropping the camera steps, and all nine now play to the end).

- **Seymour and Kimahri were cloned the way Tidus, Yuna and Auron were:** Fish Audio Drama 3, an inline reference of ten clips (about 34 s) cut from the owner's Steam copy (`FFX_Data.vbf` US voice banks: 161 Seymour clips, 103 Kimahri), transcripts by ElevenLabs Scribe, permission on record 2026-10-18 ("I have the original casts permission already"). The reference clips and raw takes stay in the scratch folder (`D:/Tools/pyrefly-scratch/2026-10-22/audio/voice/`), not in the repo.
- Three takes per line, the lowest word error chosen (Scribe read-back: **0 errors in 46 words** in the chosen takes), inner pauses over 330 ms shortened (the project's default variant), mastered to -19 LUFS dual mono with the project's own tool (`voice-ship-lib.mjs`): true peak at most -3.4 dBTP, every file passes the ship gate.
- **Spend: $0.0125 of Fish credit** (33 calls: 27 first, 6 re-takes after the Yuna exchange was shortened; 1,665 UTF-8 bytes at the pilot's measured $7.5e-6 a byte, logged in `voice/spend-log.jsonl` and the pilot's `spend-log.jsonl`; the account's balance moved 49.72459 to 49.71486 over the first three takes, $0.0097). Of the $1 allowed, $0.9875 remains. The ElevenLabs Scribe checks cost no credits on the account's counter. No key was printed or logged.
- Installed in their own folder, `public/audio/voice-pass/` (208 KB), with a manifest in the chapters' shape (`node tools/audio/voice-pass-install.mjs`), so the shipped voice folder, its audit and its "only the picked voices" test are untouched. The bank fetches them only when the address asks for the pass and answers them only while a demo chapter run is on.
- **The existing 28 Chapter I lines were re-verified** instead of re-picked (`voice/work/reverify-ch1.json`): the chosen Fish take is the lowest-word-error take of every line (28 of 28), 0 word errors in 137 words, and the shipped files read -18.93 to -18.10 LUFS as played (median -18.8): four short lines are 0.5 to 0.7 LU above the median (`pre.017`, `post.004`, `post.022`, `quip-auron.001`). Not changed: those files are in the live game's voice folder and a re-master is a live change.

## What was recorded on which code

The master loudness recordings (the table above) were taken on the commit before the last two timing changes (the dip scheduling above, and the unlock detail); the dip only moves the music's gain for 160 to 300 ms around a big blow, so the loudness of a fight is not affected, but the recordings are of that commit and not of the last. The stepped captures (hits against the contact, the dips, the landings) are of the final code. The audition clips of the real fights are cut from the recordings.

## What I did not do, and why

- **PC-05** (the title and the attract reel are silent until a press): no code. The booth script says "press T once" (`docs/BOOTH-SCRIPT.md`).
- **PC-13 to PC-17** (the menu "no", the Natus cue, the stand-in beds, the 11 "try again" rows, the listening score) are not on the demo path; the picks say leave them, and why.
- The Sound Test titles are behind the pass, not in the live jukebox.
- The attract-reel changes are covered by the unit tests only (the reel needs 60 s of idle in a real browser; not run).
- **The tap that measured the master is a pass-through ScriptProcessor** (4096 samples): the loudness numbers are unaffected, the absolute latency of the recorded files is not the game's.
- Chapter I's four loud-by-0.5-LU voice files, the FFX-2 menu cues on the picker (no game set), and the title: untouched.

## Review obligations

`node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,src/engine/BattlePresenterSfx.ts,...` classes the change DEEP (audio routing and the battle presenter are shared systems): a focused review before a deploy, a live check, then the deep review on the live build; it is behind a switch that is off everywhere but the two demo chapters. At most two deploys may go out while a deep review is owed.

## Tests and checks

`npx tsc --noEmit` clean. New: `tests/unit/audio-pass.test.ts` (17), `audio-pass-voice.test.ts` (11) and `audio-pass-mixer.test.ts` (9, the mixer on a fake audio graph: off is one source, on is the skip, the layers, the covered thump, the menu row and the landing wait). The full `npx vitest run` on the final tree: 1,559 files passed, 7 failed, 26 skipped (25,006 tests passed, 8 failed): **all 7 failing files are pose and art records** (`held-defend-ffx`, `held-defend-ffx2`, `pose-stature-hold`, `pose-scale-art`, `critic-continuity-pose-motion`, `tools/pose-gate-art`, and the Tourist Trap bench), none imports anything of the pass or any audio module, and they read `docs/target/pose-measure.json` against the art on this disk (`public/art` is a junction to `D:/pyrefly-art-r61`); I did not run them on the base commit. `node tools/orphans.mjs`: 24 orphans, none of them new. No server of mine is left running (the :5350 dev server was started and stopped by PID).

## Files, tools, how to re-run

- Code: `src/audio/pass/` (`passSwitch`, `passTypes`, `passRecipes`, `passPlanner`, `passMix`, `passMixer`, `passLog`, `passMask`, `passResults`, `passTitles`), `src/engine/PassBeats.ts`, `src/story/scripts/seymour-flux-pass.ts`; hooks in `AudioManager`, `sfxSource`, `SfxSprites`, `VoiceBank`, `VoiceDirector`, `BattlePresenterSfx` / `Beats` / `Ports` / `SpellFx`, `SkillTravel`, `battleSfxVoice`, `BattleScreen`, `BattleScreenSetup`, `resultsMusic`, `sfxGame`, `motionSfxSink`, `demoAttract`, `MusicPlayer`, `feelApi`.
- Tools (Node + ffmpeg; `FFMPEG_PATH` or the repo's usual `D:/Tools/FFmpeg`): `tools/audio/pass-dsp.mjs` (decode, shape, K-weighted loudness, true peak, bands), `pass-render.mjs hits|tune|ui`, `voice-pass-install.mjs`.
- Scratch (not committed): `D:/Tools/pyrefly-scratch/2026-10-22/audio/` `PICKS.md`, `picks.json`, `measure/` (the runs, `tools/` the recorder: `run-trace.mjs` taps the master, `step-capture.mjs` steps 60 Hz, `analyze-run.mjs`, `analyze-step.mjs`, `make-clips.mjs`, `make-excerpts.mjs`; `library.json`, `heads.json`, `hits.json`, `ui.json`, `speech-band.json`), `voice/` (the lines, refs, raw takes, selection, shipped), `tools/` (`picks-data.mjs`, `build-picks.mjs`, `build-audition.mjs`).
- A fight with the master tapped: serve the tree, take the `RIG-RECORD` lock, `node measure/tools/run-trace.mjs --job=ch1win --tag=x --query="?demo=1&pack=demo&coach=off"`; `analyze-run.mjs ch1win-x` prints the table above.

## Booth

Press **T** once at the start of the day and after each reset: the title music and the attract reel have no sound until a key, click or touch, and T keeps you on the title.

## Suggested CHANGELOG line (when this ships)

> **Both games (Chapter I and Chapter IV, with `?pack=demo`):** a new sound pass: hits with a crack or a body and a small accent per character, a short dip of the music before a big blow, one family of menu sounds, the music ducked further under a voice, and nine new battle lines (Seymour's taunts, Yuna's and Kimahri's Talk); Chapter I's win has one fanfare and Chapter IV's win is silent, as in the original.
