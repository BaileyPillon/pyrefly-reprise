/**
 * The hidden Gauntlet chapter's **T0 engine checks** (FFX only; chapter 54; the paper preflight `docs/plans/ch-gauntlet-review.md` section 3, rows 2, 5, 6 and 8), run on the real engine and the shipped data:
 *
 * - **C1** damage formulas 22 and 23 and the random-spread and finite-hit flags in the kernel, and every move row of the nine against the endgame preset (`darkAeonsBuild`: HP 9,999, DEF and MDEF 255, Auto-Protect), whose
 *   numbers the research lane worked out by arithmetic (`calc-54`, quoted in `research/re-ffx-monster-arena-creations.md` section 4).
 * - **C2** Karma through the kernel's `saveCounter` input (formula 22): the kernel is right; the engine's hit adapter feeds it nothing, and the test pins that as a **named seam**.
 * - **C3** a Flare a creature casts at itself, bounced by its own Reflect.
 * - **C4** a DEF and Armored write on a part at targeting time (`onTargeted`), seen by the same action's damage.
 * - **C5** three findings about the preset that the research note did not know: the Ribbon is no Death ward, Evasion 255 turns the two accuracy-2 Attacks into misses, and Don Tonberry's Attack is power 20.
 *
 * Nothing is mocked: real `resolveAbility`, real kernel, real data. A check that fails here is a seam for the stage that needs it; each `SEAM` test below states exactly what is missing and where, and is written to fail
 * when the seam is closed so that the stage that closes it flips it on purpose.
 */

import { describe, expect, it } from 'vitest';

