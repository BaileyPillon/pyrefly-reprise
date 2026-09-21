/**
 * The in-battle **move advisor**: the next best move for whoever is deciding
 * right now, with the numbers behind it.
 *
 * This is the reasoning half of `src/ui/common/MoveAdvisor.ts`, and it sits
 * beside `./guide.ts` rather than inside it. The two answer different
 * questions and the player wants both:
 *
 * | | Strategy guide (`guide.ts`) | Move advisor (this file) |
 * |---|---|---|
 * | Asks | *what was this fight designed around?* | *what should I press now, and what will it do?* |
 * | Source | the shipped tactic + a written, cited hint | the shipped tactic **plus** a simulation of every legal row |
 * | Says | "Holy Water → Auron — he is a Zombie and…" | "Holy Water → Auron · 0 MP · cures Zombie · always hits" |
 *
 * The guide is unchanged and still shows first; nothing here replaces it.
 *
 * ## How a suggestion is chosen
 *
 * 0. **Nothing that does nothing.** Every row the card is about to offer —
 *    the chapter's line included — has its simulated resolution read first,
 *    and one that changes nothing measurable on this board goes behind every
 *    row that changes something ({@link changesNothing}). A buff already on
 *    everyone, a cure with nothing to cure, a Break this boss is immune to: the
 *    advisor moves on rather than spending the player's turn on it. This is a
 *    re-ordering, not a score: the ranking below is untouched.
 * 1. **The chapter's own line wins when this actor can press it — and does
 *    something.**
 *    `recommendedCommand` runs the shipped `intendedStrategy` read-only through
 *    `guide.ts`'s `stateOnlyEngine`, so the advisor's top row and the
 *    auto-battler can never disagree about *what* to do. The advisor's job on
 *    that row is to say what it will cost and what it will do, which the tactic
 *    does not. "Can press it" is {@link ownedRow} and it is not a formality —
 *    the card's actor name, its rows and the menu in front of the player have
 *    to agree, so a line naming a move this character does not own is either
 *    turned into the switch that hands the turn to whoever does ({@link
 *    handOff}) or dropped for the simulated ranking.
 * 2. **Otherwise every legal row is simulated and scored.** Each candidate is
 *    resolved on a throwaway copy of the battle by `src/battle/<game>/simulate.ts` —
 *    the engine's real damage chain — and {@link scoreOutcome} turns the result
 *    into one number: damage to the boss, kills, healing that prevents a KO,
 *    a status cure that matters this turn, minus MP, minus harm to the party,
 *    minus the canon-aware penalties below.
 * 3. **A switch is shown with a runner-up.** Swapping a member in does nothing
 *    this turn by construction — it deals no damage and heals nobody — so it
 *    carries {@link SWITCH_PENALTY} and can only reach the top when the tactic
 *    itself chose it or when the bench is *clearly* better off in. Whenever it
 *    does reach the top, the best non-switch is shown beneath it, because
 *    "switch" alone is not an answer to "what do I press".
 * 4. **An ally on the floor always gets an answer.** When somebody is down and
 *    the top row is not the revive, the revive is the runner-up — or, when
 *    raising them now only feeds the boss a second kill, the card says so in
 *    one sentence (`AdvisorView.note`) instead of staying quiet. What a revive
 *    is worth is read off the board rather than fixed: see `./advisor-revive.ts`.
 *
 * ## The canon-aware penalties
 *
 * Three of the five encounters punish a move that looks obviously right, and a
 * scorer that only counted damage would walk into all three. The simulation
 * catches most of it on its own — a Cure aimed at a Zombie comes back as
 * *damage to an ally*, and an immune Break emits no `status-add` — so the
 * penalties here are small and named:
 *
 * - **A Break, Threaten or status move that lands nothing** and deals no
 *   damage is a wasted turn (Yunalesca and Braska's Final Aeon are immune to
 *   most of them) [ffx-yunalesca §7, ffx-bfa-yu-yevon §3].
 * - **Reflect on the party at Yunalesca** turns her own party-wide heals into
 *   something she cannot use *and* bounces Yuna's — the encounter's most
 *   expensive "clever" move [ffx-yunalesca §9.4].
 * - **Healing a Zombie** is damage, and the engine says so: the previewed
 *   `damage` event comes back positive [`types.ts` `FFXStatusId`].
 *
 * Everything here is pure and DOM-free, so `tests/unit/advisor.test.ts` can
 * drive it against real engines.
 */

import type {
  AbilityDef,
  AnyCombatant,
  AvailableCommand,
  BattleState,
  Command,
  CombatantId,
  StatusId,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { AbilityRegistry, ItemRegistry } from '../../battle/ffx2/internal.ts';
import type { FFXContentRegistry } from '../../battle/ffx/registry.ts';
import {
  abilityForCommand,
  simulateFFXCommand,
  previewCritChance,
  previewHitChance,
} from '../../battle/ffx/simulate.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import {
  abilityForCommand as abilityForCommandFfx2,
  simulateFFX2Command,
  previewCritChance as previewCritChanceFfx2,
  previewHitChance as previewHitChanceFfx2,
} from '../../battle/ffx2/simulate.ts';
import { buildGuideView, recommendedCommand, type GuideDecision } from './guide.ts';
import {
  type AdvisorIntent,
  type ReviveRisk,
  downedActives,
  reviveCaution,
  reviveReason,
  reviveRisk,
  reviveValue,
  zombieCureReason,
} from './advisor-revive.ts';
import { forecastFromState } from './advisor-forecast.ts';
import { floorNote } from './advisor-floor.ts';
import { changesNothing } from './advisor-guard.ts';
import {
  type StatusChance,
  bestChance,
  expectedStatusValue,
  inertAcrossBand,
  statusChances,
} from './advisor-roll.ts';
import { menuChipFor, onTheMenu } from './advisor-menu.ts';
import { scopeWord } from './targetLabel.ts';

export type { AdvisorIntent } from './advisor-revive.ts';
export { changesNothing } from './advisor-guard.ts';

// ------------------------------------------------------------------ the view

/** A damage or healing figure, swept across the engine's own variance roll. */
export interface AdvisorEstimate {
  /** What the numbers mean. `'none'` = the action changes no HP. */
  kind: 'damage' | 'heal' | 'none';
  /** Low, typical and high totals across every hit. Always non-negative. */
  min: number;
  mid: number;
  max: number;
  /** Landed hits at the typical roll. `> 1` means the totals are a sum. */
  hits: number;
  /** True when the typical roll takes the aimed target to 0 HP. */
  killsTarget: boolean;
}

/** One move the advisor is prepared to recommend. */
export interface MoveSuggestion {
  command: Command;
  /** The menu label, e.g. "Holy Water". */
  label: string;
  targetId: CombatantId | null;
  targetName: string | null;
  /** One line on what the move does, derived from its `AbilityDef`. */
  effect: string;
  estimate: AdvisorEstimate | null;
  mpCost: number;
  /** Percentage points, or `null` when the action cannot miss. */
  hitChance: number | null;
  /** Percentage points. `0` when the action cannot crit. Never inside the range. */
  critChance: number;
  /** Statuses this would put on, in display form. */
  statuses: string[];
  /** Statuses this would take off, in display form. */
  cures: string[];
  /** One line on why this is the pick. */
  reason: string;
  /**
   * The submenu the player presses to reach this row — "Items" in FFX, "Item"
   * in FFX-2 — or `''` when the row is already a top-level entry on the stack.
   *
   * The card prints it beside the label, and it is not decoration: Chapter 1's
   * Poison Fang is a *thrown item* every member carries, and named on its own
   * it reads as somebody else's ability. Bailey's report on the live build was
   * exactly that — "I'm controlling Tidus but the advisor is telling me to use
   * Poison Fang?" — for a row that was in Tidus's own Items list all along.
   *
   * Which makes it a promise about the menu, so it is computed from each
   * game's own grouping rule rather than from one shared table: see
   * `./advisor-menu.ts`, and the empty string is as load-bearing as the word —
   * "Attack · in Attack" is directions to the row you are standing on.
   */
  menu: string;
  /**
   * Research citation for the chapter's own line, when there is one.
   *
   * Kept on the data for the debug snapshot and **not printed on the card**:
   * "ffx-seymour-flux §6 rows 5-6" is a note to the people building the game,
   * not to the person holding the controller. The citations stay in the
   * strategy guide panel, which is where a player goes to ask *why*.
   */
  cite: string;
  /** A named warning when the move was penalised for being wasteful here. */
  warning: string;
  score: number;
  isSwitch: boolean;
  /** `'tactic'` when this is the line the chapter was designed around. */
  source: 'tactic' | 'simulated';
}

