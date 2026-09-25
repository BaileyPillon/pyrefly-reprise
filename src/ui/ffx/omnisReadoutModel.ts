import type { BattleState, ElementalAffinities, FFXCombatant } from '../../battle/common/types.ts';
import {
  MORTIPHASM_IDS,
  OMNIS_GA,
  OMNIS_ID,
  OMNIS_RA,
  OMNIS_STATE,
  omnisAffinities,
  omnisDiscs,
  type Element4,
  type OmnisState,
} from '../../battle/ffx/ai/seymour-omnis-rules.ts';
import { isAlive } from '../../battle/ffx/predicates.ts';
import {
  omnisBlizzaga,
  omnisBlizzara,
  omnisDispel,
  omnisFira,
  omnisFiraga,
  omnisThundaga,
  omnisThundara,
  omnisUltima,
  omnisWatera,
  omnisWaterga,
} from '../../data/ffx/enemies/seymour-omnis-abilities.ts';

/**
 * **Chapter XII — what the disc strip and the intent line say.** Pure and
 * DOM-free, so the widget (`OmnisReadout.ts`) only paints.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the discs exist only in the FFX
 * Seymour Omnis fight (`research/ffx-seymour-omnis.md` §0.3).
 *
 * On whose word: Bailey adopted every Chapter XII recommendation (D-145,
 * 2026-09-25, "I'll go with all your recommendations"), among them **O-2 B**
 * (the painted discs plus a HUD strip: the colour each disc shows him and what
 * that makes him; `docs/concepts/chapters/omnis/o2-discs/b-frame.jpg`) and
 * **O-4 C** (one line of intent; `o4-fight/c-{i,ii,iii}.jpg`). The three
 * approved sentences are reproduced word for word ({@link omnisIntent}); every
 * other state says the same things in the same words.
 *
 * What the line may not do (plan §6.2, O-4): **name which party member a spell
 * hits** (the mapping is an estimate, B12). It names only the spells, which the
 * sources give: one per disc, **-ra** on one or two discs of an element, **-ga**
 * on three or four [§4.1, verified: 4 sources], one per living member plus one
 * [single source: wiki], the first discs keeping theirs (`planOmnisVolley`).
 *
 * **The colour order is our estimate** (B8: the ring and the reset cycle,
 * `seymour-omnis-rules.ts#DISC_RING`, `#OMNIS_RESET_CYCLE`); the widget prints
 * {@link COLOUR_ORDER_NOTE} beside every strip, and nothing here restates the
 * order (it reads the facings the engine turned, never the ring).
 */

/** The strip's words for the four elements. */
export const ELEMENT_NAME: Readonly<Record<Element4, string>> = { fire: 'Fire', ice: 'Ice', lightning: 'Thunder', water: 'Water' };

/** The label B8 asks for wherever the colour order is shown (our words). */
export const COLOUR_ORDER_NOTE = 'Colour order: our estimate';

/**
 * The strip's two-by-two grid as the discs stand on the field: upper-left,
 * upper-right, lower-left, lower-right, as disc indexes (`MORTIPHASM_IDS`).
 * The Garden of Pain stands disc 1 upper-left, 2 lower-left, 3 lower-right and
 * 4 upper-right (`src/scenes/garden-of-pain.ts#DISC_LAYOUT`; a test pins it).
 */
export const STRIP_GRID: readonly number[] = [0, 3, 1, 2];

export type AffinityLabel = 'Absorbs' | 'Immune' | 'Halves' | 'Weak';

/** One run of the intent sentence; `bold` runs are the gold words of the frames. */
export interface IntentRun {
  text: string;
  bold?: boolean;
}

export interface OmnisChipView {
  index: number;
  element: Element4;
  name: string;
  /** Turned since his last turn (the frame's white outline, `c-iii`). */
  turned: boolean;
}

export interface OmnisReadoutView {
  /** In {@link STRIP_GRID} order. */
  chips: OmnisChipView[];
  /** Absorbs, Immune, Halves, Weak, each only when something is in it. */
  affinity: Array<{ label: AffinityLabel; elements: Element4[] }>;
  intent: IntentRun[];
  /** He glows red (Dispel, then Ultima, next; research §4.4). */
  glow: boolean;
}

