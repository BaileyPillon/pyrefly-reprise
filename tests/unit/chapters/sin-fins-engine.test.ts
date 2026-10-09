/**
 * **The Left Fin, the Right Fin and Cid without missiles** (Sin, links 1 and 2;
 * package F of `docs/plans/sin-two-chapters-plan.md` §2.3). Each case pins one
 * claim of `research/ffx-sin.md` §4, §5.1 or §5.2 on the real engine and the
 * real data, with fixed seeds (hard rule 3: run the engine, never grep).
 *
 * Two layers: the script and the collector on a real battle built by
 * `buildBattle` (exact thresholds and formulas), and whole fights driven by
 * submitted commands (the order, the charge, the whiff, the counts, Negation).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, BattleEvent, BattleSetup, Command, Decision, FFXCombatant, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { FFXContentRegistry, buildBattle, createFFXEngine, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { triggerHandler } from '../../../src/battle/ffx/ai/index.ts';
import { cidSinAi, leftFinAi, rightFinAi, SIN_FINS_ASSUMPTIONS } from '../../../src/battle/ffx/ai/sin-fins.ts';
import { NEGATION_REMOVES, SIN_NEGATION_OFF, finNegationChance, readNegationTaken } from '../../../src/battle/ffx/ai/sin-negation.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { sinFinsCoreBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

type Group = 'sin-left-fin' | 'sin-right-fin';
type Input = Extract<Decision, { kind: 'player-input' }>;
const FIN: Record<Group, string> = { 'sin-left-fin': 'left-fin', 'sin-right-fin': 'right-fin' };
const setup = (g: Group, seed: number): BattleSetup =>
  ({ game: 'ffx', party: sinFinsCoreBuild, enemies: ENEMY_GROUPS_BY_ID[g]!, triggers: [], seed, condition: 'normal', canEscape: false });

function ctxOn(g: Group, seed = 1): Ctx {
  return buildBattle(setup(g, seed), new SeededRng(seed), content, () => {});
}
function engineOn(g: Group, seed = 1, range?: 'near' | 'far'): BattleEngine {
  const e = createFFXEngine({ content, autoResolveMinigames: true });
  e.init(setup(g, seed));
  if (range) (e.state().flags as Record<string, unknown>)['airship.range'] = range;
  return e;
}
const inst = (id: StatusId, permanent = false): StatusInstance =>
  ({ id, turnsRemaining: permanent ? 255 : 99, ticksRemaining: null, charges: null, stacks: 0, permanent });
const who = (e: BattleEngine | Ctx, id: string): FFXCombatant =>
  ('state' in e && typeof e.state === 'function' ? e.state() : (e as Ctx).state).combatants[id] as FFXCombatant;
const flags = (e: BattleEngine): Record<string, unknown> => e.state().flags as Record<string, unknown>;
const defend = (): Command => ({ kind: 'defend', targets: [] });
const at = (d: Input, id: string, pred: (c: Input['commands'][number]) => boolean): Command | null => {
  const r = d.commands.find((c) => c.enabled && pred(c) && c.validTargets.includes(id));
  return r ? ({ ...r.command, targets: [id] } as Command) : null;
};
const attackAt = (d: Input, id: string): Command | null => at(d, id, (c) => c.command.kind === 'attack');
const finFloor = new WeakMap<BattleEngine, number>();
/**
 * Keep a mechanic unit on its mechanic: nobody on either side dies. The Fin's HP
 * steps down by 1 a call instead of refilling, so the engine's stalemate watch
 * (no new low in 400 turns ends the battle) still sees progress.
 */
