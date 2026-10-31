/**
 * THE REVIEW FIXES OF BATCH 3 (release 71, branch `booth-ffx2-b3`; FFX-2 only for Chapter XIII; the file-size rule is both). The adversarial review of this branch (`REVIEW.md` in the lane's scratch folder, no critical and no major finding, thirteen minors m1 to m13) is answered
 * in `docs/handoff/booth-ffx2-b3.md` section 13. The numbers and the behaviour the minors touched are pinned where they live (`booth-ffx2-b3-follower`: m10 and m13; `-seam`: m2; `-chain`: m7; `-rows`: m5; `booth-b2-off-words`: m6); what is pinned HERE is what has no other home:
 * the size claim (m1), the words of the documents and comments the review found wrong (m2, m3, m4, m13) and that every finding has a row in the findings table.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string): string => readFileSync(resolve(file), 'utf8');
const lines = (file: string): number => read(file).split('\n').length - (read(file).endsWith('\n') ? 1 : 0);

/** Every source file the branch changed, and every test file it added or edited for the chapter. */
const SOURCES = [
  'src/engine/look/LookBoldConfig.ts',
  'src/engine/look/LookConfig.ts',
  'src/engine/look/LookGrades.ts',
  'src/engine/look/LookGradesBold.ts',
  'src/engine/look/pro/ProGrade.ts',
  'src/engine/look/pro/RimFigures.ts',
  'src/engine/motion/DemoGate.ts',
  'src/engine/procam/ProAutoStage.ts',
] as const;
const TESTS = [...readdirSync(resolve('tests/unit')).filter((f) => /^booth-ffx2-b3-.*\.test\.ts$/.test(f)).map((f) => `tests/unit/${f}`), 'tests/unit/helpers/weakChain.ts'];

describe('m1: every file the branch changed or added is under 400 lines (house rule 7), the rows file included', () => {
  it.each([...SOURCES, ...TESTS])('%s', (file) => {
    expect(lines(file), file).toBeLessThan(400);
  });

  it('the lane has the six test files the handoff names (rows, follower, chain, seam, wiring, review-fixes)', () => {
    expect(TESTS.map((f) => f.replace('tests/unit/', '')).sort()).toEqual(
      ['booth-ffx2-b3-chain.test.ts', 'booth-ffx2-b3-follower.test.ts', 'booth-ffx2-b3-review-fixes.test.ts', 'booth-ffx2-b3-rows.test.ts', 'booth-ffx2-b3-seam.test.ts', 'booth-ffx2-b3-wiring.test.ts', 'helpers/weakChain.ts'].sort(),
    );
  });
});

describe('m2: the kill-link stand-down is described for all four candidates, not as a deterministic 2.18 (comment, handoff, preflight, seam test)', () => {
  it('the SCRIPTED_RIGS comment names candidate 3 and the one-fight-in-four, and no longer says the follower never starts the beat', () => {
    const src = read('src/engine/procam/ProAutoStage.ts');
    expect(src).toMatch(/depends on WHICH candidate/);
    expect(src).toMatch(/candidate 3 comes to 0\.52/);
    expect(src).toMatch(/one fight in four/);
    expect(src).not.toMatch(/comes no nearer to it than 2\.18/);
  });

  it('the seam test header and the handoff say the same', () => {
    expect(read('tests/unit/booth-ffx2-b3-seam.test.ts')).toMatch(/depends on WHICH of its four candidates/);
    const note = read('docs/handoff/booth-ffx2-b3.md');
    expect(note).toMatch(/candidate 3 does: 0\.52 \(480 of 480 frames within 1\.2\) on today's rig and 1\.08 \(352 of 480\)/);
    expect(note).not.toMatch(/comes \*\*no nearer than 2\.18\*\*/);
    expect(read('docs/plans/booth-ffx2-b3-review.md')).toMatch(/candidate 3 only/);
  });
});

describe('m3: the wiring test header says the camera IS held', () => {
  it('no "NOT held" sentence is left; the three holds are named', () => {
    const head = read('tests/unit/booth-ffx2-b3-wiring.test.ts').slice(0, 1800);
    expect(head).not.toMatch(/NOT held/);
    expect(head).toMatch(/The three holds: the directed camera/);
  });
});

describe('m4 and m13: the Chapter XIII row of docs/DEV.md', () => {
  const row = read('docs/DEV.md')
    .split('\n')
    .find((l) => l.startsWith('| **Chapter XIII in the treated list**'))!;

  it('exists, takes "the chapter" back under ?treated=pack (Trema is a man), and says three dresses have no clip row', () => {
    expect(row).toBeDefined();
    expect(row).toMatch(/`\?treated=pack` takes the chapter back to release 68's frame/);
    expect(row).not.toMatch(/takes her back/);
    expect(row).toMatch(/so the three dresses no clip row covers play the house curves/);
  });

  it('carries the corrected crop (2.4 times; 45 and 72 px against 19 and 30), "in any dress", and the two cap regimes', () => {
    expect(row).toMatch(/2\.4 times what the approved frame costs \(45 and 72 px against 19 and 30\)/);
    expect(row).toMatch(/no girl is ever cropped, in any dress/);
    expect(row).not.toMatch(/three times/);
    expect(row).toMatch(/120 px floor in link 1 and half the drawn height in link 2/);
  });
});

describe('the handoff answers every finding of the review and carries the corrected job specs', () => {
  const note = read('docs/handoff/booth-ffx2-b3.md');
  const section = note.slice(note.indexOf('## 13. Review fixes'));

  it('section 13 has a row for each of m1 to m13', () => {
    expect(note).toMatch(/^## 13\. Review fixes/m);
    for (let i = 1; i <= 13; i++) expect(section, `m${i}`).toMatch(new RegExp(`^\\| m${i} \\|`, 'm'));
  });

  it('the job specs: J2 predicts 45 and 72 px; J2b, J3b, J7b and J15 exist', () => {
    expect(note).toMatch(/\*\*Paragon's cast head past the top edge by 45 px \(1600x900\) and 72 px \(2560x1440\)\*\*/);
    for (const j of ['J2b', 'J3b', 'J7b', 'J15']) expect(note, j).toMatch(new RegExp(`^- \\*\\*${j}[ ,(]`, 'm'));
    expect(note).not.toMatch(/\*\*Paragon's cast head past the top edge by 56 px/);
  });

  it('the test counts and the size claim in section 9 are the true ones (the rows file is no longer "386")', () => {
    expect(note).not.toMatch(/`booth-ffx2-b3-rows\.test\.ts` 386/);
    expect(note).toMatch(/every file changed or added is under 400/);
  });
});