/** Everything the card shows for one open decision. */
export interface AdvisorView {
  actorId: CombatantId;
  actorName: string;
  /**
   * One suggestion, or two — the runner-up when the top row is a party switch,
   * and the revive when an ally is down and the top row is not one.
   */
  suggestions: MoveSuggestion[];
  /**
   * One plain sentence the card prints above the moves, or `''`.
   *
   * **It may only ever explain something the card is showing.** Two shapes
   * reach it, and {@link noteFor} is the only writer:
   *
   *  * the pick is the **cure** for a Zombie the board is carrying, and the
   *    note is that pick's reason (`zombieCureReason`);
   *  * a revive was priced and **refused** because the board kills them again
   *    the moment they stand up, and the note says when to spend it instead.
   *
   * A caution about a revive that *is* on the card rides on that suggestion's
   * own `warning` instead, so the sentence never appears twice. Everything else
   * — nobody down, a refusal whose remedy is not on the menu — is `''`.
   */
  note: string;
  /** How many legal rows were actually simulated, for the debug snapshot. */
  considered: number;
}

export interface AdvisorOptions {
  /** FFX-2 registries the live engine was built with (`ffx2EngineOptions()`). */
  ffx2?: { abilities?: AbilityRegistry; items?: ItemRegistry };
  /** FFX ability/item records. Defaults to the process-wide registry. */
  ffxContent?: FFXContentRegistry;
  /**
   * A **better** enemy-intent forecast than the one the advisor can derive.
   *
   * The advisor no longer depends on this. When an ally is down it builds its
   * own forecast from the board (`./advisor-forecast.ts`), because neither HUD
   * ever passed one and a safety rule that only runs in unit tests is not a
   * safety rule [critic, fix-3 round 1, F2]. A HUD that *does* pass its live
   * source still wins: that one reads the engine's real CTB counters and AI
   * memory, which a state-only rebuild cannot.
   */
  intent?: () => AdvisorIntent | null;
  /**
   * Run the **v2 planner** (`./advisor-plan.ts`) instead of the flat ranking.
   *
   * Defaults to on. The flag exists so the forty-seed bench
   * (`critic/bench/advisor-v2/`) can drive both orderings through one binary
   * and report them side by side — a regression in Chapters 1, 2, 4 or 5 has to
   * be visible against the version it replaced, not against a number in a
   * document [docs/plans/advisor-v2-review.md §8 R-1]. Passing `false` gives
   * exactly the pre-v2 behaviour.
   */
  planner?: boolean;
  /**
   * The engine's own answer to "what does this command do to the turn list",
   * supplied by a HUD that has an engine to ask.
   *
   * **FFX only** [AGENTS.md rule 14]: `predictTurnOrder` is on
   * `FFXBattleEngine` and X-2 has no turn list to lose position in. When it is
   * absent the tempo term is zero and tempo is **never cited** in the sentence,
   * so the planner is complete without it and the tests stay engine-only.
   */
  turnOrder?: (previewCommand?: Command) => readonly TurnPreview[];
}

// ----------------------------------------------------------------- the knobs

/**
 * What a party switch has to beat.
 *
 * A switch resolves to nothing this turn — `executeCommand` swaps the slots and
 * hands the turn to the incoming member — so its simulated value is zero and
 * any positive score it carries comes from {@link switchValue}'s read of the
 * bench. The penalty is set above the value of a *good* ordinary turn on
 * purpose: the user's instruction is that switching must be rare, and the only
 * boards that should clear this bar are the ones where the member standing in
 * the slot cannot usefully act at all.
 */
export const SWITCH_PENALTY = 12_000;

/** Score for killing an ordinary enemy; a boss is worth {@link BOSS_KILL_VALUE}. */
const KILL_VALUE = 2_000;
const BOSS_KILL_VALUE = 20_000;
/** Healing that takes an ally out of the band where the next hit kills them. */
const PREVENTS_KO_VALUE = 2_500;
/** HP fraction under which an ally counts as one hit from dead. */
const CRITICAL_HP = 0.3;
/** A status cure worth a whole turn — see {@link CURE_VALUE}. */
const CURE_VALUE: Partial<Record<string, number>> = {
  zombie: 4_000,
  petrify: 3_500,
  doom: 3_000,
  confuse: 1_800,
  berserk: 1_500,
  silence: 1_200,
  sleep: 1_200,
  poison: 900,
  darkness: 700,
  slow: 700,
};
/** A status worth putting on an enemy. */
const INFLICT_VALUE: Partial<Record<string, number>> = {
  slow: 1_400,
  'power-break': 1_100,
  'armor-break': 1_400,
  'magic-break': 1_100,
  'mental-break': 1_100,
  poison: 600,
  darkness: 500,
  silence: 800,
  doom: 2_000,
};
/** A move that tried to apply a status, applied none and dealt no damage. */
const WASTED_TURN_PENALTY = 3_000;
/** Reflect on a party member while Yunalesca holds the field. */
const REFLECT_AT_YUNALESCA_PENALTY = 8_000;
/** Per point of MP. Small — MP is a resource, not a reason to swing instead. */
const MP_WEIGHT = 1.5;
/** Every point of HP taken off the party by the player's own move. */
const FRIENDLY_FIRE_WEIGHT = 4;
/** At most this many simulations per decision, so a wide menu stays cheap. */
const MAX_SIMULATIONS = 60;

const YUNALESCA_ID = 'yunalesca';

// --------------------------------------------------------------- ownership

/**
 * The row **this actor** is actually offered for `command`, or `null`.
 *
 * The card's one unbreakable promise is that everything on it is something the
 * player can press *right now, on the menu in front of them*. `guide.ts`'s
 * `rowFor` is deliberately looser — it matches kind and id so the panel can
 * print a label for a command whose row has since been greyed out — and that
 * looseness is not safe for a card that says "press this". So this is the
 * stricter gate and every suggestion goes through it:
 *
 *  * the row exists in **this** decision's command list and is `enabled`;
 *  * the ability / item id matches exactly, so a Ronso Rage named like an item
 *    can never stand in for the item;
 *  * a switch matches on the incoming member, which is what distinguishes one
 *    switch row from another (they share `kind` and carry no id);
 *  * every aimed target is in that row's own `validTargets`, so a command
 *    aimed at somebody this row cannot reach is refused rather than printed.
 */
export function ownedRow(
  commands: readonly AvailableCommand[],
  command: Command,
): AvailableCommand | null {
  const id = 'id' in command ? String((command as { id?: unknown }).id) : '';
  const inId = (command as { extra?: { inId?: CombatantId } }).extra?.inId;
  for (const row of commands) {
    if (!row.enabled) continue;
    if (row.command.kind !== command.kind) continue;
    const rowId = 'id' in row.command ? String((row.command as { id?: unknown }).id) : '';
    if (rowId !== id) continue;
    if (command.kind === 'switch') {
      const rowIn = (row.command as { extra?: { inId?: CombatantId } }).extra?.inId;
      if (inId !== undefined && rowIn !== undefined && inId !== rowIn) continue;
    }
    const targets = command.targets as readonly CombatantId[];
    if (targets.length > 0 && !targets.every((t) => row.validTargets.includes(t))) continue;
    return row;
  }
  return null;
}

