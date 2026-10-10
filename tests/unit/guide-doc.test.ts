/**
 * The strategy guide's documents (`src/data/guides/docs/`): what each one holds, and that it agrees
 * with the game it describes.
 *
 * Bailey, 2026-10-03: the guide follows the FFX and FFX-2 encounter guides and matches the original
 * document "in terms of formatting and everything else". So these tests pin the document's shape (a
 * header, stat lines, advice in order, Steal and Drops, or FFX-2's table), the numbers (every HP a
 * document prints is one the game uses: AGENTS.md rule 6), the game case (FFX chapters follow the
 * FFX guide, FFX-2 chapters the FFX-2 guide: rule 14), and that a document can always be paged.
 */
import { describe, expect, it } from 'vitest';
import { DOC_UNIT_MAX, type GuideDoc } from '../../src/data/guides/doc-types.ts';
import { GUIDE_DOCS, docForChapter } from '../../src/data/guides/docs/index.ts';
import { GUIDES } from '../../src/data/guides/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../src/data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../src/data/ffx2/index.ts';
import { CHAPTER_GAME } from '../../src/engine/tactics/lookup.ts';
import { anchorBoss, docStrings, docUnits } from './helpers/guideDocStrings.ts';

const FFX_CHAPTERS = [
  'seymour-flux',
  'yunalesca',
  'braskas-final-aeon',
  'seymour-anima-macalania',
  'evrae-airship',
  'yojimbo-cavern',
  'seymour-natus',
  'seymour-omnis',
  'isaaru-via-purifico',
  'sin-fins-core',
  'sin-face',
];
const FFX2_CHAPTERS = [
  'ffx2-bahamut',
  'ffx2-vegnagun-shuyin',
  'ffx2-leblanc',
  'ffx2-fallen-aeons',
  'ffx2-trema',
  'ffx2-den-of-woe',
  'ffx2-ixion-djose',
];

const doc = (id: string): GuideDoc => {
  const d = docForChapter(id);
  expect(d, `no guide document for chapter ${id}`).toBeDefined();
  return d!;
};

describe('every chapter with a guide has a document, for the right game', () => {
  it('has one document per guide, with the same chapter id and boss ids', () => {
    expect(GUIDE_DOCS.map((d) => d.id).sort()).toEqual(GUIDES.map((g) => g.id).sort());
    expect(new Set(GUIDE_DOCS.map((d) => d.id)).size).toBe(GUIDE_DOCS.length);
    for (const g of GUIDES) {
      expect([...doc(g.id).bossIds].sort(), `${g.id}: the document and the guide name different bosses`).toEqual(
        [...g.bossIds].sort(),
      );
    }
  });

  it('follows the FFX guide for chapters I to III, VII to X, XII, XIV, XVII, XVIII and the FFX-2 guide for the rest (rule 14)', () => {
    expect(FFX_CHAPTERS).toHaveLength(11);
    expect(FFX2_CHAPTERS).toHaveLength(7);
    for (const id of FFX_CHAPTERS) expect(doc(id).game, id).toBe('ffx');
    for (const id of FFX2_CHAPTERS) expect(doc(id).game, id).toBe('ffx2');
    for (const d of GUIDE_DOCS) expect(d.game, d.id).toBe(CHAPTER_GAME[d.id]);
  });
});

