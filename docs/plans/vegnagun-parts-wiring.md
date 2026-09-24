# Vegnagun parts: wiring plan for the picked options (phase 2)

**Game case: FFX-2 only.** Vegnagun exists only in Chapter 5 (`ffx2-vegnagun-shuyin`). Nothing here touches an FFX chapter. The shared engine hooks proposed below are "both" plumbing (see `critic/CHECKS.md` CHK-020). They must stay inert for every scene that does not opt in.

**Bailey's pick, 2026-09-24:** "I'll take all of your recommendations". Per part:

- Bulwark: **C\***
- Redoubt: **C\***
- Node: **C**
- Tail: **A**

The options are in [../concepts/chapters/vegnagun/parts/README.md](../concepts/chapters/vegnagun/parts/README.md) (`options.jpg`). What was installed is on `installed.jpg` in the same folder.

Fixes: **PR-0095** (the hooded-cone placeholders) and **PR-0015** (the green tail tip).

## Phase 1: done (vegnagun-art agent)

| Part | Pick | What was produced | Where |
|---|---|---|---|
| Tail tip | A | `vegnagun-tail/idle.png`, with the green blade recoloured to cool steel from its own luminance. The gold spine and the body are untouched. | `public/art/characters/vegnagun-tail/idle.png` (gitignored, local). The sidecar `status` is `CANDIDATE-picked`. The backup is `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-picks/characters/vegnagun-tail/idle.png`. |
| Bulwark R/L | C\* | **No file.** The part has no figure; it is a ring on the parent painting's own legs. | Anchors below |
| Redoubt R/L | C\* | **No file.** Rings on the head painting's tusk and jaw. | Anchors below |
| Node A/B/C | C | **No file.** The Nodes are off-frame overhead. | Placement below |

- The art manifest was regenerated with `node tools/gen/manifest.mjs`. The state lists did not change: the tail still has `hurt`, `idle` and `ko`.
- sha256 of the installed tail file: `afa30f9c…6a8c51`. The original was `51ff40bd…ce7c31f`.
- **Not recoloured: tail `hurt` and `ko`.** The pick covered the idle's blade tip. Those two paintings are a different, copper-and-green design with glowing green conduits, not a green tip. Recolouring them is a separate question for Bailey. Their off-model look is disclosed here and is not fixed.
- In the local dev build (GPU, seed 1, link 1), the tip now reads as steel. It still passes **behind Rikku's arm** in the default framing. That is placement (`ENEMY_SLOTS[0]` in `src/scenes/farplane.ts`), not paint, so PR-0015's "stuck to Rikku's arm" reading is only half fixed. Phase 2 should check the tip's projected box against the party boxes.

## Phase 2: wiring owed (src/scenes, src/engine, src/data; other agents own these files right now)

### Today

- The sprite keys are `vegnagun-bulwark` (`src/data/ffx2/enemies/vegnagun-body.ts:31`), `vegnagun-redoubt` (`vegnagun-head.ts:48`) and `vegnagun-node` (`vegnagun-leg.ts:32`).
- None of these keys has art, so `BattlePresenterStage.add` (`src/engine/BattlePresenterStage.ts` about line 187) builds a `PaintedActor` with the `paintBossSilhouette` placeholder: the hooded cone.
- `applyFormation` then lays the parts along their parent's lane (`src/engine/Formation.ts` about line 168), using `liftOf` for the height.

### 1. Do not add `public/art/characters/vegnagun-{bulwark,redoubt,node}`

The pick is "no separate figure". Leave the three sprite keys as they are in `src/data`, because the engine, the HUD and the advisor read them. Change how the stage draws them instead.

### 2. New stage option: a part with no figure

Add an **additive** per-sprite-key option. Two ways are acceptable:

- a table in the scene entry, for example `SceneEntry.partAnchors`;
- a new export beside `FARPLANE_SLOTS` in `src/scenes/farplane.ts`, passed through `src/scenes/index.ts`.

If `SceneSlots` in `src/scenes/index.ts` or anything else listed in `docs/CONTRACTS.md` changes, add an entry to `docs/CONTRACT-CHANGES.md`.

Suggested shape:

```ts
type PartAnchor =
  | { mode: 'onParent'; u: number; v: number; ring: { radius: number; ground: boolean } }
  | { mode: 'overhead'; world: [x: number, y: number, z: number]; edgeMarker: true };

export const FARPLANE_PART_ANCHORS: Record<string, PartAnchor | Record<string, PartAnchor>> = { ... };
```

When a combatant's sprite key (or id) has an anchor, `BattlePresenterStage.add` should:

- create the actor **invisible**. Either use a figure-less `PaintedActor` (`visible = false` on the mesh, keep its `Object3D` for position and projection) or use a bare `Object3D` registered under the same id. `project(id, 'head' | 'chest' | 'feet')`, the target cursor, damage numbers and the turn ring all need a position to read;
- skip it in `applyFormation`. The solver must not move it;
- skip it in the projected-overlap pass that pushes fiends apart. It has no silhouette.

