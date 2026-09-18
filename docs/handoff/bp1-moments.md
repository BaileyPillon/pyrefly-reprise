# bp1-moments — the battle's camera moments

Key `moments`. Owns the choreography that decides **which shot** a battle is
looking at, and the full-screen chrome that frames it.

| file | what it is |
| ---- | ---------- |
| `src/engine/BattleMoments.ts` | every camera moment, in one class. No `three`, no DOM. |
| `src/engine/BattleCamera.ts` | the rigs the moments move between. |
| `src/ui/common/transitions/MomentOverlay.ts` | the DOM half: letterbox, name slab, heartbeat vignette. |
| `src/ui/common/transitions/swirl.ts` | the battle-start swirl / results wipe. |
| `src/ui/ffx/TelegraphBanner.ts` | the HUD's charge banner and its screen border. |
| `src/app/screens/BattleScreenFlow.ts` | the transition call at the screen boundary. |

Tests: `tests/unit/presenter-moments.test.ts` (26),
`tests/unit/ui-transitions.test.ts` (16), `tests/unit/battle-camera-moves.test.ts`.

## The shots

FFX's battles are not one locked-off camera — they are a string of short, named
shots. `BattleMoments` is the only thing that picks one. Authored durations all
live in `MOMENT_TIMING`, push distances in `MOMENT_PUSH`; those two objects are
the tuning surface.

- **Battle start** — swirl in, party slides on staggered (each member starts a
  body-width further out than the last), settle on `idle`, then the boss reveal:
  a slow push with its name plate. `battleStart()`.
- **Per action** — `actionOpen()` punches in on the attacker; an `attack` pose
  also kicks the horizon by `ATTACK_ROLL_DEG` (-4°), a `cast` instead *holds* on
  the caster for `castHold` so the spell reads before the cut. `impact()` hard
  **cuts** to the target — FFX does not pan — and only on the first hit, or a
  twelve-hit Attack Reels would strobe. `actionClose()` returns to neutral.
