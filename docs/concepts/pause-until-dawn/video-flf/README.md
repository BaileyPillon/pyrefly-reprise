# Living-portrait video, round 3 (Wan 2.1 FLF2V) — RESULT: fix applied and

validated, render not queued (shared GPU never went 10 minutes idle)

**Status: fix DONE and validated on paper; render NOT run.** No clip was rendered
this pass, so (as with round 2) there is still no `preview-seamless.webm`/`.mp4`,
no `joins.png`, no `index.html` demo, and nothing with a visible join is shown to
Bailey. This replaces round 2's result log; round 2's is at commit `8d5c611`'s
parent, still in git history.

## Why this exists

Round 2 (`judge.md`) rejected `idle-breathing` seed 1 on JOIN-LAST only: the
mouth was still mid-swell on the final frame, root-caused to
`WanFirstLastFrameToVideo` only ever unmasking the plate's **one phantom** mask
slot for the end anchor (past the real 81 frames) versus **four real, aligned**
slots for the start anchor. `judge.md` §5 gave five concrete fixes; this pass
applied all five in code:

| # | Fix | Where |
|---|---|---|
| 1 | `end_image` fed through `RepeatImageBatch(amount=4)` before `WanFirstLastFrameToVideo`, so the end anchor is 4 real frames wide instead of 1 phantom slot | `tools/gen/video-flf.mjs` `buildFlfGraph` |
| 2 | Prompt timing: all requested motion must peak and settle within the first 60% of the clip; the final second is scripted as already-still | `NO_RESTYLE_SUFFIX` |
| 3 | 24 fps, not 16 (a 150–170 ms blink is then ~4 frames, not ~2.5) | `FPS` const |
| 4 | Re-render the one target clip (`idle-blinks`, per this pass's brief) alone, not all nine, before judging again | this pass only queued (attempted) `idle-blinks` |
| 5 | A demo still needs a library of several passing clips, not one — unchanged, out of scope for this pass | — |

`RepeatImageBatch` was confirmed present and its exact input names read from
this ComfyUI's live `/object_info` before writing any code (no download; see
`object-info/RepeatImageBatch.json`, added this pass, `object-info/VAEEncode.json`
likewise for the new noise-floor probe below).

## `idle-blinks`' prompt, specifically

The render target this pass (per its brief) is `idle-blinks`, timed explicitly:
*"In the first three seconds Yuna blinks fully closed twice, evenly spaced, and
then does one half-blink where her eyelids only partly close and reopen; every
blink is finished well before the three-second mark. After that she is
completely still..."* — two full blinks + one half blink inside frames 1–72
(3 s at 24 fps), stillness for the last ~25 frames, matching
`docs/plans/pause-living-portraits-motion-spec.md` finding 5 (half blinks are as
common as full ones) and finding 4 (blink shape/timing).

## `join_report.py` rewrite

Round 2's judge flagged this script's *own* default face box (fractional
30–70% × 15–48%, i.e. x384–896 at 1280×704) as "too wide — about a third of
that box is pinned background... would flatter a drifting face", and that a
plain mean "cannot catch a recoloured iris covering 0.2% of the frame."
Rewritten to use the judge's own **head-only, pixel-absolute** boxes (face,
eyes, greenEye, blueEye, mouth, braid, hairline — all seven, not just face),
scaled proportionally if a frame renders at a size other than the reference
1280×704, and to report **MAD, max-absolute-difference, and the 99.9th
percentile** per box, not a bare mean.

**The VAE noise floor is now computed, not quoted.** `ensureVaeFloor()`
(`tools/gen/video-flf.mjs`) queues a bare `LoadImage → VAEEncode → VAEDecode →
SaveImage` of the staged plate on this session's live ComfyUI (core nodes,
seconds of GPU, cached by staged-plate filename so it only runs once per
resolution) and every join number in the report and the contact sheet is now
printed next to it.