function invincible(e: BattleEngine, fin?: string): void {
  const st = e.state();
  for (const id of [...st.activeIds, ...st.reserveIds, ...(st.aeonId ? [st.aeonId] : [])]) {
    const c = st.combatants[id];
    if (c) { c.stats.maxHp = 99_999; c.hp = 99_999; c.mp = c.stats.maxMp; }
  }
  if (fin) {
    const f = st.combatants[fin]!;
    const low = (finFloor.get(e) ?? f.stats.maxHp) - 1;
    finFloor.set(e, low);
    f.hp = low;
  }
}
/** Drive, handing every player turn to `choose`; returns the events of the whole run. */
function drive(e: BattleEngine, choose: (d: Input) => Command, steps: number, each?: () => void): BattleEvent[] {
  for (let i = 0; i < steps; i++) {
    each?.();
    const d = e.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') e.submit(choose(d));
  }
  return e.state().log as BattleEvent[];
}
const finActs = (log: readonly BattleEvent[], fin: string): string[] =>
  log.flatMap((ev) => (ev.type === 'action-start' && ev.actorId === fin ? [ev.abilityId ?? ev.command.kind] : []));
const REGULAR = ['sin-fin-ram', 'sin-motionless'];

describe('setup: both Fin links open FAR with Cid at the helm (§4, S-8)', () => {
  for (const g of ['sin-left-fin', 'sin-right-fin'] as const) {
    it(`${g}: FAR, no order, the Fin counts targetings, Cid a non-combatant, no missile rack, Evrae's own flags unset`, () => {
      const e = engineOn(g);
      const f = flags(e);
      expect(f['airship.range']).toBe('far');
      expect(f['airship.order']).toBe('');
      expect(f['airship.countsTargetings']).toBe(FIN[g]);
      expect([f['sin.fin.hits'], f['sin.fin.regularActs'], f['sin.fin.charged'], f['sin.fin.latched']]).toEqual([0, 0, false, false]);
      expect(f['sin.negation.lastTaken']).toBe('{}'); // a JSON map: flags hold scalars only
      expect(readNegationTaken(f)).toEqual({});
      expect(f['airship.missilesLeft']).toBeUndefined(); // S-19, and REVIEW 4's widget reads the absence
      expect(f['airship.phase']).toBeUndefined(); // applyEvraeSetup returned early: no Evrae here
      expect(e.state().enemyIds).toContain('cid');
    });
  }

  it('killing the Fin wins the link: Cid is never waited for (the Evrae non-combatant mark)', () => {
    for (const g of ['sin-left-fin', 'sin-right-fin'] as const) {
      const e = engineOn(g, 2, 'near');
      let over: Decision | null = null;
      for (let i = 0; i < 200 && !over; i++) {
        invincible(e);
        who(e, FIN[g]).hp = 1;
        const d = e.nextDecision();
        if (d.kind === 'battle-over') over = d;
        else if (d.kind === 'player-input') e.submit(attackAt(d, FIN[g]) ?? defend());
      }
      expect(over && over.kind === 'battle-over' ? over.result.outcome : null, g).toBe('victory');
      expect(who(e, 'cid').hp).toBeGreaterThan(0);
    }
  });

  it('every estimate the Fins carry is named (S-8, S-12, S-19, S-20, S-25, S-27, aeon reach, the seam line-up)', () => {
    const ids = SIN_FINS_ASSUMPTIONS.map((a) => a.id);
    for (const id of ['seam-lineup', 'S-8', 'S-12', 'S-19', 'S-20', 'S-25', 'S-27', 'aeon-reach-far', 'negation-slots', 'C-7']) {
      expect(ids, id).toContain(id);
    }
  });
});

