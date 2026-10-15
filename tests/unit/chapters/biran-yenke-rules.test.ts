/**
 * **Biran and Yenke on the real engine** (the hidden Biran and Yenke chapter; FFX only [AGENTS.md rule 14]). Each case pins one rule of `research/ffx-biran-yenke.md` ("§n") on the real
 * engine and the chapter's own data, with fixed seeds (hard rule 3: run the engine, never grep).
 *
 * Two layers, as the Gui tests have them: one command executed on a real battle built the way the battle screen builds it (`buildBattle` on `setupForChapter`: exact effects, no turn
 * order in the way), and short fights driven through the engine's own decisions (the Ronso's turns, the guarding moving with Bulldoze, the answers to a fall).
 */

import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, Command, FFXCombatant, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { buildBattle, type Ctx } from '../../../src/battle/ffx/index.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { GUARD_STANCE, refreshGuard, rowFlag, together, usedRageFlag } from '../../../src/battle/ffx/ai/biran-yenke-rules.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { BIRAN, YENKE, content, duelEngine, type Input } from '../helpers/ronsoDuel.ts';

const KIMAHRI = 'kimahri';
const chapter = getChapter('biran-yenke')!;

// ---------------------------------------------------------------------------------------------- one command on a real battle

function duelCtx(seed = 1): { ctx: Ctx; log: BattleEvent[] } {
  const log: BattleEvent[] = [];
  const ctx = buildBattle(setupForChapter(chapter, seed), new SeededRng(seed), content, (e) => void log.push(e as BattleEvent));
  return { ctx, log };
}
const who = (ctx: Ctx, id: string): FFXCombatant => ctx.state.combatants[id] as FFXCombatant;
const run = (ctx: Ctx, actor: string, command: Command): void => void executeCommand(ctx, who(ctx, actor), command, true);
const lancet = (target: string): Command => ({ kind: 'ability', id: 'lancet', targets: [target] });
const swingAt = (target: string): Command => ({ kind: 'attack', targets: [target] });
/** Bulldoze has carried Biran to the other row. */
function standApart(ctx: Ctx): void {
  ctx.state.flags[rowFlag(BIRAN)] = 1;
  refreshGuard(ctx, 'quiet');
}
const damage = (log: readonly BattleEvent[], target: string): number[] => log.flatMap((e) => (e.type === 'damage' && e.targetId === target ? [e.amount] : []));
const learnedLines = (log: readonly BattleEvent[]): string[] => log.flatMap((e) => (e.type === 'message' && / learned /.test(e.text) ? [e.text] : []));
const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

// ---------------------------------------------------------------------------------------------- driven fights

/** Advance to Kimahri's next input (the Ronso's turns resolve on the way). */
function nextInput(engine: BattleEngine): Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('battle ended');
  }
  throw new Error('no player input');
}
/** Kimahri cannot fall: the mechanic under test stays the subject. */
function keepUp(engine: BattleEngine): void {
  const k = engine.state().combatants[KIMAHRI]!;
  k.stats.maxHp = 99_999;
  k.hp = 99_999;
  k.mp = k.stats.maxMp;
}
const defend = (): Command => ({ kind: 'defend', targets: [] });
/** Answer Kimahri's turns with `choose` until `stop`. */
function drive(engine: BattleEngine, choose: (d: Input) => Command, stop: (e: BattleEngine) => boolean, max = 400): void {
  for (let i = 0; i < max; i++) {
    keepUp(engine);
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(choose(d));
  }
}
const actionsOf = (engine: BattleEngine, actor: string): string[] =>
  engine.state().log.flatMap((e) => (e.type === 'action-start' && e.actorId === actor ? [e.abilityId ?? e.command.kind] : []));
