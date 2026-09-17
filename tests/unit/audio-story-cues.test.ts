import { describe, expect, it } from 'vitest';

import { hasSfx } from '../../src/audio/sfx/index.ts';
import { hasTrack } from '../../src/audio/tracks/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

/**
 * Every sound a chapter script names must exist in the audio bank.
 *
 * `SfxKey` and `MusicKey` are plain `string`, so the compiler cannot catch a
 * bad name. A missing cue once threw inside the cutscene runner and stopped
 * every chapter's opening cutscene before its first line — found only by
 * playing the game. This walks the scripts' actual step data (pre, post and
 * every mid-battle script), not their source text.
 */

interface Found {
  chapter: string;
  where: string;
  kind: 'sfx' | 'music';
  key: string;
}

function collect(node: unknown, chapter: string, where: string, out: Found[]): void {
  if (Array.isArray(node)) {
    node.forEach((child, i) => collect(child, chapter, `${where}[${i}]`, out));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const step = node as Record<string, unknown>;
  if (step['type'] === 'sfx' && typeof step['key'] === 'string') {
    out.push({ chapter, where, kind: 'sfx', key: step['key'] });
  }
  if (step['type'] === 'music' && typeof step['track'] === 'string') {
    out.push({ chapter, where, kind: 'music', key: step['track'] });
  }
  // Branches (`if`, choice outcomes) nest further steps anywhere inside a step.
  for (const [k, v] of Object.entries(step)) {
    if (v && typeof v === 'object') collect(v, chapter, `${where}.${k}`, out);
  }
}

const found: Found[] = [];
for (const chapter of CHAPTERS) {
  const s = chapter.scriptsRef;
  collect(s.pre, chapter.id, 'pre', found);
  collect(s.post, chapter.id, 'post', found);
  collect(s.midScripts, chapter.id, 'midScripts', found);
}

describe('chapter scripts only name sounds that exist', () => {
  it('finds sound steps to check (the walk itself works)', () => {
    expect(found.filter((f) => f.kind === 'sfx').length).toBeGreaterThanOrEqual(10);
    expect(found.filter((f) => f.kind === 'music').length).toBeGreaterThan(0);
  });

  it('every sfx() key is in the SFX bank', () => {
    const missing = found.filter((f) => f.kind === 'sfx' && !hasSfx(f.key)).map((f) => `${f.chapter} ${f.where}: "${f.key}"`);
    expect(missing).toEqual([]);
  });

  it('every music() track is registered', () => {
    const missing = found.filter((f) => f.kind === 'music' && !hasTrack(f.key)).map((f) => `${f.chapter} ${f.where}: "${f.key}"`);
    expect(missing).toEqual([]);
  });

  it('every chapter music slot is registered', () => {
    const missing: string[] = [];
    for (const chapter of CHAPTERS) {
      for (const [slot, key] of Object.entries(chapter.music)) {
        if (!hasTrack(key)) missing.push(`${chapter.id} music.${slot}: "${key}"`);
      }
    }
    expect(missing).toEqual([]);
  });
});
