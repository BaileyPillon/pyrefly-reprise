/**
 * Every FFX-2 steal reward has a named `ItemDef` row, so Steal's banner and the
 * Results screen print "Mute Shock", never "x2-mute-shock".
 *
 * Before: Bahamut's steal printed the raw id and six more steal ids had no row
 * (L-Bomb from the Bulwarks; Snow Ring, Potpourri, White Cape, Chaos Shock and
 * Fury Shock from the Fallen Aeons). Names and the sourced fields are in
 * `src/data/ffx2/items/held.ts` and `damage.ts`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, Command, EnemyDef } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { readableItemId } from '../../src/battle/ffx2/steal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';

/** Every steal id in every FFX-2 formation, enemies and parts. */
function stealIds(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const group of Object.values(data.ENEMY_GROUPS_BY_ID)) {
    const all: EnemyDef[] = [...group.enemies, ...(group.parts ?? [])];
    for (const enemy of all) {
      const steal = enemy.rewards?.steal;
      if (!steal) continue;
      for (const id of [steal.common.itemId, steal.rare.itemId]) out.set(id, [...(out.get(id) ?? []), `${group.id}/${enemy.id}`]);
    }
  }
  return out;
}

describe('FFX-2 steal rewards resolve to named items (FFX-2 only)', () => {
  it('every steal id in every formation has an ItemDef row', () => {
    const missing = [...stealIds().entries()].filter(([id]) => !data.ITEMS[id]).map(([id, who]) => `${id} (${who.join(', ')})`);
    expect(missing).toEqual([]);
  });

  it('the seven new rows carry their sourced names', () => {
    const names = Object.fromEntries(
      ['x2-mute-shock', 'x2-l-bomb', 'snow-ring', 'potpourri', 'white-cape', 'x2-chaos-shock', 'x2-fury-shock'].map((id) => [id, data.ITEMS[id]?.name]),
    );
    expect(names).toEqual({
      'x2-mute-shock': 'Mute Shock',
      'x2-l-bomb': 'L-Bomb',
      'snow-ring': 'Snow Ring',
      potpourri: 'Potpourri',
      'white-cape': 'White Cape',
      'x2-chaos-shock': 'Chaos Shock',
      'x2-fury-shock': 'Fury Shock',
    });
  });

  it('accessories are held, never offered from a menu; their effect id resolves', () => {
    for (const id of ['x2-mute-shock', 'snow-ring', 'potpourri', 'white-cape', 'x2-chaos-shock', 'x2-fury-shock']) {
      const item = data.ITEMS[id]!;
      expect(item.usableInBattle, id).toBe(false);
      expect(item.usableInMenu, id).toBe(false);
      expect(data.ABILITIES[item.effect as string], `${id} effect`).toBeDefined();
    }
  });

  it('L-Bomb is the sourced thrown item: 450 to all (power 9, fixed), 100 gil', () => {
    const item = data.ITEMS['x2-l-bomb']!;
    expect(item.usableInBattle).toBe(true);
    expect(item.price).toBe(100);
    expect(item.targeting).toBe('all-enemies');
    const effect = data.ABILITIES[item.effect as string]!;
    expect(effect.formula).toBe('fixed');
    expect(effect.power * 50).toBe(450);
  });

  it("Supreme Gem (Paragon's steal) is the sourced thrown item: 2,500 to all, non-elemental, sells for 250", () => {
    const item = data.ITEMS['x2-supreme-gem']!;
    expect(item.name).toBe('Supreme Gem');
    expect(item.usableInBattle).toBe(true);
    expect(item.usableInMenu).toBe(false);
    expect(item.price).toBe(250);
    expect(item.targeting).toBe('all-enemies');
    const effect = data.ABILITIES[item.effect as string]!;
    expect(effect.formula).toBe('fixed');
    expect(effect.element).toEqual(['none']);
    expect(effect.power * 50).toBe(2500);
  });

  it('a gap would still read as words, not an id', () => {
    expect(readableItemId('x2-mute-shock')).toBe('Mute Shock');
    expect(readableItemId('snow-ring')).toBe('Snow Ring');
  });

  it('on the real engine, stealing from Bahamut says "stole Mute Shock!"', () => {
    const engine = new FFX2Engine({
      abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
      items: itemRegistryFrom(Object.values(data.ITEMS)),
      dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
      garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
      minigames: false,
      atbMode: 'wait',
    });
    engine.setSeed(3);
    engine.init({ game: 'ffx2', party: chateauBuild, enemies: data.ENEMY_GROUPS_BY_ID['ffx2-bahamut']!, triggers: [], seed: 3, condition: 'normal', canEscape: false });
    const said: string[] = [];
    for (let i = 0; i < 20_000 && !said.some((t) => /stole/.test(t)); i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const row = d.actorId === 'rikku' ? d.commands.find((c) => 'id' in c.command && c.command.id === 'x2-thief-steal') : undefined;
      const from = engine.state().log.length;
      engine.submit(row ? ({ ...row.command, targets: ['bahamut'] } as Command) : { kind: 'defend', targets: [] });
      said.push(...engine.state().log.slice(from).flatMap((e: BattleEvent) => (e.type === 'message' ? [e.text] : [])));
    }
    const stole = said.find((t) => /stole/.test(t));
    expect(stole).toBe('Rikku stole Mute Shock!');
    expect(engine.state().flags['inventory:x2-mute-shock']).toBe(1);
  });
});
