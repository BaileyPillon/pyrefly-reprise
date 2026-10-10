/**
 * **Chapter XII — Seymour Omnis: the attack counter, Dispel, Ultima, the
 * reset, and the affinity ladder.** One case per research row
 * (`research/ffx-seymour-omnis.md` §3-§4, the preflight's §9 list), plus the
 * damage figures §3.3 derives, run through the engine's own chain.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEngine, FFXCombatant, StatusId } from '../../../src/battle/common/types.ts';
import { computeDamage } from '../../../src/battle/ffx/formulas.ts';
import { bouncesOffReflect } from '../../../src/battle/ffx/statuses.ts';
import { ATTACK_ABILITY_ID } from '../../../src/battle/ffx/registry.ts';
import { ABILITIES } from '../../../src/data/ffx/index.ts';
import { gardenOfPainBuild } from '../../../src/data/ffx/builds/garden-of-pain.ts';
import { OMNIS_RESET_CYCLE, omnisAffinities } from '../../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { OMNIS_ASSUMPTIONS } from '../../../src/battle/ffx/ai/seymour-omnis.ts';
import {
  OMNIS, actor, content, defend, discs, drive, flags, inputFor, lineUp, makeInvincible, newEngine, nextInput, omnisTurns, status,
} from '../helpers/omnisUnits.ts';

const omnisActions = (e: BattleEngine): string[] =>
  e.state().log.filter((ev) => ev.type === 'action-start' && ev.actorId === OMNIS).map((ev) => (ev as { abilityId: string }).abilityId);

/** Every party turn hits Omnis with the fixed 500 probe until `stop`. */
function hitUntil(e: BattleEngine, stop: (e: BattleEngine) => boolean): void {
  drive(e, () => ({ kind: 'ability', id: 'test-hit-500', targets: [OMNIS] }), stop);
}

describe('the attack counter (§4.4)', () => {
  it('six attacks on him light the glow, five do not (the sixth zeroes the counter as it lights it: D-28)', () => {
    const e = newEngine(1);
    makeInvincible(e);
    hitUntil(e, (x) => flags(x)['omnis.hits'] === 5);
    expect(flags(e)['omnis.state']).toBe('normal');
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'red');
    expect(flags(e)['omnis.hits']).toBe(0);
    expect(e.state().log.some((ev) => ev.type === 'message' && ev.text === 'Seymour Omnis glows red')).toBe(true);
  });

  it('below 20,000 HP three are enough', () => {
    const e = newEngine(1);
    makeInvincible(e);
    actor(e, OMNIS).hp = 19_999;
    hitUntil(e, (x) => flags(x)['omnis.state'] === 'red');
    const taps = e.state().log.filter((ev) => ev.type === 'damage' && ev.targetId === OMNIS && ev.sourceId !== OMNIS && ev.amount > 0).length;
    expect(taps).toBe(3);
  });

  it('his own spells bounced off a Reflected party count as attacks (§4.4, single source: wiki)', () => {
    const e = newEngine(7);
    makeInvincible(e);
    for (const id of ['tidus', 'yuna', 'auron']) actor(e, id).statuses['reflect'] = { ...status('reflect'), permanent: true };
    drive(e, () => defend(), (x) => omnisTurns(x.state().log).length >= 1 && omnisActions(x).length >= 4);
    const bounced = e.state().log.filter((ev) => ev.type === 'damage' && ev.sourceId === OMNIS && ev.targetId === OMNIS);
    expect(bounced.length).toBe(4);
    // All four Firaga fed a Fire-absorbing Omnis, and all four counted.
    for (const b of bounced) expect(b.type === 'damage' && b.amount).toBeLessThan(0);
    drive(e, () => defend(), (x) => x.state().log.at(-1)?.type === 'turn-start');
    expect(flags(e)['omnis.hits']).toBe(4);
  });

  it('a Magic Counter answering his spell counts too', () => {
    const party = structuredClone(gardenOfPainBuild);
    party.members.find((m) => m.id === 'auron')!.equipment.weapon.autoAbilities.push('magic-counter');
    const e = newEngine(3, party);
    makeInvincible(e);
    drive(e, () => defend(), (x) => x.state().log.some((ev) => ev.type === 'counter' && ev.actorId === 'auron'));
    drive(e, () => defend(), (x) => x.state().log.at(-1)?.type === 'turn-start');
    expect(flags(e)['omnis.hits']).toBe(1);
  });

  it('hits on the discs do not count (B11 = no)', () => {
    const e = newEngine(2, lineUp(['wakka', 'yuna', 'auron']));
    makeInvincible(e);
    for (let i = 0; i < 4; i++) {
      inputFor(e, 'wakka');
      e.submit({ kind: 'attack', targets: ['mortiphasm-1'] });
    }
    expect(flags(e)['omnis.hits']).toBe(0);
  });
});

