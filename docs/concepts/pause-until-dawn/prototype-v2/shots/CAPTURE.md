# Re-capture after the fix pass (2026-09-22)

Re-captured `shots/` against commit `98ff595` ("Living-portrait v2 fix pass:
kill the double-exposure at every off-centre yaw") -- the previous set
predates that commit's own re-capture by only a few minutes and (per
`git log -- shots/`) was actually committed *by* 98ff595 itself, so this pass
exists to get an independent look, not to catch a stale set. Real Chromium
(`PYREFLY_BROWSER=gpu`), Playwright, real keyboard/mouse events driving
`window.__livingPortrait`'s own `InputController` -- not JS pokes of the
driver -- with one disclosed exception: **the "smile" mouth-event still has
no key binding at all.** `E` (`KeyE`) cycles `normal -> determined -> hurt`
(`input.ts`, `driver.ts`'s `EXPRESSION_CYCLE`); it does not force a mouth
patch. `forceMouthEvent('smile')` is the documented debug/verification hook
`driver.ts` exposes for exactly this (the same one all three prior capture
passes used), so that one still (06) is JS-driven; every other still and both
clips are real input.

**Viewport is 1000x2000, not the literal 1440x810 the brief named.** At
1440x810 `#stage`'s own CSS (`width: min(90vw, 62vh * (832/1216))`) resolves
to ~344x502 -- the 62vh term dominates in a short/wide window -- well below
the rig's native 832x1216 canvas. That is too small to see the pixel-level
ghosting/seams this pass exists to look for (confirmed empirically this
session with throwaway probe scripts, not committed). 1000x2000 lifts the
62vh cap so the stage renders at ~848x1240, at-or-above native resolution;
viewport size does not otherwise change the WebGL canvas's own drawing-buffer
resolution or any state-machine behaviour.

**A capture-fidelity bug found and fixed before trusting any of this:** a
real screenshot call in this environment takes ~300-350ms wall-clock
(measured directly). The yaw spring (tau=0.14s) or the blink scheduler can
cross an entire pose in less time than that, so screenshotting right after
`pollFrame` confirms a crossing systematically overshoots -- confirmed by
comparing the diagnostics HUD baked into the saved PNG (state at the moment
pixels were actually captured) against the frame the poll matched on: a first
attempt at "-40deg" actually saved a -62.6deg frame, and a first "mid-blink"
saved a fully-closed eye, both silently wrong. Fixed by freezing
`window.__livingPortrait.opts.debugTimeScale = 0` the instant the poll
matches (the real key is still held, the target is unchanged -- this stops
the *clock* for the screenshot's own latency, it does not touch the pose a
real key-hold produced) and confirming the frame is identical before and
after the frozen screenshot. Every still below reflects the frozen,
verified frame, logged inline.

## Per-still findings

| Still | Yaw reached | What it shows |
|---|---|---|
| `01-centre.png` | -1.5° (idle sway) | Frontal, idle. Body/collar in the expected position. **A hard-edged rectangular tone seam is visible across the collar/neckline** (see "Collar seam" below) and a faint green/blue-yellow speckle band in the hair just above the fringe (see "Hair speckle" below). No hole, no duplicate earring/eye. |
| `02-three-quarter-left.png` | -41.6° (residual -46.85, genuinely still moving -- frozen for capture) | **A real double-exposure ghost in the green (viewer-left) eye**: a second, smaller iris/pupil shape visible offset from the real one inside the same eye socket (`crop-eyes-m40.png`, zoomed). **A hard vertical seam in the hair at the temple**, right of centre: a straight-edged boundary where hair detail/tone changes abruptly (sharper, more defined strands on one side; softer, flatter on the other). Collar seam and hair speckle both present, more visible than at centre. Earring: single, correctly attached, no duplicate. |
| `03-profile-left.png` | -78.2° (residual -9.97, still settling -- frozen for capture) | The visible (right) eye itself is clean at this angle -- no double iris. **A vertical box-edge seam is visible in the hair near the right border of the head** (the `profile-left` key's own crop box not blending into whatever is drawn around/behind it). Collar seam still present. Earring: single, correctly attached, no duplicate visible (`crop-eyes-m80.png`, `crop-hair-m40.png` region checked at native res). |
| `04-three-quarter-right.png` | 38.0-38.8° (this rig's hard stop on that side) | Clean. No ghosting, no seam beyond the collar one. This side's key (`q34-right`) genuinely turns and reads the most convincingly "turned" of the three off-centre stills, matching the art pass's own disclosure that `q34-left` "barely reads as a 3/4 turn" while `q34-right` does. |
| `05-mid-blink.png` | eyeState `closing`, aperture 0.67 | Caught cleanly on the first real `B` press (no retries needed) -- lids are visibly, convincingly mid-way down over both eyes, reads as a real blink motion rather than a hard cut between open/closed. |
| `06-mouth-event.png` | mouth `smile`, weight 1.00 | Full-weight smile, clean. (JS-driven, see note above -- no key produces this.) |
| `07-hurt.png` | yaw 3.8°, expression `hurt` | Visually near-identical to normal/centre -- mouth still shows the neutral painted smile shape, no distinct "hurt" facial read. This matches the disclosed state of the build (no brow patch art delivered; `hurt` only tightens gaze and raises sway/brow-scheduler rate, it does not force a mouth patch), not a new defect, but worth restating: as shipped, "hurt" does not read as hurt from the face alone. |
| `08-reduced-motion.png` | yaw 0.0° exactly, `reducedMotion: true` | Confirms reduced motion holds a true dead-centre pose (no idle sway). The collar seam and hair speckle are both still visible here -- see next paragraph, they are not sway-driven. |

**Collar seam (all 8 stills).** A straight, hard-edged brightness/tone
discontinuity runs across the collar/neckline in every single still,
including `08-reduced-motion.png` with reduced motion on (so it is not the
chest-sway breathing offset -- that's zeroed under reduced motion and the
seam is identical either way). Comparing `renderer.ts`'s own code against
this: the pinned `body` layer is explicitly "never warped, never relit" while
the head layers (`headCore`, `hairFront`, `hairBack`) get the full
relighting/grade pass -- a permanent tone mismatch exactly where the two meet
is the likely mechanism, not something this pass's chest-sway wiring touches.
Not called out as fixed or disclosed anywhere in the README's own "still
clean at 0°" claim (Part 4's table says "0° (dead centre): Still clean"),
so this reads as either a regression the fix pass's own re-check missed, or a
standing gap that was never actually clean. Either way it's visible at every
yaw sampled this pass, not just the off-centre ones the README discusses.

**Hair speckle (01, 02, 08; not 04, not clearly 07).** A band of
saturated green/blue/yellow color noise sits in the hair just above the
fringe, at the same screen position as a box edge visible in the wider crop
(`crop-hair-m40.png` shows it clearly at 2x). It is NOT simply tied to yaw
sign or to being off-centre: `08-reduced-motion.png` is at yaw 0.0° exactly
(no blending, single frontal key, per `bracketForYaw`) and still shows it;
`07-hurt.png` at yaw 3.8° does not show it in the same crop window, though a
few-degree pose shift could plausibly have moved the specific hair strand
carrying the highlight out of frame rather than removed the artifact. Not
investigated to a root cause this pass (no source changes were made -- this
is a look-only capture pass) but flagged clearly: it reads as a real
rendering anomaly (color noise inconsistent with the painted art), not an
intentional highlight.

## Clips

- `clip-12s.webm` (14.28s, 1.9MB): idle 3s -> real `ArrowLeft` hold to
  ~-80° and held there 2s -> real mouse move to stage-centre (recentres
  gaze; see note below) -> real `ArrowRight` hold to +40° -> recentre ->
  real `B` blink -> `forceMouthEvent('smile')` (no key exists for this) ->
  idle to close out. Verified by decoding a frame with `ffmpeg` -- plays
  back correctly, shows the turn and the collar seam consistently.
- `idle-8s.webm` (9.44s, 1.15MB): zero input, sway/blink/mouth-drift only.
- **A control-scheme finding, not a capture bug:** releasing a held arrow
  key does not recentre the gaze -- `state.ts`'s target only updates on a
  frame where the sampled input is non-zero, and "no key held" samples as
  exactly `{x:0,y:0}`, which the driver's own `tick()` treats as "no
  override this frame" rather than "recentre." A held key's target (here,
  -85° or +40°, the rig's own hard stops) therefore persists forever once
  released, and the head keeps drifting toward it. The clip's "back to
  centre" beats use a real mouse move to a point ~4px off dead-centre (exact
  centre samples as `{0,0}` too, which would silently do nothing) to give a
  genuine non-zero recentring target. This is a real behaviour of the
  shipped input priority logic, not a scripting workaround invented to fake
  a pose.

## Verdict

Would this read as a painting coming alive, or a warped picture? Mostly the
former, with real seams that keep it from being convincing under scrutiny.
The blink is the strongest piece of work here -- caught cleanly on the first
real keypress, the lids visibly roll rather than cut, and it alone would
pass as "alive." The right-side turn (`q34-right`, +40°) is close behind: no
ghosting, no seam beyond the one described below, a genuine change of angle.
Centre and the smile hold up at a glance. But every single still, at every
yaw and every expression tested, carries the same hard-edged tone seam
across the collar, which reads as a picture in two mismatched pieces the
instant you look below the chin rather than at the eyes -- and the left-side
turn adds a second, more damaging tell on top of it: a visibly doubled iris
in one eye at -40° and a hard box edge in the hair, exactly the kind of
"continuity" failure Bailey has called out before. Nothing here is a hole or
a missing region, and the earring never duplicates in this set -- the fix
pass's own bug #3 (earring floating over a turned head) really does look
fixed. But the collar seam being present even in the reduced-motion,
dead-centre still, after a pass whose own README claims "0°: still clean,"
means the honest read is: closer than before, not there yet -- a viewer
holding still on the centre pose for more than a second, or glancing at the
neckline instead of the eyes, will see the seam.

## Defect index (still -> defect)

- Collar/neckline hard tone seam: `01-centre.png`, `02-three-quarter-left.png`,
  `03-profile-left.png`, `04-three-quarter-right.png`, `05-mid-blink.png`,
  `06-mouth-event.png`, `07-hurt.png`, `08-reduced-motion.png` (all 8).
- Doubled iris/ghost eye at -40°: `02-three-quarter-left.png`,
  `crop-eyes-m40.png`.
- Hard vertical hair/box seam at the temple, -40°: `02-three-quarter-left.png`,
  `crop-hair-m40.png`.
- Hard vertical box seam in hair near the head's right border, -80°:
  `03-profile-left.png`.
- Green/blue/yellow color-noise speckle in the hair fringe highlight:
  `01-centre.png`, `02-three-quarter-left.png` (`crop-hair-m40.png`),
  `08-reduced-motion.png`.
- "Hurt" not reading as hurt from the face alone (disclosed limitation, not
  a new bug): `07-hurt.png`.
- No hole, no missing region, no duplicate earring/eye anywhere in this set.
