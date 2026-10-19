# r395-voice: Tidus, Yuna and Auron speak in the FFX chapters

Branch `r395-voice`, from `origin/r393-int` 0293cbc1 (live 39.3), plus the groundwork commit `e886f6ad` of `elevenlabs-groundwork` cherry-picked unchanged (the inventory, the plan, the casting sheet and the dry-run client this build reads; it is `0a31c869` here). **Game case: FFX only for the voices** (Bailey picked them against the real FFX; FFX-2 Yuna and every other speaker stay text only until he picks), **both for the plumbing** (rule 14). Pushed, **not merged, not deployed**. Release 39.4 is being built separately; the files both could touch are listed at the end.

Bailey, 2026-10-07 about 10:00 EDT, verbatim: "add tidus, yuna, and auron voiced lines in the game stat!" and, from the side-by-side with the real FFX, "Tidus: B / Yuna: B / Auron: B".

## Where it stands

**Built, tested, and silent.** The game, the generator and the ship step are finished and wired; **no recording exists yet**, because the paid ElevenLabs calls are the driver's. Until `public/audio/voice/` is installed the game plays exactly as 39.3 does (no manifest means no voice, not an error). **Nothing was run in a browser and nothing was heard** (the brief: no browser until the audio exists; rule 13). The first browser pass and Bailey's ear are owed once the files are in.

### To get sound in the game (the driver)

```
cd D:/pyrefly-critic-continuity                        # this branch's worktree
node tools/audio/voice-generate.mjs                    # dry run: the plan and the estimate (no key read, nothing sent)
node tools/audio/voice-generate.mjs --limit 6 --out D:/Tools/elevenlabs/candidates/voice-ffx-2026-10-07 --yes --max-credits 400    # optional canary: listen before the rest
node tools/audio/voice-generate.mjs --out D:/Tools/elevenlabs/candidates/voice-ffx-2026-10-07 --yes --max-credits 6100             # THE LIVE RUN (about 5,510 credits)
node tools/audio/voice-ship.mjs --dir D:/Tools/elevenlabs/candidates/voice-ffx-2026-10-07                                           # check: measures everything, writes nothing
node tools/audio/voice-ship.mjs --dir D:/Tools/elevenlabs/candidates/voice-ffx-2026-10-07 --install                                # installs public/audio/voice/ and the report
```

The live run skips every file already on disk and stops at the first failure, so after any failure the same command carries on. If `voice-ship` refuses a beat (below) it prints the lines to `--mute`. Then run `node node_modules/typescript/bin/tsc --noEmit`, the voice tests (`npx vitest run tests/unit/audio-voice-shipped.test.ts` runs for the first time once files exist), `node tools/audio/qa.mjs --strict`, and the browser pass in "Owed" below. Commit the installed `public/audio/voice/` and `docs/audio/voice-ffx-ship-report.json` (both are meant to be tracked: `public/audio` is tracked in git, unlike `public/art`).

## The lines

`docs/audio/voice-ffx-plan.md` lists every recording (id, chapter, voice, characters, text); the tool regenerates it and a unit test fails if it goes stale.

| | Lines in the inventory | Lines the game can show | Recordings | Characters billed |
|---|---|---|---|---|
| `tidus` | 88 | 78 | 75 | 2,121 |
| `yuna` | 72 | 67 | 63 | 1,745 |
| `auron` | 76 | 70 | 65 | 1,644 |
| **total** | **236** | **215** | **203** | **5,510** |