/** What the model needs; the widget keeps `turned` and `weakBefore` from the event stream. */
export interface OmnisReadoutInput {
  discs: readonly Element4[];
  state: OmnisState;
  /** Party members standing (an aeon on the field counts alone, as the engine's `friendlies`). */
  living: number;
  /** Disc indexes turned since his last turn, oldest first. */
  turned: readonly number[];
  /** The weakness he had when {@link turned} was last cleared. */
  weakBefore: Element4 | null;
}

const ORDER: readonly Element4[] = ['fire', 'ice', 'lightning', 'water'];
const LABEL: Readonly<Partial<Record<string, AffinityLabel>>> = { absorb: 'Absorbs', immune: 'Immune', resist: 'Halves', weak: 'Weak' };
const ROWS: readonly AffinityLabel[] = ['Absorbs', 'Immune', 'Halves', 'Weak'];
const WORD = ['no', 'one', 'two', 'three', 'four'] as const;

const SPELL_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  [omnisFira, omnisBlizzara, omnisThundara, omnisWatera, omnisFiraga, omnisBlizzaga, omnisThundaga, omnisWaterga].map((a) => [a.id, a.name]),
);

/** True when the battle carries the Omnis disc state (Chapter XII only). */
export function hasOmnisDiscs(state: Pick<BattleState, 'flags'>): boolean {
  return omnisDiscs(state).length === MORTIPHASM_IDS.length;
}

export function omnisStateOf(state: Pick<BattleState, 'flags'>): OmnisState {
  const v = state.flags[OMNIS_STATE];
  return v === 'red' || v === 'dispelled' || v === 'reset-due' ? v : 'normal';
}

/** He glows red from the moment the counter fills until Ultima (§4.4: "glows red before Dispel / Ultima"). */
export function glowsRed(state: OmnisState): boolean {
  return state === 'red' || state === 'dispelled';
}

/** Members standing, as the volley counts them (`state.ts#livingFriendlies`). */
export function livingPartyOf(state: Pick<BattleState, 'combatants' | 'activeIds' | 'aeonId'>): number {
  const ids = state.aeonId ? [state.aeonId] : state.activeIds;
  return ids.filter((id) => {
    const c = state.combatants[id] as FFXCombatant | undefined;
    return c ? isAlive(c) : false;
  }).length;
}

/** The weakness the discs give him, if any (four of a kind; the opposite element). */
export function weaknessOf(affinities: ElementalAffinities): Element4 | null {
  return ORDER.find((e) => affinities[e] === 'weak') ?? null;
}

/** The affinity rows the strip prints for a disc layout. */
export function affinityRows(discs: readonly Element4[]): OmnisReadoutView['affinity'] {
  const aff = omnisAffinities(discs);
  return ROWS.map((label) => ({ label, elements: ORDER.filter((e) => LABEL[aff[e] ?? 'normal'] === label) })).filter((r) => r.elements.length > 0);
}

/** The spells his next volley casts, largest group first: `[['Firaga', 3], ['Thundara', 1]]`. */
export function volleyOf(discs: readonly Element4[], living: number): Array<[string, number]> {
  const casts = Math.min(discs.length, Math.max(0, living) + 1);
  const groups = new Map<string, number>();
  for (const element of discs.slice(0, casts)) {
    const shown = discs.filter((d) => d === element).length;
    const name = SPELL_NAME[shown >= 3 ? OMNIS_GA[element] : OMNIS_RA[element]] ?? element;
    groups.set(name, (groups.get(name) ?? 0) + 1);
  }
  return [...groups.entries()].sort((a, b) => b[1] - a[1]);
}

function listRuns(items: Array<[string, number]>, bold: boolean): IntentRun[] {
  const out: IntentRun[] = [];
  items.forEach(([name, n], i) => {
    if (i > 0) out.push({ text: i === items.length - 1 ? ' and ' : ', ' });
    out.push({ text: `${WORD[n] ?? n} ` }, { text: name, bold });
  });
  return out;
}

