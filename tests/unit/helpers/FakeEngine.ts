/**
 * A minimal scripted `FFXBattleEngine`.
 *
 * Not a combat model — it has no formulas and no AI. It is the smallest thing
 * that obeys the playback protocol in `docs/CONTRACTS.md` (monotonic `seq`,
 * `state().log[i].seq === i`, `nextDecision()` idempotent for `player-input`
 * and `battle-over`) so the presenter can be tested against a real contract
 * rather than a mock, and so the e2e specs have something to run before
 * `src/battle/ffx` lands.
 *
 * It deliberately exercises the awkward paths: the minigame suspend/re-submit
 * handshake, a mid-battle `script-trigger`, and a `victory` that carries a
 * `BattleResult`.
 */

import type {
  AvailableCommand,
  BattleEvent,
  BattleResult,
  BattleSetup,
  BattleState,
  Command,
  CombatantId,
  Decision,
  FFXBattleEngine,
  FFXCombatant,
  StatBlock,
  TurnPreview,
} from '../../../src/battle/common/types.ts';

/** `Omit` does not distribute over a union on its own; spell it out. */
type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

export interface FakeEngineOptions {
  /** Enemy HP. Lower = shorter battle. */
  enemyHp?: number;
  /** Damage each party attack deals. */
  partyDamage?: number;
  /** Damage each enemy turn deals to the front party member. */
  enemyDamage?: number;
  /** Suspend on an `overdrive` command until it is re-submitted with `extra`. */
  minigameOnOverdrive?: boolean;
  /** Emit `script-trigger` with this name after the first player action. */
  triggerAfterFirstAction?: string;
  /** Force a defeat instead of a victory. */
  loses?: boolean;
}

function statBlock(hp: number): StatBlock {
  return {
    hp,
    mp: 100,
    str: 20,
    def: 20,
    mag: 20,
    mdef: 20,
    agi: 20,
    luck: 18,
    eva: 10,
    acc: 20,
    maxHp: hp,
    maxMp: 100,
  };
}

function fighter(id: string, name: string, side: 'party' | 'enemy', slot: number, hp: number): FFXCombatant {
  return {
    id,
    name,
    side,
    spriteKey: id,
    stats: statBlock(hp),
    hp,
    mp: 100,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot,
    flags: side === 'enemy' ? { isBoss: true } : {},
    learnedAbilityIds: ['cure'],
    ...(side === 'party'
      ? {
          overdrive: {
            gauge: 100,
            mode: 'stoic' as const,
            unlockedModes: ['stoic' as const],
            unlockedOverdriveIds: ['blitz-ace'],
          },
        }
      : {}),
  };
}

export class FakeEngine implements FFXBattleEngine {
  private st!: BattleState;
  private readonly opts: Required<Omit<FakeEngineOptions, 'triggerAfterFirstAction'>> & {
    triggerAfterFirstAction: string | null;
  };
  /** Whose turn it is: party index 0..2, then the enemy, then round again. */
  private cursor = 0;
  private actions = 0;
  private pendingMinigame = false;
  private over = false;

  constructor(opts: FakeEngineOptions = {}) {
    this.opts = {
      enemyHp: opts.enemyHp ?? 3000,
      partyDamage: opts.partyDamage ?? 1200,
      enemyDamage: opts.enemyDamage ?? 150,
      minigameOnOverdrive: opts.minigameOnOverdrive ?? false,
      loses: opts.loses ?? false,
      triggerAfterFirstAction: opts.triggerAfterFirstAction ?? null,
    };
    this.init({
      game: 'ffx',
      party: { game: 'ffx', members: [], activeSlots: ['tidus', 'yuna', 'auron'], reserve: [], aeons: [], inventory: [], gil: 0, sphereInventory: {} },
      enemies: { id: 'fake', game: 'ffx', enemies: [] },
      triggers: [],
      seed: 1,
    });
  }

