/**
 * A deterministic stand-in for the FF7 engine, for the HUD harness and the
 * HUD's DOM tests (FF7 only). There is no FF7 engine yet (plan steps 2 to 5);
 * this drives the HUD through its real port with fixed numbers, so the HUD can
 * be built and checked against the A+ target before the engine exists.
 *
 * **Where each number comes from** (rule 6; `research/ff7-guard-scorpion.md` = gs):
 * - Max HP and MP: Cloud 316 / 57, Barret 317 / 43 [gs §8.4, derived].
 * - Spells and costs: Cloud's Ice and Bolt, 4 MP each; Barret's Cure, 5 MP [gs §8.4].
 * - Items: Potion x3, Phoenix Down x1 [gs §8.5, our estimate for the preset]; Potion heals 100 [gs §9].
 * - Limits: Braver and Big Shot, Level 1 [gs §8.4]; full at 255 [ff7-battle-core §7].
 * - Tail-up damage on the boss, one value inside each derived range [gs §9]:
 *   Attack 21 (20 to 22), Bolt 46 (44 to 48), Ice 23 (22 to 24), Braver 64 (62 to 67),
 *   Big Shot 59 (57 to 61), Barret's Attack 18 (17 to 19).
 * - Tail Laser answers any hostile action while the tail is up [gs §4]: 74 on Cloud and
 *   73 on Barret, inside the derived 72 to 77 [gs §9].
 * - **Placeholders** (the A+ target's story, not canon): the current HP (279 and 150),
 *   the starting Limit gauges (122 and 102; the Tail Laser adds gs §9's 133 and 142
 *   units, the figures for a 77 hit, bringing them to 255 and 244) and the TIME fills.
 * - The three hint lines, the game's own text and spelling [gs §7.1]; keeping "it's" is
 *   still Bailey's call (spec §9 #3).
 */

import type { AtbSnapshot, AvailableCommand, BattleEvent, BattleState, Command, CombatantId } from '../../battle/common/types.ts';
import type { Ff7Combatant } from '../../battle/common/types-ff7.ts';

export const FIXTURE_IDS = { cloud: 'cloud', barret: 'barret', boss: 'guard-scorpion' } as const;

/** The hint, three messages in order, Cloud and Barret alive [gs §7.1, verbatim; "(Barret)" is the player's name]. */
export const HINT_LINES = ['“Barret, be careful!', '“Attack while it\'s tail\'s up!', '“It\'s gonna counterattack with its laser.'] as const;

interface Fighter {
  id: CombatantId;
  name: string;
  side: 'party' | 'enemy';
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  limit: number;
  time: number;
  slot: number;
}

/** Tail-up damage on the boss by command id [gs §9, one value inside each range]. */
/** A {@link BattleEvent} before the fixture numbers it. */
type EventInput = BattleEvent extends infer E ? (E extends BattleEvent ? Omit<E, 'seq'> : never) : never;

const HIT: Record<string, number> = { attack: 21, bolt: 46, ice: 23, braver: 64, 'big-shot': 59, 'attack-barret': 18 };

export class Ff7HudFixture {
  readonly fighters: Record<string, Fighter> = {
    cloud: { id: 'cloud', name: 'Cloud', side: 'party', hp: 279, maxHp: 316, mp: 57, maxMp: 57, limit: 122, time: 1, slot: 0 },
    barret: { id: 'barret', name: 'Barret', side: 'party', hp: 150, maxHp: 317, mp: 43, maxMp: 43, limit: 102, time: 0.55, slot: 1 },
    'guard-scorpion': { id: 'guard-scorpion', name: 'Guard Scorpion', side: 'enemy', hp: 800, maxHp: 800, mp: 0, maxMp: 0, limit: 0, time: 0, slot: 0 },
  };
  items: Record<string, number> = { potion: 3, 'phoenix-down': 1 };
  private seq = 0;

