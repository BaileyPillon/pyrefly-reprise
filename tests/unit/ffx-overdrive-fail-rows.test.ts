/**
 * r34fix-odfail (FFX only): a failed Swordplay or Bushido resolves the sourced
 * (Fail) row, and a clean Bushido against a rider-immune target the (Immune)
 * row [research/ffx-combat-core.md §5.3 and §5.5, both tables
 * `[verified: 2 sources]`].
 *
 * Before this fix `extra.failPower` / `failHits` / `failRank` / `immunePower` /
 * `immuneHits` were read by nothing: `shapeOverdrive` only followed a
 * `failAbilityId` that no shipped record sets, so a timer-expired Spiral Cut
 * hit exactly as hard as a clean one (seed 1: 470 both ways).
 *
 * Every damage assertion drives the real engine: the Overdrive command with the
 * minigame outcome attached, the same path a player's input takes.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, MinigameResult } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { rowFromExtra } from '../../src/battle/ffx/overdriveShape.ts';
import { ABILITIES as AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { attackAbility, enemy, member, party, setup } from './ffx-fixtures.test.ts';

type Who = 'tidus' | 'auron';
type Outcome = { amounts: number[]; misses: number; tick: number };

/** One Overdrive on a fixed seeded board (two 99 999 HP dummies), reporting what the engine did. */
function fire(def: AbilityDef, who: Who, result: MinigameResult): Outcome {
  const reg = new FFXContentRegistry();
  reg.addAbilities([attackAbility(), def]);
  const engine = createFFXEngine({ content: reg });
  engine.setSeed(1);
  const od = { gauge: 100, mode: 'stoic' as const, unlockedModes: ['stoic' as const], unlockedOverdriveIds: [def.id] };
  engine.init(
    setup({
      party: party({
        members: [
          member({ id: 'tidus', ...(who === 'tidus' ? { overdrive: od } : {}) }),
          member({ id: 'auron', ...(who === 'auron' ? { overdrive: od } : {}) }),
          member({ id: 'yuna' }),
        ],
        activeSlots: ['tidus', 'auron', 'yuna'],
      }),
      enemies: {
        id: 'g',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', hp: 99_999 }), enemy({ id: 'dummy2', slot: 1, hp: 99_999 })],
      },
    }),
  );
  let reached = false;
  for (let i = 0; i < 200 && !reached; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input') break;
    if (d.actorId === who) reached = true;
    else engine.submit({ kind: 'attack', targets: ['dummy'] });
  }
  if (!reached) throw new Error(`${who} never got a turn`);
  const cmd: Command = { kind: 'overdrive', id: def.id, targets: ['dummy'], extra: result };
  const events: BattleEvent[] = [];
  for (let i = 0; i < 5 && !events.some((e) => e.type === 'action-end'); i++) events.push(...engine.submit(cmd));
  const amounts = events.flatMap((e) => (e.type === 'damage' && e.sourceId === who ? [e.amount] : []));
  const misses = events.filter((e) => e.type === 'miss').length;
  const tick = engine.predictTurnOrder(30).find((p) => p.actorId === who)?.tickValue;
  if (tick === undefined) throw new Error('actor missing from the forecast');
  return { amounts, misses, tick };
}

const swordplay = (success: boolean): MinigameResult => ({
  kind: 'tidus-timing',
  timing: { success, timeRemainingMs: 0, timerMs: 3000 },
});
const bushido = (success: boolean, targetImmuneToRider?: boolean): MinigameResult => ({
  kind: 'auron-sequence',
  sequence: { success, correctInputs: success ? 7 : 2, timeRemainingMs: 0, ...(targetImmuneToRider ? { targetImmuneToRider } : {}) },
});

const num = (def: AbilityDef, key: string): number => def.extra?.[key] as number;
/** Hits per target on the fixture board: all-enemies reaches both dummies. */
const perTarget = (def: AbilityDef): number => (def.targeting === 'all-enemies' ? 2 : 1);
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** Damage scales with DmgCon; floors in the chain leave a point or two of slack per hit. */
function expectScaled(actual: Outcome, base: Outcome, ratio: number): void {
  const expected = sum(base.amounts) * ratio;
  expect(Math.abs(sum(actual.amounts) - expected)).toBeLessThanOrEqual(2 * actual.amounts.length + 2);
}

