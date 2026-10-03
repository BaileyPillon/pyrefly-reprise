/**
 * The strategy guide's **own line**: what its NEXT card says, read from the chapter's plan
 * (`src/data/guides/lines/<chapter>.ts`) and nothing else.
 *
 * Bailey, 2026-10-03: "The guide and next move advisor are completely separate entities". Until
 * then the NEXT card ran the chapter's shipped tactic (`intendedStrategy`) read-only, which is also
 * what the move advisor ranks and borrows words from, so the two panels could only ever agree. The
 * guide now follows the encounter guide the project settled on (D-350) through a plan of its own, and
 * this module is the only code that reads it. **It never runs a tactic, the advisor or
 * `intendedStrategy`** (it reaches `guide.ts` only for the written content, which runs none when no
 * decision is passed); `guide.ts`'s `buildGuideView` and `recommendedCommand` stay exactly as the
 * advisor needs them, and `tests/unit/guide-line-separation.test.ts` pins both halves.
 *
 * ## One rule, and why it is the right one
 *
 * Walk the line's steps in order and show the **first one that can be played right now**: it applies
 * to the board, the deciding character is offered a matching enabled row, and there is someone legal
 * to aim at. A step the party cannot play is skipped, never shown, so "the nearest step of the plan
 * that can be played" is simply the next one down. Every line ends in a step that is always playable
 * (a swing at the boss), and this module adds a last resort of its own ({@link LINE_FALLBACK_WHY}) so
 * an open decision always has a NEXT.
 *
 * The board (who is deciding, the party as the fight sees it, the boss, the rows on offer), the
 * conditions a step may ask for and where a step aims live in `./guide-line-board.ts`; this file turns
 * steps into picks and builds the panel's view.
 *
 * ## FFX-2's in-flight filter
 *
 * The ATB opens a menu while another girl's command is charging or held, so a step whose move is
 * already on its way (the same support move at the same ally, or a heal while a heal charges) is
 * skipped too, exactly as the rail has done since advisor v3 (`./guide-inflight.ts`). Skipping keeps
 * the rule: the next step down is shown instead of nothing.
 */

import type {
  AnyCombatant,
  AvailableCommand,
  BattleEngine,
  BattleState,
  Command,
  CombatantId,
  EnemyFields,
} from '../../battle/common/types.ts';
import type { ChapterGuide, GuideClock } from '../../data/guides/types.ts';
import type { LineStep } from '../../data/guides/line-types.ts';
import type { AutoStrategy } from '../BattlePresenter.ts';
import { buildGuideView, guideForState, type GuideDecision } from './guide.ts';
import { aimAt, applies, frac, readBoard, type Board } from './guide-line-board.ts';
import { chosenAlready, healInbound } from './guide-inflight.ts';
import { targetDisplayName, targetLabel } from './targetLabel.ts';

/** The reason line when no step of the line applies and the guide falls back to a plain swing. */
export const LINE_FALLBACK_WHY = 'Nothing else needs doing: keep hitting {target}';

/** The reason line when nothing of the character's reaches the boss: a turn spent keeping the party ready. */
export const LINE_QUIET_WHY = 'Nothing of yours reaches the boss right now: spend the turn keeping the party ready';

/** The reason line when a girl's whole menu is Change (FFX-2 only: Itchy seals every other command). */
export const LINE_CHANGE_WHY = 'Itchy seals every command but Change: changing dressphere clears it';

/** The spare items a quiet turn may spend on an ally (none of them changes the board for the worse). */
const QUIET_ITEMS: ReadonlySet<string> = new Set([
  'potion',
  'hi-potion',
  'x-potion',
  'mega-potion',
  'al bhed potion',
  'healing water',
  'eye drops',
  'echo screen',
  'antidote',
]);

// ---------------------------------------------------------------- the view

/** The recommended command, ready to print. No citation travels with it: the panel never shows one. */
export interface GuideRailNext {
  command: Command;
  /** The offered row's menu label. */
  label: string;
  targetId: CombatantId | null;
  /** Display name of the aim ("the party" for a party-wide command), when the command has one. */
  targetName: string | null;
  /** Display name of whoever is deciding. */
  actorName: string;
  /** One plain sentence on why. */
  reason: string;
}

/** A live telegraph, ready to print. */
export interface GuideRailWatch {
  payload: string;
  timing: string;
  advice: string;
  /** 1 = charging, 2 = imminent. */
  stage: 1 | 2;
  enemyName: string;
}

/** Everything the panel shows for one moment of one battle. */
export interface GuideRailView {
  chapterId: string;
  title: string;
  /** Present only when a player decision is open and the line has a step to show for it. */
  next: GuideRailNext | null;
  /** A player decision is open. With `next` null the panel says the plan has nothing for this turn, not that it is waiting. */
  decisionOpen: boolean;
  watch: GuideRailWatch[];
  phase: { label: string; note: string } | null;
  rules: ReadonlyArray<{ text: string; short: string }>;
}

