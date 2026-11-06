/**
 * The hidden Penance chapter's own files carry no local path, scratch folder name or account name (FFX only; the standing rule for every committed file and shipped string: a path on the author's machine is private and
 * rots). The review of the first build found three (the handoff, twice, and the smoke script's header); this keeps them out. It reads only this chapter's files, so another lane's records are not its business.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/** The chapter's files, by folder and name pattern (a file a sparse checkout does not hold is skipped, not failed). */
function chapterFiles(): string[] {
  const out: string[] = [];
  const add = (dir: string, match: (name: string) => boolean): void => {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs)) if (match(name)) out.push(join(dir, name));
  };
  add('src/battle/ffx/ai', (n) => n.startsWith('penance'));
  add('src/data/ffx', (n) => n.startsWith('penance') || n === 'penance-ids.ts');
  add('src/data/ffx/enemies', (n) => n.startsWith('penance'));
  add('src/data/ffx/builds', (n) => n === 'penance.ts' || n === 'celestial-weapons.ts');
  add('src/data', (n) => n.includes('penance'));
  add('src/scenes', (n) => n === 'penance.ts');
  add('src/story/scripts', (n) => n === 'penance.ts');
  add('src/app/screens/frontend', (n) => n === 'judgmentDoor.ts');
  add('tools', (n) => n.startsWith('penance'));
  add('tests/unit/chapters', (n) => n.startsWith('penance') && n !== 'penance-hygiene.test.ts');
  add('tests/unit/helpers', (n) => n.startsWith('penance'));
  for (const f of ['docs/handoff/ch-penance.md', 'docs/plans/ch-penance-review.md', 'research/re-ffx-penance.md']) if (existsSync(join(ROOT, f))) out.push(f);
  return out;
}

/** A drive-letter path, the scratch folder, the machine's account folders: built from pieces so this file does not match itself. */
const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['a drive-letter path', /\b[A-Za-z]:[\\/][A-Za-z$]/],
  ['the scratch folder', new RegExp(`pyrefly-${'scratch'}`)],
  ['a sibling worktree folder', new RegExp(`pyrefly-${'rig'}-`)],
  ['the lock folder', new RegExp(`RIG-${'RECORD'}`)],
  ['an account folder', new RegExp(`${'Admin'}istrator`)],
];

describe('the Penance chapter\'s committed files', () => {
  const files = chapterFiles();

  it('there are files to read (the src and tests of the chapter are always in the tree)', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  for (const [what, pattern] of FORBIDDEN) {
    it(`none contains ${what}`, () => {
      const hits: string[] = [];
      for (const f of files) {
        const lines = readFileSync(join(ROOT, f), 'utf8').split('\n');
        lines.forEach((line, i) => {
          if (pattern.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
      }
      expect(hits).toEqual([]);
    });
  }
});