/**
 * The same gate, for a **meta command** whose aim is taken in a second step.
 *
 * ## The row this exists for, and what it cost
 *
 * Lulu's Doublecast is offered as `{ label: 'Doublecast', enabled: true,
 * validTargets: ['lulu'] }` — the row aims at its own caster, because pressing
 * it opens the two spells it chains and *those* pick the enemy. Chapter 3's
 * tactic accordingly returns `ability:doublecast -> braskas-final-aeon`, which
 * the engine accepts and resolves; {@link ownedRow} refuses it, because the
 * boss is not in the row's `validTargets`.
 *
 * So on **every Lulu turn of Chapter 3** the card silently threw the chapter's
 * own line away and fell back to its simulated ranking — an X-Potion, a
 * Lunar Curtain, a NulBlaze. Measured on forty seeds, 2026-09-21: the chapter's
 * line wins 39/40 in a median 215 turns; a player following the card won
 * **0 of 40**, thirty defeats and ten stalemates, median 448 turns. That one
 * `continue` is the whole of it.
 *
 * The loosening is deliberately the narrowest shape that covers it: the row
 * must exist, be enabled, match kind and id exactly, and offer **only the actor
 * itself**. A row that lists real targets is still held to every one of them,
 * so an aim at somebody a move cannot reach is refused exactly as before. The
 * card's promise is unchanged — this row is on this actor's menu and can be
 * pressed right now — and the aim is the chapter tactic's business, which is
 * where the engine takes it from anyway.
 *
 * **Both games** [AGENTS.md rule 14]: the rule is a property of the card's
 * ownership gate, not of CTB or ATB. Measured in FFX (Doublecast); FFX-2 ships
 * no self-only meta row today, and the absence is asserted rather than assumed
 * (`tests/unit/advisor-plan.test.ts`).
 */
export function metaRowFor(
  commands: readonly AvailableCommand[],
  actorId: CombatantId,
  command: Command,
): AvailableCommand | null {
  const targets = command.targets as readonly CombatantId[];
  if (targets.length === 0) return null;
  if (targets.every((t) => t === actorId)) return null;
  const id = 'id' in command ? String((command as { id?: unknown }).id) : '';
  if (!id) return null;
  for (const row of commands) {
    if (!row.enabled) continue;
    if (row.command.kind !== command.kind) continue;
    const rowId = 'id' in row.command ? String((row.command as { id?: unknown }).id) : '';
    if (rowId !== id) continue;
    if (row.validTargets.length !== 1 || row.validTargets[0] !== actorId) continue;
    return row;
  }
  return null;
}

/** The gate a tactic's own pick is held to: the strict row, or a meta row. */
function tacticRow(
  commands: readonly AvailableCommand[],
  actorId: CombatantId,
  command: Command,
): AvailableCommand | null {
  return ownedRow(commands, command) ?? metaRowFor(commands, actorId, command);
}

/**
 * The living party member who knows `command`'s ability, when the acting one
 * does not — the "that is somebody else's move" case.
 *
 * Reads the members' own learned and Overdrive lists rather than a table, so a
 * build change cannot leave a stale answer behind. Returns `null` for anything
 * without an id (Attack, Defend, a switch) and for FFX-2, which carries its
 * command sets on dresspheres instead.
 */
export function abilityOwner(
  state: Readonly<BattleState>,
  command: Command,
  exclude: CombatantId,
): AnyCombatant | null {
  const id = 'id' in command ? String((command as { id?: unknown }).id) : '';
  if (!id) return null;
  for (const memberId of [...state.activeIds, ...state.reserveIds]) {
    if (memberId === exclude) continue;
    const c = state.combatants[memberId];
    if (!c || !c.alive) continue;
    const known = [
      ...((c as { learnedAbilityIds?: readonly string[] }).learnedAbilityIds ?? []),
      ...((c as { overdrive?: { unlockedOverdriveIds?: readonly string[] } }).overdrive
        ?.unlockedOverdriveIds ?? []),
    ].map(String);
    if (known.includes(id)) return c;
  }
  return null;
}

// ------------------------------------------------------------------- reading

function isEnemy(c: AnyCombatant | undefined): boolean {
  return c?.side === 'enemy';
}

function hpFraction(c: AnyCombatant): number {
  return c.hp / Math.max(1, c.stats.maxHp);
}

function has(c: AnyCombatant | undefined, status: string): boolean {
  return c !== undefined && (c.statuses as Record<string, unknown>)[status] !== undefined;
}

/** The biggest enemy on the field that is not a destructible part. */
function primaryBoss(state: Readonly<BattleState>): AnyCombatant | null {
  let best: AnyCombatant | null = null;
  for (const id of state.enemyIds) {
    const c = state.combatants[id];
    if (!c || !c.alive || c.flags.isPart) continue;
    if (!best || c.stats.maxHp > best.stats.maxHp) best = c;
  }
  return best;
}