  init(setup: BattleSetup): void {
    const combatants: Record<CombatantId, FFXCombatant> = {
      tidus: fighter('tidus', 'Tidus', 'party', 0, 1000),
      yuna: fighter('yuna', 'Yuna', 'party', 1, 800),
      auron: fighter('auron', 'Auron', 'party', 2, 1200),
      'seymour-flux': fighter('seymour-flux', 'Seymour Flux', 'enemy', 0, this.opts.enemyHp),
    };
    this.st = {
      game: 'ffx',
      combatants,
      activeIds: ['tidus', 'yuna', 'auron'],
      reserveIds: [],
      enemyIds: ['seymour-flux'],
      aeonId: null,
      turn: 0,
      ticks: 0,
      log: [],
      nextSeq: 0,
      triggers: setup.triggers ?? [],
      firedTriggerIds: [],
      result: null,
      seed: setup.seed,
      flags: {},
    };
    this.cursor = 0;
    this.actions = 0;
    this.pendingMinigame = false;
    this.over = false;
  }

  state(): Readonly<BattleState> {
    return this.st;
  }

  setSeed(n: number): void {
    this.st.seed = n;
  }

  /** Append events, assigning the monotonic `seq` the contract requires. */
  private emit(events: Array<Unsequenced<BattleEvent>>): BattleEvent[] {
    const out = events.map((e) => {
      const withSeq = { ...e, seq: this.st.nextSeq++ } as BattleEvent;
      this.st.log.push(withSeq);
      return withSeq;
    });
    return out;
  }

  private get enemy(): FFXCombatant {
    return this.st.combatants['seymour-flux'] as FFXCombatant;
  }

  private get actorId(): CombatantId {
    return this.st.activeIds[this.cursor % 3]!;
  }

  private result(outcome: 'victory' | 'defeat'): BattleResult {
    return {
      outcome,
      turns: this.st.turn,
      elapsedTicks: this.st.ticks,
      elapsedMs: this.st.turn * 1000,
      ap: outcome === 'victory' ? 10000 : 0,
      exp: 0,
      gil: outcome === 'victory' ? 6000 : 0,
      drops: [],
      overkilled: [],
      sphereLevelsGained: {},
    };
  }

  nextDecision(): Decision {
    if (this.st.result) return { kind: 'battle-over', result: this.st.result };

    // Party turns are the player's; every fourth turn is the enemy's.
    const isEnemyTurn = this.actions > 0 && this.actions % 3 === 0 && !this.pendingMinigame;
    if (isEnemyTurn && !this.over) {
      this.actions++;
      this.st.turn++;
      const target = this.st.combatants['tidus'] as FFXCombatant;
      const dmg = this.opts.loses ? target.hp : this.opts.enemyDamage;
      target.hp = Math.max(0, target.hp - dmg);
      const events: Array<Unsequenced<BattleEvent>> = [
        { type: 'turn-start', actorId: 'seymour-flux', turn: this.st.turn, elapsedTicks: 12 },
        {
          type: 'action-start',
          actorId: 'seymour-flux',
          command: { kind: 'ability', id: 'lance-of-atrophy', targets: ['tidus'] },
          abilityName: 'Lance of Atrophy',
          targets: ['tidus'],
        },
        {
          type: 'damage',
          targetId: 'tidus',
          sourceId: 'seymour-flux',
          amount: dmg,
          element: 'none',
          crit: false,
          hitIndex: 0,
          hitCount: 1,
        },
        { type: 'action-end', actorId: 'seymour-flux' },
      ];
      if (this.opts.loses) {
        target.alive = false;
        this.st.result = this.result('defeat');
        events.push({ type: 'ko', targetId: 'tidus', sourceId: 'seymour-flux' });
        events.push({ type: 'defeat', result: this.st.result });
      }
      return { kind: 'resolved', events: this.emit(events) };
    }

    return { kind: 'player-input', actorId: this.actorId, commands: this.commandsFor(this.actorId) };
  }

