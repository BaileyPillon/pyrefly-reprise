/**
 * THE PRESS PAGE (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b "Mixed read": the press page leads with the game, option B "Dossier"; both games; `public/press/index.html`).
 *
 * Claims: it is a route on the site that needs no router (a folder with an index.html, which the Workers static-assets site serves) and works under either base (every address in it is relative, but the GitHub link
 * and the page's own canonical and picture meta); its link rows are the ones the brief names (play, trailer when it exists, screenshots, fact sheet, credits and legal, source); its frames are real, web size and
 * under 300 KB; its credit lines and its fan-work notice are the game's own (`creditsData.ts`, nothing made up for it); it carries no email address, phone number or mail link; every word is at least 1rem (28 px
 * in a 2560 x 1440 window) and the root size is 28 px at that width; it respects REDUCE MOTION; the trailer row is hidden until `press.json` names a trailer that is on the site.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BTS_LIVE } from '../../src/app/changelog/behindTheScenes.ts';
import { CREDIT_GROUPS, FAN_NOTICE, LICENCE_LINKS, creditGroups } from '../../src/app/credits/creditsData.ts';

const DIR = resolve('public/press');
const html = readFileSync(resolve(DIR, 'index.html'), 'utf8');
/** The page without its comments and its style block, for the checks that read the markup. */
const markup = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/, '');
const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
const decode = (s: string): string => s.replace(/&middot;/g, '·').replace(/&amp;/g, '&');

