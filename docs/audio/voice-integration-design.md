# Voice integration design

**A design only: no code was written and no game file was touched** (groundwork for `elevenlabs-plan.md`; Bailey, 2026-10-07: "For music voice overs use Eleven Labs
please"). It says how a recorded line would play with the dialogue box the game already has, what has to change in which file, and what to test. Everything it cites was read
at `origin/main` c745566a.

**Game case: both.** The plumbing is shared (`src/story`, `src/ui/common/DialogueBox.ts`, `src/audio`); the cast, the pacing and a few rules differ by game, and the section "FFX
and FFX-2" says exactly where (rule 14).

## What exists today

| Piece | File | Fact the design depends on |
|---|---|---|
| The script says who and what | `src/story/dsl.ts` | `SayStep { who, text, emotion?, auto?, voiceKey?, fallback? }`; `NarrateStep { text, auto? }`. `voiceKey` is already there: "Optional VO/clip key for a future voice pass. Unused today." Two lines use it (`yuna-lenne-doubled`). |
| The box shows it | `src/ui/common/DialogueBox.ts` | `say(step)`/`narrate(step)` call `beginLine`; text types at 42 characters a second (`typewriter.ts`); `enterWaiting` sets the hold: the line's own `auto`, else the AUTO toggle's reading-speed hold (900 to 4,200 ms), else it waits for Confirm; `advance()` is Confirm (first press finishes the typing, second press moves on); `hide()` drops everything. |
| The runner drives the box | `src/story/runner/CutsceneRunner.ts` | `await race(dialogue.say(step))`; `skip()` makes every later timed step resolve at once; `nudge()` is one Confirm during a `beat`; `setInstant(true)` is the mid-battle "skip" speed. **`say` is still called while skipped**, and only its wait is raced away. |
| Mid-battle beats | `src/app/screens/BattleScreenCutscenes.ts` | the same box as a line card; every authored line carries its own `auto` (a story test enforces it) and in auto mode `timed()` gives any line without one 1,200 ms; `lineDeadlineMs = typing + auto + 600 ms`; the beat is capped at 8 s (a chain seam 26 s) by `registry.ts` and the story tests. Three modes: manual, auto (auto-battle, captures), instant (no viewer). |
| Victory quips | `src/app/screens/ResultsScreen.ts`, `ui/common/resultsMath.ts` | one line per victory from `victoryQuips[member]`, rotating with the save's attempts; silent chapter 4; grim chapters keep only the grim variants. |
| Audio | `src/audio/AudioManager.ts` | graph: `musicBus -> duckBus -> master`, `sfxBus -> master`, a limiter last; `duck(amount, seconds)`/`unduck(seconds)` exist (only the pause screen calls them); `setMuted` is on `master`; `applySettings` pushes `masterVolume`, `musicVolume`, `sfxVolume`; `installUnlockListeners` arms `pointerdown/up, keydown, touchstart/end, click` until the context runs; `padUnlock.ts` adds a gamepad press. |
| Settings | `src/app/SaveData.ts`, `app/screens/pause/settings.ts` | `Settings` merges onto `defaultSettings()` on load, so a new field needs no migration; the pause OPTIONS rows step a volume by `VOLUME_STEP`. |
| Shipping | `src/audio/manifest.ts`, `tools/audio/manifest-io.mjs` | `AudioManifest { music, sfx, sfxV2 }` with sprite cues `{ offset, duration }`; `AUDIO_BUDGET_BYTES = 90e6` covers music plus the sfx sprites and stands at 88.5 MB. |

THEMES.md already states the mix rule voice must obey ("Duck, do not fight. Music drops 3.5 dB under dialogue, 120 ms attack, 400 ms release") **and nothing implements it for
dialogue**: `duck` is only called by the pause screen.

## 1. Line ids, keys and files

Two names, for two jobs.

- **The line id** (`seymour-flux.pre.017`) is the human and file name. It is assigned once by `tools/audio/voice-inventory.mjs` and pinned in
  `docs/audio/voice-line-inventory.json`: an unchanged line keeps its id, an edited or removed line is retired (its id is never reused), a new line takes the next number in its
  script. Stand-ins are `<id>.fb1`, `.fb2`. Quips are `<chapter>.quip-<member>.NNN`. An edit is a new id on purpose: the old recording no longer says what the box prints.
- **The runtime key** is `hash53(speaker + NUL + text)`, the 14-hex `textHash` already in the inventory, computed from what the box holds (`SayStep.who` and `.text`; for
  `narrate`, `who` is `narrator`). No script changes: the runtime looks the key up in the chapter's voice manifest, which maps it to the id, the file and the duration. A changed line
  simply misses (silent, subtitle only) and a unit test fails the build until it is re-recorded and the inventory regenerated. `SayStep.voiceKey`, when present, **wins**: that is how
  the two doubled lines and any line that must pick one of two takes of the same words are named. `hash53` is cyrb53 (public domain), 12 lines, the same function the tool uses; it moves
  into `src/story/voiceKey.ts` with a test that pins it to the inventory.

Identical (voice, text) pairs share one recording (the inventory counts them once: 28,398 unique characters of 28,851). Stand-in lines are recorded by the stand-in's own voice.

## 2. Where the files live

```
D:/Tools/elevenlabs/candidates/<date>/...        raw candidates: never in the repo, never under public/
D:/Tools/elevenlabs/masters/<id>.mp3             the picked raw take, kept as the master (a private repo like the art one, if Bailey wants history)
public/audio/voice/<chapter-key>/<line-id>.mp3   shipped: mono, 24 kHz, 64 kbps, loudness-matched (about 8 KB a second)
public/audio/voice/<chapter-key>.json            the chapter's manifest: { key -> { id, file, ms, treatment } }
```

Why per-line files and not a sprite like the SFX bank: a chapter's speech is 1.5 to 3.3 minutes, which decodes to 17 to 38 MB of audio on a phone as one buffer (mono at the
context rate), and a scene only needs its next few lines. Per-line files are decoded on demand from a small LRU (cap 16 MB), and a chapter manifest is a few KB. The cost is
about 1,000 small requests over a whole playthrough, which HTTP/2 on Cloudflare absorbs; if a measurement says otherwise, per-scene sprites are the fallback (`SfxSprites.ts` is the
pattern).

