/**
 * The rig of the engine-level tests of the player's Yojimbo and the Magus Sisters (re-parity lane FFX-K; **FFX only**): one engine on a TEST build that owns
 * them, with every draw of the game's generator recorded (the test taps the generator), and the small builders the tests share. Nothing ships either aeon.
 *
 * Used by `parity-ffx-engine-k-aeons.test.ts` and `parity-ffx-engine-k-aeons-more.test.ts`.
 */

import type { AvailableCommand, BattleEvent, Command, Decision, EnemyDef, FFXCombatant, FFXPartyBuild, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import type { GameStreams } from '../../../src/battle/common/streams.ts';
import { FFXContentRegistry, createFFXEngine, type FFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../../src/data/ffx/index.ts';
import { PAY_ABILITY_ID } from '../../../src/battle/ffx/aeon-commands.ts';
import { aeon, enemy, member, party, setup, stats } from '../ffx-fixtures.test.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

export interface Tap {
  stream: number;
  value: number;
}

/** One engine on a test build, with every draw of the game's generator recorded. */
export class Rig {
  readonly engine: FFXEngine;
  readonly taps: Tap[] = [];
  readonly events: BattleEvent[] = [];
  readonly party: FFXPartyBuild;

  constructor(party_: FFXPartyBuild, enemies: EnemyDef[] = [enemy({ id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }) })], seed = 7) {
    this.party = party_;
    this.engine = createFFXEngine({ content, autoResolveMinigames: true });
    this.engine.init(setup({ party: party_, enemies: { id: 'k-test', game: 'ffx', enemies, canEscape: false }, seed, condition: 'scripted' }));
    (this.engine as unknown as { rng: GameStreams }).rng.tap = (stream, value) => void this.taps.push({ stream, value });
  }

  get state() {
    return this.engine.state();
  }

  /** The engine's runtime (the bookkeeping the tests read: counters, the Sisters' state). */
  get rt() {
    return (this.engine as unknown as { ctx: { rt: { actors: Map<string, { ctb: number }>; sisters: { motivation: Record<string, number>; parsed: Record<string, number> } } } }).ctx.rt;
  }

  fighter(id: string): FFXCombatant {
    return this.state.combatants[id] as FFXCombatant;
  }

  /** Put a status on a combatant the way a spell would have left it (permanent, no source). */
  inflict(id: string, status: StatusId): void {
    const inst: StatusInstance = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    this.fighter(id).statuses[status] = inst;
  }

  /** Knock a combatant out the way the engine's own KO leaves it. */
  knockOut(id: string): void {
    const c = this.fighter(id);
    c.hp = 0;
    c.alive = false;
    this.inflict(id, 'ko');
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
export function build(over: Partial<FFXPartyBuild> & { aeons: FFXPartyBuild['aeons'] }): FFXPartyBuild {
  const members = [
    member({ id: 'tidus', stats: stats({ agi: 30, hp: 5000, maxHp: 5000 }) }),
    member({ id: 'yuna', stats: stats({ agi: 60, hp: 5000, maxHp: 5000 }) }),
    member({ id: 'auron', stats: stats({ agi: 20, hp: 5000, maxHp: 5000 }) }),
  ];
  return party({ members, gil: 100_000, ...over });
}

export const yojimbo = (gauge = 0, agi = 40): FFXPartyBuild['aeons'][number] =>
  aeon({ id: 'yojimbo', stats: stats({ hp: 4000, maxHp: 4000, mp: 0, maxMp: 0, agi, str: 60 }), overdriveGauge: gauge });

/** The Sisters, at the Agility the note works its example with (Cindy 40, Sandy 40, Mindy 100). */
export const sisters = (gauge = 0): FFXPartyBuild['aeons'] => [
  aeon({ id: 'cindy', stats: stats({ hp: 6000, maxHp: 6000, mp: 200, maxMp: 200, agi: 40, str: 60 }), overdriveGauge: gauge }),
  aeon({ id: 'sandy', stats: stats({ hp: 5000, maxHp: 5000, mp: 100, maxMp: 100, agi: 40, str: 60 }), overdriveGauge: gauge }),
  aeon({ id: 'mindy', stats: stats({ hp: 3000, maxHp: 3000, mp: 300, maxMp: 300, agi: 100, str: 60 }), overdriveGauge: gauge }),
];

export const SUMMON = (id: string): Command => ({ kind: 'summon', id, targets: [] });
export const PAY = (gilSpent: number): Command => ({ kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent });
export const DISMISS: Command = { kind: 'dismiss', targets: [] };
export const COMBINE: Command = { kind: 'ability', id: 'sister-order-combine', targets: [] };
export const ids = (rows: readonly AvailableCommand[]): string[] => rows.map((r) => (r.command.kind === 'ability' ? r.command.id : r.command.kind));

/** The action-start events of a stretch of the log, as `[actor, ability id or name]`. */
export const starts = (events: readonly BattleEvent[]): Array<[string, string]> =>
  events.flatMap((e) => (e.type === 'action-start' ? [[e.actorId, e.abilityId ?? e.abilityName ?? '?'] as [string, string]] : []));
