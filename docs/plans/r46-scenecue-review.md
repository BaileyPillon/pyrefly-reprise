# Paper preflight: the opening scene's cue first (r46-scenecue)

Paper preflight under AGENTS.md rule 15 and `critic/RUBRIC.md` §4, written **before any product code**,
2026-10-13, by the build lane `r46-scenecue` (branch `r46-scenecue`, base `origin/r45-rc` d5bf2206). Nothing in
`src/` is changed by this document.

`node tools/critic-plan.mjs --paths src/audio/AudioManager.ts,src/audio/MusicLoader.ts,src/audio/MusicWarm.ts,src/app/chapterMusicWarm.ts,src/app/sfxGame.ts,src/app/screens/BattleScreenFlow.ts`
classes the change **DEEP** (audio routing, an asset loader, an unclassified product path): obligations live +
focused + deep. Nothing here is on the save-data class, so the deep review runs on the live build after the
deploy, not before.

Authority. The driver told Bailey: "I overstated the music preload. I said scene music now plays by the first
line. The live check found that true in only 2 of 15 tries on this connection. The proper fix is to let that
music download first, which needs your yes. I recommend it." He answered, verbatim, "I'll go with all of your
recommendations", and today "ok you may resume now". That approves **the ordering change** and only that.

## 1. Game case (rule 14)

**Both games.** It is shared loading plumbing: it changes **when** audio and art are fetched at a chapter's card
confirm, never **what** is played, which cue, or how a fight runs. The cue each chapter's opening scene asks for
is read from that chapter's own story script, so an FFX chapter waits on its FFX cue and an FFX-2 chapter on its
FFX-2 cue; nothing in the change names a cue. FF7's hidden experiment has its own flow (`runExperiment`) and is
left exactly as it is. Chapters that qualify (the opening scene asks for a cue at or before its first spoken
line) are **derived** by `openingSceneCue(chapter)` from `Chapter.scriptsRef.pre`, never listed by hand.

## 2. What is true today (read from the code, and measured on the base build)

- `GameFlow.runChapter` starts, in one task at the confirm: `holdIdleLane()`, `sfxChapter` (the SFX voice at once,
  and `audio.loadParityPacks`: up to 0.33 MB), `musicChapter` (`audio.warmMusic`: the scene, boss, victory and
  defeat cues one at a time), and, in `playChapter`, `preloadBattle` (the scene's and the battle's art: about
  6.5 MB in the first 6 s). The party prep screen then loads its own art.
- What the first key started is **already in flight** at the confirm and cannot be reordered by anything that
  starts at the confirm: `title.mp3` 2.3 MB, `chapter-select.mp3` 2.1 MB, `sprite.mp3` 2.7 MB,
  `sprite-v2.mp3` 4.7 MB (11.9 MB).
- Fetch priority is not the lever: Chromium's `fetch()` default is already High (`priority: u=1, i`), the
  emulated link shares fairly whatever the priority, and the host (Cloudflare) honours RFC 9218 for browsers that
  send it. So the only lever is **order of what the confirm starts**.
- Chapter I (`seymour-flux`) opens with `music(null, 600)`: its first line is silent **by design**; the bed enters
  at script step 27. It is not a qualifying chapter.
- The base build, one debug run (Chapter II, fast route): first spoken line +7.0 s, scene file requested +8 ms
  and finished +10.7 s, nothing playing at the first line.

## 3. The change (design)

1. `src/app/openingSceneCue.ts`: `openingSceneCue(chapter)`, the cue playing at the opening scene's first spoken
   line (`null`: no pre script, FF7, or a script that opens with silence). `scriptOpensWithMusic` and its look-ahead
   move here out of `BattleScreenFlow.ts` (over 400 lines already) and are imported back; behaviour identical.
2. `src/app/sceneCueGate.ts`: `SceneCueGate`, a cap timer plus `settle()`, `after(fn)` (runs at once when open),
   `cancel()` and an `opened` promise. `sceneCueGateFor(chapter, opts)` builds one only when all of these hold:
   an opening cue exists, the run is not `skipCutscenes`, the switch is not off, and the mixer says a first
   fetch will really happen (`audio.needsFirstFetch(cue)`: unlocked, not synth-only, sound on, cue not decoded,
   a rendered file or a manifest not read yet). Otherwise **no gate: today's behaviour, call for call**.
3. `AudioManager.warmMusic(names, gate?)`: the first name (the opening cue) is fetched alone; the gate settles when
   its bytes are in, when it fails, when there is nothing to fetch, or at the cap; the rest of the chapter's cues
   go on after that (they were already sequential; now they also wait out the cap on a dead link).
   `MusicLoader.load(ctx, name, onFetchEnd?)` is additive. No priority hint (see §2).