**Size and budget.** 28,851 voiced characters at 15 characters a second is about 32 minutes of speech: roughly **15 MB** at 64 kbps mono, **more than the 1.5 MB left** under the 90 MB cap.
Voice needs its **own budget line** (proposal: 20 MB, loaded lazily per chapter, never at first load), a decision for Bailey (and `AUDIO_BUDGET_BYTES` plus
`tests/unit/audio-shipped-files.test.ts` change with it). Replacing music with ElevenLabs music is bytes for bytes inside the existing 88.5 MB.

## 3. Playback: one bus, one handle

Additions to `AudioManager` (and nothing else in the graph moves):

- `voiceBus` (a `GainNode`) into `master`, **not** through `duckBus`, so ducking the music never ducks the voice. Gain is `voiceVolume` (new setting, default 0.9, stepped like the others).
  A small send (about 0.10) to the same hall convolver the SFX use, so a line sits in the room the score was mixed in. The `farplane`, `inside-sin`, `transformed`, `narration` and
  `doubled-with-lenne` treatments are **baked into the shipped file** by the ship chain (`voice-casting.md`), not applied at runtime.
- `playVoice(clip, { volume })` returns a handle `{ done: Promise<void>, durationMs, stop(fadeMs), pause(), resume() }`. `pause()` records the elapsed time and stops the source;
  `resume()` restarts at that offset (an `AudioBufferSourceNode` cannot pause). A line that cannot start (context suspended, file missing, decode failed) returns a handle that
  is already done: **a voice failure is never a wait**, the line shows and advances as it does today, and the failure is logged once per id (the `overrunLogged` pattern).
- `debug()` gains a `voice` block (clips cached, bytes, the last 40 plays: id, started, ended, why it ended) so the hook-up is provable without ears, as `sfxLog` does.

**Ducking.** A voiced line calls `duck(0.668, 0.12)` (-3.5 dB, 120 ms) when it starts and `unduck(0.4)` when the last voiced line of a run ends. Consecutive lines less than 600 ms
apart keep the duck (a hold timer, so the music does not pump between lines of one exchange). Mid-battle beats duck the music but leave the SFX bus alone.