describe('Cid without missiles (§2.5, S-19) and the orders (§4, [verified: 4 sources])', () => {
  it('an unordered Cid never acts: no missile, no out-of-ammo line, in 80 decisions of a defending party', () => {
    const e = engineOn('sin-left-fin', 3);
    const log = drive(e, defend, 80, () => invincible(e));
    expect(finActs(log, 'cid')).toEqual([]);
    expect(JSON.stringify(log)).not.toContain('cid-guided-missiles');
    expect(log.some((ev) => ev.type === 'message' && /missiles/i.test(ev.text))).toBe(false);
  });

  it("the last order wins, and it moves the ship only on Cid's turn (Tidus's real trigger handlers)", () => {
    const ctx = ctxOn('sin-left-fin', 2);
    const tidus = who(ctx, 'tidus');
    expect(triggerHandler('close-in')!.available(ctx, tidus)).toBe(true);
    expect(triggerHandler('close-in')!.available(ctx, who(ctx, 'yuna'))).toBe(false);
    triggerHandler('close-in')!.apply(ctx, tidus);
    triggerHandler('pull-back')!.apply(ctx, tidus);
    triggerHandler('close-in')!.apply(ctx, tidus);
    expect(ctx.state.flags['airship.range']).toBe('far');
    expect(cidSinAi(aiContextFor(ctx, who(ctx, 'cid')))).toBeNull();
    expect(ctx.state.flags['airship.range']).toBe('near');
    expect(ctx.state.flags['airship.order']).toBe('');
    expect(cidSinAi(aiContextFor(ctx, who(ctx, 'cid')))).toBeNull(); // unordered: nothing at all
    expect(ctx.state.flags['airship.range']).toBe('near');
  });

  it('in a driven fight every ship move follows the order queued before it, on seeds 1-4', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const e = engineOn('sin-left-fin', seed);
      let moves = 0;
      for (let i = 0; i < 120; i++) {
        invincible(e, 'left-fin');
        const queued = flags(e)['airship.order'];
        const before = e.state().log.length;
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        const fresh = e.state().log.slice(before) as BattleEvent[];
        if (fresh.some((ev) => ev.type === 'message' && ev.kind === 'telegraph' && /Fahrenheit/.test(ev.text))) {
          moves++;
          expect(flags(e)['airship.range']).toBe(queued);
        }
        if (d.kind !== 'player-input') continue;
        const order = flags(e)['airship.range'] === 'far' ? 'close-in' : 'pull-back';
        const r = d.actorId === 'tidus' ? d.commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === order) : undefined;
        const range = flags(e)['airship.range'];
        e.submit(r ? r.command : defend());
        expect(flags(e)['airship.range']).toBe(range); // an order never moves the ship by itself
      }
      expect(moves).toBeGreaterThan(2);
    }
  });
});