describe('Dispel, then Ultima, then the reset (§4.4; B23 = a)', () => {
  it('glowing, he Dispels the party (the exact list) and his Defense drops to 100', () => {
    const e = newEngine(4);
    makeInvincible(e);
    const worn: StatusId[] = ['shell', 'protect', 'reflect', 'haste', 'regen', 'nulblaze', 'nultide', 'armor-break', 'curse'];
    nextInput(e);
    for (const id of ['tidus', 'yuna', 'auron']) for (const s of worn) actor(e, id).statuses[s] = status(s);
    flags(e)['omnis.state'] = 'red';
    drive(e, () => defend(), (x) => omnisActions(x).includes('omnis-dispel'));
    for (const id of ['tidus', 'yuna', 'auron']) {
      for (const s of worn) expect(actor(e, id).statuses[s], `${id} ${s}`).toBeUndefined();
    }
    expect(actor(e, OMNIS).stats.def).toBe(100);
    expect(flags(e)['omnis.state']).toBe('dispelled');
  });

  it('his next turn is Ultima: Defense 150, the counter resets; the turn after is only the reset (no spell), to Ice, and then four Blizzaga (D-24, D-27)', () => {
    const e = newEngine(4);
    makeInvincible(e);
    flags(e)['omnis.state'] = 'red';
    drive(e, () => defend(), (x) => omnisActions(x).includes('omnis-ultima'));
    expect(omnisActions(e).slice(-2)).toEqual(['omnis-dispel', 'omnis-ultima']);
    expect(actor(e, OMNIS).stats.def).toBe(150);
    expect(flags(e)['omnis.hits']).toBe(0);
    expect(discs(e)).toEqual(['fire', 'fire', 'fire', 'fire']);
    const turnsBefore = omnisTurns(e.state().log).length;
    drive(e, () => defend(), (x) => omnisTurns(x.state().log).length > turnsBefore);
    expect(omnisActions(e).at(-1)).toBe('omnis-ultima'); // the reset turn cast nothing
    expect(discs(e)).toEqual(['ice', 'ice', 'ice', 'ice']);
    const reset = e.state().log.find((ev) => ev.type === 'affinity-change' && ev.cause === 'reset');
    expect(reset).toBeDefined();
    // his affinity follows at the next turn start of any actor (D-30), then the next turn of his is the volley
    nextInput(e);
    expect(actor(e, OMNIS).affinities).toEqual({ ice: 'absorb', fire: 'weak' });
    drive(e, () => defend(), (x) => omnisTurns(x.state().log).length > turnsBefore + 1);
    expect(omnisActions(e).slice(-4)).toEqual(['omnis-blizzaga', 'omnis-blizzaga', 'omnis-blizzaga', 'omnis-blizzaga']);
    // Defense never goes back to 180 (§4.4 [derived]).
    expect(actor(e, OMNIS).stats.def).toBe(150);
  });

  it('the reset walks the cycle Ice -> Water -> Thunder -> Fire -> Ice (the script counter starts at 0 and moves first: D-24)', () => {
    expect([...OMNIS_RESET_CYCLE]).toEqual(['fire', 'ice', 'water', 'lightning']); // by counter value; the first reset is index 1
    const e = newEngine(9);
    makeInvincible(e);
    const seen: string[] = [];
    for (let round = 0; round < 4; round++) {
      flags(e)['omnis.state'] = 'red';
      drive(e, () => defend(), (x) => flags(x)['omnis.state'] === 'normal');
      seen.push(discs(e)[0]!);
    }
    expect(seen).toEqual(['ice', 'water', 'lightning', 'fire']);
  });

  it('Armor Break wins over every scripted Defense (O-12, built as our estimate)', () => {
    const e = newEngine(1);
    const omnis = actor(e, OMNIS);
    const auron = actor(e, 'auron');
    omnis.statuses['armor-break'] = status('armor-break');
    const attack = content.ability(ATTACK_ABILITY_ID) as AbilityDef;
    expect(attack).toBeDefined();
    const hit = (): number => computeDamage({ user: auron, target: omnis, def: attack, crit: false, varianceRoll: 16, elements: [] }).amount;
    const at180 = hit();
    omnis.stats.def = 100;
    const at100 = hit();
    omnis.stats.def = 150;
    expect(hit()).toBe(at180);
    expect(at100).toBe(at180);
  });
});

