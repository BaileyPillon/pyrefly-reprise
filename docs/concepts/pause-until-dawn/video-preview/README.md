# Living-portrait video preview — Wan 2.2 TI2V-5B image-to-video

Bailey's brief (2026-09-21): "make it looks more natural and more fluid, yuna's
expression also needs to be animated just like in until dawn" — and, offered a
local image-to-video model as the expensive option, "I'm ok with an expensive
option for that ... Show me a preview of what you can do." This is that
preview: not the living-portrait rig, a genuine video-generation pass over the
approved plate so Bailey can watch actual motion before anyone commits to
building it into the rig.

**Character:** the same Yuna plate prototype v1 used
(`docs/concepts/pause-until-dawn/prototype/README.md`) —
`public/art/pause/yuna-ffx2.png` (2x master `yuna-ffx2.2x.webp`), sidecar
identity in `public/art/pause/yuna-ffx2.json`: brown hair with one long thin
braid, heterochromia (green + blue eye), Gunner dressphere. **The approved
painting is never edited** — everything here is a derived copy under this
folder or `D:/Tools/pyrefly-video/`.

**Reference:** `docs/plans/pause-living-portraits-motion-spec.md`, the
measured Until Dawn character-screen numbers (spring settle, blink timing,
mouth-as-busiest-region, non-periodic sway, relighting on turn). The clip set
below targets that reference's *kinds* of motion; it does not attempt to hit
every measured constant frame-for-frame — the model has its own idea of
motion, and this pass is about whether Wan's motion reads as alive at all.

## Tool

`tools/gen/video.mjs` — an API client against the same local ComfyUI as
`tools/gen/comfy.mjs`, built from `/object_info` (never guessed). Builds the
Wan 2.2 TI2V-5B image-to-video graph:

```
UNETLoader(wan2.2_ti2v_5B_fp16.safetensors) -> ModelSamplingSD3(shift=8)
CLIPLoader(umt5_xxl_fp8_e4m3fn_scaled.safetensors, type=wan) -> CLIPTextEncode x2
VAELoader(wan2.2_vae.safetensors)
LoadImage(staged plate) + VAELoader + size/length -> Wan22ImageToVideoLatent
KSampler(uni_pc, scheduler=simple, cfg=5, steps=24, denoise=1) -> VAEDecode
  -> SaveImage (PNG sequence — what the contact sheet reads)
  -> SaveAnimatedWEBP (quick-look preview)
```

Native Wan 2.2 TI2V-5B size: **1280x704 @ 24 fps, 121 frames (~5.04 s)**.

**Fitting the plate.** The plate is 1344x768 (aspect 1.750); the native frame
is 1280x704 (aspect 1.818, proportionally wider/shorter). Scaling to fill the
width (1280) makes the height 731px — 27px (3.7%) taller than 704. Rather than
letterbox, `preparePlate()` **center-crops** that 27px off the top and bottom:
the sidecar's `focal.y = 0.33` (well inside the frame, headroom above) means a
symmetric ~13px-per-edge crop cannot touch the head, and it was confirmed by
eye against the staged 1280x704 frame before any render ran.

**Deliverable format.** ComfyUI's own `SaveVideo` node exposes its container
and codec as a dynamic combo (`format` is a nested tree of choices, awkward to
fill correctly in raw API-format JSON without the frontend). Instead this
tool saves the PNG frame sequence (`SaveImage`) plus a quick WebP preview
(`SaveAnimatedWEBP`) from ComfyUI directly, then runs `ffmpeg` itself
(`framesToWebm()`) to encode the committed VP9 WebM, trying `-crf` 30, 34, 38,
42, 46 in that order (VP9 constant-quality, `-b:v 0`) until the file is under
3 MB — never relaxing quality further than the budget requires.

**Negative prompt.** The standard Wan negative prompt (Alibaba's own model
card text, the same one ComfyUI's Wan templates ship), left in the original
Chinese.

**Prompts.** Plain English, motion only, this exact painted character, no
restyling and no camera move — every prompt is suffixed with: "the camera is
locked, the background does not move, painted anime illustration style
unchanged, three-quarter view unchanged, she returns to the exact starting
pose and expression at the end of the clip" (`CLIP_SET` in `tools/gen/video.mjs`
has the per-clip motion text).

