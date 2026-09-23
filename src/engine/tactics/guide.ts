/**
 * The in-battle strategy guide's **reasoning half**.
 *
 * `src/ui/common/StrategyGuide.ts` draws a panel; this file decides what it
 * says. The split is deliberate: everything here is pure, DOM-free and
 * unit-testable against the real engines, so the claim the panel makes to the
 * player — "this is the command the chapter was designed to be beaten with" —
 * is one a test can actually check (`tests/unit/strategy-guide.test.ts`).
 *
 * ## It does not have its own opinion
 *
 * The NEXT line is **not** a second strategy written for the panel. It is the
 * shipped one: {@link intendedStrategy}, the same function
 * `__pyrefly.autoBattle('intended')` and the chapter e2e specs drive the game
 * with, which asks `src/engine/tactics/*.ts` first and falls through to the
 * generic ladder. A guide that reasoned separately would drift from the game
 * the moment a chapter agent tuned their tactic, and would then be teaching a
 * line the encounter no longer rewards. Running the real one means the panel
 * cannot be wrong about *what* to do — only, at worst, silent about why.
 *
 * ## It never touches the battle
 *
 * The tactics take a `BattleEngine`, but every shipped one reads only
 * `engine.state()` — verified by {@link stateOnlyEngine}, which satisfies the
 * interface and **throws** from `init`, `submit`, `nextDecision` and `setSeed`.
 * If a future tactic ever reaches for one of those, the guide fails loudly in a
 * test rather than quietly resolving a command mid-render and corrupting a
 * battle the player is in the middle of. {@link buildGuideView} catches it and
 * degrades to a panel with no NEXT line.
 *
 * ## Where the words come from
 *
 * `src/data/guides/*.ts` — one cited file per chapter. This module matches the
 * tactic's chosen command against that chapter's hints and never writes prose
 * of its own.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  BattleEngine,
  BattleSetup,
  BattleState,
  Command,
  CombatantId,
  Decision,
  EnemyFields,
} from '../../battle/common/types.ts';
import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from '../../data/guides/types.ts';
import { GUIDES } from '../../data/guides/index.ts';
import { intendedStrategy } from '../BattlePresenterStrategies.ts';
import { targetLabel } from './targetLabel.ts';

/** Thrown when a tactic asks the guide's read-only engine view to do something. */
export class GuideEngineMisuseError extends Error {
  constructor(method: string) {
    super(
      `StrategyGuide ran a tactic that called engine.${method}(). The guide previews a ` +
        'decision without taking it, so only engine.state() is available here.',
    );
    this.name = 'GuideEngineMisuseError';
  }
}

/**
 * A `BattleEngine` that can be read and not run.
 *
 * The HUD holds a `BattleState` (from `sync`), not the engine, and the guide
 * must not be handed the live engine anyway — see the file header.
 */
export function stateOnlyEngine(state: Readonly<BattleState>): BattleEngine {
  return {
    state: () => state,
    init: (_setup: BattleSetup): void => {
      throw new GuideEngineMisuseError('init');
    },
    nextDecision: (): Decision => {
      throw new GuideEngineMisuseError('nextDecision');
    },
    submit: (_command: Command): never => {
      throw new GuideEngineMisuseError('submit');
    },
    setSeed: (_n: number): void => {
      throw new GuideEngineMisuseError('setSeed');
    },
  };
}

// ---------------------------------------------------------------- the view

/** The recommended command, ready to print. */
export interface GuideNext {
  /** What the shipped strategy chose. */
  command: Command;
  /** The offered row's menu label, or a readable stand-in for a row with none. */
  label: string;
  /** Display name of the aimed target, when the command has one. */
  targetName: string | null;
  targetId: CombatantId | null;
  /** Display name of whoever is deciding. */
  actorName: string;
  /** One sentence on why, from `src/data/guides/*.ts`. Empty when nothing matched. */
  reason: string;
  /** Research citation for {@link reason}. Empty when there is no reason. */
  cite: string;
}

/** A live telegraph, ready to print. */
export interface GuideWatchLine {
  /** What is coming, e.g. "Total Annihilation". */
  payload: string;
  /** "in 2 turns" / "this turn". */
  timing: string;
  /** What to do about it. */
  advice: string;
  cite: string;
  /** 1 = charging, 2 = imminent. Mirrors the `charge` event. */
  stage: 1 | 2;
  /** Which enemy is winding up. */
  enemyName: string;
}

/** Everything the panel shows for one moment of one battle. */
export interface GuideView {
  chapterId: string;
  title: string;
  /** Present only when a player decision is open. */
  next: GuideNext | null;
  watch: GuideWatchLine[];
  /** The phase/form note, when the chapter has one for this board. */
  phase: { label: string; note: string; cite: string } | null;
  rules: readonly GuideRule[];
}

/** The decision the panel is explaining. */
export interface GuideDecision {
  actorId: CombatantId;
  commands: AvailableCommand[];
}

