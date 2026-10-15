/**
 * **Biran and Yenke Ronso on the real engine** (the hidden FFX chapter; **FFX only**). Each case pins one claim of `research/re-ffx-biran-yenke.md` ("RE section n", the game's own two scripts, read, not run:
 * the note's section 9 says so) on the real engine and the real data, with fixed seeds (hard rule 3: run the engine, never grep).
 *
 * Two layers: the rules on a real battle built by `buildBattle` with one command executed on it (exact numbers, no turn order in the way), and whole fights driven by submitted commands (the cycles, the
 * sides, the half-HP Rage, what the survivor does, Lancet's lessons).
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { buildBattle, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { runPreTurn } from '../../../src/battle/ffx/ai/hooks.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { ronsoAi } from '../../../src/battle/ffx/ai/biran-yenke.ts';
import { learnRonsoRage } from '../../../src/battle/ffx/ronso-rage.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { buildKimahriTrialParty } from '../../../src/data/ffx/builds/kimahri-trial.ts';
import * as H from '../helpers/ronsoDrive.ts';

const { BIRAN, YENKE, KIM, SAME_SIDE } = H;

/** A real battle on the formation with the events of everything run on it collected. */
function ctxOn(seed = 1, party = buildKimahriTrialParty()): { ctx: Ctx; log: BattleEvent[] } {
  const log: BattleEvent[] = [];
  const ctx = buildBattle(H.setup(seed, party), new SeededRng(seed), H.content, (e) => void log.push(e as BattleEvent));
  return { ctx, log };
}
const who = (ctx: Ctx, id: string): FFXCombatant => ctx.state.combatants[id] as FFXCombatant;
const run = (ctx: Ctx, actor: string, command: Command): void => void executeCommand(ctx, who(ctx, actor), command, true);
const lancetOn = (target: string): Command => ({ kind: 'ability', id: 'lancet', targets: [target] });
const plainAttack = (target: string): Command => ({ kind: 'attack', targets: [target] });
const rageOn = (id: string, target: string): Command => ({ kind: 'overdrive', id, targets: [target] });
const learntOf = (log: readonly BattleEvent[]): string[] => H.learned(log);
/** Arm the half-HP action the way a turn start does, then take the brother's turn on the real script and run what it chose. */
function takeTurn(ctx: Ctx, id: string): Command | null {
  const c = who(ctx, id);
  runPreTurn(ctx, c);
  const cmd = ronsoAi(aiContextFor(ctx, c));
  if (cmd) executeCommand(ctx, c, cmd, true);
  return cmd;
}
const belowHalf = (c: FFXCombatant): void => void (c.hp = Math.trunc(c.stats.maxHp / 2) - 1);

// ------------------------------------------------------------------------------------------------------------------------ the cycles

