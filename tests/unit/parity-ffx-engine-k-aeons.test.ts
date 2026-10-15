/**
 * **Engine-level parity, the player's Yojimbo and the Magus Sisters** (re-parity lane FFX-K; **FFX only**).
 *
 * `parity-ffx-yojimbo.test.ts` and `parity-ffx-sisters.test.ts` prove the kernels against the game's own code. This file proves the WIRING: a TEST build that
 * owns Yojimbo and the Sisters (nothing ships them) goes through the whole engine against a test enemy, and what the engine did is compared with an oracle
 * written out again from the note's prose (`helpers/ffxKOracle.ts`, no import of the kernels or the adapters) over the raw draws the engine took (the test taps
 * the generator). The draws themselves are checked too: which stream, in which order, how many.
 *
 * The test values below (his compatibility, the Sisters' motivation, the test enemy) are the test's own; the real chapter's are its builder's.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEvent, Command, Decision, FFXCombatant, FFXPartyBuild } from '../../src/battle/common/types.ts';
import type { GameStreams } from '../../src/battle/common/streams.ts';
import { FFXContentRegistry, createFFXEngine, type FFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { carryPartyForward } from '../../src/app/screens/BattleScreenSetup.ts';
import { PAY_ABILITY_ID } from '../../src/battle/ffx/aeon-commands.ts';
import { aeon, enemy, member, party, setup, stats } from './ffx-fixtures.test.ts';
import { commandBySum, DELTA, freeAttack, payDecision, sisterMenu } from './helpers/ffxKOracle.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

interface Tap {
  stream: number;
  value: number;
}

/** One engine on a test build, with every draw of the game's generator recorded. */
class Rig {
  readonly engine: FFXEngine;
  readonly taps: Tap[] = [];
  readonly events: BattleEvent[] = [];
  readonly party: FFXPartyBuild;

  constructor(party_: FFXPartyBuild, enemies = [enemy({ id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }) })], seed = 7) {
    this.party = party_;
    this.engine = createFFXEngine({ content, autoResolveMinigames: true });
    this.engine.init(setup({ party: party_, enemies: { id: 'k-test', game: 'ffx', enemies, canEscape: false }, seed, condition: 'scripted' }));
    (this.engine as unknown as { rng: GameStreams }).rng.tap = (stream, value) => void this.taps.push({ stream, value });
  }

  get state() {
    return this.engine.state();
  }

  fighter(id: string): FFXCombatant {
    return this.state.combatants[id] as FFXCombatant;
  }

  /** The next player turn (resolving every other turn on the way), or the decision that ended the battle. */
  nextInput(max = 200): Extract<Decision, { kind: 'player-input' }> {
    for (let i = 0; i < max; i++) {
      const d = this.engine.nextDecision();
      if (d.kind === 'player-input') return d;
      if (d.kind === 'battle-over') throw new Error(`the battle ended: ${d.result.outcome}`);
      if (d.kind === 'resolved') this.events.push(...d.events);
    }
    throw new Error('no player turn');
  }

  /** Advance to `who`'s turn; every other player turn is answered with Defend. */
  until(who: string): Extract<Decision, { kind: 'player-input' }> {
    for (let i = 0; i < 60; i++) {
      const d = this.nextInput();
      if (d.actorId === who) return d;
      this.events.push(...this.engine.submit({ kind: 'defend', targets: [] }));
    }
    throw new Error(`${who} never got a turn`);
  }

  submit(command: Command): BattleEvent[] {
    const out = this.engine.submit(command);
    this.events.push(...out);
    return out;
  }

  /** The draws of the given streams since `from`, in order. */
  draws(from: number, ...streams: number[]): Tap[] {
    return this.taps.slice(from).filter((t) => streams.includes(t.stream));
  }
}