/** One step, resolved on a board: the command to press and the step that chose it. */
export interface LinePick {
  command: Command;
  row: AvailableCommand;
  /** `null` for the module's own last resort. */
  step: LineStep | null;
  reason: string;
  targetId: CombatantId | null;
  /** Display name of the aim ("the party" for a party-wide command). */
  targetName: string | null;
}

// ------------------------------------------------------------ step -> row

function rowsFor(step: LineStep, b: Board): AvailableCommand[] {
  if (step.labels) {
    const out: AvailableCommand[] = [];
    for (const label of step.labels) {
      const want = label.toLowerCase();
      for (const r of b.rows) if (r.label.toLowerCase() === want && !out.includes(r)) out.push(r);
    }
    return out;
  }
  if (step.kinds) {
    return b.rows.filter(
      (r) =>
        step.kinds!.includes(r.command.kind) &&
        (step.switchIn === undefined || (r.command.kind === 'switch' && r.command.extra.inId === step.switchIn)),
    );
  }
  return [];
}

function fill(text: string, actorName: string, targetName: string | null): string {
  return text.replace(/\{actor\}/g, actorName).replace(/\{target\}/g, targetName ?? 'them');
}

function commandOf(row: AvailableCommand, target: CombatantId | null, step?: LineStep | null): Command {
  if (step?.grandSummon && row.command.kind === 'overdrive') {
    // Yuna's Grand Summon names its aeon in the minigame result; the engine's default names none.
    return {
      ...row.command,
      targets: [],
      extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: step.grandSummon } },
    } as Command;
  }
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

/** Would the command repeat a move another girl already has on its way (FFX-2 only)? */
function inFlight(b: Board, command: Command): boolean {
  const held = b.decision.held ?? [];
  return chosenAlready(b.state, b.decision.actorId, command, held) || healInbound(b.state, b.decision.actorId, command, held);
}

function pickOf(
  b: Board,
  row: AvailableCommand,
  target: CombatantId | null,
  step: LineStep | null,
  why: string = LINE_FALLBACK_WHY,
): LinePick {
  const command = commandOf(row, target, step);
  const actorName = b.actor?.name ?? b.decision.actorId;
  const targetName = targetLabel(b.state.game, command, targetDisplayName(b.state, target));
  return { command, row, step, reason: fill(step?.why ?? why, actorName, targetName), targetId: target, targetName };
}

function resolveStep(step: LineStep, b: Board): LinePick | null {
  if (!applies(step.when, b)) return null;
  for (const row of rowsFor(step, b)) {
    const target = aimAt(step.aim, row, b);
    if (target === undefined) continue;
    if (inFlight(b, commandOf(row, target, step))) continue;
    return pickOf(b, row, target, step);
  }
  return null;
}

/**
 * The module's own last resort, for a board no step of the line applies to: a swing at the boss;
 * failing that an Overdrive or a spell at a foe; failing that a turn nothing is hurt by (Defend where
 * the menu has it, else a spare item on an ally). It never picks a row that merely happens to be
 * first on the menu: a buff cast at the boss or a ship order is not a last resort.
 */
function lastResort(b: Board): LinePick | null {
  const swing = b.rows.find((r) => r.command.kind === 'attack' && aimAt('boss', r, b) !== undefined);
  if (swing) return pickOf(b, swing, aimAt('boss', swing, b) ?? null, null);
  const hit = b.rows.find(
    (r) => (r.command.kind === 'overdrive' || r.category === 'blackmagic') && aimAt('boss', r, b) !== undefined,
  );
  if (hit) return pickOf(b, hit, aimAt('boss', hit, b) ?? null, null);
  // A menu that is only Change (and Escape): the Change is the turn, and it clears Itchy.
  const change = b.rows.find((r) => r.command.kind === 'spherechange');
  if (change && b.rows.every((r) => r.command.kind === 'spherechange' || r.command.kind === 'escape')) {
    return pickOf(b, change, null, null, LINE_CHANGE_WHY);
  }
  const defend = b.rows.find((r) => r.command.kind === 'defend');
  if (defend) return pickOf(b, defend, null, null, LINE_QUIET_WHY);
  const spare = b.rows.find(
    (r) => r.command.kind === 'item' && QUIET_ITEMS.has(r.label.toLowerCase()) && aimAt('weakest', r, b) !== undefined,
  );
  return spare ? pickOf(b, spare, aimAt('weakest', spare, b) ?? null, null, LINE_QUIET_WHY) : null;
}

/**
 * What the chapter's line says to do now, or `null` when nothing is on the menu.
 *
 * Exported for the unit tests and for the measurement bench, which plays whole fights by it
 * (`tests/unit/guide-line-bench.test.ts`).
 */
