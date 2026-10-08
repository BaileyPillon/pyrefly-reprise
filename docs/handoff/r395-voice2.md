# r395-voice2: the FFX voice-over, installed on top of live 39.4.1 (not shipped)

Branch `r395-voice2` = `r395-voice` (341c05cf) merged with `origin/r394-int` (04cdcd45, live 39.4.1). Pushed, **not merged to any release branch, not deployed.**
**Game case: FFX only for the recordings** (Tidus, Yuna, Auron in the FFX chapters; Bailey picked "Tidus: B / Yuna: B / Auron: B" on 2026-10-07 after "add tidus, yuna, and auron voiced lines in the game"), **both games for the plumbing** (rule 14; FFX-2 and FF7 ask for no voice). What the plumbing is and how a line plays: [r395-voice.md](r395-voice.md) (unchanged). This note covers the merge, the installed recordings, the variant switch and what was proved in a browser.

## Decision waiting for Bailey: which take of the 81 lines

Bailey has not picked between **"as recorded"** and **"pauses shortened"** for the 81 recordings that hold a long pause (listening page `voices.html`). Installed now: **pauses shortened (`tight`), the default, because only it passes the ship gate.** In the as-recorded files the same 81 recordings hold a pause of 404 to 673 ms inside the line; the gate fails over 400 ms. The as-recorded variant installs only with those 81 findings accepted (the report lists them under `accepted`). The tight set passes with no exception, but narrowly: its longest inner pause is **397 ms** against the 400 ms limit. Nobody has heard either through the game.

**Switch (one command each way, deterministic: a rerun is a clean diff):**

```
node tools/audio/voice-variant.mjs recorded      # "as recorded" (accepts the 81 pause findings, says so)
node tools/audio/voice-variant.mjs tight         # "pauses shortened" (the default; same as no argument)
node tools/audio/voice-variant.mjs <name> --check    # measure and print, write nothing
node tools/audio/voice-variant.mjs --list        # what each variant is
```

It stages the variant as hard links in `D:/Tools/elevenlabs/candidates/voice-staging-<name>/` (`<id>.mp3` is the file `voice-ship` reads; the sources are never touched), runs `voice-ship --install --clean` with the mute list and `--variant <name>`, and the report records `variant`, `muted` and `accepted`. The two source folders, the staging folders and the mute list are data in `tools/audio/voice-variants.json`. After a switch run the voice tests and `node tools/audio/qa.mjs --strict`, and commit `public/audio/voice/` and `docs/audio/voice-ffx-ship-report.json`. Both directions were run for real: `recorded` installed (200 files, 3.69 MB, the report says `variant: recorded` and lists 81 accepted ids; 93 paths differ from the committed tree), then `tight` again, which returned the tree to **zero** diff (byte-identical files, manifests and report).

## Merge: conflicts and how they were resolved

`git merge origin/r394-int` into `r395-voice` (merge base 0293cbc1): **one textual conflict**, in `src/app/screens/BattleScreenFlow.ts`, `GameFlow.runChapter`:

