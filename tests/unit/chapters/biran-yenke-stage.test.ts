/**
 * Biran and Yenke (the hidden FFX chapter): **who stands where** (FFX only). Two finds on the first-menu frame, one after the other:
 *
 * - r49-rc (the driver): the Sensor chip read "YENKE RONSO" over the blond brother's head while the turn list showed Biran blond and Yenke brown. The ids and the paintings were right (each brother draws his own
 *   `characters/<id>` subject; the browser proof reads each actor's art id); the chip is the one shared FFX Sensor card and it names the enemy the party's Sensor read LAST when the battle opened
 *   (`battle/ffx/sensor.ts#revealForSensorAuto`, in the formation's own order). The brothers were swapped so the card sat over the brother it names.
 * - r49-rc's focused review (F939-01, major): the open card then hid Yenke completely, at 1600x900 and at 2000x1012 (a Sensor reading opens it for seven seconds and every change of target opens it again). The card is the
 *   shared HUD's and does not move; this chapter's spots do. Both brothers now stand clear of it, and Kimahri's slot moved left to make room (with him on Chapter I's slot the brothers stood behind his head), by
 *   no more than the framing planner allows (6 below).
 *
 * What this pins, in the data the stage reads (`scenes/gagazet-ronso.ts`: `ENEMY_SPOTS` and `PARTY_SLOTS`), and why each line matters:
 *
 * 1. **The formation's order is Biran, then Yenke** (the order Sensor reveals them: the card opens on Yenke).
 * 2. **Both brothers' whole pictures end left of the card's leftmost resting edge**, at every window at least 16:9 wide (1600x900, 1920x1080, 2000x1012, 2560x1080, 3840x2160), with a margin of 2 percent of the window's
 *    height or more. The card (`ui/ffx/ffx-hud.css`, `.ffx-sensor`) rests at grid 436 and slides left to clear the turn list's names (`ui/ffx/sensorCtbClear.ts`); measured in the browser on this stage it never goes left of
 *    grid 406 (x 1017 at 1600x900, x 1245 at 2000x1012). The camera and the HUD both scale with the window's height, so the same grid edge stands in the same place of the picture at every such window and this is
 *    computed once per window from the rig, in pixels. The pictures are taken 1.45 world units wide (measured: 1.42 for Biran, 1.38 for Yenke), feet to horn tip.
 * 3. **Yenke, the one the card names at the first menu, stands nearest it** (to the right of Biran and nearer the camera); Biran stands behind him and to the left. The two overlap by a quarter to three quarters of the
 *    narrower picture: shoulder to shoulder, as the brothers who stand guard for each other, and neither one hidden.
 * 4. **The target cursor opens on the leftmost figure on screen** (`ui/ffx/TargetCursor.ts#showSingle`, `startAt` 0), which is Biran: the brother the advisor's first tip names (Lancet, then Biran), so the cursor and the tip agree.
 * 5. **Kimahri's slot is Chapter I's first slot moved 0.59 to the left and nothing else** (same depth, same height; the two spare slots are Chapter I's own).
 * 6. **Kimahri's picture begins 3 percent of the window's height or more right of the command column CHAPTER FRAMING predicts** (`engine/fx/mix/hudPanels.ts#predictedPanels`: its right edge is 0.344 of the width), at every window at
 *    least 16:9 wide. Why it matters, measured on the production build at 1600x900 (8 runs a slot, one door route, `docs/handoff/r50-rc.md`): with the slot at x -2.1 (picture on that edge, margin 0) the planner slid the whole picture 64 px right
 *    (its first lens step, 4 percent of the width) in 4 runs of 8, which put the end of Yenke's tail under the open card; at -2.0, -1.9 and -1.8 it never slid, and at -1.9 the margin is 3.2 to 4.5 percent. With no slide, the arithmetic of 2 above is
 *    what the player sees.
 *
 * The browser proof of the rest is in `docs/screenshots/r50-rc/`: the first menu at 1600x900, 2000x1012 and 390x844 with the card open, and each brother aimed (the bracket, the name plate and the TARGET strip are drawn by id).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { BIRAN_ID, YENKE_ID } from '../../../src/data/ffx/biran-yenke-ids.ts';
import { biranYenkeGroup } from '../../../src/data/ffx/enemies/biran-yenke.ts';
import { biranYenke } from '../../../src/engine/tactics/biran-yenke.ts';
import { GAGAZET_RONSO_SLOTS } from '../../../src/scenes/gagazet-ronso.ts';
import * as H from '../helpers/ronsoDrive.ts';

/** A brother's spot on the stage: `[x, y, z]`, x to the right, z toward the camera (Kimahri's own slot is at z 1.55, the brothers are behind him). */
function spotOf(id: string): readonly [number, number, number] {
  const spot = GAGAZET_RONSO_SLOTS.enemySpots?.[id];
  if (spot === undefined) throw new Error(`the stage has no spot for ${id}`);
  return spot;
}