describe('a document is a page, laid out like one', () => {
  it('opens its boss pages with a header, and anchors only on bosses it names', () => {
    for (const d of GUIDE_DOCS) {
      const heads = d.blocks.filter((b) => b.t === 'head');
      expect(heads.length, `${d.id}: no boss header`).toBeGreaterThanOrEqual(1);
      let anchored = 0;
      for (const b of d.blocks) {
        for (const token of b.at ?? []) {
          anchored++;
          expect(d.bossIds, `${d.id}: anchor ${token} names no boss of the chapter`).toContain(anchorBoss(token));
        }
      }
      expect(anchored, `${d.id}: nothing tells the panel where to open`).toBeGreaterThan(0);
    }
  });

  it('prints the FFX stat lines the way that guide does: description, HP, Steal and Drops', () => {
    // Braska's Final Aeon has one boss page with no HP, Steal or Drops (it is the final boss); Yojimbo's page is a
    // paragraph and a hint box; Isaaru's has an HP line per aeon and no loot list.
    const noLoot = new Set(['braskas-final-aeon', 'yojimbo-cavern', 'isaaru-via-purifico']);
    for (const id of FFX_CHAPTERS) {
      const d = doc(id);
      const labels = d.blocks.flatMap((b) => (b.t === 'field' || b.t === 'list' ? [b.label] : []));
      if (noLoot.has(id)) {
        expect(labels, id).not.toContain('Steal');
        continue;
      }
      expect(labels, `${id}: no Steal list`).toContain('Steal');
      expect(labels, `${id}: no Drops list`).toContain('Drops');
      expect(labels.some((l) => /HP$/.test(l)), `${id}: no HP line`).toBe(true);
    }
    expect(doc('seymour-flux').blocks.some((b) => b.t === 'field' && b.label === 'In Game Description')).toBe(true);
  });

  it('prints the FFX-2 stat table the way that guide does: Enemy, HP, Steal, Drop, one box per enemy', () => {
    for (const id of FFX2_CHAPTERS) {
      const d = doc(id);
      const rows = d.blocks.flatMap((b) => (b.t === 'loot' ? b.rows : []));
      if (id === 'ffx2-leblanc') {
        // The page has no table for the Chateau fights, only a paragraph per fight.
        expect(rows, id).toHaveLength(0);
        continue;
      }
      expect(rows.length, `${id}: no stat table`).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r.enemy.length, id).toBeGreaterThan(0);
        expect(r.hp, id).toMatch(/^[\d,]+$/);
      }
      expect(d.blocks.some((b) => b.t === 'list' && (b.label === 'Steal' || b.label === 'Drops')), id).toBe(false);
    }
    // five bosses on the Vegnagun page, three on the Den's (Baralai, Gippal, Nooj)
    const tables = (id: string): number => doc(id).blocks.filter((b) => b.t === 'loot').length;
    expect(tables('ffx2-vegnagun-shuyin')).toBe(5);
    expect(tables('ffx2-den-of-woe')).toBe(3);
  });

  it('has no computed content: no NEXT, WATCH or RULES section, no step to press, no clock', () => {
    for (const d of GUIDE_DOCS) {
      // the headings and labels of a page: none of them is one of the old panel's three sections
      for (const b of d.blocks) {
        const heading =
          b.t === 'head' ? b.title : b.t === 'lead' || b.t === 'h3' ? b.text : b.t === 'list' || b.t === 'field' ? b.label : '';
        expect(heading, d.id).not.toMatch(/^(NEXT|WATCH|RULES)\b/i);
      }
      for (const s of docStrings(d)) expect(s, d.id).not.toMatch(/waiting for your turn|nothing in the plan/i);
    }
  });
});

describe('a document reads well in the sheet’s narrow column', () => {
  it(`keeps every block short (at most ${DOC_UNIT_MAX} characters)`, () => {
    const long: string[] = [];
    for (const d of GUIDE_DOCS) {
      for (const u of docUnits(d)) if (u.length > DOC_UNIT_MAX) long.push(`${d.id} (${u.length}): ${u.slice(0, 60)}...`);
    }
    expect(long).toEqual([]);
  });

  it('has no empty string, and no list without items', () => {
    for (const d of GUIDE_DOCS) {
      for (const s of docStrings(d)) expect(s.trim().length, d.id).toBeGreaterThan(0);
      for (const b of d.blocks) {
        if (b.t === 'ul' || b.t === 'ol' || b.t === 'list') expect(b.items.length, d.id).toBeGreaterThan(0);
      }
    }
  });
});

// ------------------------------------------------------------ numbers (rule 6)