/** The party of the tests: Yuna acts first, then Tidus and Auron; the aeons are the caller's. */
function build(over: Partial<FFXPartyBuild> & { aeons: FFXPartyBuild['aeons'] }): FFXPartyBuild {
  const members = [
    member({ id: 'tidus', stats: stats({ agi: 30, hp: 5000, maxHp: 5000 }) }),
    member({ id: 'yuna', stats: stats({ agi: 60, hp: 5000, maxHp: 5000 }) }),
    member({ id: 'auron', stats: stats({ agi: 20, hp: 5000, maxHp: 5000 }) }),
  ];
  return party({ members, gil: 100_000, ...over });
}

const yojimbo = (gauge = 0, agi = 40): FFXPartyBuild['aeons'][number] =>
  aeon({ id: 'yojimbo', stats: stats({ hp: 4000, maxHp: 4000, mp: 0, maxMp: 0, agi, str: 60 }), overdriveGauge: gauge });

/** The Sisters, at the Agility the note works its example with (Cindy 40, Sandy 40, Mindy 100). */
const sisters = (gauge = 0): FFXPartyBuild['aeons'] => [
  aeon({ id: 'cindy', stats: stats({ hp: 6000, maxHp: 6000, mp: 200, maxMp: 200, agi: 40, str: 60 }), overdriveGauge: gauge }),
  aeon({ id: 'sandy', stats: stats({ hp: 5000, maxHp: 5000, mp: 100, maxMp: 100, agi: 40, str: 60 }), overdriveGauge: gauge }),
  aeon({ id: 'mindy', stats: stats({ hp: 3000, maxHp: 3000, mp: 300, maxMp: 300, agi: 100, str: 60 }), overdriveGauge: gauge }),
];

const SUMMON = (id: string): Command => ({ kind: 'summon', id, targets: [] });
const PAY = (gilSpent: number): Command => ({ kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent });
const DISMISS: Command = { kind: 'dismiss', targets: [] };
const ids = (rows: readonly AvailableCommand[]): string[] => rows.map((r) => (r.command.kind === 'ability' ? r.command.id : r.command.kind));

/** The action-start events of a stretch of the log, as `[actor, ability id or name]`. */
const starts = (events: readonly BattleEvent[]): Array<[string, string]> =>
  events.flatMap((e) => (e.type === 'action-start' ? [[e.actorId, e.abilityId ?? e.abilityName ?? '?'] as [string, string]] : []));

describe('a build that owns them must say how they start', () => {
  const run = (p: FFXPartyBuild): void => void new Rig(p);

  it('Yojimbo with no `yojimbo` parameter is an error: his starting compatibility has no default', () => {
    expect(() => run(build({ aeons: [yojimbo()] }))).toThrow(/must give `yojimbo/);
  });

  it('the parameter is checked: a whole compatibility from 0 to 255 and a hire answer of 0, 1 or 2', () => {
    expect(() => run(build({ aeons: [yojimbo()], yojimbo: { compatibility: 256, hireAnswer: 1 } }))).toThrow(RangeError);
    expect(() => run(build({ aeons: [yojimbo()], yojimbo: { compatibility: 12.5, hireAnswer: 1 } }))).toThrow(RangeError);
    expect(() => run(build({ aeons: [yojimbo()], yojimbo: { compatibility: 10, hireAnswer: 3 as 2 } }))).toThrow(RangeError);
    expect(() => run(build({ aeons: [], yojimbo: { compatibility: 10, hireAnswer: 1 } }))).toThrow(/does not list him/);
    expect(() => run(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 0 } }))).not.toThrow();
  });

  it('the Sisters are three or none, and a build that owns them must give their motivation', () => {
    expect(() => run(build({ aeons: sisters() }))).toThrow(/must give `sisters/);
    expect(() => run(build({ aeons: sisters().slice(0, 2), sisters: { motivation: { cindy: 0, sandy: 0, mindy: 0 } } }))).toThrow(/three or not at all/);
    expect(() => run(build({ aeons: sisters(), sisters: { motivation: { cindy: 101, sandy: 0, mindy: 0 } } }))).toThrow(RangeError);
    expect(() => run(build({ aeons: sisters(), sisters: { motivation: { cindy: 0, sandy: 0, mindy: 0 } } }))).not.toThrow();
    expect(() => run(build({ aeons: [], sisters: { motivation: { cindy: 0, sandy: 0, mindy: 0 } } }))).toThrow(/does not list the three/);
  });

  it('a build that owns neither has neither runtime, so no rule of theirs can run', () => {
    const rig = new Rig(build({ aeons: [] }));
    const rt = (rig.engine as unknown as { ctx: { rt: { yojimbo?: unknown; sisters?: unknown } } }).ctx.rt;
    expect([rt.yojimbo, rt.sisters]).toEqual([undefined, undefined]);
  });
});