**Validation, done this pass without spending render time:** ran the rewritten
`join_report.py` against the real staged plate and a real VAE-floor probe
queued and executed on this session's live ComfyUI. Result — measured floor
MAD: face **3.85**, eyes **4.70**, mouth **1.92**, braid **6.31**, hairline
**3.06**. **These match `judge.md` §2's independently-measured floor numbers
exactly**, box for box. That is strong evidence the box coordinates,
resolution scaling and statistics are implemented correctly before any GPU
time is spent rendering against them.

## Why no clip was rendered

The brief for this pass: poll `GET /queue` until it has been **empty for 10
consecutive minutes** before queueing the one render job, because it would
occupy the shared GPU for 60–90 minutes. **Monitored continuously for
approximately 50 minutes (2026-09-22, roughly 13:50–14:47 EDT). The queue was
never empty for more than ~110 seconds at a stretch.**

Two other tracks were visibly, continuously active on the same GPU the entire
time this pass watched:

1. An **ACE-Step music-audition workflow** — `public/audio/candidates` and
   `D:/Tools/ComfyUI/output/pyrefly-ace` grew from 34 to 62+ rendered `.flac`
   candidates while this pass watched, sweeping seeds, denoise values and at
   least one model-variant switch (`-t2m-` filenames) across multiple cues
   (`battle-ffx`, `boss-ffx2-aeon`).
2. Immediately after that track's file count stopped growing, `GET /queue`
   showed a **different, IPAdapter-based image-generation graph** running
   (`CheckpointLoaderSimple` / `IPAdapterModelLoader` / `IPAdapterAdvanced` /
   `ImageBatch`) — consistent with the art-generation track NOW.md also lists
   as active today.

Queueing a 60–90 minute job into that queue would have stalled both of those
in-progress tracks for the rest of their own runs — precisely what the
10-minute-empty rule exists to prevent. **This pass chose not to force it
through.** No GPU time was spent on the render itself or on any VRAM probe
beyond the few seconds the VAE-floor validation above needed.

## What this means for this pass

Per the brief and the standing rule (nothing with a visible join is ever shown
to Bailey): with no clip rendered, there is nothing to judge and nothing to
show. No files exist under `clips/`, no `index.html`/`player.mjs`, no
`preview-seamless.webm`/`.mp4`, no `joins.png`, no contact sheet, no browser
screenshots — same as round 2's outcome, for a different reason (round 2
rendered and failed the join test; this pass didn't get GPU time it could take
without stalling other agents).

## What the next pass should do

1. Poll `GET /queue` for a genuine 10-consecutive-minute empty window (the
   fastest way to check is `curl -s http://127.0.0.1:8188/queue`; busy means
   a non-empty `queue_running` or `queue_pending`).
2. Once confirmed: `node tools/gen/video-flf.mjs render idle-blinks --seed 1`
   — the round-3 fix (RepeatImageBatch end anchor, 24 fps, length 97, the
   updated `idle-blinks` prompt) is already the default, no flags needed.
3. Immediately after submitting, `GET /queue` once more and confirm the
   running graph is this one (has `WanFirstLastFrameToVideo` and
   `RepeatImageBatch` among its node types), not another agent's job that
   slipped in first.
4. The CLI's `render` command now automatically runs `ensureVaeFloor`,
   `joinReport` (with the floor wired in) and `buildContactSheet` (frames 1,
   25, 49, 73, N; eye crops at 1, 49, N; join numbers **and** the floor burned
   in) — look at the sheet at 1:1 before deciding anything passed.
5. If `idle-blinks` passes JOIN-FIRST and JOIN-LAST this time, `judge.md` §5.5
   still applies: a demo needs a library of several passing clips, not one.

## Evidence this pass left behind

- `status.json` — this pass's machine-readable log (the fix applied, the
  validation numbers, the exact queue-contention evidence).
- `object-info/RepeatImageBatch.json`, `object-info/VAEEncode.json` — the live
  ComfyUI node schemas the round-3 fix was built and validated against.
- `judge.md` (round 2, unchanged) — the defect this fix targets, still the
  reference for what "pass" means.

Nothing under `D:/Tools/pyrefly-video/flf/` is committed (scratch renders
only, per the brief) — moot this pass, since nothing was rendered.
