/**
 * `tools/deploy-classify.mjs` — the rule that decides whether a dirty working
 * tree stops a release.
 *
 * Background, because the failure mode is asymmetric and easy to "fix" the
 * wrong way. The deploy used to refuse on any porcelain output at all. The art
 * fleet writes `docs/screenshots/**`, `docs/handoff/*.md` and
 * `tools/gen/sheet-*.json` continuously, so on 2026-09-18 three green
 * preflights (tsc clean, 3060/3060 vitest) were each thrown away because a
 * screenshot landed during the test window, and the release only shipped once
 * someone reached for `--allow-dirty` — which disables the check completely.
 *
 * What each direction costs:
 *
 * - **A false "noise" verdict ships an unreproducible bundle.** The deploy log
 *   records `main=<sha>`, so a build made from a tree that does not match that
 *   sha is a lie nobody can debug later. Hence the default for anything the
 *   rules do not recognise is build-relevant, and hence the `src/` and
 *   `tools/deploy-pages.mjs` cases below.
 * - **A false "build" verdict costs a release.** That is the bug being fixed,
 *   so the fleet-noise cases are pinned just as hard.
 *
 * Nothing here runs git or touches the filesystem; the porcelain fixtures are
 * literal strings in the exact format `git status --porcelain` emits, status
 * columns included, because the parser is the part most likely to rot.
 */

import { describe, expect, it } from 'vitest';
import {
  classifyPath,
  classifyPorcelain,
  classifyPorcelainLine,
  normalizePath,
  parsePorcelainLine,
  unquoteGitPath,
} from '../../tools/deploy-classify.mjs';

/** The category for one porcelain line, for the one-liner cases below. */
function verdict(line: string): string {
  const entry = classifyPorcelainLine(line);
  expect(entry, `no entry parsed from ${JSON.stringify(line)}`).not.toBeNull();
  return entry!.category;
}