describe('the rows, through the engine chain (§3.1, §3.3 [derived])', () => {
  const e = newEngine(1);
  const omnis = actor(e, OMNIS);
  const target = (mdef: number, extra: Partial<Record<StatusId, number>> = {}): FFXCombatant => {
    const c = structuredClone(actor(e, 'tidus'));
    c.stats.mdef = mdef;
    c.equipment = { weapon: { name: '', slots: 0, autoAbilities: [] }, armor: { name: '', slots: 0, autoAbilities: [] } };
    for (const [s, n] of Object.entries(extra)) c.statuses[s as StatusId] = { ...status(s as StatusId), stacks: n };
    return c;
  };
  const dmg = (id: string, t: FFXCombatant): number =>
    computeDamage({ user: omnis, target: t, def: ABILITIES[id] as AbilityDef, crit: false, varianceRoll: 16, elements: (ABILITIES[id] as AbilityDef).element }).amount;

  it('-ra 1,141, -ga 2,154, Ultima 3,577 at Magic Defense 25', () => {
    expect(dmg('omnis-fira', target(25))).toBe(1_141);
    expect(dmg('omnis-waterga', target(25))).toBe(2_154);
    expect(dmg('omnis-ultima', target(25))).toBe(3_577);
    expect(dmg('omnis-ultima', target(10))).toBe(3_994);
  });

  it('Shell halves his -ga but not Ultima (type Other); Focus and Shield cut Ultima', () => {
    expect(dmg('omnis-firaga', target(25, { shell: 0 }))).toBe(Math.floor(2_154 / 2));
    expect(dmg('omnis-ultima', target(25, { shell: 0 }))).toBe(3_577);
    expect(dmg('omnis-ultima', target(25, { focus: 5 }))).toBeLessThan(3_577);
    expect(dmg('omnis-ultima', target(25, { shield: 0 }))).toBe(Math.floor(3_577 / 4));
  });

  it('his -ra / -ga bounce off Reflect; Dispel and Ultima do not', () => {
    const mirror = target(25, { reflect: 0 });
    expect(bouncesOffReflect(ABILITIES['omnis-firaga'] as AbilityDef, mirror)).toBe(true);
    expect(bouncesOffReflect(ABILITIES['omnis-fira'] as AbilityDef, mirror)).toBe(true);
    expect(bouncesOffReflect(ABILITIES['omnis-ultima'] as AbilityDef, mirror)).toBe(false);
    expect(bouncesOffReflect(ABILITIES['omnis-dispel'] as AbilityDef, mirror)).toBe(false);
  });

  it('every magical row cannot miss (hard rule 5)', () => {
    for (const id of ['omnis-fira', 'omnis-firaga', 'omnis-dispel', 'omnis-ultima', 'omnis-volley']) {
      expect((ABILITIES[id] as AbilityDef).canMiss).toBe(false);
    }
  });
});