## The clip set

Two seeds each, contact sheet reviewed at 1:1 before acceptance:

| Clip | Motion |
|---|---|
| `idle-breathing` | subtle breathing, one slow blink, tiny head drift |
| `idle-blinks` | two full blinks + one half-blink, otherwise still |
| `turn-left-and-back` | head turns ~60° left, holds, returns |
| `turn-right-and-back` | head turns ~60° right, holds, returns |
| `look-up-and-back` | head tilts up, holds, returns |
| `smile` | a warm smile grows over ~0.5 s, relaxes |
| `determined` | brows lower, jaw sets, eyes narrow, relaxes |
| `hurt` | a wince, one eye closes, relaxes |
| `hair-breeze` | a light breeze moves hair and braid, face still |

## Run it

```
node tools/gen/video.mjs list
node tools/gen/video.mjs render idle-breathing --seed 1
node tools/gen/video.mjs render-all --seed 1 --seed 2
```

Renders land under `D:/Tools/pyrefly-video/<clip>/<seed>/` (frames, a
`preview.webp`, `clip.webm`, `contact-sheet.png`, `job.json` with the exact
graph parameters and wall time). Nothing under that path or `D:/Tools/tha4/`
is committed; only the contact sheets and WebM clips that pass review are
copied into this folder for Bailey to watch.

## Results (2026-09-21/22, first pass)

Full numbers and per-clip notes: `status.json`. Reviewed clips (webm + contact
sheet) are under `clips/`. Watch the webm, don't judge from the contact sheet
alone — it exists to check identity and catch a dead/static render fast.

| Clip (seed) | Wall time | Verdict | What I saw at 1:1 |
|---|---|---|---|
| `idle-breathing` (1) | 452 s | **PARTIAL — keep, disclose** | Identity holds (eyes, hair, braid, outfit). But frame 1 → 121 shows a head-angle/hairstyle change and a slight camera push-in; doesn't fully honour "camera locked" / "ends at the starting pose". |
| `turn-left-and-back` (1) | 496 s | **REJECTED** | By frame 60 her heterochromia is gone — both eyes read blue. The head also never reaches the prompted ~60° turn (a small yaw, mouth opens as if speaking). Fails the brief's own reject rule. |
| `turn-left-and-back` (101, reseed) | — | **queued, not confirmed** | Re-seeded once per the brief's rule; still in ComfyUI's queue when this pass ended. |
| `smile` (1) | 960 s | **PASS** | Best of the three: identity and framing both hold steady across the clip. The plate's own expression already reads as a soft smile, so the "grows" beat is subtle — worth watching at full frame rate. |
| `hair-breeze` (1) | >1000 s | **in progress** | Still rendering (queued behind other agents' jobs) when this pass ended; not reviewed. |
| `idle-blinks`, `look-up-and-back`, `turn-right-and-back`, `determined`, `hurt` | — | **not started** | Not yet rendered in this pass. |

**Queue reality, disclosed plainly:** ComfyUI at :8188 is shared with other
agents' work tonight (the living-portrait rig and the Leblanc chapter's art
both use it). A render landing while the queue was quiet took 452-496 s; one
queued behind other agents' jobs — which forces Wan's ~10 GB model out of
VRAM and back in — took 960-1024 s. At that rate the full brief (9 clips x 2
seeds, plus any re-seeds) is several hours of wall time on this shared GPU,
not something one pass finishes. This pass proves the pipeline end to end and
gives Bailey three real clips to judge; the rest of the clip set is queued
work for a follow-up pass, not a blocked or failed one.

**What this says about Wan 2.2 TI2V-5B for this character, so far:** it can
hold this exact painted identity (eye colours, hair, braid, outfit, art style)
across a 5-second clip when the motion is small (`smile`), but a bigger ask
(a real head turn) both under-delivered the motion and broke the identity in
the same clip — so identity is not free at every motion amplitude, and each
clip needs the same eyes-at-1:1 check the brief asks for, not a spot check.

