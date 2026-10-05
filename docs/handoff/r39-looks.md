# r39-looks: "F plus" as the default sharpness, and Chapter III's calmer menus (release 39; production)

Branch `r39-looks` (worktree `D:/pyrefly-r39-looks`), from `origin/r39-hires-engine` d7ac0ccf, then `origin/crisp-options` (6fb25dc0) and `origin/ch3-options-scratch` (f92da46c) merged in as the starting points
(their scratch levers are not in the tree any more: see "What changed"). **Not merged into main or into r39-hires-engine (the release 39 integration does that), not deployed, not yet reviewed by a critic.**
Bailey, 2026-10-04 ~18:20 EDT, verbatim: "I'll go with all of your recommendations. Godspeed." For this lane that is two picks: **(1) sharpness "F plus"** (options page
`critic/scratch/crisp-options-1004/index.html`, note `docs/handoff/crisp-options.md`) and **(2) Chapter III "option 1: a calmer camera while the menus are open"**
(`critic/scratch/ch3-options-1004/index.html`).

**Game case (rule 14).**
- **Part 1, sharpness: both games.** Shared plumbing: the post chain, the scene pass and the device ladder read no game. The frames below are Chapters I and VIII (FFX) and Chapter IV (FFX-2); the phone and the low class keep the frame they had.
- **Part 2, Chapter III: FFX only** (Braska's Final Aeon). The row answers only for FFX on a desktop window (`standFor` is null for FFX-2 and on the phone) and only the one row carries a calm camera. Presentation only: no HP, AI, timing or engine state moves (rule 1); only where figures stand and where the camera sits.

**Review the plan asks for** (`node tools/critic-plan.mjs --paths <the eight shipped files>`): DEEP; a FOCUSED review of the production candidate before the deploy, then live verification and the DEEP review on the live build (obligations: live + focused + deep), because `Renderer.ts` is "global layout, input and boot".
Checks it names: CHK-002, 003, 008, 009, 013, 015, 016, 017, 020, 021; targets: pause, phone, presentation.

---

## Part 1: sharpness "F plus" (both games)

### What it is

One ladder, three rungs and the phone's frame (`src/engine/crisp/CrispConfig.ts`):

| Rung | What the frame is | Who draws on it |
|---|---|---|
| `fplus` | the scene pass drawn 2x wider and taller and resolved with a Lanczos-3 filter **before the bloom**; both SMAA passes off; a light contrast-adaptive sharpen (0.3) right before the grade, with a noise floor and the tilt-shift band's fade; backdrop plates at anisotropy 16 | the high class (a discrete GPU): the default |
| `f` | the same at 1.5x with the sharpen at 0.4 | the mid class (an integrated or unknown GPU), and where `fplus` steps down to |
| `a2` | no supersample, no sharpen, **one** SMAA (the MAX mix's, before the grade: exactly live release 38's frame) | the low class (a software renderer: the default SwiftShader browser, so the repo's golden screenshots do not move), LOW EFFECTS, and the floor of the ladder |
| `phone` | today's frame: no supersample, the MAX mix's one FXAA | the phone layout and the phone effects tier |

Everything else runs where it did: the bloom (it is not trimmed: lit regions read 1 to 4 percent brighter, as the options page said), glow, tilt-shift, grade, grain, the HUD, and the spell overlays and the spectacle pass, which draw after the chain at the buffer's own size.
No setting, no save key: the rung follows the device, as the art tiers do.

### How a device gets its rung

1. **Start**: the class (`ArtDevice.hardwareClass()`, the GPU without the phone layout): high -> `fplus`, mid -> `f`, low -> `a2`.
2. **Layout**: the phone layout and the phone effects tier draw `phone`; LOW EFFECTS and the low class draw `a2`; a frame too big to supersample worth the cost (an 8K window, or a GPU whose largest texture is smaller than the buffer) is drawn on `a2` with its one SMAA, never with no anti-aliasing at all.
3. **Governor** (`FrameGovernor.ts`, pure, tested): while a frame is drawn on a rung the governor owns, it collects the interval between frames; a window of about 2 s with at least 12 of them whose **median** is over the budget takes the rung down one step, and the ladder only goes down (no step back up in a session, so a device never oscillates). It ignores samples for 2 s after a new scene (art decodes and shaders compile there), for 1 s after a resize and for 1 s after a step.
   - **The budget is 22 ms on the median frame interval (about 45 frames a second), not 12 ms of GPU work.** A browser cannot read GPU cost without a timer extension only Chromium has, and on a display that waits for its refresh an interval cannot show headroom, so the only question the portable reading answers is "does this device hold the display's rate?": 60 Hz held reads 16.7 ms, 50 Hz 20 ms, 144 Hz 6.9 ms, and a device that has dropped to half rate reads 33 ms. 22 ms clears every display that is held with margin and fails the one that is not. `?crispbudget=<ms>` sets it for a capture.
   - The median, not the mean: one stall, one garbage collection or a hidden tab coming back (one interval of seconds) must not cost a player the sharper frame.
4. **Developer overrides** (captures, QA; each pins the frame and the governor stands down): `?crisp=fplus|f|a2|a|phone|ref3` (`g2` = `fplus`, `g1` = `f`: the options page's names; `a` is release 39 as first built, two SMAA passes; `ref3` is the 3x reference), `ss`, `cas`, `aapre`, and `window.__pyrefly.crisp` (`report`, `preset`, `set`, `unpin`, `simulate`). `docs/DEV.md` "Sharpness" has them.

### What changed

| File | What |
|---|---|
| `src/engine/crisp/CrispConfig.ts` | the rungs, the presets, `startRung`, `rungFor`, `stepDownFrom`, the address parser (pure) |
| `src/engine/crisp/FrameGovernor.ts` | the median window, the holds, the step (pure) |
| `src/engine/crisp/CrispRig.ts` | per frame: the device class and tier, the governor, then the passes' switches; `report()` and the developer pins |
| `src/engine/crisp/SsaaPass.ts`, `supersample.ts` | the scene pass at `scale` and the separable Lanczos-3 resolve with an anti-ringing clamp (Lanczos-3 only now); the scale the GPU and a 36 megapixel budget leave (`usableSupersample`) |
| `src/engine/crisp/CasPass.ts`, `sceneScale.ts`, `crispLive.ts` | the sharpen (unchanged shader); the shared cell the point sprites and the backdrop's focus pull read; the cell the MAX mix reads to drop its AA pass |
| `src/engine/Renderer.ts` | builds the rig; the renderer's own post-grade SMAA is built only when something asks for it (`?aa=smaa`, the `a` end state) |
| `src/engine/ArtBudget.ts`, `PostAa.ts` | `aa: 'off'` on every class: release 39's SMAA after the grade ran on top of the MAX mix's, so a frame was softened twice |
| `src/engine/fx/mix/gates.ts`, `MaxMix.ts` | `aaKind(tier, aaPre)`: no SMAA/FXAA on a supersampled rung; the mix builds or frees the pass by `crispLive.aaPre` |
| `src/engine/fx/b/PlateCompose.ts`, `DepthPlates.ts` | the plates' render targets are created with `anisotropy: 16` (three writes a render target's filtering to the GPU once, the first time it is drawn into, so a property set afterwards never arrived: GL read 1) |
| `src/engine/ArtDevice.ts` | `hardwareClass()`: a window opened narrow (the phone layout) and widened later starts the governor from the GPU, not on the phone's rung |
| `src/app/screens/BattleScreen.ts`, `StoneShards.ts`, `OmnisGlowLook.ts`, `OversoulLook.ts`, `fx/a/BackdropFocus.ts` | the scene scale reaches every point sprite and the backdrop's mip-biased focus pull, so the look holds (kept from the options round) |
| `src/debug/crispApi.ts`, `main.ts`, `docs/DEV.md`, `docs/ENGINE-API.md` | `__pyrefly.crisp`; the docs |
| tests | `crisp-config.test.ts` (rungs, which rung, overrides, the supersample sizing), `frame-governor.test.ts` (the step-down logic: 26 cases), `crisp-rig.test.ts` (22 cases: the rig on a stub composer: each class and tier, the step-down switching the passes, holds, pins, the 8K fallback, the narrow window) |

Gone from the tree (parked in `F:/pyrefly-parked/2026-10-04/r39-looks/`): the Lanczos-prefiltered mips (E: nothing visible at this camera), `mipBias`, the texture registry, the presets table's comparison states (C, B, D variants, `f1`...), `__pyrefly.crisp.inspect/sums/flush`.

### The phone (a finding)

The brief says the phone keeps today's frame "with ONE SMAA pass: the double SMAA was a bug". On the phone there never was a double: its chain is `scene, bloom, glow, tilt-shift H, tilt-shift V, FXAA, grade`, because the MAX mix uses FXAA on the phone effects tier and release 39's own SMAA after the grade is off on the phone class (`ArtBudget.aa` was `off`). Read from the baseline build at 390x844 and from this one: the same chain, one anti-aliasing pass, minus a dead disabled SMAA object. So the phone's frame is untouched, with one AA pass (FXAA). Making it SMAA would be a change to the phone's frame and its GPU bill, not a repair; say if that is wanted.

### Proof (headless Chromium on the real GPU, an RTX 5070 Ti; the harness is scratch, `D:/Tools/pyrefly-scratch/2026-10-04/r39-looks/`: the options round's capture and timing scripts retargeted, never in the repo)

The code-only production build of the branch (`vite build`, 1 s) served over `D:/pyrefly-r39-int/public` (read only: the repaired hi-res art, PNG masters, `__PYREFLY_ART_WEBP__ = []`), ports 7190 to 7192. Frames are canvas pixels (`toDataURL`, no HUD) of one frozen game state, drawn once per rung, so crops line up pixel for pixel;
a different page session is never compared pixel for pixel (breathing and particles start from the run's own timing), only by the numbers.

**F plus is active, with no flag, in every chapter and size tried.** Chapters I (FFX), IV (FFX-2) and VIII (FFX) at 2560x1440 and 3840x2160 (12 page sessions): the page as it loads reports rung `fplus`, supersample 2.00, and the passes `ssaa, bloom, glow, tilt-shift H, tilt-shift V, cas, grade` (no SMAA, no FXAA anywhere), **0 console errors and 0 failed requests in all 12** (plus 6 load runs, 2 step-down runs, 2 real-key turns, 2 hit frames, the 19-chapter smoke and the anisotropy reads below: 0 in every one).

**Sharpness against the options page** (the page's own metric: the Laplacian variance of the grey crop, as a share of the same frame drawn at 3x, the ideal; same crops, scaled with the frame). Nine figure crops at 2560x1440, this build against the options page's table:

| Crop | release 39 as first built (A) | A2 | **F plus** (this build; the options page's `g2`) |
|---|---|---|---|
| Chapter I, Tidus's face | 42.0 % (page 42.3) | 51.2 (52.0) | **89.5 (89.9)** |
| Chapter I, Tidus's torso | 41.7 (42.5) | 48.7 (50.6) | **88.5 (90.5)** |
| Chapter I, Seymour's head | 45.7 (43.6) | 53.6 (51.6) | **100.7 (100.9)** |
| Chapter IV, Paine's face | 56.4 (53.8) | 67.3 (65.1) | **99.8 (99.3)** |
| Chapter IV, Paine's body | 62.6 (62.5) | 73.0 (72.3) | **101.1 (101.5)** |
| Chapter IV, Bahamut's head | 62.8 (61.7) | 74.1 (73.6) | **115.8 (116.4)** |
| Chapter IV, Bahamut's wing | 66.0 (67.6) | 77.0 (78.8) | **109.8 (107.3)** |
| Chapter VIII, Tidus's face | 42.1 (42.5) | 50.3 (50.4) | **89.7 (90.0)** |
| Chapter VIII, Evrae's head | 51.8 (53.5) | 63.3 (63.9) | **111.4 (111.3)** |

The mean absolute difference from the options page is **0.78 percentage points for F plus** (1.19 for A, 1.18 for A2), the largest 2.5: within the page's own session-to-session noise. The as-loaded session reads F plus at 89.7, 90.0, 100.1, 99.2, 101.7, 114.1, 98.4, 90.1 and 113.2 for the same nine (the Bahamut wing moves with the animation, so a page session's frame is a different pose: the wing crop is the one that differs by more, 8.9). The backdrop crops that are mostly paint (the plates, the floors, the ship's plate) read 101 to 106 percent of the ideal in Chapters I and VIII (A: 93 to 106); Chapter IV's plate crop reads 56 percent (the page: 66; release 39 22 against its 29), a crop of far detail that is lower in both builds on this art set and keeps its ratio.
At 4K the ideal is capped by the 36 megapixel budget (a 3x frame would be 74), so there is no 3x reference; the figure crops' F plus to A2 detail ratio is 1.58, 1.62, 1.79, 1.57, 1.31, 1.51 and 1.86 here against the page's 1.61, 1.62, 1.82, 1.61, 1.33, 1.50 and 1.80 (the Bahamut head and wing crops move with the animation and are not comparable between sessions). The crop sheets are the pictures: `docs/screenshots/r39-looks/sharp-*-crops.jpg` (release 39 as first built, A2, F plus, the 3x reference, 2x nearest) and `sharp-*-4k-crops.jpg`.

**The default is the same frame as the pinned one**: the as-loaded frame and `__pyrefly.crisp.preset('fplus')` drawn from the same state are pixel for pixel identical in all six sessions (the whole-frame difference: 0 pixels, max 0 of 255). The "release 39 draws SMAA twice" finding reads the same here: A to A2 (the second SMAA off) lifts the figures' detail by 1.18 to 1.23 times at 4K on the Chapter I crops (the page: 1.17 to 1.23).

**Frame time and GPU memory per rung** (one `Renderer.render` plus a 1x1 read-back, so CPU and GPU both count; the same stopped frame per rung, three interleaved rounds of 200; median ms, p95 beside it; memory is the harness's exact tally of every texture and renderbuffer allocation in steady state, one page per rung). `A` is release 39 as first built (two SMAA), `A2` one SMAA.

| Chapter, size | A | A2 | F | **F plus** | F plus against A |
|---|---|---|---|---|---|
| I (FFX), 2560x1440 | 3.0 (4.6) | 3.0 (4.7) | 4.1 (6.1) | **5.8 (8.1)** | +2.8 ms |
| IV (FFX-2), 2560x1440 | 4.8 (7.6) | 4.6 (6.6) | 6.7 (8.8) | **9.0 (11.1)** | +4.2 ms |
| VIII (FFX), 2560x1440 | 2.2 (3.5) | 1.9 (3.1) | 2.3 (3.4) | **2.6 (4.0)** | +0.4 ms |
| I (FFX), 3840x2160 | 4.8 (6.1) | 4.5 (5.7) | 7.1 (8.7) | **10.4 (11.8)** | +5.6 ms |
| IV (FFX-2), 3840x2160 | 8.1 (10.0) | 7.1 (9.3) | 11.3 (13.1) | **16.8 (19.0)** | +8.7 ms |
| VIII (FFX), 3840x2160 | 3.1 (4.1) | 2.8 (3.5) | 3.5 (4.4) | **4.3 (5.4)** | +1.2 ms |
| GPU memory, Chapter I, 2560x1440 | 589 MB | 533 MB | 613 MB | **701 MB** | +112 MB (A2: +168) |
| GPU memory, Chapter I, 3840x2160 | 876 MB | 749 MB | 931 MB | **1,128 MB** | +252 MB (A2: +379) |

The means over the three chapters, +2.5 ms at 1440p and +5.2 ms at 4K against A, and +112 and +252 MB, are the options page's own figures (+2.0, +4.7, +112, +252) within half a millisecond: the Chapter IV 4K row is the heaviest scene and the one to watch (16.8 ms synchronised, 19.0 at p95). The 252 MB is the supersampled targets minus the two SMAA passes' buffers, which a rung that does not run SMAA never builds (the MAX mix frees its pass; the renderer's is never made).

**The governor reads this GPU as healthy, through a whole load.** One real chapter start per chapter and size, vsync **on** (the critic's launch args, 60 Hz): the governor's windows from the first one (about 6.5 s after the start: the new scene's 2 s hold comes first) to 25 s past the first menu, so the load after the hold is in them (first menu at 12 to 17.5 s):

| | 2560x1440 | 3840x2160 |
|---|---|---|
| Chapter I | medians 16.5 to 16.7 ms, 0 steps | 16.6 to 16.8 ms, 0 steps |
| Chapter IV | 16.4 to 16.8 ms, 0 steps | 16.6 to 16.75 ms, 0 steps |
| Chapter VIII | 16.6 to 16.8 ms, 0 steps | 16.5 to 16.75 ms, 0 steps |

Rung `fplus`, supersample 2.00, in all six, 0 console errors: no false step-down from art decodes or shader compiles in the load, which is what the 2 s hold after a new scene is for. At 4K Chapter IV the synchronised cost (16.8 ms) is past the 16.7 ms frame, yet the interval holds 16.6 to 16.75 because the browser overlaps the CPU's frame with the GPU's; a GPU a little slower than this one would miss the 60 Hz slot, read 33 ms, and step to F (11.3 ms). That is the budget doing its job; **a 12 ms budget on the frame's cost (the synchronised figures above) would have stepped this GPU down at 4K Chapter IV** (16.8 ms) although it holds 60 Hz there, which is one reason the budget is an interval.

**The step-down engages** (simulated slow frames, real timing, vsync on: `__pyrefly.crisp.simulate(30)` adds 30 ms to every interval the governor reads; the frames themselves are real):

| Run | healthy windows | simulated | rungs | after `simulate(null)` |
|---|---|---|---|---|
| Chapter I, 1600x900 | 16.6 to 16.8 ms (8 windows) | 46.6 ms | `fplus`, then `f` at 2.3 s, `a2` at 5.2 s | back to 16.7 ms and **stays `a2`** (the ladder only goes down) |
| Chapter IV, 2560x1440 | 16.6 to 16.8 ms (6 windows) | 46.5 ms | `fplus`, then `f` at 1.9 s, `a2` at 5.0 s | back to 16.7 ms, stays `a2` |

At the floor it stops (`a2:46.6 ms`, `a2:45.95 ms`: no further step). The pass list at the floor is `scene, bloom, glow, tilt-shift H, tilt-shift V, smaa, grade` (the MAX mix's one SMAA came back), and `ssaa` and `cas` are off.

**The same step-down with nothing simulated** (software GL, so the frames are really slow; the high class forced with `?arttier=high`; 1066x600 so the effects tier stays `full`: at 640x360 the phone effects tier takes over and nothing is governed). The governor's windows, in order: `fplus 58.4 ms (12 samples) STEP`, `f 894.7 ms STEP`, then at the floor `a2` 874.9, 825.0, 680.1, 517.5, 649.4, 570.8, 518.4, 611.6, 485.4, 596.8, 460.8 ms: one rung per window, both steps before the first menu (at 101 s: a software renderer), and then eleven windows more at the floor with no further step and no step back up, 0 console errors.
**The default software browser needs none of this**: SwiftShader reads as the `low` class (`classifyGpu`: software), so the repo's golden-screenshot browser and the critic's default runs start on `a2` (class `low`, tier `full`, rung `a2`, no supersample, one SMAA: today's frame, nothing governed).

**The plates' anisotropy, read back from the GPU** (`getTexParameter(TEXTURE_MAX_ANISOTROPY_EXT)` on each plate texture, Chapter I at 2560x1440, the loop stopped before the read; four plates and the four lamp meshes that use them, all render-target textures; the GPU's maximum is 16):

| Build | the JavaScript property | what the GPU holds |
|---|---|---|
| release 39 as built (the options round's build, default) | 8 | **1** |
| the options round's `?crisp=g2` by address | 16 | **1** (its address path set the property only; its run-time preset did reach GL, which is how its frames had it) |
| this build | 16 | **16**, on all eight |

**The phone keeps today's frame, with one AA pass** (390x844, mobile emulation, headless GPU). Release 39 as built: `scene, bloom, glow, tilt-shift H, tilt-shift V, FXAA, grade` (its post-grade SMAA object is there and **off**: `ArtBudget.aa` was `off` on the phone class). This build: the same enabled passes in the same order, rung `phone`, class `phone`, effects tier `phone`, the governor not fed (0 windows), no supersample, no sharpen. Frames: `phone-ch1-390x844-before-after.jpg`.

**A real-key turn still works, in both games** (real keys from the title through the chapter board, `setSeed` before the first key, the page as loaded: rung `fplus`, supersample 2, 0 console errors):
- **Chapter I (FFX)**: Attack, target Seymour Flux (read back at Enter: matched), the log grew by 11 events (`action-start`, `damage`, `overdrive-gauge`, `status-add` x2, `action-end`, `script-trigger`), Seymour Flux 70,000 to 69,197, turn 1 to 2.
- **Chapter IV (FFX-2, Active ATB)**: Yuna opens on White Mage (White Magic, Change, Item: no Attack row), so White Magic, Cure, target Yuna: an `action-start` by `yuna`, `x2-white-mage-cure`, targets `["yuna"]`, with the ATB running on.

**Every chapter's first menu, default settings, 1600x900** (the 18 listed chapters and the hidden FF7 experiment; one frozen state drawn as the default and as A2): all 19 on rung `fplus`, supersample 2.00, passes `ssaa, bloom, (glow), tilt-shift H, tilt-shift V, cas, grade`, **0 console errors, 0 failed requests**, no black or broken frame (`smoke-all-chapters-1600x900-fplus.jpg`). The mean luma against A2 differs by -0.14 to +4.18 percent: +4.2 Chapter IV, +3.4 Macalania, +2.5 Chapter III, +2.3 Omnis, +2.1 Trema, everything else under 2 (the dark scenes: a supersampled frame keeps the energy of small bright lights and the bloom sees it, the options page's 1 to 4 percent; no trim, as told). The options page left Chapters II, III, V to VII, IX to XV and the FF7 chapters uncaptured; they are now.

**An action in motion** (the options page's open item): real keys to Attack in Chapter I (in Chapter IV the first damage is Bahamut's own scripted attack: the same, the frame is of that), the first `damage` event, 350 ms for the presenter, then the loop stopped and the same state drawn as A (release 39 as first built), A2 and F plus (canvas pixels, so the spell overlays that draw after the chain are in them; the page loaded pinned to `a` so the MAX mix's SMAA exists for the two lower rungs): the particles, glows, motion trails and overlays are the same size and in the same place on every rung and F plus is the crisp one. Crop detail (Laplacian variance), A / A2 / F plus: **Chapter I 1,117 / 1,377 / 2,557** (Tidus's lunge, Auron, Yuna), **Chapter IV 1,195 / 1,489 / 2,361** (Bahamut, Rikku, Paine). `hit-ch1-crops.jpg`, `hit-ch4-crops.jpg`. Held shots (the Overdrive and dressphere cuts) were **not run with supersampling** in this lane: one attempt to reach the Overdrive shot from the harness (a full gauge written into the live state, then real keys through the next menu's Overdrive row) never started the shot, so they stay open for the focused review (the shot is drawn by the same scene pass and the same resolve; only the camera and the lens differ).


---

## Part 2: Chapter III option 1 (FFX only)

### What it is

While a command menu is open in Braska's Final Aeon's fight, the camera's slow drift shrinks to 15 percent of its size and the camera settles half a unit to its right (the half of the swing where Yuna's raised staff is farthest from the blade); between menus the drift eases back to full. The boss stands 2.6 right and 0.95 back of where the stage seats it; the party (0.35 right) and the two Yu Pagodas (left 0.7 right / 2.4 back, right 2.0 right / 2.4 back) keep the built row's places. No flag.

| File | What |
|---|---|
| `src/engine/fx/mix/menuCalm.ts` (new) | `MenuCalm {drift, lean}`, `calmStep` (the eased weight, 1 s), `calmedDrift` (amplitude x `1 + (drift - 1) x weight`, lean = `lean x weight x driftWeight`), and the shared state `Framing` arms and `DriftRig` reads |
| `src/engine/fx/mix/stageTable.ts` | Chapter III's row: boss `{right 2.6, toward -0.95}` (was 3.0), `calm: {drift 0.15, lean 0.5}`; `Row.calm`; `standFor` returns it; **`CHAPTER_III_STAGED = true`** |
| `src/engine/fx/mix/framing.ts` | arms the calm each frame from the row and the menu it already reads (`menuOpen()`); not on the phone; `separate()` moved to `separate.ts` unchanged (the file was at the 400-line limit) |
| `src/engine/fx/b/DriftRig.ts` | steps the weight every frame and applies `calmedDrift` to the drift it already makes |
| `src/engine/fx/mix/MaxMix.ts`, `fx/b/LivingPaintings.ts` | reset on dispose; `fx.b` stats read `calm` and `driftX` |
| `tests/unit/fx-mix-menu-calm.test.ts` | 20 cases: the easing, the maths (the calmed swing stays in 0.42 to 0.58), the state, the row and its switch, `Framing` arming for Chapter III only, not on the phone or in FFX-2 |

### How it relates to `CHAPTER_III_STAGED` and the r38-restage row (decided and written here)

`docs/handoff/r38-restage.md` ("Repair") shipped Chapter III's row **off**: with the boss 3.0 right it cleared the party at the first menu on every seed but (1) was a bigger move than Bailey had seen, (2) put 5 to 24 percent of the boss under the turn rail and CHK-011 at 0.70 to 0.73 clear, and (3) still touched while the camera drifted left in a Yuna-first menu. Bailey has now seen the pictures and picked option 1, which is that row with the boss at 2.6 plus a calmer camera at the menus.
So the two are one change and have **one switch**:

- The placement is the built row with `enemy.right` 3.0 -> 2.6. Nothing else in it moved; the repairs that came with it (the formation relaxation holds the table's fiends, `Staging.write`'s per-axis rule, the roster rescan for a later arrival) were never behind the switch and are untouched.
- `CHAPTER_III_STAGED` is now `true` and keeps meaning "Chapter III plays the row": the row carries the calm (`Row.calm`), `standFor` hands it to `Framing`, so **switching the constant off puts Chapter III back to release 38 in both respects** (the stage's own formation, the relaxation, the plan's party step and the full drift at every menu). It cannot fight the calm because the calm does not exist without the row.
- `?stand=off` is the same state at run time (verified below: it reads live's numbers). The checks-only `?stand=<4 numbers>` override moves figures but arms no calm: it is a position probe, not the feature.
- FFX-2, every chapter without a `calm` row, and the phone never arm it (tests).

### Proof: the first menu over a full drift swing (headless GPU, real keys, seed set before the first key; live = release 38 on Pages)

Real keys from the title to the first Chapter III menu (`__pyrefly.setSeed(n)` before the first key, as the critic runner does), then, **from 1.5 s after the menu opened (the options page's reading)**, the in-page reading every ~0.7 s for 26 s, one whole lateral swing of the drift (period 23 s): the painted overlap between a party member and any fiend (each figure's own pose texture, a chamfer distance transform), the closest painted gap, CHK-011's clear view of the boss
(`__pyrefly.targeting()`), and the share of each fiend's painted body under the turn-order rail. Seed 1 opens on Tidus, seed 9 on Yuna (the worst case: her raised staff reaches the blade). This build: no address flag. Scripts: `D:/Tools/pyrefly-scratch/2026-10-04/r39-looks/ch3/` (copies of the Chapter III options round's, retargeted; not in the repo).

| Case | live: frames touching (worst px2) | **option 1: frames touching** | closest painted gap, px (range over the swing) | boss clear view (CHK-011's line 0.75) | boss under the rail / a pagoda under the rail |
|---|---|---|---|---|---|
| 1600x900, Tidus first (seed 1) | 33 of 33 (3,962) | **0 of 32** | 50.9 to 74.2 | 0.743 to 0.763 | 11.4% / 4.7% |
| 1600x900, Yuna first (seed 9) | 32 of 32 (5,631) | **0 of 32** | 5.0 to 22.1 | 0.742 to 0.760 | 11.7% / 3.6% |
| 2000x1012, Tidus first (seed 1) | 32 of 32 (4,886) | **0 of 32** | 53.3 to 81.2 | 0.749 to 0.759 | 14.0% / 13.0% |
| 2000x1012, Yuna first (seed 9) | 32 of 32 (7,395) | **0 of 31** | 5.4 to 22.1 | 0.738 to 0.762 | 15.3% / 15.2% |

0 of 127 frames touch from 1.5 s into the menu (live: 129 of 129); the first seconds of a menu are the first cost below. The camera's world x over the swing: live -0.54 to +0.48, option 1 +0.36 to +0.62 (it rests on its right half). Live's clear view reads 0.766 to 0.859, so option 1 gives up about 0.03 to 0.10 of the boss for it: **the clear view sits on CHK-011's line** (24 to 26 percent hidden; the lowest single reading is 0.738, 26.2 percent hidden, at 2000x1012 Yuna first). The check is non-strict in the e2e spec (`CHK_STRICT=1` makes it fail).
Also read at the pinned frame (the drift's clock held at 16.4 s, as the options page's frames): 2560x1440 and 2560x1080, seeds 1 and 9: **0 px2 overlap in 4 of 4** (closest 10.0 to 90.3 px, boss clear view 0.745 to 0.753; live 3,499 to 9,544 px2).

**Sizes against live** (on-screen heights, same frame size and seed; 8 frames across 1600x900 to 2560x1440): party -2 to +3 percent, the boss -3 percent, the Yu Pagodas -8 to -12 percent (they stand further back and nearer the boss than live's, as on the options page). The phone is live's layout (390x844, Tidus first: overlap 79 px2 against live's 80, heights within a pixel).
**Tidus's attack** (seed 1, 1600x900, the least painted gap during one attack, read about every 0.1 s): live 29 px (it reaches the boss), option 1 **161 px short**: the lunge is a fixed 1.4 units, so any boss move leaves it short (the options page read 147).

**The camera in time** (calmline: real keys, `fx.b` stats every 150 ms, seed 1, 1600x900): when the first menu opens the calm weight reads 0.23 at 0.2 s, 0.75 at 0.8 s and 1.0 by 1.2 s; the drift's own weight eases in over about 1.7 s and the camera rests at x +0.54 to +0.55. Attack chosen (the menu closes): the weight is 0.72 at 0.3 s after the key, 0.22 at 0.8 s and 0 by 1.15 s, while the camera is on the action rig (the drift's own weight is 0 from 0.3 s: no drift at all there). At the next menu it comes in again (0.38, 0.87, 1.0 within 1.2 s) and the camera settles on the right again (x 0.43 to 0.57 over the next 24 s).

**The switch off** (`?stand=off`, the state `CHAPTER_III_STAGED = false` gives): 33 of 33 frames touching, worst 5,392 px2, camera x -0.46 to +0.48: live's picture and live's drift.

### Honest costs (measured; the first two are new against the options page, which did not read them)

1. **The first seconds of a menu, while the drift eases in (every menu, the first included).** The lean is the drift shifted, so it exists only while the drift does: the drift is cut to zero whenever the camera is on an action rig, and once the camera is back on the resting rig and still it waits 0.4 s and eases in over 1.5 s. So for the first 1 to 3 s of a menu the camera is at the centre, not on the right, and a **Yuna-first menu can touch while her raised staff is over the blade**. Read every ~0.3 s for 6 s after each of four menus (1600x900, seeds 1 and 9, real keys, Attack the boss each time): 8 menus, 174 readings, **15 touched (8.6 percent), every one in the first 3.0 s of a menu; from 3.3 s on, 0 of 83**.
   - seed 9, menu 1 (the first menu, Yuna): touching at 0.15 to 1.05 s, 322 px2 at the worst, clear from 1.3 s (the drift's weight 0.53);
   - seed 1, menu 3 (Yuna): touching from 0.46 s to 2.99 s, **681 px2 at the worst** (1.8 s), clear from 3.3 s (weight 0.84): the camera was still travelling back to the resting rig for the first 1.7 s, so no lean could have helped yet;
   - seed 9, menu 4 (Auron): a 2 px2 brush at 1.2 to 1.5 s; the other five menus (seed 1 menus 1, 2 and 4, seed 9 menus 2 and 3) read clear throughout (closest 13.7 to 32.5 px; the boss's clear view 0.736 to 0.748 over the six clear menus).
   While it touches the boss reads 0.721 to 0.732 clear. The options page and the table above start reading 1.5 s into the first menu, which is why they read 0. A fix would change the feel beyond what Bailey picked (a lean that does not wait for the drift cannot start while the camera is still moving; moving the resting rig itself to the right at menus shifts every shot, not only this one), so it is **not built (rule 10)**; the cost is a staff tip over a blade tip for a second or three at some Yuna menus.
2. **REDUCE MOTION.** The drift is off there, so there is no lean either, and the camera rests at the centre (x -0.01): Tidus first is clear (0 of 33 frames, closest 23 px, clear view 0.73 to 0.75), **Yuna first touches** (32 of 32 frames, 573 px2; live 5,631) and the boss reads 0.71 to 0.73 clear. Better than live, not clear. Not built (rule 10): a static lean at the menus, or the 3.0 row for REDUCE MOTION players, each need Bailey's yes.
3. **No margin at the tightest.** Yuna first at 1600x900 and 2000x1012 reads 5.0 and 5.4 px at the closest (the options page: 8 px; the art is the repaired hi-res set now); a few px of difference between runs is the run's, not the code's. Clear on every frame read from 1.5 s into a first menu, but one painting change away from touching.
4. **The boss's clear view is on CHK-011's line** (above), and up to 15 percent of the boss and of a pagoda sit under the turn rail at 2000x1012.
5. **The menu's camera no longer breathes** while you choose: the painted sky's parallax is mostly gone at a menu, a change to the Living Paintings look in this one fight (the options page said so).
6. **The lunge stops 161 px short** and the pagodas draw 8 to 12 percent smaller than live's.
7. **Not measured:** the Overdrive lunges, the arrival of a summoned aeon, 1440x900, and menus later than the fourth.


---

## For Bailey (nothing here is built: rule 10)

1. **Chapter III with REDUCE MOTION on**: there is no drift, so no lean, and a Yuna-first first menu touches (573 px2 on every frame; Tidus first is clear). Options: a static lean for REDUCE MOTION players at the menus (a small slide, which that setting is meant to avoid), the old 3.0 boss for them only, or leave it (better than live's 5,631 px2, not clear).
2. **Chapter III's first second or three of a menu** can still touch at a Yuna menu (up to 681 px2, 8.6 percent of readings, none after 3.0 s): the camera is still travelling back to the resting rig when her staff comes up. Leave it, or ask for a different remedy (a bigger boss move costs the rail and the clear view the pick already spends).
3. **The phone's one AA pass is FXAA**, not SMAA (it never had two): say if the phone should get SMAA.
4. **The ladder never goes back up in a session.** A busy machine (ComfyUI on the same GPU, a laptop on battery) steps to F or A2 and stays until a reload. A step back up after a long calm stretch is a small change if wanted.
5. **Chapter IV at 4K is the edge** on this GPU (16.8 ms synchronised, 60 Hz held): a slightly slower GPU reads F there. F is 11.3 ms there (the options page: F keeps 89 percent of the ideal's fine detail where F plus keeps 100).

## Gates

- `npx tsc --noEmit`: clean (also clean on the tree of the Part 1 commit alone, so the two parts are separable: Part 2 can be reverted without touching Part 1).
- **Full unit suite** (`vitest run --maxWorkers=3`, with the art junction so the art tests run): **807 files passed, 5 skipped (812); 11,924 tests passed, 46 skipped, 1 todo**; 474 s. The new files: `crisp-config.test.ts` (22), `frame-governor.test.ts` (26), `crisp-rig.test.ts` (22), `fx-mix-menu-calm.test.ts` (20); `r39-art-tiers.test.ts` now asserts `aa: 'off'` on every class.
- `node tools/orphans.mjs`: 1,240 modules, 24 orphaned, **none of them new** (all in `audio/voices/presets`, `sprites`, `BlobShadow`, `SpriteActor`, `SpriteShader` and the like, as before); every new module is reached from `src/main.ts`.
- File sizes (rule 7, under 400): `framing.ts` was at 400 and is 380 after `separate()` moved to `separate.ts` unchanged; `Renderer.ts` 390, `DepthPlates.ts` 395, the new files 9 to 232.
- Two commits so the parts separate: **4676db02** (Part 1, both games) and **6ddc42c2** (Part 2, FFX only); this note and the frames are the third. The branch also carries the two merge commits that brought the options branches in (`ccd09c81`, `e28354f3`); the second one came with `main`'s release 38 live-check records (`critic/pending/6461999e.json`, `critic/reviews/6461999e-live.*`, `docs/handoff/NOW.md`, `docs/plans/camera-lab-review.md`, six frames under `docs/screenshots/release-38-live/`) because the Chapter III scratch branch was cut from `main`; they are `main`'s own files and agree with it, so merging `main` into the integration leaves them as they are. **I did not edit `NOW.md`.**
- Not run: the e2e (Playwright) suite and `CHK_STRICT=1`; the independent check and the critic rounds this change owes (above).

## Frames (`docs/screenshots/r39-looks/`, JPEG; the options page's frames are the targets)

Part 1: `sharp-ch{1,4,8}-2560x1440-fplus.jpg` (the default, full canvas), `sharp-ch*-*-crops.jpg` (release 39 as first built, A2, F plus, the 3x reference, one frame state, 2x nearest) and `sharp-ch*-*-4k-crops.jpg`; `stepdown-ch1-1600x900-{fplus,f,a2}.jpg` and `stepdown-ch4-2560x1440-{fplus,f,a2}.jpg` (the page on each rung of a simulated step-down); `hit-ch1-crops.jpg`, `hit-ch4-crops.jpg` (an action in motion drawn three ways); `turn-ch1-attack-1600x900.jpg`, `turn-ch4-cure-1600x900.jpg` (after a real-key turn); `phone-ch1-390x844-before-after.jpg`; `smoke-all-chapters-1600x900-fplus.jpg` (all 19 chapters' first menus).
Part 2: `ch3-target-vs-build-*.jpg` (the options page's option 1 frame beside this build's, same size, seed and drift phase: they are the same picture), `ch3-live-*` and `ch3-option1-*` pairs (1600x900 and 2000x1012, Yuna first and Tidus first; the drift's clock held at 16.4 s, live's worst phase for the party), `ch3-option1-2560x1440-yuna-first.jpg`, `ch3-option1-phone-390x844.jpg`.

## For the integration (release 39)

1. Merge `r39-looks` (not squashed: the two parts are two commits). Files other lanes may also touch: `src/engine/Renderer.ts`, `src/engine/fx/mix/MaxMix.ts` (a few small edits), `src/engine/fx/mix/framing.ts`, `docs/DEV.md`. `NOW.md` and the `critic/` records in the branch are `main`'s: keep the integration's.
2. After the merge run `npx tsc --noEmit`, the full suite and `node tools/orphans.mjs`; no art, manifest or build-script file is touched, so the art gates (`art-derive`, the bytes line) are unaffected by this lane.
3. The review it owes is in the header (focused before the deploy, deep after). For the focused pass: the real-GPU numbers above are at 1440p and 4K on an RTX 5070 Ti; a weak or integrated GPU, a laptop on battery (some browsers cap rAF at 30 fps there and the governor will read it as a slow GPU), Safari and Firefox are not measured. The ladder's honest edge: Chapter IV at 4K costs 16.8 ms synchronised on this GPU; it holds 60 Hz here, a slower GPU steps to F by design.
4. A capture that must not change look mid-run should pin (`?crisp=fplus`): under load the governor steps a busy machine down, by design, and never back up in the session.