describe('the player\'s Yojimbo: his menu and his turn start', () => {
  it('his menu is Pay and Dismiss; the compatibility and the gil are published for a chain', () => {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 1 } }));
    expect(rig.state.flags['yojimbo:compatibility']).toBe(0);
    expect(rig.state.flags['yojimbo:gil']).toBe(100_000);
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    const d = rig.until('yojimbo');
    expect(ids(d.commands)).toEqual([PAY_ABILITY_ID, 'dismiss']);
  });

  it('every turn of his opens with one draw of stream 17, and at compatibility 0 it never wins (0 of 256)', () => {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 1 } }));
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    const from = rig.taps.length;
    rig.until('yojimbo');
    expect(rig.draws(from, 17)).toHaveLength(1);
    expect(starts(rig.events).filter(([who]) => who === 'yojimbo')).toEqual([]); // no free attack: the menu opened
  });

  it('a free attack: the turn-start draw wins when (draw & 0xFF) < compatibility div 4, then the script draws once more and the roll chooses the command', () => {
    let wins = 0;
    let menus = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 255, hireAnswer: 1 } }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('yojimbo'));
      const from = rig.taps.length;
      const eventsFrom = rig.events.length;
      // Advance to the next decision that is Yojimbo's (a free attack resolves inside nextDecision; a menu shows as input).
      let acted = false;
      for (let i = 0; i < 40 && !acted; i++) {
        const d = rig.engine.nextDecision();
        if (d.kind === 'resolved') {
          rig.events.push(...d.events);
          acted = d.events.some((e) => e.type === 'turn-start' && e.actorId === 'yojimbo');
        } else {
          acted = d.kind === 'player-input' && d.actorId === 'yojimbo';
          if (!acted && d.kind === 'player-input') rig.events.push(...rig.engine.submit({ kind: 'defend', targets: [] }));
        }
      }
      const y = rig.draws(from, 17);
      expect(y.length).toBeGreaterThanOrEqual(1);
      const a = y[0]!.value;
      const won = (a & 0xff) < Math.floor(255 / 4);
      const took = rig.events.slice(eventsFrom).filter((e) => e.type === 'action-start' && e.actorId === 'yojimbo');
      expect(took.length > 0, `seed ${seed}: the free attack happened exactly when the draw won`).toBe(won);
      if (won) {
        wins++;
        expect(y).toHaveLength(2); // the turn-start draw, then the script's
        const oracle = freeAttack(255, y[0]!.value, y[1]!.value);
        expect(oracle.wins).toBe(true);
        const first = took[0]!;
        expect(first.type === 'action-start' ? first.abilityId : '').toBe(oracle.command);
        const delta = DELTA[oracle.command]!;
        expect(rig.state.flags['yojimbo:compatibility'], `seed ${seed}`).toBe(Math.min(255, Math.max(0, 255 + delta)));
      } else {
        menus++;
        expect(y).toHaveLength(1);
      }
    }
    expect(wins).toBeGreaterThan(0);
    expect(menus).toBeGreaterThan(0);
  });
});