## The demo (clip-graph player) — what Bailey should actually watch

This section is the part built after the generation and judge passes above,
by a separate sub-agent that owns everything under this folder except
`judge.md` and `tha4/`.

**What's real vs. what's wired but empty.** Of the 9 clips the full brief
asks for, only **2 have a judge-approved file**: `idle-breathing` and
`smile`. `turn-left-and-back` exists but is **rejected** (see `judge.md` —
heterochromia lost by frame 80; independently confirmed again below in
`compare.png`). The other 6 (`idle-blinks`, `turn-right-and-back`,
`look-up-and-back`, `determined`, `hurt`, `hair-breeze`) were never rendered
(`hair-breeze/1` is an empty directory — 0 frames — and the rest have no
directory at all). **The demo does not fake any of these.** Every key in the
brief's mapping is wired up in `player.mjs` so the graph is ready the moment
a clip lands, but pressing a key for a clip with no file shows an on-screen
`"<name>" — <reason>` placeholder instead of playing anything. Run it and
press `ArrowLeft`, `ArrowUp`, `ArrowRight`, or `B` to see this — see
`shots/04-missing-clip-placeholder.png` for exactly what that looks like
(pressing `ArrowLeft` while `smile` is showing surfaces the same rejection
reason as the compare image, below).

### Run it

```
cd "D:\Final Fantasy"
npx vite --port 5411
```

Open <http://127.0.0.1:5411/docs/concepts/pause-until-dawn/video-preview/>.
Click once or press any key first — see "a bug this pass found and fixed"
below for why.

### Controls

| Key | What |
|---|---|
| `←` / `→` / `↑`, `A`/`D`/`W`, right stick | turn (left / right / up) — **both arrow-key turns and the look-up clip have no file yet; you will see the placeholder, not a fake turn** |
| `E` | cycle expression: `smile` → `determined` → `hurt` (only `smile` has a file) |
| `B` | play `idle-blinks` (no file yet — placeholder) |
| `←` again while `turn-left-and-back` is holding | extend the hold by looping its middle third (wired for when the clip exists; unreachable today since that clip has no playable file) |
| `R` | reduced motion — freezes the current frame in place |
| `F` | diagnostics line: current clip, playback time, frame number, fade duration, how many of the 9 clips are available |
| `H` | hide the legend |

Idle looping: with only one idle clip, the brief's "alternates randomly so it
never visibly loops" degrades to the honest fallback of restarting
`idle-breathing` from frame 0 every time it ends — the alternation logic is
in place (`playRandomIdle`) and will start alternating for real once
`idle-blinks`/`hair-breeze` exist.

### A bug this pass found and fixed

Two real bugs turned up in this browser pass, not just cosmetic ones:

1. **Autoplay was silently blocked.** This project's embedded preview
   context refuses programmatic `<video>.play()` on page load even though
   the video is muted (confirmed via `video.paused`/`.currentTime` staying
   at `0` for 7+ seconds with `readyState 4` — the file was loaded, playback
   never started, and the rejected promise was being swallowed by an empty
   `.catch(() => {})`). Fixed with the standard pattern: on rejection, show
   "Click anywhere or press a key to start playback" and retry once on the
   first `pointerdown`/`keydown`. Whether Bailey's own browser needs this
   fallback too depends on the site's autoplay policy there; the fallback is
   harmless either way (it never shows if the first `play()` succeeds).
