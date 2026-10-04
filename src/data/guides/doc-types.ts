/**
 * The strategy guide's **documents**: for each chapter, a written guide laid out the way a plain
 * boss guide is laid out, one page per fight in play order.
 *
 * Bailey, 2026-10-03: "from now on the guide follows the ffx/ffx-2 encounter guides" and, once the
 * first plan-and-NEXT-line version was on the table, "Just match the original document please in
 * terms of formatting and everything else". So a document is **a page, not a plan**: the boss's header, the labelled stat lines the page prints for that boss (the game's own
 * description line, HP, Steal, Drops, or FFX-2's Enemy / HP / Steal / Drop table), and the advice in
 * the order the page gives it, as paragraphs, bullet lists, numbered steps, labelled lead-ins and
 * sub-headings. Nothing in a document is computed: it never reads the battle except to decide
 * which fight to open on (`src/ui/common/guideDoc.ts`), and it contains no move recommendation of ours.
 *
 * ## Everything here is plain data
 *
 * Like the rest of `src/data/**` this imports nothing but types, so a document can be read and
 * checked without running the game. The advisor, the tactics and every bench never touch it, and it
 * touches none of them: `tests/unit/guide-doc-separation.test.ts` pins that in both directions.
 *
 * ## The words
 *
 * Every sentence is written in our own words; the stat labels and the page's own short headings
 * ("HP", "Steal", "Drops", "Boss Battle") are the only text shared with the page they follow. No
 * string names where the advice came from: `tests/unit/guide-doc-words.test.ts` fails on any
 * rendered string that does. Where our chapter holds a number that differs from the page's, the
 * number printed is the one the game uses (rule 6), and `docs/handoff/r38-guide-jegged.md` lists
 * every such difference.
 *
 * ## Block sizes
 *
 * The panel is a scrolling reading sheet (`StrategyGuide.ts`), so no block has to fit a page; a short
 * block still reads better in a narrow column. Every prose block stays under {@link DOC_UNIT_MAX}
 * characters (a long paragraph is written as two), which the words test also pins.
 */

/** The longest a single paragraph, list item or stat value may be, so one block stays short enough to read in the sheet's column. */
export const DOC_UNIT_MAX = 260;

/**
 * Where the panel opens: the enemy ids on the field that make this block the right place to start
 * reading. `'yunalesca#1'` is that boss only in its second form (`formIndex`, 0-based); a bare id
 * matches the boss in any form. Of all anchored blocks whose boss is standing, the last in the
 * document wins, so a later fight of the same chapter takes over from an earlier one that is still
 * on the field (Anima summoned over Seymour). No match: the top of the document.
 */
export type DocAnchor = string;

/** One row of an FFX-2 page's Enemy / HP / Steal / Drop table. */
export interface DocLootRow {
  readonly enemy: string;
  readonly hp: string;
  readonly steal: string;
  readonly drop: string;
}

interface DocBlockBase {
  /** Open the panel at this block while one of these is standing on the field. */
  readonly at?: readonly DocAnchor[];
}

export type DocBlock =
  /** The boss's header: its name, and the small line under it ("Boss Battle", "Final Boss Battle"). */
  | (DocBlockBase & { readonly t: 'head'; readonly title: string; readonly tag?: string })
  /** A paragraph. */
  | (DocBlockBase & { readonly t: 'p'; readonly text: string })
  /** A run-in line that names what follows ("The strategy:"). */
  | (DocBlockBase & { readonly t: 'lead'; readonly text: string })
  /** A sub-heading inside a boss's page ("Yu Pagodas"). */
  | (DocBlockBase & { readonly t: 'h3'; readonly text: string })
  /** A bulleted list; every item is its own block. */
  | (DocBlockBase & { readonly t: 'ul'; readonly items: readonly string[] })
  /** A numbered list. */
  | (DocBlockBase & { readonly t: 'ol'; readonly items: readonly string[] })
  /** A labelled stat line: "HP: 70,000", "In Game Description: ...", "Phase 2: HP: 48,000". */
  | (DocBlockBase & { readonly t: 'field'; readonly label: string; readonly value: string })
  /** A labelled list under its own label ("Steal:" then its items). */
  | (DocBlockBase & { readonly t: 'list'; readonly label: string; readonly items: readonly string[] })
  /** FFX-2's Enemy / HP / Steal / Drop table, one stacked box per enemy so it fits the rail. */
  | (DocBlockBase & { readonly t: 'loot'; readonly rows: readonly DocLootRow[] })
  /** Any other small table (the Bulwarks' answers), one stacked row at a time. */
  | (DocBlockBase & { readonly t: 'table'; readonly head: readonly string[]; readonly rows: readonly (readonly string[])[] })
  /** A boxed note that stands apart from the text ("Helpful Hint", "Warning"). */
  | (DocBlockBase & { readonly t: 'hint'; readonly kind: 'hint' | 'warning'; readonly title: string; readonly text: string });

/** One chapter's document. */
export interface GuideDoc {
  /** Chapter id from `src/data/encounters.ts`; the same id the chapter's `ChapterGuide` has. */
  readonly id: string;
  /** FFX chapters follow the FFX guide, FFX-2 chapters the FFX-2 guide (AGENTS.md rule 14). */
  readonly game: 'ffx' | 'ffx2';
  /**
   * Every enemy id the chapter can field, so the panel can tell which chapter is on the board. A
   * chained chapter lists **all** of its links, exactly as `ChapterGuide.bossIds` does.
   */
  readonly bossIds: readonly string[];
  readonly blocks: readonly DocBlock[];
}