const ronsoOf = (engine: BattleEngine, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;

describe('the opening (§2.2, §4.4)', () => {
  it('the battle writes both Ronso\'s numbers from Kimahri\'s, puts both on one row and gives both the guarding stance; Kimahri is alone, with no Switch and no Escape', () => {
    const e = duelEngine(1);
    const [b, y] = [ronsoOf(e, BIRAN), ronsoOf(e, YENKE)];
    expect([b.hp, b.stats.maxHp, b.stats.str, b.stats.mag, b.stats.agi]).toEqual([3_208, 3_208, 23, 9, 14]);
    expect([y.hp, y.stats.maxHp, y.stats.str, y.stats.mag, y.stats.agi]).toEqual([2_406, 2_406, 11, 18, 10]);
    for (const r of [b, y]) expect(r.statuses[GUARD_STANCE]?.permanent, r.id).toBe(true);
    expect([e.state().flags[rowFlag(BIRAN)], e.state().flags[rowFlag(YENKE)]]).toEqual([0, 0]);
    expect([e.state().flags[usedRageFlag(BIRAN)], e.state().flags[usedRageFlag(YENKE)]]).toEqual([false, false]);
    expect(e.state().activeIds).toEqual([KIMAHRI]);
    const d = nextInput(e);
    expect(d.actorId).toBe(KIMAHRI);
    expect(d.commands.some((c) => c.command.kind === 'switch' && c.enabled)).toBe(false);
    expect(d.commands.some((c) => c.command.kind === 'escape' && c.enabled)).toBe(false);
  });

  it('a different Kimahri meets different Ronso: the numbers are written in the battle, not read from the data', () => {
    const setup = setupForChapter(chapter, 1);
    const party = structuredClone(setup.party) as FFXPartyBuild; // the setup holds the shipped preset itself: change a copy
    setup.party = party;
    const k = party.members[0]!;
    k.stats = { ...k.stats, str: 40, mag: 30 };
    k.hp = 3_000;
    k.stats.maxHp = 3_000;
    const ctx = buildBattle(setup, new SeededRng(1), content, () => undefined);
    // step 11 (3,000 HP): Biran Str 27, Yenke Mag 22; HP from (40^3 + 30^3) / 2 = 45,500
    expect([who(ctx, BIRAN).stats.str, who(ctx, YENKE).stats.mag, who(ctx, BIRAN).stats.mag, who(ctx, YENKE).stats.str]).toEqual([27, 22, 11, 13]);
    const v = Math.floor(((Math.floor(Math.floor((45_500 * 16) / 15) / 32) + 30) * 586) / 730);
    expect([who(ctx, BIRAN).hp, who(ctx, YENKE).hp]).toEqual([v * 8, v * 6]);
  });
});

describe('the guarding (§4.4): side by side each covers the other, at half; Bulldoze splits them', () => {
  it('together, Kimahri\'s Attack on one lands on the other, at about half of what it does to an uncovered Ronso', () => {
    const covered: number[] = [];
    const open: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const a = duelCtx(seed);
      run(a.ctx, KIMAHRI, swingAt(BIRAN));
      expect(damage(a.log, BIRAN), `seed ${seed}: the aimed Ronso was hit`).toEqual([]);
      covered.push(...damage(a.log, YENKE));
      const b = duelCtx(seed);
      standApart(b.ctx);
      run(b.ctx, KIMAHRI, swingAt(BIRAN));
      expect(damage(b.log, YENKE), `seed ${seed}: apart, nobody covers`).toEqual([]);
      open.push(...damage(b.log, BIRAN));
    }
    expect(covered).toHaveLength(40);
    expect(open).toHaveLength(40);
    const ratio = mean(covered) / mean(open);
    expect(ratio).toBeGreaterThan(0.42);
    expect(ratio).toBeLessThan(0.58);
  });

  it('Lancet and a Ronso Rage are never caught: they land on the Ronso they are aimed at', () => {
    const a = duelCtx(3);
    run(a.ctx, KIMAHRI, lancet(BIRAN));
    expect(damage(a.log, BIRAN).length).toBe(1);
    expect(damage(a.log, YENKE)).toEqual([]);
    const b = duelCtx(3);
    who(b.ctx, KIMAHRI).overdrive!.gauge = 100;
    run(b.ctx, KIMAHRI, { kind: 'overdrive', id: 'jump', targets: [YENKE] });
    expect(damage(b.log, YENKE).length).toBe(1);
    expect(damage(b.log, BIRAN)).toEqual([]);
  });

  it('a Bulldoze moves its user to the other row: they stand apart and drop the stance; the next Bulldoze, by either, brings them back', () => {
    const e = duelEngine(2);
    const log = (): readonly BattleEvent[] => e.state().log;
    const said = (re: RegExp): number => log().filter((x) => x.type === 'message' && re.test(x.text)).length;
    drive(e, defend, () => said(/stand apart/) >= 1);
    const at = log().findIndex((x) => x.type === 'message' && /stand apart/.test(x.text));
    const before = log().slice(0, at).filter((x) => x.type === 'action-start').pop();
    expect(before?.type === 'action-start' ? before.abilityId : '').toBe('ronso-bulldoze');
    expect(together({ state: e.state() })).toBe(false);
    for (const id of [BIRAN, YENKE]) expect(ronsoOf(e, id).statuses[GUARD_STANCE], id).toBeUndefined();
    drive(e, defend, () => said(/close ranks/) >= 1);
    const back = log().findIndex((x) => x.type === 'message' && /close ranks/.test(x.text));
    const mover = log().slice(0, back).filter((x) => x.type === 'action-start').pop();
    expect(mover?.type === 'action-start' ? mover.abilityId : '').toBe('ronso-bulldoze');
    expect(together({ state: e.state() })).toBe(true);
    for (const id of [BIRAN, YENKE]) expect(ronsoOf(e, id).statuses[GUARD_STANCE]?.permanent, id).toBe(true);
  });

  it('the first Bulldoze of the fight is always Biran\'s, and it always parts them (the story\'s callout says so): 60 seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const e = duelEngine(seed);
      drive(e, defend, (en) => actionsOf(en, BIRAN).includes('ronso-bulldoze') || actionsOf(en, YENKE).includes('ronso-bulldoze'));
      const firstBy = e.state().log.find((x) => x.type === 'action-start' && x.abilityId === 'ronso-bulldoze');
      expect(firstBy?.type === 'action-start' ? firstBy.actorId : '', `seed ${seed}`).toBe(BIRAN);
      expect(together({ state: e.state() }), `seed ${seed}`).toBe(false);
    }
  });
});