describe('the affinity ladder (§4.2)', () => {
  it('one disc halves, two make him immune, three absorb, four absorb and open the opposite', () => {
    expect(omnisAffinities(['fire', 'water', 'ice', 'lightning'])).toEqual({ fire: 'resist', water: 'resist', ice: 'resist', lightning: 'resist' });
    expect(omnisAffinities(['fire', 'fire', 'ice', 'lightning'])).toMatchObject({ fire: 'immune', ice: 'resist', lightning: 'resist', water: 'normal' });
    expect(omnisAffinities(['ice', 'ice', 'ice', 'fire'])).toMatchObject({ ice: 'absorb', fire: 'resist' });
    expect(omnisAffinities(['lightning', 'lightning', 'lightning', 'lightning'])).toMatchObject({ lightning: 'absorb', water: 'weak' });
    expect(omnisAffinities(['ice', 'ice', 'ice', 'ice'])).toMatchObject({ ice: 'absorb', fire: 'weak' });
  });

  it('the Water-pair slip (D-31): two Water discs make him immune to Fire, not Water, only when the Water pair is the first the chain meets', () => {
    expect(omnisAffinities(['water', 'water', 'fire', 'ice'])).toMatchObject({ fire: 'immune', water: 'normal', ice: 'resist' });
    expect(omnisAffinities(['water', 'water', 'lightning', 'lightning'])).toMatchObject({ fire: 'immune', water: 'normal', lightning: 'immune' });
    // a Fire or an Ice pair meets Water in its own branch, which is right
    expect(omnisAffinities(['water', 'water', 'fire', 'fire'])).toMatchObject({ fire: 'immune', water: 'immune' });
    expect(omnisAffinities(['water', 'water', 'ice', 'ice'])).toMatchObject({ ice: 'immune', water: 'immune', fire: 'normal' });
    expect(omnisAffinities(['water', 'water', 'water', 'fire'])).toMatchObject({ water: 'absorb', fire: 'resist' });
  });

  it('the opening weakness is x1.5: Blizzara on the all-Fire Omnis reads weak', () => {
    const e = newEngine(2, lineUp(['lulu', 'yuna', 'auron']));
    makeInvincible(e);
    inputFor(e, 'lulu');
    const events = e.submit({ kind: 'ability', id: 'blizzara', targets: [OMNIS] });
    const hit = events.find((ev) => ev.type === 'damage' && ev.targetId === OMNIS);
    expect(hit && hit.type === 'damage' ? hit.affinity : undefined).toBe('weak');
  });
});

describe('aeons (§4.5)', () => {
  it('he never Banishes; Ifrit drinks his Firaga', () => {
    const e = newEngine(5);
    makeInvincible(e);
    inputFor(e, 'yuna');
    e.submit({ kind: 'summon', id: 'ifrit', targets: [] });
    actor(e, 'ifrit').stats.maxHp = 99_999;
    actor(e, 'ifrit').hp = 50_000;
    drive(e, () => defend(), (x) => omnisTurns(x.state().log).length >= 2 || x.state().aeonId === null);
    const onIfrit = e.state().log.filter((ev) => ev.type === 'damage' && ev.targetId === 'ifrit' && ev.sourceId === OMNIS);
    expect(onIfrit.length).toBeGreaterThan(0);
    for (const h of onIfrit) expect(h.type === 'damage' && h.amount).toBeLessThan(0);
    expect(omnisActions(e)).not.toContain('banish');
    expect(e.state().aeonId).toBe('ifrit');
  });
});

describe('rule 6 labels (repair pass, 2026-09-25)', () => {
  it('every unsourced behaviour the verifier named is labelled our estimate', () => {
    // After the scripts (re-parity) the ring, the reset order, the aim and the counter are the game's; what stays our estimate is below.
    for (const key of ['emptyAimFallback', 'reflectBounce', 'discExtraImmunities'] as const) {
      expect(OMNIS_ASSUMPTIONS[key]).toMatch(/our estimate/);
    }
    // The ring order was an estimate until the game's own AI script settled it (O-7, 2026-10-07), and the reset order until the script's compiled cycle did (re-parity D-24).
    expect(OMNIS_ASSUMPTIONS.ringOrder).toMatch(/sourced, no longer an assumption/);
    expect(OMNIS_ASSUMPTIONS.resetCycle).toMatch(/sourced, no longer an assumption/);
    // The aeon eaters are sourced and global, not an assumption of this chapter.
    expect(OMNIS_ASSUMPTIONS.aeonAbsorb).toMatch(/every FFX battle/);
  });
});
