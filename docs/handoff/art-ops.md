# Art ops — running the render farm, and what has gone wrong on it

**Status:** living document. Started 2026-09-18 after the NaN black-frame
incident.
**Read with:** `docs/ART-PIPELINE.md` §1 (the local stack) and §6 "Black
frames", `tools/gen/comfy.mjs`, `tools/gen/black-frame.mjs`,
`tools/art-watch.mjs`.

This is the operations log for the local ComfyUI: incidents, what the symptom
looked like, and what the pipeline now does about it automatically. Art
*direction* lives in the `art*.md` handoffs; this file is about the machine.

---

## Incident 2026-09-18 — the GPU emitted black frames and nothing noticed

### What happened

| Time (local) | Event |
| --- | --- |
| 13:35:19 | ComfyUI logs `nodes.py:1699: RuntimeWarning: invalid value encountered in cast` from the `SaveImage` node. Renders keep completing; every pixel of every one of them is 0. |
| 13:35–13:41 | 13 black renders are produced. Two raw candidates are copied into `public/art/` before a human looks at a thumbnail. |
| 13:37:53 | The NVIDIA driver logs **event 153**. The ComfyUI python process dies. |
| ~13:40 | Art agents relaunch it with `schtasks /Run /TN PyreflyComfyUI`. |
| 13:41 | Renders are healthy again. |

The two files that reached the repo were pulled back out and quarantined, with
the rest, in `D:\Tools\comfy-logs\black-quarantine\`.

### Why it went unnoticed for six minutes

Nothing in the pipeline was looking. ComfyUI does not treat a NaN tensor as an
error:

- the sampler runs to completion and reports no failure;
- `/history/<id>` comes back with `status_str: success` and an image entry;
- `SaveImage` writes a valid, normal-sized PNG;
- `comfy.mjs` fetched it from `/view` and wrote it straight to `--out`;
- rembg happily cut a character-shaped hole out of a black rectangle, so even
  the *sidecar* looked plausible — `cropBox`, `baselineY`, the lot.

The one signal is the `invalid value encountered in cast` warning, and it only
exists in the ComfyUI console, which no agent reads.

The other reason: **at thumbnail size a black frame is not obviously wrong.**
The art-watch gallery shows 180px tiles on a `#0d0f14` background. A dead-black
tile reads as "a dark painting" until you open it.

### This is not the first time

A sweep of every PNG in `D:\Tools\ComfyUI\output\pyrefly` and `public/art`
(4,686 files) on 2026-09-18 found **85 all-zero renders in five clusters**, not
13:

| Cluster (local) | Black frames |
| --- | --- |
| 2026-09-15 19:49 → 20:02 | 59 |
| 2026-09-16 00:53 → 00:56 | 11 |
| 2026-09-17 15:08 → 15:22 | 9 |
| 2026-09-18 00:07 → 00:08 | 5 |
| 2026-09-18 09:22 | 1 |
| 2026-09-18 13:35 → 13:41 (this incident) | 13, quarantined |

So this has been happening roughly daily since renders started, in bursts, and
every previous burst was absorbed as "bad variants, reroll". **`public/art` is
currently clean** — the same sweep found zero all-zero PNGs anywhere in the
repo — but that is luck plus the quarantine, not process.

Five clusters over four days, one of them ending in a driver event 153, lines up
with the machine's other problem: see the crash diagnosis from September 2026
(six bugchecks in six days, suspected EXPO 6400 memory timings on an old BIOS).
Treat "the renders went black" as a **hardware** symptom, not an art one.

---

## What the pipeline does about it now

Implemented 2026-09-18 in `tools/gen/comfy.mjs`, `tools/gen/black-frame.mjs`
and `tools/art-watch.mjs`. Full description in `docs/ART-PIPELINE.md` §6
"Black frames". The short version:

1. **Every finished render is decoded before it is written.** One check, at the
   single point where the PNG comes back from `/view`: is the maximum RGB sample
   zero? If yes, the file is not written to `--out`, to a `.raw.png`, or to a
   candidate slot, and rembg never sees it.
2. **It is logged.** One line per black frame in
   `D:\Tools\comfy-logs\black-frames.log`: timestamp, prompt id, SaveImage
   prefix, `maxRgb`. If this file starts growing, the GPU is degrading.
3. **ComfyUI is restarted once,** the same way the agents did it by hand (stop
   the `main.py` python, `schtasks /Run /TN PyreflyComfyUI`, poll
   `/system_stats` for up to 3 minutes), and the same prompt is resubmitted
   once. That is what cleared it at 13:41.
4. **Restarts are throttled to one per 10 minutes,** recorded in
   `D:\Tools\comfy-logs\last-black-restart.txt` (epoch seconds). ComfyUI is
   shared: several art agents have work queued on it at any time, and a restart
   loop would be worse than the original failure.
5. **A second black frame is fatal.** The run exits non-zero and says the GPU
   needs attention. It does not keep trying. A GPU that NaNs again after a
   process restart is not going to be fixed by a third one, and the whole point
   of this incident is that quietly producing nothing for six minutes is the
   expensive outcome.
6. **The gallery flags them.** `art-watch` puts a red border and a `BLACK` badge
   on any all-zero tile and a count in the header, so a black frame arriving
   from a hand-run workflow in the ComfyUI web UI is still caught.

The threshold is `max == 0` and must stay that way. `public/art/backdrops` has
legitimately near-black night scenes in it; a mean or percentile threshold would
quietly start eating them, and a guard that deletes good art is worse than no
guard.

---

## Runbook: the renders went black

1. **Stop queuing work.** Whatever is rendering right now is worthless.
2. `type D:\Tools\comfy-logs\black-frames.log` — how many, how recently, which
   subjects. If the pipeline caught it, nothing bad reached `public/art`.
3. Check whether the pipeline already restarted ComfyUI:
   `type D:\Tools\comfy-logs\last-black-restart.txt` (epoch seconds).
4. Check the driver. Event 153 in the NVIDIA log preceded the 2026-09-18
   incident; a bugcheck in the system log around the same time makes this a
   hardware call, not an art one.
5. If ComfyUI is down or wedged:
   ```powershell
   Get-CimInstance Win32_Process | Where-Object {
     $_.Name -eq 'python.exe' -and $_.CommandLine -like '*ComfyUI\main.py*'
   } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
   schtasks /Run /TN PyreflyComfyUI
   curl -s http://127.0.0.1:8188/system_stats
   ```
6. Sweep for anything that slipped through, and quarantine rather than delete —
   the files are evidence:
   ```
   D:\Tools\comfy-logs\black-quarantine\
   ```
7. If it recurs within the hour, it is the GPU. Say so to the operator instead
   of re-rendering the batch.

---

## Facts worth keeping

- ComfyUI: `D:\Tools\ComfyUI`, bound to `127.0.0.1:8188` only, started by the
  scheduled task **PyreflyComfyUI** (`schtasks /Run /TN PyreflyComfyUI`).
- GPU: RTX 5070 Ti. Raw renders land in `D:\Tools\ComfyUI\output\pyrefly`.
- Logs and guard state: `D:\Tools\comfy-logs\` — `black-frames.log`,
  `last-black-restart.txt`, `black-quarantine\`, plus ComfyUI's own
  `comfy-*.out.log` / `.err.log`.
- The gallery runs on `http://127.0.0.1:8890/` and refreshes every 20s.
- Overrides, for testing the guard without touching the real instance:
  `COMFY_PORT`, `COMFY_LOG_DIR`, `COMFY_TASK`.
