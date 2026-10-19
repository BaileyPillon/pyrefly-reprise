# The rig engine: paper preflight (rule 15), 2026-10-17

Lane: THE ENGINE of the rig (branch `rig`, from `origin/r52-rc` 117b704b0). Two other lanes build the cutting pipeline and Kimahri's rig against the format in
`src/data/art/rigTypes.ts`. Game case: **plumbing for both games** (FFX and FFX-2 alike). FFX keeps its held run-in (D-354); FFX-2's run-in smear is
replaced by a rig afterimage later, not here. Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now."

## What it replaces

A figure is one painting per pose, swapped at each pose change (cross-fade 120/140 ms); the paintings disagree on size, feet and costume (the pose-continuity
problem; `docs/handoff/pose-continuity.md`). A rig is ONE painting (the idle) cut into parts on a 2D bone rig; a pose is a set of bone transforms. The prototype
(`D:/Tools/pyrefly-scratch/2026-10-15/quality-leap/proto-25d/src/rig`, 519 lines) played in the real game with 0 swaps, 0 double images, 0 jerks.

## Design

1. **Format first** (`rigTypes.ts`, additive, `CONTRACT-CHANGES.md`): the prototype's `rig.json` plus `version`, `costume` (the master painting and its sha), `keys`
   (a pose is a set of bone transforms, each with the approved painting it was fitted to) and `gate` (`ok`/`blocked`). Optional `motion` (idle sinusoids, lag chains).
2. **`RigActor extends PaintedActor`**, not a wrapper. The stage, the camera fit, the HUD projection, the KO/prone machinery, the life layer (ready lean, guard, KO
   fall), the flash/tint/dim/dissolve uniforms, lunge/recoil/hop/shake/squash, facing and mirroring are all PaintedActor's and already correct. The carrier loads
   ONLY the idle (the costume), shows no plane (`figure: false`), and gives the rig (a) the shared uniform cells, (b) the idle plane's size and place, (c) the `inner`
   group, so the rig root rides every stage motion exactly as the plane does. The rig plane copies the idle slot mesh's transform each frame (mirror, KO topple, prone).
3. **Parts** are `Mesh`es on the painted fragment shader (the game's own, string-patched as in the prototype: height-above-ground for the contact ramp and bounce, a
   per-part rim mask, a figure-wide dissolve). Draw order = `order` through a z step per layer inside the plane, so parts sort among other actors' planes by depth.
4. **Poses**: `setPose` runs PaintedActor's (life state, flinch tokens, ring) then resolves the name down `resolvePoseName` over the rig's key names (idle always exists)
   and starts a transition. Between keys each channel moves `p0 + (p1 - p0) * quadInOut(u) + d * v0 * u(1-u)^2`: the game's ease, and a start that carries the current
   velocity (no jerk when a request lands mid-move). Transitions run on the field clock (a hit-stop freezes the rig with the rest of the picture) and `paceRate('action')`.
5. **Dynamics**: `dyn.ts` ported (Spring, TrailChain, bounded: clamped step, angle limit) and data-driven by `motion.chains` and `motion.idle`.
6. **Selection** in `PaintedStage.add`: a `RigActor` when `/art/rigs/<subject>/rig.json` loads, validates, `gate.status === 'ok'`, its costume is this figure's idle
   painting, and the switch allows it (`?rig=on|off`, a hidden `fxRig` setting). Any failure: `PaintedActor`, exactly as today. One log line per subject
   (`[rig] subject on|off (reason)`); `window.__pyrefly.rigs()` lists them. A throw while building a rig falls back to the painting set.
7. **Layering** (hard rule 1): `src/battle/**` and `BattlePresenter*.ts` import no three; the presenter emits the same pose requests. The only presenter-side change is
   the stage's `add` choosing the actor class and the set of poses it "paints" (`paints()` answers from the rig's keys).

## Risks and how each is proved

| Risk | Proof |
|---|---|
| The shader patch drifts from `PaintedShader.ts` and the rig draws wrong or throws | a unit test applies every patch to the live shader source; a throw falls back to PaintedActor and logs the reason |
| A rig lights, flashes, dims or dissolves differently from a plane | parts share the actor's uniform cells by reference; screenshot of the proto Kimahri against the plane in the same chapter (same light, flash, KO) |
| Pose request mid-transition jerks | unit test: value and velocity continuous across a retarget; velocity at the start of a transition equals the velocity at its interruption |
| Feet slide or float between keys | unit test: each grounded key keeps the lowest foot landmark on its bind row (root offset removed) within tolerance; the validator reports it; transitions between planted keys stay planted at every sample |
| Dynamics blow up (a hit-stop dt, a huge kick) | unit test: 4x10^4 steps, kicks 100x normal, dt from 0 to 5 s: every angle within its limit, no NaN |
| Selection wrong (a blocked or missing rig draws) | unit test of the selection rule: no rig, gate blocked, no gate, switch off, costume mismatch, version, bad data: all give PaintedActor |
| Frame time with 4 to 8 rigs | 6 copies of the proto Kimahri, phone-size viewport, headless Chromium on the GPU: report the median and p95 frame ms against 6 planes |
| Stage code that reads plane internals (`fx/mix`, KO tip, prone lay) breaks | RigActor keeps the carrier's slots; the rig plane follows the active slot's transform; smoke run in a chapter that fields Kimahri through a KO |
| Production has no rigs yet | `rig.json` fetches are cached per subject (a miss costs one request); rigs served from `D:/pyrefly-art-rigs` by a dev-only plugin; release mirror is a TODO in the handoff |

## Out of scope

The cutting pipeline, Kimahri's rig data and any choreography (the prototype's 4 s moment is code, not data). The settings-screen row: the EYE CANDY page keeps its
switch list in the save schema (the save-data class, ten pinned tests, hard rule 9), so v1 reads a hidden `fxRig` setting and the `?rig=` switch and leaves the visible
row to Bailey's yes.