describe('the press page: the route', () => {
  it('is a folder with an index.html, which is all a route is on this site', () => {
    expect(existsSync(resolve(DIR, 'index.html'))).toBe(true);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<title>Echoes of Spira, Press Kit</title>');
  });

  it('names no address that starts at the server root, so it works at the root and under the old GitHub folder', () => {
    const urls = [...markup.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(20);
    for (const u of urls) {
      expect(u.startsWith('/')).toBe(false);
      if (/^https?:/.test(u)) expect(['https://github.com/BaileyPillon/pyrefly-reprise', 'https://echoesofspira.com/press/']).toContain(u); // the source, and the page's own canonical address
    }
    expect(style).not.toMatch(/url\(\s*['"]?\//);
    expect(style).toContain("url('../fonts/");
  });

  it('is not in the pruned set: nothing in tools/dist-filter.mjs holds it back from a build', () => {
    const filter = readFileSync(resolve('tools/dist-filter.mjs'), 'utf8');
    expect(filter).not.toMatch(/press/);
  });
});

describe('the press page: the link rows', () => {
  const rows = [...markup.matchAll(/data-row="([a-z]+)"/g)].map((m) => m[1]);
  it('are play, trailer, screenshots, fact sheet, credits and legal, and the source, in that order', () => {
    expect(rows).toEqual(['play', 'trailer', 'screens', 'facts', 'credits', 'source']);
  });

  it('play and the sections point at the game and at their own sections', () => {
    expect(markup).toMatch(/<a class="primary" href="\.\.\/" data-row="play">/);
    for (const id of ['screens', 'facts', 'credits']) expect(markup).toContain(`id="${id}"`);
    for (const id of ['screens', 'facts', 'credits']) expect(markup).toContain(`href="#${id}"`);
  });

  it('keeps the trailer row hidden until press.json names a trailer, and never asks for a file that is not there', () => {
    expect(markup).toMatch(/<li id="row-trailer" hidden>/);
    const press = JSON.parse(readFileSync(resolve(DIR, 'press.json'), 'utf8')) as { trailer: null | { file: string; length?: string } };
    if (press.trailer) expect(existsSync(resolve(DIR, press.trailer.file))).toBe(true);
    expect(html).toContain("fetch('press.json')");
    expect(html).not.toMatch(/fetch\('trailer/);
  });
});

describe('the press page: the frames', () => {
  const frames = [...new Set([...markup.matchAll(/(?:src|href)="(frames\/[^"]+)"/g)].map((m) => m[1]!))];
  it('are real files, JPEG, and each under 300 KB', () => {
    expect(frames.length).toBeGreaterThanOrEqual(8);
    for (const f of frames) {
      const path = resolve(DIR, f);
      expect(existsSync(path), f).toBe(true);
      expect(f).toMatch(/\.jpg$/);
      expect(statSync(path).size, f).toBeLessThanOrEqual(300 * 1024);
      const head = readFileSync(path).subarray(0, 3);
      expect([...head]).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  it('are listed in frames.json with their game, and the list is the page\'s', () => {
    const manifest = JSON.parse(readFileSync(resolve(DIR, 'frames/frames.json'), 'utf8')) as Array<{ file: string; bytes: number; game: string | null }>;
    expect(manifest.map((m) => `frames/${m.file}`).sort()).toEqual([...frames].sort());
    for (const m of manifest) expect(statSync(resolve(DIR, 'frames', m.file)).size).toBe(m.bytes);
    expect(manifest.filter((m) => m.game === 'ffx').length).toBeGreaterThanOrEqual(2);
    expect(manifest.filter((m) => m.game === 'ffx2').length).toBeGreaterThanOrEqual(2);
  });

  it('are clean captures of the game as it plays: no interface, no scripted run, no test numbers (review finding M1)', () => {
    // the picked mockup's wall is "three clean frames" (no interface); the first build used HUD-on frames from scripted runs with the party's HP raised (Yuna 30000 / 30000, rows colliding)
    const config = JSON.parse(readFileSync(resolve('tools/press-frames.json'), 'utf8')) as Array<{ name: string; src?: string; art?: string; clean?: string; game: string | null; note: string }>;
    const games = config.filter((c) => c.game !== null);
    expect(games.length).toBeGreaterThanOrEqual(6);
    for (const c of games) {
      expect(c.note, c.name).toMatch(/press-capture/); // made by tools/press-capture.mjs: the interface layer hidden, the game's own stats
      expect(c.note, c.name).toMatch(/no interface/);
      expect(c.src ?? '', c.name).not.toMatch(/ch[14]-script|ch[14]-glass|evidence/); // not a camera-lane scripted run, not an evidence frame with the HUD on
      expect(c.clean, c.name).toBeUndefined(); // no playtest switchboard label to take out: the captures are made without ?switchboard=1
    }
    const capture = readFileSync(resolve('tools/press-capture.mjs'), 'utf8');
    expect(capture).toContain('#ui { visibility: hidden !important; }');
    expect(capture).toContain("arg('query', 'demo=1&pack=demo')"); // no ?switchboard=1: no key-list label in the corner of every picture
    expect(capture).not.toMatch(/maxHp|battleState|.hps*=/); // the tool plays the fight by the game's own strategy and never edits a stat
  });

  it('give every picture a description and a size', () => {
    for (const img of markup.match(/<img [^>]*>/g) ?? []) {
      expect(img).toMatch(/alt="[^"]{12,}"/);
      expect(img).toMatch(/width="\d+" height="\d+"/);
    }
  });
});

describe('the press page: the words are the game\'s own', () => {
  it('carries the fan-work notice verbatim (README.md, the credits panel\'s FAN_NOTICE) and says "An unofficial fan tribute"', () => {
    const notice = /data-notice>([\s\S]*?)<\/p>/.exec(markup)?.[1];
    expect(decode(notice ?? '')).toBe(FAN_NOTICE);
    expect(decode(notice ?? '')).not.toMatch(/are original/); // r64 (item 200h): the "All code, art, music, and writing here are original" sentence is gone from the game and the page together
    expect(decode(notice ?? '')).toContain('property of Square Enix');
    expect(decode(notice ?? '')).toContain('unaffiliated with Square Enix');
    expect(markup).toContain('An unofficial fan tribute');
  });

  it('lists only credit lines that are in the game\'s credits data, and every one the licences require', () => {
    const lines = [...markup.matchAll(/data-credit="([^"]+)"/g)].map((m) => decode(m[1]!));
    const inGame = new Map<string, boolean>();
    for (const g of creditGroups(BTS_LIVE)) for (const e of g.entries) inGame.set(`${e.title}|${e.by}|${e.licence}`, e.required === true);
    expect(lines.length).toBeGreaterThanOrEqual(7);
    for (const l of lines) expect(inGame.has(l), l).toBe(true);
    const required = [...inGame].filter(([, req]) => req).map(([k]) => k);
    expect([...lines].sort()).toEqual([...required].sort());
    expect(CREDIT_GROUPS.length).toBeGreaterThan(0);
  });

  it('prints the licence addresses the game prints', () => {
    const line = /data-licences>([\s\S]*?)<\/p>/.exec(markup)?.[1];
    expect(decode(line ?? '')).toBe(LICENCE_LINKS);
  });

  it('names the five fights as the README does and the two demo fights by game', () => {
    for (const name of ['Seymour Flux', 'Lady Yunalesca', "Braska's Final Aeon", 'Bahamut', 'Vegnagun']) expect(markup).toContain(name);
    expect(markup).toContain('Final Fantasy X (CTB)');
    expect(markup).toContain('Final Fantasy X-2 (ATB)');
  });

  it('has no personal contact details: no email address, no mail link, no phone number', () => {
    expect(markup).not.toMatch(/mailto:/i);
    expect(markup).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(markup).not.toMatch(/\+?\d[\d ().-]{8,}\d/);
  });
});

describe('the press page: the type, the motion and the phone', () => {
  it('sets the root at 28 px in a 2560 x 1440 window and never sets a word below 1rem', () => {
    const root = /html \{ font-size: clamp\(([0-9.]+)px, ([0-9.]+)vw, ([0-9.]+)px\)/.exec(style);
    expect(root).not.toBeNull();
    expect(Number(root![2]) * 25.6).toBeCloseTo(28, 2); // 1vw is 25.6 px at 2560
    expect(Number(root![1])).toBeGreaterThanOrEqual(14);
    const words = style.replace(/html {[^}]*}/g, ''); // the root's own size is the rem's definition, not a word
    const sizes = [...words.matchAll(/font:\s*(?:italic |normal )?(?:[0-9]+ )?([0-9.]+)(rem|px|em)\//g)].map((m) => [Number(m[1]), m[2]] as const);
    const plain = [...words.matchAll(/font-size:\s*([0-9.]+)(rem|px|em)/g)].map((m) => [Number(m[1]), m[2]] as const);
    for (const [n, unit] of [...sizes, ...plain]) {
      expect(unit, `a ${n}${unit} size`).not.toBe('px');
      if (unit === 'rem') expect(n).toBeGreaterThanOrEqual(1);
    }
  });

  it('stills its build-up under REDUCE MOTION', () => {
    expect(style).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*animation: none/);
  });

  it('is one column under 1000 px (a tablet, a phone), and its text is 16 px there', () => {
    expect(style).toMatch(/@media \(max-width: 1000px\)[\s\S]*?html \{ font-size: 16px; \}/);
    expect(style).toMatch(/@media \(max-width: 1000px\)[\s\S]*?\.grid \{ display: block;/);
  });

  it('never leaves the two-column dossier narrower than its left column needs: the one-column breakpoint is not under 1000 px', () => {
    // the left column is 35.7rem (500 px at the 14 px root) and the gaps and margins take 172 px more: a window under about 1000 px would leave the frame wall a sliver (96 px at 768, 148 px at 820; found in review)
    const bps = [...style.matchAll(/@media \(max-width: (\d+)px\) \{\s*html \{ font-size: 16px; \}/g)].map((m) => Number(m[1]));
    expect(bps.length).toBeGreaterThan(0);
    expect(Math.max(...bps)).toBeGreaterThanOrEqual(1000);
  });

  it('keeps the wall two frames wide on a tablet and one on a phone (600 px)', () => {
    expect(style).toMatch(/@media \(max-width: 600px\)[\s\S]*?\.wall \{ grid-template-columns: 1fr; \}/);
    const tablet = style.match(/@media \(max-width: 1000px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(tablet).not.toMatch(/\.wall \{[^}]*grid-template-columns/);
  });
});
