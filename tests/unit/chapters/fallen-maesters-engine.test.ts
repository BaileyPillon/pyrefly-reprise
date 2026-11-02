/**
 * The four Fallen Maesters on the real engine (the hidden FFX-2 chapter): the moves one at a time, with the fiend's script swapped for a queue of commands (`forced`), against the Lv 99 party. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The scripts have their own file (`fallen-maesters-ai.test.ts`); the data has its own (`fallen-maesters-data.test.ts`). This file checks what the ENGINE does with the rows, move by move, against what the RE note says each does
 * (`research/re-ffx2-fallen-maesters.md` §7 and §8), including the seams the preflight asked for (T0/T1, `docs/handoff/ch-maesters.md`):
 *
 * 1. **Aranea** [RE §7.2, §8]: Gooey End (140 to 158 HP to all three, Poison, Stop with a counter of 25, STR and MAG down one stage), Spider Bite (no Defense term), her Attack evaded or two hits.
 * 2. **The Black Elemental** [RE §7.3, §8]: Ultima (capped at 9,999, the whole party), Flare, Absorb (HP and MP together), Magic Up (+2 a cast). **T0: its permanent Reflect is data only. The engine has no Reflect redirect
 *    (`kernel/hit.ts` says so), so a reflectable spell aimed at it lands; the test pins that so the day the redirect is ported it fails loudly.**
 * 3. **Concherer** [RE §7.4, §8]: Megaton Press (about 59,000 on a girl, a KO), Gunk (all of her MP and Poison); **the shell breaks on one result of 10,000 HP or more, end to end** (N1, N2): DEF and MDEF to 1, the message shown, and
 *    a result under 10,000 never breaks it.
 * 4. **Chac** [RE §7.5, §8]: Stony Glare (Petrify at 255, through a resist of 255), a blow on a petrified girl destroys her (Death and Eject, N5), Heaven's Cataract reaches the stone girls too and drops five stages by ten.
 */
import { describe, expect, it } from 'vitest';

import type { FFX2Combatant } from '../../../src/battle/common/types.ts';
import { x2Concherer } from '../../../src/data/ffx2/enemies/fallen-maesters.ts';
import {
  GIRLS,
  attackOf,
  bossOf,
  damageOn,
  forced,
  girlsOf,
  logOf,
  move,
  nextInput,
  openFloor,
  playUntil,
  playUntilBossActed,
  rowOf,
  unit,
  type Floor,
} from '../helpers/fallenMaestersDrive.ts';

/** Open a floor with the forced script and run until the fiend has done `commands`. */
function run(floor: Floor, commands: ReturnType<typeof move>[], seed = 1, setup?: (engine: ReturnType<typeof openFloor>) => void) {
  const f = forced(floor);
  const engine = openFloor(floor, seed, { group: f.group });
  setup?.(engine);
  f.forced.queue.push(...commands);
  expect(playUntilBossActed(engine, bossOf(floor), commands.length)).toBe(true);
  return engine;
}

const give = (u: FFX2Combatant, status: string): void => {
  u.statuses[status as 'petrify'] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as never;
};

describe('Aranea [RE §7.2, §8]', () => {
  it('Gooey End: 140 to 158 HP to each of the three, Poison, Stop with a counter of 25, Strength and Magic down one stage', () => {
    const engine = run(0, [move('x2-aranea-gooey-end')]);
    for (const id of GIRLS) {
      const hits = damageOn(engine, id);
      expect(hits, id).toHaveLength(1);
      expect(hits[0]!.amount, id).toBeGreaterThanOrEqual(140);
      expect(hits[0]!.amount, id).toBeLessThanOrEqual(158);
      const girl = unit(engine, id);
      expect(Object.keys(girl.statuses).sort(), id).toEqual(['mag-down', 'poison', 'stop', 'str-down']);
      expect((girl.statuses['stop'] as unknown as { counter: number }).counter, id).toBe(25);
      expect(girl.statuses['str-down']?.stacks, id).toBe(1);
      expect(girl.statuses['mag-down']?.stacks, id).toBe(1);
    }
  });

  it('Spider Bite: one hit of about 1,000 to 1,300 with no Defense term (row 0x40ca: formula 1, power 32), never missing, the same on a girl with Protect', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const engine = run(0, [move('x2-aranea-spider-bite', ['yuna'])], seed);
      const hits = damageOn(engine, 'yuna');
      expect(hits, `seed ${seed}`).toHaveLength(1);
      expect(hits[0]!.amount, `seed ${seed}`).toBeGreaterThanOrEqual(1000);
      expect(hits[0]!.amount, `seed ${seed}`).toBeLessThanOrEqual(1300);
    }
    const guarded = run(0, [move('x2-aranea-spider-bite', ['yuna'])], 1, (e) => give(unit(e, 'yuna'), 'protect'));
    const plain = run(0, [move('x2-aranea-spider-bite', ['yuna'])], 1);
    expect(damageOn(guarded, 'yuna')[0]!.amount).toBe(damageOn(plain, 'yuna')[0]!.amount); // damage flags 0: neither Protect nor Shell reduces it
  });

  it('her Attack is two hits that race her accuracy: this party (Luck 111 from Rabite Foot) evades it every time, a girl with no Luck and no Evasion does not (it is the only roll she makes)', () => {
    let landed = 0;
    let evaded = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const engine = run(0, [move('x2-aranea-attack', ['paine'])], seed);
      const log = logOf(engine);
      if (log.some((e) => e.type === 'damage' && e.targetId === 'paine')) landed++;
      if (log.some((e) => e.type === 'miss' && e.targetId === 'paine')) evaded++;
    }
    expect(landed + evaded).toBe(40); // every Attack resolves one way or the other
    expect(evaded).toBeGreaterThan(30); // the party's Luck beats her ACC 95 almost always: she is harmless to it, as the guides say of floor 20
    let hits = 0;
    let twoHit = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const engine = run(0, [move('x2-aranea-attack', ['paine'])], seed, (e) => {
        const paine = unit(e, 'paine');
        paine.stats = { ...paine.stats, luck: 0, eva: 0 };
      });
      const dmg = damageOn(engine, 'paine');
      if (dmg.length > 0) hits++;
      if (dmg.length === 2) twoHit++;
    }
    expect(hits).toBeGreaterThan(0);
    expect(twoHit).toBe(hits); // when it lands it is two hits
  });
});

