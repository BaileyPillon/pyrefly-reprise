/**
 * Shapes for the strategy guide's **own line**: the ordered plan its NEXT card reads.
 *
 * Bailey, 2026-10-03: "The guide and next move advisor are completely separate entities". The
 * guide's NEXT is therefore no longer the chapter tactic's pick (`src/engine/tactics/<chapter>.ts`,
 * which the move advisor still runs and borrows words from). Each chapter carries a short plan of
 * its own, written from the encounter guide the guide follows (`research/jegged-encounter-guides-*.md`,
 * D-350), as plain data next to the chapter's rules (`./lines/<chapter>.ts`). The evaluator that
 * reads it is `src/engine/tactics/guide-line.ts`, and only the guide imports it.
 *
 * ## How a line is read
 *
 * At every open decision the evaluator walks the steps **in order** and takes the first one that
 * (a) applies to the board, (b) names a row this character is actually offered, enabled, and
 * (c) has someone legal to aim at. That is the whole of "where the plan's next step cannot be
 * played right now, show the nearest step that can": a step that cannot be played is skipped, never
 * shown. Every line ends in a step that can always be played (a swing at the boss), so a decision
 * that is open always has a NEXT.
 *
 * ## What the player reads
 *
 * Only `why`. It is one plain sentence in the voice of a strategy guide: it never names where the
 * advice came from, never says a plan was adapted, never carries a section number. `from` is the
 * maintainers' pointer (which section of the notes the step follows) and is **never rendered**;
 * `tests/unit/guide-line-words.test.ts` fails on any rendered string that names a source.
 *
 * Pure data and no logic beyond the optional predicates the board conditions need, like every
 * other `src/data/**` module; the only imports are the shared battle contracts.
 */

import type { CombatantId, CommandKind, StatusId } from '../../battle/common/types.ts';

/** What a step needs to be true of the board. Every field present must hold. */
export interface LineWhen {
  /** The deciding character is one of these. */
  actor?: readonly CombatantId[];
  /** A living member of the party (or the aeon on the field) carries this status. */
  partyHas?: StatusId;
  /** At least this many living members carry `partyHas` (default 1). */
  partyHasAtLeast?: number;
  /** A living member of the party does not carry this status. */
  partyLacks?: StatusId;
  /** At least this many living members lack `partyLacks` (default 1). */
  partyLacksAtLeast?: number;
  /** Nobody living in the party carries this status. */
  partyLacksAll?: StatusId;
  /** The deciding character carries / lacks this status. */
  actorHas?: StatusId;
  actorLacks?: StatusId;
  /** The chapter's boss (its first standing id) carries / lacks this status. */
  bossHas?: StatusId;
  bossLacks?: StatusId;
  /** The boss's HP share is at or below / above this fraction of max. */
  bossBelowHp?: number;
  bossAboveHp?: number;
  /** A living party member is under this share of max HP (Zombies excluded: a heal would hurt them). */
  anyBelowHp?: number;
  /** The boss still has at least this much MP (a drain that is already spent has nothing left to do). */
  bossMpFrom?: number;
  /** The boss's Overdrive gauge (enemy gauges use the same 0-100 scale) is at or above this. */
  bossGaugeFrom?: number;
  /** A living Zombie in the party is under this share of max HP (the Holy Water rhythm: cure the worn one, heal it, let it be zombified again). */
  zombieBelowHp?: number;
  /** A living party member is under this many HP (not a share: a hit with a fixed size, like Ultima, needs a fixed floor). */
  anyBelowHpAbs?: number;
  /** A party member is down. */
  downed?: boolean;
  /** At least this many of the party are down at once (`downed: true` is one): the party is coming apart, not just short a member. */
  downedAtLeast?: number;
  /**
   * One of these telegraphs is live (a `charge` event's name, matched case-insensitively). `'#'`
   * stands for a numeric telegraph, the countdown some bosses publish as the state text itself.
   */
  charging?: readonly string[];
  /** The deciding character's stacks of this status are below `count`. */
  actorStacksBelow?: { status: StatusId; count: number };
  /** Every living party member's stacks of this status are below `count`. */
  allStacksBelow?: { status: StatusId; count: number };
  /** The battle's turn counter is at least / at most this. */
  turnFrom?: number;
  turnTo?: number;
  /** The boss is in this form (`enemy.formIndex`, 0-based) / in this form or a later one. */
  formIndex?: number;
  formFrom?: number;
  /** This chain link is standing on the enemy side. */
  bossId?: CombatantId;
  /** None of these is standing on the enemy side (dead, or not in this act): the kill order's earlier targets are gone. */
  foeGone?: readonly CombatantId[];
  /** The latest action this foe took (its `action-start`) was this ability id: a tell a script gives with no charge event (Ixion's Recharge). */
  foeLastAction?: { foe: CombatantId; ability: string };
  /** An aeon is on the field (`true`) or is not (`false`). */
  aeonOut?: boolean;
  /** `BattleState.flags` holds every one of these pairs (an AI script's own encounter state). */
  flags?: Readonly<Record<string, number | string | boolean>>;
  /** `BattleState.flags` holds none of these pairs (an order that is already standing, a state already reached). */
  flagsNot?: Readonly<Record<string, number | string | boolean>>;
  /** Each of these `BattleState.flags` is a number at or above the value (a script's gauge or counter). */
  flagFrom?: Readonly<Record<string, number>>;
  /** Each of these `BattleState.flags` is a number whose remainder after `mod` is `is` (a script's cycle counter). */
  flagMod?: Readonly<Record<string, { mod: number; is: number }>>;
  /** Each of these `BattleState.flags` is a comma-separated list naming `value` at least `atLeast` times (what each part of a boss shows). */
  flagListAtLeast?: Readonly<Record<string, { value: string; atLeast: number }>>;
  /** Each of these `BattleState.flags` is a number below the value (a counter that has not run out). */
  flagBelow?: Readonly<Record<string, number>>;
}