  private combatant(f: Fighter): Ff7Combatant {
    return {
      id: f.id, name: f.name, side: f.side, spriteKey: f.id, stats: { maxHp: f.maxHp, maxMp: f.maxMp },
      hp: f.hp, mp: f.mp, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [], controller: f.side === 'party' ? 'player' : 'ai',
      alive: f.hp > 0, removed: false, slot: f.slot, flags: {},
      ff7: {
        derived: {} as Ff7Combatant['ff7']['derived'], row: 'front',
        atb: { turnTimer: Math.round(f.time * 65_535), vTimer: 0, ready: f.time >= 1 },
        ...(f.side === 'party' ? { limit: { gauge: f.limit, level: 1 as const, learnedLimitIds: [f.id === 'cloud' ? 'braver' : 'big-shot'] } } : {}),
      },
    } as unknown as Ff7Combatant;
  }

  state(): BattleState {
    const combatants = Object.fromEntries(Object.values(this.fighters).map((f) => [f.id, this.combatant(f)]));
    return {
      game: 'ff7', combatants, activeIds: ['cloud', 'barret'], reserveIds: [], enemyIds: ['guard-scorpion'], aeonId: null,
      turn: 1, ticks: 0, log: [], nextSeq: this.seq, triggers: [], firedTriggerIds: [], result: null, seed: 1, flags: { tailUp: true },
    } as unknown as BattleState;
  }

  gauges(): AtbSnapshot {
    return {
      elapsedMs: 0,
      bars: ['cloud', 'barret'].map((id) => {
        const f = this.fighters[id] as Fighter;
        return { actorId: id, fill: f.time, required: 65_535, ready: f.time >= 1, charge: null, state: 'normal' as const };
      }),
    };
  }

  /** The command rows for one fighter's turn. Limit replaces Attack while the gauge is full [core §7.2]. */
  commands(actor: 'cloud' | 'barret'): AvailableCommand[] {
    const f = this.fighters[actor] as Fighter;
    const boss = [FIXTURE_IDS.boss];
    const allies = ['cloud', 'barret'];
    const rows: AvailableCommand[] = [];
    if (f.limit >= 255) {
      const id = actor === 'cloud' ? 'braver' : 'big-shot';
      rows.push({ command: { kind: 'limit', id, targets: [] }, label: actor === 'cloud' ? 'Braver' : 'Big Shot', category: 'overdrive', mpCost: 0, enabled: true, validTargets: boss, targeting: 'single-enemy' });
    } else {
      rows.push({ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: boss, targeting: 'single-enemy' });
    }
    const spells: Array<[string, string, number, 'single-enemy' | 'single-ally']> = actor === 'cloud'
      ? [['ice', 'Ice', 4, 'single-enemy'], ['bolt', 'Bolt', 4, 'single-enemy']]
      : [['cure', 'Cure', 5, 'single-ally']];
    for (const [id, label, mp, targeting] of spells) {
      rows.push({ command: { kind: 'ability', id, targets: [] }, label, category: 'blackmagic', mpCost: mp, enabled: f.mp >= mp,
        validTargets: targeting === 'single-enemy' ? boss : allies, targeting, preferredTargets: targeting === 'single-ally' ? allies : boss });
    }
    rows.push({ command: { kind: 'item', id: 'potion', targets: [] }, label: 'Potion', category: 'item', mpCost: 0, enabled: (this.items['potion'] ?? 0) > 0, validTargets: allies, targeting: 'single-ally' });
    // No one is KO'd, so a Phoenix Down has no legal target: drawn grey [S1 "displayed in grey"].
    rows.push({ command: { kind: 'item', id: 'phoenix-down', targets: [] }, label: 'Phoenix Down', category: 'item', mpCost: 0, enabled: false, validTargets: [], targeting: 'single-ally' });
    return rows;
  }

  private ev(e: EventInput): BattleEvent {
    return { ...e, seq: this.seq++ } as BattleEvent;
  }

