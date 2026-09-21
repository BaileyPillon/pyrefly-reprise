/**
 * Site B's readouts: one `TurnTrace` in, the exact strings the approved
 * frames print out. Pure — no DOM — so every line the studio stage shows is
 * unit tested against a real engine run rather than eyeballed in a browser.
 *
 * Nothing here invents a number (AGENTS.md hard rules 3 and 6). Every value
 * is a field the engine itself produced, and the two places the frames show
 * something the engine does not hand over directly are derived from engine
 * output and say so:
 *  - **base ticks** = the actor's next CTB counter ÷ the command's rank, the
 *    inverse of the engine's own `recovery = base ticks × rank`
 *    (`ffx-combat-core §1.2, §1.3`), and only when it divides exactly;
 *  - **the affinity multiplier** is the sourced table in `rules.ts`
 *    (`ffx-combat-core §3`), looked up by the affinity the engine reported.
 *
 * The step paragraphs are the approved frames' own copy, ported verbatim from
 * `docs/concepts/atlas/b-battle-studio/b2-exploded-selected.html` — picked
 * text, not new text (AGENTS.md hard rule 9).
 *
 * FFX only (hard rule 14): a CTB turn list, command ranks and an Overdrive
 * gauge exist in FFX; FFX-2 has gauges and no turn list, and gets nothing here.
 */

import type { Affinity } from '../../src/battle/common/types.ts';
import { statusWord } from '../../src/battle/ffx/intent.ts';
import type { StudioComponentId } from './rules.ts';
import type { TurnOrderEntry, TurnStep, TurnTrace } from './trace.ts';

/** One row of the on-stage turn list, ready to draw. */
export interface TurnRow {
  readonly actorId: string;
  readonly name: string;
  readonly tick: number;
  readonly isParty: boolean;
  /** Path under `public/art/` for the row's face, when this project has painted one. */
  readonly art?: string;
  /** True for the row that is acting right now — the frame's `.act.now`. */
  readonly now: boolean;
}

/**
 * Faces for the chapter-1 cast, and only for them: a row whose actor has no
 * painted face here renders as an initial rather than a 404 (every art path
 * below is a file that exists in `public/art/`).
 */
const FACE_BY_ACTOR: Readonly<Record<string, string>> = {
  tidus: 'portraits/tidus.png',
  kimahri: 'portraits/kimahri.png',
  yuna: 'portraits/yuna.png',
  'seymour-flux': 'portraits/seymour.png',
  mortiorchis: 'characters/mortiorchis/idle.png',
};

/** The elemental multipliers of `ffx-combat-core §3`, as `rules.ts` lists them. */
const AFFINITY_FACTOR: Readonly<Record<Affinity, string>> = {
  weak: '×1.5',
  normal: '×1.0',
  resist: '×0.5',
  immune: '×0',
  absorb: '×−1',
};

function stepOf<T extends StudioComponentId>(trace: TurnTrace, component: T): Extract<TurnStep, { component: T }> {
  const step = trace.steps.find((s): s is Extract<TurnStep, { component: T }> => s.component === component);
  if (step === undefined) throw new Error(`readout: trace has no "${component}" step`);
  return step;
}

function row(entry: TurnOrderEntry, now: boolean): TurnRow {
  const art = FACE_BY_ACTOR[entry.actorId];
  return {
    actorId: entry.actorId,
    name: entry.name,
    tick: entry.tick,
    isParty: entry.isParty,
    ...(art !== undefined ? { art } : {}),
    now,
  };
}

/** The first `count` rows of the queue as it stood before the turn — the frame's five-row list. */
export function turnRowsBefore(trace: TurnTrace, count: number): readonly TurnRow[] {
  return stepOf(trace, 'turn').before.slice(0, count).map((entry, i) => row(entry, i === 0));
}

/** The queue as it stands after the turn, for the "what your drag did" column. */
export function turnRowsAfter(trace: TurnTrace, count: number): readonly TurnRow[] {
  return stepOf(trace, 'turn').after.slice(0, count).map((entry) => row(entry, false));
}

/** The acting character's own next CTB counter after this command, or null when the forecast does not reach it. */
export function actorNextTick(trace: TurnTrace): number | null {
  const next = stepOf(trace, 'turn').after.find((entry) => entry.actorId === trace.actorId);
  return next?.tick ?? null;
}

/**
 * The actor's base ticks: `recovery = base ticks × rank` read backwards from
 * the engine's own numbers (`ffx-combat-core §1.2, §1.3`). Null when the
 * forecast does not show this actor again, or when the division is not exact
 * — a fractional "base ticks" would be this module's arithmetic, not the
 * engine's, and the frame would rather show nothing.
 */
export function baseTicks(trace: TurnTrace): number | null {
  const next = actorNextTick(trace);
  const rank = stepOf(trace, 'command').rank;
  if (next === null || rank <= 0) return null;
  const base = next / rank;
  return Number.isInteger(base) ? base : null;
}

/** The b1 banner: the command's own name and rank chip. */
export function commandBanner(trace: TurnTrace): { readonly label: string; readonly rank: string } {
  return { label: trace.commandLabel, rank: `Rank ${stepOf(trace, 'command').rank}` };
}

/** The b1 line under the banner ("Rank 3: his next turn comes 24 ticks later"). */
export function commandNote(trace: TurnTrace): string {
  const rank = stepOf(trace, 'command').rank;
  const next = actorNextTick(trace);
  if (next === null) return `Rank ${rank}: a higher rank means a longer wait.`;
  return `Rank ${rank}: their next turn comes ${next} ticks later`;
}