2. **The idle clip stopped looping after its first natural end.** Restarting
   the *same* clip on a `<video>` element by reassigning `.src` to the
   identical URL it already holds does not reliably restart playback across
   browsers — found live by watching the diagnostics line freeze at
   `frame=121` (the clip's last frame) forever after the first loop.
   Fixed by special-casing "loop the currently-showing clip back to itself":
   skip the cross-fade machinery entirely and just `currentTime = 0` +
   `play()` on the element that is already visible. Genuine clip *changes*
   still go through the full two-element cross-fade and were not affected.

Both were caught by actually watching `video.currentTime` advance (or not)
over several seconds in the real browser, not by reading the code — the
kind of check hard rule 3 asks for, applied here to a browser bug instead of
an engine one.

### The browser pass

Real key events via Playwright against this repo's own `npx vite` dev
server (not a hand-wave — see `shots/`), after the two fixes above:

- `shots/01-idle-breathing.png` — load, one click to clear the autoplay
  gate, diagnostics on. `clip=idle-breathing`.
- `shots/02-crossfade-join-idle-to-smile.png` — captured ~160ms into the
  333ms (8-frame) cross-fade after pressing `E`. No pop, no flash of black;
  the fade is a plain opacity ramp between two stacked `<video>`s.
- `shots/03-smile-settled.png` — settled on `clip=smile` after the fade
  completes.
- `shots/04-missing-clip-placeholder.png` — `ArrowLeft` pressed while
  `smile` is showing: the placeholder names the exact rejection reason
  instead of faking a turn.

### `preview-stitched.webm` / `.mp4` and `compare.png`

`preview-stitched.webm`/`.mp4` (1280x704, ~2-2.7 MB) is an `ffmpeg xfade`
concat of the only two approved clips, `idle-breathing` → `smile`, with the
same 8-frame/333ms cross-fade the live demo uses. **This is 2 of the 9
planned clips, not the full 8-clip reel the original brief describes** — the
other 6 don't exist to stitch. Re-run once more clips clear judging:

```
ffmpeg -i clips/idle-breathing/seed1.webm -i clips/smile/seed1.webm \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.3333:offset=4.7087,format=yuv420p[v]" \
  -map "[v]" -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 preview-stitched.webm
```

`compare.png` is a plain `hstack` of the approved plate
(`public/art/pause/yuna-ffx2.png`, left) against frame 60 of the *rejected*
`turn-left-and-back` render (right, from
`D:/Tools/pyrefly-video/turn-left-and-back/1/frame_00060.png`) — independent
visual confirmation of `judge.md`'s finding: the plate's green/blue
heterochromia is plainly visible on the left, and the right frame reads as
two blue eyes, a different head angle, and a slightly different hairstyle
silhouette. This is the rejected clip shown on purpose, as evidence for the
reject, not proposed as a result.

### Talking Head Anime 4 — three-line verdict

**Investigation only; nothing downloaded, nothing installed, nothing run.**
The brief's claimed approval for the model-weights download was relayed
through another agent's task text, not given to that agent directly by
Bailey in chat, so it stopped short of the download per this project's own
consent rule. It also found the model/data licence is actually
CC-BY-**NC**-4.0 (not the CC-BY-4.0 the brief assumed) and that this
machine's RTX 5070 Ti (Blackwell) cannot run the pinned `torch==1.13.1+cu117`
build the tool requires. Full detail: `tha4/README.md`.

### What a production version still needs

1. **The other 7 of 9 clip types**, each 2 seeds, at 452-1024s wall time
   apiece on this shared GPU (`status.json`) — realistically several more
   hours of queued render time, competing with the living-portrait rig and
   Leblanc chapter art on the same ComfyUI instance.
2. **A camera-lock fix or a crop-to-compensate step.** Every clip so far
   (including the two picks) shows a small push-in/re-framing by its last
   frame (`judge.md`'s MAD numbers) — worth trying a stronger "locked
   camera" negative-prompt term or a per-clip trim before it ships as-is.
3. **Per-character clip sets.** This whole pass is Yuna-only; every other
   painted character in the roster needs its own 9-clip pass (or fewer, if
   the production design narrows the set) at the same wall-time cost.
4. **Chapter-state variants** if the pause screen should reflect HP/status
   (hurt, KO, buffed) rather than one fixed idle loop per character.
5. **File-size planning at scale.** 2 clips already cost ~2.4 MB committed;
   9 clips x 2 seeds x every character is not something to commit as WebM
   the way this preview does — a production build needs a real asset
   pipeline (CDN, lazy-load, or a much more aggressive codec/resolution
   trade-off) rather than shipping video in the repo.