- 21 victory quips are left out: `victoryLine` serves only the first line of a member's bank (Bailey's pick, PR-0021), so a later quip can never be heard. `--include-unserved-quips` adds them the day the rotation opens.
- 12 repeats ("...Okay. Next one." closes four chapters) share one take. Stand-in lines (a benched speaker's place taken by Tidus, Yuna or Auron) are recorded in the stand-in's own voice; 24 of the 215.
- **Estimate:** model `eleven_v4`, one take per line, 1 credit a character: **5,510 credits, about $0.44** at the API list price (the v4 promotion to 2026-10-12 is not assumed). The cap printed, 6,100, is the estimate plus 10 percent. Seeds are fixed per line (from its hash), so a take can be asked for again (`--no-seed` leaves it out, as the comparison Bailey heard did, if the service ever rejects one); settings are the defaults of Bailey's side-by-side (stability 0.5, similarity 0.75), no audio tags and no context on the first pass.
- **Retakes:** `--ids a,b --take 2 [--tags] [--stitch]` writes `<id>.take2.mp3` beside take 1 (a new seed; `--tags` puts the script's emotion in as `[sadly]`; `--stitch` sends the previous and next line as context, which helps the 20 short lines, 12 one-word lines and 4 interrupted ones among the recordings). A `picks.json` in the folder (`{ "<id>": 2 }`) says which take ships. `--stitch` is untried against v4 (the docs mention it for other models); a rejected request stops the batch before a credit is spent.
- Why a new tool and not `elevenlabs.mjs tts`: 203 ids do not fit a command line, a rerun must not re-spend, and the picks (`voices.json` `_picked`) should be read, not typed. It imports that client's lib unchanged and obeys the same gates (both `--yes` and `--max-credits`, files outside the repo and never under `public/`, the key sent only to api.elevenlabs.io or a loopback server, each call logged to `usage.jsonl`). **Voice ids are never printed or committed.** The other session's uncommitted edits to `elevenlabs.mjs` and `elevenlabs-lib.mjs` in `D:/pyrefly-elevenlabs` were not touched and do not conflict.

## How a line plays (design behaviour A, the recommended one)

| | |
|---|---|
| Start | The recording begins at the same instant the text starts typing; the text does not wait for it. |
| Hold | An auto-advancing line (its own `auto`, or the AUTO toggle's reading hold) is held until its voice is done plus 200 ms. A line that waits for Confirm is unchanged. |
| Confirm | While the text types it only finishes the text and the voice keeps going; once the line waits it advances and the voice fades out in 60 ms. A line never talks over the next one. |
| Skip | `runner.skip()`, SKIP SCENE and a held Confirm gate the voice off (the runner keeps calling `say` after a skip, so the port is gated on `runner.skipped`, not the runner changed; its tests assert that). The line in flight stops at once. |
| Pause | The pause menu freezes the line where it is and resumes it on close; a hidden tab does the same. Both holds are counted, it resumes when both let go. |
| Music | Ducks 3.5 dB over 120 ms under a line, held 600 ms past the last one of an exchange (no pumping), back over 400 ms. The pause menu keeps its own duck. The voice bus feeds `master`, not the duck bus. |
| Failure | A voice failure is never a wait or a crash: no recording, voice off, no context, a context that is not running (one `unlock()` try, never queued), a decode that fails, a file later than 1.2 s, a stalled clock, anything the port throws: the line shows and advances as it always did. |
| Phone | Audio starts only from a gesture as before; a resumed tab never plays old lines when audio wakes. iOS's silent switch silences voice like the music (the subtitles are why they stay). Decoding is per line from a 24 MB cache; a chapter's mid-battle and victory lines are pinned (the largest set, Chapter III's, is about 12 MB decoded at 48 kHz, so the design's 16 MB would be too tight). |
| Results | The member's victory quip speaks when the results page opens (FFX; a silent chapter serves none). |

`audio.debug().voice` shows the chapter, the cache, the ducking and the last 40 plays (id, heard, why it ended), so the hook-up is provable without ears.

## Mid-battle beats: which overflow, and how they are handled

The design counted 11 of 117 beats over budget once every voice speaks. With only these three voices, from the planning estimate (15 characters a second, replaced by the real lengths at the ship step):

| Beat | Game | Budget | Authored | Voiced, 3 voices | Handling |
|---|---|---|---|---|---|
| `braskas-final-aeon.mid-valefor-enters` | FFX (seam) | 26.0 s | 23.9 s | 26.7 s | **extended** by 0.7 s |
| `braskas-final-aeon.mid-yu-yevon-arrives` | FFX | 8.0 s | 7.0 s | 9.1 s | **extended** by 1.1 s |
| `braskas-final-aeon.mid-jecht-falls` | FFX (seam) | 26.0 s | 23.3 s | 25.0 s | fits (Jecht and Braska are unvoiced) |
| the other 8 of the 11 | FFX-2 | | | | untouched: FFX-2 is unvoiced |

Fourteen more FFX beats grow by over half a second and still fit (yunalesca-form-3, bfa-sword, jecht-falls, ixion-enters, bahamut-falls, mac-anima-summon, evrae-haste-phase, the three natus-talk beats, omnis-disc-lesson, pterya-called, right-fin-down, sin-first-pull).

- **Policy** (`src/story/voice/voiceBudget.ts`, one module for the runtime, the ship step and the tests): a voiced beat that fits keeps its budget; one that passes it by no more than **3 s (an interrupt) or 1.5 s (a seam)** is **extended**: the runtime gives it its voiced length plus the usual 1.5 s grace (`midBattleDeadlineMs` with the voice), up to that ceiling and no further (the cap stays a hard cap, and the presenter's 30 s abandon budget stays out of reach); one beyond the ceiling is **refused** by the ship step, which prints the beat's spoken lines longest first and the `--mute` command (those recordings are left out, so those lines stay text only).
- A line's own deadline in auto-battle (`lineDeadlineMs`) runs to the end of its voice; the beat is costed on the longest of a line's written speaker and its authored stand-ins, since who speaks is decided as the beat plays. `'skip'` playback speaks nothing.
- **The real answer comes with the real durations.** `voice-ship` prints `EXTENDED` and `OVER` per beat and the report lists them; `tests/unit/audio-voice-shipped.test.ts` fails any beat that is over and fails when the report's list of extended beats differs from the recomputed one.

## The asset pipeline

- **Where:** `public/audio/voice/<chapter>/<line id>.mp3`, `public/audio/voice/<chapter>.json` (key to `{ id, file, ms, bytes, who }`, the key being `lineKey(speaker, text)`, the inventory's `textHash`; a repeated line points at the first occurrence's file), `index.json`. The brief said `public/audio/voice/<line id>.<ext>`; the design's per-chapter folders are used instead, because a chapter's manifest names its own files and a repeated line shares a file across chapters. `public/audio` is **tracked in git** (music, sfx sprites, `manifest.json`), unlike `public/art`, so these are committed the same way.
- **Format:** mono, 24 kHz, 64 kbps MP3 (the music's format; about 8 KB a second), silence cut to a fixed 35 ms head and 90 ms tail, 4 ms and 25 ms fades, **-19 LUFS integrated (the design's dialogue target), true peak at most -1 dBTP**, measured on the file as a browser decodes it with the project's own BS.1770 code (`measure.mjs`). Loudness is **dual mono**, which is how Web Audio plays a mono buffer through the stereo graph and what makes it comparable with the music's -16 LUFS stereo; ffmpeg's `ebur128` on the same file reads 3 dB lower because it pans mono down 3 dB (cross-checked). Deterministic: the same candidates give byte-identical files.
- **Gates** (agents cannot hear, so these are the numbers): a true peak over the ceiling, clipping, 400 ms of silence inside a line or a line under 150 ms **fail** (`--accept id` passes a reviewed one); loudness more than 1.5 LU off, a peak-limited line, or a length 30 percent off the planning estimate **warn** for Bailey's ear and the retake pass.
- **Size and budget:** measured on synthetic stand-ins (203 files, 443 s): **3.7 MB at 64 kbps, about 8.3 KB a second**; the real figure is the planning estimate (418 s of speech plus the padding) within roughly 15 percent. The 90 MB cap holds music and the sfx sprites at **88.49 MB, 1.51 MB of room**, so this does not fit in it. **Proposal for Bailey, not decided and not silent: a separate voice budget line, `VOICE_BUDGET_BYTES` = 20 MB (the design's number; the whole game's voice is about 15 MB), beside the untouched `AUDIO_BUDGET_BYTES` = 90 MB.** It is in `tools/audio/manifest-io.mjs`; `tools/audio/voice-audit.mjs` enforces it; `qa.mjs --strict` (the deploy preflight) now runs the audit and no longer calls the voice folder an orphan of the music manifest (checked green with a synthetic install). Total shipped audio would be about 92.2 MB. The site has far more room (the D-332 cap is 800 MB).

## Settings

`Settings.voiceOn` (default **true**) and `Settings.voiceVolume` (0.9): a save older than the setting reads ON, a malformed value repairs to the default, no migration or version change. Pause OPTIONS gets **VOICE** (a level, stepped like the others; 0 is text only) and **VOICE-OVER** (ON/OFF, flips either way so Confirm works) under SOUND EFFECTS, **in FFX chapters only** (FFX-2 and FF7 have no recorded voice to switch, rule 14; one list, `GAMES_WITH_VOICE`). The existing mute silences the voice through `master`. Turning either off, or the level to 0, stops a line already speaking. `audio.debug().voiceVolume` is a new sibling of `volumes` (whose exact shape a test pins).

## What was built (files)

| Area | Files |
|---|---|
| Runtime, pure | `src/story/voice/` `voiceKey.ts` (cyrb53, `lineKey`, pinned to every inventory row), `voiceManifest.ts` (defensive parse, safe paths, `GAMES_WITH_VOICE`), `voicePort.ts` (the box's port, `gatedVoice`), `voiceBudget.ts` (the beat policy) |
| Runtime, audio | `src/audio/voice/` `VoiceBank.ts` (fetch, decode, LRU, pin, in-flight dedupe), `VoiceRun.ts` (one line: fade, pause, hold clock, watchdog), `VoiceDirector.ts` (the port: chapter, ducking, preload, debug), `index.ts` (the singleton on the one mixer) |
| Shared plumbing, edited | `AudioManager.ts` (voice bus, level, switch, debug), `DialogueBox.ts` + `src/ui/common/dialogueVoice.ts`, `registry.ts` (`spokenMs` in the duration model and `midBattleDeadlineMs`), `BattleScreenCutscenes.ts`, `CutsceneScreen.ts`, `BattleScreen.ts`, `BattleScreenFlow.ts` + `src/app/voiceChapter.ts`, `ResultsScreen.ts`, `SaveData.ts`, `PauseScreenPanels.ts`, `pause/panels.ts`, `pause/settings.ts` |
| Tools | `tools/audio/voice-lib.mjs`, `voice-generate.mjs`, `voice-ship-lib.mjs`, `voice-ship.mjs`, `voice-audit.mjs`; `manifest-io.mjs` (the budget line), `qa.mjs` (the audit) |
| Docs | `docs/audio/voice-ffx-plan.md` (generated), `docs/AUDIO-GUIDE.md` (a section), this note |

`DialogueBox.ts` goes from 388 to 396 lines and `registry.ts` stays at 399, inside the 400-line house limit; `dsl.ts` and `CutsceneRunner.ts` are not touched, so there is no CONTRACT-CHANGES entry.

## Tests

Fourteen new files: `voice-key` (the key equals every inventory row), `voice-manifest`, `voice-bank`, `voice-run`, `voice-director` (ducking, skip, pause, unlock, preload, no request for an FFX-2 chapter), `dialogue-box-voice` (jsdom), `voice-midbattle` (the real runner and box, stand-ins, `'skip'`), `voice-budget`, `voice-settings` (defaults, upgrade, persistence, mixer, rows, adjust), `voice-chapter-wiring` (every one of the 19 chapters against a `fetch` spy: FFX asks for its own manifest, FFX-2, FF7 and the experimental Leblanc chapter ask for nothing), `voice-generate` (selection, pricing, the CLI dry, and live against a loopback mock server: both flags, the cap, loopback-only, request shape, skip-existing, retake, stop-and-resume), `voice-ship` (trim, BS.1770, gain and ceiling, the encode, determinism, the audit, the CLI), `voice-inventory-current` (the design's gate: an edited line must regenerate the inventory), and `audio-voice-shipped` (skipped until files exist; verified against a synthetic install, then removed).

**174 tests in the 14 files**: 169 run today; the 5 installed-voice checks in `audio-voice-shipped` skip until audio exists (they passed against a synthetic 200-file install, as did `node tools/audio/qa.mjs --strict`, then it was removed). `tsc --noEmit` is clean.

**The full suite, run once** (925 files, 41 minutes, on a machine every agent was loading): 894 files passed and 26 failed, and all 26 are accounted for.
- **3 were mine, now fixed:** the old-save upgrade lists in `save-fx-looks`, `save-fx-parts` and `save-comfort-migration` name exactly the keys a release-29 to 35 save gains on loading; they now include `voiceOn` and `voiceVolume` (66 tests green).
- **15 pass alone** (timeouts under the load): advisor-floor, advisor-menu, ffx2-ability-flags, sin-fins-core-bench, art-exact, art-verify, exp-art-sync, ff7-judge-repair, pause-living-portraits-live, ui-coach-dark-launch, audio-manifest-io, audio-tempo, critic-release-rules, ui-ffx2-atbmode, ui-ffx-zanmato-gauge.
- **8 fail alone, on painted-art hashes or measurements:** `pose-install-0926`, `-0930`, `-bosses-0926`, `-songstress-0929`, `-thief-0926`, `pose-scale-art`, `macalania-ship` and one row of `exp-leblanc`. This worktree's `public/art` is a junction into `D:pyrefly-r39-intpublicart`, where the art track installed paintings this morning (08:33), so the hashes the repo records no longer match. They read nothing this build touched.
- Then 125 related files (every voice, audio, pause, save, story, cutscene, results, dialogue and mid-battle test) were re-run on the final code: 1,698 passed.

## Decisions that are Bailey's

1. **How text and voice relate (design A, B or C).** Built: **A**, the text types as today and the voice speaks beside it (a 30-character line types in 0.7 s and speaks for about 2.3 s, so the box holds). B (the text follows the voice, like subtitles) and C (the whole line at once) are not built; each is a few lines in the box and could be a `?voicetext=` URL option like `?sfxmix=` so he can compare them in the running game.
2. **The voice budget line** (above): 20 MB separate, or raise the one cap.
3. **The level.** -19 LUFS is the design's number, unheard. With the music at -16 LUFS and sliders at their defaults the voice sits about 2.7 dB above the ducked music; if it reads buried, `--target-lufs -16` and a rerun is a minute (peaks may then limit some lines). He can lower it with VOICE but never raise it past full.
4. **64 kbps mono at 24 kHz** is the design's choice; the ship tool takes `--bitrate`. If a line sounds worse than the preview he picked, that is the first suspect.
5. **Which retakes.** The 20 short lines, 12 one-word lines, 4 interrupted ones and the one vocalization ("Hmph.") are the likely flags; a retake is the command above.

## Not built, owed, and risks

- **Browser pass owed after the files exist:** a real-input run of a pre-battle scene (Confirm while typing, while speaking, after; hold-to-skip; SKIP SCENE; the pause menu mid-line; AUTO), a mid-battle beat in auto-battle (the two extended beats), the results quip, `audio.debug().voice` for the duck and the plays, mute and VOICE 0, a phone (tap to start, the two extra OPTIONS rows at phone size, the iOS silent switch), a hidden tab, and a slow network. Two extra rows in the pause column were not laid out in a browser.
- **Not built:** the design's hall-reverb send on the voice bus (the convolver returns through the SFX bus, so it would follow the SFX slider; the voice is dry); behaviours B and C; the narrator, `young-auron`, FFX-2 Yuna and every other speaker; Farplane, doubled and other treatments; a caption narrator.
- **Unverified:** that ElevenLabs accepts `previous_text`/`next_text` with `eleven_v4` (only the retake uses it); the real durations; how any of it sounds. Nothing here has been heard.
- Merge: the shared files above are small, additive edits (`git diff --stat`: 19 tracked files, +232 -43, of which three are the old-save test lists and one a type declaration). Where 39.4 may collide: `DialogueBox.ts`, `BattleScreenCutscenes.ts`, `CutsceneScreen.ts`, `registry.ts`, `AudioManager.ts`, `SaveData.ts`, `PauseScreenPanels.ts`.
- **Review class:** `node tools/critic-plan.mjs --paths` says **DEEP before deploy**, only because `SaveData.ts` is the save-data class (two new settings with defaults and a normaliser in `migrate`; no schema or version change; the release-N save fixtures still upgrade). Also CHK-001/002/003/008/009/015/016/017/019/020/021/022/023/024. It is "both" for the plumbing, FFX for the voice; the deploy cannot go without that review.

## For the driver's records

CHANGELOG (FFX, after the files are in): "**FFX:** Tidus, Yuna and Auron speak. Their lines in the story scenes, the mid-battle callouts and the victory lines are voiced with the voices Bailey picked against the real game; the text still types beside them, Confirm moves on and fades the voice, the music dips under a line and returns, and every other speaker stays text only. OPTIONS gets VOICE and VOICE-OVER (on by default)."
NOW.md: r395-voice built and pushed, silent until the recording run; the ElevenLabs spend is the driver's (about 5,510 credits); the decisions above are Bailey's. Ledger: D-521 (ElevenLabs) is the parent; the voice budget line and the A/B/C pick are open rows; A-rows for the build, the plan and the ship tool.