describe('below a quarter: Mighty Guard and White Wind, once each (§4.2)', () => {
  it('Biran under a quarter casts Mighty Guard on both while together, once, and can teach it from then on; at exactly a quarter he does not', () => {
    const e = duelEngine(4);
    ronsoOf(e, BIRAN).hp = 801; // 801 x 4 < 3,208
    drive(e, defend, (en) => actionsOf(en, BIRAN).length >= 2);
    expect(actionsOf(e, BIRAN).slice(0, 2)).toEqual(['biran-mighty-guard', 'thunder']);
    expect(e.state().flags[usedRageFlag(BIRAN)]).toBe(true);
    for (const id of [BIRAN, YENKE]) for (const s of ['protect', 'shell']) expect(ronsoOf(e, id).statuses[s as 'protect'], `${id} ${s}`).toBeDefined();
    const q = duelEngine(4);
    ronsoOf(q, BIRAN).hp = 802; // exactly a quarter
    drive(q, defend, (en) => actionsOf(en, BIRAN).length >= 1);
    expect(actionsOf(q, BIRAN)[0]).toBe('thunder');
  });

  it('apart, Mighty Guard covers Biran alone', () => {
    const e = duelEngine(4);
    e.state().flags[rowFlag(BIRAN)] = 1;
    ronsoOf(e, BIRAN).hp = 700;
    drive(e, defend, (en) => actionsOf(en, BIRAN).length >= 1);
    expect(actionsOf(e, BIRAN)[0]).toBe('biran-mighty-guard-self');
    expect(ronsoOf(e, BIRAN).statuses.protect).toBeDefined();
    expect(ronsoOf(e, YENKE).statuses.protect).toBeUndefined();
  });

  it('Yenke under a quarter calls White Wind, which heals both while together; then his loop goes on', () => {
    const e = duelEngine(5);
    ronsoOf(e, YENKE).hp = 601; // 601 x 4 < 2,406
    ronsoOf(e, BIRAN).hp = 1_000;
    drive(e, defend, (en) => actionsOf(en, YENKE).length >= 2);
    expect(actionsOf(e, YENKE).slice(0, 2)).toEqual(['yenke-white-wind', 'yenke-fire-breath']);
    expect(e.state().flags[usedRageFlag(YENKE)]).toBe(true);
    // a heal is a damage event with a negative amount, one per target of the one cast
    const at = e.state().log.findIndex((x) => x.type === 'action-start' && x.abilityId === 'yenke-white-wind');
    const healed = e.state().log.slice(at).flatMap((x) => (x.type === 'damage' && x.amount < 0 && x.sourceId === YENKE ? [x.targetId] : []));
    expect(new Set(healed)).toEqual(new Set([BIRAN, YENKE]));
  });
});

