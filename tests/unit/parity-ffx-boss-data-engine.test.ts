/**
 * Re-parity RC10, lane FFX boss data (FFX only), the engine side: what the note listed that was already the game's (D5 steal byte, Regen 255, the Pagoda HP), the words the
 * game's status and damage steps read (resistance bytes, extra word, special word, Zanmato byte) moving with a switch and only with it, and real casts through the engine's own
 * path (`buildBattle`, then `resolveAbility`). The data side is `parity-ffx-boss-data.test.ts`; the fixture and the id map are `helpers/ffxBossData.ts`.
 *
 * All six switches ship ON (Bailey, 2026-10-17: "All six (Recommended)"). "Off" in a test is always explicit (`ALL_OFF`, or `only(id)` for one switch), and `{}` means "as shipped",
 * so each case below proves both states: the row as the tree had it before the switches were turned on, and the game's record now.
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
import { ALL_OFF, ALL_ON, MAP, ST, loadWorld, only, rec, world } from './helpers/ffxBossData.ts';

const { rows } = world;

beforeAll(loadWorld);

/** The switches as the module shipped them, read when this file is loaded (before any test or hook): all ON. */
const SHIPPED = { ...BOSS_DATA_SWITCHES };

afterEach(() => {
  for (const id of BOSS_DATA_SWITCH_IDS) BOSS_DATA_SWITCHES[id] = SHIPPED[id];
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

  it('off (all six false): Evrae is the row as it was (DEF 0, Zanmato 3, Doom immune, no Life flag); as shipped (all ON): the record', async () => {
    const off = (await combatants('evrae-airship', ALL_OFF))['evrae'] as FFXCombatant;
    expect([off.stats.def, off.stats.mdef, off.enemy?.zanmatoLevel, off.immunities.doom, off.immunityFlags.includes('immune-to-life')]).toEqual([0, 0, 3, 255, false]);
    const on = (await combatants('evrae-airship', {}))['evrae'] as FFXCombatant;
    expect([on.stats.def, on.stats.mdef, on.enemy?.zanmatoLevel, on.immunities.doom, on.immunityFlags.includes('immune-to-life')]).toEqual([1, 1, 4, undefined, true]);
    // each switch alone does its own row and no other
    expect(((await combatants('evrae-airship', only('D1')))['evrae'] as FFXCombatant).stats.def).toBe(1);
    expect(((await combatants('evrae-airship', only('D3')))['evrae'] as FFXCombatant).enemy?.zanmatoLevel).toBe(4);
    expect(((await combatants('evrae-airship', only('D8')))['evrae'] as FFXCombatant).immunities.doom).toBeUndefined();
    expect(((await combatants('evrae-airship', only('D9')))['evrae'] as FFXCombatant).immunityFlags).toContain('immune-to-life');
  });

  it('D7 in Chapter I: Flux resists Slow only with the switch (which is how it ships)', async () => {
    expect(((await combatants('seymour-flux', ALL_OFF))['seymour-flux'] as FFXCombatant).immunities.slow).toBeUndefined();
    expect(((await combatants('seymour-flux', only('D7')))['seymour-flux'] as FFXCombatant).immunities.slow).toBe(255);
    expect(((await combatants('seymour-flux', {}))['seymour-flux'] as FFXCombatant).immunities.slow).toBe(255);
  });

  it('the words the status and damage steps read (resistance bytes, extra word, special word, Zanmato byte) move with the switch and only with it', async () => {
    const SLOW = ST.indexOf('slow');
    const flux = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('seymour-flux', on))['seymour-flux'] as FFXCombatant;
    expect(resistBytesWith(await flux(ALL_OFF), 0)[SLOW]).toBe(0);
    expect(resistBytesWith(await flux(only('D7')), 0)[SLOW]).toBe(255);
    expect(resistBytesWith(await flux({}), 0)[SLOW]).toBe(255); // as shipped
    const evrae = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('evrae-airship', on))['evrae'] as FFXCombatant;
    expect(extraImmuneWord(await evrae(ALL_OFF)) & 0x4000).toBe(0x4000); // Doom
    expect(extraImmuneWord(await evrae(only('D8'))) & 0x4000).toBe(0);
    expect(extraImmuneWord(await evrae({})) & 0x4000).toBe(0); // as shipped
    expect(specialWord(await evrae(ALL_OFF)) & 0x04).toBe(0); // Life
    expect(specialWord(await evrae(only('D9'))) & 0x04).toBe(0x04);
    expect(specialWord(await evrae({})) & 0x04).toBe(0x04); // as shipped
    expect(zanmatoByte(await evrae(ALL_OFF))).toBe(2); // level 3 reads as byte 2 with the switch off
    expect(zanmatoByte(await evrae(only('D3')))).toBe(3); // the record's byte
    expect(zanmatoByte(await evrae({}))).toBe(3); // as shipped
    const pagoda = async (on: Partial<Record<BossDataSwitch, boolean>>): Promise<FFXCombatant> => (await combatants('braskas-final-aeon', on))['yu-pagoda-left'] as FFXCombatant;
    const base = await pagoda(ALL_OFF);
    const d10 = await pagoda(only('D10'));
    for (const s of ['shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost'] as const) {
      expect(resistBytesWith(base, 0)[ST.indexOf(s)], s).toBe(0);
      expect(resistBytesWith(d10, 0)[ST.indexOf(s)], s).toBe(255);
    }
    expect(resistBytesWith(base, 0)[ST.indexOf('regen')]).toBe(255); // already, through the flag
    expect(extraImmuneWord(d10) & 0x401).toBe(0x001); // Scan in, Curse out (the base has Curse and no Scan)
    expect(extraImmuneWord(base) & 0x401).toBe(0x400);
    const shipped = await pagoda({});
    for (const s of ['shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost'] as const) expect(resistBytesWith(shipped, 0)[ST.indexOf(s)], `${s} as shipped`).toBe(255);
    expect(extraImmuneWord(shipped) & 0x401).toBe(0x001);
  });

  it('D10 reaches the Yu Pagodas of Chapter III and of the hidden Last Summoning, and Yu Yevon', async () => {
    const on = await combatants('braskas-final-aeon', { ...ALL_OFF, D10: true, D9: true });
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      const c = on[id] as FFXCombatant;
      expect([c.immunities.shell, c.immunities.protect, c.immunities.reflect, c.immunities.nulblaze, c.immunities.scan, c.immunities.curse]).toEqual([255, 255, 255, 255, 255, undefined]);
      expect(c.immunityFlags).toEqual(expect.arrayContaining(['immune-to-regen', 'immune-to-scan', 'immune-to-bribe', 'immune-to-life']));
    }
    expect((on['braskas-final-aeon'] as FFXCombatant).immunities['auto-life']).toBe(255);
    const yy = await combatants('braskas-final-aeon', only('D10'), (await findEnemyGroup('yu-yevon')) as EnemyGroupDef);
    const y = yy['yu-yevon'] as FFXCombatant;
    expect([y.immunities.scan, y.immunities['auto-life'], y.immunityFlags.includes('immune-to-sensor')]).toEqual([255, 255, false]);
    const ls = await combatants('braskas-final-aeon', only('D10'), lastSummoningGroup('last-summoning:ifrit') as EnemyGroupDef);
    expect((ls['yu-pagoda-left'] as FFXCombatant).immunities.shell).toBe(255);
    const lsOff = await combatants('braskas-final-aeon', ALL_OFF, lastSummoningGroup('last-summoning:ifrit') as EnemyGroupDef);
    expect((lsOff['yu-pagoda-left'] as FFXCombatant).immunities.shell).toBeUndefined();
    const lsShipped = await combatants('braskas-final-aeon', {}, lastSummoningGroup('last-summoning:ifrit') as EnemyGroupDef);
    expect((lsShipped['yu-pagoda-left'] as FFXCombatant).immunities.shell).toBe(255);
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

  it('D7: Slow lands on Seymour Flux with the switch off (the row as it was) and never with it on, which is how it ships (200 casts)', () => {
    const slow = ALL_ABILITIES.find((a) => a.id === 'slow') as ReturnType<typeof ability>;
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', ALL_OFF, 200)).toBeGreaterThan(100);
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', only('D7'), 200)).toBe(0);
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', {}, 200)).toBe(0); // as shipped
    expect(landed('seymour-flux', 'seymour-flux', slow, 'slow', { ...ALL_ON, D7: false }, 200)).toBeGreaterThan(100); // no other switch touches it
  });

  it('D8: a Doom lands on Evrae only with the switch, which is how it ships (50 casts)', () => {
    const doom = ability({ id: 'doom-probe', formula: 'none', canMiss: false, targeting: 'single-enemy', statusEffects: [{ status: 'doom', chance: 100, duration: 30 }] });
    expect(landed('evrae-airship', 'evrae', doom, 'doom', ALL_OFF, 50)).toBe(0);
    expect(landed('evrae-airship', 'evrae', doom, 'doom', only('D8'), 50)).toBe(50);
    expect(landed('evrae-airship', 'evrae', doom, 'doom', {}, 50)).toBe(50); // as shipped
  });

  it('D10: Shell and Protect land on a Yu Pagoda with the switch off and fail with it on, which is how it ships (200 casts each)', () => {
    for (const id of ['shell', 'protect']) {
      const def = ALL_ABILITIES.find((a) => a.id === id) as ReturnType<typeof ability>;
      expect(landed('braskas-final-aeon', 'yu-pagoda-left', def, id, ALL_OFF, 200), `${id} off`).toBeGreaterThan(100);
      expect(landed('braskas-final-aeon', 'yu-pagoda-left', def, id, only('D10'), 200), `${id} D10`).toBe(0);
      expect(landed('braskas-final-aeon', 'yu-pagoda-left', def, id, {}, 200), `${id} as shipped`).toBe(0);
    }
  });
});