/** `'power-break'` → `'Power Break'`. There is no status-name table to share. */
export function statusLabel(status: StatusId | string): string {
  return String(status)
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * One line on what a move does, from its own record.
 *
 * `AbilityDef` has no description field and FFX's `commands.ts` writes no
 * `help`, so this is derived rather than read: formula and damage type, hit
 * count, element, what it inflicts and what it cures. Deriving it means a data
 * agent retuning a spell cannot leave a stale sentence behind.
 */
export function describeAbility(
  def: AbilityDef | null,
  row?: AvailableCommand,
  command?: Command,
): string {
  if (row?.help) return row.help;
  // The rows that resolve to no `AbilityDef` at all. `executeCommand` handles
  // each of them before it reaches the ability path, so there is no record to
  // read and the sentence has to be written here.
  switch (command?.kind) {
    case 'summon':
      return `Calls ${row?.label ?? 'the aeon'} onto the field — the party steps out and its counters freeze`;
    case 'dismiss':
      return 'Sends the aeon away and brings the party back in';
    case 'defend':
      return 'Braces: halves the damage of the next physical hit';
    case 'switch':
      return 'Swaps a bench member into the slot; they take this turn';
    default:
      break;
  }
  if (!def) return '';
  const parts: string[] = [];
  const el = def.element.filter((e) => e !== 'none');
  const heals = def.flags.includes('heals');
  const revives = def.flags.includes('misses-if-target-alive');
  const scope =
    def.targeting === 'all-enemies'
      ? ' to all enemies'
      : def.targeting === 'all-allies'
        ? ' to the party'
        : '';

  // The `heals` flag is a *sign* flag on the damage chain, not a promise of
  // HP: Hastega carries it with `formula: 'ctb'`, because what it makes
  // negative is a CTB counter. Only a formula that produces HP gets the
  // "Restores HP" line [`types.ts` FormulaKey, `whitemagic-haste-slow.ts`].
  const restoresHp =
    heals && def.formula !== 'ctb' && def.formula !== 'none' && def.formula !== 'multiple';
  if (revives) parts.push('Revives a fallen ally');
  else if (restoresHp) parts.push(`Restores HP${scope}`);
  else if (def.formula === 'ctb') {
    // Round 03 blocker: this used to gate the noun on `heals` (a *sign* flag —
    // see the comment above `restoresHp` — not a scope flag), so single-target
    // Haste and Chocobo Feather (`targeting: 'single-ally'`, `heals`) both read
    // "Speeds the party's turns up". The scope word has to come from
    // `def.targeting` — the same source `scope` above is computed from — not
    // from whether the CTB change happens to be a speed-up.
    const ctbWho =
      def.targeting === 'all-allies' ? 'the party' : def.targeting === 'all-enemies' ? 'the enemies' : 'the target';
    const ctbNoun = def.targeting === 'all-allies' || def.targeting === 'all-enemies' ? 'turns' : 'turn';
    parts.push(heals ? `Speeds ${ctbWho}’s ${ctbNoun} up` : `Pushes ${ctbWho}’s ${ctbNoun} back`);
  } else if (def.flags.includes('drains')) parts.push('Drains HP to the user');
  else if (def.formula === 'percent-current') parts.push('Takes a fraction of current HP');
  else if (def.formula === 'fixed') parts.push(`Fixed damage${scope}`);
  else if (def.formula !== 'none' && def.power > 0) {
    const kind = def.damageType === 'magical' ? 'magic' : def.damageType === 'physical' ? 'physical' : '';
    parts.push(`${el.length > 0 ? `${statusLabel(el[0]!)} ` : ''}${kind} damage${scope}`.replace(/\s+/g, ' ').trim());
  }
  if (def.hits > 1) parts.push(`${def.hits} hits`);
  if (def.minigame) parts.push('timed input');
  if (def.statusEffects.length > 0) {
    parts.push(`inflicts ${def.statusEffects.map((s) => statusLabel(s.status)).join(', ')}`);
  }
  if (def.removesStatuses.length > 0) {
    parts.push(`cures ${def.removesStatuses.map((s) => statusLabel(s)).join(', ')}`);
  }
  if (parts.length === 0) parts.push(def.name);
  const first = parts[0]!;
  return [first[0]!.toUpperCase() + first.slice(1), ...parts.slice(1)].join(' · ');
}

// ---------------------------------------------------------------- simulation

type Sim = (state: Readonly<BattleState>, actorId: CombatantId, command: Command, roll: 'min' | 'mid' | 'max') => SimOutcome | null;

function simulatorFor(state: Readonly<BattleState>, options: AdvisorOptions): Sim {
  if (state.game === 'ffx2') {
    return (s, actorId, command, roll) =>
      simulateFFX2Command(s, actorId, command, {
        roll,
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
  }
  return (s, actorId, command, roll) =>
    simulateFFXCommand(s, actorId, command, {
      roll,
      ...(options.ffxContent ? { content: options.ffxContent } : {}),
    });
}

// -------------------------------------------------------------------- aiming

/**
 * The handful of targets worth previewing for one row.
 *
 * Simulating every legal target of every legal row is quadratic on a Lulu turn
 * and most of it is noise, so each row is aimed at the targets that could
 * plausibly be the right one: whoever is carrying a status this move cures,
 * whoever is down when the move revives, the weakest enemy, the boss, and the
 * neediest ally. Capped at three.
 */
function aimCandidates(
  state: Readonly<BattleState>,
  row: AvailableCommand,
  def: AbilityDef | null,
): Array<CombatantId | null> {
  if (row.validTargets.length === 0) return [null];
  const valid = new Set(row.validTargets);
  const out: CombatantId[] = [];
  const add = (id: CombatantId | undefined): void => {
    if (id && valid.has(id) && !out.includes(id)) out.push(id);
  };

  // Whoever this move would cure.
  for (const status of def?.removesStatuses ?? []) {
    add(row.validTargets.find((id) => has(state.combatants[id], status)));
  }
  // Whoever it would stand back up.
  if (def?.flags.includes('misses-if-target-alive')) {
    add(row.validTargets.find((id) => state.combatants[id]?.alive === false));
  }
  const enemyTargets = row.validTargets.filter((id) => isEnemy(state.combatants[id]));
  if (enemyTargets.length > 0) {
    // The boss, then the one closest to dying.
    const boss = primaryBoss(state);
    if (boss) add(enemyTargets.find((id) => id === boss.id));
    add([...enemyTargets].sort((a, b) => (state.combatants[a]?.hp ?? 0) - (state.combatants[b]?.hp ?? 0))[0]);
  } else {
    // The ally who needs it most.
    const allies = row.validTargets.filter((id) => !isEnemy(state.combatants[id]));
    add(
      [...allies].sort(
        (a, b) => hpFraction(state.combatants[a]!) - hpFraction(state.combatants[b]!),
      )[0],
    );
  }
  add(row.validTargets[0]);
  return out.slice(0, 3);
}

// ------------------------------------------------------------------- scoring

/**
 * One number for one previewed outcome. Higher is better.
 *
 * Reads only the simulation's report, never the ability record, so a move that
 * *claims* to inflict Slow and is refused by an immune boss scores as the
 * wasted turn it is.
 */
export function scoreOutcome(
  state: Readonly<BattleState>,
  outcome: SimOutcome,
  ctx: {
    command: Command;
    def: AbilityDef | null;
    intent?: AdvisorIntent | null;
    /**
     * The odds each status this action aims actually lands, from the engine's
     * own formula (`./advisor-roll.ts`).
     *
     * Optional so the nine existing callers and their tests keep their meaning.
     * When it is supplied, a move whose status **could** have landed is priced
     * at its expectation instead of being charged {@link WASTED_TURN_PENALTY}
     * for a median branch that said no — the single behaviour that lost
     * Chapter 3 forty times out of forty.
     */
    chances?: readonly StatusChance[];
  },
): { score: number; warning: string } {
  const boss = primaryBoss(state);
  let score = 0;
  let warning = '';

  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    const c = state.combatants[id];
    if (!c) continue;
    if (isEnemy(c)) {
      // A part is worth less than the same damage on the boss itself.
      score += delta * (c.flags.isPart ? 0.6 : 1);
    }
  }

  for (const id of outcome.kills) {
    const c = state.combatants[id];
    if (!c) continue;
    if (isEnemy(c)) score += boss && id === boss.id ? BOSS_KILL_VALUE : KILL_VALUE;
    else score -= BOSS_KILL_VALUE; // killing your own is never the move
  }

  score += outcome.healingToAllies;
  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    const c = state.combatants[id];
    if (!c || isEnemy(c) || delta >= 0) continue;
    if (c.alive && hpFraction(c) < CRITICAL_HP) score += PREVENTS_KO_VALUE;
  }
  // Not a flat number: what a revive is worth is who is on the floor, how far
  // the party has already collapsed and whether they survive standing up. See
  // `./advisor-revive.ts`.
  // `hpDelta` is positive for damage, so the HP a raise gives back is the
  // negative one — measured rather than assumed, which is what tells a Phoenix
  // Down's sliver apart from a Mega Phoenix's full bar when the question is
  // whether the next hit puts them straight back down.
  for (const id of outcome.revives) {
    score += reviveValue(state, id, ctx.intent ?? null, restoredHp(outcome, id));
  }
  const raised = outcome.revives[0];
  const risk = raised ? reviveRisk(state, raised, ctx.intent ?? null, restoredHp(outcome, raised)) : null;
  const caution = raised && !risk ? reviveCaution(state, raised, ctx.intent ?? null, restoredHp(outcome, raised)) : '';

  for (const change of outcome.statusChanges) {
    const target = state.combatants[change.targetId];
    if (!target) continue;
    if (change.applied) {
      if (isEnemy(target)) score += INFLICT_VALUE[change.status] ?? 200;
      else if (change.status === 'reflect' && state.combatants[YUNALESCA_ID]) {
        score -= REFLECT_AT_YUNALESCA_PENALTY;
        warning = 'Reflect bounces Yuna’s own heals here';
      } else score += 300;
    } else if (!isEnemy(target)) {
      score += CURE_VALUE[change.status] ?? 400;
    }
  }

  // The engine's own verdict on a heal aimed at a Zombie: positive damage.
  if (outcome.harmToAllies > 0) {
    score -= outcome.harmToAllies * FRIENDLY_FIRE_WEIGHT;
    const zombie = Object.keys(outcome.hpDelta).find(
      (id) => !isEnemy(state.combatants[id]) && has(state.combatants[id], 'zombie'),
    );
    if (zombie && ctx.def?.flags.includes('heals')) {
      warning = `Healing a Zombie is damage — ${state.combatants[zombie]?.name ?? zombie} takes it`;
    } else if (!warning) warning = 'Costs the party HP';
  }

  // **The coin flip, priced as one.** A status the median branch missed is not
  // an event, so nothing above has paid for it; here it is worth its own odds
  // times what landing it is worth. `INFLICT_VALUE` / `CURE_VALUE` are the same
  // tables the landed half is scored from, so a 40 % Slow is worth 40 % of a
  // landed Slow and no more [./advisor-roll.ts].
  if (ctx.chances && ctx.chances.length > 0) {
    score += expectedStatusValue(ctx.chances, (status, targetId) => {
      const target = state.combatants[targetId];
      if (!target) return 0;
      if (isEnemy(target)) return INFLICT_VALUE[status] ?? 200;
      if (status === 'reflect' && state.combatants[YUNALESCA_ID]) return -REFLECT_AT_YUNALESCA_PENALTY;
      return 300;
    });
  }

  // Tried to apply something, applied nothing, did nothing.
  //
  // **Only when there was no branch it could have won.** The preview answers a
  // status roll at its median, so "applied nothing" covers both a target that
  // is immune — a genuinely wasted turn — and one where the move lands two
  // times in five. Charging the second as the first is what told a Chapter 3
  // player to press Cheer while Braska's Final Aeon ran out the watchdog
  // [docs/plans/advisor-v2-review.md §2.2; measured 0/40 before, in the handoff
  // after]. With no `chances` supplied the old reading stands unchanged.
  const tried = ctx.def?.statusEffects.length ?? 0;
  const couldLand = ctx.chances ? bestChance(ctx.chances) > 0 : false;
  if (
    tried > 0 &&
    !couldLand &&
    outcome.statusChanges.every((c) => !c.applied) &&
    outcome.damageToEnemies === 0
  ) {
    score -= WASTED_TURN_PENALTY;
    if (!warning) warning = 'This target is immune — nothing lands';
  }

  score -= outcome.mpSpent * MP_WEIGHT;
  if (outcome.rejected) score -= 1_000_000;
  // The re-kill warning outranks anything above it: a revive into a telegraphed
  // Lance of Atrophy is the most expensive mistake on the board. A caution is
  // the softer half of the same reading — the raise is still the pick, and the
  // player is told what is coming for them.
  if (risk) warning = risk.sentence;
  else if (caution) warning = caution;
  return { score, warning };
}

/** HP a previewed action stood `id` back up with. See {@link scoreOutcome}. */
function restoredHp(outcome: SimOutcome, id: CombatantId): number {
  const delta = outcome.hpDelta[id] ?? 0;
  return delta < 0 ? -delta : 0;
}

/**
 * What a party switch is worth, before {@link SWITCH_PENALTY}.
 *
 * Nothing resolves on a switch turn, so there is no simulation to read: the
 * value is entirely "is the bench better off in this slot than whoever is
 * standing in it". The two cases that actually earn a switch are a member who
 * cannot act (Petrified, Zombie with a revive incoming, Berserk on a healer)
 * and one who is about to die with a full-health replacement waiting.
 */
export function switchValue(state: Readonly<BattleState>, command: Command): number {
  if (command.kind !== 'switch') return 0;
  const out = state.combatants[command.extra.outId];
  const incoming = state.combatants[command.extra.inId];
  if (!out || !incoming) return 0;
  let value = 0;
  if (!out.alive) value += 9_000;
  for (const blocked of ['petrify', 'zombie', 'confuse', 'berserk', 'sleep'] as const) {
    if (has(out, blocked)) value += 4_000;
  }
  const gap = hpFraction(incoming) - hpFraction(out);
  if (gap > 0) value += gap * 6_000;
  return value;
}

// --------------------------------------------------------------- the reasons

function formatRange(e: AdvisorEstimate): string {
  if (e.min === e.max) return `${e.mid}`;
  return `${e.min}–${e.max}`;
}

/** One sentence on why this row is the pick, written from the simulation. */
function reasonFor(
  state: Readonly<BattleState>,
  s: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'>,
  outcome: SimOutcome,
  chances: readonly StatusChance[] = [],
): string {
  const target = s.targetId ? state.combatants[s.targetId] : undefined;
  const name = target?.name ?? 'the target';
  if (s.isSwitch) return `${state.combatants[(s.command as { extra: { inId: CombatantId } }).extra.inId]?.name ?? 'The bench'} can act this turn; the slot cannot`;
  if (s.command.kind === 'summon') return `${s.label} takes the hits while the party’s counters are frozen`;
  if (s.command.kind === 'dismiss') return 'Puts the party back on the field';
  if (s.command.kind === 'defend') return 'Nothing better is offered — brace for the hit';
  if (outcome.kills.some((id) => isEnemy(state.combatants[id]))) return `Finishes ${name}`;
  // Not "stands them back up" — the player can see that. What they cannot see
  // is what the party has been doing without since that member went down.
  if (outcome.revives.length > 0) return reviveReason(state, outcome.revives[0]!);
  const cured = outcome.statusChanges.find((c) => !c.applied && !isEnemy(state.combatants[c.targetId]));
  if (cured) {
    return `Clears ${statusLabel(cured.status)} from ${state.combatants[cured.targetId]?.name ?? 'them'}`;
  }
  if (outcome.healingToAllies > 0) {
    const critical = Object.entries(outcome.hpDelta).find(
      ([id, d]) => d < 0 && !isEnemy(state.combatants[id]) && hpFraction(state.combatants[id]!) < CRITICAL_HP,
    );
    return critical
      ? `${state.combatants[critical[0]]?.name ?? 'They'} is one hit from down`
      : `Puts ${outcome.healingToAllies} HP back`;
  }
  const inflicted = outcome.statusChanges.find((c) => c.applied && isEnemy(state.combatants[c.targetId]));
  if (inflicted) return `Lands ${statusLabel(inflicted.status)} on ${name}`;
  const buffs = outcome.statusChanges.filter((c) => c.applied && !isEnemy(state.combatants[c.targetId]));
  if (buffs.length > 0) {
    // Counted by distinct status and distinct target, not by event: Mighty
    // Guard puts six statuses on three members and emits eighteen changes,
    // which read as "Protect on 18 of the party".
    const names = [...new Set(buffs.map((b) => statusLabel(b.status)))];
    const who = new Set(buffs.map((b) => b.targetId));
    const list = names.slice(0, 2).join(' and ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
    return who.size > 1
      ? `${list} on the party`
      : `${list} on ${state.combatants[buffs[0]!.targetId]?.name ?? 'them'}`;
  }
  if (s.estimate && s.estimate.kind === 'damage' && s.estimate.mid > 0) {
    return `Most damage on the board — ${formatRange(s.estimate)} to ${name}`;
  }
  // **The gamble, said out loud.** Nothing landed at the median branch, but the
  // roll is still to come — the Chapter 3 case, where Slow on a Yu Pagoda is
  // the move that wins the fight and misses three times in five. The card is
  // required to be honest about that rather than either hiding it or dropping
  // the row [docs/plans/advisor-v2-review.md §4.4; Bailey's own question 3 in
  // §9 is still open, so the voice here states the odds and no more].
  const gamble = bestTry(chances);
  if (gamble) {
    const on = state.combatants[gamble.targetId]?.name ?? name;
    return `${statusLabel(gamble.status)} on ${on} — about ${Math.round(gamble.percent)} in 100, and it is the line`;
  }
  return 'The best of what is offered';
}

/** The likeliest application this action still has a roll coming for. */
function bestTry(chances: readonly StatusChance[]): StatusChance | null {
  let best: StatusChance | null = null;
  for (const c of chances) {
    if (c.landedAtMedian || c.percent <= 0) continue;
    if (!best || c.percent > best.percent) best = c;
  }
  return best;
}

// --------------------------------------------------------------------- build

interface Candidate {
  suggestion: MoveSuggestion;
  outcome: SimOutcome | null;
  /** The row and aim this came from, so the range can be filled in later. */
  origin: { row: AvailableCommand; targetId: CombatantId | null } | null;
  /** Every status this row is rolling for, with its real odds. See `./advisor-roll.ts`. */
  chances: readonly StatusChance[];
}

/**
 * Build one candidate: aim the row, simulate it three ways, price it.
 *
 * `null` when the simulation could not run (an Escape, a Trigger, a scripted
 * rule that threw) — the advisor would rather drop a row than print a figure it
 * did not compute.
 */
function candidateFor(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  commands: readonly AvailableCommand[],
  row: AvailableCommand,
  targetId: CombatantId | null,
  sim: Sim,
  intent: AdvisorIntent | null,
  planner: boolean,
  withRange = false,
): Candidate | null {
  const command = { ...row.command, targets: targetId ? [targetId] : [] } as Command;
  const mid = sim(state, actorId, command, 'mid');
  if (!mid) return null;
  const def = mid.ability;
  // Ranking only ever compares typical outcomes, so the two extra rolls are
  // deferred to {@link withRange} — they are run for the one or two rows the
  // card actually prints, not for all forty a black mage is offered. Ranking
  // every row three ways was ~200ms per open menu on a wide command list.
  const min = withRange ? (sim(state, actorId, command, 'min') ?? mid) : mid;
  const max = withRange ? (sim(state, actorId, command, 'max') ?? mid) : mid;

  const target = targetId ? state.combatants[targetId] : undefined;
  // A party-wide spell is aimed at one id so the engine can resolve it, but
  // naming that id on the card reads as "Hastega on Tidus" for a move that
  // hits all three. The scope word is what the player sees — shared with
  // `guide.ts` through `scopeWord` so the two panels can never disagree
  // about it (`./targetLabel.ts`).
  const scoped = scopeWord(def?.targeting);
  const toEnemies = [mid.damageToEnemies, min.damageToEnemies, max.damageToEnemies];
  const toAllies = [mid.healingToAllies, min.healingToAllies, max.healingToAllies];
  let estimate: AdvisorEstimate | null = null;
  if (toEnemies[0]! > 0 || toEnemies[2]! > 0) {
    estimate = {
      kind: 'damage',
      min: Math.min(min.damageToEnemies, mid.damageToEnemies),
      mid: mid.damageToEnemies,
      max: Math.max(max.damageToEnemies, mid.damageToEnemies),
      hits: mid.hits,
      killsTarget: targetId !== null && mid.kills.includes(targetId),
    };
  } else if (toAllies[0]! > 0 || toAllies[2]! > 0) {
    estimate = {
      kind: 'heal',
      min: Math.min(min.healingToAllies, mid.healingToAllies),
      mid: mid.healingToAllies,
      max: Math.max(max.healingToAllies, mid.healingToAllies),
      hits: mid.hits,
      killsTarget: false,
    };
  }

  const ffx2 = state.game === 'ffx2';
  const hitChance = def
    ? ffx2
      ? previewHitChanceFfx2(state, actorId, targetId, def)
      : previewHitChance(state, actorId, targetId, def)
    : null;
  const critChance = def
    ? ffx2
      ? previewCritChanceFfx2(state, actorId, targetId, def)
      : previewCritChance(state, actorId, targetId, def)
    : 0;

  // The probability band is the v2 half and is switchable, so the forty-seed
  // bench can put the two orderings side by side in one binary (`AdvisorOptions
  // .planner`). The ownership and command-identity repairs above it are plain
  // correctness and are not switchable.
  const chances = planner ? statusChances(state, actorId, command, mid) : [];
  const scored = scoreOutcome(state, mid, {
    command,
    def,
    intent,
    ...(planner ? { chances } : {}),
  });
  const base: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'> = {
    command,
    label: row.label,
    menu: menuChipFor(state.game, commands, row),
    targetId,
    targetName: scoped ?? target?.name ?? null,
    effect: describeAbility(def, row, command),
    estimate,
    mpCost: row.mpCost,
    hitChance: hitChance === null ? null : Math.round(hitChance),
    critChance: Math.round(critChance),
    statuses: mid.statusChanges.filter((c) => c.applied).map((c) => statusLabel(c.status)),
    cures: mid.statusChanges.filter((c) => !c.applied).map((c) => statusLabel(c.status)),
    warning: scored.warning,
    isSwitch: command.kind === 'switch',
  };

  return {
    outcome: mid,
    origin: { row, targetId },
    chances,
    suggestion: {
      ...base,
      reason: reasonFor(state, base, mid, chances),
      cite: '',
      score: scored.score,
      source: 'simulated',
    },
  };
}

/** A switch row, which resolves to nothing and so is priced rather than simulated. */
function switchCandidate(
  state: Readonly<BattleState>,
  commands: readonly AvailableCommand[],
  row: AvailableCommand,
  targetId: CombatantId | null,
): Candidate {
  const command = { ...row.command, targets: targetId ? [targetId] : [] } as Command;
  const incoming = command.kind === 'switch' ? state.combatants[command.extra.inId] : undefined;
  const base: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'> = {
    command,
    label: row.label,
    // FFX collapses every reserve into one Switch group, which opens its list
    // even for a single benched member; FFX-2 has no bench at all.
    menu: menuChipFor(state.game, commands, row),
    targetId: incoming?.id ?? null,
    // No target name: FFX labels a Switch row with the incoming member's own
    // name, so printing the target too reads "Auron -> Auron".
    targetName: null,
    effect: 'Swaps a bench member into the slot; they take this turn',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: true,
  };
  const value = switchValue(state, command);
  return {
    outcome: null,
    origin: null,
    chances: [],
    suggestion: {
      ...base,
      reason:
        value >= SWITCH_PENALTY
          ? `${incoming?.name ?? 'The bench'} can act and the slot cannot`
          : `${incoming?.name ?? 'The bench'} takes the turn instead — rarely worth it`,
      cite: '',
      score: value - SWITCH_PENALTY,
      source: 'simulated',
    },
  };
}

