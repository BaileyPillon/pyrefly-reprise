# The rig engine (branch `rig`, 2026-10-17): one painting per figure, cut into parts on a bone rig

Bailey, 2026-10-17: "yes start rigging, you pick kimahri's costume. start rigging for all chapters please. i want a permanent fix now." This is the ENGINE lane; the cutting pipeline
(`tools/rig/`, `tools/rig-gate.mjs`) and Kimahri's rig data are two other lanes working against the same format. Paper preflight: [docs/plans/rig-review.md](../plans/rig-review.md).
Contract: [CONTRACT-CHANGES](../CONTRACT-CHANGES.md), the 2026-10-17 entry "The rig, format v1". **Game case: both games, shared plumbing** (FFX keeps its held run-in, D-354; FFX-2's run-in smear
becomes a rig afterimage later, not here). The one game-specific rule is FFX-2's, and it is the actor's own: a dressphere's `cast`, `item` and `ko` fall straight to the idle (D-179,
`RigKeys.poseChain(name, dressphere)`).

**Not merged, not deployed, no review run.** Nothing draws as a rig on any build until a gated `rig.json` exists in a rig art folder AND the art manifest lists it (below).

## What a player sees, and what a figure with no rig does

A figure with no gated rig is exactly the painting set it always was (`PaintedActor`; verified by the stage suites that mock `PaintedActor.create`, which all still pass). A figure with one is ONE painting (its idle, the "costume")
bent by bone transforms: the attack, hurt and ready keys are the same pixels, the same size, the same feet and the same costume, with no swap and no double image. The side-by-side
(`docs/screenshots/rig-engine/rig-vs-plane-idle-attack-hurt-lunge-flash-dim-dissolve.jpg`, rig left, painted plane right, the same frames of Chapter "Biran and Yenke") shows the point: the painted
attack and hurt are different paintings of a different size and costume; the rig's are the idle bent. At rest the two are the same picture (mean difference 6.6 of 255 over the figure's crop, which
holds snow and the camera's drift); flash, tint, dim, dissolve, lunge, recoil, KO lie-down act on the rig as on the plane (`kimahri-rig-*.jpg`).

## Files

| Path | What |
|---|---|
| `src/data/art/rigTypes.ts` | the format v1: types and constants only, every field documented where it is declared |
| `src/engine/rig/RigData.ts` | `readRig(json)` to typed arrays or a reason; the aliases (`uv`, `tris`, `noRim`, the two skin forms); `costumeMatches`, `gateProblem` |
| `RigSkeleton.ts` | bone maths on typed arrays (solve, skin, landmarks), pure |
| `RigKeys.ts` | pose name to key (`poseChain`, `resolveKeyName`), key to channels (`compileKey`), `RigTransition` (the game ease, velocity-continuous start) |
| `RigDynamics.ts` | `Spring`, `RigChains` (dyn.ts ported, bounded), `applyIdle` |
| `RigMaterial.ts` | the game's painted shader with seven string patches (height above ground for the contact ramp, bounce and dissolve; figure coordinates for the dissolve noise; rim mask; no feather or erode on a cut border) |
| `RigFigure.ts` | the part meshes: textures, per-frame skinning into the geometry, the plane group that follows the idle plane, depth layers |
| `RigCarrier.ts` | the private parts of `PaintedActor` the rig reads (pinned by `tests/unit/rig/rig-actor.test.ts`) |
| `RigActor.ts` | `RigActor extends PaintedActor` |
| `RigLoad.ts` | the switch (`?rig=on|off`, hidden `fxRig`), the manifest gate, `chooseRig`, the `[rig]` log, the registry behind `__pyrefly.rigs()` |
| `RigStage.ts` | `buildFigure`: the stage's one choice (the rig code is `import()`ed only when a rig is chosen, so a build with no rig never loads it) |
| `RigValidate.ts` | `validateFeet`: a planted key keeps its lowest foot on the bind row (0.4 percent of the image height) |
| `src/debug/rigApi.ts` | `window.__pyrefly.rigs()` / `rigs({reload: true})` |
| `tools/vite-rig-art.mjs` | dev route `/art/rigs/<subject>/` from `D:/pyrefly-art-rigs` (`RIG_ART_DIR`), subject aliases (`RIG_ART_ALIAS=kimahri=kimahri-proto`), and the served art manifest with `rigs` merged in |
| `tools/rig-from-proto.mjs` | the prototype `rig/kimahri/` to a v1 rig folder with a minimal key set, Kimahri's lag chains and idle, and a fixture gate (`by` says it is not the rig gate) |
| `tests/unit/rig/*` | 80 tests: format, pose chain, interpolation, selection, feet planted, dynamics bounded, the carrier, the real converted Kimahri |

