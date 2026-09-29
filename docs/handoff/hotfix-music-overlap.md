# hotfix-music-overlap (2026-09-29)

Bailey, on the live site (release 29, main `49005f73`, bundle `C73AJ1Ds`): "when i choose a
chapter it sounds like the chapter music and main menu music are both playing at the same time
when they shouldnt be".

Branch `hotfix-music-overlap` (from `origin/main` 8dce5e75), worktree `D:/pyrefly-r29-options`.
Not merged, not pushed, not deployed. **Game case: both.** Every FFX and FFX-2 screen plays its
music through the one `AudioManager` slot (shared audio routing, CHK-020).

## What the probe measured

`tools/audio/music-overlap-probe.mjs` runs headless Chromium. It wraps the Web Audio prototypes
from an init script: each music source (a buffer longer than 8 s, started without an offset) gets
named by the file it was decoded from. Every start, stop and `ended` is logged. Every 100 ms it
samples each live track's gain, an `AnalyserNode` placed after that gain (dBFS RMS), and
`__pyrefly.audioDebug().music`. A sample where two tracks are both above -50 dBFS RMS on a
running context counts as an overlap. `--suspend=1` holds the AudioContext suspended, the way a
browser that did not count the first gesture would, and releases it at the chapter pick
(`--release=pick`) or 1.5 s into the scene (`--release=scene`). Raw logs and JSON are in
`D:/Tools/pyrefly-scratch/hotfix-music/` (`live-*`, `r28-*`, `fix-*`, `fix2-*`).

| Build | Input | Context | Chapters | Samples | Overlap samples |
|---|---|---|---|---|---|
| live r29 | keys 1280x800 | running | I, VII, FFX-2 Bahamut (full flow) | 2480 | 0 |
| live r29 | taps 390x844 | running | VII (to the scene) | 998 | 0 |
| live r29 | pad only | running | VII | 653 | 2 (1-sample gain-read artefacts at a cue start, from the probe version before the analyser) |
| live r29 | keys | **held, released at the scene** | VII | 701 | **3: title + chapter-select** |
| live r29 | keys | **held, released at the scene** | I | 619 | **1: title + chapter-select** |
| r28 (6ea8528f, scratch build) | keys | **held, released at the scene** | I | 593 | **1: title + chapter-select** |
| fix | keys | running | I, VII, FFX-2 Bahamut (full flow) | 2781 | 0 |
| fix | taps 390x844 | running | VII, Bahamut, I (full flow) | 2397 | 0 |
| fix | pad only | running | VII, Bahamut (full flow) | 1625 | 0 |
| fix | keys | held, released at the pick | VII | 672 | 0 |
| fix | keys | held, released at the scene | VII | 695 | 0 |
| fix (fresh build `dist-fix2`) | keys | held, released at the scene | I | 602 | 0 |

"Full flow" means title, chapter select, party prep, scene, battle, pause and resume, autobattle
to the results, then back to the board.

## The cause

The music slot broke its one-track rule whenever cues were asked for while the AudioContext
existed but was not running. That happens when the gesture that created the context was not one
the browser counts: a first touch on a phone (`touchstart`), a pad on a browser that does not
grant activation for it, or a key the browser ignores. Three defects compound:

1. **The fade-out read `gain.value`.** Until the audio thread has rendered a node, Chrome reports
   a GainNode's value as its default, 1.0. A suspended context renders nothing, so each cue that
   was replaced got its fade-out armed **at full volume**, starting at the frozen clock time.
2. **The clock is frozen at 0, so the whole backlog started at the same instant.** The title,
   then the chapter-select waltz, then the chapter's own cue were all `start(0)`. When the context
   finally ran, every superseded cue played its full-volume fade-out on top of the cue that
   replaced it.
3. **The unlock listeners came off after the first gesture** even when that gesture left the
   context suspended, so nothing resumed it until some later event did. That delay is what builds
   the backlog.

Plus a smaller defect that happens on a running context too: a third cue during a crossfade left
the oldest cue fading for its full length, so three tracks could sound at once.

Live r29, Chapter I, context released at the scene (`live-suspended-scene-ch1.out`):

```
{"t":3756,"ev":"music-start","id":1,"name":"title.mp3","ctxTime":0,"ctxState":"suspended"}
{"t":5179,"ev":"music-start","id":2,"name":"chapter-select.mp3","ctxTime":0,"ctxState":"suspended"}
{"t":5179,"ev":"music-stop-scheduled","id":1,"name":"title.mp3","when":1.25,"ctxTime":0}
{"t":17174,"ev":"music-stop-scheduled","id":2,"name":"chapter-select.mp3","when":0.65,"ctxTime":0}
{"t":20206,"ev":"ctx-state","state":"running","screen":"cutscene"}
  overlap @20304: title.mp3 -31.4 dBFS + chapter-select.mp3 -42.9 dBFS; slot says fading
  title gain 0.40, chapter-select 0.16 (both re-armed from 1.0), current null
{"t":20833,"ev":"music-ended","id":2,"name":"chapter-select.mp3"}
{"t":21436,"ev":"music-ended","id":1,"name":"title.mp3"}
```