describe("the cycles (RE section 5.3): Biran Thunder, Bulldoze, Blizzard, Bulldoze; Yenke Fire Breath, Aqua Breath, Bulldoze", () => {
  it('repeat in order, always at Kimahri, and the whole fight draws no random number from either script', () => {
    const e = H.newEngine(1);
    H.runDefending(e, (en) => H.actions(H.log(en), BIRAN).length >= 8 && H.actions(H.log(en), YENKE).length >= 6);
    expect(H.actions(H.log(e), BIRAN).slice(0, 8)).toEqual(['thunder', 'ronso-bulldoze', 'blizzard', 'ronso-bulldoze', 'thunder', 'ronso-bulldoze', 'blizzard', 'ronso-bulldoze']);
    expect(H.actions(H.log(e), YENKE).slice(0, 6)).toEqual(['ronso-fire-breath', 'ronso-aqua-breath', 'ronso-bulldoze', 'ronso-fire-breath', 'ronso-aqua-breath', 'ronso-bulldoze']);
    for (const ev of H.log(e)) if (ev.type === 'action-start' && (ev.actorId === BIRAN || ev.actorId === YENKE)) expect(ev.targets, `${ev.actorId} ${ev.abilityId}`).toEqual([KIM]);
  });

  it('never use the random stream: the script is run with every stream made to throw', () => {
    const { ctx } = ctxOn(1);
    const throwing = new Proxy({}, { get: () => () => { throw new Error('the Ronso script drew a random number'); } });
    const real = ctx.rng;
    (ctx as unknown as { rng: unknown }).rng = throwing;
    try {
      for (const id of [BIRAN, YENKE, BIRAN, YENKE, BIRAN, YENKE]) {
        const c = who(ctx, id);
        expect(() => ronsoAi(aiContextFor(ctx, c))).not.toThrow();
      }
    } finally {
      (ctx as unknown as { rng: unknown }).rng = real;
    }
  });

  it('Bulldoze never misses, whatever Kimahri\'s Evasion (accuracy formula 0: rule 5)', () => {
    const e = H.newEngine(2);
    H.actor(e, KIM).stats.eva = 255;
    H.runDefending(e, (en) => H.actions(H.log(en), BIRAN).filter((a) => a === 'ronso-bulldoze').length >= 4 && H.actions(H.log(en), YENKE).filter((a) => a === 'ronso-bulldoze').length >= 2);
    const bulldozeSeqs = H.log(e).filter((ev) => ev.type === 'action-start' && ev.abilityId === 'ronso-bulldoze').map((ev) => ev.seq);
    expect(bulldozeSeqs.length).toBeGreaterThanOrEqual(6);
    expect(H.log(e).filter((ev) => ev.type === 'miss' && ev.reason === 'evaded')).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the sides

describe('the sides (RE sections 4 and 5.3): both start together, a Bulldoze swaps the user, and the flag reads it', () => {
  it('starts together; Biran\'s first Bulldoze (his 2nd turn) leaves them apart; Yenke\'s Bulldoze (his 3rd) brings the one who moves level again', () => {
    const e = H.newEngine(1);
    expect(H.flags(e)[SAME_SIDE]).toBe(1);
    const area = { [BIRAN]: 0, [YENKE]: 0 } as Record<string, number>;
    const seenApart: boolean[] = [];
    for (let i = 0; i < 30; i++) {
      H.nextInput(e);
      // Replay the log so far on a model: a Bulldoze flips its user's side.
      area[BIRAN] = 0;
      area[YENKE] = 0;
      for (const ev of H.log(e)) if (ev.type === 'action-start' && ev.abilityId === 'ronso-bulldoze') area[ev.actorId] = area[ev.actorId] === 0 ? 1 : 0;
      expect(H.flags(e)[SAME_SIDE] === 1, `after ${i} inputs`).toBe(area[BIRAN] === area[YENKE]);
      seenApart.push(H.flags(e)[SAME_SIDE] === 0);
      e.submit(H.defend());
      if (i > 12) break;
    }
    expect(seenApart.some(Boolean)).toBe(true);
    expect(seenApart.some((a) => !a)).toBe(true);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the half-HP Rage

describe("the half-HP Rage (RE sections 5.2, 5.3): his own Ronso Rage, once, on both brothers when they stand together, else on himself", () => {
  it('arms only STRICTLY below max HP / 2 (integer): exactly half does nothing', () => {
    const { ctx } = ctxOn(1);
    const b = who(ctx, BIRAN);
    b.hp = Math.trunc(b.stats.maxHp / 2);
    runPreTurn(ctx, b);
    expect(rtOf(ctx, BIRAN).ai['halfHp'] ?? 0).toBe(0);
    b.hp -= 1;
    runPreTurn(ctx, b);
    expect(rtOf(ctx, BIRAN).ai['halfHp']).toBe(128);
  });

  it("Biran, together with Yenke: Mighty Guard on BOTH (Shell and Protect, four Nul charges), the cycle does not advance, and it is cast once", () => {
    const { ctx, log } = ctxOn(1);
    belowHalf(who(ctx, BIRAN));
    expect(takeTurn(ctx, BIRAN)).toMatchObject({ kind: 'ability', id: 'biran-mighty-guard', targets: [BIRAN, YENKE] });
    for (const id of [BIRAN, YENKE]) {
      for (const s of ['shell', 'protect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost'] as const) expect(who(ctx, id).statuses[s], `${id} ${s}`).toBeDefined();
    }
    expect(who(ctx, BIRAN).statuses['nulfrost']?.charges).toBe(1);
    expect(ctx.state.flags['ronso.gate.biran-ronso']).toBe(1);
    // The next turns are the cycle from its first step, and the Rage never comes again.
    const next = [takeTurn(ctx, BIRAN), takeTurn(ctx, BIRAN), takeTurn(ctx, BIRAN), takeTurn(ctx, BIRAN), takeTurn(ctx, BIRAN)].map((c) => (c?.kind === 'ability' ? c.id : c?.kind));
    expect(next).toEqual(['thunder', 'ronso-bulldoze', 'blizzard', 'ronso-bulldoze', 'thunder']);
    expect(log.filter((e) => e.type === 'action-start' && e.abilityId === 'biran-mighty-guard')).toHaveLength(1);
  });

  it('Biran, apart from Yenke: the Rage covers only himself', () => {
    const { ctx } = ctxOn(1);
    takeTurn(ctx, BIRAN); // Thunder
    takeTurn(ctx, BIRAN); // Bulldoze: he changes sides
    expect(ctx.state.flags[SAME_SIDE]).toBe(0);
    belowHalf(who(ctx, BIRAN));
    expect(takeTurn(ctx, BIRAN)).toMatchObject({ id: 'biran-mighty-guard', targets: [BIRAN] });
    expect(who(ctx, BIRAN).statuses['shell']).toBeDefined();
    expect(who(ctx, YENKE).statuses['shell']).toBeUndefined();
  });

  it("Yenke's is White Wind: it heals, and on both brothers while they stand together", () => {
    const { ctx } = ctxOn(1);
    belowHalf(who(ctx, YENKE));
    who(ctx, BIRAN).hp -= 1_000;
    const hurtB = who(ctx, BIRAN).hp;
    const hurtY = who(ctx, YENKE).hp;
    expect(takeTurn(ctx, YENKE)).toMatchObject({ id: 'yenke-white-wind', targets: [YENKE, BIRAN] });
    expect(who(ctx, YENKE).hp).toBeGreaterThan(hurtY);
    expect(who(ctx, BIRAN).hp).toBeGreaterThan(hurtB);
    expect(ctx.state.flags['ronso.gate.yenke-ronso']).toBe(1);
  });

  it('is cancelled for good when his brother has already fallen: he never spends it, and Lancet never offers it', () => {
    const { ctx } = ctxOn(1);
    who(ctx, YENKE).hp = 0;
    who(ctx, YENKE).alive = false;
    belowHalf(who(ctx, BIRAN));
    const cmd = takeTurn(ctx, BIRAN);
    expect(cmd).toMatchObject({ kind: 'ability', id: 'ronso-berserk', targets: [BIRAN] }); // the partner-dead branch comes first, never the Rage
    expect(rtOf(ctx, BIRAN).ai['halfHp']).toBe(255);
    expect(ctx.state.flags['ronso.gate.biran-ronso']).toBeUndefined();
  });
});

// ------------------------------------------------------------------------------------------------------------------------ a brother falls

describe('when a brother falls (RE sections 5.2 to 5.4): the survivor grows stronger', () => {
  it('Biran falls: Yenke\'s MAG becomes floor(MAG / 4) x 5, he casts Haste on himself, his AGI becomes Kimahri\'s minus 4, and his cycle goes on', () => {
    const { ctx } = ctxOn(1);
    expect(who(ctx, YENKE).stats.mag).toBe(19);
    who(ctx, BIRAN).hp = 0;
    who(ctx, BIRAN).alive = false;
    const first = takeTurn(ctx, YENKE);
    expect(who(ctx, YENKE).stats.mag).toBe(20); // 19 / 4 = 4, x 5
    expect(first).toMatchObject({ kind: 'ability', id: 'haste', targets: [YENKE] });
    expect(who(ctx, YENKE).statuses['haste']).toBeDefined();
    expect(who(ctx, YENKE).stats.agi).toBe(14); // Kimahri's 18 minus 4 (it was 10)
    const rest = [takeTurn(ctx, YENKE), takeTurn(ctx, YENKE), takeTurn(ctx, YENKE)].map((c) => (c?.kind === 'ability' ? c.id : c?.kind));
    expect(rest).toEqual(['ronso-fire-breath', 'ronso-aqua-breath', 'ronso-bulldoze']);
    expect(who(ctx, YENKE).stats.mag).toBe(20); // raised once, not each turn
  });

  it('Yenke falls: Biran\'s STR becomes floor(STR / 4) x 5, and he puts Berserk on himself (it lands: chance 120 against his byte 0)', () => {
    const { ctx } = ctxOn(1);
    expect(who(ctx, BIRAN).stats.str).toBe(23);
    who(ctx, YENKE).hp = 0;
    who(ctx, YENKE).alive = false;
    const first = takeTurn(ctx, BIRAN);
    expect(who(ctx, BIRAN).stats.str).toBe(25); // 23 / 4 = 5, x 5
    expect(first).toMatchObject({ kind: 'ability', id: 'ronso-berserk', targets: [BIRAN] });
    expect(who(ctx, BIRAN).statuses['berserk']).toBeDefined();
  });

  it('on a whole fight a Berserk Biran swings every turn (the forced attack, no more Thunder or Blizzard)', () => {
    const e = H.newEngine(3);
    // A Rage that is not the plain Attack, so nobody stands guard: give Kimahri a full gauge and Thrust Kick before his turn comes.
    H.actor(e, KIM).overdrive!.unlockedOverdriveIds.push('thrust-kick');
    H.actor(e, KIM).overdrive!.gauge = 100;
    const input = H.nextInput(e);
    H.actor(e, YENKE).hp = 1; // after the brothers' turns, so Yenke has not healed himself
    const kick = H.rage(input, 'thrust-kick', YENKE);
    expect(kick, 'Thrust Kick is offered').not.toBeNull();
    e.submit(kick!);
    expect(H.actor(e, YENKE).alive).toBe(false);
    H.runDefending(e, (en) => H.actions(H.log(en), BIRAN).includes('ronso-berserk') && H.actions(H.log(en), BIRAN).length >= H.actions(H.log(en), BIRAN).indexOf('ronso-berserk') + 4);
    const mine = H.actions(H.log(e), BIRAN);
    const afterBerserk = mine.slice(mine.indexOf('ronso-berserk') + 1);
    expect(afterBerserk.length).toBeGreaterThanOrEqual(3);
    for (const a of afterBerserk) expect(a).toBe('attack'); // the engine's forced swing: never Thunder, Blizzard or the cycle
    expect(H.actor(e, BIRAN).statuses['berserk']).toBeDefined();
  });

  it('Yenke cannot be Berserked at all (byte 255): a Berserk move lands nothing on him', () => {
    const { ctx } = ctxOn(1);
    const y = who(ctx, YENKE);
    expect(y.immunities['berserk']).toBe(255);
    // Biran's own Berserk row, aimed at Yenke by a test, finds the immunity.
    executeCommand(ctx, who(ctx, BIRAN), { kind: 'ability', id: 'ronso-berserk', targets: [YENKE] }, true);
    expect(y.statuses['berserk']).toBeUndefined();
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the defence swap

describe("the defence swap (RE section 5.6): only Kimahri's plain Attack, only while the brothers stand together", () => {
  it('a plain Attack on Biran puts Yenke\'s DEF at 254 with Sentinel on; the hit is covered, and he is released after it (DEF back to 30, Sentinel off)', () => {
    const { ctx, log } = ctxOn(1);
    run(ctx, KIM, plainAttack(BIRAN));
    const adds = log.filter((e) => e.type === 'status-add' && e.status === 'sentinel');
    expect(adds).toHaveLength(1);
    expect(adds[0]).toMatchObject({ targetId: YENKE });
    const dmg = log.filter((e) => e.type === 'damage');
    expect(dmg).toHaveLength(1);
    expect(dmg[0]).toMatchObject({ targetId: YENKE }); // the Sentinel Yenke covers Biran: the blow lands on the guard, tiny against DEF 254
    expect((dmg[0] as { amount: number }).amount).toBeLessThan(50);
    expect(who(ctx, YENKE).statuses['sentinel']).toBeUndefined(); // released by his own hit
    expect(who(ctx, YENKE).stats.def).toBe(30);
    expect(who(ctx, BIRAN).hp).toBe(who(ctx, BIRAN).stats.maxHp); // the hit brother is not changed
  });

  it("Jump, Thrust Kick and every Rage never trigger it, and neither do Lancet or an item", () => {
    for (const cmd of [rageOn('jump', BIRAN), rageOn('thrust-kick', BIRAN), lancetOn(BIRAN), { kind: 'item', id: 'grenade', targets: [BIRAN] } as Command]) {
      const { ctx, log } = ctxOn(1);
      who(ctx, KIM).overdrive!.unlockedOverdriveIds.push('thrust-kick');
      who(ctx, KIM).overdrive!.gauge = 100;
      run(ctx, KIM, cmd);
      expect(log.filter((e) => e.type === 'status-add' && e.status === 'sentinel'), JSON.stringify(cmd)).toEqual([]);
      expect(who(ctx, YENKE).stats.def, JSON.stringify(cmd)).toBe(30);
    }
  });

  it('while the brothers are apart nobody guards: the plain Attack lands in full on the brother it names', () => {
    const { ctx, log } = ctxOn(1);
    takeTurn(ctx, BIRAN); // Thunder
    takeTurn(ctx, BIRAN); // Bulldoze: apart
    expect(ctx.state.flags[SAME_SIDE]).toBe(0);
    log.length = 0;
    run(ctx, KIM, plainAttack(BIRAN));
    expect(log.filter((e) => e.type === 'status-add' && e.status === 'sentinel')).toEqual([]);
    const hit = log.find((e) => e.type === 'damage') as { targetId: string; amount: number };
    expect(hit.targetId).toBe(BIRAN);
    expect(hit.amount).toBeGreaterThan(300); // against 8 when guarded
  });

  it('needs a living partner: with Yenke down a plain Attack on Biran raises nothing', () => {
    const { ctx, log } = ctxOn(1);
    who(ctx, YENKE).hp = 0;
    who(ctx, YENKE).alive = false;
    run(ctx, KIM, plainAttack(BIRAN));
    expect(log.filter((e) => e.type === 'status-add' && e.status === 'sentinel')).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ Lancet's lessons

describe("Lancet teaches one Ronso Rage a cast (RE section 7), fills the gauge, and only the two brothers teach", () => {
  it("Biran: Thrust Kick, Self-Destruct, Doom; the fourth cast teaches nothing; once he has queued his own Mighty Guard the next cast teaches it", () => {
    const { ctx, log } = ctxOn(1);
    const k = who(ctx, KIM);
    expect(k.overdrive!.unlockedOverdriveIds).toEqual(['jump']);
    expect(k.overdrive!.gauge).toBe(45);
    for (let i = 0; i < 4; i++) run(ctx, KIM, lancetOn(BIRAN));
    expect(learntOf(log)).toEqual(['Thrust Kick', 'Self-Destruct', 'Doom']); // one a cast; Mighty Guard is gated, so the fourth cast taught nothing
    expect(k.overdrive!.unlockedOverdriveIds).toEqual(['jump', 'thrust-kick', 'self-destruct', 'doom']);
    expect(k.overdrive!.gauge).toBe(100);
    expect(log.filter((e) => e.type === 'overdrive-gauge' && e.cause === 'lancet-learn')).toHaveLength(1); // 45 to 100 once; the later learns found it full
    belowHalf(who(ctx, BIRAN));
    takeTurn(ctx, BIRAN); // he queues Mighty Guard
    run(ctx, KIM, lancetOn(BIRAN));
    expect(learntOf(log).at(-1)).toBe('Mighty Guard');
    expect(k.overdrive!.unlockedOverdriveIds.at(-1)).toBe('mighty-guard');
    run(ctx, KIM, lancetOn(BIRAN));
    expect(learntOf(log)).toHaveLength(4); // all four known: nothing more to teach
  });

  it("Yenke: Fire Breath, Aqua Breath, Stone Breath, then White Wind once he has queued his own", () => {
    const { ctx, log } = ctxOn(1);
    for (let i = 0; i < 4; i++) run(ctx, KIM, lancetOn(YENKE));
    expect(learntOf(log)).toEqual(['Fire Breath', 'Aqua Breath', 'Stone Breath']);
    belowHalf(who(ctx, YENKE));
    takeTurn(ctx, YENKE);
    run(ctx, KIM, lancetOn(YENKE));
    expect(learntOf(log).at(-1)).toBe('White Wind');
  });

  it("never teaches a Rage Kimahri already knows: with the preset's Rages (Mighty Guard, White Wind) the first row he lacks is next, and the gate does not matter for a known one", () => {
    const { ctx, log } = ctxOn(1, buildKimahriTrialParty(true));
    const k = who(ctx, KIM);
    expect(k.overdrive!.unlockedOverdriveIds).toEqual(['jump', 'mighty-guard', 'white-wind']);
    for (let i = 0; i < 5; i++) run(ctx, KIM, lancetOn(BIRAN));
    expect(learntOf(log)).toEqual(['Thrust Kick', 'Self-Destruct', 'Doom']);
    expect(k.overdrive!.unlockedOverdriveIds.filter((id) => id === 'mighty-guard')).toHaveLength(1);
  });

  it("a Berserk Biran still teaches what the note's script writes: his Mighty Guard is never offered (his half-HP action is cancelled), the other three are", () => {
    const { ctx, log } = ctxOn(1);
    who(ctx, YENKE).hp = 0;
    who(ctx, YENKE).alive = false;
    takeTurn(ctx, BIRAN); // Berserk lands
    expect(who(ctx, BIRAN).statuses['berserk']).toBeDefined();
    for (let i = 0; i < 5; i++) run(ctx, KIM, lancetOn(BIRAN));
    expect(learntOf(log)).toEqual(['Thrust Kick', 'Self-Destruct', 'Doom']);
  });

  it('is inert against everyone else: Seymour Flux teaches nothing, and writes nothing', () => {
    const log: BattleEvent[] = [];
    const ctx = buildBattle({ game: 'ffx', party: gagazetBuild, enemies: ENEMY_GROUPS_BY_ID['seymour-flux']!, triggers: [], seed: 1, condition: 'normal', canEscape: false }, new SeededRng(1), H.content, (e) => void log.push(e as BattleEvent));
    const k = who(ctx, KIM);
    const before = JSON.stringify([k.overdrive, log.length]);
    expect(learnRonsoRage(ctx, k, who(ctx, 'seymour-flux'))).toBeUndefined();
    expect(JSON.stringify([k.overdrive, log.length])).toBe(before);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the end of the battle

describe('the end (RE section 4): a defeat is the normal loss; Self-Destruct ejects the only member', () => {
  it("Kimahri's Self-Destruct on a brother who survives it ejects him: the engine's rule for a party that is all ejected ends the battle (as an escape), it does not hang", () => {
    const e = H.newEngine(4);
    H.actor(e, KIM).overdrive!.unlockedOverdriveIds.push('self-destruct');
    H.actor(e, KIM).overdrive!.gauge = 100;
    H.actor(e, BIRAN).stats.maxHp = 99_999;
    H.actor(e, BIRAN).hp = 99_999;
    const input = H.nextInput(e);
    const boom = H.rage(input, 'self-destruct', BIRAN);
    expect(boom).not.toBeNull();
    e.submit(boom!);
    let d = e.nextDecision();
    for (let i = 0; i < 20 && d.kind !== 'battle-over'; i++) d = e.nextDecision();
    expect(d.kind).toBe('battle-over');
    expect((d as { result: { outcome: string } }).result.outcome).toBe('escape'); // `checkEnd`: every active member ejected; the note does not cover it (RE section 9)
    expect(H.actor(e, KIM).statuses['eject']).toBeDefined();
  });

  it('a Self-Destruct that kills the last brother is a victory (the enemy side is checked first)', () => {
    const e = H.newEngine(5);
    H.actor(e, KIM).overdrive!.unlockedOverdriveIds.push('self-destruct');
    H.actor(e, KIM).overdrive!.gauge = 100;
    const input = H.nextInput(e);
    H.actor(e, BIRAN).hp = 0;
    H.actor(e, BIRAN).alive = false;
    H.actor(e, YENKE).hp = 1;
    const boom = H.rage(input, 'self-destruct', YENKE);
    expect(boom).not.toBeNull();
    e.submit(boom!);
    let d = e.nextDecision();
    for (let i = 0; i < 20 && d.kind !== 'battle-over'; i++) d = e.nextDecision();
    expect((d as { result: { outcome: string } }).result.outcome).toBe('victory');
  });

  it('a party wipe (Kimahri down) is the normal defeat', () => {
    const e = H.newEngine(6);
    H.nextInput(e);
    const k = H.actor(e, KIM);
    k.hp = 1;
    let d = e.nextDecision();
    let over: { result: { outcome: string } } | undefined;
    for (let i = 0; i < 400 && !over; i++) {
      d = e.nextDecision();
      if (d.kind === 'battle-over') over = d as unknown as { result: { outcome: string } };
      else if (d.kind === 'player-input') e.submit(H.defend());
    }
    expect(over?.result.outcome).toBe('defeat');
  });

  it("Escape, Flee and Switch are not on Kimahri's menu", () => {
    const e = H.newEngine(1);
    const input = H.nextInput(e);
    const kinds = input.commands.map((c) => c.command.kind);
    expect(kinds).not.toContain('escape');
    expect(kinds).not.toContain('switch');
    expect(input.commands.some((c) => /^(escape|flee|switch)$/i.test(c.label))).toBe(false);
  });
});