// ------------------------------------------------------------------ lookup

/** The chapter guide for whatever encounter is on the field, if it has one. */
export function guideForState(state: Readonly<BattleState>): ChapterGuide | null {
  return GUIDES.find((g) => g.bossIds.some((id) => state.combatants[id] !== undefined)) ?? null;
}

/** The chapter's primary boss (its first listed id that is actually present). */
function primaryBoss(state: Readonly<BattleState>, guide: ChapterGuide): AnyCombatant | null {
  for (const id of guide.bossIds) {
    const c = state.combatants[id];
    if (c) return c;
  }
  return null;
}

function hpFraction(c: AnyCombatant): number {
  return c.hp / Math.max(1, c.stats.maxHp);
}

function formIndexOf(c: AnyCombatant): number {
  return (c as Partial<EnemyFields>).formIndex ?? 0;
}

// ------------------------------------------------------------------- WATCH

/**
 * How far back a `charge` event stays "live" once its counter has run out.
 *
 * A charge event is re-emitted every turn with a smaller `turnsLeft`, so the
 * newest one per enemy is the truth. The awkward case is `turnsLeft: 0`, which
 * both Bahamut's Mega Flare step and Vegnagun's Memento Mori emit on the turn
 * the payload actually lands: it is worth showing as "this turn", but it must
 * not still be on screen five minutes later. Events, not milliseconds, because
 * the guide reads a state snapshot and has no clock of its own.
 */
const FIRED_CHARGE_WINDOW = 14;

/** The newest `charge` event per enemy that is still worth printing. */
export function activeCharges(
  state: Readonly<BattleState>,
): Array<{ enemyId: CombatantId; name: string; turnsLeft: number; stage: 1 | 2 }> {
  const newest = new Map<CombatantId, { name: string; turnsLeft: number; stage: 1 | 2; seq: number }>();
  for (const e of state.log) {
    if (e.type !== 'charge') continue;
    newest.set(e.enemyId, { name: e.name, turnsLeft: e.turnsLeft, stage: e.stage, seq: e.seq });
  }
  const end = state.log.length;
  const out: Array<{ enemyId: CombatantId; name: string; turnsLeft: number; stage: 1 | 2 }> = [];
  for (const [enemyId, c] of newest) {
    const enemy = state.combatants[enemyId];
    if (!enemy || !enemy.alive) continue;
    if (c.turnsLeft <= 0 && end - c.seq > FIRED_CHARGE_WINDOW) continue;
    out.push({ enemyId, name: c.name, turnsLeft: c.turnsLeft, stage: c.stage });
  }
  return out;
}

function timingOf(turnsLeft: number): string {
  if (turnsLeft <= 0) return 'this turn';
  return turnsLeft === 1 ? 'in 1 turn' : `in ${turnsLeft} turns`;
}

/** Numeric telegraphs (Bahamut's countdown) key on `'#'` rather than on the number. */
function watchFor(guide: ChapterGuide, name: string): ChapterGuide['watch'][number] | undefined {
  const key = name.trim().toLowerCase();
  const exact = guide.watch.find((w) => w.name.toLowerCase() === key);
  if (exact) return exact;
  return /^\d+$/.test(key) ? guide.watch.find((w) => w.name === '#') : undefined;
}

// ------------------------------------------------------------------ phases

function phaseFor(state: Readonly<BattleState>, guide: ChapterGuide): GuidePhase | null {
  const primary = primaryBoss(state, guide);
  for (const p of guide.phases) {
    const subject = p.bossId ? state.combatants[p.bossId] : primary;
    if (!subject) continue;
    if (p.formIndex !== undefined && formIndexOf(subject) !== p.formIndex) continue;
    const frac = hpFraction(subject);
    if (p.aboveHpFraction !== undefined && frac <= p.aboveHpFraction) continue;
    if (p.belowHpFraction !== undefined && frac > p.belowHpFraction) continue;
    return p;
  }
  return null;
}

// ------------------------------------------------------------------- hints

/** The row the strategy's command came from, so the panel can print its label. */
export function rowFor(commands: AvailableCommand[], command: Command): AvailableCommand | null {
  const id = 'id' in command ? String(command.id) : null;
  return (
    commands.find((c) => {
      if (c.command.kind !== command.kind) return false;
      const rowId = 'id' in c.command ? String(c.command.id) : null;
      const inOf = (x: Command): unknown => (x as { extra?: { inId?: unknown } }).extra?.inId; // switch rows differ only here
      return rowId === id && (inOf(command) === undefined || inOf(c.command) === undefined || inOf(command) === inOf(c.command));
    }) ?? null
  );
}

