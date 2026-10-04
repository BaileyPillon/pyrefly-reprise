/**
 * "The live URL" is one constant, derived from the deploy host config (`tools/deploy-host.mjs`: `LIVE_URL`
 * is the default host's address), and every tool, critic runner and page that needs it either imports that
 * constant or carries a literal this test pins to it. So the switch to Cloudflare moved all of them at once,
 * and a later move cannot leave one behind pointing at the old GitHub Pages address.
 *
 * Workflow scripts (`critic/runner/*.js`) cannot import anything (no filesystem, no Node API), and the learning
 * sites are browser code that cannot import a Node module, so their literals are compared with the constant here.
 * The old address stays reachable as the OLD host: `HOSTS.github.liveUrl`, for an explicit `--host=github` run,
 * an explicit `--url=` on a probe, or `args.live` on a runner.
 *
 * Game case: both (hosting; no gameplay). Added with the Cloudflare switch of 2026-10-04.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_HOST, HOSTS, LIVE_URL } from '../../tools/deploy-host.mjs';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(REPO, ...rel.split('/')), 'utf8');

/** Every file under these folders that can name an address, relative to the repo, with forward slashes. */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(REPO, ...dir.split('/')), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.wrangler', 'dist', 'dist-release', 'dist-gate', 'dist-learn'].includes(entry.name)) continue;
      walk(rel, out);
    } else if (/\.(mjs|js|ts|mts|json|html|css|md|jsonc)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

describe('the live URL is the default host\'s address', () => {
  it('is Cloudflare\'s Custom Domain, and the old GitHub address is the other host, not the default', () => {
    expect(LIVE_URL).toBe('https://echoesofspira.com/');
    expect(LIVE_URL).toBe(HOSTS[DEFAULT_HOST].liveUrl);
    expect(HOSTS.github.liveUrl).not.toBe(LIVE_URL);
  });
});

describe('the critic runners aim at the live address, and args.live aims them elsewhere', () => {
  for (const file of ['critic/runner/live.js', 'critic/runner/deep.js', 'critic/runner/release.js']) {
    it(`${file} defaults to LIVE_URL`, () => {
      const match = read(file).match(/^const LIVE = \(args && args\.live\) \|\| '([^']+)'/m);
      expect(match, `${file} needs: const LIVE = (args && args.live) || '<the live address>'`).not.toBeNull();
      expect(match?.[1]).toBe(LIVE_URL);
    });
  }

  it('release.js names the live address through that constant, not a second literal, and the old address only as the old one', () => {
    const text = read('critic/runner/release.js');
    expect(text).toMatch(/live \$\{LIVE\}/);
    const old = [...text.matchAll(/baileypillon\.github\.io\/pyrefly-reprise/g)];
    expect(old).toHaveLength(1);
    expect(text).toMatch(/the old GitHub Pages address https:\/\/baileypillon\.github\.io\/pyrefly-reprise\/ stays up/);
  });

  it('live.js and deep.js use the constant, so a review reads and verifies the address they were aimed at', () => {
    for (const file of ['critic/runner/live.js', 'critic/runner/deep.js']) {
      expect(read(file)).toMatch(/\$\{LIVE\}/);
    }
    expect(read('critic/runner/live.js')).toMatch(/verify-live --manifest critic\/artifacts\/\$\{SHA\}\.json --url \$\{LIVE\}/);
  });
});

describe('the learning sites link to the live address', () => {
  for (const file of ['learn/atlas/main.ts', 'learn/exploded/main.ts', 'learn/studio/main.ts']) {
    it(`${file} links the game at LIVE_URL`, () => {
      expect(read(file).match(/^const FIGHT_URL = '([^']+)';/m)?.[1]).toBe(LIVE_URL);
    });
  }
});

describe('the probes read the constant instead of carrying a literal', () => {
  for (const file of ['tools/audio/music-overlap-probe.mjs', 'tools/audio/sfx-probe.mjs']) {
    it(`${file} defaults --url to LIVE_URL from deploy-host.mjs`, () => {
      const text = read(file);
      expect(text).toContain("import { LIVE_URL } from '../deploy-host.mjs';");
      expect(text).toMatch(/arg\('url', LIVE_URL\)/);
    });
  }
});

describe('nothing else hard-codes the old GitHub address', () => {
  // The one place that defines the old host (an explicit --host=github), and the one runner prompt that says, in words, which address is the old one.
  const ALLOWED = new Set(['tools/deploy-host.mjs', 'critic/runner/release.js']);
  const roots = ['tools', 'critic/runner', 'critic/bench', 'learn', 'src'];
  const loose = ['index.html', 'vite.config.ts', 'playwright.config.ts', 'package.json', 'vitest.config.ts'];

  it('finds the GitHub Pages address (host and project folder) only where it is meant to be', () => {
    const offenders: string[] = [];
    for (const file of [...roots.flatMap((dir) => walk(dir)), ...loose]) {
      if (ALLOWED.has(file)) continue;
      if (/baileypillon\.github\.io\/pyrefly-reprise/.test(readFileSync(join(REPO, ...file.split('/')), 'utf8'))) offenders.push(relative(REPO, join(REPO, file)));
    }
    expect(offenders, 'these files name the old GitHub Pages address; use LIVE_URL (tools) or pin the literal to it (runners, learn pages)').toEqual([]);
  });

  it('keeps the old address defined once, as the GitHub host', () => {
    expect(read('tools/deploy-host.mjs').match(/baileypillon\.github\.io\/pyrefly-reprise\//g)).toHaveLength(1);
  });
});
