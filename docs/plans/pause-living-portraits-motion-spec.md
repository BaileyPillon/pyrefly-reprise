# Living portraits — measured motion spec from the Until Dawn reference

**Reference:** <https://youtu.be/AbBwCES6lqw> — "(4K) Until Dawn Remaster Character
Screens Scenepack (Before and After)", 6:05.101, 1920x1080 at **59.94 fps**
(16.68 ms per frame; verified from `requestVideoFrameCallback` media times).
**Applies to:** both games (shared presentation plumbing; AGENTS.md rule 14, CHK-020).
Nothing in this file is game data — it is a measurement of a third-party video used
as a *motion* reference only. **No frame of it is in this repo**; the captured frames,
contact sheets and scripts live under `D:/Tools/pyrefly-ref/until-dawn-character-screen/`.

Timestamps below are video time in seconds and are re-checkable: seek the video to
the time and step with `.`.

---

## 1. Summary — the ten things that matter

1. **The head turns; the body and the camera do not.** Between 11.4 s and 14.0 s
   Sam's head rotates from three-quarter through **full profile** and back to
   frontal while her collar, shoulders, the background and the screen-space UI stay
   pinned to the pixel. This is the player driving the head, and it spans **at least
   90 degrees of yaw**, not a few degrees of warp.
2. **The turn settles like a critically damped spring and never overshoots.** The
   residual to the final pose decays by a factor 0.55 every 83.7 ms →
   **time constant 0.14 s**, 95 % in ~0.42 s, 99 % in ~0.65 s, equivalent to a
   natural frequency of ~1.1 Hz at damping ratio 1.0.
3. **On reaching the extreme the head holds there.** It does not spring back to
   centre for at least the ~2 s visible before the next shot.
4. **A blink is 150–170 ms, not 90 ms.** Close 50 ms (3 frames), hold 17–50 ms,
   open 66–67 ms (4 frames). Opening is ~1.3x slower than closing.
5. **Half blinks are as common as full ones.** In 14.6 s of steady idle: 3 full
   blinks (1 per 4.9 s) and 4 partial-lid events of ~0.2–1.0 s that never close.
6. **The eyes do not dart.** No saccade in 14.6 s of steady idle; the corneal glint
   holds within ±1.1 % of the inter-pupil distance. Big gaze changes happen *with*
   the head turn, not instead of it.
7. **The mouth is the busiest part of the idle face** — 3 to 7 times the rigid-face
   baseline and ~2.5x the brow. It is never still and it never poses.
8. **The idle is not a loop and not a sine.** Autocorrelation of every head and
   chest trace peaks at only 0.06–0.42 at its first lag (a loop would be > 0.8) and
   the second peak is never at twice the first. It is band-limited noise in
   **0.13–0.34 Hz (3–8 s)**.
9. **The head and the chest run on separate phases of that band** — the chest lags
   the head by about a third of a cycle (Mike: ~1.45 s of a ~4 s cycle).
10. **The face relights as it turns.** Mean face luminance swings ±5 levels on a
    ~3 s cycle because the key light is fixed in the world. This, plus grain
    (~0.5 % of range) and focus falling off from the face into the hair, is what
    sells "a person in a room" rather than "a picture".

---

## 2. How this was measured

**Capture that worked:** Playwright (repo's own install, Chromium 1243, headless,
`--use-angle=d3d11 --enable-gpu`) opens the YouTube watch page, plays the video at
`playbackRate 0.5`, and reads every presented frame out of the `<video>` element with
`requestVideoFrameCallback` → `canvas.drawImage` → JPEG q0.88. The canvas is **not**
tainted, so pixels come back. Each frame is named by its `mediaTime`, which is the
presentation time of the frame actually on screen.
Script: `D:/Tools/pyrefly-ref/until-dawn-character-screen/capture.mjs`.

**Two traps, both hit and both fixed — do not repeat them:**

* Naming a seeked frame by `video.currentTime` mislabels it. `currentTime` updates the
  instant you assign it, while the decoder may still be showing the old frame for
  seconds. My first whole-video catalogue was wrong past ~76 s because of this, and it
  invented a "continuous 288 s Sam take" that does not exist. Label by the
  `requestVideoFrameCallback` media time instead — and note that a **paused** video does
  not reliably fire that callback at all, so a seek-based sampler has to play one frame
  and pause again to get a true media time. That costs ~45 s per sample.
