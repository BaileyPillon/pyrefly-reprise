import { appendFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const OUT = 'D:/Final Fantasy/critic/scratch/probe-out.txt';
const log = (...a: unknown[]): void => { appendFileSync(OUT, a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + String.fromCharCode(10)); };
import type { BattleEvent, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, buildBattle, resolveAbility } from '../../src/battle/ffx/index.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';

function liveContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities(ALL_ABILITIES);
  reg.addItems(Object.values(ITEMS));
  return reg;
}
function realCtx(seed: number) {
  const group = ENEMY_GROUPS_BY_ID['yunalesca'];
  if (!group) throw new Error('missing');
  const events: BattleEvent[] = [];
  let seq = 0;
  const ctx = buildBattle(
    { game: 'ffx', party: zanarkandBuild, enemies: group, triggers: [], seed, condition: 'scripted', canEscape: false },
    new SeededRng(seed),
    liveContent(),
    (e) => { events.push({ ...e, seq: seq++ } as BattleEvent); },
  );
  const at = (id: string) => ctx.state.combatants[id] as FFXCombatant;
  return { ctx, events, at };
}

describe('probe', () => {
  it('reports the shipped party death/zombie resistance bytes', () => {
    const { at } = realCtx(1);
    for (const id of ['tidus', 'yuna', 'auron']) {
      log(id, 'ko-res', at(id).immunities['ko'], 'zombie-res', at(id).immunities['zombie'], 'maxHp', at(id).stats.maxHp);
    }
    expect(true).toBe(true);
  });

  it('measures Mega Death kill rate on the shipped preset (no Zombie)', () => {
    let kos = 0, casts = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { ctx, at } = realCtx(seed);
      const md = ctx.content.ability('mega-death');
      if (!md) throw new Error('no mega-death');
      resolveAbility(ctx, at('yunalesca'), md, []);
      for (const id of ['tidus', 'yuna', 'auron']) { casts++; if (!at(id).alive) kos++; }
    }
    log('MegaDeath kill rate on shipped preset:', kos, '/', casts, '=', (kos / casts).toFixed(3));
    expect(casts).toBe(600);
  });

  it('shows who the Form III aeon-cycle Mind Blast / Osmose actually hits', () => {
    const { ctx, events, at } = realCtx(5);
    const aeon = ctx.rt.aeonRoster.get('valefor') ?? [...ctx.rt.aeonRoster.values()][0];
    if (!aeon) throw new Error('no aeon');
    aeon.removed = false;
    ctx.state.aeonId = aeon.id;
    log('aeon id', aeon.id, 'mp', aeon.mp, 'maxMp', aeon.stats.maxMp);
    const mb = ctx.content.ability('mind-blast-aeon');
    const os = ctx.content.ability('osmose');
    if (!mb || !os) throw new Error('missing');
    const before = events.length;
    resolveAbility(ctx, at('yunalesca'), mb, ctx.state.activeIds.slice());
    resolveAbility(ctx, at('yunalesca'), os, ctx.state.activeIds.slice());
    log(JSON.stringify(events.slice(before).map((e) => ({ t: e.type, ...(e as Record<string, unknown>) })), null, 1));
    log('aeon curse?', aeon.statuses['curse'] !== undefined, 'aeon mp now', aeon.mp);
    expect(true).toBe(true);
  });
});

describe('probe 2', () => {
  it('measures Hellbiter zombie land rate on the shipped preset', () => {
    let z = 0, n = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { ctx, at } = realCtx(seed);
      const hb = ctx.content.ability('hellbiter');
      if (!hb) throw new Error('no hellbiter');
      resolveAbility(ctx, at('yunalesca'), hb, []);
      for (const id of ['tidus', 'yuna', 'auron']) { n++; if (at(id).statuses['zombie']) z++; }
    }
    log('Hellbiter zombie land rate on shipped preset:', z, '/', n, '=', (z / n).toFixed(3));
    expect(n).toBe(600);
  });

  it('Deathproof survives and Zombie survives', () => {
    const { ctx, at } = realCtx(11);
    at('tidus').immunities['zombie'] = 0;
    at('tidus').statuses['zombie'] = { id: 'zombie', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    at('yuna').immunities['ko'] = 255;
    at('auron').immunities['ko'] = 0;
    const md = ctx.content.ability('mega-death');
    if (!md) throw new Error('no md');
    resolveAbility(ctx, at('yunalesca'), md, []);
    log('zombie alive', at('tidus').alive, 'deathproof alive', at('yuna').alive, 'plain alive', at('auron').alive);
    expect(at('tidus').alive).toBe(true);
  });

  it('curse chance 255 pierces Curseproof', () => {
    const { ctx, at } = realCtx(12);
    at('tidus').immunities['curse'] = 255;
    const mb = ctx.content.ability('mind-blast-aeon');
    if (!mb) throw new Error('no mb');
    resolveAbility(ctx, at('yunalesca'), mb, ['tidus']);
    log('curseproof target cursed anyway?', at('tidus').statuses['curse'] !== undefined);
    expect(true).toBe(true);
  });
});