import type { AbilityDef, EnemyGroupDef, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { registerScriptHooks } from '../../../src/battle/ffx/ai/hooks.ts';
import { baseDamage } from '../../../src/battle/ffx/kernel/damage.ts';
import { resolveAbility } from '../../../src/battle/ffx/index.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { COMMAND_RECORDS_GAUNTLET, GAUNTLET_ABILITIES } from '../../../src/data/ffx/enemies/gauntlet-abilities.ts';
import { gauntletBody } from '../../../src/data/ffx/enemies/gauntlet.ts';
import { GAUNTLET_ROWS as ROW, type GauntletCreatureId } from '../../../src/data/ffx/gauntlet-ids.ts';
import { liveBattle, type LiveBattle } from '../helpers/aiScript.ts';

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The harness
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** A battle of one creation against the endgame party (a test-local group; the chapter's own formations are the group stage's). */
function arena(id: GauntletCreatureId, seed = 1, party: FFXPartyBuild = darkAeonsBuild, script?: string): LiveBattle {
  const body = gauntletBody(id);
  if (script !== undefined) body.aiScriptId = script;
  const group: EnemyGroupDef = { id: 'gauntlet-t0', game: 'ffx', canEscape: false, enemies: [body], bossId: id, headline: id };
  return liveBattle('gauntlet-t0', { party, seed, group });
}
const has = (c: FFXCombatant, status: string): boolean => (c.statuses as Record<string, unknown>)[status] !== undefined;
const abilityOf = (t: LiveBattle, id: string): AbilityDef => t.ctx.content.ability(id) as AbilityDef;
const range = (xs: readonly number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];

/** Put every member of the front line back to full HP, alive, with only the armour's two statuses (Protect, Haste). */
function restore(t: LiveBattle): void {
  for (const id of t.ctx.state.activeIds) {
    const c = t.at(id);
    c.hp = c.stats.maxHp;
    c.alive = true;
    c.removed = false;
    for (const k of Object.keys(c.statuses)) if (k !== 'protect' && k !== 'haste') delete (c.statuses as Record<string, unknown>)[k];
  }
}

/** Cast `abilityId` from `userId` `n` times (the party restored in between) and return the plain and critical damage events on the party. */
function cast(t: LiveBattle, userId: string, abilityId: string, aim: readonly string[], n: number): { plain: number[]; crit: number[]; events: number } {
  const def = abilityOf(t, abilityId);
  const user = t.at(userId);
  const plain: number[] = [];
  const crit: number[] = [];
  let events = 0;
  for (let i = 0; i < n; i++) {
    restore(t);
    const from = t.events.length;
    resolveAbility(t.ctx, user, def, aim);
    for (const e of t.events.slice(from)) {
      if (e.type !== 'damage') continue;
      events++;
      (e.crit ? crit : plain).push(e.amount);
    }
  }
  return { plain, crit, events };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// C1: formulas 22 and 23, the flags, and the rows against the preset
// ---------------------------------------------------------------------------------------------------------------------------------------------

const user = { str: 255, mag: 255, cheer: 0, focus: 0, maxHp: 9999, maxMp: 999, hp: 9999, mp: 999 };
const target = (over: Partial<Parameters<typeof baseDamage>[0]['target']> = {}) => ({ id: 0, def: 255, mdf: 255, cheer: 0, focus: 0, maxHp: 9999, maxMp: 999, baseCtb: 9, runningHp: 9999, runningMp: 999, runningCtb: 0, saveCounter: 0, ...over });
const kernel = (formula: number, power: number, t = target(), draw = 0, variance = true, fallback?: number): number =>
  baseDamage({ user, target: t, cmd: null, formula, power, snapshot: 0, mode: 1, variance, ...(fallback === undefined ? {} : { fallback }) }, () => draw).value;

describe('C1 the kernel: formulas 23, 6, 5, 8 and 4 (the Needles, Demi, Hydraulic Press, Convergence)', () => {
  it('formula 23 (99999 Needles, power 51) is 51 x 9,999 = 509,949 on every variance draw and without variance (the row\'s cap bit makes it 99,999)', () => {
    for (let draw = 0; draw < 32; draw++) expect(kernel(23, 51, target(), draw), `draw ${draw}`).toBe(509_949);
    expect(kernel(23, 51, target(), 0, false)).toBe(509_949);
    expect(kernel(23, 2, target(), 0, false), 'the Sunburst shape: 2 x 9,999').toBe(19_998);
  });

  it('formula 6 (10000 Needles, power 200) is a flat 10,000; formula 5 (Demi, power 4) a quarter of the running HP; formula 8 (Hydraulic Press, power 15) 15/16 of the maximum HP', () => {
    expect([kernel(6, 200, target(), 0), kernel(6, 200, target(), 31)]).toEqual([10_000, 10_000]);
    expect([kernel(5, 4), kernel(5, 4, target({ runningHp: 5000 }))]).toEqual([2_499, 1_250]);
    expect(kernel(8, 15)).toBe(9_374);
    expect(kernel(8, 15, target({ maxHp: 1000 }))).toBe(937);
  });

  it('formula 4 (Convergence, power 63) ignores MDEF: with Th\'uban\'s MAG 212 it is far above 99,999 on a target with MDEF 255, so the row\'s cap is the whole answer', () => {
    const lo = baseDamage({ user: { ...user, mag: 212 }, target: target(), cmd: null, formula: 4, power: 63, snapshot: 0, mode: 1, variance: true }, () => 0).value;
    const hi = baseDamage({ user: { ...user, mag: 212 }, target: target({ mdf: 0 }), cmd: null, formula: 4, power: 63, snapshot: 0, mode: 1, variance: true }, () => 31).value;
    expect(lo).toBe(111_524);
    expect(hi).toBe(125_929);
    expect(baseDamage({ user: { ...user, mag: 212 }, target: target({ mdf: 0 }), cmd: null, formula: 4, power: 63, snapshot: 0, mode: 1, variance: true }, () => 31).value).toBe(hi);
  });
});

describe('C1 the flags: the rows carry no random-spread bit and no multi-hit count, so every cast deals exactly one hit to each target the aim names', () => {
  it('no row of the chapter has the random-spread bit (0x8000 of the flag word) and every hit count is 0 or 1 (a "finite hit": nothing here is Shining-like)', () => {
    for (const rec of Object.values(COMMAND_RECORDS_GAUNTLET)) expect(rec.flagsMisc & 0x8000, `0x${rec.id.toString(16)}`).toBe(0);
    for (const a of Object.values(GAUNTLET_ABILITIES)) expect(a.hits, a.id).toBeLessThanOrEqual(1);
    for (const a of Object.values(GAUNTLET_ABILITIES)) expect(a.targeting, a.id).not.toMatch(/^random/);
  });

  it('the front-line rows deal one hit to each of the three members: 3 damage events a cast (Ultima, Slime, Toxic Cloud, Hundred Thorns, Hydraulic Press, Rainbow, Condemn, the Vorpal, Demi)', () => {
    const rows: Array<[GauntletCreatureId, string]> = [
      ['ultima-buster', ROW.ultima], ['neslug', ROW.slime], ['catastrophe', ROW.toxicCloud], ['catastrophe', ROW.hundredThorns], ['greater-sphere', ROW.hydraulicPress], ['thuban', ROW.rainbow],
      ['thuban', ROW.condemn], ['jormungand', ROW.vorpal], ['catastrophe', 'demi'],
    ];
    for (const [who, row] of rows) {
      const t = arena(who);
      expect(t.ctx.state.activeIds, 'a front line of three').toHaveLength(3);
      expect(cast(t, who, row, [], 5).events, `${who} ${row}`).toBe(15);
    }
  });

  it('a single-target row deals one hit to the one member named (Tidus)', () => {
    const t = arena('ultima-buster');
    expect(cast(t, 'ultima-buster', ROW.contamination, ['tidus'], 5).events).toBe(5);
  });
});

describe('C1 every move row against the endgame preset: the engine\'s damage equals the research note\'s arithmetic (section 4; Auto-Protect halves the physical class)', () => {
  /**
   * [creature, row, aim, lowest, highest]: the note's ranges (the variance factor runs 240 to 271). Auto-Protect halves the physical class (the Ultima Buster's Attack, Megaton, Toxic Spray, Hundred Thorns,
   * Earth Eater's and the Sphere's Attack, Hydraulic Press, Condemn); the special and the magical rows are not halved (no Shell on the preset).
   */
  const TABLE: Array<[GauntletCreatureId, string, string[], number, number]> = [
    ['ultima-buster', ROW.attack, ['tidus'], 1_998, 2_256],
    ['ultima-buster', ROW.ultima, [], 2_524, 2_850],
    ['ultima-buster', ROW.contamination, ['tidus'], 2_707, 3_057],
    ['neslug', ROW.megaton, ['tidus'], 1_851, 2_090],
    ['neslug', ROW.slime, [], 1_163, 1_313],
    ['catastrophe', ROW.toxicCloud, [], 298, 336],
    ['catastrophe', ROW.toxicSpray, ['tidus'], 181, 205],
    ['catastrophe', ROW.hundredThorns, [], 728, 822],
    ['catastrophe', 'demi', [], 2_499, 2_499],
    ['earth-eater', ROW.attack, ['tidus'], 675, 762],
    ['greater-sphere', ROW.hydraulicPress, [], 4_687, 4_687],
    ['greater-sphere', ROW.attack, ['tidus'], 277, 313],
    ['thuban', ROW.rainbow, [], 781, 882],
    ['thuban', ROW.convergence, ['tidus'], 99_999, 99_999],
    ['thuban', ROW.condemn, [], 335, 378],
    ['jormungand', ROW.coldStare, ['tidus'], 146, 165],
    ['jormungand', ROW.vorpal, [], 298, 336],
    ['cactuar-king', ROW.needles10000, ['tidus'], 10_000, 10_000],
    ['cactuar-king', ROW.needles99999, ['tidus'], 99_999, 99_999],
  ];
  for (const [who, row, aim, lo, hi] of TABLE) {
    it(`${who}: ${row} deals ${lo.toLocaleString('en-US')}${hi === lo ? '' : ` to ${hi.toLocaleString('en-US')}`} a hit`, () => {
      const t = arena(who);
      const { plain, crit } = cast(t, who, row, aim, 120);
      expect(plain.length, 'a plain hit lands').toBeGreaterThan(0);
      const [min, max] = range(plain);
      expect(min, `lowest ${min}`).toBeGreaterThanOrEqual(lo);
      expect(max, `highest ${max}`).toBeLessThanOrEqual(hi);
      if (hi > lo) expect(max - min, 'the draws span most of the range').toBeGreaterThanOrEqual(Math.floor((hi - lo) * 0.85));
      expect(crit, 'the row cannot crit').toEqual([]);
    });
  }

  it('Don Tonberry\'s Attack is power 20, not the note\'s 16 (the arithmetic of calc-54 said "row not read here"): Protect-halved it is 451 to 509 on a member; Voodoo (special, power 255) 2,049 to 2,314', () => {
    const t = arena('don-tonberry');
    const attack = cast(t, 'don-tonberry', ROW.tonberryAttack, ['tidus'], 120).plain;
    expect(range(attack)[0]).toBeGreaterThanOrEqual(451);
    expect(range(attack)[1]).toBeLessThanOrEqual(509);
    expect(range(attack)[1] - range(attack)[0]).toBeGreaterThan(40);
    const voodoo = cast(t, 'don-tonberry', ROW.voodoo, ['tidus'], 120).plain;
    expect(range(voodoo)[0]).toBeGreaterThanOrEqual(2_049);
    expect(range(voodoo)[1]).toBeLessThanOrEqual(2_314);
  });

  it('the Needles are lethal to any member: 10,000 and 99,999 against 9,999 HP leave 0, and the cap bit lets the second reach 99,999', () => {
    for (const row of [ROW.needles10000, ROW.needles99999]) {
      const t = arena('cactuar-king');
      restore(t);
      resolveAbility(t.ctx, t.at('cactuar-king'), abilityOf(t, row), ['yuna']);
      expect(t.at('yuna').hp, row).toBe(0);
      expect(t.at('yuna').alive, row).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// C2: Karma
// ---------------------------------------------------------------------------------------------------------------------------------------------

describe('C2 Karma (formula 22): the kernel reads the kill count through `saveCounter`; the engine feeds it nothing yet (a named seam)', () => {
  it('the kernel: kill count x power for a target id below 0x12 (a party slot), the fallback for any other; variance does not touch it', () => {
    for (const [kills, want] of [[0, 0], [1, 100], [5, 500], [500, 50_000], [1000, 100_000]] as const) {
      expect(kernel(22, 100, target({ saveCounter: kills })), `${kills} kills`).toBe(want);
      expect(kernel(22, 100, target({ id: 7, saveCounter: kills }), 31), `${kills} kills, slot 7`).toBe(want);
    }
    expect(kernel(22, 100, target({ id: 0x12, saveCounter: 500 }))).toBe(0);
    expect(kernel(22, 100, target({ id: 0x12, saveCounter: 500 }), 0, true, 77), 'a target id of 0x12 or more gets the fallback').toBe(77);
    expect(kernel(22, 100, target({ saveCounter: 500 }), 31)).toBe(kernel(22, 100, target({ saveCounter: 500 }), 0, false));
  });

  it('SEAM C2: the engine deals Karma no damage at all today (the row carries formula "none"); to make it hit for kills x 100, three small additive edits are owed to the stage that writes Don Tonberry\'s rules', () => {
    // What is missing, and where (the kernel needs none of it):
    //  1. `FormulaKey` (src/battle/common/types.ts) has no key for formula 22: add 'kill-count', and `FORMULA_NUMBER` (src/battle/ffx/adapt/command.ts) 'kill-count': 0x16, then give the Karma row that formula.
    //     (A CONTRACT-CHANGES entry: it is a shared contract.)
    //  2. `hitInputOf` (src/battle/ffx/adapt/hit.ts, the `target: { id: 0xff, saveCounter: 0, ... }` literal) must pass the target's party slot (below 0x12) and its kill count. Both fields are read by formula 0x16 only,
    //     so the change is inert for every other row; the kill count has no home today: `FFXMemberBuild` has no field for it, so the build carries one (preflight GA5: 500 each, an estimate) and the combatant keeps it.
    //  3. This test flips: Karma then hits for kills x 100 (capped at 99,999 by the row's cap bit).
    const t = arena('don-tonberry');
    restore(t);
    const from = t.events.length;
    resolveAbility(t.ctx, t.at('don-tonberry'), abilityOf(t, ROW.karma), ['tidus']);
    expect(t.events.slice(from).filter((e) => e.type === 'damage'), 'no damage event: formula none').toEqual([]);
    expect(t.at('tidus').hp).toBe(9_999);
    expect(abilityOf(t, ROW.karma).record?.id).toBe(0x40ff);
    expect(abilityOf(t, ROW.karma).power).toBe(100);
    expect(abilityOf(t, ROW.karma).formula).toBe('none');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// C3: a Flare cast at itself, bounced by its own Reflect
// ---------------------------------------------------------------------------------------------------------------------------------------------

describe('C3 Earth Eater\'s Flare at itself (RE n 3.4): its own Reflect sends it to a random member of the party', () => {
  const reflectInstance = { id: 'reflect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };

  it('the Flare is the party\'s own row 0x3052 (reflectable bit set, formula 3, power 60); with Reflect on Earth Eater it lands on the front line and never on Earth Eater', () => {
    const flare = abilityOf(arena('earth-eater'), 'flare');
    expect(flare.record?.id).toBe(0x3052);
    expect((flare.record!.flagsMisc & 0x80) !== 0, 'reflectable').toBe(true);
    expect([flare.power, flare.formula]).toEqual([60, 'magic']);
    const landed: Record<string, number> = {};
    const amounts: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const t = arena('earth-eater', seed);
      const ee = t.at('earth-eater');
      (ee.statuses as Record<string, unknown>)['reflect'] = { ...reflectInstance };
      const hp = ee.hp;
      resolveAbility(t.ctx, ee, flare, ['earth-eater']);
      expect(ee.hp, `seed ${seed}: Earth Eater is not hurt`).toBe(hp);
      for (const e of t.events) if (e.type === 'damage') {
        landed[e.targetId] = (landed[e.targetId] ?? 0) + 1;
        amounts.push(e.amount);
      }
    }
    expect(Object.keys(landed).sort(), 'every member of the front line is hit over 60 seeds, nobody else').toEqual(['auron', 'tidus', 'yuna']);
    expect(Object.values(landed).reduce((s, n) => s + n, 0), 'one hit a cast').toBe(60);
    for (const who of ['tidus', 'yuna', 'auron']) expect(landed[who]!, who).toBeGreaterThan(8);
    expect(range(amounts)[0]).toBeGreaterThanOrEqual(2_355);
    expect(range(amounts)[1]).toBeLessThanOrEqual(2_660);
  });

  it('control: without Reflect the same cast hits Earth Eater itself', () => {
    const t = arena('earth-eater', 1);
    const ee = t.at('earth-eater');
    const hp = ee.hp;
    resolveAbility(t.ctx, ee, abilityOf(t, 'flare'), ['earth-eater']);
    expect(ee.hp).toBeLessThan(hp);
    expect(t.events.filter((e) => e.type === 'damage').map((e) => (e.type === 'damage' ? e.targetId : ''))).toEqual(['earth-eater']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// C4: the part gate
// ---------------------------------------------------------------------------------------------------------------------------------------------

describe('C4 the Ultima Buster\'s Arms: a DEF and Armored write made in `onTargeted` is seen by the damage of the same action (RE n 3.1)', () => {
  type World = 'none' | 'gate' | 'defense-only' | 'open';
  let world: World = 'none';
  // The body's script of RE n 3.1, in outline: against a physical, HP-affecting command the body writes DEF 255 and Armored while an arm lives (DEF 0, not Armored once both are dead); after every hit DEF 50, not Armored.
  registerScriptHooks('gauntlet-t0-gate', {
    onTargeted(_ctx, self, used) {
      const physicalHp = used.def.damageType === 'physical' && ((used.def.record?.damageClass ?? 1) & 1) !== 0;
      if (!physicalHp || world === 'none') return;
      if (world === 'gate') {
        self.stats.def = 255;
        if (!self.immunityFlags.includes('armored')) self.immunityFlags.push('armored');
      } else {
        self.stats.def = world === 'open' ? 0 : 255;
        self.immunityFlags = self.immunityFlags.filter((f) => f !== 'armored');
      }
    },
    onHit(_ctx, self) {
      if (world === 'none') return;
      self.stats.def = 50;
      self.immunityFlags = self.immunityFlags.filter((f) => f !== 'armored');
    },
  });

  /** Tidus's Attack on the body, `n` seeds, the plain hits. */
  function tidusAttack(w: World, n = 80): number[] {
    world = w;
    const out: number[] = [];
    for (let seed = 1; seed <= n; seed++) {
      const t = arena('ultima-buster', seed, darkAeonsBuild, 'gauntlet-t0-gate');
      const from = t.events.length;
      resolveAbility(t.ctx, t.at('tidus'), abilityOf(t, 'attack'), ['ultima-buster']);
      for (const e of t.events.slice(from)) if (e.type === 'damage' && e.targetId === 'ultima-buster' && !e.crit) out.push(e.amount);
    }
    return out;
  }

  it('with an arm alive (DEF 255 + Armored) a physical hit is a third of what DEF 255 alone gives; with the arms dead (DEF 0) and with no write at all (the record\'s DEF 60) it reaches the 99,999 cap', () => {
    const none = tidusAttack('none');
    const gate = tidusAttack('gate');
    const defOnly = tidusAttack('defense-only');
    const open = tidusAttack('open');
    expect(range(none), 'no write: the record\'s DEF 60').toEqual([99_999, 99_999]);
    expect(range(open), 'DEF 0').toEqual([99_999, 99_999]);
    expect(gate.length, 'plain hits (Tidus\'s Luck 60 makes many of them critical, which are left out)').toBeGreaterThan(15);
    // Armored divides by 3, after the defence: gate x 3 is the defence-only value, within the rounding.
    expect(Math.abs(range(gate)[1] * 3 - range(defOnly)[1])).toBeLessThanOrEqual(3);
    expect(Math.abs(range(gate)[0] * 3 - range(defOnly)[0])).toBeLessThanOrEqual(3);
    expect(range(gate)[1]).toBeLessThan(range(defOnly)[0]);
    expect(range(defOnly)[1]).toBeLessThan(99_999);
  });

  it('after the hit the body is back to DEF 50 and not Armored (the hook\'s own `onHit`), and the write was visible to that one action only', () => {
    world = 'gate';
    const t = arena('ultima-buster', 1, darkAeonsBuild, 'gauntlet-t0-gate');
    const body = t.at('ultima-buster');
    expect([body.stats.def, body.immunityFlags.includes('armored')]).toEqual([60, false]);
    resolveAbility(t.ctx, t.at('tidus'), abilityOf(t, 'attack'), ['ultima-buster']);
    expect([body.stats.def, body.immunityFlags.includes('armored')]).toEqual([50, false]);
  });

  it('a spell is not gated: Yuna\'s Thundaga on the body deals the same on every seed with the gate up and with no gate (the write is physical-only)', () => {
    const run = (w: World): number[] => {
      world = w;
      const out: number[] = [];
      for (let seed = 1; seed <= 12; seed++) {
        const t = arena('ultima-buster', seed, darkAeonsBuild, 'gauntlet-t0-gate');
        const from = t.events.length;
        resolveAbility(t.ctx, t.at('yuna'), abilityOf(t, 'thundaga'), ['ultima-buster']);
        for (const e of t.events.slice(from)) if (e.type === 'damage' && e.targetId === 'ultima-buster') out.push(e.amount);
      }
      return out;
    };
    expect(run('gate')).toEqual(run('none'));
    expect(run('gate').every((d) => d > 50_000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// C5: findings about the preset
// ---------------------------------------------------------------------------------------------------------------------------------------------

describe('C5 findings: what the endgame preset does to three of the rows (for the bench stage; nothing is changed here)', () => {
  it('FINDING F1: the Ribbon is no Death ward in this engine, so Earth Eater\'s Megaton Punch (Death 100) kills the member it lands on; Deathproof on the armour stops it', () => {
    const t = arena('earth-eater');
    const tidus = t.at('tidus');
    expect(tidus.immunities['ko'] ?? 0, 'no Death resistance on the preset').toBe(0);
    expect(tidus.immunities['zombie'], 'the Ribbon is on').toBe(255);
    restore(t);
    resolveAbility(t.ctx, t.at('earth-eater'), abilityOf(t, ROW.megatonPunch), ['tidus']);
    expect([tidus.alive, tidus.hp, has(tidus, 'ko')]).toEqual([false, 0, true]);

    const proof: FFXPartyBuild = structuredClone(darkAeonsBuild);
    for (const m of proof.members) m.equipment.armor = { ...m.equipment.armor, slots: 4, autoAbilities: ['auto-haste', 'auto-protect', 'ribbon', 'deathproof'] };
    const p = arena('earth-eater', 1, proof);
    expect(p.at('tidus').immunities['ko']).toBe(255);
    let landed = 0;
    for (let i = 0; i < 30; i++) {
      restore(p);
      const from = p.events.length;
      resolveAbility(p.ctx, p.at('earth-eater'), abilityOf(p, ROW.megatonPunch), ['tidus']);
      expect(p.at('tidus').alive, `cast ${i}`).toBe(true);
      landed += p.events.slice(from).filter((e) => e.type === 'damage').length;
    }
    expect(landed, 'the punch still hurts: a hit a cast').toBe(30);
  });

  it('FINDING F2: Evasion 255 + Luck 60 against an accuracy-2 Attack: Neslug\'s (byte 90) and Jormungand\'s (byte 150) never land on the preset (0 damage in 120 casts each)', () => {
    for (const [who, row] of [['neslug', ROW.neslugAttack], ['jormungand', ROW.jormungandAttack]] as const) {
      const t = arena(who);
      expect(t.at('tidus').stats.eva).toBe(255);
      const r = cast(t, who, row, ['tidus'], 120);
      expect(r.events, `${who}: no damage event`).toBe(0);
      expect(t.events.filter((e) => e.type === 'miss').length, `${who}: all misses`).toBe(120);
    }
    // The control: with Evasion 0 the same Attack lands (the preset's Evasion is the lever, as for Dark Ixion's blade).
    const loose: FFXPartyBuild = structuredClone(darkAeonsBuild);
    for (const m of loose.members) m.stats = { ...m.stats, eva: 0 };
    const t = arena('neslug', 1, loose);
    expect(cast(t, 'neslug', ROW.neslugAttack, ['tidus'], 120).events).toBeGreaterThan(60);
  });
});
