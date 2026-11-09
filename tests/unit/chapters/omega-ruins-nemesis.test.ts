/**
 * Nemesis's script (FFX only; `src/battle/ffx/ai/nemesis.ts`): the Armageddon counter's exact distribution (rebuilt from the real script's own transitions and pinned to the note, `research/re-ffx-omega-ultima-nemesis.md` 4.3),
 * its cycle, and its reply by damage type to the commands of the note's run, on the real engine's hook. Ultima Weapon's and Omega Weapon's scripts are `omega-ruins-ai.test.ts`.
 */

import { describe, expect, it } from 'vitest';

import type { AbilityDef, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { commandDamageType } from '../../../src/battle/ffx/ai/command-class.ts';
import { peekReactions, runOnHit, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { nemesisTurn } from '../../../src/battle/ffx/ai/nemesis.ts';
import { NM_ARMAGEDDON_AT, NM_COUNTER_FLAG, NM_STEP_FLAG, WEAPON_MOVES as M } from '../../../src/battle/ffx/ai/weapons-rules.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { NEMESIS_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import * as H from '../helpers/omegaRuinsDrive.ts';
import { type Engine, FRONT, turn } from '../helpers/omegaRuinsScript.ts';

describe('Nemesis: the Armageddon counter, the cycle and the reply (RE 4.3)', () => {
  const nem = (): Engine => H.newEngine(1, NEMESIS_GROUP_ID);

  it('the cycle is Ethereal Cannon (one target), Ultra Spark (the whole line), Attack, advancing only on the non-Attack draws; an Attack draw adds 3 and leaves the cycle alone', () => {
    const e = nem();
    const draws1 = [1];
    expect(turn(e, nemesisTurn, draws1)![0]).toBe(M.etherealCannon);
    expect(H.ctxOf(e).state.flags[NM_COUNTER_FLAG]).toBe(2);
    const spark = turn(e, nemesisTurn, draws1)!;
    expect(spark[0]).toBe(M.ultraSpark);
    expect([...spark[1]].sort()).toEqual([...FRONT].sort());
    expect(turn(e, nemesisTurn, draws1)![0]).toBe(M.nemesisAttack);
    expect(H.ctxOf(e).state.flags[NM_STEP_FLAG]).toBe(0);
    expect(turn(e, nemesisTurn, draws1)![0]).toBe(M.etherealCannon);
    expect(H.ctxOf(e).state.flags[NM_COUNTER_FLAG]).toBe(8);
    // an Attack by the draw
    const before = [H.ctxOf(e).state.flags[NM_COUNTER_FLAG], H.ctxOf(e).state.flags[NM_STEP_FLAG]];
    expect(turn(e, nemesisTurn, [0])![0]).toBe(M.nemesisAttack);
    expect([H.ctxOf(e).state.flags[NM_COUNTER_FLAG], H.ctxOf(e).state.flags[NM_STEP_FLAG]]).toEqual([(before[0] as number) + 3, before[1]]);
  });

  it('at the start of a turn with the counter at 20 or more: Armageddon on the whole front line, the counter back to 0, and no draw taken', () => {
    expect(NM_ARMAGEDDON_AT).toBe(20);
    for (const start of [20, 21, 22]) {
      const e = nem();
      H.ctxOf(e).state.flags[NM_COUNTER_FLAG] = start;
      const out = turn(e, nemesisTurn, [])!;
      expect(out[0]).toBe(M.armageddon);
      expect([...out[1]].sort()).toEqual([...FRONT].sort());
      expect(H.ctxOf(e).state.flags[NM_COUNTER_FLAG]).toBe(0);
    }
    const e = nem();
    H.ctxOf(e).state.flags[NM_COUNTER_FLAG] = 19;
    expect(turn(e, nemesisTurn, [1])![0]).toBe(M.etherealCannon);
  });

  function armageddonDistribution(): number[] {
    const e = nem();
    const mass = [21_846 / 65_536, 21_845 / 65_536, 21_845 / 65_536];
    const next = (c: number, cls: number): number => {
      H.ctxOf(e).state.flags[NM_COUNTER_FLAG] = c;
      H.ctxOf(e).state.flags[NM_STEP_FLAG] = 0;
      turn(e, nemesisTurn, [cls]);
      return H.ctxOf(e).state.flags[NM_COUNTER_FLAG] as number;
    };
    let states = new Map<number, number>([[0, 1]]);
    const out: number[] = [];
    for (let k = 1; k <= 14; k++) {
      const after = new Map<number, number>();
      let boom = 0;
      for (const [c, p] of states) {
        if (c >= NM_ARMAGEDDON_AT) { boom += p; continue; }
        for (let cls = 0; cls < 3; cls++) {
          const n = next(c, cls);
          after.set(n, (after.get(n) ?? 0) + p * mass[cls]!);
        }
      }
      out.push(boom);
      states = after;
    }
    return out;
  }

  it('Armageddon arrives on the 8th to the 11th turn only, in the note\'s exact shares (0.69, 25.18, 59.83, 14.31 percent), the mean 9.878', () => {
    const d = armageddonDistribution(); // d[t - 1] is the chance that turn t is the Armageddon (the Armageddon turn counts, as in the note)
    const percent = (t: number): number => Math.round(d[t - 1]! * 10_000) / 100;
    for (const [t, share] of [[8, 0.69], [9, 25.18], [10, 59.83], [11, 14.31]] as Array<[number, number]>) expect(percent(t), `Armageddon on turn ${t}`).toBe(share);
    expect(d.slice(0, 7).every((x) => x === 0)).toBe(true);
    expect(d[11]).toBe(0); // never on the 12th
    expect(d.reduce((a, x) => a + x, 0)).toBeCloseTo(1, 10);
    const mean = d.reduce((a, x, i) => a + x * (i + 1), 0);
    expect(Math.round(mean * 1_000) / 1_000).toBe(9.878);
  });

  it('draws all 0 (only Attacks) give Armageddon on the 8th turn; draws all 1 on the 11th, after Cannon, Spark, Attack', () => {
    const e = nem();
    let n = 0;
    let id = '';
    do { n++; id = turn(e, nemesisTurn, [0])![0]; } while (id !== M.armageddon && n < 40);
    expect([n, id]).toEqual([8, M.armageddon]);
    const f = nem();
    const seq: string[] = [];
    n = 0;
    do { n++; id = turn(f, nemesisTurn, [1])![0]; seq.push(id); } while (id !== M.armageddon && n < 40);
    expect(n).toBe(11);
    expect(seq.slice(0, 4)).toEqual([M.etherealCannon, M.ultraSpark, M.nemesisAttack, M.etherealCannon]);
  });

  /** One hit on Nemesis by `def` from `who`, then the reactions it queued. */
  function reply(def: AbilityDef, who = 'tidus'): string[] {
    const e = nem();
    const ctx = H.ctxOf(e);
    const nemesis = H.foeOf(e);
    const user = H.actor(e, who);
    while (takeReaction(ctx) !== undefined);
    runOnHit(ctx, { def, user }, nemesis, { hpBefore: nemesis.hp, lostHp: true, lastDamage: 100, affectsHp: true });
    const queued = peekReactions(ctx).map((r) => (r.kind === 'command' && r.command.kind === 'ability' ? r.command.id : r.kind));
    while (takeReaction(ctx) !== undefined);
    return queued;
  }

  const def = (id: string) => {
    const a = ALL_ABILITIES.find((x) => x.id === id);
    if (!a) throw new Error(`no ability '${id}'`);
    return a;
  };
  const core = (id: string) => {
    const e = nem();
    const a = H.ctxOf(e).content.ability(id);
    if (!a) throw new Error(`no core ability '${id}'`);
    return a;
  };

  it('the reply by damage type: Attack, Quick Hit, Delay Attack and Buster, Armor Break and the other Breaks, Mug and every spell are not answered', () => {
    for (const a of [core('attack'), def('quick-hit'), def('delay-attack'), def('delay-buster'), def('armor-break'), def('power-break'), def('mug'), def('bio'), def('dispel'), def('scan'), def('slow'), def('fire'), def('ultima'), def('flare')]) {
      expect(reply(a), a.id).toEqual([]);
    }
  });

  it('every Overdrive, every Mix result, Steal, Pilfer Gil, Lancet, Jinx, Threaten, Provoke, Talk and the item command is answered by Ultima on the whole line', () => {
    for (const a of [def('spiral-cut'), def('slice-and-dice'), def('blitz-ace'), def('fire-fury'), def('thunder-fury'), def('attack-reels'), def('oblivion'), def('delta-attack'), def('zanmato'), def('steal'), def('pilfer-gil'), def('lancet'), def('jinx'), def('threaten'), def('provoke'), def('talk'), def('grenade'), def('phoenix-down'), def('poison-fang')]) {
      expect(reply(a), a.id).toEqual([M.nemesisUltima]);
    }
    const mix = ALL_ABILITIES.filter((a) => a.id.startsWith('mix-') && a.record !== undefined && (a.record.flagsDamage & 3) === 0 && a.targeting !== 'self');
    expect(mix.length).toBeGreaterThan(10);
  });

  it('the reply is Ultima on the whole front line (its own row 0x40F3, one action per hit, not one per Overdrive hit)', () => {
    const e = nem();
    const ctx = H.ctxOf(e);
    const nemesis = H.foeOf(e);
    runOnHit(ctx, { def: def('blitz-ace'), user: H.actor(e, 'tidus') }, nemesis, { hpBefore: nemesis.hp, lostHp: true, lastDamage: 100, affectsHp: true });
    const queued = peekReactions(ctx);
    expect(queued).toHaveLength(1);
    const r = queued[0]!;
    expect(r.kind === 'command' && r.command.kind === 'ability' && r.command.id).toBe(M.nemesisUltima);
    expect(r.kind === 'command' && [...r.command.targets].sort()).toEqual([...FRONT].sort());
    expect(commandDamageType(def('blitz-ace'), H.actor(e, 'tidus') as FFXCombatant)).toBe(0);
  });

  it('on the real engine: a real Spiral Cut is answered by Ultima on all three, a real Attack is not', () => {
    const e = nem();
    // fill Tidus's gauge so the Overdrive is offered
    H.actor(e, 'tidus').overdrive!.gauge = 100;
    const d = H.inputFor(e, 'tidus');
    const od = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes('nemesis'));
    expect(od).toBeDefined();
    const events = e.submit({ ...od!.command, targets: ['nemesis'] } as Command);
    const acts = events.filter((x) => x.type === 'action-start').map((x) => (x.type === 'action-start' ? `${x.actorId}:${x.abilityId}` : ''));
    expect(acts.some((a) => a === `nemesis:${M.nemesisUltima}`)).toBe(true);
    const f = nem();
    const d2 = H.inputFor(f, 'tidus');
    const events2 = f.submit(H.swing(d2, 'nemesis')!);
    expect(events2.some((x) => x.type === 'action-start' && x.actorId === 'nemesis' && x.abilityId === M.nemesisUltima)).toBe(false);
  });
});