- r395-voice wraps the release: `sfxChapter(id, voiceChapter(id, holdIdleLane()))` (the chapter's voice-over manifest, FFX only).
- r394-int adds `const endRun = getChapter(id)?.experimental ? beginExperimentRun() : () => undefined` and `.finally(() => { release(); endRun(); })` (a hidden run keeps the coach's memory off the save, F393-05).
- **Kept both**: the release is still wrapped in `voiceChapter`, and the experiment's run still ends with `endRun`.

The other collisions the brief expected did not occur: r394-int never touched `DialogueBox`, `BattleScreenCutscenes`, `CutsceneScreen`, `registry`, `AudioManager`, `SaveData` or `PauseScreenPanels`. Files both sides changed that git merged cleanly and were checked: `BattleScreen.ts` (r394 passes `scene.slots.advisorCap` to `createHud`; voice adds its own line elsewhere in the file), `tools/audio/manifest-io.mjs` and `.d.mts` (r394's external-source helpers beside the voice budget line), `tools/audio/qa.mjs` (r394's freshness exemption beside the voice audit). `tsc --noEmit` is clean on the merge. Pre-existing size exceptions, not new: `BattleScreenCutscenes.ts` (529 lines; 504 on r394-int), `CutsceneScreen.ts` (460; 452), `BattleScreenFlow.ts` (536).

## What was installed

`node tools/audio/voice-variant.mjs` (the default): **200 files, 3,600,544 bytes (3.43 MiB), 433 s of speech**, 11 chapter manifests (`public/audio/voice/<chapter>.json`), `index.json`, and `docs/audio/voice-ffx-ship-report.json`. 203 recordings were made; 3 are muted (below).

| Budget | Value |
|---|---|
| Voice budget line `VOICE_BUDGET_BYTES` (a separate line, still **Bailey's to approve**) | **3.60 MB of 20 MB** (the as-recorded variant: 3.69 MB) |
| Music and effects cap (`AUDIO_BUDGET_BYTES`, untouched) | **87.09 MB of 90 MB** (r394-int's re-cut music shrank it from 88.49) |
| Both together | 90.69 MB, which is why the voice needs its own line: it does not fit the 90 MB one |

Per chapter (bytes): seymour-flux 416,432 · yunalesca 383,288 · braskas-final-aeon 735,896 · seymour-anima-macalania 327,932 · evrae-airship 257,772 · yojimbo-cavern 177,032 · seymour-natus 184,136 · seymour-omnis 327,276 · isaaru-via-purifico 257,308 · sin-fins-core 372,900 · sin-face 277,548. By voice: Tidus 74 recordings, Yuna 62, Auron 64.

**Ship gate** (`voice-variant.mjs` -> `voice-ship`): 0 recordings fail; 22 warnings, all "length against the planning estimate" (none for loudness, none peak-limited), listed in the report for Bailey's retake pass; loudness -19.28 to -18.95 LUFS (target -19, dual mono); true peak -10.5 to -2.21 dBTP (ceiling -1); longest inner pause 397 ms.

**Muted lines (stay text only), the three that `voice-ship` suggests for the over-long beat:**

| Recording | Speaker | Line |
|---|---|---|
| `braskas-final-aeon.mid-valefor-enters.005` | Auron | "It stopped meaning anything a long time ago." |
| `braskas-final-aeon.mid-valefor-enters.011` | Yuna | "Valefor. You always came first." |
| `braskas-final-aeon.mid-valefor-enters.007.fb1` | Tidus (stand-in) | "Yuna. You don't have to be the one who—" |

With the voice, `braskas-final-aeon.mid-valefor-enters` (a seam beat) ran **29.2 s against its 26 s budget** (29.4 s as recorded): 3.2 s over where a seam may be extended by 1.5 s at most, so the ship step refused it. Without those three it runs **26.3 s and is EXTENDED by 0.3 s**, inside the policy. The other eight voiced lines of that beat speak. Two other beats are extended and stay inside the allowance: `jecht-falls` 26.1 s against 26.0, `yu-yevon-arrives` 8.7 s against 8.0. None is over. The mute list is `mute` in `tools/audio/voice-variants.json`.

## What was run (all on the merged tree, D:/pyrefly-r395-voice2)

- `npx tsc --noEmit` (by path: `node node_modules/typescript/bin/tsc --noEmit`): clean.
- The voice, audio and save test files together (26 files, 331 tests, all green): the 14 voice files plus the three save-upgrade lists, `audio-voice-shipped` (now running for real: its 5 installed-voice checks passed against the real install, plus one new check that the report's `variant` and `muted` match the config), the new `voice-variant.test.ts` (9 tests: the plan, the staging, the arguments, the config), `audio-manifest-io`, `audio-shipped-files`, the music files.
- `node tools/audio/qa.mjs --strict` (the deploy preflight): green; voice-over 200 recordings, 3.60 MB of 20 MB; total music and effects 87.09 of 90 MB.
- `node tools/orphans.mjs`: none of the voice modules is an orphan.
- **Full suite, once, on the merged tree** (`node node_modules/vitest/vitest.mjs run`, 437 s): **934 files: 928 passed, 5 skipped, 1 failed; 13,802 tests passed, 1 failed, 46 skipped.** The one failure is `ui-ffx2-atbmode.test.ts > a mounted FFX HUD has no Active/Wait chip in its DOM`, a 15 s timeout while the whole suite ran in parallel; alone it passes in 5.3 s (all 6 tests; it timed out under load in r395-voice's run too). It reads nothing this branch touches. No art-hash failures this time: r394-int re-recorded the pins and this tree's `public/art` is the release tree's.
- Browser: see below.

## Headless browser proof (no ears needed)

`node tools/audio/voice-browser-proof.mjs [OUT.json] [SHOT_DIR]` (new, committed): its own vite dev server on a random port (stopped by PID at the end), headless Chromium on SwiftShader, real keys. Record: `docs/audio/voice-browser-r395-voice2.json`; pictures: `docs/screenshots/r395-voice2/`.

Run on 2026-10-08 (all checks true, 0 console errors, 0 page errors, 0 failed requests; about 17 minutes, the machine loaded by the art run):

| Phase | What happened |
|---|---|
| FILES | 200 of 200 files fetched with HTTP 200 and the manifest's byte count (3,600,544), all decoded by the page's own `AudioContext`; the longest differs from its manifest length by 1 ms. The three muted recordings are in no manifest, so the box asks for them and is told there is nothing to play. |
| CUTSCENE (Chapter I, `seymour-flux`, real Enter keys) | `audio.debug().voice`: chapter `seymour-flux`, context `running`, 7 lines started (`pre.008`, `.013`, `.014`, `.017`, `.018`, `.019`, `.024`; Tidus and Yuna), 5 heard to the end (`ended`), `pre.014` cut by two Confirms while it spoke (`stopped`, heard), SKIP SCENE stopped `pre.024` in flight (`stopped`, nothing current afterwards), music ducked while a line spoke. Cache: 15 buffers, 5.7 MB decoded, 0 failed, 16 requests. |
| PAUSE ROWS, 1600x900 | OPTIONS shows **VOICE 90** and **VOICE-OVER ON** under SOUND EFFECTS. Real keys: VOICE 90 to 70 to 90 (voice bus 0.9, 0.7, 0.9); VOICE-OVER on Enter OFF (bus 0, director disabled) and back ON (bus 0.9). |
| MID-BATTLE (Chapter VIII, `evrae-airship`, auto-battler, 640x360) | At Evrae's haste phase Tidus's `evrae-airship.mid-evrae-haste-phase.001` ("It's faster. Why's it faster?") started with the beat and **played to the end** (`ended`). The beat's second line fell to Wakka's authored stand-in (Auron is not in this party); Wakka has no recording, so it stayed text. The beat was costed with the recordings first (Tidus 2.7 s, Auron 3.2 s, Wakka 0). |
| PHONE, 390x844 touch (`?arttier=phone`) | The settings column scrolls on its own (PR-0098); VOICE and VOICE-OVER sit one row apart under SOUND EFFECTS and are reachable. A tap on VOICE-OVER flips it OFF (bus 0) and a second tap back ON (0.9). |

Pictures (`docs/screenshots/r395-voice2/`): `pause-options-voice-desktop-1600x900.png` (and `-after.png`, taken after the key round trip, back at 90 and ON), `pause-options-voice-phone-390x844.png`, `mid-battle-voiced-line.png` (the Evrae fight at the instant the recorded line started; the box fades in just after).

**What the proof cannot show.** It plays on a fake audio clock with no speaker: it proves the files load and decode, the events fire, the director's state and the bus levels move, not what anyone hears. Two things it found about the *test*, not the voice: (1) at 1600x900 on software GL under this machine's load the frame rate fell to about 1 a second and the mid-battle beat's own stall guard (`FRAME_STALL_MS`, 500 ms without a frame, existing behaviour in `BattleScreenCutscenes.ts`) ended the beat before any line began, so the mid-battle phase runs on a 640x360 frame with `?arttier=phone&crisp=phone` and plays the fight again if the first one was too slow (`PYREFLY_PROOF_MID_ATTEMPTS`, default 2; it passed first time); (2) in Chapter I the party-member callouts are Auron's and Rikku's, with Kimahri as the first stand-in, so with its default party (Tidus, Yuna, Kimahri) Kimahri (no recording) speaks them; the one voiced mid-battle line there is Yuna standing in for Lulu after Tidus is zombied, which the auto-battler's fight did not produce, so Chapter VIII was used for the mid-battle check. The long Chapter III beat `valefor-enters` (where the three muted lines are) is reached only after the Jecht fight is won, so it was not played; its muted lines are shown by the manifests and its 26.3 s by the ship report.

## Owed and open

- **Bailey's ear, and the pick between the two variants.** Agents cannot hear (rule 13): the level (-19 LUFS), the 22 length warnings, the 64 kbps encode and the take are his call. The 5 decisions in r395-voice.md (A/B/C text-and-voice behaviour, the voice budget line, the level, the bitrate, retakes) are unchanged and still open.
- **Review class before a deploy: DEEP** (`node tools/critic-plan.mjs --paths ...`): `src/app/SaveData.ts` is the save-data class (two new settings, `voiceOn` and `voiceVolume`, with defaults; no schema or version change), and audio routing, the scene runner and the dialogue box are shared systems. Obligations: live + focused + deep. CHK-001/002/003/008/009/015/016/017/019/020/021/022/023/024, B1; targets: audio, pause, phone, presentation.
- **Not built or not checked:** a phone with a real iOS silent switch; a hidden tab in a real browser; a slow network; the voice on FFX-2 (none, by rule 14); a real listen. The proof plays on a fake audio clock, so it shows the files, the events and the bus levels, not what anyone would hear.
- **CHANGELOG entry for the driver** (FFX, after Bailey's pick): "**FFX:** Tidus, Yuna and Auron speak. Their lines in the story scenes, the mid-battle callouts and the victory lines are voiced with the voices Bailey picked against the real game; the text still types beside them, Confirm moves on and fades the voice, the music dips under a line and returns, and every other speaker stays text only. Three lines of Braska's last battle (Valefor's entrance) stay text only so the scene keeps its length. OPTIONS gets VOICE and VOICE-OVER (on by default)."
- Commit trailers on this branch say `Claude Sonnet 5.5` (the model that made them), not the `Opus 5.5` the brief named.