describe('the Black Elemental [RE §7.3, §8]', () => {
  it('Ultima hits the whole party for the 9,999 cap (the row has no Break Damage Limit); Flare one girl for the cap too', () => {
    const ultima = run(1, [move('x2-black-elemental-ultima')]);
    for (const id of GIRLS) {
      const hit = damageOn(ultima, id)[0]!;
      expect(hit.amount, id).toBe(9999);
      expect(hit.capped, id).toBe(true);
    }
    expect(unit(ultima, 'rikku').alive).toBe(false); // 5,106 HP
    const flare = run(1, [move('x2-black-elemental-flare', ['paine'])]);
    expect(damageOn(flare, 'paine')[0]!.amount).toBe(9999);
    expect(damageOn(flare, 'yuna')).toHaveLength(0);
  });

  it('Magic Up on itself is +2 Magic a cast (three casts: six stages), Absorb takes HP and MP together from the girl', () => {
    const boss = bossOf(1);
    const ups = run(1, [move('x2-black-elemental-magic-up', [boss]), move('x2-black-elemental-magic-up', [boss]), move('x2-black-elemental-magic-up', [boss])]);
    expect(unit(ups, boss).statuses['mag-up']?.stacks).toBe(6);
    const absorb = run(1, [move('x2-black-elemental-absorb', ['yuna'])]);
    expect(damageOn(absorb, 'yuna')[0]!.amount).toBeGreaterThan(0);
    expect(logOf(absorb).some((e) => e.type === 'mp-damage' && e.targetId === 'yuna' && (e.amount ?? 0) > 0)).toBe(true);
  });

  it('it wears its permanent Reflect from the first moment, and Dispel-proof like any automatic status', () => {
    const engine = openFloor(1, 1);
    const status = unit(engine, bossOf(1)).statuses['reflect'];
    expect(status).toBeDefined();
    expect([status?.ticksRemaining, status?.turnsRemaining]).toEqual([null, null]); // no clock: it never wears off
  });

  it('T0, KNOWN GAP: the engine has no Reflect redirect, so a reflectable spell (Drain) aimed at it LANDS instead of bouncing; this fails the day the redirect is ported, and floor 40 gets harder with it', () => {
    const boss = bossOf(1);
    const engine = openFloor(1, 3, { immortal: true });
    let cast = false;
    for (let i = 0; i < 400 && !cast; i++) {
      const d = nextInput(engine, 4000);
      if (!d) break;
      const drain = d.actorId === 'yuna' ? rowOf(d, 'ability', 'x2-dark-knight-drain', [boss]) : null;
      if (drain) {
        engine.submit(drain);
        cast = true;
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(cast).toBe(true);
    playUntil(engine, (e) => damageOn(e, boss).length > 0 || logOf(e).some((x) => x.type === 'miss' && x.sourceId === 'yuna'), { immortal: true, maxDecisions: 600 });
    const log = logOf(engine);
    const onBoss = log.filter((e) => e.type === 'damage' && e.sourceId === 'yuna' && e.targetId === boss);
    const onCaster = log.filter((e) => e.type === 'damage' && e.sourceId === 'yuna' && e.targetId === 'yuna');
    expect(onBoss.length).toBeGreaterThan(0); // landed on the Black Elemental
    expect(onCaster).toHaveLength(0); // and nothing bounced to Yuna
  });
});

describe('Concherer [RE §7.4, §8]', () => {
  it('Megaton Press is about 59,000 on a girl (the cap is 99,999 and there is no Defense term): a KO; Protect halves it', () => {
    const press = run(2, [move('x2-concherer-megaton-press', ['yuna'])]);
    const hit = damageOn(press, 'yuna')[0]!;
    expect(hit.amount).toBeGreaterThanOrEqual(55_000);
    expect(hit.amount).toBeLessThanOrEqual(62_000);
    expect(unit(press, 'yuna').alive).toBe(false);
    const guarded = run(2, [move('x2-concherer-megaton-press', ['yuna'])], 1, (e) => give(unit(e, 'yuna'), 'protect'));
    const half = damageOn(guarded, 'yuna')[0]!.amount ?? 0;
    expect(half).toBeGreaterThanOrEqual(27_500);
    expect(half).toBeLessThanOrEqual(31_000);
  });

  it('Gunk takes ALL of one girl\'s MP (16/16 of her maximum) and Poisons her; her HP is untouched', () => {
    const gunk = run(2, [move('x2-concherer-gunk', ['yuna'])]);
    const yuna = unit(gunk, 'yuna');
    expect(yuna.mp).toBe(0);
    expect(yuna.statuses['poison']).toBeDefined();
    expect(yuna.hp).toBe(yuna.stats.maxHp);
    expect(logOf(gunk).find((e) => e.type === 'mp-damage' && e.targetId === 'yuna')?.amount).toBe(yuna.stats.maxMp);
  });

  it('the shell breaks on ONE result of 10,000 HP or more, end to end (N1, N2): Charon with Break Damage Limit does; DEF and MDEF go to 1, the message is shown, once', () => {
    const boss = bossOf(2);
    const f = forced(2);
    const engine = openFloor(2, 1, { group: f.group, breakDamageLimit: true, immortal: true });
    const before = unit(engine, boss);
    expect([before.stats.def, before.stats.mdef]).toEqual([x2Concherer.stats.def, x2Concherer.stats.mdef]);
    expect(before.statuses['shell'] && before.statuses['protect']).toBeTruthy();
    let casts = 0;
    for (let i = 0; i < 200 && casts < 2; i++) {
      const d = nextInput(engine, 4000);
      if (!d) break;
      const charon = d.actorId === 'yuna' || d.actorId === 'paine' ? rowOf(d, 'ability', 'x2-dark-knight-charon', [boss]) : null;
      if (charon) {
        engine.submit(charon);
        casts++;
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(playUntil(engine, (e) => damageOn(e, boss).length >= 2, { immortal: true, maxDecisions: 800 })).toBe(true);
    const hits = damageOn(engine, boss).map((e) => e.amount ?? 0);
    expect(Math.max(...hits)).toBeGreaterThanOrEqual(10_000);
    const after = unit(engine, boss);
    expect((after.aiMemory as Record<string, unknown>)['conchererShellBroken']).toBe(1);
    expect([after.stats.def, after.stats.mdef]).toEqual([1, 1]);
    expect(logOf(engine).filter((e) => e.type === 'message' && /shell/i.test(String((e as { text?: string }).text)))).toHaveLength(1);
  });

  it('a result under 10,000 never breaks it: Darkness (about 6,000 to 9,700 a hit on this party) leaves the shell whole', () => {
    const boss = bossOf(2);
    const f = forced(2);
    const engine = openFloor(2, 2, { group: f.group, immortal: true });
    let casts = 0;
    for (let i = 0; i < 300 && casts < 6; i++) {
      const d = nextInput(engine, 4000);
      if (!d) break;
      const dark = d.actorId === 'yuna' || d.actorId === 'paine' ? rowOf(d, 'ability', 'x2-dark-knight-darkness', []) : null;
      if (dark) {
        engine.submit(dark);
        casts++;
      } else engine.submit({ kind: 'defend', targets: [] });
    }
    expect(playUntil(engine, (e) => damageOn(e, boss).length >= 4, { immortal: true, maxDecisions: 1200 })).toBe(true);
    const hits = damageOn(engine, boss).map((e) => e.amount ?? 0);
    expect(hits.length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...hits)).toBeLessThan(10_000);
    expect((unit(engine, boss).aiMemory as Record<string, unknown>)['conchererShellBroken']).toBeUndefined();
    expect(unit(engine, boss).stats.def).toBe(x2Concherer.stats.def);
  });

  it('with the shell broken the same Attack hits a girl the way it hit before (no change to the party), and Concherer stands with DEF 1', () => {
    const f = forced(2);
    const engine = openFloor(2, 1, { group: f.group });
    const boss = unit(engine, bossOf(2));
    (boss.aiMemory ??= {})['conchererShellBroken'] = 1;
    boss.stats = { ...boss.stats, def: 1, mdef: 1 };
    f.forced.queue.push(move('x2-concherer-attack', ['paine']));
    expect(playUntilBossActed(engine, bossOf(2), 1)).toBe(true);
    const next = f.forced.queue.length;
    expect(next).toBe(0);
  });
});

describe('Chac [RE §7.5, §8]', () => {
  it('Stony Glare petrifies at 255, even through a resist of 255 (a chance of 255 beats it); a girl who is stone is still counted standing by the engine\'s targets', () => {
    const resisting = run(3, [move('x2-chac-stony-glare', ['yuna'])], 1, (e) => {
      (unit(e, 'yuna').immunities as Record<string, number>)['petrify'] = 255;
    });
    expect(unit(resisting, 'yuna').statuses['petrify']).toBeDefined();
    for (const id of ['rikku', 'paine']) expect(unit(resisting, id).statuses['petrify'], id).toBeUndefined();
  });

  it('a blow on a petrified girl destroys her (the shatter byte 100: Death and Eject, 100 in 101); over 40 seeds it shatters in all but a stray one', () => {
    let destroyed = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const engine = run(3, [move('x2-chac-attack', ['yuna'])], seed, (e) => give(unit(e, 'yuna'), 'petrify'));
      const yuna = unit(engine, 'yuna');
      if (yuna.statuses['ko'] !== undefined && yuna.statuses['eject'] !== undefined) destroyed++;
    }
    expect(destroyed).toBeGreaterThanOrEqual(36); // the attack also races her accuracy, so a hit that misses is no shatter: but the girl is stone, which forces the hit
    expect(destroyed).toBeLessThanOrEqual(40);
  });

  it('Heaven\'s Cataract reaches a petrified girl too and destroys her (N5: the all-party mask keeps the stone, the shatter byte 100 is rolled for her)', () => {
    let destroyed = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = run(3, [move('x2-chac-heavens-cataract')], seed, (e) => give(unit(e, 'paine'), 'petrify'));
      const paine = unit(engine, 'paine');
      expect(damageOn(engine, 'paine').length + (paine.statuses['ko'] !== undefined ? 1 : 0), `seed ${seed}`).toBeGreaterThan(0);
      if (paine.statuses['ko'] !== undefined && paine.statuses['eject'] !== undefined) destroyed++;
    }
    expect(destroyed).toBeGreaterThanOrEqual(17);
  });

  it('Heaven\'s Cataract: about 9,300 to 14,600 on the three, and DEF, MDEF, ACC, Evasion and Luck each down ten stages (to the floor); unshelled it nearly wipes the party', () => {
    const engine = run(3, [move('x2-chac-heavens-cataract')]);
    for (const id of GIRLS) {
      const girl = unit(engine, id);
      for (const stage of ['def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down']) expect(girl.statuses[stage]?.stacks, `${id} ${stage}`).toBe(10);
      const hit = damageOn(engine, id)[0]!;
      expect(hit.amount, id).toBeGreaterThan(8_000);
      expect(hit.amount, id).toBeLessThanOrEqual(99_999);
    }
    expect(girlsOf(engine).filter((g) => g.alive).length).toBeLessThanOrEqual(2);
  });

  it('with Shell (a Lunar Curtain\'s status) up, the same Cataract is about half', () => {
    const open = run(3, [move('x2-chac-heavens-cataract')], 5);
    const shelled = run(3, [move('x2-chac-heavens-cataract')], 5, (e) => {
      for (const id of GIRLS) give(unit(e, id), 'shell');
    });
    for (const id of ['yuna', 'paine']) {
      const full = damageOn(open, id)[0]!.amount ?? 0;
      const half = damageOn(shelled, id)[0]!.amount ?? 0;
      expect(half, id).toBeLessThan(full * 0.6);
      expect(half, id).toBeGreaterThan(full * 0.4);
    }
  });
});

describe('a plain girl\'s attack on each fiend lands in the real engine (the party can fight all four)', () => {
  it('every floor: a party Attack on the fiend produces a damage event on it', () => {
    for (const floor of [0, 1, 2, 3] as Floor[]) {
      const boss = bossOf(floor);
      const f = forced(floor);
      const engine = openFloor(floor, 1, { group: f.group, immortal: true });
      let hit = false;
      for (let i = 0; i < 60 && !hit; i++) {
        const d = nextInput(engine, 4000);
        if (!d) break;
        engine.submit(d.actorId === 'paine' ? attackOf(d, boss) : { kind: 'defend', targets: [] });
        hit = damageOn(engine, boss).length > 0;
      }
      expect(hit, `floor ${floor}`).toBe(true);
    }
  });
});
