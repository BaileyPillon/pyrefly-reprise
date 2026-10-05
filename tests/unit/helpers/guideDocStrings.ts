/**
 * Helpers for the strategy guide's documents (`src/data/guides/docs/`): every string a document can
 * put on screen, the text of every unit the panel pages by, and a synthetic board for each one.
 */
import type { BattleState } from '../../../src/battle/common/types.ts';
import type { DocBlock, GuideDoc } from '../../../src/data/guides/doc-types.ts';

/** Every string a document can put on screen, in reading order. */
export function docStrings(doc: GuideDoc): string[] {
  const out: string[] = [];
  for (const b of doc.blocks) {
    switch (b.t) {
      case 'head':
        out.push(b.title, ...(b.tag ? [b.tag] : []));
        break;
      case 'p':
      case 'lead':
      case 'h3':
        out.push(b.text);
        break;
      case 'ul':
      case 'ol':
        out.push(...b.items);
        break;
      case 'field':
        out.push(b.label, b.value);
        break;
      case 'list':
        out.push(b.label, ...b.items);
        break;
      case 'loot':
        for (const r of b.rows) out.push(r.enemy, r.hp, r.steal, r.drop);
        break;
      case 'table':
        out.push(...b.head);
        for (const r of b.rows) out.push(...r);
        break;
      case 'hint':
        out.push(b.title, b.text);
        break;
    }
  }
  return out;
}

/**
 * The text of each unit the panel pages by (`guideDocHtml.ts`): the whole of it must fit one page,
 * so its length is what the unit-size test bounds. A stat line counts its label and value, a loot
 * row all four of its cells, a boxed note its title and body.
 */
export function docUnits(doc: GuideDoc): string[] {
  const out: string[] = [];
  const add = (...parts: string[]): void => void out.push(parts.join(' '));
  for (const b of doc.blocks) {
    switch (b.t) {
      case 'head':
        add(b.title, b.tag ?? '');
        break;
      case 'p':
      case 'lead':
      case 'h3':
        add(b.text);
        break;
      case 'ul':
      case 'ol':
        for (const item of b.items) add(item);
        break;
      case 'field':
        add(b.label, b.value);
        break;
      case 'list':
        add(b.label);
        for (const item of b.items) add(item);
        break;
      case 'loot':
        for (const r of b.rows) add(r.enemy, r.hp, r.steal, r.drop);
        break;
      case 'table':
        add(...b.head);
        for (const r of b.rows) add(...r);
        break;
      case 'hint':
        add(b.title, b.text);
        break;
    }
  }
  return out;
}

/** The boss id an anchor token names: `'yunalesca#1'` and `'-sinspawn-genais'` both name a boss. */
export function anchorBoss(token: string): string {
  const bare = token.startsWith('-') ? token.slice(1) : token;
  const hash = bare.indexOf('#');
  return hash < 0 ? bare : bare.slice(0, hash);
}

export interface FakeEnemy {
  readonly id: string;
  readonly hp?: number;
  readonly alive?: boolean;
  readonly removed?: boolean;
  readonly formIndex?: number;
  readonly side?: 'enemy' | 'party' | 'aeon';
}

/**
 * A board with only what the guide reads: the game, and enemies keyed by id (side, alive, removed,
 * hp, form). `docForState` and `startBlockIndex` read nothing else.
 */
export function fakeBoard(game: 'ffx' | 'ffx2', enemies: readonly FakeEnemy[]): BattleState {
  const combatants: Record<string, unknown> = {};
  for (const e of enemies) {
    combatants[e.id] = {
      id: e.id,
      name: e.id,
      side: e.side ?? 'enemy',
      alive: e.alive ?? true,
      removed: e.removed ?? false,
      hp: e.hp ?? 1000,
      formIndex: e.formIndex ?? 0,
    };
  }
  return { game, combatants, log: [], flags: {} } as unknown as BattleState;
}

/** A board with every enemy id of the document standing, for mounting its panel. */
export function boardForDoc(doc: GuideDoc): BattleState {
  return fakeBoard(doc.game, doc.bossIds.map((id) => ({ id })));
}

/** The index of the first block of a kind, for readable assertions. */
export function indexOfBlock(doc: GuideDoc, pred: (b: DocBlock) => boolean): number {
  return doc.blocks.findIndex(pred);
}