export function pickLine(
  state: Readonly<BattleState>,
  guide: ChapterGuide,
  decision: GuideDecision,
  opts: { planOnly?: boolean } = {},
): LinePick | null {
  const board = readBoard(state, guide, decision);
  for (const step of guide.line ?? []) {
    if (opts.planOnly && step.support) continue;
    const hit = resolveStep(step, board);
    if (hit) return hit;
  }
  return lastResort(board);
}

/** The line as an auto-battle strategy: every decision answered by {@link pickLine}. */
export const guideLineStrategy: AutoStrategy = (
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
) => {
  const state = engine.state();
  const guide = guideForState(state);
  if (!guide) return null;
  return pickLine(state, guide, { actorId, commands })?.command ?? null;
};

/** The plan's own steps only (no `support` steps): the measurement's strict arm. */
export const guidePlanStrategy: AutoStrategy = (
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
) => {
  const state = engine.state();
  const guide = guideForState(state);
  if (!guide) return null;
  return pickLine(state, guide, { actorId, commands }, { planOnly: true })?.command ?? null;
};

// ------------------------------------------------------------------- build

/**
 * Everything the panel shows, or `null` when this encounter has no written guide (not an error:
 * no panel). WATCH, the phase note and RULES come from the chapter's written content
 * (`guide.ts`, which never reads a tactic when no decision is passed); NEXT comes from the line.
 * No citation is carried: the panel never shows one.
 */
export function buildGuideRail(
  state: Readonly<BattleState>,
  decision: GuideDecision | null,
  clock: GuideClock = 'wait',
): GuideRailView | null {
  const written = buildGuideView(state, null, clock);
  if (!written) return null;
  const guide = guideForState(state);
  const phase = guide ? phaseOf(state, guide) : null;
  return {
    chapterId: written.chapterId,
    title: written.title,
    next: guide && decision ? nextFor(state, guide, decision) : null,
    decisionOpen: decision !== null,
    watch: written.watch.map(({ payload, timing, advice, stage, enemyName }) => ({ payload, timing, advice, stage, enemyName })),
    phase: phase ? { label: phase.label, note: phase.note } : null,
    rules: written.rules.map(({ text, short }) => ({ text, short })),
  };
}

/**
 * Which form a boss is in, read where the engine keeps it: `enemy.formIndex`, as
 * `battle/ffx/ai/yunalesca.ts` and `intent.ts` do. (`guide.ts` reads a top-level field that is
 * always undefined on a real board, so the form notes of its own phase pick never match; it stays as
 * it is, because the advisor borrows from that file, and the rail picks its phase here instead.)
 * The top-level field stays as a fallback for a hand-built fixture that sets it there.
 */
function formOf(c: AnyCombatant): number {
  return (c as { enemy?: Partial<EnemyFields> }).enemy?.formIndex ?? (c as Partial<EnemyFields>).formIndex ?? 0;
}

/** The phase or form note for this board: the first of the chapter's phases whose conditions hold. */
function phaseOf(state: Readonly<BattleState>, guide: ChapterGuide): { label: string; note: string } | null {
  const primary = guide.bossIds.map((id) => state.combatants[id]).find((c) => c !== undefined);
  for (const p of guide.phases) {
    const subject = p.bossId ? state.combatants[p.bossId] : primary;
    if (!subject) continue;
    if (p.formIndex !== undefined && formOf(subject) !== p.formIndex) continue;
    const f = frac(subject);
    if (p.aboveHpFraction !== undefined && f <= p.aboveHpFraction) continue;
    if (p.belowHpFraction !== undefined && f > p.belowHpFraction) continue;
    return p;
  }
  return null;
}

/**
 * What the menu calls the row. A Change row's engine label is the raw dressphere id (`dark-knight`);
 * the menu prints the outfit's own name, and so does the guide, as "Change to Dark Knight"
 * (`src/ui/ffx2/CommandMenu.ts#spherechangeLabel`: "(Special)" after a Special dressphere).
 */
function labelOf(row: AvailableCommand): string {
  const c = row.command;
  if (c.kind !== 'spherechange') return row.label;
  const name = c.extra.toDressphere
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
  return `Change to ${c.extra.specialDressUp ? `${name} (Special)` : name}`;
}

function nextFor(state: Readonly<BattleState>, guide: ChapterGuide, decision: GuideDecision): GuideRailNext | null {
  let pick: LinePick | null = null;
  try {
    pick = pickLine(state, guide, decision);
  } catch (err) {
    // A board the line did not expect. The panel loses its NEXT line; the battle is untouched.
    console.warn('[strategy-guide] the chapter line could not be read', err);
    return null;
  }
  if (!pick) return null;
  return {
    command: pick.command,
    label: labelOf(pick.row),
    targetId: pick.targetId,
    targetName: pick.targetName,
    actorName: state.combatants[decision.actorId]?.name ?? decision.actorId,
    reason: pick.reason,
  };
}