function capitalised(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The lead: "Every disc shows Fire", "One disc turned to Thunder", "The discs show three Fire and one Thunder". */
function lead(discs: readonly Element4[], turned: readonly number[]): IntentRun[] {
  const first = discs[0];
  if (first && discs.every((d) => d === first)) return [{ text: 'Every disc shows ' }, { text: ELEMENT_NAME[first], bold: true }];
  const last = turned[turned.length - 1];
  if (turned.length === 1 && last !== undefined && discs[last]) return [{ text: 'One disc turned to ' }, { text: ELEMENT_NAME[discs[last]!], bold: true }];
  if (turned.length > 1) return [{ text: `${capitalised(WORD[Math.min(turned.length, 4)]!)} discs turned` }];
  const counts = ORDER.map((e): [string, number] => [ELEMENT_NAME[e], discs.filter((d) => d === e).length]).filter(([, n]) => n > 0);
  return [{ text: 'The discs show ' }, ...listRuns(counts.sort((a, b) => b[1] - a[1]), true)];
}

/**
 * **The intent line.** The frames' three sentences, word for word:
 *
 * - turn one (`c-i`): "Every disc shows **Fire**: four **Firaga** next. He absorbs Fire and is **weak to Ice**."
 * - the glow (`c-ii`): "He glows red: **Dispel** on the party, then **Ultima**. After it, every disc turns to the next element."
 * - a turned disc (`c-iii`): "One disc turned to **Thunder**: three **Firaga** and one **Thundara** next. Ice no longer hurts him extra."
 *
 * The other states reuse those words: after Dispel the line names Ultima alone;
 * after Ultima (the discs reset on his next turn, B23 = a) it says so without
 * naming the colour.
 */
export function omnisIntent(input: OmnisReadoutInput): IntentRun[] {
  const dispel = omnisDispel.name;
  const ultima = omnisUltima.name;
  const after = { text: '. After it, every disc turns to the next element.' };
  if (input.state === 'red') return [{ text: 'He glows red: ' }, { text: dispel, bold: true }, { text: ' on the party, then ' }, { text: ultima, bold: true }, after];
  if (input.state === 'dispelled') return [{ text: 'He glows red: ' }, { text: ultima, bold: true }, { text: ' on the party next' }, after];
  if (input.state === 'reset-due') return [{ text: 'After ' }, { text: ultima, bold: true }, { text: ', every disc turns to the next element on his next turn.' }];
  const out: IntentRun[] = [...lead(input.discs, input.turned), { text: ': ' }, ...listRuns(volleyOf(input.discs, input.living), true), { text: ' next.' }];
  const aff = omnisAffinities(input.discs);
  const weak = weaknessOf(aff);
  const absorbs = ORDER.find((e) => aff[e] === 'absorb');
  if (weak && absorbs) out.push({ text: ` He absorbs ${ELEMENT_NAME[absorbs]} and is ` }, { text: `weak to ${ELEMENT_NAME[weak]}`, bold: true }, { text: '.' });
  else if (input.weakBefore && aff[input.weakBefore] !== 'weak') out.push({ text: ` ${ELEMENT_NAME[input.weakBefore]} no longer hurts him extra.` });
  return out;
}

/** The whole read-out for one moment of the fight. */
export function omnisReadoutView(input: OmnisReadoutInput): OmnisReadoutView {
  const chips = STRIP_GRID.map((index) => {
    const element = input.discs[index] ?? 'fire';
    return { index, element, name: ELEMENT_NAME[element], turned: input.turned.includes(index) };
  });
  return { chips, affinity: affinityRows(input.discs), intent: omnisIntent(input), glow: glowsRed(input.state) };
}

/** The sentence as plain text (tests, the debug snapshot, `aria-label`). */
export function intentText(runs: readonly IntentRun[]): string {
  return runs.map((r) => r.text).join('');
}

/** Omnis's combatant id, for the widget's event filter. */
export const OMNIS_COMBATANT = OMNIS_ID;