/**
 * The advisor's answer for one open decision, or `null` when there is nothing
 * legal to say.
 */
export function buildAdvisorView(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  options: AdvisorOptions = {},
): AdvisorView | null {
  const actor = state.combatants[decision.actorId];
  if (!actor) return null;
  const planner = options.planner !== false;
  const sim = simulatorFor(state, options);
  // The forecast is only ever read by the revive rules, and a prediction is a
  // dozen board clones — so it is asked for exactly when somebody is on the
  // floor and the question "does this raise survive" can actually come up.
  let intent: AdvisorIntent | null = null;
  if (downedActives(state).length > 0) {
    try {
      intent = options.intent?.() ?? forecastFromState(state, options);
    } catch {
      // A forecast is never worth a card. The advisor reads the board instead.
      intent = null;
    }
  }

  const candidates: Candidate[] = [];
  let simulations = 0;
  for (const row of orderedRows(state, decision.commands, options)) {
    if (!row.enabled) continue;
    if (row.command.kind === 'escape') continue;
    // A row the player cannot reach from the command window is not advice,
    // whatever the simulation thinks of it — FFX's menu has no Defend entry.
    if (!onTheMenu(state.game, row.command)) continue;
    if (row.command.kind === 'switch') {
      candidates.push(switchCandidate(state, decision.commands, row, row.validTargets[0] ?? null));
      continue;
    }
    const def = defFor(state, row.command, options);
    for (const targetId of aimCandidates(state, row, def)) {
      if (simulations >= MAX_SIMULATIONS) break;
      simulations += 1;
      const candidate = candidateFor(state, decision.actorId, decision.commands, row, targetId, sim, intent, planner);
      if (candidate) candidates.push(candidate);
    }
  }

  candidates.sort((a, b) => b.suggestion.score - a.suggestion.score);

  // The chapter's own line, when this actor can actually press it, is the top
  // row. `tacticSuggestion` returns `null` rather than a row from somebody
  // else's menu, and the ranking below stands in for it when it does.
  const tactic = tacticSuggestion(state, decision, candidates, sim, intent, planner);
  const ranked = tactic
    ? [tactic, ...candidates.filter((c) => !sameCommand(c.suggestion.command, tactic.suggestion.command))]
    : candidates;

  // **The hard gate.** Nothing reaches the card that this actor cannot press on
  // the menu currently in front of them — not a stale candidate, not a tactic's
  // re-aim, not a row that was greyed out between the simulation and here, and
  // not a row this game's command window does not paint at all ({@link
  // onTheMenu}; FFX drops Defend).
  const legal = ranked.filter(
    (c) =>
      (c.suggestion.source === 'tactic'
        ? tacticRow(decision.commands, decision.actorId, c.suggestion.command)
        : ownedRow(decision.commands, c.suggestion.command)) !== null &&
      onTheMenu(state.game, c.suggestion.command),
  );
  if (legal.length === 0) return null;

  // **The state guard.** Anything whose simulated resolution changes nothing
  // measurable on this board goes behind everything that does something — the
  // chapter's own line included, which is the whole of PR-0006 ({@link
  // changesNothing}). Order inside each half is untouched, so this re-orders
  // the ranking without touching the scoring: the tactic still outranks the
  // simulated rows, and the simulated rows still sit in score order. When
  // *nothing* on the menu does anything the list stands as it was, because
  // "there is nothing useful to press" is still answered with the best of what
  // is offered rather than with an empty card.
  //
  // **The band.** Inert is read across the whole probability band, not off one
  // median branch: a status move whose target is immune is a wasted turn, and
  // one that lands two times in five is the move that wins Chapter 3. Before
  // this split read the band, a card-follower lost Braska's Final Aeon on all
  // forty seeds while the chapter's own line won thirty-nine of them
  // [`./advisor-roll.ts#inertAcrossBand`].
  const useful: Candidate[] = [];
  const inert: Candidate[] = [];
  for (const c of legal) {
    const dead = planner
      ? inertAcrossBand(decision.actorId, c.suggestion.command, c.outcome, c.chances)
      : changesNothing(decision.actorId, c.suggestion.command, c.outcome);
    (dead ? inert : useful).push(c);
  }
  const ordered = useful.length > 0 ? [...useful, ...inert] : legal;

  const shown: Candidate[] = [ordered[0]!];
  /** A revive this board was offered, priced, and refused. See {@link noteFor}. */
  let refused: { risk: ReviveRisk; fallenId: CombatantId } | null = null;
  if (shown[0]!.suggestion.isSwitch) {
    // "Switch" is not an answer to "what do I press" — show the best move too.
    const alternative = ordered.find((c) => !c.suggestion.isSwitch);
    if (alternative) shown.push(alternative);
  } else if (!isRevive(shown[0]!)) {
    // An ally on the floor is the question the player is actually asking, and
    // the card used to answer it by saying nothing. Either the revive is shown
    // as the runner-up, or — when raising them now just feeds the boss another
    // kill — the refusal is recorded and {@link noteFor} decides whether the
    // card is in a position to say anything honest about it.
    //
    // **Only a revive that was actually on the menu counts.** The branch this
    // replaced read the risk off the first body on the floor whether or not a
    // raise had been offered at all, which is how a Zombie caution ended up
    // over Hastega, Mighty Guard and a thrown Poison Fang.
    const raise = ordered.find(isRevive);
    if (raise) {
      const raisedId = raise.outcome?.revives[0] ?? raise.suggestion.targetId ?? '';
      const back = raise.outcome ? restoredHp(raise.outcome, raisedId) : undefined;
      const risk = reviveRisk(state, raisedId, intent, back);
      if (risk) refused = { risk, fallenId: raisedId };
      else shown.push(raise);
    }
  }
  const suggestions = shown.map((c) =>
    withRange(state, decision.actorId, decision.commands, c, sim, intent, planner),
  );

  return {
    actorId: decision.actorId,
    actorName: actor.name,
    suggestions,
    note: noteFor(state, shown, refused, decision, options, actor.name),
    considered: candidates.length,
  };
}

