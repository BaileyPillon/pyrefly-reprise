/**
 * NEW-C1 (docs/plans/combat-polish-0926-review.md §4; iteration-2 B6): Chapter IV's White Mage
 * left alone, with nothing to raise the other two, no longer heals herself forever.
 *
 * The read-only probe found that in this engine a lone White Mage who only heals is never killed
 * and never touches Bahamut (no outcome after 1,500 decisions on 10 of 12 seeds). The line now
 * lifts Curse first (Esuna, else Holy Water or Remedy: X-2 Curse blocks the spherechange) and then
 * changes out of the healer's dressphere. It cannot win from there (the probe's Gunner and Black
 * Mage lines lose 20 of 20); it ends the stalemate. Advisor and auto-battler only: no engine or
 * data number moves.
 *
 * Setup on the real engine: Rikku and Paine are knocked out at the start, on a kit with no Phoenix
 * Down (a measured setup, not game data; with the kit's Phoenix Downs the line raises the others
 * first, which is `revive`, unchanged). The decision cap is kept.
 *
 * Game case: FFX-2 only.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import type { Command, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { ffx2Bahamut } from '../../src/engine/tactics/index.ts';

/** The decision cap: the stalemate this fixes would otherwise run until the heap gives out. */
const MAX_DECISIONS = 6_000;

const noPhoenix: FFX2PartyBuild = {
  ...bevelleBuild,
  inventory: bevelleBuild.inventory.filter((i) => i.itemId !== 'x2-phoenix-down'),
};

interface Turn {
  kind: string;
  label: string;
  cursed: boolean;
  sphere: string;
}

/** Yuna alone from the first tick, following the tactic, `cursed` or not at the start. */
function run(seed: number, cursed: boolean, build: FFX2PartyBuild = noPhoenix): { outcome: string | undefined; turns: Turn[] } {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init({ game: 'ffx2', party: build, enemies: data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!, triggers: [], seed, condition: 'normal', canEscape: false });
  const s = engine.state();
  for (const id of ['rikku', 'paine']) {
    const c = s.combatants[id]!;
    c.hp = 0;
    c.alive = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (cursed) applyStatus(s.combatants['yuna'] as any, { status: 'curse' } as any);

  const turns: Turn[] = [];
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return { outcome: d.result.outcome, turns };
    if (d.kind === 'waiting') { engine.tick(d.nextEventMs); continue; }
    if (d.kind !== 'player-input') continue;
    const cmd = ffx2Bahamut!(d.actorId, d.commands, engine);
    const yuna = engine.state().combatants['yuna']!;
    const row = cmd ? d.commands.find((c) => c.command.kind === cmd.kind && (!('id' in cmd) || ('id' in c.command && c.command.id === cmd.id))) : undefined;
    turns.push({
      kind: cmd?.kind ?? 'none',
      label: cmd?.kind === 'spherechange' ? cmd.extra.toDressphere : (row?.label ?? ''),
      cursed: yuna.statuses['curse'] !== undefined,
      sphere: (yuna as { dresspheres?: { current?: string } }).dresspheres?.current ?? '',
    });
    const r = d.commands.find((c) => c.enabled);
    engine.submit(cmd ?? ({ ...r!.command, targets: r!.validTargets.slice(0, 1) } as Command));
  }
  return { outcome: undefined, turns };
}

const HEALS = ['Cure', 'Cura', 'Curaga', 'Vigor', 'Shell', 'Protect'];

describe('NEW-C1: the lone White Mage in Chapter IV (FFX-2)', () => {
  it('Cursed: Esuna on herself first, then the change to Black Mage; never a heal', () => {
    for (const seed of [1, 2, 3]) {
      const { turns } = run(seed, true);
      expect(turns[0], `seed ${seed}`).toMatchObject({ kind: 'ability', label: 'Esuna', cursed: true, sphere: 'white-mage' });
      const change = turns.findIndex((t) => t.kind === 'spherechange');
      expect(change, `seed ${seed}`).toBeGreaterThan(0);
      expect(turns[change]!.label).toBe('black-mage');
      for (const t of turns.slice(0, change)) expect(HEALS, `seed ${seed}`).not.toContain(t.label);
    }
  });

  it('on any turn she is a White Mage and not Cursed, she changes to Black Mage', () => {
    let seen = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      for (const cursed of [false, true]) {
        for (const t of run(seed, cursed).turns) {
          if (t.cursed || t.sphere !== 'white-mage') continue;
          seen++;
          expect(t, `seed ${seed}`).toMatchObject({ kind: 'spherechange', label: 'black-mage' });
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('once changed she never goes back to healing, and the fight ends inside the decision cap', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { outcome, turns } = run(seed, seed % 2 === 0);
      expect(outcome, `seed ${seed}`).toBeDefined();
      const after = turns.slice(turns.findIndex((t) => t.kind === 'spherechange') + 1);
      for (const t of after) {
        expect(t.sphere, `seed ${seed}`).not.toBe('white-mage');
        expect(HEALS).not.toContain(t.label);
      }
    }
  });

  it('with a Phoenix Down in the kit she raises the others first (revive, unchanged)', () => {
    const { turns } = run(1, true, bevelleBuild);
    expect(turns[0]).toMatchObject({ kind: 'item', label: 'Phoenix Down' });
  });
});