  private commandsFor(actorId: CombatantId): AvailableCommand[] {
    return [
      {
        command: { kind: 'attack', targets: [] },
        label: 'Attack',
        category: 'attack',
        mpCost: 0,
        rank: 3,
        enabled: true,
        validTargets: ['seymour-flux'],
      },
      {
        command: { kind: 'overdrive', id: 'blitz-ace', targets: [] },
        label: 'Blitz Ace',
        category: 'overdrive',
        mpCost: 0,
        enabled: true,
        validTargets: ['seymour-flux'],
        ...(this.opts.minigameOnOverdrive ? { opensMinigame: 'tidus-timing' as const } : {}),
      },
      {
        command: { kind: 'ability', id: 'cure', targets: [] },
        label: 'Cure',
        category: 'whitemagic',
        mpCost: 4,
        rank: 3,
        enabled: true,
        validTargets: [actorId, 'tidus', 'yuna', 'auron'],
      },
    ];
  }

  submit(command: Command): BattleEvent[] {
    const actorId = this.actorId;

    // The minigame handshake: suspend, then resolve on the re-submit.
    if (command.kind === 'overdrive' && this.opts.minigameOnOverdrive && !this.pendingMinigame) {
      this.pendingMinigame = true;
      return this.emit([
        {
          type: 'action-start',
          actorId,
          command,
          abilityId: command.id,
          abilityName: 'Blitz Ace',
          targets: ['seymour-flux'],
        },
        { type: 'minigame-request', who: actorId, kind: 'tidus-timing', params: { timerMs: 2200 } },
      ]);
    }
    const wasMinigame = this.pendingMinigame;
    this.pendingMinigame = false;

    this.st.turn++;
    this.actions++;

    const events: Array<Unsequenced<BattleEvent>> = [
      { type: 'turn-start', actorId, turn: this.st.turn, elapsedTicks: 10 },
    ];
    if (!wasMinigame) {
      events.push({
        type: 'action-start',
        actorId,
        command,
        targets: command.targets.length ? command.targets : ['seymour-flux'],
      });
    }

    if (command.kind === 'ability' && command.id === 'cure') {
      const target = (this.st.combatants[command.targets[0] ?? actorId] ?? this.st.combatants[actorId]) as FFXCombatant;
      target.hp = Math.min(target.stats.maxHp, target.hp + 900);
      events.push({ type: 'heal', targetId: target.id, sourceId: actorId, amount: 900, cause: 'cure' });
    } else {
      // An Overdrive resolved with a real timing result hits harder.
      const bonus = command.kind === 'overdrive' ? (command.extra ? 3 : 2) : 1;
      const dmg = this.opts.partyDamage * bonus;
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      events.push({
        type: 'damage',
        targetId: 'seymour-flux',
        sourceId: actorId,
        amount: dmg,
        element: 'none',
        crit: bonus > 1,
        hitIndex: 0,
        hitCount: 1,
      });
    }

    events.push({ type: 'action-end', actorId });

    if (this.actions === 1 && this.opts.triggerAfterFirstAction) {
      events.push({ type: 'script-trigger', name: this.opts.triggerAfterFirstAction });
      this.st.firedTriggerIds.push(this.opts.triggerAfterFirstAction);
    }

    if (this.enemy.hp <= 0 && !this.over) {
      this.over = true;
      this.enemy.alive = false;
      this.st.result = this.result('victory');
      events.push({ type: 'ko', targetId: 'seymour-flux', sourceId: actorId });
      events.push({ type: 'victory', result: this.st.result });
    } else {
      this.cursor++;
    }

    return this.emit(events);
  }

  predictTurnOrder(n: number): TurnPreview[] {
    const order = [...this.st.activeIds, 'seymour-flux'];
    return Array.from({ length: Math.min(n, order.length) }, (_, i) => ({
      actorId: order[(this.cursor + i) % order.length]!,
      tickValue: i * 10,
      index: i,
      isParty: order[(this.cursor + i) % order.length] !== 'seymour-flux',
      statusIcons: [],
      overdriveReady: true,
    }));
  }
}
