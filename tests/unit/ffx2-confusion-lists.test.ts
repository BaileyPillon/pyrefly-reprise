/**
 * What a Confused girl can pick from, per dress (re-parity RC9 lane X2-H; **FFX-2 only**). A regression pin, not an oracle: the lists come from the menu kernel (lane X2-B,
 * proven against the game) and the candidate filter from `kernel/confusion-pick.ts` (proven against the game's own machine code, `parity-ffx2-confusion-pick.test.ts`); this file
 * pins what the adapter (`adapt/confusion.ts`) hands the kernel for each dressphere of the build, and that the lists it caches follow the dress she wears.
 *
 * The counts are the commands of her main window (and shortcut) that carry the game's Confusion bit, with the Item command counted when the party holds something usable.
 */

import { describe, expect, it } from 'vitest';
import * as data from '../../src/data/ffx2/index.ts';
import { confusedTurn, type ConfusionEnv } from '../../src/battle/ffx2/adapt/confusion.ts';
import { LOADOUTS, board } from './helpers/ffx2AutoRig.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const options = ffx2Options();

/** The pick for a girl wearing `sphere` with the given bag, plus the unit and the env she was asked in. */
function ask(sphere: string, inventory: Record<string, number>, seed = 3) {
  const e = board({ yuna: { ...LOADOUTS['plain']!, dressphere: sphere } }, seed);
  const yuna = e.unit('yuna');
  const env: ConfusionEnv = { units: e.all, abilities: options.abilities!, dresspheres: options.dresspheres!, items: options.items, inventory, rng: e.streams };
  return { e, yuna, env, turn: confusedTurn(yuna, env) };
}

/** Candidates per dressphere with a bag that holds a Megalixir and a Remedy (the Item command is a candidate). */
const WITH_BAG: Readonly<Record<string, number>> = {
  gunner: 2, thief: 3, warrior: 4, songstress: 1, 'white-mage': 3, 'black-mage': 3, 'gun-mage': 2, 'dark-knight': 4, samurai: 4, berserker: 4, alchemist: 2, 'lady-luck': 3, trainer: 2, mascot: 2,
};

describe('what the Confusion pick is offered, per dress (a regression pin on the adapter)', () => {
  it('every dressphere of the build lists the candidates pinned here when the bag holds something (and the table covers the whole build)', () => {
    expect(Object.keys(WITH_BAG).sort()).toEqual(Object.values(data.STANDARD_DRESSPHERES).map((s) => s.id).sort());
    for (const [sphere, want] of Object.entries(WITH_BAG)) {
      const { turn } = ask(sphere, { 'x2-megalixir': 2, 'x2-remedy': 1 });
      expect(turn?.candidates, sphere).toBe(want);
    }
  });

  it('with an empty bag the Item command drops out of every list, and a dress with nothing else (the Songstress) has nothing to pick: the pick queues nothing', () => {
    for (const [sphere, want] of Object.entries(WITH_BAG)) {
      const { turn } = ask(sphere, {});
      if (want === 1) expect(turn, sphere).toBeNull();
      else expect(turn?.candidates, sphere).toBe(want - 1);
    }
  });

  it('the lists follow the dress she wears: the same girl asked in a Gunner, a Warrior and a Gunner again is offered 2, 4 and 2 commands', () => {
    const { yuna, env } = ask('gunner', { 'x2-megalixir': 2 });
    expect(confusedTurn(yuna, env)?.candidates).toBe(2);
    yuna.dresspheres!.current = 'warrior';
    expect(confusedTurn(yuna, env)?.candidates).toBe(4);
    yuna.dresspheres!.current = 'gunner';
    expect(confusedTurn(yuna, env)?.candidates).toBe(2);
  });

  it('an item that is gone from the bag, or has no use in battle, is not a candidate; a bag of items that cannot be used leaves only the dress\'s own commands', () => {
    expect(ask('gunner', { 'x2-megalixir': 0 }).turn?.candidates).toBe(1);
    expect(ask('gunner', { 'x2-megalixir': 0, 'x2-remedy': 3 }).turn?.candidates).toBe(2);
    expect(ask('gunner', { 'not-an-item': 4 }).turn?.candidates).toBe(1);
  });
});
