/**
 * Site A's **nothing-selected** card: the approved frame's "THE CHAIN ·
 * NOTHING SELECTED" (`docs/concepts/atlas/a-boss-atlas/a1-assembled.html`).
 *
 * The frame answers one question before the reader touches anything — what
 * am I looking at, and in what order do I fight it — so the card lists the
 * chapter's battles in chain order with each one's level and HP, and says
 * that there is no menu between them. Every value here is read out of the
 * shipped data: the battle order from `EnemyGroupDef.nextGroupId` (whose own
 * contract in `src/battle/common/types.ts` is "the formation that follows
 * this one **with no menu between**"), the names, levels and HP from the
 * combatants, the prose from the chapter's own `blurb`, and the sources from
 * `cites.ts`. Nothing is typed in here (AGENTS.md hard rule 6).
 */

import type { EnemyDef, EnemyGroupDef } from '../../src/battle/common/types.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import type { SpecimenIdle, SpecimenIdleRow } from '../shared/model.ts';
import { citeForCombatant } from './cites.ts';
import { countNoun, fmtNumber, joinNatural, sharedLastWord } from './format.ts';

/** The supports that fight alongside a formation's primary enemy: its other enemies, plus its parts. */
function supportsOf(group: EnemyGroupDef): EnemyDef[] {
  return [...group.enemies.slice(1), ...(group.parts ?? [])];
}

/** `['Node','Node','Node']` -> `'+ 3 Nodes'`, `['Right Bulwark','Left Bulwark']` -> `'+ 2 Bulwarks'`; a mixed set stays honest with the generic noun. */
function supportSuffix(supports: readonly EnemyDef[]): string {
  if (supports.length === 0) return '';
  const noun = sharedLastWord(supports.map((s) => s.name));
  if (noun === undefined) return ` + ${countNoun(supports.length, 'part')}`;
  const plural = supports.length > 1 && !noun.endsWith('s') ? 's' : '';
  return ` + ${supports.length} ${noun}${plural}`;
}

function hpOf(enemy: EnemyDef): number {
  return enemy.forms[0]?.hp ?? enemy.hp;
}

function rowFor(group: EnemyGroupDef, nameOf: (enemy: EnemyDef) => string): SpecimenIdleRow | undefined {
  const primary = group.enemies[0];
  if (primary === undefined) return undefined;
  const label = `${nameOf(primary)}${supportSuffix(supportsOf(group))}`;
  const value = `${fmtNumber(hpOf(primary))} HP`;
  return primary.level !== undefined ? { label, value, sub: `Level ${primary.level}` } : { label, value };
}

/**
 * Squashes several per-combatant cites that all name the same research file
 * into one line — `research/x.md §3.1 (src/…)` five times over is the card's
 * whole height otherwise. Files are kept in first-seen order, sections in
 * first-seen order within a file, and a cite whose shape this does not
 * recognise is passed through untouched rather than dropped.
 */
export function compactCites(cites: readonly string[]): string {
  const sectionsByFile = new Map<string, string[]>();
  const passthrough: string[] = [];

  for (const cite of cites) {
    const match = /^(\S+)\s+(§\S+)/.exec(cite);
    if (match === null) {
      if (!passthrough.includes(cite)) passthrough.push(cite);
      continue;
    }
    const [, file = '', section = ''] = match;
    const sections = sectionsByFile.get(file);
    if (sections === undefined) {
      sectionsByFile.set(file, [section]);
    } else if (!sections.includes(section)) {
      sections.push(section);
    }
  }

  const grouped = [...sectionsByFile].map(([file, sections]) => `${file} ${sections.join(', ')}`);
  return [...grouped, ...passthrough].join(' · ');
}

/**
 * The chain card for one chapter, or `undefined` when the chapter fields a
 * formation with no enemies at all. `nameOf` is the same display name the
 * parts system gives that combatant's piece (`distinguishUnitNames`), so the
 * card's row and the pin on the stage read the same word.
 */
export function buildIdleCard(
  chapter: Chapter,
  chain: readonly EnemyGroupDef[],
  nameOf: (enemy: EnemyDef) => string,
): SpecimenIdle | undefined {
  const rows = chain.map((group) => rowFor(group, nameOf)).filter((row): row is SpecimenIdleRow => row !== undefined);
  if (rows.length === 0) return undefined;

  const primaries = chain.map((group) => group.enemies[0]).filter((e): e is EnemyDef => e !== undefined);
  const cite = compactCites(primaries.map((enemy) => citeForCombatant(chapter.id, enemy.id)));

  // `nextGroupId`'s own contract is "the formation that follows this one with no menu
  // between", so a chain of two or more is exactly that claim — never a guess.
  const note =
    chain.length > 1
      ? `${countNoun(chain.length, 'battle')} with no menu between them, in this order.`
      : `One battle. ${joinNatural(rows.map((row) => row.label))} on the field.`;

  return {
    eyebrow: chain.length > 1 ? 'The chain · nothing selected' : 'The battle · nothing selected',
    title: chapter.title,
    body: chapter.blurb,
    rows,
    note,
    cite,
  };
}