/**
 * The card's note, and the gate that keeps it truthful — `''` far more often
 * than not.
 *
 * The rule, in one line: **the note may only explain something the card is
 * showing.** `advisor-revive.ts` writes sentences about a revive, for printing
 * beside a revive; the pre-deploy gate found them being printed beside whatever
 * the ranking happened to pick, so Chapter 1 told the player to "cure the
 * Zombie first" above Mighty Guard, Hastega and a thrown item, on three
 * decisions out of four [critic, pre-deploy gate 2026-09-18].
 *
 * What reaches the card now:
 *
 *  1. **The cure is the pick.** A shown move takes Zombie off an ally, so the
 *    board reading becomes that row's reason ({@link zombieCureReason}) instead
 *    of a caution about a row nobody was offered.
 *  2. **A refused revive whose answer is *time*.** `'aimed'` and `'sweep'` both
 *    resolve into "take the hit, then raise them", which is an instruction the
 *    player can follow with the card exactly as it stands.
 *
 * And what does not:
 *
 *  * **A revive that *is* on the card.** Its caution is already on that
 *    suggestion's own `warning`, next to the move it is about; a note would
 *    print the same sentence twice.
 *
 *  3. **Anybody on the floor at all, when the card is not showing the raise.**
 *    Rule 4 of this file, and the half of Bailey's report that three passes
 *    left unanswered. The branch this replaced returned `''` for a `'zombie'`
 *    refusal, on the grounds that "cure the Zombie first" is only an answer
 *    when the cure is a row the player can press — true of the *sentence*, and
 *    the wrong conclusion, because Chapter 1's boss zombifies on the way to
 *    killing someone and the card was therefore silent on **138 of 166**
 *    decisions with an ally down [critic, fix-3 pass 3, F-A]. `advisor-floor.ts`
 *    writes the sentence the card is in a position to print instead, out of
 *    this board and this actor's own rows.
 */