**Mute and volume.** `setMuted` already zeroes `master`, so it silences voice too. Voice volume 0 is "text only" and is a real setting for the player; there is no separate on/off.
`applySettings` takes `voiceVolume`; the pause OPTIONS screen gets a VOICE row beside MUSIC and SFX.

## 4. The box: start, wait, advance, skip

`DialogueBox` takes one new optional dependency, `voice?: VoicePort` (the way it already takes `nameFor`). The flow per line:

1. `beginLine`: look up the clip (`voiceKey` first, else the hash). If there is one and the context is running and the runner is not skipped or instant, start it. **The text types exactly as
   it does today, from the same instant**; the voice does not pace it (option B below).
2. `enterWaiting`: the hold becomes `max(today's hold, voiceEnd + 200 ms)`: a spoken line is never cut by its own `auto`. If the box waits on Confirm, nothing changes.
3. Confirm while typing finishes the text and leaves the voice playing. Confirm while the line waits advances, and the voice stops with a 60 ms fade; a line is never allowed to talk over
   the next one.
4. `hide()` (skip-scene teardown) stops the voice. While `runner.skipped` or `setInstant(true)`, no voice starts: the runner should not call `dialogue.say` at all once skipped (a
   small change: today it calls and races the wait away, so a skipped scene would otherwise start a voice per line).
5. Pause (the pause overlay opens over a scene or a beat): `voice.pause()`, and `resume()` on close. A hidden tab pauses it too.

**Interrupted lines (FFX-2 banter).** A line that ends on a dash ("So if we just—") is recorded cut off; when it is followed by an `auto` line of 1.3 s or less, the next voice may start up to 150 ms
before the interrupted one ends, which is how the banter overlaps without a second channel. 15 voiced lines end on a dash.

**Three behaviours Bailey can choose from (end state first, rule 9).** They are pictures and a few lines of play until he picks; nothing is built before.
- **A (recommended): the text types as today, the voice speaks beside it.** Nothing about the text's feel changes; the voice is a pure addition and the budgets are the only pressure.
- **B: the text follows the voice.** The reveal rate is chosen so the last letter lands when the voice ends. It reads like subtitles; it needs the recorded duration and ignores the text-speed setting.
- **C: the whole line appears at once when the voice starts.** The most common in games with voice; it loses the typewriter that the Ink & Gold box is built around.

**Subtitles stay.** The box always shows the line. There is no voice-only mode. The name plate, the portrait, the role tag and the `Farplane` plate are unchanged.

## 5. Mid-battle beats and the time budget

`MID_SCRIPT_BUDGET_MS` is 8 s (a seam 26 s) and the story tests enforce it from `typing + auto`. A spoken line can outlast its typed text, so the budget must be computed from the recorded
duration: `scriptDurationMs` (`registry.ts`) and `lineDeadlineMs` (`BattleScreenCutscenes.ts`) both take an optional `voiceMsFor(step)`. At a planning rate of 15 characters a second,
**11 of the 117 beats overflow once voiced** (`voice-line-inventory.md` lists them: `braskas-final-aeon.mid-jecht-falls`, `mid-valefor-enters`, `mid-yu-yevon-arrives`,
`ffx2-vegnagun-shuyin.mid-head-down`, `mid-shuyin-appears` (33 s against 26), `ffx2-leblanc.mid-first-not-so-mighty-guard`, `mid-first-no-love-lost`, `mid-logos-down`, `mid-ormi-down`,
`ffx2-fallen-aeons.mid-anima-entrance`, `ffx2-trema.mid-paragon-falls` (32 s against 26)) and 38 more grow by over half a second. For each: shorten or split the script (a writing
decision, like adding to `CHAIN_SEAMS`), or raise its budget. Nothing is changed tonight. The cap stays a hard cap: a beat that runs over is cut and the fight resumes, the voice fading out.

The beat's budget and its line deadlines run on scene time (`update(dt)`), the voice on the audio clock, so a stalled frame loop can let the two drift; the existing stall guard (`FRAME_STALL_MS`)
still ends the beat, and the voice fades out with it.

## 6. Preload