- **Overdrive** — `overdriveStart()`: brief letterbox, the Ink & Gold name slab
  (`OVERDRIVE` / the move's name), and a held 0.14 dolly under the payoff.
- **Charge telegraph** — `telegraph()`: slow zoom onto the boss plus the
  heartbeat vignette. Stage 2 pulses faster (132 bpm vs 84) and pushes 1.35×.
  The *banner* is the HUD's (`TelegraphBanner`); the moment is the zoom and the
  throb. Both read the same `TELEGRAPH_BPM`, so the frame and the screen border
  beat together instead of drifting.
- **Form change** — `formChange()` holds on the boss through the flash and
  clears its `revealed` flag, so a new form earns a fresh name plate.
- **Victory** — the victory rig, the fanfare, then the results wipe.

### Two deliberate asymmetries

- The **opening is the only moment that touches HUD visibility**. It keeps the
  HUD down and raises it on the way out, because the reveal plate is full-bleed
  chrome hung off the right edge — exactly where the CTB list lives. Mid-battle
  the HUD stays up unconditionally. The `finally` in `battleStart()` means an
  abort, a rigless scene or a throw out of the art layer all still hand the
  player their HUD back.
- Visual-bible §3.11.0 authors the CTB/command/party windows sliding off for an
  Overdrive. That is **not** done here: `HudPort.setVisible` is too blunt — it
  would take the damage numerals down at the exact moment the biggest number in
  the fight is printed. Left to whoever owns `FFXBattleHud`.

## Skipping

Everything is skippable. `MomentDeps.speed` scales every duration:

| speed | behaviour |
| ----- | --------- |
| `normal` | authored timing |
| `fast` | 0.32×; rigs still move (the frame would jump otherwise) but nothing *blocks* — slabs and letterbox holds resolve immediately |
| `skip` | no chrome at all, every rig change is a hard snap; a chapter resolves in milliseconds for e2e and the critic |

A `holdMs` of 0 still *shows* a slab for a frame rather than skipping it: at
`fast` the player is watching, just impatiently, and a boss's name is
information.

Both ports are optional. With neither `CameraPort` nor `MomentsPort` wired the
whole module degrades to nothing happening, which is what the headless tests
want.

## Capturing — read this before trusting a screenshot

Verified live on port 5303 against `npx vite`. **The headless Chromium used for
captures does not run CSS transitions in step with wall time.**
`document.timeline` advances only when a frame is forced, and then jumps by tens
of seconds at once — measured: two samples 120 ms apart read `61815.7` then
`91364.5`, a jump of 29.5 s.

Consequences, all of which produced misleading frames in the first capture
round:

- Any CSS fade is either skipped outright or already finished by the first
  composited frame. `moment-09-overdrive-slab.png` and
  `moment-12-telegraph-vignette.png` are named for chrome that is **not in
  them** for exactly this reason.
- A poll-and-shoot loop misses transient chrome whenever another
  `Page.captureScreenshot` is still in flight — CDP capture on a 1600×900 WebGL
  page can outlast a 1.25 s hold.

The chrome itself is fine. Checked directly: the cascade resolves
`.ffx-telegraph--visible` as the winning declaration and computed opacity is
exactly `1` with `transition: none`; the slab holds measure 1254 ms
(`odSlab` 1250) and 1409 ms (`revealSlab` 1400) against the JS clock.

So the working captures raise each piece through its **real** production call
with a long hold and neutralise only the fade. Geometry, colour, type and
z-order are untouched. Scripts live in `critic/scratch/`:

| script | what it does |
| ------ | ------------ |
| `catch-moments.mjs` | drives a chapter and shoots the first sighting of each selector |
| `catch-telegraph.mjs` | fires a real stage-2 `charge` through `FFXBattleHud.onEvent` + `BattleMoments.telegraph` |
| `shoot-chrome.mjs` | the overdrive and telegraph chrome, fade neutralised |
| `probe-slab.mjs` | logs every chrome state transition with timestamps |

All of them stub the `vite-hmr` WebSocket (same trick as `tools/screenshot.mjs`)
— without it another agent saving a file reloads the page mid-capture and the
execution context dies.

Two gotchas worth keeping:

- The HUD hides via `el.hidden`, **not** opacity. Gating a capture on
  `getComputedStyle(hud).opacity === '1'` passes while the HUD is still down.
- The boss reveal owns the same slab element as the telegraph, so a capture
  fired before the reveal has come *and gone* gets overwritten by it.

The auto-battle strategies win before any boss reaches a second charge stage, so
a plain playthrough never shows the telegraph at all — it has to be fired.

## Screenshots

`docs/screenshots/bp1/moment-*.png`. `01`–`15` are the rig captures from the
first round (start swirl, party slide-in, boss reveal, action punch-in, impact
cut, cast hold, form change, victory, results wipe). Added after the capture
problem above was understood:

| shot | shows |
| ---- | ----- |
| `moment-16-overdrive-slab.png` | letterbox bars + the gold `OVERDRIVE / Blitz Ace` slab |
| `moment-17-telegraph-banner.png` | `MORTIORCHIS / TOTAL ANNIHILATION` banner + red screen border |
| `moment-18-telegraph-slab.png` | the red `CHARGING / Total Annihilation` ink slab under the border |
| `moment-19-telegraph-zoom-vignette.png` | the slow zoom and the heartbeat vignette |

## Open — for the framing agent

**The stage-2 telegraph banner collides with the sensor panel.** Both are
anchored top-centre-ish in `ffx-hud.css`: `.ffx-sensor` at `left: 200px;
top: 24px; width: 100px` and `.ffx-telegraph` at `left: 50%; top: 28px;
transform: translateX(-50%)`. Measured at 1600×900 the banner occupies
x 504–1096, y 70–188 and prints straight through the sensor's name and HP bar —
visible in `moment-17-telegraph-banner.png`.

This is the same failure the reveal plate already had against the CTB list (see
the `battleStart()` comment). Not fixed here because `ffx-hud.css` belongs to
the framing agent. Cheapest fixes: drop the banner below the sensor block, or
have the sensor yield while a charge is live.

The overdrive and telegraph slabs also cross the strategy-guide panel on the
left. Less clear-cut — the slabs are full-bleed chrome by design and the guide
is dismissable with `G` — but worth a look when the guide's column is settled.