describe('when one falls (§4.3)', () => {
  it('Yenke first: Biran casts Berserk on himself and from then on only swings his default attack, Bulldoze', () => {
    const e = duelEngine(6);
    ronsoOf(e, YENKE).hp = 1;
    const d = nextInput(e);
    e.submit({ ...d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'lancet')!.command, targets: [YENKE] } as Command);
    expect(ronsoOf(e, YENKE).hp).toBe(0);
    drive(e, defend, (en) => actionsOf(en, BIRAN).length >= 4);
    const after = e.state().log.findIndex((x) => x.type === 'ko' && x.targetId === YENKE);
    const biranAfter = e.state().log.slice(after).flatMap((x) => (x.type === 'action-start' && x.actorId === BIRAN ? [x.abilityId ?? x.command.kind] : []));
    expect(biranAfter[0]).toBe('biran-berserk');
    expect(ronsoOf(e, BIRAN).statuses.berserk).toBeDefined();
    expect(biranAfter.slice(1, 3)).toEqual(['attack', 'attack']);
    expect(ronsoOf(e, BIRAN).statuses[GUARD_STANCE]).toBeUndefined();
  });

  it('Biran first: Yenke casts Haste on himself', () => {
    const e = duelEngine(7);
    ronsoOf(e, BIRAN).hp = 1;
    const d = nextInput(e);
    e.submit({ ...d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'lancet')!.command, targets: [BIRAN] } as Command);
    expect(ronsoOf(e, BIRAN).hp).toBe(0);
    drive(e, defend, (en) => actionsOf(en, YENKE).length >= 3);
    const after = e.state().log.findIndex((x) => x.type === 'ko' && x.targetId === BIRAN);
    const yenkeAfter = e.state().log.slice(after).flatMap((x) => (x.type === 'action-start' && x.actorId === YENKE ? [x.abilityId ?? x.command.kind] : []));
    expect(yenkeAfter[0]).toBe('haste');
    expect(ronsoOf(e, YENKE).statuses.haste).toBeDefined();
  });
});