* Loading the page with `&t=<n>s` shifts what you get: the same nominal time returned
  different content than a plain load. Use a plain load.
  (Ground truth at 1:20 is **MIKE AFTER**, confirmed against YouTube's own readout.)

**Analysis:** numpy only — no downloads, no scipy/cv2. Head motion by masked phase
correlation of a face box against the window's first frame (`analyse.py`); blinks by
comparing the head-aligned eye patch against the per-pixel median of the window and
peak-picking, with a frame strip per event so the closing and opening frames are
counted **by eye** (`blinks.py`); periodicity by autocorrelation and FFT
(`periodicity.py`); the turn by the width of the lit face in a band at eye height
(`yaw.py`); grain, focus and vignette in `imagemetrics.py`.

**Scale.** Pixel figures are in the source 1920x1080 frame. Converted to
**IPD** (inter-pupil distance, which `src/ui/common/face-crops.json` already records
per painting): Sam IPD ≈ 165 px, Mike IPD ≈ 189 px, measured from the corneal glints.
Where a figure is quoted as a fraction of **head width** it uses the anatomical
convention *head width ≈ 2.2 x IPD* — a convention, not a measurement off this footage,
because the lit silhouette I can measure includes hair. **IPD is the number to build
against**; the head-width figures are only there so the sizes are intuitive.

**Honest limits of the sample.** The uploader's takes are short and the shot changes
often, so *steady* idle — camera locked, head not turning — adds up to only about
**14.6 s** across three characters. Every "per second" rate below rests on that.

---

## 3. Segments studied

| Window | Who / state | What it is | Used for |
|---|---|---|---|
| 6.007 – 11.495 s | **Sam**, clean (no headlamp) | camera locked, head still | blinks, gaze, sway, expression, grain |
| 11.4 – 14.0 s | **Sam**, clean | head turns 3/4 → profile → frontal | the input-response measurement |
| 14.0 – 26.0 s | **Sam**, clean | repeated turns, several shot changes | qualitative: turn range, lid-on-turn |
| 28.012 – 30.898 s | **Sam AFTER** (headlamp, bloodied) | camera locked | state comparison, hair over the face |
| 52.002 – 58.191 s | **Mike**, dry | camera locked, head still | blinks, sway, a mouth expression event |
| 80.013 – 90.206 s | **Mike AFTER** (wet, cut) | continuous, strong motion | qualitative only (tracking saturates) |
| 90.307 – 105.322 s | **Jessica** (blonde, braids) | continuous 15 s, strong motion | relighting-on-rotation, qualitative |

**Coarse pass — what is in the video.** Verified boundaries (title read off the frame,
labels forced fresh; `frames/cat5`, and 1:20 cross-checked against YouTube's own time
readout):

| From | To | Screen |
|---|---|---|
| 1.0 s | 25.0 s | SAM BEFORE |
| 29.0 s | 49.0 s | SAM AFTER |
| 53.0 s | ~76 s | MIKE BEFORE |
| ~77 s | 90.2 s | MIKE AFTER |
| 90.2 s | ≥105.3 s | a blonde, braided character (Jessica) |

The pack is a *before / after* comparison: each character gets roughly 25 s in their
opening state and 20 s late in the night, then the next character. At ~45 s per
character that accounts for about eight characters across the 6:05, which matches the
game's cast — but **I only verified the five screens above**; the rest is inference.
"BEFORE / AFTER" is the in-game trait toggle, not original-versus-remaster. It is the
same pause screen with the same screen-space UI throughout.

A full 2 fps catalogue of all 365 s was **not** completed: the only method that labels
frames correctly (seek, play one frame, pause) costs ~45 s per sample, and continuous
playback stalls after 8–25 s, so a whole-video pass did not fit the budget. Two earlier
whole-video passes are on disk (`frames/catalog`, `frames/cat4`) and **their timestamps
past ~76 s are wrong** — do not cite them.

---

## 4. Blinks

Every row read frame by frame off a 59.94 fps strip.

| # | Who | t (s) | Close | Hold shut | Open | Total | Note |
|---|---|---|---|---|---|---|---|
| 1 | Sam | 9.110 → 9.276 | **50 ms** (3 f) | **50 ms** (3 f) | **66 ms** (4 f) | **166 ms** | full, both lids |
| 2 | Mike | 54.588 → 54.739 | **50 ms** (3 f) | 17–33 ms (1–2 f) | **67 ms** (4 f) | **150 ms** | full |
| 3 | Sam AFTER | ~30.80 → ~30.95 | — | — | — | ~167 ms (FWHM) | clipped by the shot change |
| H1 | Sam | 8.042 → 8.242 | ~65 ms | ~100 ms at ~50 % | ~50 ms | **~200 ms** | **half blink**, never closes |
| L1 | Mike | 53.54 → 53.92 | — | — | — | ~1050 ms | slow lid narrowing + eye roll, no closure |
| L2 | Mike | 55.0 → 55.75 | — | — | — | ~750 ms | slow lid narrowing, no closure |
| L3 | Sam AFTER | 29.53 | — | — | — | ~120 ms | brief lid dip |

**Rates.** 3 full blinks in 14.6 s of steady idle = **1 per 4.9 s (12/min)**, with
**4 further partial-lid events** in the same time, i.e. *something* happens to the
lids about every 2 s. Measured gaps between consecutive lid events: 1.05, 0.93, 0.62,
1.35 s, with quiet stretches of ≥ 2.1 s and ≥ 3.5 s.

**Shape.** Closing is faster than opening in both full blinks (ratio 0.75). There is a
genuine shut hold of 1–3 frames. No double blink appeared in the sample.

**Coupling.** All three full blinks happened during still idle, none at the start or
end of a head turn. The sample is too small to rule out coupling, but blinks are
plainly not *required* to hide a turn.

---

## 5. Eyes and gaze

| Measure | Sam BEFORE (6.0–11.45) | Sam AFTER (28.0–30.5) | Mike (52.0–58.15) |
|---|---|---|---|
| Corneal glint x, peak-to-peak | 13.8 px = **8.4 % IPD** | 7.9 px = 5.9 % IPD | 8.8 px = 4.7 % IPD |
| Corneal glint x, RMS | 1.80 px = **1.1 % IPD** | 1.69 px | 1.84 px |
| Saccades (steps > 80 px/s) | **none** (all candidates were blink artefacts) | none | none |

* During a steady idle the gaze **holds a fixation** and drifts slowly. Over 5.5 s the
  total excursion is under 9 % of IPD and it is a drift, not a series of steps.
* What *does* change between blinks is the **lid aperture**, over 0.7–1.05 s (L1, L2
  above), with the eye rolling slightly under it. The lid follows the eye rather than
  staying a fixed slot.
* Where the eyes rest depends on the take: in some shots they stay on the camera
  through the whole take, in others they hold off-camera. They do not scan the room.
* **Eye-lead over the head could not be measured**: the frames where the head turns
  fast are also the frames where the eye is occluded by the nose or in shadow.

---

## 6. Head and body

Idle windows only, head aligned to the window's first frame. `p2p` = peak to peak.

| Window | head dx | head dy | chest dx | chest dy | dominant band |
|---|---|---|---|---|---|
| Sam 6.0–11.49 | 21.8 px = **13 % IPD** | 20.6 px = 12.5 % IPD | 11.8 px = 7.2 % IPD | 9.5 px = 5.8 % IPD | 0.18 Hz (5.5 s) |
| Mike 52.0–58.19 | 12.2 px = 6.5 % IPD | 8.4 px = 4.4 % IPD | 9.8 px = 5.2 % IPD | 6.1 px = 3.2 % IPD | 0.16–0.32 Hz (3.1–6.3 s) |
| Sam AFTER 28.0–30.9 | 38.9 px* | 23.2 px | 11.7 px | 8.1 px | 0.34 Hz (2.9 s) |

\* includes the beginning of a head turn, so it is an upper bound for idle.

As a fraction of head width (≈ 2.2 IPD by convention): **Sam sways ±3.0 %, Mike ±1.5 %**
of head width. Vertical is about the same size as horizontal — it is a wander, not a
pendulum.

**Not periodic.** Autocorrelation first-peak heights: 0.19, 0.30, 0.16, 0.14 (Sam);
0.42, 0.09, 0.25, 0.29 (Mike); 0.06, 0.01 (Sam AFTER). A true loop would be > 0.8.
Second-peak-to-first-peak lag ratios are 1.00–1.70, never the 2.00 a repeating cycle
would give. 47–88 % of the 0.08–3 Hz power sits within ±20 % of one frequency, so it is
**band-limited noise**, not white noise and not a sine.

**Head and chest are out of phase.** Mike's head dx peaks at 53.6 s and 57.6 s
(≈ 4.0 s apart); his chest dx peaks at 55.05 s and 59.0 s (≈ 3.95 s apart) — the chest
lags the head by ≈ 1.45 s, about a third of a cycle.

**Hair and cloth.** Mean absolute change in the hair region: Sam (long, loose) **2.50
levels**, Sam AFTER 2.65, Mike (short) **0.48** — five times more motion for loose hair.
Loose strands cross the cheek and the eye and slide over them (clearly at 30.7–30.9 s);
the hair is not a sheet welded to the head, and the strand pattern changes
independently of head position.

---

## 7. Expression

Mean absolute change per region against the window's own reference, in 8-bit levels.
The **nose is rigid**, so its number is the residual-head-motion baseline; anything
well above it is real deformation.

| Region | Sam BEFORE | Sam AFTER | Mike |
|---|---|---|---|
| **mouth** | **7.16** (max 14.9) | **7.20** (9.7) | **5.53** (9.9) |
| brow | 2.77 (4.6) | 3.16 (4.9) | 1.58 (4.7) |
| hair | 2.50 | 2.65 | 0.48 |
| nose (rigid baseline) | 2.03 | 1.64 | 0.73 |

* The **mouth is the busiest region of the idle face** in all three windows: 3.5x the
  rigid baseline for Sam, 7.6x for Mike, and ~2.5x the brow.
* The eye region's frame-to-frame standard deviation is **12.05 levels** against a
  **1.25-level** noise floor, i.e. the face changes ~10x more than the grain.
* **Event envelope** (Mike, 52.8–56.8 s): the mouth signal rises from ~1 to ~10 between
  53.20 and 53.60 — **400 ms onset** — then decays back to baseline by 56.4 s, a
  **~2.8 s release**. Fast in, slow out, and there is no flat hold in the middle.
* Nothing in the sample is a held "expression pose". The face moves continuously and
  the events are swells on top of that, not a pose being struck and dropped.
* **Left/right asymmetry could not be separated from the lighting**: every shot has a
  hard one-sided key, so one half of every face is in shadow.
* **State does change the face.** Sam AFTER (hurt, headlamp) has a higher brow signal
  (3.16 vs 2.77), a smaller gaze excursion (5.9 % vs 8.4 % IPD) and a faster body band
  (0.34 Hz vs 0.18 Hz) than Sam BEFORE, i.e. tighter and quicker, not a colour grade.

---

## 8. Response to the player

**The decisive frames are Sam 11.4 → 14.0 s.** Her collar, her shoulder line, the
background motes and the screen-space UI are all stationary to the pixel while her
**head alone** rotates. So this is a head/gaze drive against a fixed body and a fixed
camera — not a camera orbit. (Contact sheet 06 in the reference folder.)

Measured from the width of the lit face in a band at eye height:

| Phase | Window | Lit-face width | Duration |
|---|---|---|---|
| 3/4 → full profile | 11.55 → 12.30 | 500 → 287 px | **750 ms** |
| held at profile | 12.30 → 12.48 | ~287–302 px | **~180 ms** |
| profile → frontal | 12.48 → 13.90 | 302 → 689 px | **1.42 s** |
| settled, holding | 13.90 → ~14.1+ | 689 px, flat | ≥ 200 ms visible, ~2 s in the wider take |

The second phase is clearly S-shaped: a slow start (12.48–13.20, only 302 → 498), a
burst (13.23 → 13.31, 498 → 629 in 83 ms), then a long exponential settle.

**Settle constant** — residual to the final 689 px:
60 → 32 → 19 → 10 → 6 → 3 → 1 px in steps of 83.7 ms. Ratio ≈ **0.55 per 83.7 ms**,
so **τ = 0.14 s**; 63 % in 140 ms, **95 % in ~0.42 s**, 99 % in ~0.65 s. Equivalent to
a critically damped second-order spring at **f ≈ 1.1 Hz, ζ = 1.0**.
**No overshoot anywhere** — the width never exceeds its final value before settling.

**Range.** The extremes in this take are full profile and frontal, i.e. **≥ 90° of
yaw**, and the head stops dead at each end rather than wrapping.

**Return.** At the frontal extreme the head stays put. Within the footage there is no
spring-back to a neutral pose.

**What the footage cannot give:** the controller input itself. So input-to-head
**latency**, the exact stick-to-angle curve, the per-axis (yaw vs pitch) limits, and
whether the hold at the extreme is "stick still held" or "released and it stays" are
all **unknown**. Everything above describes the head's own response once it is moving.

---

## 9. Camera, light and image

* **Camera locked** in every window measured: UI, background motes and the body
  silhouette are stationary within the noise floor. **No push-in** inside these windows.
* **Light is fixed in the world and the face relights as it turns.** Mean face
  luminance swings smoothly by about ±5 levels with a ~3 s period through Jessica's
  rotation (90.3–105.3 s). This is the strongest single "it is 3D" cue in the reference.
* **Grain.** Temporal per-pixel standard deviation in a static dark background patch:
  **1.25 levels = 0.49 % of range**. This is an *upper* bound — my capture re-encoded
  at JPEG q0.88 — so treat ~0.3–0.5 % as the target, visible only in the shadows.
* **Focus.** High-frequency energy: face box **0.78**, hair silhouette **0.50**. Focus
  sits on the face and softens into the hair and the background. The screen-space UI is
  always sharp, so the softness is in the scene, not the composite.
* **Vignette / grade.** Full-frame corner means 8.9–34.2 against a centre of 28.7 —
  the falloff is **not radially symmetric**; a dark gradient runs toward the
  bottom-right. It is a grade, not a lens vignette.
* Small bright specks (dust / snow) drift in the background.

---

## 10. Idle structure

**Not a loop.** It is at least five independent layers running at once:

| Layer | Character | Rate |
|---|---|---|
| head drift (yaw/pitch/translate) | non-periodic band-limited noise | 0.13–0.34 Hz (3–8 s) |
| torso / chest | same band, out of phase with the head by ~1/3 cycle | 0.16–0.34 Hz |
| lids | full blinks + half blinks + slow aperture changes | something every ~2 s |
| mouth | continuous drift with occasional swells | swell every 3–5 s |
| hair / cloth | follows with its own lag; strands cross the face | — |

Because none of these share a period, nothing ever repeats. That is what makes it read
as alive rather than as an animation.

---

## 11. Motion constants for our rig

Concrete targets. Ranges are the spread actually observed; take the middle unless a
character's own painting argues otherwise. `IPD` = the painting's inter-pupil distance
from `src/ui/common/face-crops.json`. Head width ≈ 3.0 x IPD.

**Blink**

| Constant | Value |
|---|---|
| full blink: close / hold / open | **50 / 33 / 66 ms** (range 50 / 17–50 / 66–67) |
| full blink total | **150–170 ms** |
| closing vs opening | opening is 1.3x slower; never symmetric |
| full-blink interval | **4.9 s mean**, sample from 2.5–8 s, never regular |
| half blink | 200 ms, lid reaches **50–60 %** and returns, no closure |
| half-blink share | roughly **as many half as full**; some lid event every ~2 s |
| slow lid-aperture change | 0.7–1.05 s, eye rolls under the lid |
| double blinks | none observed — do not add them |

**Gaze**

| Constant | Value |
|---|---|
| idle fixation drift | **±1.1 % of IPD RMS**, total excursion < 9 % IPD over 5 s |
| idle saccades | **none** — do not let the eyes dart during a steady idle |
| gaze changes | happen **with** the head turn, not instead of it |
| lid follows the eye | yes — aperture narrows as the eye rolls down |
| eye-lead over the head | **unknown** (see §12); if used, keep it small and justify it separately |

**Head follow (player input)**

| Constant | Value |
|---|---|
| spring | **critically damped, f ≈ 1.1 Hz, ζ = 1.0** (τ = 0.14 s) |
| settle | 63 % in 0.14 s, **95 % in 0.42 s**, 99 % in 0.65 s |
| overshoot | **zero** |
| yaw range | **≥ ±45° from frontal** (frontal ↔ full profile observed) |
| stopping | hard stop at the limit, no wrap, no bounce |
| on release | holds the pose (measured); a slow return to neutral is a design choice, **not** in the reference |
| input latency | **unknown** — pick 1 frame and check it by feel |

**Idle body**

| Constant | Value |
|---|---|
| head sway | **±6.5 % of IPD** (Sam) to ±3.3 % (Mike) = ±3.0 % to ±1.5 % of head width; vertical ≈ horizontal |
| chest sway | **±3.6 % of IPD** horizontally, ±2.9 % vertically |
| drive | band-limited noise, **0.13–0.34 Hz**, *never* a sine |
| head vs chest | independent phase; chest lags by ~1/3 of a cycle |
| period per character | fast/tense states run at the top of the band (0.34 Hz), calm at the bottom (0.16 Hz) |

**Expression**

| Constant | Value |
|---|---|
| busiest region | **the mouth**, 3.5–7.6x the rigid-face baseline, ~2.5x the brow |
| never still | the mouth changes every frame; there is no rest pose |
| event envelope | **onset 400 ms, no hold, release ~2.8 s** — fast in, slow out |
| event rate | a visible mouth/brow swell every **3–5 s** |
| brow | about 40 % of the mouth's amplitude |
| asymmetry | unknown from this footage; keep any asymmetry subtle |
| state | changes rate and amplitude (tenser = faster band, tighter gaze, busier brow), **not** just a colour grade |

**Image**

| Constant | Value |
|---|---|
| grain | **0.3–0.5 % of range**, temporal, shadow-weighted |
| focus | sharp on the face, softening into hair and background; UI always sharp |
| relight on turn | face mean luminance **±5 levels** across the turn range |
| grade | asymmetric darkening toward one corner, not a symmetric vignette |
| frame rate | author at **60 fps**; a 3-frame lid close is only legible there |

**Reduced motion** (`prefers-reduced-motion`) — not in the reference; our own rule:
freeze the body noise and the camera, keep blinks at the measured timings (they are
information, not decoration), let the head follow input but with τ raised to ~0.25 s
so nothing snaps, and drop grain and motes.

---

## 12. What the footage cannot establish

* **The controller input.** No stick trace, so input-to-head latency, the stick-to-angle
  mapping, per-axis limits, and the release behaviour (hold vs return) are unknown. The
  "holds at the extreme" observation could be a held stick.
* **Eye-lead over the head**, in frames or degrees: the eye is occluded or in shadow
  exactly when the head moves fastest.
* **Left/right facial asymmetry**: every shot has a hard one-sided key light.
* **Head pitch and roll ranges** separately from yaw: only one axis moves cleanly in
  any window I could measure.
* **Whether blinks are scheduled or event-driven**, and whether they are coupled to
  gaze shifts: 3 full blinks is far too small a sample.
* **Long-run idle structure.** The longest camera-locked, head-still window in the whole
  6 minutes is 6.2 s, so nothing here proves what happens over a minute of standing
  still. The "not a loop" claim rests on autocorrelation of 3–6 s windows plus the fact
  that no two windows look alike; it is strong but not airtight.
* **Whether the character tracks the camera or a world target** when the player is not
  driving.
* Anything about **audio**, and anything about the **original 2015 build** — the
  "BEFORE / AFTER" in this video is the in-game trait toggle, not old-vs-remaster.

---

## 13. Gaps in prototype v1

`docs/concepts/pause-until-dawn/prototype/` (shots `01-centre`, `07-blink-sequence`,
`08-gaze-sweep`). Most damaging first. Distance from the reference, not from taste.

1. **The head cannot turn.** v1 gives "~11° equivalent at full deflection" as a warp of
   one painting. The reference's headline move is **≥ 90° of yaw**, ending in a full
   profile — a completely different face, not a squashed one. No 2D warp reaches that.
   This single gap is why the screen reads as a photo being pushed around. It needs
   painted yaw keys across the range (frontal, 3/4, profile at minimum, per character)
   with the warp only carrying the gaps between them.
2. **The whole picture moves as one sheet.** In the reference the shoulders, collar and
   background are **pinned** while the head alone moves. v1 moves head, chest, hair and
   camera together with parallax weights, so every input smears the entire image. The
   body must be a separate, mostly static layer.
3. **The mouth and brows never move.** The mouth is the *busiest* region of the
   reference's idle face — 3.5 to 7.6 times the rigid baseline — and v1 has no mouth
   motion at all. This is the biggest reason it reads as a warped still, and it is
   exactly what Bailey asked for ("Yuna's expression also needs to be animated").
   `E` changing lid aperture and colour grade is a state proxy, not expression.
4. **The sway is periodic.** v1 breathes and drifts on sine-like cycles. Measured
   autocorrelation of the reference is 0.06–0.42 — it is band-limited **noise** at
   0.13–0.34 Hz with head and chest on independent phases. A periodic sway is legible
   as a machine within about ten seconds.
5. **The blink is too fast and the lid is drawn.** v1: "5 frames of ~90 ms" with a
   painted cheek-skin patch sliding down. Reference: **150–170 ms** (close 50, hold
   17–50, open 66), the lid *rolls over the eyeball*, the lash line curves as it goes,
   the aperture narrows from the top and the lower lid rises to meet it. A sliding flat
   patch cannot do this. The README already says an inpainted closed-eye variant is
   needed — this spec says it also needs **two** intermediates, not one, and a
   separate **half-blink** that stops at 50–60 %.
6. **No relighting.** The reference face changes mean luminance by ±5 levels as it
   turns, because the key is fixed in the world. v1 only cross-fades a colour grade per
   state. Without relighting, a turned head looks like a sticker.
7. **The eyes dart.** v1 has "an idle look-around with occasional saccades". The
   reference has **no saccades at all** in 14.6 s of steady idle; the glint holds within
   ±1.1 % of IPD. v1 spends its motion budget in the wrong place — move it to the lids
   and the mouth.
8. **Hair is rigid and masked off the face.** v1's noise sway "never crosses the face
   core". In the reference loose strands slide across the cheek and over the eye on
   their own lag, and long hair moves five times as much as short hair.
9. **No focus falloff.** Reference focus sits on the face (HF energy 0.78) and softens
   into the hair (0.50) and the background; only the screen-space UI stays sharp. v1 is
   uniformly sharp, which flattens it.
10. **The gaze sweep does not read as gaze.** In `08-gaze-sweep` the iris and the eye
    opening move together, so the eye never looks anywhere — it only slides. The iris
    has to travel **within** a fixed aperture, and the lid has to follow it.
11. **Grain is missing or wrong.** Target ~0.3–0.5 % of range, temporal, weighted to
    the shadows.
12. **The painting itself fights the format.** `01-centre` is a frontal, evenly lit,
    smiling portrait inside a hard-edged rectangle. Every reference frame is a dark,
    hard one-side-keyed three-quarter head that bleeds off the frame edge. A frontal
    symmetric smile cannot carry the mood, cannot show a turn, and gives the rig no
    shadow side to relight.
13. **No state change in the face.** v1's states change lid aperture, breathing rate and
    grade. The reference's hurt state changes the *rates*: faster body band (0.34 vs
    0.18 Hz), tighter gaze (5.9 vs 8.4 % IPD), busier brow (3.16 vs 2.77). Same rig,
    different constants — which is cheap to do and v1 is most of the way there.

