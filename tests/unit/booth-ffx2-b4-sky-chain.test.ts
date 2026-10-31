/**
 * THE CHAINED CHAPTERS OF THE FARPLANE'S TWO PLATES (release 71, branch `booth-ffx2-b4-sky`; FFX-2 only; Chapter V chains FIVE links, Chapter XI THREE). The real chains (real engines, presenter and chain loop, a recording staging port: no ending cue
 * before the last link, one freeze, one title, the HUD in at every link's start) are walked by `booth-b2-cross-lane.test.ts` (`CHAINS`) and the beats by `booth-ffx2-b2-chain.test.ts`; both gate each chapter on the treated list (`itIf`), so while the
 * two chapters were off it those cases skipped, and with them back on the list they run again with no edit. This file pins that they DO run (a case that silently skipped would be a green test that read nothing), what each chapter's chain is
 * (rule 14, from the registry), the ribbon's boss in every link, and the layering of the measuring word (the look is presentation: nothing of `src/battle` or the presenter imports it).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { PIECE_HOLDS, isTreatedChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { isListed, playsPiece } from './booth-r70-withdrawn.ts';

const CHAINS = [
  { id: 'ffx2-vegnagun-shuyin', links: 5 },
  { id: 'ffx2-fallen-aeons', links: 3 },
] as const;

describe('the chains of the two chapters run (they are not skipped) and are the chains the registry says', () => {
  it('both chapters are on the list, so every case the lanes gated with `itIf` runs; a hold-gated case (`itPlays`) runs only for a piece the chapter does not hold', () => {
    for (const { id } of CHAINS) expect(isListed(id), id).toBe(true); // `itIf(id)` is vitest's `it` for a listed chapter
    expect(playsPiece('ffx2-vegnagun-shuyin', 'cam')).toBe(false); // the colossus camera is held
    expect(playsPiece('ffx2-fallen-aeons', 'cam')).toBe(false); // the follower is held
    expect(playsPiece('ffx2-fallen-aeons', 'ending')).toBe(true); // the ending plays: the quiet title and the one freeze
    expect(playsPiece('ffx2-vegnagun-shuyin', 'hd2d')).toBe(false); // the look is held
    expect(playsPiece('yojimbo-cavern', 'ending')).toBe(false); // a chapter still off the list runs nothing
  });

  it('the two lane files name both chapters in their chain tables (a chapter that left either table would stop being walked)', () => {
    const cross = readFileSync(resolve('tests/unit/booth-b2-cross-lane.test.ts'), 'utf8');
    const beats = readFileSync(resolve('tests/unit/booth-ffx2-b2-chain.test.ts'), 'utf8');
    for (const { id, links } of CHAINS) {
      expect(cross, id).toMatch(new RegExp(`\\{ id: '${id}', links: ${links} \\}`));
      expect(beats, id).toMatch(new RegExp(`\\{ id: '${id}', links: ${links}, kind: '(hold|pose)' \\}`));
    }
  });

  it('the shared matrices read the list from the source, so both chapters are in them with no edit: the off words, the switches, the KO rule and the holds', () => {
    for (const f of ['booth-b2-off-words', 'booth-treated-switches', 'engine/booth-b2-ko-rule']) {
      const src = readFileSync(resolve(`tests/unit/${f}.test.ts`), 'utf8');
      expect(src, f).toMatch(/Object\.keys\(TREATED_CHAPTERS\)/);
    }
    const holds = readFileSync(resolve('tests/unit/booth-treated-chapters.test.ts'), 'utf8');
    expect(holds).toMatch(/'ffx2-vegnagun-shuyin': \['hd2d', 'arena', 'cam', 'breath', 'moments'\]/);
    expect(holds).toMatch(/'ffx2-fallen-aeons': \['hd2d', 'arena', 'cam', 'breath', 'moments'\]/);
  });

  it.each(CHAINS)('$id: FFX-2, $links links, every link a foe of its own formation (the ribbon names one boss per link)', async ({ id, links }) => {
    setTreatedScope('all');
    try {
      const chapter = getChapter(id)!;
      expect(chapter.game).toBe('ffx2');
      expect(isTreatedChapter(id)).toBe(true);
      let n = 1;
      let g = chapter.enemyGroupRef;
      while (g.nextGroupId !== undefined) {
        g = (await findEnemyGroup(g.nextGroupId))!;
        n++;
      }
      expect(n).toBe(links);
    } finally {
      setTreatedScope(null);
    }
  });

  it("the chain's HUD and title are the staging's, which both chapters play (`card`, `ending`, `opening`); only the staged breath is held, so the freeze of Shuyin's last blow and Shiva's seam are read by the browser gates", () => {
    for (const { id } of CHAINS) {
      expect(Object.keys(PIECE_HOLDS[id]!), id).toContain('breath');
      expect(Object.keys(PIECE_HOLDS[id]!), id).not.toContain('ending');
      expect(Object.keys(PIECE_HOLDS[id]!), id).not.toContain('card');
      expect(Object.keys(PIECE_HOLDS[id]!), id).not.toContain('opening');
    }
  });
});

describe('layering (hard rule 1): the measuring word is presentation and no battle code imports it', () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (p.endsWith('.ts')) out.push(p);
    }
    return out;
  }
  it('`SkyGrade.ts` imports no DOM and no `three`; nothing under `src/battle` and no presenter file imports it; it is imported by the look modules and the debug API only', () => {
    const own = readFileSync(resolve('src/engine/look/pro/SkyGrade.ts'), 'utf8');
    expect(own).not.toMatch(/from 'three'/);
    expect(own).not.toMatch(/document\.|window\./);
    const importers = walk(resolve('src'))
      .filter((f) => /SkyGrade\.ts'/.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(/\\/g, '/').replace(/^.*\/src\//, 'src/'))
      .sort();
    expect(importers).toEqual(['src/debug/proApi.ts', 'src/engine/look/LookConfig.ts', 'src/engine/look/LookState.ts', 'src/engine/look/pro/ProGrade.ts', 'src/engine/look/pro/ProSwitch.ts']);
    for (const f of importers) {
      expect(f.startsWith('src/battle/'), f).toBe(false);
      expect(/BattlePresenter/.test(f), f).toBe(false);
    }
  });

  it('`SkyGrade.ts` is under the 400-line house limit, and so is every source file this branch changed', () => {
    for (const f of ['src/engine/look/pro/SkyGrade.ts', 'src/engine/look/pro/ProGrade.ts', 'src/engine/look/LookConfig.ts', 'src/engine/look/LookState.ts', 'src/engine/look/pro/ProSwitch.ts', 'src/engine/motion/DemoGate.ts', 'src/engine/motion/PieceHolds.ts', 'src/debug/proApi.ts']) {
      expect(readFileSync(resolve(f), 'utf8').split('\n').length, f).toBeLessThanOrEqual(400);
    }
  });
});