describe('Pay', () => {
  /** A monster Zanmato cannot kill (Death resist 255), so a free attack that comes before the Pay cannot end the battle. */
  const SOLID = { id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }), immunities: { ko: 255 } } as const;

  /**
   * Run one Pay from the start: summon, Yojimbo's turn, the payment. Returns the rig, the draws since Yojimbo's turn opened and the compatibility he had when
   * the menu opened (a free attack at his earlier turns may have moved it from the build's).
   */
  function pay(over: { compat?: number; hire?: 0 | 1 | 2; amount: number; gauge?: number; gil?: number; enemy?: Parameters<typeof enemy>[0]; seed?: number }): { rig: Rig; from: number; before: number; compat: number } {
    const foe = enemy(over.enemy ?? SOLID);
    const rig = new Rig(
      build({ aeons: [yojimbo(over.gauge ?? 0)], yojimbo: { compatibility: over.compat ?? 0, hireAnswer: over.hire ?? 1 }, gil: over.gil ?? 100_000 }),
      [foe],
      over.seed ?? 3,
    );
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    const d = rig.until('yojimbo');
    expect(ids(d.commands)).toContain(PAY_ABILITY_ID);
    const from = rig.taps.length;
    const before = rig.events.length;
    const compat = rig.state.flags['yojimbo:compatibility'] as number;
    rig.submit(PAY(over.amount));
    return { rig, from, before, compat };
  }

  it('a payment: one draw of stream 17 chooses the command by the motivation, the gil is taken, the compatibility moves by the command\'s delta', () => {
    for (const [compat, amount, seed] of [[0, 100, 1], [128, 5000, 2], [200, 100_000, 3], [50, 12, 4], [255, 99_999, 5]] as const) {
      const { rig, from, before, compat: now } = pay({ compat, amount, seed });
      const y = rig.draws(from, 17);
      expect(y, `compat ${compat} paying ${amount}`).toHaveLength(1);
      const want = payDecision({ payment: amount, gil: 100_000, compat: now, hire: 1, zan: 0, gaugeFull: false }, y[0]!.value, 0);
      const log = starts(rig.events.slice(before));
      expect(log[0]).toEqual(['yojimbo', 'Pay']);
      expect(log[1]).toEqual(['yojimbo', want.command]);
      expect(rig.state.flags['yojimbo:gil'], 'the payment was taken').toBe(100_000 - amount);
      expect(rig.state.flags['yojimbo:compatibility']).toBe(Math.min(255, Math.max(0, now + DELTA[want.command]!)));
    }
  });

  it('a group command (Wakizashi on all, Zanmato) draws the group pick on stream 5; a single-target one draws nothing with one monster', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40 && seen.size < 4; seed++) {
      const { rig, from, before } = pay({ compat: 0, amount: 800, seed }); // compatibility 0: no free attack can come before the Pay
      const log = starts(rig.events.slice(before));
      const cmd = log[1]![1];
      seen.add(cmd);
      const picks = rig.draws(from, 4, 5);
      if (cmd === 'wakizashi-multi' || cmd === 'zanmato') expect(picks.map((p) => p.stream), `${cmd} (seed ${seed})`).toEqual([5]);
      else expect(picks, `${cmd} (seed ${seed})`).toEqual([]);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('a payment that buys Zanmato kills what it is aimed at, and the battle is won', () => {
    const { rig, before } = pay({ compat: 0, amount: 4_194_304, gil: 5_000_000, seed: 1, enemy: { id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }) } });
    const log = starts(rig.events.slice(before));
    expect(log[1]).toEqual(['yojimbo', 'zanmato']); // 2^22 gil is a motivation of exactly 80: certain
    expect(rig.fighter('dummy').alive).toBe(false);
    expect(rig.state.result?.outcome).toBe('victory');
  });

  it('a monster with a Zanmato byte: when the first roll is not Zanmato the script draws again and a second-pass Zanmato is Wakizashi on all', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const boss = { ...SOLID, id: 'boss', zanmatoLevel: 4 }; // the data's level is the game's byte (3) plus 1
      const { rig, from, compat: now } = pay({ compat: 128, amount: 100_000, enemy: boss, seed });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 100_000, gil: 100_000, compat: now, hire: 1, zan: 3, gaugeFull: false }, y[0]!.value, y[1]?.value ?? 0);
      expect(y.length, `seed ${seed}`).toBe(want.draws);
      const log = starts(rig.events.filter((e) => e.type === 'action-start'));
      expect(log.at(-1)![1], `seed ${seed}`).toBe(want.command);
    }
  });

  it('the hire answer changes the motivation (answers 0, 1 and 2 give different commands for the same draw)', () => {
    const results = new Set<string>();
    for (const hire of [0, 1, 2] as const) {
      // A payment of a tenth of the gil, 5,000 gil: answer 0 x 0.8, answer 1 x 1, answer 2 x 0.8; draws differ per seed, so compare to the oracle each time.
      const { rig, from, before, compat: now } = pay({ compat: 128, hire, amount: 10_000, gil: 100_000, seed: 9 });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 10_000, gil: 100_000, compat: now, hire, zan: 0, gaugeFull: false }, y[0]!.value, 0);
      expect(starts(rig.events.slice(before))[1]![1]).toBe(want.command);
      results.add(`${hire}:${want.command}`);
    }
    expect(results.size).toBe(3);
  });

  it('a full gauge adds 20 to the motivation and the whole gauge is spent; a Cursed Yojimbo gets neither', () => {
    let gaugeSpent = false;
    for (let seed = 1; seed <= 8; seed++) {
      const { rig, from, compat: now } = pay({ compat: 0, amount: 3000, gauge: 100, seed });
      const y = rig.draws(from, 17);
      const want = payDecision({ payment: 3000, gil: 100_000, compat: now, hire: 1, zan: 0, gaugeFull: true }, y[0]!.value, 0);
      const log = starts(rig.events.filter((e) => e.type === 'action-start'));
      expect(log.at(-1)![1]).toBe(want.command);
      gaugeSpent = rig.fighter('yojimbo').overdrive!.gauge < 100 || gaugeSpent;
    }
    expect(gaugeSpent).toBe(true);
  });

  it('a payment of nothing: compatibility -20 and he leaves; a payment above the gil, or not a whole number, is refused and the turn stays open', () => {
    const { rig } = pay({ compat: 100, amount: 0 });
    expect(rig.state.flags['yojimbo:compatibility']).toBe(80);
    expect(rig.state.aeonId).toBeNull();
    const rig2 = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 100, hireAnswer: 1 }, gil: 500 }));
    rig2.until('yuna');
    rig2.submit(SUMMON('yojimbo'));
    rig2.until('yojimbo');
    for (const bad of [501, -1, 2.5]) {
      const out = rig2.submit(PAY(bad));
      expect(out.some((e) => e.type === 'message'), `${bad}`).toBe(true);
      expect(rig2.state.flags['yojimbo:gil']).toBe(500);
      expect(rig2.nextInput().actorId).toBe('yojimbo'); // the same turn is still open
    }
  });
});