function noteFor(
  state: Readonly<BattleState>,
  shown: readonly Candidate[],
  refused: { risk: ReviveRisk; fallenId: CombatantId } | null,
  decision: GuideDecision,
  options: AdvisorOptions,
  actorName: string,
): string {
  for (const c of shown) {
    const cure = c.outcome?.statusChanges.find(
      (s) => !s.applied && s.status === 'zombie' && !isEnemy(state.combatants[s.targetId]),
    );
    if (cure) return zombieCureReason(state, cure.targetId);
  }
  // The raise is on the card: its caution rides on that suggestion's warning.
  if (shown.some(isRevive)) return '';
  const down = downedActives(state);
  if (down.length === 0) return '';

  // Talk about the body the advisor actually weighed, and failing that the one
  // this actor could do something about.
  const raises = new Map<CombatantId, string>();
  for (const c of down) {
    const row = raiseRowFor(state, decision.commands, c.id, options);
    if (row) raises.set(c.id, row.label);
  }
  const fallenId =
    refused?.fallenId ?? down.find((c) => raises.has(c.id))?.id ?? down[0]?.id ?? '';
  return floorNote({
    state,
    actorName,
    fallenId,
    raiseLabel: raises.get(fallenId) ?? null,
    refused: refused?.risk ?? null,
  });
}

/**
 * A raise this actor can press **at this body**, read off the offered rows.
 *
 * Deliberately not read off the simulated candidates: {@link MAX_SIMULATIONS}
 * can cut a deep item list before the Phoenix Down is priced, and "nothing here
 * raises them" has to be a fact about the command window, not about how far the
 * preview got. Same predicate as {@link orderedRows}, plus `enabled` — a greyed
 * row with no stock left is not an answer.
 */
function raiseRowFor(
  state: Readonly<BattleState>,
  commands: readonly AvailableCommand[],
  fallenId: CombatantId,
  options: AdvisorOptions,
): AvailableCommand | null {
  for (const row of commands) {
    if (!row.enabled) continue;
    if (!row.validTargets.includes(fallenId)) continue;
    if (!onTheMenu(state.game, row.command)) continue;
    const def = defFor(state, row.command, options);
    if (def?.flags.includes('misses-if-target-alive') === true) return row;
  }
  return null;
}

/** True when this candidate's simulation stands somebody back up. */
function isRevive(c: Candidate): boolean {
  return (c.outcome?.revives.length ?? 0) > 0;
}

/**
 * The decision's rows, with the revives brought to the front while an ally is
 * down.
 *
 * {@link MAX_SIMULATIONS} caps a wide menu at sixty previews, and Chapter 1
 * offers Tidus forty-two rows — so on a deep item list the Phoenix Down can sit
 * past the cap and never be priced at all, which is a silent way of making the
 * revive lose. Ordering is not scoring: every row still competes on its own
 * simulated number, this only decides which ones get simulated first.
 */