describe('the Left Fin (§5.1)', () => {
  it('attack or skip: NEAR 33 / 67 / 100 % after 0 / 1 / 2 hits, FAR only from 7 hits', () => {
    const rate = (range: 'near' | 'far', hits: number): number => {
      const ctx = ctxOn('sin-left-fin', 11 + hits);
      let n = 0;
      for (let i = 0; i < 1500; i++) {
        Object.assign(ctx.state.flags, { 'airship.range': range, 'sin.fin.hits': hits, 'sin.fin.regularActs': 0 });
        const c = leftFinAi(aiContextFor(ctx, who(ctx, 'left-fin')));
        const id = c && 'id' in c ? c.id : '';
        if (id === (range === 'near' ? 'sin-fin-ram' : 'sin-fin-smack')) n++;
        else expect(id).toBe('sin-motionless');
      }
      return n / 1500;
    };
    expect(Math.abs(rate('near', 0) - 0.33)).toBeLessThan(0.05);
    expect(Math.abs(rate('near', 1) - 0.67)).toBeLessThan(0.05);
    expect(rate('near', 2)).toBe(1);
    expect(rate('far', 6)).toBe(0);
    expect(rate('far', 7)).toBe(1);
  });

  it('NEAR with no hits: three regular turns, "Core gathers energy.", Gravija, and again (S-25: Gravija does not count)', () => {
    const e = engineOn('sin-left-fin', 5, 'near');
    const acts = finActs(drive(e, defend, 400, () => invincible(e)), 'left-fin').slice(0, 10);
    expect(acts).toHaveLength(10);
    acts.forEach((a, i) => {
      if (i % 5 === 3) expect(a).toBe('sin-fin-gathers');
      else if (i % 5 === 4) expect(a).toBe('sin-fin-gravija');
      else expect(REGULAR).toContain(a);
    });
    expect(flags(e)['sin.fin.hits']).toBe(0);
  });

  it('Gravija takes 75 % of current HP, floored: it cannot kill (1 HP takes 0)', () => {
    const e = engineOn('sin-left-fin', 7, 'near');
    const pins: Array<[string, number]> = [['tidus', 4000], ['yuna', 1], ['auron', 3]];
    let done = 0;
    for (let i = 0; i < 400 && done < 2; i++) {
      if (flags(e)['sin.fin.charged'] === true) {
        const set = done === 0 ? pins : ([['tidus', 4001], ['yuna', 2], ['auron', 9]] as Array<[string, number]>);
        for (const [id, hp] of set) who(e, id).hp = hp;
        const before = e.state().log.length;
        while (flags(e)['sin.fin.charged'] === true) {
          const d = e.nextDecision();
          if (d.kind === 'player-input') e.submit(defend());
        }
        const hits = (e.state().log.slice(before) as BattleEvent[]).filter((ev) => ev.type === 'damage' && ev.sourceId === 'left-fin');
        for (const [id, hp] of set) {
          const dmg = hits.find((ev) => ev.type === 'damage' && ev.targetId === id);
          expect(dmg && dmg.type === 'damage' ? dmg.amount : 0, `${id} at ${hp}`).toBe(Math.floor((hp * 12) / 16));
          expect(who(e, id).hp).toBeGreaterThan(0);
        }
        done++;
        invincible(e);
        continue;
      }
      invincible(e);
      const d = e.nextDecision();
      if (d.kind === 'player-input') e.submit(defend());
    }
    expect(done).toBe(2);
  });

  it('FAR: it never charges; unhit, it only sits still', () => {
    const e = engineOn('sin-left-fin', 9);
    const acts = finActs(drive(e, defend, 300, () => invincible(e)), 'left-fin');
    expect(acts.length).toBeGreaterThan(20);
    expect(new Set(acts)).toEqual(new Set(['sin-motionless']));
    expect(flags(e)['sin.fin.regularActs']).toBe(0);
  });

  it('the dodge: a charge that resolves at FAR is the no-damage row; one at NEAR is Gravija (seeds 1-6)', () => {
    let whiffs = 0;
    let lands = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const e = engineOn('sin-left-fin', seed, 'near');
      for (let i = 0; i < 500; i++) {
        invincible(e, 'left-fin');
        const before = e.state().log.length;
        const d = e.nextDecision();
        if (d.kind === 'battle-over') break;
        const fresh = e.state().log.slice(before) as BattleEvent[];
        for (const ev of fresh) {
          if (ev.type !== 'action-start' || ev.actorId !== 'left-fin') continue;
          if (ev.abilityId === 'sin-fin-gravija-far') {
            whiffs++;
            expect(flags(e)['airship.range']).toBe('far');
            expect(fresh.some((x) => x.type === 'damage' && x.sourceId === 'left-fin')).toBe(false);
          }
          if (ev.abilityId === 'sin-fin-gravija') { lands++; expect(flags(e)['airship.range']).toBe('near'); }
        }
        if (d.kind !== 'player-input') continue;
        const want = flags(e)['sin.fin.charged'] === true ? 'pull-back' : flags(e)['airship.range'] === 'far' ? 'close-in' : null;
        const r = d.actorId === 'tidus' && want ? d.commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === want) : undefined;
        e.submit(r ? r.command : defend());
      }
    }
    expect(whiffs).toBeGreaterThan(0);
    expect(lands).toBeGreaterThan(0);
  });

  it('a party action at the Fin counts 1, an aeon\'s counts 2 (S-27); aeon physicals do not reach at FAR (REVIEW 13)', () => {
    const e = engineOn('sin-left-fin', 4, 'near');
    let party = 0;
    let aeon = 0;
    let farChecked = false;
    for (let i = 0; i < 300 && (party < 3 || aeon < 3); i++) {
      invincible(e, 'left-fin');
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const isAeon = who(e, d.actorId).side === 'aeon';
      const summon = d.actorId === 'yuna' ? d.commands.find((c) => c.enabled && c.command.kind === 'summon' && c.command.id === 'valefor') : undefined;
      const hit = attackAt(d, 'left-fin');
      if (isAeon && !farChecked) {
        flags(e)['airship.range'] = 'far';
        const far = e.nextDecision();
        expect(far.kind === 'player-input' && far.commands.some((c) => c.command.kind === 'attack' && c.validTargets.includes('left-fin'))).toBe(false);
        flags(e)['airship.range'] = 'near';
        farChecked = true;
        continue;
      }
      if (!isAeon && summon && party >= 3) { e.submit(summon.command); continue; }
      if (!hit) { e.submit(defend()); continue; }
      const h0 = flags(e)['sin.fin.hits'] as number;
      e.submit(hit);
      const h1 = flags(e)['sin.fin.hits'] as number;
      expect(h1, isAeon ? 'aeon' : 'party').toBe(h0 + (isAeon ? 2 : 1));
      if (isAeon) aeon++; else party++;
    }
    expect([party >= 3, aeon >= 3, farChecked]).toEqual([true, true, true]);
  });
});