The same run on the fix (`fix2-suspended-scene-ch1.out`): each superseded cue is stopped where it
stands (`when: 0`), and both end the instant the context runs, before anything is heard:

```
{"t":3444,"ev":"music-stop-scheduled","id":1,"name":"title.mp3","when":0,"ctxTime":0}
{"t":15351,"ev":"music-stop-scheduled","id":2,"name":"chapter-select.mp3","when":0,"ctxTime":0}
{"t":18424,"ev":"ctx-state","state":"running","screen":"cutscene"}
{"t":18424,"ev":"music-ended","id":1,"name":"title.mp3"}
{"t":18424,"ev":"music-ended","id":2,"name":"chapter-select.mp3"}
```

## Did release 29 introduce it? No. The slot defect is older.

Release 28 (6ea8528f, built from `git archive` in scratch) reproduces the same backlog under a
held context: title at -30.8 dBFS and chapter-select, with slot gains 0.42 and 0.18
(`r28-suspended-scene.out`). The fade-out code is byte-identical between r28 and r29. The r29
audio merge (4127f442) only added `pendingMusic` (PR-0226) and `padUnlock.ts` (PR-0220).

PR-0220 does add a new way for players to get a context that is not running. Before r29, a pad
press created no context at all. Now it does, and on a browser that does not count that press as
activation, the context stays suspended until a key, click or tap. r29-load's preload order,
ch7-unlock's scene cue and D-210's bus levels do not touch the slot. With counted gestures on the
live site (keys, taps, pad) the probe found **no overlap** in any flow.

## The fix (`src/audio/musicSlot.ts`, `AudioManager.ts`)

- The slot tracks its own gain schedule (`ramp`), and `slotLevel()` computes the level from that
  schedule. The code never reads `gain.value` back.
- `retireSlot()`: on a running context, a slot someone is hearing fades from its real level and
  its source stops when the fade ends. A slot never heard (context not running, or the slot is
  below 0.001) is stopped on the spot.
- `cutFading()`: when a new cue arrives, or on `stopMusic()`, any slot that is already fading out
  is cleared within 60 ms, so a crossfade never holds three tracks.
- `installUnlockListeners()` stays armed until the context is actually `running`, and now also
  listens to `pointerup`, `touchend` and `click`, the gestures iOS and Android count. `unlock()`
  resumes any state that is not running (including `interrupted`).
- PR-0226 (a pause cue never replaces the battle theme) and PR-0220 (pad unlock) keep passing:
  `audio-pause-race.test.ts`, `audio-pad-unlock.test.ts`, `pause-music-silence.test.ts`.

`tests/unit/audio-music-slot.test.ts` drives the real `AudioManager` against a recording context
whose `gain.value` behaves like Chrome's. Against the old `AudioManager`, 5 of its 6 tests fail
(backlog `['title','chapter-select','scene-macalania-temple']`, re-armed gain 1, three tracks at
30.52 s, `stopMusic` on a suspended context leaves the title live, the suspended first gesture
disarms the unlock). All 6 pass on the fix.

## Checks (2026-09-29)

- `tsc --noEmit` clean. `node tools/orphans.mjs`: `musicSlot.ts` is reachable.
- The 27 audio and music unit files pass (498 tests).
- Full suite: 628 files pass. 2 failures, neither from this change.
  `ui-portrait-face-crop` fails because the worktree's `public/art` junction points at main's art,
  which already has the Songstress paintings that main measured in 1475ff6b; this branch predates
  that commit. `strategy-ffx2-bahamut` "heal-only route" timed out under full-suite load and
  passes alone (6.4 s).
- `AudioManager.ts` is 654 lines. It was already over the 400-line house rule before this change
  (net -1 line here).

## Open

- **The exact trigger on Bailey's machine is not reproduced.** With counted gestures, headless
  Chromium on the live site shows no overlap. The overlap needs a context that is not running,
  which the probe forces with `--suspend`. Worth asking Bailey which device, browser and input they
  used (phone? pad first?). The fix covers every such route, but if Bailey was on a desktop with
  mouse and keys, the report may be something else. The scene's ambience (for example
  `fayth-hum` on Chapter VII's cutscene) plays over the chapter-select fade-out and is not music.
  Also, on a slow network the menu music can arrive late and play into the cutscene
  (`live-mouse-slow.out`). That is sequential, not overlapping, and it is not changed here.
- The fix needs the focused review before it can ship (shared audio routing), then Bailey's ear
  in `docs/audio/audition.html` or on the build.
