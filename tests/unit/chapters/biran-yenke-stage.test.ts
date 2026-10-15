/**
 * Biran and Yenke (the hidden FFX chapter): **who stands where** (the driver's find on the first build's first-menu frame, release candidate r49-rc; FFX only). The frame showed the Sensor chip "YENKE RONSO" over the
 * blond brother's head while the turn list showed Biran blond and Yenke brown. The ids and the paintings were right (each brother draws his own `characters/<id>` subject; the browser proof reads each actor's art id);
 * the chip is the one shared FFX Sensor card, pinned in the lane the enemies stand in, and it names the enemy the party's Sensor read LAST when the battle opened (`battle/ffx/sensor.ts#revealForSensorAuto`, in the
 * formation's own order). So the figure at the front right, under the card, has to be that last brother.
 *
 * What this pins, in the data the stage reads (`scenes/gagazet-ronso.ts`, `ENEMY_SPOTS`), and why each line matters:
 *
 * 1. **The formation's order is Biran, then Yenke** (the order Sensor reveals them: the card opens on Yenke).
 * 2. **Yenke, the last one read, stands at the front right** (nearer the camera than Biran and to his right, under the card's resting place at 1600x900); Biran stands behind him and to the left.
 * 3. **The target cursor opens on the leftmost figure on screen** (`ui/ffx/TargetCursor.ts#showSingle`, `startAt` 0), which is Biran: the brother the advisor's first tip names (Lancet, then Biran), so the cursor and the tip agree.
 *
 * The browser proof of the rest is in `docs/screenshots/r49-rc/`: the first menu at 1600x900 (the chip over the brother it names) and each brother aimed (the bracket, the name plate and the TARGET strip, all drawn
 * by id). The card is not anchored to a figure: while the other brother is aimed it names him and rests over his neighbour, in this fight as in every multi-enemy FFX fight (the card's own steer is another file's).
 */
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

describe('who stands where: the Sensor chip names the brother under it', () => {
  it('the formation reads Biran first and Yenke last: the order the party\'s Sensor reveals them, so the card opens on Yenke', () => {
    expect(biranYenkeGroup.enemies.map((e) => e.id)).toEqual([BIRAN_ID, YENKE_ID]);
  });

  it('Yenke, the last one read, stands at the front right (under the card\'s resting place); Biran stands behind him and to the left', () => {
    const [biranX, , biranZ] = spotOf(BIRAN_ID);
    const [yenkeX, , yenkeZ] = spotOf(YENKE_ID);
    expect(yenkeX, 'Yenke is to the right of Biran').toBeGreaterThan(biranX);
    expect(yenkeZ, 'Yenke is nearer the camera than Biran').toBeGreaterThan(biranZ);
    // The last brother in the formation's order is the one at the right; the first is the one at the left. A third body, if the stage ever gets one, does not change the rule.
    const order = biranYenkeGroup.enemies.map((e) => e.id);
    const byX = [BIRAN_ID, YENKE_ID].sort((a, b) => spotOf(a)[0] - spotOf(b)[0]);
    expect(byX[0]).toBe(order[0]);
    expect(byX.at(-1)).toBe(order.at(-1));
  });

  it('the target cursor opens on the leftmost figure, Biran, the brother the advisor\'s first tip names: the cursor and the tip agree', () => {
    const leftmost = [BIRAN_ID, YENKE_ID].sort((a, b) => spotOf(a)[0] - spotOf(b)[0])[0];
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
});