function orderedRows(
  state: Readonly<BattleState>,
  commands: AvailableCommand[],
  options: AdvisorOptions,
): AvailableCommand[] {
  const down = downedActives(state);
  if (down.length === 0) return commands;
  const ids = new Set(down.map((c) => c.id));
  const first: AvailableCommand[] = [];
  const rest: AvailableCommand[] = [];
  for (const row of commands) {
    const def = defFor(state, row.command, options);
    const raises =
      def?.flags.includes('misses-if-target-alive') === true &&
      row.validTargets.some((id) => ids.has(id));
    (raises ? first : rest).push(row);
  }
  return [...first, ...rest];
}

/**
 * Re-price one printed suggestion with its min and max rolls.
 *
 * Ranking runs on the typical roll alone (see {@link candidateFor}); the band
 * the card prints is filled in here, for the one or two rows that reach it.
 */
function withRange(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  commands: readonly AvailableCommand[],
  candidate: Candidate,
  sim: Sim,
  intent: AdvisorIntent | null,
  planner: boolean,
): MoveSuggestion {
  if (!candidate.origin) return candidate.suggestion;
  const full = candidateFor(state, actorId, commands, candidate.origin.row, candidate.origin.targetId, sim, intent, planner, true);
  if (!full?.suggestion.estimate) return candidate.suggestion;
  return {
    ...candidate.suggestion,
    estimate: full.suggestion.estimate,
  };
}

/** The record a row resolves to, read before any simulation. See {@link aimCandidates}. */
function defFor(
  state: Readonly<BattleState>,
  command: Command,
  options: AdvisorOptions,
): AbilityDef | null {
  try {
    if (state.game === 'ffx2') {
      return (
        abilityForCommandFfx2(command, options.ffx2?.abilities, options.ffx2?.items) ?? null
      );
    }
    return abilityForCommand(command, options.ffxContent) ?? null;
  } catch {
    return null;
  }
}

/**
 * Two commands the player would press the same way.
 *
 * **The incoming member is part of a switch's identity.** FFX offers one row
 * per benched character — "Wakka", "Lulu", "Rikku", "Kimahri" — and they share
 * a `kind`, carry no `id`, and aim at nobody, so on `kind`/`id`/`targets` alone
 * *every* switch is the same command. `tacticSuggestion` looks the tactic's
 * pick up among the already-simulated candidates with this predicate, so
 * Chapter 3's line "put Lulu in" matched the first switch in the list and the
 * card said **Wakka** — a different character, a different fight.
 *
 * Measured, forty seeds, 2026-09-21: with the switches conflated a player
 * following the card won **0 of 40** Braska's Final Aeon against the chapter
 * line's 39; the party drifted to Wakka and Rikku, Lulu never cast, and the
 * fight ran to the 400-turn watchdog. `ownedRow` already distinguished them
 * (`extra.inId`); this did not, and it is the one that picks the row.
 *
 * **Both games** [AGENTS.md rule 14] — it is a property of command identity.
 * FFX-2 fields no switch at all, which `advisor-plan.test.ts` asserts rather
 * than assumes.
 */
function sameCommand(a: Command, b: Command): boolean {
  if (a.kind !== b.kind) return false;
  const idA = 'id' in a ? String(a.id) : '';
  const idB = 'id' in b ? String(b.id) : '';
  if (idA !== idB) return false;
  if (a.targets.join(',') !== b.targets.join(',')) return false;
  const inA = (a as { extra?: { inId?: CombatantId } }).extra?.inId;
  const inB = (b as { extra?: { inId?: CombatantId } }).extra?.inId;
  return inA === inB;
}

/**
 * The tactic named a move this actor does not have. Offer the switch, or decline.
 *
 * There is exactly one honest answer to "the chapter's line wants Mighty Guard
 * and you are Tidus": *put Kimahri in*. FFX makes that nearly free — the
 * incoming member takes the turn that is happening right now [ffx-combat-core
 * §1.7] — so when the bench row is on this menu and the board is one where the
 * swap is worth the turn ({@link switchValue} against {@link SWITCH_PENALTY},
 * the same bar every other switch is held to), that is the card's answer.
 *
 * Otherwise it returns `null` and `buildAdvisorView` falls back to the
 * simulated ranking for the character actually standing there. What it never
 * does is print the other character's move, which is the defect this whole
 * path exists to close.
 */
function handOff(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  command: Command,
): Candidate | null {
  const owner = abilityOwner(state, command, decision.actorId);
  if (!owner) return null;
  const row = decision.commands.find(
    (c) =>
      c.enabled &&
      c.command.kind === 'switch' &&
      (c.command as { extra?: { inId?: CombatantId } }).extra?.inId === owner.id,
  );
  if (!row) return null;
  const candidate = switchCandidate(state, decision.commands, row, null);
  if (switchValue(state, candidate.suggestion.command) < SWITCH_PENALTY) return null;
  const label = 'id' in command ? String((command as { id?: unknown }).id).replace(/-/g, ' ') : 'that move';
  return {
    ...candidate,
    suggestion: {
      ...candidate.suggestion,
      reason: `${owner.name} is the one who can use ${label}, and stepping in costs no time`,
      source: 'tactic',
    },
  };
}

/**
 * The shipped tactic's choice, dressed as a suggestion.
 *
 * Runs the same `intendedStrategy` the auto-battler and the strategy guide run,
 * through `guide.ts`'s read-only engine view, and reuses the already-simulated
 * candidate for that command when there is one so the numbers match the rest of
 * the card. The written guide's citation for the same command is carried over —
 * it is the one sentence in the project that cites research at the player, and
 * a number without a source is worth less than a number with one.
 */
function tacticSuggestion(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  candidates: Candidate[],
  sim: Sim,
  intent: AdvisorIntent | null,
  planner: boolean,
): Candidate | null {
  let command: Command | null = null;
  try {
    command = recommendedCommand(state, decision);
  } catch {
    return null;
  }
  if (!command) return null;

  // **Ownership, before anything else.** A tactic chooses among the rows it was
  // handed, so in a healthy build this always resolves — but "the card's actor,
  // its commands and the menu the player is looking at always agree" is the
  // promise the card lives or dies on, and it is cheap to make it structural
  // instead of trusting every present and future tactic to keep it.
  const row = tacticRow(decision.commands, decision.actorId, command);
  if (!row) return handOff(state, decision, command);

  // `SwitchCommand.targets` is typed as the empty tuple, so the aimed id is
  // read through the shared shape rather than off the narrowed union.
  const aimedId = (command.targets as readonly CombatantId[])[0] ?? null;
  let candidate = candidates.find((c) => sameCommand(c.suggestion.command, command!)) ?? null;
  if (!candidate) {
    candidate =
      command.kind === 'switch'
        ? switchCandidate(state, decision.commands, row, aimedId)
        : candidateFor(state, decision.actorId, decision.commands, row, aimedId, sim, intent, planner);
  }
  if (!candidate) return null;

  let cite = '';
  try {
    const view = buildGuideView(state, decision);
    if (view?.next && sameCommand(view.next.command, candidate.suggestion.command)) cite = view.next.cite;
  } catch {
    cite = '';
  }

  return {
    outcome: candidate.outcome,
    origin: candidate.origin,
    chances: candidate.chances,
    suggestion: {
      ...candidate.suggestion,
      cite,
      source: 'tactic',
      // A switch the chapter's own line chose is not the "rarely worth it"
      // swap `switchCandidate` prices; it is the tactic re-aiming the turn at
      // whichever of the seven carries the tool this board needs
      // [ffx-combat-core §1.7, `seymour-flux.ts#swapIn`].
      ...(candidate.suggestion.isSwitch
        ? { reason: `The chapter's line hands this free turn to ${candidate.suggestion.label}` }
        : {}),
    },
  };
}
