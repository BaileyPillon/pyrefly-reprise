/**
 * Re-parity RC10, lane FFX boss data (FFX only), the engine side: what the note listed that was already the game's (D5 steal byte, Regen 255, the Pagoda HP), the words the
 * game's status and damage steps read (resistance bytes, extra word, special word, Zanmato byte) moving with a switch and only with it, and real casts through the engine's own
 * path (`buildBattle`, then `resolveAbility`). The data side is `parity-ffx-boss-data.test.ts`; the fixture and the id map are `helpers/ffxBossData.ts`.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EnemyDef, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXEngine, getFFXRegistry, resolveAbility } from '../../src/battle/ffx/index.ts';
import { BOSS_DATA_SWITCH_IDS, BOSS_DATA_SWITCHES, setBossDataSwitches, type BossDataSwitch } from '../../src/battle/ffx/boss-data-corrections.ts';
import { extraImmuneWord, resistBytesWith } from '../../src/battle/ffx/adapt/status.ts';
import { specialWord } from '../../src/battle/ffx/adapt/words.ts';
import { zanmatoByte } from '../../src/battle/ffx/adapt/yojimbo.ts';
import { stealByteOf, stealChanceAfter } from '../../src/battle/ffx/adapt/steal.ts';
import { makeFfxRng } from '../../src/battle/ffx/adapt/streams.ts';
import { buildBattle } from '../../src/battle/ffx/setup.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { lastSummoningGroup } from '../../src/data/ffx/enemies/last-summoning-chain.ts';
import { ability } from './ffx-fixtures.test.ts';
import { MAP, ST, loadWorld, rec, world } from './helpers/ffxBossData.ts';

const { rows } = world;

beforeAll(loadWorld);

afterEach(() => {
  for (const id of BOSS_DATA_SWITCH_IDS) BOSS_DATA_SWITCHES[id] = false;
});

describe('what the note listed that was already the game\'s', () => {
  it('D5: every stealable boss has the record\'s steal byte (255) and quantities, and the byte halves as the game halves it', () => {
    let n = 0;
    for (const [id, mid] of Object.entries(MAP)) {
      const e = rows.get(id) as EnemyDef;
      const m = rec(mid);
      const steal = e.rewards.steal;
      if (!steal) {
        expect(m.steal[0], `${id} has no steal table, so the record has no steal byte`).toBe(0);
        continue;
      }
      n += 1;
      expect(stealByteOf(steal), id).toBe(m.steal[0]);
      expect(steal.common.count, id).toBe(m.steal[1]);
      expect(steal.rare.count, id).toBe(m.steal[2]);
    }
    expect(n).toBeGreaterThanOrEqual(20);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => stealChanceAfter(255, k))).toEqual([255, 127, 63, 31, 15, 7, 3, 1, 1, 1]);
  });

  it('Regen 255 on Braska\'s Final Aeon and the Yu Pagodas is already in the engine\'s resistance bytes (the immune-to-regen flag)', async () => {
    const chapter = getChapter('braskas-final-aeon') as Chapter;
    const e = new FFXEngine({ autoResolveMinigames: true });
    const setup = setupForChapter(chapter, 1);
    e.setSeed(setup.seed);
    e.init(setup);
    const st = e.state();
    for (const id of ['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right']) {
      const c = st.combatants[id] as FFXCombatant;
      expect(resistBytesWith(c, 0)[22], id).toBe(255);
      expect(rec(MAP[id] as number).status[ST.indexOf('regen')], id).toBe(255);
    }
  });

  it('the Yu Pagoda\'s 65,535 HP is replaced by 5,000 in the game\'s init script (research/re-ffx-ai-yunalesca-bfa.md section 4.1), so our 5,000 stands', () => {
    expect(rec(173).hp).toBe(65535);
    expect((rows.get('yu-pagoda-left') as EnemyDef).hp).toBe(5000);
  });
});

describe('through the engine', () => {
  async function combatants(chapterId: string, on: Partial<Record<BossDataSwitch, boolean>>, group?: EnemyGroupDef): Promise<Record<string, FFXCombatant>> {
    const restore = setBossDataSwitches(on);
    try {
      const setup = setupForChapter(getChapter(chapterId) as Chapter, 1);
      const e = new FFXEngine({ autoResolveMinigames: true });
      e.setSeed(setup.seed);
      e.init(group ? { ...setup, enemies: group } : setup);
      return e.state().combatants as Record<string, FFXCombatant>;
    } finally {
      restore();
    }
  }

  it('off: Evrae is the row (DEF 0, Zanmato 3, Doom immune, no Life flag); on: the record', async () => {
    const off = (await combatants('evrae-airship', {}))['evrae'] as FFXCombatant;
    expect([off.stats.def, off.stats.mdef, off.enemy?.zanmatoLevel, off.immunities.doom, off.immunityFlags.includes('immune-to-life')]).toEqual([0, 0, 3, 255, false]);
    const on = (await combatants('evrae-airship', { D1: true, D3: true, D8: true, D9: true }))['evrae'] as FFXCombatant;
    expect([on.stats.def, on.stats.mdef, on.enemy?.zanmatoLevel, on.immunities.doom, on.immunityFlags.includes('immune-to-life')]).toEqual([1, 1, 4, undefined, true]);
  });

  it('D7 in Chapter I: Flux resists Slow only with the switch', async () => {
    expect(((await combatants('seymour-flux', {}))['seymour-flux'] as FFXCombatant).immunities.slow).toBeUndefined();
    expect(((await combatants('seymour-flux', { D7: true }))['seymour-flux'] as FFXCombatant).immunities.slow).toBe(255);
  });

  it('the words the status and damage steps read (resistance bytes, extra word, special word, Zanmato byte) move with the switch and only with it', async () => {
    const SLOW = ST.indexOf('slow');
    const flux = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('seymour-flux', on))['seymour-flux'] as FFXCombatant;
    expect(resistBytesWith(await flux({}), 0)[SLOW]).toBe(0);
    expect(resistBytesWith(await flux({ D7: true }), 0)[SLOW]).toBe(255);
    const evrae = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('evrae-airship', on))['evrae'] as FFXCombatant;
    expect(extraImmuneWord(await evrae({})) & 0x4000).toBe(0x4000); // Doom
    expect(extraImmuneWord(await evrae({ D8: true })) & 0x4000).toBe(0);
    expect(specialWord(await evrae({})) & 0x04).toBe(0); // Life
    expect(specialWord(await evrae({ D9: true })) & 0x04).toBe(0x04);
    expect(zanmatoByte(await evrae({}))).toBe(2); // level 3 reads as byte 2 today
    expect(zanmatoByte(await evrae({ D3: true }))).toBe(3); // the record's byte
    const pagoda = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('braskas-final-aeon', on))['yu-pagoda-left'] as FFXCombatant;
    const base = await pagoda({});
    const d10 = await pagoda({ D10: true });
    for (const s of ['shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost'] as const) {
      expect(resistBytesWith(base, 0)[ST.indexOf(s)], s).toBe(0);
      expect(resistBytesWith(d10, 0)[ST.indexOf(s)], s).toBe(255);
    }
    expect(resistBytesWith(base, 0)[ST.indexOf('regen')]).toBe(255); // already, through the flag
    expect(extraImmuneWord(d10) & 0x401).toBe(0x001); // Scan in, Curse out (the base has Curse and no Scan)
    expect(extraImmuneWord(base) & 0x401).toBe(0x400);
  });

  it('D10 reaches the Yu Pagodas of Chapter III and of the hidden Last Summoning, and Yu Yevon', async () => {
    const on = await combatants('braskas-final-aeon', { D10: true, D9: true });
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      const c = on[id] as FFXCombatant;
      expect([c.immunities.shell, c.immunities.protect, c.immunities.reflect, c.immunities.nulblaze, c.immunities.scan, c.immunities.curse]).toEqual([255, 255, 255, 255, 255, undefined]);
      expect(c.immunityFlags).toEqual(expect.arrayContaining(['immune-to-regen', 'immune-to-scan', 'immune-to-bribe', 'immune-to-life']));
    }
    expect((on['braskas-final-aeon'] as FFXCombatant).immunities['auto-life']).toBe(255);
    const yy = await combatants('braskas-final-aeon', { D10: true }, (await findEnemyGroup('yu-yevon')) as EnemyGroupDef);
    const y = yy['yu-yevon'] as FFXCombatant;
    expect([y.immunities.scan, y.immunities['auto-life'], y.immunityFlags.includes('immune-to-sensor')]).toEqual([255, 255, false]);
    const ls = await combatants('braskas-final-aeon', { D10: true }, lastSummoningGroup('last-summoning:ifrit') as EnemyGroupDef);
    expect((ls['yu-pagoda-left'] as FFXCombatant).immunities.shell).toBe(255);
  });
});

describe('a real cast at the row (the status step through the engine\'s own path)', () => {
  /** How many of `casts` casts of `def` by the party at `target` leave `status` on it. */
  function landed(chapterId: string, target: string, def: ReturnType<typeof ability>, status: string, on: Partial<Record<BossDataSwitch, boolean>>, casts: number): number {
    const restore = setBossDataSwitches(on);
    try {
      let n = 0;
      for (let seed = 1; seed <= casts; seed += 1) {
        const rng = makeFfxRng(seed);
        const ctx = buildBattle(setupForChapter(getChapter(chapterId) as Chapter, seed), rng, getFFXRegistry().clone(), () => undefined);
        const user = Object.values(ctx.state.combatants).find((c) => c.side === 'party') as FFXCombatant;
        resolveAbility(ctx, user, def, [target]);
        if ((ctx.state.combatants[target] as FFXCombatant).statuses[status as 'slow'] !== undefined) n += 1;
      }
      return n;
    } finally {
      restore();
    }
  }

  it('D7: Slow lands on Seymour Flux today and never with the switch (200 casts)', () => {
    const slow = ALL_ABILITIES.find((a) => a.id === 'slow') as ReturnType<typeof ability>;
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', {}, 200)).toBeGreaterThan(100);
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', { D7: true }, 200)).toBe(0);
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', { D1: true, D3: true, D8: true, D9: true, D10: true }, 200)).toBeGreaterThan(100); // no other switch touches it
  });

  it('D8: a Doom lands on Evrae only with the switch (50 casts)', () => {
    const doom = ability({ id: 'doom-probe', formula: 'none', canMiss: false, targeting: 'single-enemy', statusEffects: [{ status: 'doom', chance: 100, duration: 30 }] });
    expect(landed('evrae-airship', 'evrae', doom, 'doom', {}, 50)).toBe(0);
    expect(landed('evrae-airship', 'evrae', doom, 'doom', { D8: true }, 50)).toBe(50);
  });
});