/** The big gold numeral. */
export function damageAmount(trace: TurnTrace): number {
  return stepOf(trace, 'damage').amount;
}

/** The b1 hit chip: "Hit 100%" / "Crit 6%", or an honest "Never misses" for a command that cannot. */
export function hitChips(trace: TurnTrace): readonly { readonly label: string; readonly value: string }[] {
  const hit = stepOf(trace, 'hit');
  return [
    { label: 'Hit', value: hit.hitPercent === null ? 'never misses' : `${hit.hitPercent}%` },
    { label: 'Crit', value: `${hit.critPercent}%` },
  ];
}

/** The b1 element chip: "No element ×1.0". */
export function elementChip(trace: TurnTrace): { readonly label: string; readonly value: string } {
  const step = stepOf(trace, 'element');
  const named = step.elements.filter((e) => e !== 'none');
  return {
    label: named.length > 0 ? named.map(statusWord).join(', ') : 'No element',
    value: AFFINITY_FACTOR[step.affinity],
  };
}

/** The b1 status chip: "No status applied", or each status this command attempts with its odds. */
export function statusChip(trace: TurnTrace): { readonly label: string; readonly value: string } {
  const applications = stepOf(trace, 'status').applications;
  if (applications.length === 0) return { label: 'No status applied', value: '' };
  const first = applications[0];
  if (first === undefined) return { label: 'No status applied', value: '' };
  const extra = applications.length > 1 ? ` +${applications.length - 1}` : '';
  return { label: `${statusWord(first.status)}${first.blocked ? ' blocked' : ''}${extra}`, value: `${first.percent}%` };
}

/** The b1 Overdrive bar: where the gauge was, where it went, and the slice in between. */
export function overdriveBar(trace: TurnTrace): {
  readonly before: number;
  readonly after: number;
  readonly mode: string;
  readonly text: string;
} {
  const step = stepOf(trace, 'overdrive');
  return { before: step.before, after: step.after, mode: step.mode, text: `${step.before} → ${step.after}%` };
}

/** The b1 intent plate: the move the boss's script has queued. */
export function bossIntent(trace: TurnTrace): { readonly key: string; readonly move: string } {
  const step = stepOf(trace, 'boss');
  return { key: step.turnsAway <= 1 ? 'Next' : `In ${step.turnsAway}`, move: step.moveName };
}

/** The frames' own paragraph for each step card, ported from `b2-exploded-selected.html`. */
export const STEP_PLAIN: Readonly<Record<StudioComponentId, string>> = {
  turn: 'The lowest counter goes next. Acting adds your base ticks times the command’s rank.',
  command: 'Every command has a rank. A higher rank means a longer wait for your next turn.',
  hit: 'A physical attack rolls to hit. Only 40% of Accuracy counts, against Evasion.',
  damage: 'Strength cubed ÷ 32 + 30, cut by his Defense, then a 32-step random roll.',
  element: 'Weak ×1.5, resists ×0.5, immune ×0, absorbs heals. The strongest one wins.',
  status: 'A status lands if its chance, minus the target’s resistance, beats a 0–100 roll.',
  overdrive: 'Warrior mode fills on damage dealt; a well-timed input adds up to half again.',
  boss: 'His script is fixed. The studio runs it ahead on a copy of the battle.',
};

/** The live readout on a step card: a headline value and, where the frame draws one, a plain-words second line. */
export interface StepLive {
  readonly value: string;
  readonly plain?: string;
}

/** The `.lv` line of each step card in frame b2, filled from this run's own numbers. */
export function stepLive(component: StudioComponentId, trace: TurnTrace): StepLive {
  switch (component) {
    case 'turn': {
      const rows = turnRowsBefore(trace, 5);
      return { value: rows.map((r) => r.tick).join(' · '), plain: 'ticks each one must wait' };
    }
    case 'command': {
      const rank = stepOf(trace, 'command').rank;
      const base = baseTicks(trace);
      const next = actorNextTick(trace);
      if (base !== null && next !== null) return { value: `${base} × ${rank} = ${next}`, plain: 'base ticks × rank = ticks' };
      return { value: `Rank ${rank}`, plain: trace.commandLabel };
    }
    case 'hit': {
      const [hit, crit] = hitChips(trace);
      return { value: `${hit?.value ?? ''} · ${crit?.value ?? ''}`, plain: 'to hit · to critical' };
    }
    case 'damage': {
      const step = stepOf(trace, 'damage');
      return { value: `${step.min}–${step.max}`, plain: `dealt ${step.amount}` };
    }
    case 'element': {
      const chip = elementChip(trace);
      return { value: chip.value, plain: chip.label.toLowerCase() };
    }
    case 'status': {
      const applications = stepOf(trace, 'status').applications;
      if (applications.length === 0) return { value: 'None', plain: `${trace.commandLabel} carries no status` };
      const chip = statusChip(trace);
      return { value: chip.value, plain: chip.label };
    }
    case 'overdrive': {
      const bar = overdriveBar(trace);
      return { value: bar.text, plain: `${bar.mode} mode` };
    }
    case 'boss': {
      const step = stepOf(trace, 'boss');
      return { value: step.moveName, plain: `${step.turnsAway <= 1 ? 'next' : `in ${step.turnsAway} turns`} · ${step.confidence}` };
    }
  }
}

/** The one-line facts under the title: who did what to whom, and how many rules back it. */
export function factsLine(trace: TurnTrace, ruleCount: number): string {
  return `${trace.actorName} · ${trace.commandLabel} · ${trace.targetName}\n${ruleCount} sourced rules · live engine`;
}
