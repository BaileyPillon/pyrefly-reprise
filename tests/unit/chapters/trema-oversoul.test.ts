/**
 * Chapter XIII option 1 (TR7 b): **Oversoul Paragon**, built and OFF. The stat block, the rows and
 * the AI of `research/ffx2-trema.md` §12.2 (SinirothX's single-source script), each gap a named
 * estimate. Run against the shipped records and the real engine [hard rule 3]. **FFX-2 only.**
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AbilityDef, Command } from '../../../src/battle/common/types.ts';
import { hitPercent } from '../../../src/battle/ffx2/hit.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import { abilityPerformedBy } from '../../../src/battle/ffx2/execute.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { OVERSOUL_ESTIMATES, oversoulAttackClass, paragonOversoulScript } from '../../../src/battle/ffx2/ai/paragon-oversoul.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { paragon } from '../../../src/data/ffx2/enemies/paragon.ts';
import { paragonOversoul } from '../../../src/data/ffx2/enemies/paragon-oversoul.ts';
import { CLOISTER_PARAGON_OVERSOUL, cloisterParagonOversoulGroup } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { CLOISTER_TREMA } from '../../../src/data/ffx2/enemies/trema.ts';
import { tremaBuildFor } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { driveChapter, driveParagon, LINES } from '../helpers/tremaDrive.ts';
import { board } from '../helpers/tremaUnits.ts';

const idOf = (c: Command | null): string | null => (c && 'id' in c ? (c as { id: string }).id : null);
const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const fresh = (seed = 1) => board('paragon', seed, CLOISTER_PARAGON_OVERSOUL);
const DEFAULTS = { ...OVERSOUL_ESTIMATES };
afterEach(() => { Object.assign(OVERSOUL_ESTIMATES, DEFAULTS); });

describe('the Oversoul block and rows (§12.2)', () => {
  it('SinirothX: HP 210,000, Str / Mag 244, Def 88, MDef 89, Agi 244, Luck 16, Eva 0; the normal form\'s immunities', () => {
    expect(paragonOversoul.stats).toEqual({
      hp: 210000, mp: 9999, maxHp: 210000, maxMp: 9999, str: 244, mag: 244, def: 88, mdef: 89, agi: 244, eva: 0, luck: 16, acc: 0,
    });
    expect(paragonOversoul.immunities).toEqual(paragon.immunities);
    expect(paragonOversoul.rewards).toMatchObject({ exp: 13000, ap: 2, gil: 8000 });
    expect(paragonOversoul.aiScriptId).toBe('paragon-oversoul');
    for (const id of paragonOversoul.abilityIds) expect(data.ABILITIES[id], id).toBeDefined();
    expect(cloisterParagonOversoulGroup.nextGroupId).toBe(CLOISTER_TREMA);
  });

  it('every missing value is a named parameter at its declared default', () => {
    expect(OVERSOUL_ESTIMATES).toMatchObject({
      physicalHitPercent: 50, idleSeconds: 20, magicBelow: 0.4, finalBelow: 0.1, finalImpactHits: 14,
      finalImpactReducible: false, agaOnAll: true, attackItchy: true, answerTiming: 'immediate',
      attackBWakesOn: 'any-party-cast', lowHpActsEveryTurn: false, thinkingPeriod: 0,
    });
  });

  it('its physicals roll at the flat estimate whatever the girl\'s Luck, and cause Itchy; its magic never misses', () => {
    const b = fresh();
    const attack = ab('paragon-os-attack');
    expect(attack.canMiss).not.toBe(false); // hard rule 5: it rolls
    for (const girl of ['yuna', 'rikku', 'paine']) expect(hitPercent(b.unit('paragon'), b.unit(girl), attack)).toBe(50);
    expect(attack.statusEffects).toEqual([{ status: 'itchy', chance: 255, duration: 0 }]);
    for (const id of ['paragon-os-judgement', 'paragon-os-holy', 'paragon-os-firaga', 'paragon-os-ultima', 'paragon-os-demi']) {
      expect(ab(id).canMiss, id).toBe(false);
    }
    expect(ab('paragon-os-firaga')).toMatchObject({ power: 21, targeting: 'all-enemies', element: ['fire'] });
    expect(ab('paragon-os-holy')).toMatchObject({ power: 12, hits: 8 });
  });

  it('Final Impact: 14 hits on random girls, each 1/8 of her max HP and 1/8 of her max MP', () => {
    const b = fresh();
    const girls = ['yuna', 'rikku', 'paine'].map(b.unit);
    for (const g of girls) { g.stats.maxHp = 80000; g.hp = 80000; } // survive all 14, to count them
    resolveAbility(b.resolveCtx(), b.unit('paragon'), ab('paragon-os-final-impact'), []);
    const hits = b.events.filter((e) => e.type === 'damage' && e.sourceId === 'paragon');
    expect(hits).toHaveLength(14);
    // 80,000 / 8 = 10,000 before the randomiser (240 to 271 / 256): past the 9,999 cap, which it breaks.
    for (const h of hits) expect(Number(h.amount)).toBeGreaterThanOrEqual(9375);
    expect(hits.some((h) => Number(h.amount) > 9999)).toBe(true);
    const mp = b.events.filter((e) => e.type === 'mp-damage');
    expect(mp.length).toBeGreaterThan(0);
    for (const m of mp) {
      const g = b.unit(m.targetId as string);
      expect(m.amount).toBeLessThanOrEqual(Math.floor(g.stats.maxMp / 8));
    }
  });
});

describe('its script (SinirothX, §12.2)', () => {
  it('Oversouls first, then waits while nobody touches it', () => {
    const b = fresh();
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    expect(b.events.some((e) => e.type === 'message' && /oversouls/.test(String(e.text)))).toBe(true);
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    expect(paragonOversoulScript.counter).toBeUndefined(); // no Big Bang counter in this form
  });

  it('left alone for the idle time: Judgement, Genesis or Big Bang; Dispel if anyone is Reflected', () => {
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    const state = b.engine.state() as { ticks: number };
    state.ticks += OVERSOUL_ESTIMATES.idleSeconds * 3000 - 1;
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    state.ticks += 1;
    expect(['paragon-os-judgement', 'paragon-genesis', 'paragon-big-bang']).toContain(idOf(paragonOversoulScript.decide(b.ctx('paragon'))));
    state.ticks += OVERSOUL_ESTIMATES.idleSeconds * 3000;
    b.unit('rikku').statuses.reflect = { ticksRemaining: null } as never;
    expect(idOf(paragonOversoulScript.decide(b.ctx('paragon')))).toBe('paragon-os-dispel');
  });

  it('copies "Attack a" back at whoever hit it; answers Attack and Darkness with its own Attack', () => {
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    const yuna = b.unit('yuna');
    const hit = (id: string) => paragonOversoulScript.onPartyAction!(b.ctx('paragon'), yuna, { abilityId: id, aimedAtSelf: true });
    expect(hit('x2-dark-knight-break')).toEqual({ kind: 'ability', id: 'x2-dark-knight-break', targets: ['yuna'] });
    expect(hit('x2-dark-knight-attack')).toEqual({ kind: 'ability', id: 'paragon-os-attack', targets: ['yuna'] });
    expect(hit('x2-dark-knight-darkness')).toEqual({ kind: 'ability', id: 'paragon-os-attack', targets: ['yuna'] });
    expect(oversoulAttackClass(ab('x2-dark-knight-black-sky'))).toBe('other'); // "every Arcana except Black Sky"
    yuna.statuses.reflect = { ticksRemaining: null } as never;
    expect(ab('x2-black-mage-fire').flags).toContain('reflectable');
    expect(idOf(hit('x2-black-mage-fire'))).toBe('paragon-os-attack'); // its copy would bounce back
    expect(paragonOversoulScript.onPartyAction!(b.ctx('paragon'), yuna, { abilityId: 'x2-item-megalixir', aimedAtSelf: false })).toBeNull();
  });

  it('an "Attack b" brings Demi, turn after turn, until another attack hits it', () => {
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    const rikku = b.unit('rikku');
    expect(idOf(paragonOversoulScript.onPartyAction!(b.ctx('paragon'), rikku, { abilityId: 'x2-white-mage-cure', aimedAtSelf: false }))).toBe('paragon-os-demi');
    expect(idOf(paragonOversoulScript.decide(b.ctx('paragon')))).toBe('paragon-os-demi');
    expect(idOf(paragonOversoulScript.decide(b.ctx('paragon')))).toBe('paragon-os-demi');
    paragonOversoulScript.onPartyAction!(b.ctx('paragon'), rikku, { abilityId: 'x2-alchemist-attack', aimedAtSelf: true });
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
    OVERSOUL_ESTIMATES.attackBWakesOn = 'aimed-at-paragon';
    expect(paragonOversoulScript.onPartyAction!(b.ctx('paragon'), rikku, { abilityId: 'x2-white-mage-cure', aimedAtSelf: false })).toBeNull();
  });

  it('with answerTiming next-turn, the answer waits for its own turn', () => {
    OVERSOUL_ESTIMATES.answerTiming = 'next-turn';
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    expect(paragonOversoulScript.onPartyAction!(b.ctx('paragon'), b.unit('paine'), { abilityId: 'x2-dark-knight-break', aimedAtSelf: true })).toBeNull();
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toEqual({ kind: 'ability', id: 'x2-dark-knight-break', targets: ['paine'] });
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull();
  });

  it('below 4/10 a hit brings -aga spells or its Attack; below 1/10 Final Impact once, then the Ultima pool', () => {
    const b = fresh();
    paragonOversoulScript.decide(b.ctx('paragon'));
    const p = b.unit('paragon');
    const hit = (seed: number) => idOf(paragonOversoulScript.onPartyAction!(b.ctx('paragon', seed), b.unit('yuna'), { abilityId: 'x2-dark-knight-break', aimedAtSelf: true }));
    p.hp = Math.floor(p.stats.maxHp * 0.3);
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hit));
    for (const id of seen) expect(['paragon-os-attack', 'paragon-os-firaga', 'paragon-os-blizzaga', 'paragon-os-thundaga', 'paragon-os-waterga']).toContain(id);
    expect(paragonOversoulScript.decide(b.ctx('paragon'))).toBeNull(); // not hit since: it waits (lowHpActsEveryTurn false)
    p.hp = Math.floor(p.stats.maxHp * 0.05);
    expect(hit(1)).toBe('paragon-os-final-impact');
    for (const s of [2, 3, 4, 5, 6]) {
      expect(['paragon-os-ultima', 'paragon-os-holy', 'paragon-os-judgement', 'paragon-genesis', 'paragon-big-bang']).toContain(hit(s));
    }
    b.unit('paine').statuses.reflect = { ticksRemaining: null } as never;
    expect(hit(7)).toBe('paragon-os-dispel');
  });
});

describe('Oversoul Paragon through the engine', () => {
  it('learns the ability of a charged party action (Darkness charges; its action-start is in an earlier slice)', () => {
    const r = driveParagon(LINES.kitDarknessOnParagon, 2, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
    const i = r.log.findIndex((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'x2-dark-knight-darkness');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(r.log.some((e) => e.type === 'counter' && (e as { abilityId?: string }).abilityId === 'paragon-big-bang')).toBe(false);
    expect(r.log.some((e) => e.type === 'counter' && (e as { abilityId?: string }).abilityId === 'paragon-os-attack')).toBe(true);
    const b = fresh();
    expect(abilityPerformedBy(b.unit('yuna') as Ffx2Unit)).toBeUndefined();
  });

  it('never acts before the party does, and every run ends, alone and as the chapter\'s first link', () => {
    for (const seed of [1, 2, 3]) {
      const r = driveParagon(LINES.kitIntended, seed, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
      expect(['victory', 'defeat']).toContain(r.outcome);
      const first = r.log.find((e) => e.type === 'action-start');
      expect(first && (first as { actorId: string }).actorId).not.toBe('paragon');
      const c = driveChapter(LINES.kitIntended, seed, { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL });
      expect(['victory', 'defeat']).toContain(c.outcome);
    }
  });
});
