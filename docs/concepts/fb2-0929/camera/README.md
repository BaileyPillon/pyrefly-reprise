# Camera comfort: what was measured, and three options (fb2-0929)

Bailey, 2026-09-29, passing on a friend's feedback and agreeing with it: *"The camera movement
between attacks is a bit too fast and made me a bit dizzy ... I think it's cuz the UI shifts with it."*

**Update, 2026-09-30:** Bailey picked `calm` as the default for everyone (D-291); it is built on branch `firstrun-o2`, and `final/` has the default-camera clips and measurements. The text below is the options round as it was shown.

**Nothing in this folder is switched on.** The options are behind `?cam=<name>` (or
`window.__pyrefly.cam('<name>')`). The default, `current`, is today's camera. Bailey picks
(hard rules 9 and 10). Branch `fb2-0929-camera`. Handoff: `docs/handoff/fb2-0929-camera.md`.

## 1. What the live camera does (release 31a, measured, not estimated)

Headless Chromium on the GPU, real Enter presses (one every 0.65 s: the coach card, ATTACK, the target).
Every frame I read the three.js camera (position, view direction, FOV), `BattleCamera`'s roll,
push and shake, and the on-screen box of every HUD element. The scripts are in
`D:/Tools/pyrefly-scratch/fb2-0929/camera/` (`measure.mjs`, `analyze.mjs`, `panels.mjs`).
"Turn" means how far the view direction rotates. "Peak" is the fastest rotation, measured over 50 ms windows.

| Run (live) | shot changes / s | rig moves: median length, turn | median peak, max peak | hard cuts | attack roll | shakes |
|---|---|---|---|---|---|---|
| Ch. I (FFX) 1600x900 | 1.07 | 582 ms, 8.3° (max 16°) | 36 °/s, 96 °/s | 9, 16.6–17.2° each | 4°, ~37 °/s | 7 in 26 s |
| Ch. II (FFX) 1600x900 | 1.02 | 570 ms, 7.0° | 41 °/s, 59 °/s | 7, ~12.5° | 4°, ~46 °/s | 7 |
| Ch. IV (FFX-2) 1600x900 | 1.20 | 548 ms, 6.8° (max 11°) | 32 °/s, 119 °/s | 11, up to 11.4° | 4°, ~38 °/s | 12 in 37 s |
| Ch. VI (FFX-2) 1600x900 | 0.72 | 621 ms, 2.3° | 10 °/s, 46 °/s | 0 | 4°, ~42 °/s | 16 |
| Ch. I (FFX) 390x844 | 0.35 | 599 ms, 1.7° | 4 °/s, 7 °/s | 0 | 4°, ~41 °/s | 7 |
| Ch. IV (FFX-2) 390x844 | 0.37 | 367 ms, 1.8° | 5 °/s, 26 °/s | 0 | 4°, ~45 °/s | 12 |

- **Why the peaks are high.** Every rig move uses the `cubicInOut` curve, and that curve's peak
  speed is **three times its average**. A 200 ms move onto the attacker turns about 7.8°
  (peak about 67 °/s). The impact then **cuts** 11–17° to the target, the frame rolls 4°, and
  about 600 ms later it turns back to the master. That is roughly one shot change a second
  on a desktop screen.
- **On a phone the camera already holds the master shot** (A-12, "fit the phone slice"). There,
  only the 4° roll and the shakes move the frame.
- **REDUCE MOTION (OPTIONS A2, on `main`, not live yet) does calm the camera.** With the OS
  setting on I measured 0 moves, 0 roll and 0 shakes. Every rig change became a cut
  (25 cuts in 21 s, 8–17° each, sometimes three within 0.5 s). That is the approved
  definition (D-220 Q2 (a)).

## 2. Which UI moves while the camera moves, and why

Pixels each HUD element moved per frame while the camera was moving / while it was still (1600x900):

| Element | Ch. I (FFX) | Ch. IV (FFX-2) | Why |
|---|---|---|---|
| Enemy-intent card (FFX-2: a 300x266 text card hung over the boss) | docked by the turn list (FFX) | **18.8 / 15.0, range 1182x481 px** | Hung on the boss's projected head, so it follows every camera move. It also **jumps 480–800 px** whenever the target name plates or the turn cut-in appear, because it steps out of their way. That happens even with the camera held still (13 px a still frame under `steady`). |
| Damage numerals, chain chip | 14.8 / 3.0 | 11.5 / 6.2 | World-anchored on purpose. They follow their target. |
| Move-advisor card | 5.4 / 0 | 3.7 / 0.6 | FFX: re-placed when targeting opens (the name plate is a new obstacle). That happens right at turn start, while the camera is still turning back, so it only *looks* camera-driven. FFX-2: the card's lane is fenced by where the girls stand on screen, and that was read through the moving camera. |
| Strategy-guide rail (FFX-2) | 0.1 / 0.05 | 1.7 / 0.2 | Its bottom fence is the girls' heads, read through the moving camera. |
| Coach line (FFX-2, first run) | — | 9.4 / 0 | It steps off the fighters, measured through the moving camera. |
| Command menu, turn order, party rows | ≈ 0 | ≈ 0 | Fixed. They do not move. |