describe('Dismiss and the wipe', () => {
  it('Dismiss as his first action costs 3; after he has acted it costs nothing', () => {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 100, hireAnswer: 1 } }));
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    rig.until('yojimbo');
    rig.submit(DISMISS);
    expect(rig.state.flags['yojimbo:compatibility']).toBe(97);
    expect(rig.state.aeonId).toBeNull();

    const rig2 = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 100, hireAnswer: 1 } }));
    rig2.until('yuna');
    rig2.submit(SUMMON('yojimbo'));
    rig2.until('yojimbo');
    rig2.submit(PAY(1)); // an action of his, whatever it buys
    const c = rig2.state.flags['yojimbo:compatibility'] as number;
    if (rig2.state.aeonId === 'yojimbo') {
      rig2.until('yojimbo');
      rig2.submit(DISMISS);
      expect(rig2.state.flags['yojimbo:compatibility']).toBe(c);
    }
  });

  it('knocked out while he is out: compatibility -10, the wipe starts his recovery count (24 + 1) and the party is back', () => {
    const rig = new Rig(
      build({ aeons: [yojimbo()], yojimbo: { compatibility: 100, hireAnswer: 1 } }),
      [enemy({ id: 'brute', stats: stats({ hp: 99999, maxHp: 99999, str: 255, agi: 255 }) })],
    );
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    rig.fighter('yojimbo').hp = 1; // one hit from the wipe
    for (let i = 0; i < 12 && rig.state.aeonId !== null; i++) {
      const d = rig.engine.nextDecision();
      if (d.kind === 'player-input') rig.engine.submit({ kind: 'defend', targets: [] });
    }
    expect(rig.state.aeonId).toBeNull();
    expect(rig.fighter('yojimbo').aeon!.reviveCountdown).toBe(25);
    expect(rig.state.flags['yojimbo:compatibility']).toBe(90);
  });

  it('a chain carries his compatibility and the gil he was paid to the next link', () => {
    const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 100, hireAnswer: 1 } }));
    rig.until('yuna');
    rig.submit(SUMMON('yojimbo'));
    rig.until('yojimbo');
    rig.submit(PAY(7000));
    const next = carryPartyForward(rig.party, rig.state) as FFXPartyBuild;
    expect(next.yojimbo).toEqual({ compatibility: rig.state.flags['yojimbo:compatibility'], hireAnswer: 1 });
    expect(next.gil).toBe(100_000 - 7000);
  });
});