- Scratch left in place, not deleted: `D:/Tools/pyrefly-scratch/hotfix-music/r28` holds a
  `node_modules` **junction** to `D:/Final Fantasy/node_modules`. Unlink it with
  `cmd /c rmdir` before anyone removes that folder. `dist-fix`, `dist-fix2` and `r28/dist` each
  hold a copy of the art (about 450 MB each).

## CHECK (independent, 2026-09-29 ~13:40 EDT)

An independent check by an agent that did not build the fix. It covers commit `b7216d45`. Nothing
was pushed, merged or deployed. Game case: both. The probe is this branch's
`tools/audio/music-overlap-probe.mjs`, copied to scratch with two changes: a `--vw/--vh` viewport
(keys and pad ran at 1600x900, taps at 390x844 touch) and a `--pauserace` step. A new
`analyze.mjs` reports, for each flow step, the slot's current cue 3 s later, the most tracks
audible at once, and the audible timeline. Raw logs are in
`D:/Tools/pyrefly-scratch/hotfix-music-check/`. The fresh production build is
`dist/index-CwA0gRWR.js`; I grepped the bundle to confirm it contains the new six-gesture unlock.
It was served by `vite preview` on port 8860, and that server is stopped.

| Build | Input | Context | Chapters (flow) | Samples | Overlap | Max audible |
|---|---|---|---|---|---|---|
| live r29 `C73AJ1Ds` | keys 1600x900 | held, released at the scene | I (to battle) | 619 | **2: title -35.7 + chapter-select -39.2 dBFS, cutscene** | 2 |
| live r29 | keys 1600x900 | running | I, FFX-2 Bahamut, II Yunalesca (full) | 2562 | 0 | 1 |
| live r29 | pad | held, released at the scene | I | 603 | 0 (title never started; one cue queued) | 1 |
| fix | keys 1600x900 | held, released at the scene | I | 592 | 0 | 1 |
| fix | keys 1600x900 | running | I, Bahamut, Yunalesca (full) | 2440 | 0 | 1 |
| fix | taps 390x844 | running | Bahamut, Yunalesca (full); I failed to start, see below | 1908 | 0 | 1 |
| fix | taps 390x844 | running | Bahamut, I (full) | 1594 | 0 | 1 |
| fix | taps 390x844 | held, released at the scene | Bahamut | 464 | 0 | 1 |
| fix | keys 1600x900 | held, released at the pick | Yunalesca | 645 | 0 | 1 |
| fix | pad 1600x900 | running (a pad press creates it, PR-0220) | Bahamut, I (full) | 1594 | 0 | 1 |
| fix | pad | held, released at the scene | I | 594 | 0 | 1 |
| fix | keys + P,P within 100 ms before the first pause | running | Bahamut, I (full) | 1681 | 0 | 1 |

"Full" means title, chapter select, party prep, scene, battle, pause and resume, autobattle to
the results, then back to the board. On the fix, both held-context runs stop the backlog with
`when: 0` at the frozen clock. Title and chapter-select end the moment the context runs.

- **Per-step cues match live.** Each step plays the same cue on the fix as on live: chapter-select
  on the board and prep, the scene cue, the boss theme, `pause` while paused, the boss theme again
  3 s after resume (every chapter, every input), then victory and chapter-select. So PR-0226
  holds in the browser. The P,P race did not reach the decode window, because `pause.mp3` is
  already decoded by then and no pause cue started. The battle theme stayed in the slot.
  `audio-pause-race.test.ts` covers the decode race itself.
- **PR-0220 holds.** A pad-only session unlocks audio and runs every flow, including Chapter I.
- **Unit tests.** `tsc --noEmit` is clean. 60 audio, music and pause unit files pass (905 tests),
  including `audio-music-slot`, `audio-pause-race`, `audio-pad-unlock` and `pause-music-silence`.
- **Merge.** `git merge-tree --write-tree` of `b7216d45` against the current `origin/main`
  (`1475ff6b`, 66 commits past this branch's base) is clean.
- **Code read.** `retireSlot` computes the level from the slot's own ramp and never reads
  `gain.value`. A second `stop()` on an already-fading source is wrapped in try/catch, and
  `cutFading` does not push a slot into `fading` twice. Nothing in `src/` suspends the context
  itself, so a slot retired while the context is suspended is always one never heard.

Verdict: **no blocker.** No sample on the fix had two music tracks audible. PR-0226 and PR-0220
did not regress, and no test is red. Minor notes (none blocks):
1. Probe flake: in the first taps run, the Chapter I card tap timed out (`fe-card-0`, 8 s). The
   same pick passed when run second. This is a harness issue, not the game.
2. On the Bahamut (FFX-2) results screen no music track sounds, on live and on the fix alike.
   It is not a regression and this check does not settle whether it is intended.
3. `audioDebug().music.fading[].gain` still reads `gain.value`, which is 1.0 on an unrendered
   node. The debug surface can therefore overstate a fading slot's level. Only the probe's
   analyser RMS is ground truth.
4. Bailey's exact device and route are still unreproduced. See "Open" above.