- At chapter start (during party prep and the loading card, where `battlePreload.ts` already warms art): fetch the chapter manifest and decode **every mid-battle and quip line** of the chapter
  (20 to 60 lines, under 1.5 MB decoded). A mid-battle beat must start with no latency.
- A scene is a known list: when a line begins, decode the next four voiced lines of that script (`walk` in the inventory tool is the same traversal).
- Stand-ins are small and preloaded with the mid-battle set.
- The LRU keeps 16 MB of decoded buffers and drops the oldest scene line first.

## 7. Phones and autoplay

- Audio starts only from a gesture: `installUnlockListeners` already arms `touchend` and `click` until the context runs, and the first line of any scene comes after at least one tap
  (title, chapter select, party prep). **A voice never queues across an unlock**: if the context is suspended when a line begins (a resumed tab), try `unlock()` once, and if it is still not
  running, the line is text only. A burst of old lines must never play when audio wakes.
- iOS Safari mutes Web Audio when the ringer switch is on silent (the music has the same property). Voice is then silent and the subtitles carry the scene, which is the reason subtitles stay.
- Decoding a 3 to 8 s mono clip is quick; the 16 MB LRU keeps phone memory flat.
- A gamepad press unlocks through `padUnlock.ts` as it does for music.

## 8. FFX and FFX-2: what differs

| | FFX | FFX-2 |
|---|---|---|
| Cast | Tidus, Yuna, Rikku and the narrator (Tidus looking back) | `yuna-x2`, `rikku-x2`, and the narration is Yuna's (20 lines, to confirm) |
| Pace | silence is a weapon: every `beat()` and `wait()` stays silent, a voice never fills one; long holds; the "Yes." beat | overlapping banter: short `auto` holds, interrupted lines, three-beat jokes |
| Chapter V extras | none | Farplane voices (7 lines, baked treatment); two doubled lines; the glen's fayth boy |
| Quips | grim chapters keep only grim quips (existing rule) | chapter 4 results are silent: no quip, no voice |
| Where the music ducks | under every spoken line | the same; the hybrid cues are louder, so check the duck depth by ear in Chapters 5 and 6 |

A change true to one game applies to that game only (rule 14); the manifest is per chapter, so each chapter names its own game.

## 9. What to test

Pure unit tests (the repo's pattern):
- `hash53` agrees with the inventory for every line; every voiced line in the scripts has a manifest entry (and no entry is orphaned); `tools/audio/voice-inventory.mjs --check` is current.
- The budget model with durations: no beat exceeds its budget except those on an explicit list.
- A voice handle that fails resolves at once; a suspended context starts nothing; `skipped` and instant start nothing.

Real input in a browser (a screenshot or a log, never "it compiled"):
- Advance with Confirm during typing, during the voice, after the voice; hold-to-skip; the pause menu opening mid-line and closing; the AUTO toggle; the phone layout with a tap and the
  gamepad.
- The music duck: read `audio.debug()` for the duck bus gain and the voice block, and confirm the unduck 400 ms after the last line of a run.
- A mid-battle beat in auto-battle: the line is not cut by `LINE_GRACE_MS`, the fight resumes after the voice, the beat respects its cap.
- Mute, voice 0, master 0; iOS silent switch; a backgrounded tab; a slow network (the line shows and advances without its voice).
- The two doubled lines and the Farplane lines through the real ship chain; loudness of every file (target -19 LUFS integrated for a line, true peak at most -1 dBTP, measured as the other
  assets are) and no clipping, silence of more than 400 ms inside a line, or a duration more than 30 percent off the estimate.
- A listening session by Bailey for the casting, pacing and mix: **agents cannot hear**, so every number above is a gate, and the verdict is his.

## 10. Order of work, once Bailey says yes

1. The pilot (plan, section 4): voices, then a scene read-through, then the one-scene prototype of A, B, C above. No game code before he picks.
2. `voiceKey.ts`, the voice manifest and its loader, the `voiceBus`, `playVoice`, the setting and the pause row, the box's `voice` dependency and the runner's skipped guard.
3. Budgets and the 11 overflowing beats (writers' decisions).
4. Chapter by chapter in the plan's order, each with its manifest, loudness gate and browser proof; FFX and FFX-2 separately.
