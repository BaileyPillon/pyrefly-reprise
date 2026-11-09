/**
 * The shipped line of Belgemine's Challenge (`src/engine/tactics/belgemine.ts`; FFX only): what it picks on the real engine, rule by rule, and that it is the tactic the registry hands the chapter. The measured worth of each
 * rule is the bench's (`belgemine-bench.test.ts`); this file pins the rules themselves.
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { BELGEMINE_CHAPTER_BOSS_IDS, BELGEMINE_INTENDED_LINE, belgemineLine, belgemineTactic } from '../../../src/engine/tactics/belgemine.ts';
import { actor, ctxOf, newEngine, nextInput } from '../helpers/belgemineDrive.ts';

const idOf = (c: Command | null): string => (c === null ? 'none' : 'id' in c ? `${c.kind}:${c.id}` : c.kind);

describe('the line', () => {
  it('is registered for every one of the ten foes under the chapter, and for no one else; the registry hands it to a duel on the field', () => {
    const mine = TACTICS.filter((t) => t.chapterId === 'belgemine');
    expect(mine.map((t) => t.bossId).sort()).toEqual([...BELGEMINE_CHAPTER_BOSS_IDS].sort());
    for (const t of mine) expect(t.tactic).toBe(belgemineLine);
    for (const key of ['valefor', 'ixion', 'sisters'] as const) expect(tacticFor(newEngine(key, 1)), key).toBe(belgemineLine);
  });

  it('keeps the options the bench measured: Cindy first, a Grand Summon, a Shield before the big move, no Dismiss', () => {
    expect(BELGEMINE_INTENDED_LINE).toMatchObject({ sistersTarget: 'cindy', grandSummon: true, shieldWhenDue: true, waitOutGuard: true, preferCharged: true, dismissUnder: 0, noGrandSummonVs: ['belg-anima'], holdOverdriveVs: [] });
  });

  it('Yuna opens with a Grand Summon of the first aeon in the duel\'s order (Shiva against Ifrit, Anima against the rest), while her gauge is full', () => {
    for (const [key, first] of [['valefor', 'anima'], ['ifrit', 'shiva'], ['sisters', 'anima']] as const) {
      const engine = newEngine(key, 1);
      const d = nextInput(engine);
      const pick = intendedStrategy(d.actorId, d.commands, engine) as Command;
      expect(pick, key).toMatchObject({ kind: 'overdrive', id: 'grand-summon' });
      expect((pick as { extra?: { grandSummon?: { aeonId?: string } } }).extra?.grandSummon?.aeonId, key).toBe(first);
    }
  });

  it('against Anima the first call is a plain Summon, not a Grand Summon (her gauge is fed by every hit, and the bench measured the Grand Summon there as the worse opening)', () => {
    const engine = newEngine('anima', 1);
    const d = nextInput(engine);
    expect(d.commands.some((c) => c.enabled && c.command.kind === 'overdrive')).toBe(true); // the Grand Summon is on offer
    expect(idOf(intendedStrategy(d.actorId, d.commands, engine) as Command)).toBe('summon:bahamut');
  });

  it('without the Grand Summon she calls the same aeon with a plain Summon', () => {
    const engine = newEngine('ifrit', 1);
    const d = nextInput(engine);
    const noGrand = belgemineTactic({ ...BELGEMINE_INTENDED_LINE, grandSummon: false });
    expect(idOf(noGrand(d.actorId, [...d.commands], engine))).toBe('summon:shiva');
  });

  it('the aeon on the field Shields when the foe\'s gauge is within a hit of full and the foe acts before it does; otherwise it spends a full Overdrive and then Attacks', () => {
    const engine = newEngine('valefor', 1);
    const noGrand = belgemineTactic({ ...BELGEMINE_INTENDED_LINE, grandSummon: false });
    let d = nextInput(engine);
    engine.submit(noGrand(d.actorId, [...d.commands], engine)!); // Yuna calls the first aeon
    d = nextInput(engine);
    expect(d.actorId).not.toBe('yuna');
    const foe = actor(engine, 'belg-valefor');
    rtOf(ctxOf(engine), 'belg-valefor').ctb = 1; // the foe acts before the aeon does again
    rtOf(ctxOf(engine), d.actorId).ctb = 250;
    foe.overdrive!.gauge = 99; // one hit from full
    expect(idOf(noGrand(d.actorId, [...d.commands], engine))).toBe('ability:shield');
    foe.overdrive!.gauge = 0;
    expect(idOf(noGrand(d.actorId, [...d.commands], engine))).toBe('attack');
  });

  it('against the Sisters the blow goes to Cindy; with the option off, to the weakest', () => {
    const engine = newEngine('sisters', 1);
    const calls = belgemineTactic({ ...BELGEMINE_INTENDED_LINE, grandSummon: false });
    let d = nextInput(engine);
    engine.submit(calls(d.actorId, [...d.commands], engine)!);
    d = nextInput(engine);
    const cindy = calls(d.actorId, [...d.commands], engine);
    expect(cindy?.targets).toEqual(['belg-cindy']);
    const weak = belgemineTactic({ ...BELGEMINE_INTENDED_LINE, grandSummon: false, sistersTarget: 'weakest' });
    expect(weak(d.actorId, [...d.commands], engine)?.targets).toEqual(['belg-mindy']);
  });

  it('returns null (the generic ladder) when no foe of hers is standing', () => {
    const engine = newEngine('valefor', 1);
    const d = nextInput(engine);
    actor(engine, 'belg-valefor').alive = false;
    expect(belgemineLine(d.actorId, [...d.commands], engine)).toBeNull();
  });
});