describe('what Lancet teaches (§4.5)', () => {
  it('Yenke: Fire Breath, Stone Breath, Aqua Breath, one per Lancet, each filling the gauge; then nothing until he has used White Wind', () => {
    const { ctx, log } = duelCtx(8);
    const k = who(ctx, KIMAHRI);
    expect(k.overdrive!.gauge).toBe(45);
    run(ctx, KIMAHRI, lancet(YENKE));
    expect(k.overdrive!.gauge).toBe(100);
    for (let i = 0; i < 3; i++) {
      k.overdrive!.gauge = 10;
      run(ctx, KIMAHRI, lancet(YENKE));
    }
    expect(learnedLines(log)).toEqual(['Kimahri learned Fire Breath!', 'Kimahri learned Stone Breath!', 'Kimahri learned Aqua Breath!']);
    expect(k.overdrive!.gauge).toBe(10); // the fourth taught nothing, and the gauge did not move
    ctx.state.flags[usedRageFlag(YENKE)] = true;
    run(ctx, KIMAHRI, lancet(YENKE));
    expect(learnedLines(log).pop()).toBe('Kimahri learned White Wind!');
    expect(k.overdrive!.gauge).toBe(100);
    expect(k.overdrive!.unlockedOverdriveIds).toEqual(['jump', 'fire-breath', 'stone-breath', 'aqua-breath', 'white-wind']);
  });

  it('Biran: Self-Destruct, Thrust Kick, Doom; Mighty Guard only after he has used it', () => {
    const { ctx, log } = duelCtx(9);
    for (let i = 0; i < 4; i++) run(ctx, KIMAHRI, lancet(BIRAN));
    expect(learnedLines(log)).toEqual(['Kimahri learned Self-Destruct!', 'Kimahri learned Thrust Kick!', 'Kimahri learned Doom!']);
    ctx.state.flags[usedRageFlag(BIRAN)] = true;
    run(ctx, KIMAHRI, lancet(BIRAN));
    expect(learnedLines(log).pop()).toBe('Kimahri learned Mighty Guard!');
  });

  it('a Rage once learned is on Kimahri\'s Overdrive menu at his next turn', () => {
    const e = duelEngine(10);
    const d = nextInput(e);
    e.submit({ ...d.commands.find((c) => c.command.kind === 'ability' && 'id' in c.command && c.command.id === 'lancet')!.command, targets: [YENKE] } as Command);
    const next = nextInput(e);
    expect(next.commands.some((c) => c.enabled && c.command.kind === 'overdrive' && 'id' in c.command && c.command.id === 'fire-breath')).toBe(true);
  });

  it('inert elsewhere: Lancet in Chapter I teaches nothing and the Ronso flags are not written', () => {
    const log: BattleEvent[] = [];
    const flux = ENEMY_GROUPS_BY_ID['seymour-flux']!;
    const ctx = buildBattle({ game: 'ffx', party: gagazetBuild, enemies: flux, triggers: [], seed: 1, condition: 'normal', canEscape: false }, new SeededRng(1), content, (e) => void log.push(e as BattleEvent));
    const before = [...(who(ctx, KIMAHRI).overdrive?.unlockedOverdriveIds ?? [])];
    run(ctx, KIMAHRI, lancet('seymour-flux'));
    expect(learnedLines(log)).toEqual([]);
    expect(who(ctx, KIMAHRI).overdrive?.unlockedOverdriveIds).toEqual(before);
    expect(Object.keys(ctx.state.flags).filter((f) => f.startsWith('ronso.'))).toEqual([]);
  });
});

describe('what the fight does not have (§4.6)', () => {
  it('Self-Destruct takes Kimahri out of the battle and ends it without a victory (the guide says never to use it)', () => {
    const e = duelEngine(11);
    const k = e.state().combatants[KIMAHRI] as FFXCombatant;
    k.overdrive!.unlockedOverdriveIds.push('self-destruct');
    k.overdrive!.gauge = 100;
    const d = nextInput(e);
    const row = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive' && 'id' in c.command && c.command.id === 'self-destruct');
    expect(row).toBeDefined();
    e.submit({ ...row!.command, targets: [row!.validTargets[0] ?? BIRAN] } as Command);
    for (let i = 0; i < 200; i++) {
      const next = e.nextDecision();
      if (next.kind === 'battle-over') break;
      if (next.kind === 'player-input') e.submit(defend());
    }
    expect(e.state().result).toBeDefined();
    expect(e.state().result?.outcome).not.toBe('victory');
  });
});
