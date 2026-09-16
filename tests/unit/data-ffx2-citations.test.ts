/**
 * Every data file cites its research section [docs/CONTRACTS.md "Data
 * agents"]. This is necessarily a heuristic (comments are not part of the
 * runtime shape), so it just checks that each file's source text contains at
 * least one research citation marker with a confidence tag, matching the
 * house style (`[verified: 2 sources]`, `[single source]`, `[estimate]`,
 * `[contradicted]`) and a research section reference (`§`).
 *
 * Files that are pure infrastructure (types, the growth-math helper, and the
 * barrel `index.ts` files, which only re-export) are exempt.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src/data/ffx2');
// vegnagun-shuyin.ts is a pure re-export barrel (its exact path is load-bearing for docs/encounters.ts);
// the real, cited data lives in the per-battle files it re-exports.
const EXEMPT_BASENAMES = new Set(['index.ts', 'types.ts', 'growth.ts', 'ids.ts', 'vegnagun-shuyin.ts']);
const CONFIDENCE_MARKERS = ['verified', 'single source', 'estimate', 'contradicted', 'derived', 'gap'];

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts') && !EXEMPT_BASENAMES.has(entry.name)) out.push(full);
  }
  return out;
}

describe('Every FFX-2 data file cites research with a confidence tag', () => {
  for (const file of collectFiles(ROOT)) {
    const relative = file.slice(ROOT.length + 1);
    it(relative, () => {
      const text = readFileSync(file, 'utf8');
      const hasSection = text.includes('§');
      const hasConfidence = CONFIDENCE_MARKERS.some((marker) => text.includes(marker));
      expect(hasSection, `${relative} has no "§" section reference`).toBe(true);
      expect(hasConfidence, `${relative} has no confidence tag`).toBe(true);
    });
  }
});