No HUD container is transformed, tilted or given parallax together with the camera. The roll turns
only the 3D frame. What moves is (a) cards and labels hung on 3D points and (b) panels laid out
around the fighters' on-screen positions.

## 3. What the comfort guidance says

- **Xbox Accessibility Guideline 117** ("Visual distractions and motion settings",
  learn.microsoft.com/gaming/accessibility/xbox-accessibility-guidelines/117). It warns that players
  can get motion-sick reading text that moves, and gives the example of a UI that bobs along with
  the camera. It says to avoid camera shake or offer a way to turn it off, and to let players turn
  off automatic camera movement.
- **Game Accessibility Guidelines**, "Provide an option to turn off / hide background movement"
  (intermediate) and "If the game uses field of view, allow a means for it to be adjusted"
  (intermediate): simulation sickness "can be extreme". "Avoid VR simulation sickness triggers"
  (basic, written for VR) names acceleration and uncontrolled camera movement as triggers. It asks
  for comfort settings to be the default ("comfort mode"), with an opt-out for players who can handle more.
- **FFX / FFX-2** (`research/battle-camera-perspectives.md`, `research/ffx-vs-ffx2-presentation.md`):
  - FFX's battle camera is authored and never under the player's control `[verified: 4 sources]`.
  - It reframes every action `[single source]`.
  - Read together, two informal GameFAQs posts say each shot holds still and the game cuts between shots `[derived]`.
  - FFX's art director said they avoided a camera that always follows the party because it causes motion sickness. He was talking about the field camera; applying it to battle is `[derived]`.
  - How FFX-2 frames each action is `[absence]` in the sources.
  - The -4° roll and the Overdrive push-in are **ours** (the Ink & Gold spec), not canon.
- A nearby precedent: FFVIII Remastered has a "trigger rate" setting that controls how often the battle camera swings, down to never `[single source]`.

## 4. The fix already in this branch (a defect, shipped by default, both games)

Panels that step around the fighters (the advisor card, the FFX-2 guide rail and advisor lane,
the coach line) are now laid out against **the shot the camera is settling on** (`BattleCamera.restCamera()`),
not the frame in mid-move. They hold still while the camera travels and settle in one step when
the shot changes. Measured on Ch. IV at 1600x900:

- the guide rail's movement during camera moves fell from 1.73 to 0.59 px a frame (1,802 to 663 px in total);
- the advisor card's horizontal range fell from 132 to 71 px.

World-anchored labels (the numerals, the cursor, the intent card) still follow their target, as designed.

## 5. The options: see `ch1-*.mp4`, `ch4-*.mp4` and the `-a` / `-b` stills

Each clip is 8 s, H.264 at 1280x720, and starts at the first command. It covers two or more
attacks on seed 1, played with real keys. The stills are taken 2.5 s and 5.5 s into each clip.

| Preset | Game | What changes | Ch. I: moves (median length, turn, median peak / max peak), cuts, roll, shakes | Ch. IV: same | Cost |
|---|---|---|---|---|---|
| `current` | both | nothing (today) | 567 ms, 8.3°, 36 / 103 °/s; 9 cuts up to 17.2°; roll 4°; 7 shakes | 548 ms, 6.9°, 34 / 62 °/s; 8 cuts up to 11.4°; roll 4°; 7 shakes | — |
| `calm` | both | half the travel toward a close shot; moves at least 1.8x longer (and ≥ 700 ms) on a sine curve, capped at 20 °/s; no roll; half the push; no shake on routine hits, half on heavy ones; the intent card rests over the boss | 966 ms, 3.2°, 5 / 39 °/s (one move); 8 cuts ≤ 7.1°; roll 0; 0 shakes | 806 ms, 2.9°, 5 / 20 °/s; 9 cuts ≤ 4.9°; roll 0; 0 shakes | Close-ups are half as close, so less drama. Awaited moves (victory, telegraph) run about 1.8x longer. |
| `steady` | both | the master shot holds between turns. A close shot becomes a slow push on the wide frame (0.6 of the push, 2.5x as slow). A long rig change (over 12°: victory, a scripted angle) cuts instead of swinging. No roll, no routine shake. The intent card rests over the boss. | no rotation at all (0 °/s); only the push | ≤ 1°, 20 °/s peak (push only) | Loses the per-action reframing that FFX is sourced to have, so it is the least faithful. Best for the friend's complaint. |
| `originals` | **FFX only** | every rig change is a cut and each shot holds (no roll, no push, which are ours); shakes as today (unsourced) | 7 small moves (8 / 12 °/s); **27 cuts** up to 17.2° | (FFX-2 plays `current`: sources are silent) | Cuts are about 1.1 a second. That avoids the sense of motion but can be jarring, the same trade REDUCE MOTION makes. |

The intent card still jumps 480–800 px under every preset. That jump comes from it stepping out of
the target plates and the cut-in, not from the camera (see section 2), so it needs its own decision.