  /** What the (absent) engine would emit for `cmd` by `actor`, applied to the fixture's numbers. */
  respond(actor: 'cloud' | 'barret', cmd: Command): BattleEvent[] {
    const out: BattleEvent[] = [];
    const me = this.fighters[actor] as Fighter;
    const id = cmd.kind === 'attack' ? (actor === 'barret' ? 'attack-barret' : 'attack') : 'id' in cmd ? String(cmd.id) : cmd.kind;
    const names: Record<string, string> = { ice: 'Ice', bolt: 'Bolt', cure: 'Cure', braver: 'Braver', 'big-shot': 'Big Shot', potion: 'Potion' };
    out.push(this.ev({ type: 'action-start', actorId: actor, command: cmd, targets: cmd.targets, ...(names[id] ? { abilityName: names[id] as string, abilityId: id } : {}) }));
    if (cmd.kind === 'ability') me.mp = Math.max(0, me.mp - (id === 'cure' ? 5 : 4));
    me.time = 0;
    let hostile = false;
    for (const t of cmd.targets) {
      const f = this.fighters[t];
      if (!f) continue;
      if (f.side === 'enemy') {
        hostile = true;
        const dmg = HIT[id] ?? 0;
        f.hp = Math.max(0, f.hp - dmg);
        out.push(this.ev({ type: 'damage', targetId: t, sourceId: actor, amount: dmg, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }));
      } else {
        const heal = id === 'potion' ? 100 : id === 'cure' ? 240 : 0; // gs §9: Potion 100; Cure 232 to 248
        const amt = Math.min(heal, f.maxHp - f.hp);
        f.hp += amt;
        if (id === 'potion') this.items['potion'] = Math.max(0, (this.items['potion'] ?? 0) - 1);
        out.push(this.ev({ type: 'damage', targetId: t, sourceId: actor, amount: -amt, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }));
      }
    }
    if (cmd.kind === 'limit') {
      me.limit = 0;
      out.push(this.ev({ type: 'limit-gauge', actorId: actor, value: 0, level: 1, ready: false }));
    }
    out.push(this.ev({ type: 'action-end', actorId: actor }));
    if (hostile) out.push(...this.tailLaser());
    return out;
  }

  /** The counter while the tail is up [gs §4]: Tail Laser on both, and their Limit gauges fill. */
  private tailLaser(): BattleEvent[] {
    const boss = FIXTURE_IDS.boss;
    const out: BattleEvent[] = [this.ev({ type: 'action-start', actorId: boss, command: { kind: 'ability', id: 'tail-laser', targets: ['cloud', 'barret'] }, abilityId: 'tail-laser', abilityName: 'Tail Laser', targets: ['cloud', 'barret'] })];
    const hits: Array<[string, number, number]> = [['cloud', 74, 133], ['barret', 73, 142]]; // damage, Limit units [gs §9]
    hits.forEach(([t, dmg, units]) => {
      const f = this.fighters[t] as Fighter;
      f.hp = Math.max(0, f.hp - dmg);
      out.push(this.ev({ type: 'damage', targetId: t, sourceId: boss, amount: dmg, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }));
      f.limit = Math.min(255, f.limit + units);
      out.push(this.ev({ type: 'limit-gauge', actorId: t, value: f.limit, level: 1, ready: f.limit >= 255 }));
    });
    out.push(this.ev({ type: 'action-end', actorId: boss }));
    return out;
  }

  /** Advance every TIME gauge by `dt` seconds at a fixed placeholder rate (a full bar in 2.5 s). */
  tick(dt: number): void {
    for (const id of ['cloud', 'barret']) {
      const f = this.fighters[id] as Fighter;
      f.time = Math.min(1, f.time + dt / 2.5);
    }
  }

  /** Back to the opening moment (the harness loops). */
  reset(): void {
    Object.assign(this.fighters['cloud'] as Fighter, { hp: 279, mp: 57, limit: 122, time: 1 });
    Object.assign(this.fighters['barret'] as Fighter, { hp: 150, mp: 43, limit: 102, time: 0.55 });
    Object.assign(this.fighters['guard-scorpion'] as Fighter, { hp: 800 });
    this.items = { potion: 3, 'phoenix-down': 1 };
  }
}
