/**
 * The hidden Shinryu's reward items read by name (FFX only; the review of 2026-11-08, MAJOR 1): Rikku's Steal on the dragon printed the raw id ("Stole gamblers-spirit!") because Wings to Discovery and Gambler's Spirit had
 * no `ItemDef` row. The rows now exist (`data/ffx/items/spheres.ts`, name only, with the game's blank item record in `command-records/items.ts`); this plays the real Steal on the real engine and reads the banner.
 */

import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../../src/data/ffx/index.ts';
import { COMMAND_RECORDS } from '../../../src/data/ffx/command-records/index.ts';
import { SHINRYU, defend, log, newEngine, nextInput, row, swing } from '../helpers/shinryuDrive.ts';

/** Rikku's Steal on Shinryu on one seed: the battle messages it produced, or null when she never got the chance. */
function stealMessages(seed: number): string[] | null {
  const engine = newEngine(seed);
  for (let i = 0; i < 60; i++) {
    const input = nextInput(engine, true);
    if (input.actorId === 'rikku') {
      const steal = row(input, 'ability', 'steal', SHINRYU);
      if (steal) {
        const before = log(engine).length;
        engine.submit(steal);
        engine.nextDecision();
        return log(engine)
          .slice(before)
          .filter((e) => e.type === 'message')
          .map((e) => (e as { text: string }).text);
      }
    }
    engine.submit(swing(input) ?? defend());
  }
  return null;
}

describe('the two reward items have names', () => {
  it("Wings to Discovery and Gambler's Spirit resolve to rows that are not usable, carry no invented stats and have the game's blank item record", () => {
    expect(ITEMS['wings-to-discovery']).toMatchObject({ name: 'Wings to Discovery', game: 'ffx', usableInBattle: false, usableInMenu: false, price: 0 });
    expect(ITEMS['gamblers-spirit']).toMatchObject({ name: "Gambler's Spirit", game: 'ffx', usableInBattle: false, usableInMenu: false, price: 0 });
    for (const id of ['wings-to-discovery', 'gamblers-spirit']) {
      const effect = ITEMS[id]!.effect;
      expect(typeof effect === 'string' ? 0 : effect.power, id).toBe(0);
    }
    expect(COMMAND_RECORDS['wings-to-discovery']).toMatchObject({ id: 0x206c, type: 0, flagsMisc: 0, flagsDamage: 0, damageClass: 0, rank: 2 });
    expect(COMMAND_RECORDS['gamblers-spirit']).toMatchObject({ id: 0x206d, type: 0, flagsMisc: 0, flagsDamage: 0, damageClass: 0, rank: 2 });
  });

  it("Rikku's Steal prints the item's name, never its raw id", () => {
    let read = 0;
    for (let seed = 1; seed <= 30 && read < 3; seed++) {
      const messages = stealMessages(seed);
      if (messages === null) continue;
      const stole = messages.filter((m) => /stole/i.test(m));
      if (stole.length === 0) continue;
      read++;
      for (const m of stole) {
        expect(m, `seed ${seed}`).not.toMatch(/gamblers-spirit|three-stars|wings-to-discovery/);
        expect(m, `seed ${seed}`).toMatch(/Gambler's Spirit|Three Stars/);
      }
    }
    expect(read, 'at least one Steal was read').toBeGreaterThan(0);
  });
});
