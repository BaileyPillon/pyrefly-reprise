/**
 * THE AUDIO PASS ON THE AUDITION PAGE (conference demo sound pass, 2026-10-22; decision 184): Bailey judges audio by ear on `docs/audio/audition.html` (AGENTS.md rule 13), so every pick has to be playable there.
 * The review of branch audio-pass found the page could not play six of the music cues the picks tell him to judge. These checks pin: every music cue a pick names has a player on the page, every player in the
 * pass section points at a file that exists, every clip the generator lists is on the page, and the section names every pick.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DOCS_AUDIO = new URL('../../docs/audio/', import.meta.url);
const html = readFileSync(new URL('audition.html', DOCS_AUDIO), 'utf8');
const begin = html.indexOf('<!-- pass-22oct:begin');
const end = html.indexOf('<!-- pass-22oct:end -->');
const section = html.slice(begin, end);
const manifest = JSON.parse(readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8')) as { music: Record<string, unknown> };
const clips = JSON.parse(readFileSync(new URL('candidates/pass-22oct/clips.json', DOCS_AUDIO), 'utf8')) as { name: string; file: string }[];

/** The music cues the 18 picks name (PC-01 `pause`, PC-02 and PC-09 `victory-ffx`, PC-06 `boss-seymour`/`boss-challenge`, PC-12 the defeats, PC-14 the Natus cue, Chapter IV's own tracks). */
const NAMED_BY_PICKS = ['pause', 'victory-ffx', 'boss-seymour', 'boss-challenge', 'scene-gagazet', 'defeat-ffx', 'defeat-ffx2', 'boss-seymour-natus', 'boss-bahamut', 'victory-bahamut'];

describe('the audition page and the pass', () => {
  it('has the pass section', () => {
    expect(begin).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(begin);
  });

  it('plays every music cue a pick names, from the game\'s own file', () => {
    for (const cue of NAMED_BY_PICKS) {
      expect(cue in manifest.music, `${cue} is a shipped cue`).toBe(true);
      expect(html.includes(`public/audio/music/${cue}.mp3`), `${cue} has a player on the page`).toBe(true);
    }
  });

  it('points every player of the pass section at a file that exists', () => {
    const srcs = [...section.matchAll(/<audio[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]!);
    expect(srcs.length).toBeGreaterThan(50);
    for (const src of srcs) expect(existsSync(new URL(src, DOCS_AUDIO)), src).toBe(true);
  });

  it('lists every clip it made on the page (the fights, the pairs, the lines), none twice', () => {
    for (const c of clips) {
      expect(section.split(`src="${c.file}"`).length - 1, c.name).toBeGreaterThanOrEqual(1);
      expect(existsSync(new URL(c.file, DOCS_AUDIO)), c.file).toBe(true);
    }
    expect(new Set(clips.map((c) => c.name)).size).toBe(clips.length);
  });

  it('carries the rows of the picks table', () => {
    const ids = [...section.matchAll(/<tr><td>(PC-\d\d)<\/td>/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThanOrEqual(18);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