describe('the Right Fin (§5.2)', () => {
  const act = (ctx: Ctx): string => { const c = rightFinAi(aiContextFor(ctx, who(ctx, 'right-fin'))); return c && 'id' in c ? c.id : ''; };
  const at2 = (ctx: Ctx, range: 'near' | 'far', hits: number): string => {
    Object.assign(ctx.state.flags, { 'airship.range': range, 'sin.fin.hits': hits, 'sin.fin.regularActs': 0 });
    return act(ctx);
  };

  it('NEAR only from 4 hits, FAR from 5, with no roll below', () => {
    const ctx = ctxOn('sin-right-fin', 3);
    for (let i = 0; i < 50; i++) expect(at2(ctx, 'near', 3)).toBe('sin-motionless');
    expect(at2(ctx, 'near', 4)).toBe('sin-fin-ram');
    expect(ctx.state.flags['sin.fin.hits']).toBe(0); // the attack resets the shared counter
    expect(at2(ctx, 'far', 4)).toBe('sin-motionless');
    expect(at2(ctx, 'far', 5)).toBe('sin-fin-smack');
  });

  it('under 16,250 HP it latches: always attacks at NEAR, FAR from 3, and a Cura above the line does not undo it', () => {
    const ctx = ctxOn('sin-right-fin', 6);
    const fin = who(ctx, 'right-fin');
    fin.hp = 16_250;
    expect(at2(ctx, 'near', 0)).toBe('sin-motionless');
    expect(ctx.state.flags['sin.fin.latched']).toBe(false);
    fin.hp = 16_249;
    expect(at2(ctx, 'near', 0)).toBe('sin-fin-ram');
    expect(ctx.state.flags['sin.fin.latched']).toBe(true);
    executeCommand(ctx, who(ctx, 'yuna'), { kind: 'ability', id: 'cura', targets: ['right-fin'] }, true);
    expect(fin.hp).toBeGreaterThan(16_250);
    for (let i = 0; i < 20; i++) expect(at2(ctx, 'near', 0)).toBe('sin-fin-ram');
    expect(at2(ctx, 'far', 2)).toBe('sin-motionless');
    expect(at2(ctx, 'far', 3)).toBe('sin-fin-smack');
  });
});