/** Chapter I's `idle` rig, which this scene inherits (`scenes/gagazet.ts`: `CAMERA_REF`, `RIGS.idle`). Guarded against drift in the last test of this file. */
const IDLE_RIG = { position: [-1.0, 3.668, 11.25], lookAt: [-1.01, 2.01, -1.2], fov: 32 } as const;
/** The card's leftmost resting edge in the 640x360 grid, measured in the browser on this stage (1017 px at 1600x900 is 406.8; 1245 px at 2000x1012 is 407.1). */
const CARD_LEFT_GRID = 406;
/** A brother's picture, in world units wide (measured with the browser's own rectangles: 1.42 Biran, 1.38 Yenke); the test takes 1.45. */
const PICTURE_WIDTH = 1.45;
/** The windows the 640x360 HUD letterboxes into (16:9 and wider): the card's place in the picture is the same fraction of the height in each. */
const WINDOWS: ReadonlyArray<readonly [number, number]> = [[1600, 900], [1920, 1080], [2000, 1012], [2560, 1080], [3840, 2160]];

/** The `idle` camera of a window `w` by `h`. */
function idleCamera(w: number, h: number): PerspectiveCamera {
  const cam = new PerspectiveCamera(IDLE_RIG.fov, w / h, 0.1, 200);
  cam.position.set(...IDLE_RIG.position);
  cam.lookAt(new Vector3(...IDLE_RIG.lookAt));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}

/** A brother's picture in window pixels, feet to horn tip and `PICTURE_WIDTH` wide, centred on his spot. */
function pictureBox(id: string, w: number, h: number, spot: readonly [number, number, number] = spotOf(id)): { left: number; right: number; top: number; bottom: number } {
  const cam = idleCamera(w, h);
  const [x, , z] = spot;
  const tall = GAGAZET_RONSO_SLOTS.figureHeights?.[id];
  if (tall === undefined) throw new Error(`the stage has no height for ${id}`);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const dx of [-PICTURE_WIDTH / 2, PICTURE_WIDTH / 2]) {
    for (const y of [0, tall]) {
      const p = new Vector3(x + dx, y, z).project(cam);
      xs.push((p.x * 0.5 + 0.5) * w);
      ys.push((1 - (p.y * 0.5 + 0.5)) * h);
    }
  }
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

/** The card's leftmost resting edge in window pixels: the 640x360 stage is fitted to the window's height and centred. */
function cardLeftPx(w: number, h: number): number {
  const scale = h / 360;
  return (w - 640 * scale) / 2 + CARD_LEFT_GRID * scale;
}