4. `sfxChapter(id, release, gate?)` defers `audio.loadParityPacks` through the gate (the voice, `setSfxGame`, stays
   immediate; an end of run before the deferred load skips it). `playChapter` runs `preloadBattle` through
   `gate.after` (skipped when the run has ended). `holdIdleLane` and the prep screen's own art are not deferred.
5. A switch `?scenecue=off|<capMs>` so one build compares with itself. Default on **only if** the measurements
   allow (the task's point 9).

## 4. What could go wrong, and how each is checked

| # | Risk | Check |
|---|---|---|
| 1 | The gate never opens, so the art and packs never load and the first menu never comes. | One `settle()` on every exit of `fetchWarm` (`finally`): arrival, failure, no rendered file, cached, stale run, ended run; plus the cap timer. Unit tests for each exit and for a fetch that never answers (fake timers: the rest starts at the cap). The harness counts any run with no first menu as a failure. |
| 2 | The cap is too long (a dead link stalls the rest) or too short (the ordering never wins). | Chosen from the BEFORE/AFTER arrival times of the scene file and written in the handoff with the reason; a unit test at the cap boundary. |
| 3 | The art is deferred and the first battle menu comes later. | Measured: confirm to first menu, BEFORE and AFTER, the same two chapters, fast and human routes; a later median menu keeps the change off by default. |
| 4 | The opening scene's own art (`preloadBattle` phases 1 and 2) is held and the first spoken line comes later. | Measured and reported (confirm to first line, both sides). If the line moves later while the cue moves earlier, the table says so plainly. |
| 5 | The warm adds memory (FOC43-05: about 0.26 GB). | Renderer and total working set, JS heap, sampled every 250 ms, peak over the warm, BEFORE and AFTER. Nothing decodes more or earlier than today; no change raises the cap of three decoded cues. |
| 6 | A chapter with no opening cue, a cue already cached, sound switched off or the synth fallback behaves differently. | Four unit tests: each yields **no gate** and the mixer is called with today's arguments (`warmMusic(cues)`, one argument; `loadParityPacks` and `preloadBattle` immediately). The existing `chapter-music-warm.test.ts` and `audio-sfx-parity.test.ts` pass unchanged. |
| 7 | A restart (RESTART ENCOUNTER, a retry) or a second run reuses a dead gate. | The gate belongs to one `runChapter`; `after()` on an open gate runs at once; on a cancelled gate it does nothing. Tests: restart after open; cancel before open (backing out of prep) skips the deferred loads and a later run is not affected. |
| 8 | The newest run's gate is cancelled by an older run's end. | Gates are per run and cancelled only by their own release; the hold's token rule already protects the cues. Test with two runs. |
| 9 | Chapter I-like silent opening gets gated and its first menu waits for nothing. | `openingSceneCue` returns `null` for `music(null)` before the first line; test against the real script and a synthetic one; no gate. |
| 10 | The derivation drifts from what the flow really plays. | `scriptOpensWithMusic` is the same function the flow calls (moved, not copied); a test walks all 22 chapters and compares with `chapter.music.scene`, and reports any difference instead of hiding it. |
| 11 | Layering (`src/battle/**`, `BattlePresenter*.ts`: no DOM, no `three`) and contracts. | Neither is touched. `docs/CONTRACTS.md` lists none of the six files; re-read before the commit. |
| 12 | The measurement itself misleads (link emulation shares fairly; headless audio). | State the link (18 Mbit/s, 40 ms, 5 Mbit/s up), the cold cache per run, and that a host honouring RFC 9218 is not reproduced; the live check after the deploy is the proof. "Audibly playing" is the mixer's state (`playing` equals the cue, gain at least 0.1), not only a fetch. |

## 5. Measurement plan (point 5)

Production build served locally by `tools/dist-h2-server.mjs` (HTTP/2, host-like cache headers), headless
Chromium (`PYREFLY_BROWSER=gpu`), a fresh browser per run, the link as above. Per side (BEFORE = the base build,
AFTER = this build, and AFTER with `?scenecue=off` as the control): Chapter II (FFX, `yunalesca`) and FFX-2
Chapter IV (`ffx2-bahamut`), 9 fast runs and 6 human-pace runs each. Per side the table reports: runs where the
cue is audibly playing at the first spoken line; confirm to scene music playing; confirm to first spoken line;
confirm to the first battle menu; peak renderer and total working set over the warm.

## 6. Stop rules

- If the BEFORE batch shows the base already plays the cue by the first line in nearly every run: **stop, change
  no product code**, keep the two tools, report that r45 closes the gap.
- Two failed attempts at the same failure: write the method check and report; no third try.
- If AFTER does not help or makes the first menu later: the switch stays, default **off**, and the report says so.
