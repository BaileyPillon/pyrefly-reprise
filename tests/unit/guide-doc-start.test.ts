/**
 * Which document the panel shows for a board, and the block it opens on (`src/ui/common/guideDoc.ts`).
 *
 * The panel opens on the part of the document for the boss that is standing, the way a reader turns
 * to a boss's page; nothing here reads a tactic. Boards are synthetic (the game, and enemies with a
 * side, an HP, a form): that is all the lookup reads.
 */
import { describe, expect, it } from 'vitest';
import type { GuideDoc } from '../../src/data/guides/doc-types.ts';
import { GUIDE_DOCS, docForChapter } from '../../src/data/guides/docs/index.ts';
import { docForState, headingAt, startBlockIndex } from '../../src/ui/common/guideDoc.ts';
import { anchorBoss, fakeBoard } from './helpers/guideDocStrings.ts';

const doc = (id: string): GuideDoc => docForChapter(id)!;
const headIndex = (d: GuideDoc, title: string): number => d.blocks.findIndex((b) => b.t === 'head' && b.title === title);
const fieldIndex = (d: GuideDoc, label: string): number => d.blocks.findIndex((b) => b.t === 'field' && b.label === label);

describe('which document is on the board', () => {
  it('finds a chapter from its enemies on the enemy side', () => {
    expect(docForState(fakeBoard('ffx', [{ id: 'seymour-flux' }, { id: 'mortiorchis' }]))?.id).toBe('seymour-flux');
    expect(docForState(fakeBoard('ffx2', [{ id: 'bahamut' }]))?.id).toBe('ffx2-bahamut');
    expect(docForState(fakeBoard('ffx2', [{ id: 'x2-shiva' }]))?.id).toBe('ffx2-fallen-aeons');
  });

  it('never leaks across the games: FFX’s aeon Bahamut is not the FFX-2 boss', () => {
    // A party in FFX carries its aeons in the battle record from the first turn, on the party's side.
    expect(docForState(fakeBoard('ffx', [{ id: 'bahamut', side: 'aeon' }]))).toBeNull();
    expect(docForState(fakeBoard('ffx', [{ id: 'bahamut', side: 'party' }]))).toBeNull();
    expect(docForState(fakeBoard('ffx', [{ id: 'bahamut', side: 'enemy' }]))).toBeNull();
    expect(docForState(fakeBoard('ffx2', [{ id: 'bahamut', side: 'party' }]))).toBeNull();
  });

  it('has nothing for an encounter without a written guide', () => {
    expect(docForState(fakeBoard('ffx', []))).toBeNull();
    expect(docForState(fakeBoard('ffx', [{ id: 'some-random-fiend' }]))).toBeNull();
  });
});