describe('Negation (§5.1.3, S-12: the wiki formula as named tunables)', () => {
  const clean = (ctx: Ctx): void => {
    for (const id of ['tidus', 'yuna', 'auron', 'left-fin', 'right-fin']) {
      const c = ctx.state.combatants[id];
      if (c) for (const s of NEGATION_REMOVES) delete c.statuses[s];
    }
  };

  it('the NEAR chance is max(0, c - 3) / 16 (Left) or / 12 (Right); FAR is 80 % with Mental Break, else 0; the off switch', () => {
    const ctx = ctxOn('sin-left-fin', 1);
    clean(ctx);
    ctx.state.flags['airship.range'] = 'near';
    expect(finNegationChance(ctx, 'left-fin')).toBe(0); // c = 2
    for (const id of ['tidus', 'yuna', 'auron']) ctx.state.combatants[id]!.statuses['haste'] = inst('haste');
    expect(finNegationChance(ctx, 'left-fin')).toBe(2 / 16); // 2 + 3
    ctx.state.combatants['auron']!.statuses['protect'] = inst('protect'); // rightmost +1
    ctx.state.combatants['tidus']!.statuses['protect'] = inst('protect'); // leftmost +2
    expect(finNegationChance(ctx, 'left-fin')).toBe(5 / 16);
    ctx.state.combatants['left-fin']!.statuses['armor-break'] = inst('armor-break'); // first Break +2
    expect(finNegationChance(ctx, 'left-fin')).toBe(7 / 16);
    ctx.state.combatants['left-fin']!.statuses['mental-break'] = inst('mental-break'); // second +1
    expect(finNegationChance(ctx, 'left-fin')).toBe(8 / 16);
    ctx.state.flags[SIN_NEGATION_OFF] = true;
    expect(finNegationChance(ctx, 'left-fin')).toBe(0);
    delete ctx.state.flags[SIN_NEGATION_OFF];
    ctx.state.flags['airship.range'] = 'far';
    expect(finNegationChance(ctx, 'left-fin')).toBe(0.8);
    delete ctx.state.combatants['left-fin']!.statuses['mental-break'];
    expect(finNegationChance(ctx, 'left-fin')).toBe(0);

    const right = ctxOn('sin-right-fin', 1);
    clean(right);
    right.state.flags['airship.range'] = 'near';
    for (const id of ['tidus', 'yuna', 'auron']) right.state.combatants[id]!.statuses['shell'] = inst('shell');
    expect(finNegationChance(right, 'right-fin')).toBe(2 / 12);
  });

  it('NEAR, 400 targeted actions with Haste on three: fires at 2/16 within binomial noise, as a counter', () => {
    const e = engineOn('sin-left-fin', 8, 'near');
    let n = 0;
    let fired = 0;
    for (let i = 0; i < 20000 && n < 400; i++) {
      invincible(e, 'left-fin');
      for (const id of ['tidus', 'yuna', 'auron']) { const c = who(e, id); for (const s of NEGATION_REMOVES) delete c.statuses[s]; c.statuses['haste'] = inst('haste'); }
      for (const s of NEGATION_REMOVES) delete who(e, 'left-fin').statuses[s];
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const hit = attackAt(d, 'left-fin');
      const before = e.state().log.length;
      e.submit(hit ?? defend());
      if (!hit) continue;
      n++;
      if (e.state().log.slice(before).some((ev) => ev.type === 'counter' && ev.abilityId === 'sin-fin-negation')) fired++;
    }
    expect(n).toBe(400);
    const sd = Math.sqrt(400 * 0.125 * 0.875);
    expect(Math.abs(fired - 50)).toBeLessThan(4 * sd);
  });

  it('NEAR Negation strips both sides, records what it took, and leaves Auto-Life, Doom and a permanent status', () => {
    const e = engineOn('sin-left-fin', 12, 'near');
    const party: StatusId[] = [...NEGATION_REMOVES];
    // Petrify would shatter a struck monster and Threaten stops its counter: the Fin carries the other 22.
    const onFin = party.filter((s) => s !== 'petrify' && s !== 'threaten');
    // Re-parity W2 (FFX only): Petrify stands alone in the game, and the game's cleanse works on a Petrified record only for Petrify itself
    // (research/re-ffx-ctb-status.md section 12, correction 4), so a member who carried both would keep the Zombie the cleanse reaches
    // first (status 1 comes before Petrify's 2). Petrify goes on Auron, the other 23 on Tidus.
    const onTidus = party.filter((s) => s !== 'petrify');
    let checked = false;
    for (let i = 0; i < 3000 && !checked; i++) {
      invincible(e, 'left-fin');
      const tidus = who(e, 'tidus');
      for (const s of onTidus) tidus.statuses[s] = inst(s);
      tidus.statuses['auto-life'] = inst('auto-life');
      tidus.statuses['doom'] = inst('doom');
      who(e, 'auron').statuses['regen'] = inst('regen', true);
      who(e, 'auron').statuses['petrify'] = inst('petrify');
      for (const s of onFin) who(e, 'left-fin').statuses[s] = inst(s);
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const before = e.state().log.length;
      e.submit(attackAt(d, 'left-fin') ?? defend());
      if (!e.state().log.slice(before).some((ev) => ev.type === 'counter' && ev.abilityId === 'sin-fin-negation')) continue;
      for (const s of onTidus) expect(tidus.statuses[s], s).toBeUndefined();
      expect(who(e, 'auron').statuses['petrify'], 'petrify').toBeUndefined();
      for (const s of onFin) expect(who(e, 'left-fin').statuses[s], s).toBeUndefined();
      expect(tidus.statuses['auto-life']).toBeDefined();
      expect(tidus.statuses['doom']).toBeDefined();
      expect(who(e, 'auron').statuses['regen']?.permanent).toBe(true);
      // The HUD flag names exactly what the counter dispelled (the attack itself may wake or unconfuse the Fin first).
      const fresh = e.state().log.slice(before) as BattleEvent[];
      const after = fresh.slice(fresh.findIndex((ev) => ev.type === 'counter' && ev.abilityId === 'sin-fin-negation'));
      const gone = (id: string): StatusId[] =>
        after.flatMap((ev) => (ev.type === 'status-remove' && ev.reason === 'dispelled' && ev.targetId === id ? [ev.status] : [])).sort();
      const taken = readNegationTaken(flags(e));
      expect([...taken['tidus']!].sort()).toEqual([...onTidus].sort());
      expect(gone('tidus')).toEqual([...onTidus].sort());
      expect(gone('auron')).toEqual(['petrify']);
      expect([...taken['left-fin']!].sort()).toEqual(gone('left-fin'));
      expect(gone('left-fin')).toContain('mental-break');
      expect(taken['auron'] ?? []).not.toContain('regen');
      checked = true;
    }
    expect(checked).toBe(true);
  });

  it('FAR: never without Mental Break; about 80 % with it; the Fin is its only target', () => {
    const e = engineOn('sin-left-fin', 10);
    let n = 0;
    let fired = 0;
    let off = 0;
    for (let i = 0; i < 6000 && n < 250; i++) {
      invincible(e, 'left-fin');
      const armed = n >= 100;
      if (armed) who(e, 'left-fin').statuses['mental-break'] = inst('mental-break');
      who(e, 'tidus').statuses['haste'] = inst('haste');
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      delete who(e, 'left-fin').statuses['reflect'];
      // Yuna's Reflect is White Magic, so it crosses the gap (§4.3) and names the Fin without hurting it.
      const cura = d.actorId === 'yuna' ? at(d, 'left-fin', (c) => c.command.kind === 'ability' && c.command.id === 'reflect') : null;
      const before = e.state().log.length;
      e.submit(cura ?? defend());
      if (!cura) continue;
      n++;
      const fresh = e.state().log.slice(before) as BattleEvent[];
      const neg = fresh.some((ev) => ev.type === 'counter' && ev.abilityId === 'sin-fin-negation-far');
      expect(fresh.some((ev) => ev.type === 'counter' && ev.abilityId === 'sin-fin-negation')).toBe(false);
      if (!armed) { if (neg) off++; continue; }
      if (!neg) continue;
      fired++;
      expect(fresh.filter((ev) => ev.type === 'status-remove').every((ev) => ev.type === 'status-remove' && ev.targetId === 'left-fin')).toBe(true);
      expect(who(e, 'tidus').statuses['haste']).toBeDefined();
    }
    expect(n).toBe(250);
    expect(off).toBe(0);
    expect(Math.abs(fired - 120)).toBeLessThan(4 * Math.sqrt(150 * 0.8 * 0.2));
  });
});