Touched shared files (additive, each a few lines): `BattlePresenterStage.ts` (`add` builds through `buildFigure`; `painted` is the rig's keys for a rigged figure; `PaintedStageOptions.rigs`),
`KoFallback.ts` (`lacksKoPainting` answers from `rigKeys`), `ArtManifest.ts` + `tools/gen/manifest.mjs` (`rigs`, written only when there are any), `app/accessFlags.ts`, `BattleScreen.ts`, `main.ts`.

## How the engine works (the parts a reader will want)

- **Carrier.** The actor loads only the idle (`figure: false`: the planes are never drawn, the head lock stands down). Parts are children of the actor's motion group (`inner`), so lunge, recoil,
  hop, shake, squash, breath, lean, the KO fall and the interim yaw carry them. Each frame the part group copies the idle slot mesh's position, rotation and scale (stance registration, mirror,
  KO topple, prone lay). Parts share the actor's uniform cells by reference (flash, tint, rim, bounce, dissolve, dim, brightness); `opacity` follows `alpha`.
- **Poses.** `setPose` runs `PaintedActor`'s own (life state, ring, flinch tokens), then resolves the name down the game's chain over the rig's keys (the actor chain, plus `follow`/`sleep`/`critical`/`telegraph`
  as the art loader has them) and moves there. A name with no chain and no key leaves the figure as it is (as a painting it cannot draw does). `pose` is the key being shown, `blending` is "a move is in flight",
  `poseNames` are the keys. A rig without a `ko` key is laid down by the existing `lieDown` fallback, like a figure with no KO painting.
- **Easing.** `p0 + (p1 - p0) * quadInOut(u) + d * v0 * u (1 - u)^2`: the game's ease; a request that lands mid-move starts at the speed the figure had (unit-tested for value and velocity). Moves run on the
  field clock times `paceRate('action')`: a hit-stop (dt 0) freezes the rig with the rest of the picture.
- **Idle and dynamics** come from the file's `motion` block. A rig WITHOUT `motion.idle` keeps the painted actor's whole-card breath and sway; with it the card's are off and the bones breathe (REDUCE MOTION's
  `still` hook fades it out). Chains (`drag` = degrees per world unit a second of forward travel, from the world position of the motion group) stream a mane back in a lunge.
- **Draw order.** `order` (0 to about 100) times 0.002 world units in z, each part's bounding-sphere centre pinned to the plane's: parts sort among themselves, and against other actors as the plane did.
  A key may reorder (`layers`, applied halfway through the move into it).
- **Selection** (`RigLoad.chooseRig`): switch (`?rig=on|off`, then the hidden `fxRig` setting, default on), the art manifest lists the subject (`ArtManifest.rigs`; `?rig=on` asks anyway), `rig.json` fetched once
  per subject, `readRig`, `gate.status === 'ok'`, `name` is the subject, `costume.painting` is this figure's idle painting, feet warnings (a planted key whose sole is off the row is a logged warning, not a block:
  the pipeline gate blocks), then `RigActor.createRigged` (a texture that does not load, or an idle of another shape, throws and the stage builds the painting set). One `[rig] subject on|off (reason)` line a subject.

## Numbers (headless Chromium, real GPU, vsync off so the frame time is the cost; `M:/pyrefly-rig-tmp/smoke/perf-*.json`)

Six prototype Kimahri copies (11 parts, 3,068 vertices, 29 bones, 5 chains each: 66 parts, 18,408 vertices in all) next to the real battle's three figures, 390 x 844 phone viewport, crisp rung `a2`:

| | median frame | p95 | p99 |
|---|---|---|---|
| 6 painted planes | 1.4 ms | 2.7 ms | 5.0 ms |
| 6 rigs | 2.0 ms | 3.4 ms | 6.2 ms |
| 8 painted planes | 1.4 ms | 2.6 ms | 4.2 ms |
| 8 rigs (88 parts, 24,544 vertices) | 2.6 ms | 5.2 ms | 11.2 ms |
| 1 rig | 1.5 ms | 3.3 ms | 5.7 ms |

The same six at 1600 x 900: median 2.0 ms, p95 3.4 ms. The CPU cost of the rigs' own update (solve, chains, skin of all 11 parts) is **0.05 ms a rig a frame** (0.25 ms for five). A rig is 11 draw calls against a plane's 1:
the cost to watch is draw calls and fill, not skinning. The budget is 16.7 ms.