describe('Swordplay (Tidus): timer expiry resolves the Fail row [§5.3]', () => {
  for (const def of Object.values(TIDUS)) {
    it(`${def.name}: fail = ${num(def, 'failPower')} DmgCon x ${num(def, 'failHits')}, success = ${def.power} x ${def.hits}`, () => {
      const ok = fire(def, 'tidus', swordplay(true));
      const bad = fire(def, 'tidus', swordplay(false));
      expect(ok.amounts).toHaveLength(def.hits * perTarget(def));
      expect(bad.amounts).toHaveLength(num(def, 'failHits') * perTarget(def));
      expect(ok.misses + bad.misses).toBe(0); // hard rule 5: an Overdrive never misses
      const perHitRatio = num(def, 'failPower') / def.power;
      expectScaled(bad, { ...ok, amounts: ok.amounts.slice(0, bad.amounts.length) }, perHitRatio);
    });
  }

  it('Blitz Ace fail is rank 6 against 7 on success: Tidus comes back sooner', () => {
    const def = TIDUS['blitz-ace']!;
    expect(fire(def, 'tidus', swordplay(false)).tick).toBeLessThan(fire(def, 'tidus', swordplay(true)).tick);
  });
});

describe('Bushido (Auron): Fail and Immune rows [§5.5]', () => {
  for (const def of Object.values(AURON)) {
    it(`${def.name}: fail = ${num(def, 'failPower')} DmgCon x ${num(def, 'failHits')}, success = ${def.power} x ${def.hits}`, () => {
      const ok = fire(def, 'auron', bushido(true));
      const bad = fire(def, 'auron', bushido(false));
      expect(ok.amounts).toHaveLength(def.hits * perTarget(def));
      expect(bad.amounts).toHaveLength(num(def, 'failHits') * perTarget(def));
      expect(ok.misses + bad.misses).toBe(0);
      expectScaled(bad, { ...ok, amounts: ok.amounts.slice(0, bad.amounts.length) }, num(def, 'failPower') / def.power);
    });
  }

  for (const def of Object.values(AURON).filter((d) => d.extra?.['immunePower'] !== undefined)) {
    it(`${def.name}: a clean sequence on a rider-immune target deals the Immune row (${num(def, 'immunePower')} DmgCon)`, () => {
      const ok = fire(def, 'auron', bushido(true));
      const immune = fire(def, 'auron', bushido(true, true));
      expect(immune.amounts).toHaveLength(num(def, 'immuneHits') * perTarget(def));
      expectScaled(immune, ok, num(def, 'immunePower') / def.power);
      expect(sum(immune.amounts)).toBeGreaterThan(sum(ok.amounts));
    });
  }

  it('Tornado has no Immune row, so the immune flag leaves its 20 x 2 success alone; its fail is rank 6', () => {
    const def = AURON['tornado']!;
    expect(fire(def, 'auron', bushido(true, true)).amounts).toEqual(fire(def, 'auron', bushido(true)).amounts);
    expect(fire(def, 'auron', bushido(false)).tick).toBeLessThan(fire(def, 'auron', bushido(true)).tick);
  });

  it('PR-0267 holds: a failed Bushido earns no timing bonus whatever the clock showed', () => {
    const def = AURON['dragon-fang']!;
    const late: MinigameResult = { kind: 'auron-sequence', sequence: { success: false, correctInputs: 0, timeRemainingMs: 3900 } };
    expect(fire(def, 'auron', late).amounts).toEqual(fire(def, 'auron', bushido(false)).amounts);
  });
});

describe('a successful Overdrive is unchanged by the fail wiring', () => {
  const strip = (def: AbilityDef): AbilityDef => {
    const extra = { ...def.extra };
    for (const k of ['failPower', 'failHits', 'failRank', 'immunePower', 'immuneHits']) delete extra[k];
    return { ...def, extra };
  };
  for (const [def, who, result] of [
    [TIDUS['blitz-ace']!, 'tidus', swordplay(true)],
    [TIDUS['slice-and-dice']!, 'tidus', swordplay(true)],
    [AURON['banishing-blade']!, 'auron', bushido(true)],
    [AURON['tornado']!, 'auron', bushido(true)],
  ] as const) {
    it(`${def.name} success deals exactly what the record without Fail/Immune rows deals`, () => {
      expect(fire(def, who, result)).toEqual(fire(strip(def), who, result));
    });
  }
});

describe('rowFromExtra', () => {
  it('keeps canMiss false and every other field, and drops Blitz Ace\'s success-only finisher on the fail row', () => {
    const ace = TIDUS['blitz-ace']!;
    const fail = rowFromExtra(ace, 'fail')!;
    expect(fail).toMatchObject({ id: 'blitz-ace', power: 4, hits: 8, rank: 6, canMiss: false, targeting: 'single-enemy' });
    expect(fail.extra?.['finisherPower']).toBeUndefined();
    expect(ace.extra?.['finisherPower']).toBe(24); // the record itself is not mutated
    expect(rowFromExtra(AURON['shooting-star']!, 'immune')).toMatchObject({ power: 27, hits: 1, rank: 5, canMiss: false });
  });

  it('returns undefined when the record carries no such row', () => {
    expect(rowFromExtra(AURON['tornado']!, 'immune')).toBeUndefined();
    expect(rowFromExtra(attackAbility(), 'fail')).toBeUndefined();
  });
});