describe('where the panel opens', () => {
  it('opens at the top of the document when no anchored boss is standing', () => {
    const d = doc('seymour-flux');
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'mortiorchis', alive: false, hp: 0 }]))).toBe(0);
  });

  it('opens a single-fight document on its boss header', () => {
    for (const id of ['seymour-flux', 'evrae-airship', 'seymour-natus', 'seymour-omnis', 'sin-face', 'ffx2-bahamut', 'ffx2-ixion-djose']) {
      const d = doc(id);
      const board = fakeBoard(d.game, [{ id: d.bossIds[0]! }]);
      const at = startBlockIndex(d, board);
      expect(d.blocks[at]!.t, id).toBe('head');
      expect(headingAt(d, at), id).toBe((d.blocks[at] as { title: string }).title);
    }
  });

  it('opens Yunalesca on the phase she is in', () => {
    const d = doc('yunalesca');
    const at = (form: number): number => startBlockIndex(d, fakeBoard('ffx', [{ id: 'yunalesca', formIndex: form }]));
    expect(at(0)).toBe(headIndex(d, 'Yunalesca'));
    expect(at(1)).toBe(fieldIndex(d, 'Phase 2: HP'));
    expect(at(2)).toBe(fieldIndex(d, 'Phase 3: HP'));
    // the header stays the heading all the way down
    expect(headingAt(d, at(2))).toBe('Yunalesca');
  });

  it('opens Seymour and Anima on whoever the fight is about, and lets the later fight take over', () => {
    const d = doc('seymour-anima-macalania');
    const seymour = headIndex(d, 'Seymour');
    const anima = headIndex(d, 'Anima');
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'seymour-macalania' }, { id: 'guado-guardian-a' }, { id: 'anima-macalania', removed: true }]))).toBe(seymour);
    // act two: Anima is summoned over Seymour, who is still on the field
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'seymour-macalania' }, { id: 'anima-macalania' }]))).toBe(anima);
    // act three: Anima is gone, Seymour stands alone again
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'seymour-macalania' }, { id: 'anima-macalania', alive: false, hp: 0 }]))).toBe(seymour);
  });

  it('opens Isaaru’s page on the aeon on the field', () => {
    const d = doc('isaaru-via-purifico');
    const at = (id: string): number => startBlockIndex(d, fakeBoard('ffx', [{ id: 'isaaru', hp: 10 }, { id }]));
    expect(at('grothia')).toBe(headIndex(d, "Isaaru's Aeons"));
    expect(at('pterya')).toBe(fieldIndex(d, 'Pterya (aka Valefor): HP'));
    expect(at('spathi')).toBe(fieldIndex(d, 'Spathi (aka Bahamut): HP'));
  });

  it('opens the Fins and the Core link by link, the Core only once Genais has fallen', () => {
    const d = doc('sin-fins-core');
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'left-fin' }]))).toBe(headIndex(d, 'Left Fin'));
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'right-fin' }]))).toBe(headIndex(d, 'Right Fin'));
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'sinspawn-genais' }, { id: 'sin-core' }]))).toBe(headIndex(d, 'Sinspawn Genais'));
    const core = d.blocks.findIndex((b) => b.t === 'h3' && b.text === 'Sin (Core)');
    expect(core).toBeGreaterThan(headIndex(d, 'Sinspawn Genais'));
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'sinspawn-genais', alive: false, hp: 0 }, { id: 'sin-core' }]))).toBe(core);
    // and Genais's page still names the heading while the Core's part is open
    expect(headingAt(d, core)).toBe('Sinspawn Genais');
  });

  it('opens the Vegnagun chain on the link that stands', () => {
    const d = doc('ffx2-vegnagun-shuyin');
    const link = (id: string, title: string): void => {
      expect(startBlockIndex(d, fakeBoard('ffx2', [{ id }])), id).toBe(headIndex(d, title));
    };
    link('vegnagun-tail', 'Vegnagun (Tail)');
    link('vegnagun-leg', 'Vegnagun (Leg) and Node A/B/C');
    link('vegnagun-body', 'Vegnagun (Core) and Left/Right Bulwarks');
    link('vegnagun-head', 'Vegnagun (Head) and Right/Left Redoubts');
    link('shuyin', 'Shuyin');
  });

  it('opens Braska’s Final Aeon, the possessed aeons and Yu Yevon on their own parts', () => {
    const d = doc('braskas-final-aeon');
    const main = headIndex(d, "Braska's Final Aeon");
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'braskas-final-aeon' }, { id: 'yu-pagoda-left' }]))).toBe(main);
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'possessed-shiva' }]))).toBe(main);
    const yevon = d.blocks.findIndex((b) => b.t === 'p' && (b.at ?? []).includes('yu-yevon'));
    expect(yevon).toBeGreaterThan(main);
    expect(startBlockIndex(d, fakeBoard('ffx', [{ id: 'yu-yevon' }]))).toBe(yevon);
  });

  it('opens every document on a block that names the boss it was asked about', () => {
    for (const d of GUIDE_DOCS) {
      const seen = new Set<string>();
      for (const b of d.blocks) for (const token of b.at ?? []) if (!token.startsWith('-')) seen.add(anchorBoss(token));
      for (const boss of seen) {
        const at = startBlockIndex(d, fakeBoard(d.game, [{ id: boss }]));
        const tokens = d.blocks[at]!.at ?? [];
        // a bare id, or the id in a form (`yunalesca#0`), is what opened it
        expect(tokens.some((t) => !t.startsWith('-') && anchorBoss(t) === boss), `${d.id}: ${boss} opened block ${at}`).toBe(true);
      }
    }
  });
});
