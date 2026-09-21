/**
 * Turns a chapter's `ChapterGuide` (`src/data/guides/*.ts`) into a piece's
 * second tab, "How to answer it" — Overview is always the first tab; this
 * one only exists when the guide actually says something about that piece
 * (`docs/plans/learning-sites.md` site A spec).
 *
 * `PieceCardTab` (`learn/shared/model.ts`) carries its cited content as
 * `sections: TabSection[]`, one per guide sentence, each with its own `cite`
 * — never one sentence's citation appended in parentheses after another's
 * text, which would blur which claim a given source actually backs. `body`
 * is left `''`: every guide-derived tab's content lives in `sections`.
 *
 * Matching rules, one per guide section:
 *  - **`phases`** attach to a parts-and-forms piece: by `bossId` (or, when a
 *    phase omits it, the chapter's primary boss, `guide.bossIds[0]`), and by
 *    `formIndex` when the phase names one (Yunalesca's three forms each get
 *    their own note this way). A phase naming neither `aboveHpFraction` nor
 *    `belowHpFraction` nor a form always applies; one naming an HP fraction
 *    (Seymour's two phases) is shown regardless of fraction — this is a
 *    static reference card, not a live battle, so both of a boss's
 *    documented phases are worth showing together.
 *  - **`watch`** attaches to an ability piece: by `GuideWatch.name` matching
 *    the ability's own name first: falls back to matching `GuideWatch.payload`
 *    when the name doesn't (the telegraph name is sometimes a synthetic
 *    engine label with no `AbilityDef` of its own — Bahamut's countdown
 *    literally names itself `'#'`, and Seymour's `'Auto-Attack Mode'`/`'Ready
 *    To Annihilate'` are the same case; both name the ability that actually
 *    lands as `payload`).
 *  - **`hints`** attach to a reward piece: by `GuideHintMatch.labels`
 *    matching the item's own display name (the one case where a hint's
 *    menu-command label is also one of this data layer's own catalogue
 *    facts).
 */

import type { AbilityDef, EnemyDef } from '../../src/battle/common/types.ts';
import type { ChapterGuide } from '../../src/data/guides/types.ts';
import type { PieceCardTab, TabSection } from '../shared/model.ts';

export function overviewTab(body: string): PieceCardTab {
  return { id: 'overview', label: 'Overview', body };
}

interface Note {
  /** The guide entry's own natural title (a watch entry's name, a phase note's label) — never invented. */
  readonly heading?: string;
  readonly text: string;
  readonly cite: string;
}

function tabFromNotes(notes: readonly Note[]): PieceCardTab | undefined {
  if (notes.length === 0) return undefined;
  const sections: TabSection[] = notes.map((note) => ({ heading: note.heading, text: note.text, cite: note.cite }));
  return {
    id: 'how-to-answer-it',
    label: 'How to answer it',
    body: '',
    sections,
  };
}

/** The "How to answer it" tab for a parts-and-forms piece (a combatant, or one of its forms), when the guide has phase notes for it. */
export function howToAnswerForCombatant(
  guide: ChapterGuide | undefined,
  combatant: EnemyDef,
  formIndex: number | undefined,
): PieceCardTab | undefined {
  if (guide === undefined) return undefined;
  const primaryBossId = guide.bossIds[0];

  const notes: Note[] = guide.phases
    .filter((phase) => {
      const namesThisBoss = phase.bossId !== undefined ? phase.bossId === combatant.id : combatant.id === primaryBossId;
      if (!namesThisBoss) return false;
      return phase.formIndex === undefined || phase.formIndex === formIndex;
    })
    .map((phase) => ({ heading: phase.label, text: phase.note, cite: phase.cite }));

  return tabFromNotes(notes);
}

/** The "How to answer it" tab for an ability piece, when the guide has a `watch` entry for it. */
export function howToAnswerForAbility(guide: ChapterGuide | undefined, ability: AbilityDef): PieceCardTab | undefined {
  if (guide === undefined) return undefined;
  const name = ability.name.toLowerCase();

  const notes: Note[] = guide.watch
    .filter((watch) => watch.name.toLowerCase() === name || watch.payload.toLowerCase() === name)
    .map((watch) => ({ heading: watch.name, text: `${watch.advice}.`, cite: watch.cite }));

  return tabFromNotes(notes);
}

/** The "How to answer it" tab for a reward piece, when the guide has a hint keyed to that item's own display name. */
export function howToAnswerForItemName(guide: ChapterGuide | undefined, itemName: string): PieceCardTab | undefined {
  if (guide === undefined) return undefined;
  const name = itemName.toLowerCase();

  const notes: Note[] = guide.hints
    .filter((hint) => (hint.when.labels ?? []).some((label) => label.toLowerCase() === name))
    .map((hint) => ({ text: hint.text, cite: hint.cite }));

  return tabFromNotes(notes);
}