/** Who a step's command is pointed at, among the rows' legal targets. */
export type LineAim =
  /** The chapter's boss (first standing guide id), else the weakest foe. The default for a row that hits enemies. */
  | 'boss'
  /** The living ally lowest on HP, never a Zombie (a heal would hurt it). */
  | 'weakest'
  /** The first downed ally. */
  | 'downed'
  /** The deciding character. */
  | 'self'
  /** Whoever the row offers first (party-wide rows, no-target rows). */
  | 'first'
  /**
   * The first living ally carrying this status (a cure, a Dispel off an ally); `and` also requires a
   * second status on the same ally, and `lowest` picks the one lowest on HP instead of the first.
   */
  | { has: StatusId; and?: StatusId; lowest?: boolean }
  /** The first living ally missing this status (a buff), the named ally first when it is one of them. */
  | { lacks: StatusId; prefer?: CombatantId }
  /** The first standing foe in this order (a part before the boss, a link of a chain); `lacks` also skips a foe that already carries that status (a Break that is already on). */
  | { foes: readonly CombatantId[]; lacks?: StatusId }
  /** The foe that is lowest / highest on HP among these ids. */
  | { foesLowest: readonly CombatantId[] }
  | { foesHighest: readonly CombatantId[] }
  /** The standing part (a Pagoda, a Bulwark, a Redoubt: `flags.isPart`) lowest / highest on HP. */
  | { parts: 'lowest' | 'highest' }
  /** The part standing at the position where this comma-separated flag first names `value` (the disc showing that colour). */
  | { listed: { key: string; value: string; ids: readonly CombatantId[] } }
  /** A foe carrying / lacking this status (a Dispel, a Poison). */
  | { foeHas: StatusId }
  | { foeLacks: StatusId };

/** One step of a chapter's line. */
export interface LineStep {
  /** The offered rows that play this step, by menu label (case-insensitive); the first enabled one wins, in this order. */
  labels?: readonly string[];
  /** Or by kind, for rows with no stable label (`summon`, `defend`, `attack`). */
  kinds?: readonly CommandKind[];
  /** With `kinds: ['switch']`: only the row that brings this bench member in. */
  switchIn?: CombatantId;
  /** With a Grand Summon row: the aeon that arrives with a full gauge (the engine names none by default). */
  grandSummon?: string;
  when?: LineWhen;
  aim?: LineAim;
  /**
   * The reason line, as the player reads it: one plain sentence, present tense, no trailing full
   * stop. `{target}` and `{actor}` fill in with display names.
   */
  why: string;
  /** Which section of the notes this follows. For maintainers; never rendered. */
  from: string;
  /**
   * True for a step the plan itself does not contain: standing preparation the chapter needs where
   * the plan is silent (a ward, a heal threshold, a revive). The plan's own steps leave it unset.
   * Never rendered and never read by the panel; the measurement bench uses it to play the plan
   * alone and the whole line, so the two can be told apart.
   */
  support?: true;
}

/** A chapter's whole plan, in the order it is tried. */
export type GuideLine = readonly LineStep[];