/** Every HP the chapter's enemies hold: base, every form, parts included, along the whole chain. */
function chapterHps(chapterId: string): Set<number> {
  const chapter = getChapter(chapterId);
  expect(chapter, chapterId).toBeDefined();
  const groups = { ...FFX_GROUPS, ...FFX2_GROUPS } as Record<string, { enemies: Array<{ stats: { maxHp: number }; forms?: Array<{ hp: number }> }>; parts?: Array<{ stats: { maxHp: number }; forms?: Array<{ hp: number }> }>; nextGroupId?: string }>;
  const out = new Set<number>();
  const seen = new Set<string>();
  let g = chapter!.enemyGroupRef as unknown as (typeof groups)[string] & { id: string };
  while (g && !seen.has(g.id)) {
    seen.add(g.id);
    for (const e of [...g.enemies, ...(g.parts ?? [])]) {
      out.add(e.stats.maxHp);
      for (const f of e.forms ?? []) out.add(f.hp);
    }
    g = (g.nextGroupId ? groups[g.nextGroupId] : undefined) as typeof g;
  }
  return out;
}

const num = (s: string): number => Number(s.replace(/,/g, ''));

describe('every HP a document prints is one the game uses (AGENTS.md rule 6)', () => {
  for (const d of GUIDE_DOCS) {
    it(`${d.id}`, () => {
      const hps = chapterHps(d.id);
      const printed: number[] = [];
      for (const b of d.blocks) {
        if (b.t === 'field' && /HP$/.test(b.label)) printed.push(num(b.value));
        if (b.t === 'loot') for (const r of b.rows) printed.push(num(r.hp));
      }
      for (const p of printed) expect(hps.has(p), `${d.id} prints HP ${p}; the game holds ${[...hps].join(', ')}`).toBe(true);
    });
  }

  it('prints the number the game uses where the encounter guide differs, and says so nowhere on screen', () => {
    const text = (id: string): string => docStrings(doc(id)).join('\n');
    // Yojimbo: the page rounds to about 30,000; the game holds 33,000.
    expect(text('yojimbo-cavern')).toContain('33,000');
    expect(text('yojimbo-cavern')).not.toContain('30,000');
    // Paragon: the chapter ships Oversoul Paragon (210,000); the page's table gives the normal form's 200,000.
    expect(text('ffx2-trema')).toContain('210,000');
    expect(text('ffx2-trema')).not.toContain('200,000');
    // Spathi opens its count at 5 here (the page says 4); Sin's clock ends the fight on its 12th turn, the game's own script
    // (the page says about 16; it read "about thirteen turns" until CH-XVIII, re-parity, Bailey 2026-10-09).
    expect(text('isaaru-via-purifico')).toContain('counts down from 5 to 1');
    expect(text('sin-face')).toContain('on its twelfth turn');
    expect(text('sin-face')).not.toContain('thirteen');
    // Baralai's Drill Shot after 8 changes (the page says 10).
    expect(text('ffx2-den-of-woe')).toContain('changed 8 times');
    // Natus: the game awards no drop (the item has no record yet); the page lists a Lv. 2 Key Sphere.
    const natus = doc('seymour-natus').blocks.find((b) => b.t === 'list' && b.label === 'Drops');
    expect(natus && natus.t === 'list' ? natus.items : []).toEqual(['None']);
    // Nemo Ante Mortem Beatus: the game's own range, not the page's observed 700 to 1,500, and the Head's
    // "keep everyone above" line takes the top of that range (the page's 1,500 would leave a character at
    // 1,501 HP short of the 1,685 top).
    expect(text('ffx2-vegnagun-shuyin')).toContain('roughly 1,490 to 1,685');
    expect(text('ffx2-vegnagun-shuyin')).toContain('above 1,685 HP');
    expect(text('ffx2-vegnagun-shuyin')).not.toContain('1,500');
  });

  it('leaves out the claims our research says the game contradicts', () => {
    const text = (id: string): string => docStrings(doc(id)).join('\n');
    expect(text('seymour-natus')).not.toMatch(/Magic Break/); // Natus and Mortibody are immune
    expect(text('seymour-natus')).not.toMatch(/counterattack/); // a direct hit draws no counter-spell here
    expect(text('seymour-omnis')).not.toMatch(/Shell/); // Shell does nothing against Ultima
    expect(text('isaaru-via-purifico')).not.toMatch(/ice-based|Blizzaga/); // Ice is neutral to Grothia
    expect(text('ffx2-vegnagun-shuyin')).not.toMatch(/625/); // no buff touches Noli Me Tangere here
    expect(text('ffx2-ixion-djose')).not.toMatch(/four times/); // his loop is a counter here
  });
});
