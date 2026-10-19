/**
 * The hidden Mirror Aeons chapter's party (FFX only; `src/data/ffx/builds/mirror-aeons.ts`): **an estimate, every cell of it**, pinned so the day a number moves the test says which and the handoff's table is
 * re-written. What is asserted is the preset's shape and its sources' rules, not that it is the right difficulty (the bench's job, `mirror-aeons-bench.test.ts`): the seven characters at the caps, the endgame gear,
 * the nine aeons derived from Yuna's stats by the section 6.4 formula (not typed), Yojimbo's two named estimates, and that nothing was changed in the Dream's End preset it is cut from.
 */
import { describe, expect, it } from 'vitest';

import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { AEON_CAPS, aeonStatsFromYuna } from '../../../src/data/ffx/builds/endgame-aeons.ts';
import {
  ENDGAME_ARMOR, ENDGAME_BATTLES, ENDGAME_CAPS, ENDGAME_GIL, ENDGAME_LUCK, ENDGAME_PHOENIX_DOWNS, ENDGAME_WEAPONS, ENDGAME_YUNA, SISTERS_START_GAUGE, SISTERS_START_MOTIVATION, YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY,
  YOJIMBO_START_GAUGE, mirrorAeonsBuild,
} from '../../../src/data/ffx/builds/mirror-aeons.ts';

const ids = new Set(ALL_ABILITIES.map((a) => a.id));
const member = (id: string) => mirrorAeonsBuild.members.find((m) => m.id === id)!;
const aeon = (id: string) => mirrorAeonsBuild.aeons.find((a) => a.id === id)!;