describe('the Magus Sisters: three aeons at once', () => {
  const own = { sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } };

  function out(gauge = 0, seed = 5): Rig {
    const rig = new Rig(build({ aeons: sisters(gauge), ...own }), undefined, seed);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    return rig;
  }

  it('one Summon row stands for the three; all three come, each records the summoner, and the party is off the field', () => {
    const rig = new Rig(build({ aeons: sisters(), ...own }));
    const d = rig.until('yuna');
    const summons = d.commands.filter((c) => c.command.kind === 'summon').map((c) => (c.command.kind === 'summon' ? c.command.id : ''));
    expect(summons).toEqual(['cindy']);
    rig.submit(SUMMON('cindy'));
    expect(rig.state.aeonId).toBe('cindy');
    expect(rig.state.aeonIds).toEqual(['cindy', 'sandy', 'mindy']);
    for (const id of ['cindy', 'sandy', 'mindy']) {
      const c = rig.fighter(id);
      expect([c.removed, c.alive, c.aeon!.ownerId]).toEqual([false, true, 'yuna']);
    }
    expect(['tidus', 'yuna', 'auron'].map((id) => rig.fighter(id).removed)).toEqual([false, false, false]); // parked, not removed
    const rt = (rig.engine as unknown as { ctx: { rt: { actors: Map<string, { ctb: number }> } } }).ctx.rt;
    expect(rt.actors.get('cindy')!.ctb).toBe(0); // the one asked for acts next
  });

  it('the Sisters hold the field until all three are down: one fallen sister does not end the summon, three do (a wipe with the recovery count)', () => {
    const rig = out();
    rig.fighter('mindy').hp = 0;
    rig.fighter('mindy').alive = false;
    rig.fighter('mindy').statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    // A sister acts after Mindy fell: the end-of-action check must keep the summon (two are still standing).
    expect(rig.nextInput().actorId).not.toBe('mindy');
    rig.submit({ kind: 'defend', targets: [] });
    expect(rig.state.aeonId).toBe('cindy');
    expect(rig.state.aeonIds).toEqual(['cindy', 'sandy', 'mindy']);
    rig.until('cindy');
    for (const id of ['cindy', 'sandy']) {
      rig.fighter(id).hp = 0;
      rig.fighter(id).alive = false;
      rig.fighter(id).statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    rig.engine.submit({ kind: 'defend', targets: [] });
    for (let i = 0; i < 5 && rig.state.aeonId !== null; i++) {
      const d = rig.engine.nextDecision();
      if (d.kind === 'player-input') rig.engine.submit({ kind: 'defend', targets: [] });
    }
    expect(rig.state.aeonId).toBeNull();
    expect(rig.state.aeonIds).toBeUndefined();
    for (const id of ['cindy', 'sandy', 'mindy']) expect(rig.fighter(id).aeon!.reviveCountdown, id).toBe(31); // 30 battles + 1
    expect(rig.state.result).toBeNull(); // the party is back; the battle goes on
  });

  it('Dismiss stands a fallen sister up at 1 HP and the party returns', () => {
    const rig = out();
    const mindy = rig.fighter('mindy');
    mindy.hp = 0;
    mindy.alive = false;
    mindy.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    rig.until('cindy');
    rig.submit(DISMISS);
    expect(rig.state.aeonId).toBeNull();
    expect(rig.state.aeonIds).toBeUndefined();
    expect([mindy.hp, mindy.alive]).toEqual([1, true]);
    expect(rig.fighter('cindy').aeon!.reviveCountdown ?? 0).toBe(0);
  });
});