---

## 14. Where the evidence is

`D:/Tools/pyrefly-ref/until-dawn-character-screen/` (outside the repo, by rule):

* `capture.mjs`, `analyse.py`, `blinks.py`, `periodicity.py`, `yaw.py`,
  `imagemetrics.py`, `boxes.py`, `sheet.py` — the whole measurement chain.
* `frames/sam1` (SAM BEFORE 6–26 s), `frames/sam2` (SAM AFTER 28–45 s),
  `frames/mike` (MIKE BEFORE 52–60 s), `frames/sam3` (**misnamed** — it holds
  MIKE AFTER 80–90.2 s and Jessica 90.3–105.3 s), `frames/cat5` (verified titles,
  1–57 s). `frames/catalog` and `frames/cat4` are the two bad passes; their labels
  past ~76 s are wrong.
* `sheets/01-sam-full-blink-9.01-9.39.png` — the blink, frame by frame.
* `sheets/06-sam-orbit-wide-11.4-14.0.png` — the head turning against a pinned body.
* `sheets/04-mike-expression-52.8-57.0.png` — the mouth event's envelope.
* `sheets/02-sam-half-blink-7.93-8.33.png`, `03-mike-full-blink-54.47-54.86.png`,
  `05-sam-camera-orbit-11.5-13.6.png`,
  `07-catalogue-titles-verified-1-57s.png`. Anything named `_BAD-*` or
  `catalog-*`/`titles*` is from the two mislabelled passes — ignore it.
* `out/*.npz`, `out/*-plot.png` — every per-frame series behind the tables.
