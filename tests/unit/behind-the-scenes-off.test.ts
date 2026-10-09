// @vitest-environment node
/**
 * BEHIND THE SCENES is built and SWITCHED OFF (Bailey, 2026-10-08: "I need to approve of it before it is public facing and is
 * actually included in the game"; "built SWITCHED OFF: an off-by-default constant (the pattern of ONBOARDING_LIVE /
 * TITLE_CAST_ON). When off, the entry, its key and its page are ABSENT from the markup, and a unit test pins the constant
 * false until Bailey approves. Nothing about it may be reachable in a public build.")
 *
 * THIS FILE IS THE PIN. `BTS_LIVE` must be `false` here. The day Bailey approves the finished page, the commit that flips
 * `src/app/changelog/behindTheScenes.ts` flips the first test below with it, on purpose, and brings the credits' headings
 * test (`tests/unit/credits-attribution.test.ts`) along, because the AI tools join the credits at the same moment.
 *
 * What is proved here, with the switch off:
 *  - the constant is false and is the ONLY switch (no URL parameter, no setting, no debug call turns it on);
 *  - the title's markup has no BEHIND THE SCENES entry, action, key or words (the entry on its own is still tested);
 *  - the page's code is reached from one place only, a dynamic import behind a define set from the constant;
 *  - the credits are exactly what they were (the AI tools group is prepared, not shown);
 *  - the pictures in `public/bts/` are pruned from every build, and the deploy would refuse one that kept them;
 *  - and the strongest proof: the title's real module graph is BUNDLED in memory the way the build does it, with the repo's
 *    own defines. With the switch off the bundle holds none of the page's words and no chunk for it; the same bundle with
 *    the switch swapped on does hold them (the control that shows this method can see the page at all).
 *
 * Game case: both (the page is about the whole project; the title is the front door of FFX and FFX-2 alike).
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { build } from 'vite';
import { afterAll, describe, expect, it } from 'vitest';

import { BTS_KEY, BTS_KEY_LABEL, BTS_LIVE, BTS_TITLE } from '../../src/app/changelog/behindTheScenes.ts';
import { AI_TOOLS_GROUP, CREDIT_GROUPS, creditGroups } from '../../src/app/credits/creditsData.ts';
import { BTS_ACTION, btsEntryHtml, changelogEntryHtml, infoEntriesHtml } from '../../src/app/screens/frontend/titleInfoHtml.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';
import { findUnshipped, isUnshippedPublicFile, pruneUnshipped } from '../../tools/dist-filter.mjs';
import { IMAGE_FILES } from '../../src/app/behindTheScenes/content.ts';
import { MADE_WITH } from '../../src/app/behindTheScenes/facts.ts';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(REPO, rel), 'utf8');
const slash = (p: string): string => p.split('\\').join('/');

describe('the switch', () => {
  it('is OFF until Bailey approves the finished page (flip this on purpose, in the commit that records his yes)', () => {
    expect(BTS_LIVE).toBe(false);
  });

  it('is one constant in one file, a literal false, and nothing else in the source can turn it on', () => {
    const src = read('src/app/changelog/behindTheScenes.ts');
    expect(src).toMatch(/^export const BTS_LIVE = false;$/m);
    // no setter, no `let`, no URL parameter, no storage, no debug hook anywhere near it
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/\blet\b|\bfunction\b|location|localStorage|URLSearchParams|__pyrefly|window|document/);
    // nothing in src reads it from a place a player controls
    for (const file of walk(resolve(REPO, 'src'))) {
      const rel = slash(relative(REPO, file));
      if (rel === 'src/app/changelog/behindTheScenes.ts') continue; // the switch itself
      const text = stripComments(readFileSync(file, 'utf8'));
      if (!/BTS_LIVE|__PYREFLY_BTS__/.test(text)) continue;
      expect(text, slash(relative(REPO, file))).not.toMatch(/(?:location\.search|localStorage|URLSearchParams)[^;\n]*BTS|BTS[^;\n]*(?:location\.search|localStorage|URLSearchParams)/);
      expect(text, slash(relative(REPO, file))).not.toMatch(/(?:window|globalThis)\s*(?:\.|\[)[^;\n]*BTS_LIVE|BTS_LIVE\s*=[^=]/);
    }
  }, 60_000);

  it('names the page Behind the Scenes (Bailey, 2026-10-09: "Scenes not screens") in one constant, and the key is one letter', () => {
    expect(BTS_TITLE).toBe('Behind the Scenes');
    expect(BTS_TITLE).not.toMatch(/screens/i);
    expect(BTS_KEY).toBe('KeyT');
    expect(BTS_KEY_LABEL).toBe('T');
  });

  it('is the source of the build define, so a build and the source constant cannot disagree', async () => {
    const mod = (await import('../../vite.config.ts')) as { default: (env: { command: string; mode: string }) => { define: Record<string, string> } };
    const define = mod.default({ command: 'build', mode: 'production' }).define;
    expect(define['__PYREFLY_BTS__']).toBe(JSON.stringify(BTS_LIVE));
    expect(define['__PYREFLY_BTS__']).toBe('false');
  });
});

describe('the title\u2019s markup with the switch off', () => {
  it('has no BEHIND THE SCENES entry, action, key letter or words anywhere in it', () => {
    for (const art of ['farplane', 'echo'] as const) {
      for (const briefingChip of [true, false]) {
        const html = titleMarkup({ briefingChip, art, build: { release: '39.4.2', sha: 'a021787a' } });
        expect(html, `${art}/${briefingChip}`).not.toContain(BTS_ACTION);
        expect(html).not.toMatch(/behind the scenes|behind the screens|title:bts|data-action="title:bts"|>\s*T\s*<\/b>/i);
        expect(html).toContain('data-action="title:changelog"');
      }
    }
  });

  it('draws the hairline and CHANGELOG only: the row\u2019s entries are exactly the changelog\u2019s', () => {
    expect(infoEntriesHtml()).toBe(changelogEntryHtml());
    expect(infoEntriesHtml()).not.toContain('bts');
  });

  it('still has the entry ready on its own, so what the switch will add is tested without turning it on', () => {
    const html = btsEntryHtml();
    expect(html).toContain('data-action="title:bts"');
    expect(html).toContain('role="button"');
    expect(html).toMatch(/<b>T<\/b> Behind the Scenes</);
    expect(BTS_ACTION).toBe('title:bts');
  });
});

describe('the page is reached from one place only', () => {
  it('has one dynamic import in the title\u2019s sources, in titleInfo.ts, guarded by a define built from the constant', () => {
    const importers: string[] = [];
    for (const file of walk(resolve(REPO, 'src'))) {
      const rel = slash(relative(REPO, file));
      if (rel.startsWith('src/app/behindTheScenes/') || !rel.endsWith('.ts')) continue;
      const text = stripComments(readFileSync(file, 'utf8'));
      if (!text.includes('behindTheScenes/')) continue;
      for (const m of text.matchAll(/from\s+['"][^'"\n]*behindTheScenes\/[^'"\n]*['"]/g)) {
        // only a type may be imported statically (a type import is erased: it makes no edge in the build's graph)
        const start = Math.max(text.lastIndexOf('import', m.index), text.lastIndexOf('export', m.index));
        expect(text.slice(start, start + 12), `${rel}: ${m[0]}`).toBe('import type ');
        importers.push(rel);
      }
      for (const m of text.matchAll(/(?<!typeof\s)import\(\s*['"][^'"\n]*behindTheScenes\/[^'"\n]*['"]\s*\)/g)) importers.push(`${rel} (dynamic: ${m[0].length})`);
    }
    expect(importers.map((i) => i.replace(/ \(dynamic: \d+\)$/, ' (dynamic)')).sort()).toEqual(['src/app/screens/frontend/titleInfo.ts', 'src/app/screens/frontend/titleInfo.ts (dynamic)']);
    const info = read('src/app/screens/frontend/titleInfo.ts');
    expect(info).toMatch(/const btsBuilt: boolean = typeof __PYREFLY_BTS__ === 'undefined' \? BTS_LIVE : __PYREFLY_BTS__;/);
    expect(info).toMatch(/else if \(btsBuilt\) \{[\s\S]*?import\('\.\.\/\.\.\/behindTheScenes\/index\.ts'\)/);
  }, 60_000);

  it('keeps the page\u2019s pictures out of the source: they are plain files in public/bts/, never imported', () => {
    for (const file of walk(resolve(REPO, 'src/app/behindTheScenes'))) {
      const text = readFileSync(file, 'utf8');
      expect(text, slash(relative(REPO, file))).not.toMatch(/import\s[^;]*['"][^'"]*\.(?:jpg|jpeg|png|webp|svg|gif)(?:\?[^'"]*)?['"]/);
      expect(text, slash(relative(REPO, file))).not.toMatch(/import\s[^;]*\.css['"]/); // the sheets come in as text (?inline), never as a <link> the build would emit
    }
    expect(read('src/app/behindTheScenes/styles.ts')).toMatch(/behind-the-scenes\.css\?inline/);
    expect(read('src/app/behindTheScenes/styles.ts')).toMatch(/behind-the-scenes-story\.css\?inline/);
  });
});

describe('the credits with the switch off', () => {
  it('are the four groups of the approved frames, exactly, and name none of the AI tools', () => {
    expect(CREDIT_GROUPS.map((g) => g.id)).toEqual(['music', 'sfx', 'type', 'art']);
    expect(CREDIT_GROUPS.map((g) => g.heading)).toEqual(['Music', 'Sound effects', 'Type', 'Art and tools']);
    const text = JSON.stringify(CREDIT_GROUPS);
    for (const word of ['ElevenLabs', 'ChatGPT', 'OpenAI', 'AI-generated', 'Claude', 'Made with AI tools']) expect(text, word).not.toContain(word);
    expect(CREDIT_GROUPS).toBe(creditGroups(false));
  });

  it('have the AI tools prepared behind the same constant: ElevenLabs Music and voices, ChatGPT Images, ComfyUI and Animagine, Claude', () => {
    const on = creditGroups(true);
    expect(on.map((g) => g.id)).toEqual(['music', 'sfx', 'type', 'art', 'ai']);
    expect(on.slice(0, 4)).toEqual(CREDIT_GROUPS);
    expect(on[4]).toBe(AI_TOOLS_GROUP);
    expect(AI_TOOLS_GROUP.heading).toBe('Made with AI tools');
    const titles = AI_TOOLS_GROUP.entries.map((e) => e.title);
    for (const wanted of ['ElevenLabs Music and ElevenLabs voices', 'ChatGPT Images', 'ComfyUI with Animagine XL 4.0', 'Claude']) expect(titles).toContain(wanted);
    // the page's "Made with" line and the credits name the same tools, so they cannot say two things
    for (const m of MADE_WITH.filter((t) => !/Three\.js/.test(t.name))) expect(titles, m.name).toContain(m.name);
    for (const e of AI_TOOLS_GROUP.entries) {
      expect(e.by.length).toBeGreaterThan(0);
      expect(e.licence).toMatch(/^AI-/);
      expect(e.note?.length ?? 0).toBeGreaterThan(10);
    }
  });
});

describe('the pictures: pruned from every build while the switch is off', () => {
  it('has a rule for bts/ in tools/dist-filter.mjs, and the sixteen pictures are on disk in public/bts/', () => {
    expect(isUnshippedPublicFile('bts/dir-a.jpg')).toBe(true);
    expect(isUnshippedPublicFile('bts')).toBe(true);
    expect(isUnshippedPublicFile('bts/sub/x.png')).toBe(true);
    expect(isUnshippedPublicFile('art/title/keyart.png')).toBe(false);
    expect(isUnshippedPublicFile('audio/candidates/x.mp3')).toBe(true);
    expect(isUnshippedPublicFile('btsx/y.jpg')).toBe(false);
    const files = readdirSync(resolve(REPO, 'public/bts')).sort();
    expect(files).toEqual([...IMAGE_FILES].sort());
    expect(files).toHaveLength(16);
  });

  const made: string[] = [];
  afterAll(() => {
    for (const d of made) rmSync(d, { recursive: true, force: true });
  });

  it('finds and removes bts/ from a build folder, and the folder with it; the deploy\u2019s check would see a leftover', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pyrefly-btsprune-'));
    made.push(dir);
    mkdirSync(join(dir, 'bts'), { recursive: true });
    mkdirSync(join(dir, 'art'), { recursive: true });
    writeFileSync(join(dir, 'bts', 'dir-a.jpg'), 'x');
    writeFileSync(join(dir, 'art', 'keep.png'), 'x');
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    expect(findUnshipped(dir)).toEqual(['bts/dir-a.jpg']);
    expect(pruneUnshipped(dir)).toEqual(['bts/dir-a.jpg']);
    expect(findUnshipped(dir)).toEqual([]);
    expect(() => statSync(join(dir, 'bts'))).toThrow();
    expect(statSync(join(dir, 'art', 'keep.png')).isFile()).toBe(true);
    expect(read('tools/deploy-pages.mjs')).toMatch(/const unshipped = findUnshipped\(DIST\);\r?\n\s*if \(unshipped\.length\) fail\(/);
  });
});

describe('the bundle (the real graph, in memory, with the repo\u2019s own defines)', () => {
  const ENTRY = `
import { TitleScreen } from '${slash(REPO)}/src/app/screens/TitleScreen.ts';
import { titleMarkup } from '${slash(REPO)}/src/app/screens/frontend/titleMarkup.ts';
import { CREDIT_GROUPS } from '${slash(REPO)}/src/app/credits/creditsData.ts';
console.log(TitleScreen, titleMarkup({ briefingChip: true }), CREDIT_GROUPS);
`;
  /** Strings that exist only in the page, its entry and its credits (the page's words, its classes, its picture folder, its action). */
  const SENTINELS = ['Behind the Scenes', 'title:bts', 'Made with AI tools', 'ElevenLabs Music and ElevenLabs voices', 'bts__', 'keyart-farplane.jpg', 'In two minutes', 'Numbers with a source', 'measured from the real game'];

  async function bundle(on: boolean): Promise<{ files: string[]; text: string }> {
    const config = ((await import('../../vite.config.ts')) as { default: (env: { command: string; mode: string }) => { define: Record<string, string> } }).default({ command: 'build', mode: 'production' });
    const result = await build({
      root: REPO,
      configFile: false,
      logLevel: 'error',
      base: '/',
      publicDir: false,
      define: on ? { ...config.define, __PYREFLY_BTS__: 'true' } : config.define,
      plugins: [
        {
          name: 'bts-proof-entry',
          enforce: 'pre' as const,
          resolveId(id: string) {
            if (id === 'virtual:entry') return '\0virtual:entry';
            if (on && /changelog\/behindTheScenes\.ts$/.test(id)) return '\0bts-on';
            return null;
          },
          load(id: string) {
            if (id === '\0virtual:entry') return ENTRY;
            if (id === '\0bts-on') return "export const BTS_LIVE = true; export const BTS_TITLE = 'Behind the Scenes'; export const BTS_KEY = 'KeyT'; export const BTS_KEY_LABEL = 'T';";
            return null;
          },
        },
      ],
      build: { write: false, minify: true, copyPublicDir: false, target: 'es2022', rollupOptions: { input: 'virtual:entry' } },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => ('output' in r ? r.output : []));
    const text = outputs.map((o) => (o.type === 'chunk' ? o.code : typeof o.source === 'string' ? o.source : '')).join('\n');
    return { files: outputs.map((o) => o.fileName), text };
  }

  it('with the switch OFF holds none of the page: no chunk for it, none of its words, its sheets, its pictures\u2019 folder or its action', async () => {
    const { files, text } = await bundle(false);
    expect(files.filter((f) => /behindTheScenes/i.test(f)), files.join(', ')).toEqual([]);
    expect(files.filter((f) => f.endsWith('.js') && !/worker/.test(f))).toHaveLength(1);
    const found = SENTINELS.filter((s) => text.includes(s));
    expect(found).toEqual([]);
    // the title's own words are there, so the bundle is the real one and not an empty one
    expect(text).toContain('title:changelog');
    expect(text).toContain('Latest releases');
  }, 180_000);

  it('CONTROL: with the switch swapped ON the same bundle holds the page, its chunk and its credits (so the check above can see it)', async () => {
    const { files, text } = await bundle(true);
    expect(files.some((f) => /behindTheScenes/i.test(f)), files.join(', ')).toBe(true);
    const found = SENTINELS.filter((s) => text.includes(s));
    expect(found).toEqual(SENTINELS);
  }, 180_000);
});

/** The code of a source file with its block and line comments taken out (a comment may say BTS_LIVE = false; code may not). */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|css)$/.test(name)) out.push(p);
  }
  return out;
}