/** A readable name for a command whose offered row could not be found. */
function fallbackLabel(command: Command): string {
  if ('id' in command) {
    return String(command.id)
      .split('-')
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  return command.kind[0]!.toUpperCase() + command.kind.slice(1);
}

function has(c: AnyCombatant | undefined, status: string): boolean {
  return c !== undefined && (c.statuses as Record<string, unknown>)[status] !== undefined;
}

function hintMatches(
  hint: GuideHint,
  ctx: {
    label: string;
    command: Command;
    actorId: CombatantId;
    target: AnyCombatant | undefined;
    state: Readonly<BattleState>;
    guide: ChapterGuide;
  },
): boolean {
  const w = hint.when;
  const label = ctx.label.toLowerCase();
  if (w.labels && !w.labels.some((l) => l.toLowerCase() === label)) return false;
  if (w.kinds && !w.kinds.includes(ctx.command.kind)) return false;
  if (w.targetHas && !has(ctx.target, w.targetHas)) return false;
  if (w.targetLacks && has(ctx.target, w.targetLacks)) return false;
  if (w.actorId && w.actorId !== ctx.actorId) return false;
  if (w.targetId && ctx.target?.id !== w.targetId) return false;
  if (w.bossId && ctx.state.combatants[w.bossId] === undefined) return false;
  if (w.bossBelowHp !== undefined || w.bossAboveHp !== undefined) {
    const boss = primaryBoss(ctx.state, ctx.guide);
    if (!boss) return false;
    const frac = hpFraction(boss);
    if (w.bossBelowHp !== undefined && frac > w.bossBelowHp) return false;
    if (w.bossAboveHp !== undefined && frac <= w.bossAboveHp) return false;
  }
  return true;
}

function fill(text: string, actorName: string, targetName: string | null): string {
  return text.replace(/\{actor\}/g, actorName).replace(/\{target\}/g, targetName ?? 'them');
}

// ------------------------------------------------------------------- build

/**
 * What the shipped strategy would do right now, or `null` if it declines.
 *
 * Separate from {@link buildGuideView} so a test can compare it against
 * `intendedStrategy` directly, which is the whole claim the NEXT line makes.
 */
export function recommendedCommand(
  state: Readonly<BattleState>,
  decision: GuideDecision,
): Command | null {
  return intendedStrategy(decision.actorId, decision.commands, stateOnlyEngine(state));
}

/**
 * Everything the panel shows, or `null` when this encounter has no written
 * guide (which is not an error — a chapter without a `src/data/guides/` file
 * simply has no panel).
 */
export function buildGuideView(
  state: Readonly<BattleState>,
  decision: GuideDecision | null,
): GuideView | null {
  const guide = guideForState(state);
  if (!guide) return null;

  const view: GuideView = {
    chapterId: guide.id,
    title: guide.title,
    next: null,
    watch: [],
    phase: null,
    rules: guide.rules,
  };

  // --- WATCH -------------------------------------------------------------
  for (const charge of activeCharges(state)) {
    const entry = watchFor(guide, charge.name);
    if (!entry) continue;
    view.watch.push({
      payload: entry.payload,
      timing: timingOf(charge.turnsLeft),
      advice: entry.advice,
      cite: entry.cite,
      stage: charge.stage,
      enemyName: state.combatants[charge.enemyId]?.name ?? charge.enemyId,
    });
  }

  const phase = phaseFor(state, guide);
  if (phase) view.phase = { label: phase.label, note: phase.note, cite: phase.cite };

  // --- NEXT --------------------------------------------------------------
  if (decision) {
    view.next = nextFor(state, guide, decision);
  }
  return view;
}

function nextFor(
  state: Readonly<BattleState>,
  guide: ChapterGuide,
  decision: GuideDecision,
): GuideNext | null {
  let command: Command | null = null;
  try {
    command = recommendedCommand(state, decision);
  } catch (err) {
    // A tactic that reached past `state()`, or threw on a board it did not
    // expect. The panel loses its NEXT line; the battle is untouched.
    console.warn('[strategy-guide] the chapter tactic could not be previewed', err);
    return null;
  }
  if (!command) return null;

  const row = rowFor(decision.commands, command);
  const label = row?.label ?? fallbackLabel(command);
  const targetId = command.targets[0] ?? null;
  const target = targetId ? state.combatants[targetId] : undefined;
  const actorName = state.combatants[decision.actorId]?.name ?? decision.actorId;
  // A party-wide or all-enemy command is aimed at one id so the engine can
  // resolve it; naming that id here read as "Hastega -> Tidus" for a move
  // that hits the whole party, while the advisor's card correctly said "the
  // party" for the same command on the same frame [pre-deploy critic gate
  // 2026-09-18]. `targetLabel` is the single place both panels get this
  // word from now, so they cannot disagree again.
  const targetName = targetLabel(state.game, command, target?.name ?? null);

  const hit = guide.hints.find((h) =>
    hintMatches(h, { label, command, actorId: decision.actorId, target, state, guide }),
  );

  return {
    command,
    label,
    targetId,
    targetName,
    actorName,
    reason: hit ? fill(hit.text, actorName, targetName) : '',
    cite: hit ? hit.cite : '',
  };
}