Real attack through the presenter (real keys, Chapter "Biran and Yenke"): the key sequence was ready, attack, idle, ready; the sole of Kimahri's rig stepped at most 2.5 px a frame over 499 frames, no console error, no 404.

## What the other lanes must know

- **Units.** A key's `rot` and `root.rot` are RADIANS (what `tools/rig/` writes; a value past 2 pi is refused as degrees by mistake). The `motion` block is in DEGREES (`limit`, `bias`, `drag`, the idle's `rot`).
  `uvs` is v DOWN; the prototype's `uv` is v UP and is not flipped. `weights` of four numbers a vertex, or the prototype's `bones` + `weights`, or `bone`. `gate.status` is `ok`, anything else is "not drawn".
  `costume.painting` is `characters/<subject>/idle` (any `art/` prefix, extension or `@2x` is ignored when compared). `png` is a bare file name beside `rig.json`.
- **A rig is asked for only when the art manifest lists it** (`rigs: ["kimahri", ...]`, written by `tools/gen/manifest.mjs` from `public/art/rigs/<id>/rig.json`), so a build with no rigs makes no request
  and logs nothing. In dev, `tools/vite-rig-art.mjs` merges the list into the served manifest; `?rig=on` asks regardless.
- **Run it.** `node node_modules/vite/bin/vite.js --config tools/zz-rig.tmp.config.mjs --port 5801` (the scratch config is not committed: `mergeConfig(vite.config.ts, { plugins: [pyreflyRigArt(...)] })`),
  `node tools/rig-from-proto.mjs --from <proto rig dir> --to D:/pyrefly-art-rigs/kimahri-proto`, then `http://127.0.0.1:5801/` and the door word `gagazet` on chapter select (Kimahri's hidden chapter); `__pyrefly.rigs()` lists
  what is drawn and why not. `RIG_ART_ALIAS="kimahri=kimahri-proto"` serves a fixture folder as a subject's.
- **Kimahri's real rig** needs: `keys` for `ready`, `attack`, `hurt`, `ko` (else the KO is the lie-down fallback), `victory`; his `motion` (the converter's block is the prototype's); `layers` on the thrust (spear over
  the head). Keys are static poses; the prototype's 4-second run-in is code (choreography), not data, and is not in this lane.
- **Known and not done in this lane** (items 1, 3 and 4 are done by the SHIP lane: [rig-ship.md](rig-ship.md))
  1. **Release builds.** A release takes rigs from a release art mirror (`public/art/rigs/<subject>/` in the mirror, so `tools/gen/manifest.mjs` lists them). Not wired: `tools/art-derive*.mjs`, the art identity and
     load audits and the deploy's file list do not know `rigs/` yet; decide whether rig PNGs ship as WebP (`shippedArtUrl` maps only listed masters, so they ship as PNG today).
  2. **The visible settings row.** The EYE CANDY page keeps its switches in the save schema (the save-data class, ten pinned tests, hard rule 9: Bailey sees a new row). v1 reads `?rig=` and a hidden `fxRig`
     setting; the row waits for Bailey's yes.
  3. **GPU memory.** A rig's textures bypass the art governor: Kimahri's parts are about 4.3 Mpx a figure (about 23 MB with mips), so 8 figures are about 190 MB. Cut the parts at the tier the device draws
     (`ArtTier`) before rigs go on phones.
  4. **Silhouette per key.** `contentQuad`, `poseShape`, the strike reach and the HUD's boxes read the idle plane, so a raised spear does not widen a target bracket. A per-key box can come from the skinned vertices.
  5. **Real shadows.** The planes' figure-shaped depth materials are not on the parts; the contact blob and the foot occlusion are (the scenes' own shadow casting is not used by the figures today).
  6. **Special looks.** `PAINTED_CAST` (Oversoul) and `PAINTED_GLOW` (Omnis) are compile defines of a plane's material and are not on the parts; the living-portrait BREATHING and KO COLLAPSE look
     passes work on the hidden planes. A boss that wears those looks stays the painting set until they are ported.
  7. **Edge-feathered subjects** (Yunalesca 1 to 3, Valefor, Ixion): a cut part has no feather; their rigs need clean cuts.
  8. **`tests/unit/tools/rig-census-install.test.ts`** (the pipeline lane's) fails `tsc` on a missing declaration for `tools/rig/rig-install.mjs`; not this lane's file.
  9. **NOW.md** is not updated here (the driver owns it): "rig engine built on branch `rig`, awaiting Kimahri's gated rig and the release mirror".