describe('the seven characters', () => {
  it('Tidus, Yuna and Lulu on the field; Auron, Wakka, Kimahri and Rikku on the bench; each member once', () => {
    expect(mirrorAeonsBuild.activeSlots).toEqual(['tidus', 'yuna', 'lulu']);
    expect([...mirrorAeonsBuild.reserve].sort()).toEqual(['auron', 'kimahri', 'rikku', 'wakka']);
    expect(mirrorAeonsBuild.members.map((m) => m.id).sort()).toEqual(['auron', 'kimahri', 'lulu', 'rikku', 'tidus', 'wakka', 'yuna']);
  });

  it('every member stands at the caps (HP 9,999, MP 999, the seven other stats 255) with Luck 60, full HP and MP', () => {
    expect(ENDGAME_CAPS).toEqual({ hp: 9_999, mp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255 });
    expect(ENDGAME_LUCK).toBe(60);
    for (const m of mirrorAeonsBuild.members) {
      expect(m.stats, m.id).toEqual({ ...ENDGAME_CAPS, luck: 60, maxHp: 9_999, maxMp: 999 });
      expect([m.hp, m.mp], m.id).toEqual([9_999, 999]);
    }
  });

  it('every armour wears Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon in four slots; every weapon has Break Damage Limit; First Strike on Tidus and Yuna only', () => {
    expect(ENDGAME_ARMOR).toEqual(['auto-haste', 'auto-phoenix', 'auto-protect', 'ribbon']);
    for (const m of mirrorAeonsBuild.members) {
      expect(m.equipment.armor.slots, m.id).toBe(4);
      expect(m.equipment.armor.autoAbilities, m.id).toEqual([...ENDGAME_ARMOR]);
      expect(m.equipment.weapon.slots, m.id).toBe(4);
      expect(m.equipment.weapon.autoAbilities, m.id).toEqual([...(ENDGAME_WEAPONS[m.id] ?? [])]);
      expect(m.equipment.weapon.autoAbilities, m.id).toContain('break-damage-limit');
      expect(m.equipment.weapon.autoAbilities.includes('first-strike'), m.id).toBe(m.id === 'tidus' || m.id === 'yuna');
    }
  });

  it('the guides\' skills are learned (Quick Hit, Auto-Life, Lulu\'s Flare and Ultima) and every learned ability exists', () => {
    expect(member('tidus').learnedAbilityIds).toContain('quick-hit');
    expect(member('yuna').learnedAbilityIds).toContain('auto-life');
    expect(member('lulu').learnedAbilityIds).toEqual(expect.arrayContaining(['flare', 'ultima', 'doublecast']));
    for (const m of mirrorAeonsBuild.members) for (const id of m.learnedAbilityIds) expect(ids.has(id), `${m.id} ${id}`).toBe(true);
  });

  it('is cut from Dream\'s End without touching it: its members keep their old weapons\' names and the preset\'s edits do not reach it', () => {
    expect(dreamsEndBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
    const old = dreamsEndBuild.members.find((m) => m.id === 'tidus')!;
    expect(old.stats.hp).toBe(5_410);
    expect(old.equipment.weapon.autoAbilities).not.toContain('break-damage-limit');
    expect(member('tidus').equipment.weapon.name).toBe(old.equipment.weapon.name);
    expect(dreamsEndBuild.inventory.some((e) => e.itemId === 'candle-of-life')).toBe(true);
    expect(mirrorAeonsBuild.inventory.some((e) => e.itemId === 'candle-of-life')).toBe(false); // Yu Yevon's Doom-kill route is not for these fights
  });
});

describe('the nine aeons (the section 6.4 formula on this Yuna at 600 battles)', () => {
  it('the five story aeons, Yojimbo and the three Sisters; Anima is left out', () => {
    expect(mirrorAeonsBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'cindy', 'sandy', 'mindy']);
  });

  it('each row is the formula\'s output on ENDGAME_YUNA, capped, HP and MP full', () => {
    expect(ENDGAME_BATTLES).toBe(600);
    for (const a of mirrorAeonsBuild.aeons) {
      const s = aeonStatsFromYuna(a.id, ENDGAME_YUNA, ENDGAME_BATTLES);
      expect(a.stats, a.id).toEqual({ ...s, maxHp: s.hp, maxMp: s.mp });
      expect([a.hp, a.mp], a.id).toEqual([s.hp, s.mp]);
      for (const stat of ['str', 'def', 'mag', 'mdef', 'agi', 'eva', 'acc'] as const) expect(a.stats[stat], `${a.id} ${stat}`).toBeLessThanOrEqual(AEON_CAPS[stat]);
    }
  });

  it('the Sisters are the sturdiest (Cindy 43,827 HP, Sandy 35,862, Mindy 24,913 on this Yuna) and Yojimbo the lightest of the four new', () => {
    expect([aeon('cindy').hp, aeon('sandy').hp, aeon('mindy').hp, aeon('yojimbo').hp]).toEqual([43_827, 35_862, 24_913, 19_646]);
    expect(aeon('sandy').stats.str).toBe(255); // 255 x 550 // 100 and a seventh of the power base: past the cap before clamping
  });

  it('Yojimbo has his four attack rows and Zanmato; each Sister her special, Nul-All and the shared Delta Attack; the story aeons their specials; all with Shield and Boost', () => {
    expect(aeon('yojimbo').abilityIds).toEqual(['daigoro', 'kozuka', 'wakizashi-single', 'wakizashi-multi', 'shield', 'boost']);
    expect(aeon('yojimbo').overdriveIds).toEqual(['zanmato']);
    expect(aeon('cindy').abilityIds).toEqual(['camisade', 'nul-all-aeon', 'shield', 'boost']);
    expect(aeon('sandy').abilityIds).toEqual(['razzia', 'nul-all-aeon', 'shield', 'boost']);
    expect(aeon('mindy').abilityIds).toEqual(['passado', 'nul-all-aeon', 'shield', 'boost']);
    for (const s of ['cindy', 'sandy', 'mindy']) expect(aeon(s).overdriveIds).toEqual(['delta-attack']);
    for (const a of mirrorAeonsBuild.aeons) {
      for (const id of [...a.abilityIds, ...a.overdriveIds]) expect(ids.has(id), `${a.id} ${id}`).toBe(true);
      expect(a.spriteKey).toBe(a.id === 'yojimbo' ? 'yojimbo-cavern' : a.id); // r50.1: Yuna's Yojimbo draws the approved painting (D-054), never the navy `yojimbo`
    }
  });

  it('the five story aeons keep Dream\'s End\'s gauges; Yojimbo starts empty and the three Sisters FULL (their menu has nothing to do but Combine powers and leave, and Combine needs all three full)', () => {
    for (const id of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']) expect(aeon(id).overdriveGauge, id).toBe(dreamsEndBuild.aeons.find((a) => a.id === id)!.overdriveGauge);
    expect([YOJIMBO_START_GAUGE, SISTERS_START_GAUGE]).toEqual([0, 100]);
    expect(aeon('yojimbo').overdriveGauge).toBe(YOJIMBO_START_GAUGE);
    for (const id of ['cindy', 'sandy', 'mindy']) expect(aeon(id).overdriveGauge, id).toBe(SISTERS_START_GAUGE);
  });
});

describe('the named estimates the engine reads (lane FFX-K: a build that lists them must say how they start)', () => {
  it('Yojimbo\'s hire answer is the third option\'s (2, Jegged and the files agree), his starting compatibility 128 (the game\'s own starting values, read at boot, 2026-10-17: the files hold 0 because the game writes them at boot), the gil what Pay is drawn from', () => {
    expect([YOJIMBO_HIRE_ANSWER, YOJIMBO_START_COMPATIBILITY, ENDGAME_GIL]).toEqual([2, 128, 1_500_000]);
    expect(mirrorAeonsBuild.gil).toBe(ENDGAME_GIL);
    expect(mirrorAeonsBuild.yojimbo).toEqual({ compatibility: 128, hireAnswer: 2 });
  });

  it('each Sister\'s start motivation is OUR estimate (the note marks it unsourced): the middle of 0 to 100, the same for all three', () => {
    expect(SISTERS_START_MOTIVATION).toBe(50);
    expect(mirrorAeonsBuild.sisters).toEqual({ motivation: { cindy: 50, sandy: 50, mindy: 50 } });
  });
});

describe('the levers the bench turns (docs/plans/ch-mirror-aeons-bench.md): the bag\'s Phoenix Downs, and the values left where the first build had them', () => {
  const count = (id: string): number | undefined => mirrorAeonsBuild.inventory.find((e) => e.itemId === id)?.count;

  it('the bag holds ENDGAME_PHOENIX_DOWNS Phoenix Downs (the clock of Act I: 17 is the value at which the chapter is won about seven times in ten); every other item keeps the endgame bag\'s count', () => {
    expect(ENDGAME_PHOENIX_DOWNS).toBe(17);
    expect(count('phoenix-down')).toBe(ENDGAME_PHOENIX_DOWNS);
    const old = new Map(dreamsEndBuild.inventory.map((e) => [e.itemId, e.count]));
    for (const e of mirrorAeonsBuild.inventory) if (e.itemId !== 'phoenix-down') expect(e.count, e.itemId).toBe(old.get(e.itemId));
    expect(count('candle-of-life')).toBeUndefined();
  });

  it('Luck stays at 60 for the whole party: the bench measured it (60, 40, 20, 0) and the pair is nearly blind to it, so it is no lever', () => {
    expect(ENDGAME_LUCK).toBe(60);
    for (const m of mirrorAeonsBuild.members) expect(m.stats.luck, m.id).toBe(60);
  });
});
