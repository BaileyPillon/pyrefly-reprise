/**
 * The strategy guide and the move advisor are two separate entities.
 *
 * Bailey, 2026-10-03: "The guide and next move advisor are completely separate entities." The guide
 * is a document (`src/data/guides/docs/`, `src/ui/common/StrategyGuide.ts`); the advisor is
 * `src/engine/tactics/advisor*.ts` with the chapters' tactics and `intendedStrategy`. Neither reads
 * the other, in either direction, and the old NEXT line (a plan the guide used to compute from the
 * board) is gone. This is a source scan: it fails the moment an import crosses the line.
 *
 * The behavioural half of the separation is the advisor digest (`D:/Tools/pyrefly-scratch/.../advisor-digest.mjs`
 * in the handoff): every chapter played with the shipped strategy hashes the advisor's whole view
 * before and after, and the hashes must match.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const list = (rel: string, ext = '.ts'): string[] =>
  readdirSync(resolve(ROOT, rel)).filter((f) => f.endsWith(ext)).map((f) => join(rel, f).replace(/\\/g, '/'));

/** The module specifiers a source file imports (static `import ... from '...'` and `import '...'`). */
function imports(src: string): string[] {
  return [...src.matchAll(/^\s*(?:import|export)\b[^'"\n]*?(?:from\s*)?['"]([^'"]+)['"]/gm)].map((m) => m[1]!);
}

const CROSSES = /tactics|advisor|BattlePresenter|intendedStrategy|guide-line|\/guide\.ts|battle\/(?!common\/types)/;

describe('the guide reads no tactic and no advisor', () => {
  const guideSide = [
    'src/ui/common/StrategyGuide.ts',
    'src/ui/common/guideDoc.ts',
    'src/ui/common/guideDocHtml.ts',
    'src/ui/common/guideScroll.ts',
    'src/data/guides/doc-types.ts',
    ...list('src/data/guides/docs'),
  ];

  for (const rel of guideSide) {
    it(`${rel} imports nothing from the advisor side`, () => {
      const bad = imports(read(rel)).filter((spec) => CROSSES.test(spec));
      expect(bad).toEqual([]);
    });
  }

  it('the documents are plain data: they import only their own types', () => {
    for (const rel of list('src/data/guides/docs').filter((f) => !f.endsWith('index.ts'))) {
      expect(imports(read(rel)), rel).toEqual(['../doc-types.ts']);
    }
  });
});

describe('the advisor reads no document', () => {
  it('no tactic, advisor or guide-data module imports a document, its types or its lookup', () => {
    const advisorSide = [
      ...list('src/engine/tactics'),
      ...list('src/data/guides').filter((f) => !f.endsWith('doc-types.ts')),
      'src/engine/BattlePresenterStrategies.ts',
    ];
    const offenders: string[] = [];
    for (const rel of advisorSide) {
      for (const spec of imports(read(rel))) {
        if (/guides\/docs|doc-types|guideDoc|StrategyGuide/.test(spec)) offenders.push(`${rel} -> ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the move advisor panel does not import the guide panel', () => {
    for (const rel of ['src/ui/common/MoveAdvisor.ts', 'src/ui/common/advisorGuideBadge.ts', 'src/ui/common/advisorChipFollow.ts']) {
      expect(imports(read(rel)).filter((s) => /StrategyGuide|guideDoc/.test(s)), rel).toEqual([]);
    }
  });
});

describe('the computed NEXT line is gone', () => {
  it('has no line data and no line evaluator left in the tree', () => {
    for (const rel of [
      'src/data/guides/lines',
      'src/data/guides/line-types.ts',
      'src/engine/tactics/guide-line.ts',
      'src/engine/tactics/guide-line-board.ts',
    ]) {
      expect(existsSync(resolve(ROOT, rel)), `${rel} is back`).toBe(false);
    }
  });

  it('gives the panel no way to follow a decision or a held command', () => {
    const proto = StrategyGuide.prototype as unknown as Record<string, unknown>;
    expect(proto['showDecision']).toBeUndefined();
    expect(proto['clearDecision']).toBeUndefined();
    const types = read('src/data/guides/types.ts');
    expect(types).not.toMatch(/\bline\??:/);
    expect(read('src/ui/common/StrategyGuide.ts')).not.toMatch(/held\??:|buildGuideRail|GuideRailView|showDecision/);
  });
});