describe('deploy dirty-tree classifier', () => {
  describe('the four cases that broke the 2026-09-18 release', () => {
    it('refuses a modified src file', () => {
      expect(verdict(' M src/engine/Battle.ts')).toBe('build');
    });

    it('continues past an untracked docs screenshot', () => {
      expect(verdict('?? docs/screenshots/art/_f4-auron-caste.png')).toBe('noise');
    });

    it('continues past a modified tools/gen/sheet-*.json', () => {
      expect(verdict(' M tools/gen/sheet-pause.json')).toBe('noise');
    });

    it('refuses a modified tools/deploy-pages.mjs', () => {
      expect(verdict(' M tools/deploy-pages.mjs')).toBe('build');
    });
  });

  describe('porcelain status codes', () => {
    it('reads " M" (worktree-modified)', () => {
      const entry = classifyPorcelainLine(' M src/main.ts');
      expect(entry).toMatchObject({ code: ' M', paths: ['src/main.ts'], category: 'build' });
    });

    it('reads "??" (untracked)', () => {
      const entry = classifyPorcelainLine('?? docs/handoff/art4-party.md');
      expect(entry).toMatchObject({ code: '??', paths: ['docs/handoff/art4-party.md'] });
      expect(entry!.category).toBe('noise');
    });

    it('reads "A " (staged add)', () => {
      const entry = classifyPorcelainLine('A  src/ui/PausePanel.ts');
      expect(entry).toMatchObject({ code: 'A ', paths: ['src/ui/PausePanel.ts'] });
      expect(entry!.category).toBe('build');
    });

    it('reads "A " on a fleet path as noise', () => {
      expect(verdict('A  docs/screenshots/art/lulu.png')).toBe('noise');
    });

    it('reads "R  a -> b" and keeps both sides', () => {
      const entry = classifyPorcelainLine('R  src/engine/Old.ts -> src/engine/New.ts');
      expect(entry!.code).toBe('R ');
      expect(entry!.paths).toEqual(['src/engine/Old.ts', 'src/engine/New.ts']);
      expect(entry!.category).toBe('build');
    });

    it('refuses a rename that moves a file *out of* src/ into docs/', () => {
      // The destination is fleet noise, but src/ lost a file: the build changed.
      expect(verdict('R  src/engine/Old.ts -> docs/attic/Old.ts.txt')).toBe('build');
    });

    it('refuses a rename that moves a file *into* src/ from docs/', () => {
      expect(verdict('R  docs/attic/New.ts.txt -> src/engine/New.ts')).toBe('build');
    });

    it('treats a rename between two fleet paths as noise', () => {
      expect(verdict('RM docs/screenshots/a.png -> docs/screenshots/b.png')).toBe('noise');
    });

    it('reads the other worktree codes the same way', () => {
      expect(verdict('MM src/main.ts')).toBe('build');
      expect(verdict(' D src/engine/Battle.ts')).toBe('build');
      expect(verdict('D  tests/unit/ffx-ctb.test.ts')).toBe('build');
      expect(verdict('UU src/engine/Battle.ts')).toBe('build');
      expect(verdict(' M docs/DEV.md')).toBe('noise');
    });

    it('does not split a non-rename line on a literal " -> "', () => {
      const entry = classifyPorcelainLine('?? docs/notes/a -> b.md');
      expect(entry!.paths).toEqual(['docs/notes/a -> b.md']);
    });

    it('ignores blank lines and trailing CR', () => {
      expect(parsePorcelainLine('')).toBeNull();
      expect(parsePorcelainLine('   ')).toBeNull();
      expect(classifyPorcelainLine(' M src/main.ts\r')!.paths).toEqual(['src/main.ts']);
    });

    it('survives the first line losing its leading space', () => {
      // `capture()` in deploy-pages.mjs trims the git output, so the very
      // first line of every real run arrives as `M path` rather than ` M path`.
      // Getting this wrong would misread the path on every single deploy.
      expect(classifyPorcelainLine('M docs/DEV.md')).toMatchObject({
        paths: ['docs/DEV.md'],
        category: 'noise',
      });
      expect(classifyPorcelainLine('M src/main.ts')).toMatchObject({
        paths: ['src/main.ts'],
        category: 'build',
      });
      expect(classifyPorcelainLine('D  src/main.ts')!.paths).toEqual(['src/main.ts']);
    });

    it('reads an untracked directory, which git prints with a trailing slash', () => {
      expect(classifyPorcelainLine('?? docs/screenshots/release2-live/')).toMatchObject({
        paths: ['docs/screenshots/release2-live'],
        category: 'noise',
      });
      expect(verdict('?? src/ui/newscreen/')).toBe('build');
    });
  });

  describe('build-relevant paths', () => {
    const buildPaths = [
      'src/main.ts',
      'src/engine/ffx/Formulas.ts',
      'tests/unit/ffx-ctb.test.ts',
      'tests/e2e/battle.spec.ts',
      'index.html',
      'package.json',
      'package-lock.json',
      'vite.config.ts',
      'vitest.config.ts',
      'tsconfig.json',
      'tsconfig.node.json',
      'public/favicon.ico',
      'public/audio/readme.txt',
      'tools/deploy-pages.mjs',
      'tools/deploy-classify.mjs',
      'tools/gen/manifest.mjs',
      'tools/gen/comfy.mjs',
    ];
    for (const p of buildPaths) {
      it(`refuses ${p}`, () => {
        expect(classifyPath(p, ' M').category).toBe('build');
      });
    }

    it('refuses an unrecognised path rather than guessing', () => {
      // Safer default: a needless refusal costs one --allow-dirty, a needless
      // pass ships a bundle nobody can rebuild.
      const entry = classifyPath('README.md', ' M');
      expect(entry.category).toBe('build');
      expect(entry.rule).toMatch(/unclassified/);
    });

    it('refuses a tools/gen json that is not a sheet-*.json', () => {
      expect(classifyPath('tools/gen/cast.json', ' M').category).toBe('build');
    });

    it('refuses a sheet-*.json that is not under tools/gen', () => {
      expect(classifyPath('src/data/sheet-pause.json', ' M').category).toBe('build');
      expect(classifyPath('tools/sheet-pause.json', ' M').category).toBe('build');
    });

    it('refuses a tools/gen sheet file that is not json', () => {
      expect(classifyPath('tools/gen/sheet-cand.mjs', ' M').category).toBe('build');
    });

    it('refuses a tracked critic file outside critic/scratch', () => {
      expect(classifyPath('critic/RUBRIC.md', ' M').category).toBe('build');
    });
  });

  describe('fleet noise', () => {
    const noisePaths: Array<[string, string]> = [
      ['docs/DEV.md', ' M'],
      ['docs/handoff/art3-party-a.md', ' M'],
      ['docs/screenshots/art/auron.png', ' M'],
      ['docs/screenshots/art/_v-b-fix4-zoom-refs.png', '??'],
      ['docs/deploys.log', ' M'],
      ['critic/scratch/probe.mjs', '??'],
      ['critic/scratch/deep/dump.json', ' M'],
      ['tools/gen/sheet-cand-tmp.json', ' M'],
      ['tools/gen/sheet-art3-b4-zoom-refs.json', '??'],
      ['tools/zz-trigger-probe.tmp.mjs', ' M'],
      ['tools/zz-a.tmp.json', '??'],
      ['public/art/characters/tidus/idle.png', ' M'],
      ['public/art/portraits/lulu.png', '??'],
    ];
    for (const [p, code] of noisePaths) {
      it(`continues past ${code}${p}`, () => {
        expect(classifyPath(p, code).category).toBe('noise');
      });
    }

    it('treats an untracked critic file outside scratch as noise', () => {
      expect(classifyPath('critic/pass-7-notes.md', '??').category).toBe('noise');
    });

    it('names the rule that decided each verdict', () => {
      expect(classifyPath('docs/screenshots/x.png', '??').rule).toBe('docs/**');
      expect(classifyPath('tools/gen/sheet-x.json', ' M').rule).toBe('tools/gen/sheet-*.json');
      expect(classifyPath('public/art/x.png', ' M').rule).toBe('public/art/**');
      expect(classifyPath('tools/zz-x.tmp.mjs', ' M').rule).toBe('tools/zz-*.tmp.*');
    });

    it('prefers the noise rules over the blanket tools/ and public/ rules', () => {
      // Ordering regression guard: `tools/` and `public/` are build-relevant,
      // and these three live inside them.
      expect(classifyPath('tools/gen/sheet-pause.json', ' M').category).toBe('noise');
      expect(classifyPath('tools/zz-probe.tmp.mjs', ' M').category).toBe('noise');
      expect(classifyPath('public/art/characters/auron/cast.png', ' M').category).toBe('noise');
    });
  });

  describe('whole-tree verdicts', () => {
    it('does not block on an empty tree', () => {
      for (const empty of ['', '   ', '\n\n', null, undefined]) {
        const result = classifyPorcelain(empty as string);
        expect(result.blocked).toBe(false);
        expect(result.entries).toHaveLength(0);
      }
    });

    it('does not block on the working tree that forced --allow-dirty', () => {
      // Verbatim `git status --porcelain` from the 2026-09-18 release attempt.
      const porcelain = [
        ' M docs/handoff/art3-party-a.md',
        ' M docs/handoff/art3-party-b.md',
        ' M docs/screenshots/art/auron.png',
        ' M docs/screenshots/art/kimahri.png',
        ' M docs/screenshots/art/lulu.png',
        ' M docs/screenshots/art/rikku.png',
        ' M tools/gen/sheet-cand-tmp.json',
        '?? docs/screenshots/art/_f4-auron-caste.png',
        '?? docs/screenshots/art/_v-b-fix3b-kim-check.png',
        '?? docs/screenshots/art/_v-b-fix4-zoom-refs.png',
        '?? tools/gen/sheet-art3-b3-kim-check.json',
        '?? tools/gen/sheet-art3-b4-zoom-refs.json',
      ].join('\n');
      const result = classifyPorcelain(porcelain);
      expect(result.blocked).toBe(false);
      expect(result.buildRelevant).toHaveLength(0);
      expect(result.fleetNoise).toHaveLength(12);
    });

    it('blocks when one build-relevant path hides among the noise', () => {
      const porcelain = [
        ' M docs/screenshots/art/auron.png',
        ' M tools/gen/sheet-cand-tmp.json',
        ' M src/engine/ffx/Formulas.ts',
        '?? docs/screenshots/art/_new.png',
      ].join('\n');
      const result = classifyPorcelain(porcelain);
      expect(result.blocked).toBe(true);
      expect(result.buildRelevant.map((e) => e.paths[0])).toEqual(['src/engine/ffx/Formulas.ts']);
      expect(result.fleetNoise).toHaveLength(3);
    });

    it('keeps every line in exactly one bucket', () => {
      const porcelain = [
        ' M src/main.ts',
        '?? docs/a.png',
        'A  public/favicon.ico',
        ' M public/art/x.png',
      ].join('\n');
      const result = classifyPorcelain(porcelain);
      expect(result.entries).toHaveLength(4);
      expect(result.buildRelevant.length + result.fleetNoise.length).toBe(result.entries.length);
      expect(result.entries.every((e) => e.raw.length > 0 && e.rule.length > 0)).toBe(true);
    });
  });

  describe('path normalisation', () => {
    it('unquotes git core.quotePath escaping', () => {
      expect(unquoteGitPath('"docs/caf\\303\\251.png"')).toBe('docs/café.png');
      expect(unquoteGitPath('"src/a\\"b.ts"')).toBe('src/a"b.ts');
      expect(unquoteGitPath('src/plain.ts')).toBe('src/plain.ts');
    });

    it('classifies a quoted path by its decoded name', () => {
      expect(verdict(' M "docs/screenshots/caf\\303\\251.png"')).toBe('noise');
      expect(verdict(' M "src/caf\\303\\251.ts"')).toBe('build');
    });

    it('accepts a quoted path with a space', () => {
      const entry = classifyPorcelainLine('?? "docs/screenshots/auron cast.png"');
      expect(entry!.paths).toEqual(['docs/screenshots/auron cast.png']);
      expect(entry!.category).toBe('noise');
    });

    it('accepts an unquoted path with a space', () => {
      const entry = classifyPorcelainLine('?? docs/screenshots/auron cast.png');
      expect(entry!.paths).toEqual(['docs/screenshots/auron cast.png']);
      expect(entry!.category).toBe('noise');
    });

    it('normalises separators and ./ prefixes', () => {
      expect(normalizePath('.\\src\\main.ts')).toBe('src/main.ts');
      expect(normalizePath('./docs/a.png')).toBe('docs/a.png');
      expect(normalizePath('docs/')).toBe('docs');
      expect(classifyPath('src\\engine\\Battle.ts', ' M').category).toBe('build');
    });

    it('does not let a prefix collision leak (docsy/ is not docs/)', () => {
      expect(classifyPath('docsy/a.png', '??').category).toBe('build');
      expect(classifyPath('public/artwork/a.png', ' M').category).toBe('build');
      expect(classifyPath('sources/main.ts', ' M').category).toBe('build');
    });
  });
});