describe('the Magus Sisters: the menu and Combine powers', () => {
  const own = { sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } };

  it('each sister\'s turn opens with the game\'s menu builder: its draws are on stream 18, in the note\'s order, and the rows are what it offered', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rig = new Rig(build({ aeons: sisters(0), ...own }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('cindy'));
      const from = rig.taps.length;
      const d = rig.nextInput();
      const who = d.actorId as 'cindy' | 'sandy' | 'mindy';
      expect(['cindy', 'sandy', 'mindy']).toContain(who);
      const c = rig.fighter(who);
      const draws = rig.draws(from, 18).map((t) => t.value);
      const trio = ['cindy', 'sandy', 'mindy'].map((id) => rig.fighter(id));
      const want = sisterMenu(who, {
        turns: 0,
        motivation: 40,
        hp: c.hp,
        mp: c.mp,
        maxHp: c.stats.maxHp,
        maxMp: c.stats.maxMp,
        nearDeath: trio.filter((t) => t.hp < Math.floor(t.stats.maxHp / 2)).length,
        ready: 0,
      }, draws);
      expect(draws.length, `seed ${seed} ${who}`).toBe(want.used);
      const rows = d.commands;
      const offered = rows.map((r) => (r.command.kind === 'dismiss' ? 0x3056 : 0));
      expect(offered.at(-1)).toBe(0x3056);
      const orderIds = rows.flatMap((r) => (r.command.kind === 'ability' ? [r.command.id] : []));
      expect(orderIds.length, `seed ${seed} ${who}: orders offered`).toBe(want.offered.length - 1);
      // Only Combine powers has a handler; every other row is listed disabled.
      for (const r of rows) if (r.command.kind === 'ability') expect(r.enabled, `${r.label}`).toBe(r.command.id === 'sister-order-combine');
    }
  });

  it('Combine powers is offered when all three are ready, and an order that was not offered, or has no handler, is refused with the turn kept', () => {
    const rig = new Rig(build({ aeons: sisters(100), ...own }));
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    const d = rig.nextInput();
    const combine = d.commands.find((r) => r.command.kind === 'ability' && r.command.id === 'sister-order-combine');
    expect(combine?.enabled).toBe(true);
    const free = rig.submit({ kind: 'ability', id: 'sister-order-free', targets: [] });
    expect(free.some((e) => e.type === 'message' && /not built/.test(e.text))).toBe(true);
    expect(rig.nextInput().actorId).toBe(d.actorId);
    const low = new Rig(build({ aeons: sisters(60), ...own }));
    low.until('yuna');
    low.submit(SUMMON('cindy'));
    const dd = low.nextInput();
    expect(dd.commands.some((r) => r.command.kind === 'ability' && r.command.id === 'sister-order-combine')).toBe(false);
    const refused = low.submit({ kind: 'ability', id: 'sister-order-combine', targets: [] });
    expect(refused.some((e) => e.type === 'message' && /not offered/.test(e.text))).toBe(true);
  });

  it('Combine powers: the chance 200 + motivation on stream 18, the Delta Attack by Cindy, the others\' counters from the joint rule, all three pay the bar, motivation +10', () => {
    const rig = new Rig(build({ aeons: sisters(100), ...own }), undefined, 11);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    const d = rig.nextInput();
    const who = d.actorId;
    const from = rig.taps.length;
    const before = rig.events.length;
    rig.submit({ kind: 'ability', id: 'sister-order-combine', targets: [] });
    const rolls = rig.draws(from, 18);
    expect(rolls).toHaveLength(1);
    const wins = (rolls[0]!.value & 0xff) < 200 + 40;
    expect(wins, 'this seed takes the winning branch (the losing one is the next test)').toBe(true);
    const log = starts(rig.events.slice(before));
    const rt = (rig.engine as unknown as { ctx: { rt: { actors: Map<string, { ctb: number }>; sisters: { motivation: Record<string, number> } } } }).ctx.rt;
    if (wins) {
      expect(log.map(([, n]) => n)).toContain('delta-attack');
      expect(log.find(([, n]) => n === 'delta-attack')![0]).toBe('cindy'); // Cindy performs it whoever gave the order
      for (const id of ['cindy', 'sandy', 'mindy']) expect(rig.fighter(id).overdrive!.gauge, `${id} paid the bar`).toBe(0);
      // Delta Attack is rank 5: Agility 40 is 7 ticks a rank (35) and Agility 100 is 4 (20); Haste and Slow are off.
      expect([rt.actors.get('cindy')!.ctb, rt.actors.get('sandy')!.ctb, rt.actors.get('mindy')!.ctb]).toEqual([35, 35, 20]);
      expect(rt.sisters.motivation[who]).toBe(50);
    } else {
      expect(log.map(([, n]) => n)).not.toContain('delta-attack');
      expect(rt.sisters.motivation[who]).toBe(30);
    }
  });

  it('a lost roll (motivation 0 and an unlucky draw) is -10 and no Delta Attack; with motivation 56 or more the roll cannot fail', () => {
    // 200 + 56 > 255: every low byte is below the threshold, so the order always goes through.
    for (let seed = 1; seed <= 6; seed++) {
      const rig = new Rig(build({ aeons: sisters(100), sisters: { motivation: { cindy: 60, sandy: 60, mindy: 60 } } }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('cindy'));
      const d = rig.nextInput();
      const before = rig.events.length;
      rig.submit({ kind: 'ability', id: 'sister-order-combine', targets: [] });
      expect(starts(rig.events.slice(before)).map(([, n]) => n), `seed ${seed}`).toContain('delta-attack');
      expect(d.actorId).toBeTruthy();
    }
    let lost = 0;
    for (let seed = 1; seed <= 60 && lost < 2; seed++) {
      const rig = new Rig(build({ aeons: sisters(100), sisters: { motivation: { cindy: 0, sandy: 0, mindy: 0 } } }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('cindy'));
      const d = rig.nextInput();
      const from = rig.taps.length;
      const before = rig.events.length;
      rig.submit({ kind: 'ability', id: 'sister-order-combine', targets: [] });
      const wins = (rig.draws(from, 18)[0]!.value & 0xff) < 200;
      const queued = starts(rig.events.slice(before)).some(([, n]) => n === 'delta-attack');
      expect(queued, `seed ${seed}`).toBe(wins);
      if (!wins) {
        lost++;
        const rt = (rig.engine as unknown as { ctx: { rt: { sisters: { motivation: Record<string, number> } } } }).ctx.rt;
        expect(rt.sisters.motivation[d.actorId]).toBe(0); // 0 - 10 held at 0
        expect(rig.fighter('cindy').overdrive!.gauge).toBe(100); // nothing was paid
      }
    }
    expect(lost).toBeGreaterThan(0);
  });
});

describe('a battle with no Yojimbo and no Sisters is not touched', () => {
  it('the same seed gives the same log with and without the (unused) rules: a build with plain aeons plays exactly as before', () => {
    const plain = build({ aeons: [aeon({ id: 'valefor', stats: stats({ hp: 3000, maxHp: 3000, agi: 40 }) })] });
    const a = new Rig(plain, undefined, 21);
    const b = new Rig(plain, undefined, 21);
    for (const r of [a, b]) {
      r.until('yuna');
      r.submit(SUMMON('valefor'));
      for (let i = 0; i < 6; i++) r.engine.nextDecision();
    }
    expect(JSON.stringify(a.engine.state().log)).toBe(JSON.stringify(b.engine.state().log));
    expect(commandBySum(0)).toBe('daigoro');
  });
});