### 3. Bulwark C\* and Redoubt C\*: anchor to the parent painting

Anchors are in the parent's `idle.png` pixel space, normalised:

- `u = x / width`, from the painting's left edge as painted. The enemies face left and are drawn unmirrored.
- `v = (baselineY - y) / (baselineY - contentTop)`: 0 at the feet, 1 at the top of the content, which matches how `PaintedActor.worldHeight` is measured.

| Combatant (id / sprite key) | Parent painting | px (x, y) | u | v | Ring |
|---|---|---|---|---|---|
| Right Bulwark (`vegnagun-bulwark`, first part of `vegnagun-body`) | `vegnagun-body/idle.png` 1213x827, baselineY 811, contentTop 7 | (160, 811), the near foreleg's foot | 0.132 | 0.00 | **ground** ring |
| Left Bulwark (second part) | same | (1110, 811), the far leg's foot | 0.915 | 0.00 | **ground** ring |
| Right Redoubt (`vegnagun-redoubt`, first part of `vegnagun-head`) | `vegnagun-head/idle.png` 1216x832, baselineY 830, contentTop 0 | (330, 510), the tusk | 0.271 | 0.386 | upright ring around the tusk |
| Left Redoubt (second part) | same | (560, 680), the jaw | 0.461 | 0.181 | upright ring. **A guess:** the painting shows one tusk (README). |

- For the head chest/cursor anchor, use the painted point itself. For the Bulwark chest, use (170, 560): u 0.140, v 0.312.
- World position: `parent.position + ((u - 0.5) * parent.worldWidth, v * parent.worldHeight, +0.05 toward the camera)`. `worldWidth` is `worldHeight * width / (baselineY - contentTop)`. Re-read the parent every frame so breathe, sway and hop carry the ring.
- **Which part is which.** The part list order in `vegnagun-body.ts` and `vegnagun-head.ts` decides Right and Left. Map by id, not by slot index.
- The Bulwark ground ring is also where the research's **5 m counter decal** (`research/ffx2-vegnagun-shuyin.md` §4.3.5) should be centred when that is built. The counter is positional, which is why off-screen was not offered for the Bulwarks.
- Ring look: reuse `TargetHighlight` / `turnRing` styling (violet `0xc8a0ff`, as the C\* mock used), shown while the part is targeted, acting or selectable. A KO'd part's ring fades out; the parent painting stays.

### 4. Node C: overhead, off-frame

Research §2 says "Nodes hang far overhead", and §4.3.2 gives the anchors:

| Node | x | z | y |
|---|---|---|---|
| A | +5.0 | +6.0 | **+9.0** |
| B | +6.0 | 0.0 | **+10.5** |
| C | +5.0 | −6.0 | **+9.0** |

- The research values are in its wide-field frame (party at x −5..−6). This scene uses its own frame, with the leg on `ENEMY_SLOTS[0] = [0.8, 0, -5.0]`. Place the Nodes **relative to the leg**: `leg.position + (dx, y, dz)` with dx ≈ +2 / +3 / +2, the research's y (9 / 10.5 / 9), and dz ≈ −1.5 / 0 / +1.5. Those dx and dz values are staging, not sourced; the y values are sourced.
- Check that all three project **above the top edge** (screen y < 0) at the chapter's camera. If one does not, raise it rather than lower the others.
- **Edge marker (the C mock):** for each live Node whose projected point is off-frame, draw a small arrow plus the name ("NODE A") at the top edge. Clamp its x to the projection and colour it by the Node's colour state (red, green, yellow, from the §3.2 state machine the engine already runs). This is DOM chrome in the FFX-2 HUD, so a later agent owns it: `src/ui/ffx2`, not `src/ui/ffx`.
- The HUD bars (Node A/B/C) and the intent card already carry the Nodes. Keep them.
- The Nodes' long-range-only gating is engine data (`reachableBy`, §4.3.4), and placement must not change it.
- `ENEMY_SLOTS` keeps four entries. Its comment about Node C landing on Node B stops mattering once the Nodes are anchored.

### 5. Tests to add in phase 2

- A unit test in `tests/unit/engine/`: a combatant with an anchor gets no placeholder figure, `applyFormation` does not move it, and `project(id)` returns the anchored point (or a point off-frame for a Node).
- A Chapter 5 visual check at links 2, 3 and 4 (GPU, real keys):
  - no hooded cones;
  - rings on the forelegs and on the tusk and jaw when targeting;
  - three edge markers at the top for the Nodes;
  - the target cursor lands on the ring.
- Re-run `tests/unit/engine/formation.test.ts` and `tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`.

## Open for Bailey (from the options README, still open)

1. Are the shipped Vegnagun part paintings (tail, leg, body, head) the approved reference? Nothing pins them yet, so the installed tail is `CANDIDATE-picked`, not approved.
2. Should the tail's `hurt` and `ko` paintings get a matching pass? They do not share the idle's design; see above.
