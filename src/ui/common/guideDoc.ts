import type { AnyCombatant, BattleState, EnemyFields } from '../../battle/common/types.ts';
import type { DocBlock, GuideDoc } from '../../data/guides/doc-types.ts';
import { GUIDE_DOCS } from '../../data/guides/docs/index.ts';

/**
 * Which document the strategy guide shows for a battle, and where in it the panel opens.
 *
 * Nothing here reads a tactic, the move advisor or `intendedStrategy`: the document for a board is
 * found from the board's enemy ids alone, the way a reader finds a boss's page, and the panel opens
 * on that boss's part of it. (`tests/unit/guide-doc-separation.test.ts` pins that this module and
 * the panel import none of them.)
 */

/** A standing enemy: on the enemy side, alive and still on the field. */
function standing(c: AnyCombatant | undefined): c is AnyCombatant {
  return c !== undefined && c.side === 'enemy' && c.alive && !c.removed && c.hp > 0;
}

/**
 * The document for the encounter on the board, if its chapter has one.
 *
 * The battle's game must be the document's game (FFX's aeon Bahamut shares an id with Chapter IV's
 * FFX-2 boss, and a party carries its aeons in the record from the first turn), and one of the
 * document's boss ids must be in the record on the enemy side. Both games.
 */
export function docForState(state: Readonly<Pick<BattleState, 'game' | 'combatants'>>): GuideDoc | null {
  return (
    GUIDE_DOCS.find((d) => d.game === state.game && d.bossIds.some((id) => state.combatants[id]?.side === 'enemy')) ??
    null
  );
}

/** Does one anchor token match the board? `id`, `id#form` (that boss in that form only) or `-id` (see {@link blockQualifies}). */
function anchorMatches(token: string, state: Readonly<Pick<BattleState, 'combatants'>>): boolean {
  const hash = token.indexOf('#');
  const id = hash < 0 ? token : token.slice(0, hash);
  const c = state.combatants[id];
  if (!standing(c)) return false;
  if (hash < 0) return true;
  const form = Number(token.slice(hash + 1));
  return ((c as Partial<EnemyFields>).formIndex ?? 0) === form;
}

/**
 * A block is where to open when one of its plain anchors matches a standing enemy and none of its
 * `-id` anchors does ("the Core, but only once Genais has fallen").
 */
function blockQualifies(block: DocBlock, state: Readonly<Pick<BattleState, 'combatants'>>): boolean {
  const at = block.at;
  if (!at || at.length === 0) return false;
  let hit = false;
  for (const token of at) {
    if (token.startsWith('-')) {
      if (anchorMatches(token.slice(1), state)) return false;
    } else if (anchorMatches(token, state)) {
      hit = true;
    }
  }
  return hit;
}

/**
 * The index of the block the panel opens on: the last anchored block (in document order) whose boss
 * is standing, so a later fight takes over from an earlier one still on the field (Anima summoned
 * over Seymour). No anchor matches: block 0, the top of the document.
 */
export function startBlockIndex(doc: GuideDoc, state: Readonly<Pick<BattleState, 'combatants'>>): number {
  for (let i = doc.blocks.length - 1; i >= 0; i--) {
    if (blockQualifies(doc.blocks[i]!, state)) return i;
  }
  return 0;
}

/** The heading the panel is opened under: the nearest `head` block at or above `start`, else the first one. */
export function headingAt(doc: GuideDoc, start: number): string {
  for (let i = Math.min(start, doc.blocks.length - 1); i >= 0; i--) {
    const b = doc.blocks[i]!;
    if (b.t === 'head') return b.title;
  }
  const first = doc.blocks.find((b) => b.t === 'head');
  return first && first.t === 'head' ? first.title : doc.id;
}

/** What the panel is showing right now, for tests and the debug snapshot. */
export interface GuideDocView {
  readonly chapterId: string;
  /** The boss's header the panel is open under (a chain chapter changes it link by link). */
  readonly title: string;
  /** Index of the block the panel opens on. */
  readonly start: number;
}