describe('who stands where: both brothers stand clear of the Sensor card, Yenke nearest it', () => {
  it('the formation reads Biran first and Yenke last: the order the party\'s Sensor reveals them, so the card opens on Yenke', () => {
    expect(biranYenkeGroup.enemies.map((e) => e.id)).toEqual([BIRAN_ID, YENKE_ID]);
  });

  it("every window at least 16:9 wide: each brother's whole picture ends left of the card's leftmost edge, with 2 percent of the window's height to spare", () => {
    for (const [w, h] of WINDOWS) {
      const card = cardLeftPx(w, h);
      for (const id of [BIRAN_ID, YENKE_ID]) {
        const box = pictureBox(id, w, h);
        expect(card - box.right, `${id} at ${w}x${h}: ${box.right.toFixed(0)} against the card at ${card.toFixed(0)}`).toBeGreaterThanOrEqual(0.02 * h);
      }
    }
  });

  it("the card was on top of Yenke before (r49-rc's spot, measured by the same function): this test would have failed there", () => {
    const box = pictureBox(YENKE_ID, 1600, 900, [1.85, 0, -2.0]);
    expect(cardLeftPx(1600, 900) - box.right, "Yenke at the front right ends past the card's left edge").toBeLessThan(0);
    const biran = pictureBox(BIRAN_ID, 1600, 900, [0.55, 0, -3.9]);
    expect(cardLeftPx(1600, 900) - biran.right, "and the first build's Biran stood across its edge").toBeLessThan(0.02 * 900);
  });

  it('Yenke, the last one read, is the brother nearest the card (to the right of Biran, nearer the camera); the two overlap by a quarter to three quarters of the narrower picture', () => {
    const [biranX, , biranZ] = spotOf(BIRAN_ID);
    const [yenkeX, , yenkeZ] = spotOf(YENKE_ID);
    expect(yenkeX, 'Yenke is to the right of Biran').toBeGreaterThan(biranX);
    expect(yenkeZ, 'Yenke is nearer the camera than Biran').toBeGreaterThan(biranZ);
    const order = biranYenkeGroup.enemies.map((e) => e.id);
    const byX = [BIRAN_ID, YENKE_ID].sort((a, b) => spotOf(a)[0] - spotOf(b)[0]);
    expect(byX[0]).toBe(order[0]);
    expect(byX.at(-1)).toBe(order.at(-1));
    const b = pictureBox(BIRAN_ID, 1600, 900);
    const y = pictureBox(YENKE_ID, 1600, 900);
    const overlap = Math.min(b.right, y.right) - Math.max(b.left, y.left);
    const narrower = Math.min(b.right - b.left, y.right - y.left);
    expect(overlap / narrower, 'shoulder to shoulder: neither hidden, neither apart').toBeGreaterThan(0.25);
    expect(overlap / narrower).toBeLessThan(0.75);
  });

  it('the target cursor opens on the leftmost figure, Biran, the brother the advisor\'s first tip names: the cursor and the tip agree', () => {
    const leftmost = [BIRAN_ID, YENKE_ID].sort((a, b) => pictureBox(a, 1600, 900).left - pictureBox(b, 1600, 900).left)[0];
    const e = H.newEngine(1);
    const input = H.nextInput(e);
    const tip = biranYenke(H.KIM, input.commands, e);
    expect(tip).toMatchObject({ kind: 'ability', id: 'lancet', targets: [leftmost] });
    expect(leftmost).toBe(BIRAN_ID);
  });

  it('both brothers are pinned at the same Ronso height and each has a spot of his own (the ids are the stage\'s keys)', () => {
    expect(Object.keys(GAGAZET_RONSO_SLOTS.enemySpots ?? {}).sort()).toEqual([BIRAN_ID, YENKE_ID].sort());
    expect(GAGAZET_RONSO_SLOTS.figureHeights?.[BIRAN_ID]).toBe(GAGAZET_RONSO_SLOTS.figureHeights?.[YENKE_ID]);
    expect(spotOf(BIRAN_ID)).not.toEqual(spotOf(YENKE_ID));
  });

  it("Kimahri's slot is Chapter I's first slot (the scene file's, x -1.31) moved 0.59 to the left and nothing else; the two spare slots are Chapter I's own", () => {
    const ours = GAGAZET_RONSO_SLOTS.party;
    expect(ours[0]).toEqual([-1.9, 0, 1.55]);
    expect(ours[1]).toEqual([0.3, 0, 1.0]);
    expect(ours[2]).toEqual([-0.61, 0, -1.05]);
    expect(ours[0]![0]).toBeCloseTo(-1.31 - 0.59, 9);
    expect(GAGAZET_RONSO_SLOTS.holdParty).toBe(true);
    // Chapter I's own numbers, read from its scene file: if it moves them, this fails and the staging is looked at again.
    const scene = readFileSync(fileURLToPath(new URL('../../../src/scenes/gagazet.ts', import.meta.url)), 'utf8');
    expect(scene).toContain('[-1.31, 0, 1.55], // front');
    expect(scene).toContain('[0.3, 0, 1.0], // Yuna: front-right');
    expect(scene).toContain('[-0.61, 0, -1.05], // back');
  });

  it("Kimahri's picture begins 3 percent of the window's height or more right of the command column the framing planner predicts, so it has no reason to slide the picture (and the slot at x -2.1 did not)", () => {
    // The planner's panel, read from its source: if it moves, this fails and the margin is measured again on the build.
    const panels = readFileSync(fileURLToPath(new URL('../../../src/engine/fx/mix/hudPanels.ts', import.meta.url)), 'utf8');
    expect(panels).toContain('f(0.043, 0.494, 0.344, 0.929)');
    const COLUMN_RIGHT = 0.344; // of the window's width: the right edge of that panel
    // Measured in the browser (1600x900, 32 runs over four slots): the picture's left edge sits 76 to 82 px (0.084 to 0.091 of the height) left of the slot's feet; the test takes the larger, 0.09.
    const LEFT_OF_FEET = 0.09;
    const MARGIN = 0.03; // of the height: 27 px at 1600x900, where x -1.9 measured 28 to 41 px
    const marginAt = (w: number, h: number, x: number): number => {
      const p = new Vector3(x, 0, 1.55).project(idleCamera(w, h));
      return ((p.x * 0.5 + 0.5) * w - LEFT_OF_FEET * h - COLUMN_RIGHT * w) / h;
    };
    const slot = GAGAZET_RONSO_SLOTS.party[0]!;
    for (const [w, h] of WINDOWS) {
      expect(marginAt(w, h, slot[0]), `Kimahri's picture against the predicted column at ${w}x${h}`).toBeGreaterThanOrEqual(MARGIN);
    }
    // The slot before (x -2.1: the picture on the column's edge, which slid the picture 64 px in 4 of 8 runs) fails the same arithmetic at the window it was measured at.
    expect(marginAt(1600, 900, -2.1)).toBeLessThan(MARGIN);
  });

  it('the numbers above are the scene file\'s and the card\'s own: a moved camera or a moved card fails here and the spots are measured again', () => {
    const scene = readFileSync(fileURLToPath(new URL('../../../src/scenes/gagazet.ts', import.meta.url)), 'utf8');
    expect(scene).toContain('const CAMERA_REF: [number, number, number] = [-1.0, 3.668, 11.25];');
    expect(scene).toContain('idle: { position: CAMERA_REF, lookAt: [-1.01, 2.01, -1.2], fov: 32 }');
    const css = readFileSync(fileURLToPath(new URL('../../../src/ui/ffx/ffx-hud.css', import.meta.url)), 'utf8');
    expect(css).toContain('left: calc(436px + var(--ffx-sensor-dx, 0px) + var(--ffx-sensor-cdx, 0px) + var(--ffx-sensor-px, 0px)); top: calc(166px');
  });
});
