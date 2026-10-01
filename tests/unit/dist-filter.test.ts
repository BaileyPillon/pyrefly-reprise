/**
 * PR-0100 + PR-0173: audition candidates, raw renders and numbered art takes
 * never reach the build. Game case: both (delivery plumbing, CHK-017).
 */
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Plugin, UserConfig } from 'vite';

import { findUnshipped, isUnshippedPublicFile, pruneUnshipped } from '../../tools/dist-filter.mjs';
import viteConfig, { THIRD_PARTY_LICENCES } from '../../vite.config.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('what never ships', () => {
  it('drops audio candidates, raw renders and numbered takes', () => {
    for (const p of [
      'audio/candidates/evrae-near.mp3',
      'audio/candidates/C-round1-battle-ffx-A-x12.ogg',
      'art/portraits/f4blulu.1.raw.png',
      'art/portraits/f4lulu.3.png',
      'art/characters/ffx2-bahamut/ko.2.json',
      'art\\characters\\paine-dark-knight\\idle-a.1.png',
    ]) {
      expect(isUnshippedPublicFile(p), p).toBe(true);
    }
  });

  it('keeps everything the game loads', () => {
    for (const p of [
      'audio/manifest.json',
      'audio/music/boss-seymour.mp3',
      'audio/sfx/sprite.mp3',
      'art/manifest.json',
      'art/characters/anima/hurt.png',
      'art/characters/anima/hurt.json',
      'art/characters/evrae/idle-far.png',
      'art/backdrops/ch1-2.png', // a digit inside the stem is not a take number
      'art/portraits/tidus-v2.png',
      'assets/index-4f2a.js',
      'index.html',
    ]) {
      expect(isUnshippedPublicFile(p), p).toBe(false);
    }
  });

  it('prunes a built tree and leaves no empty candidates folder', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    const files = [
      'index.html',
      'audio/manifest.json',
      'audio/candidates/a.ogg',
      'art/portraits/lulu.png',
      'art/portraits/lulu.2.png',
      'art/portraits/lulu.2.json',
      'art/portraits/lulu.raw.png',
    ];
    for (const f of files) {
      mkdirSync(dirname(join(tmp, f)), { recursive: true });
      writeFileSync(join(tmp, f), 'x');
    }
    const removed = pruneUnshipped(tmp);
    expect(removed.sort()).toEqual([
      'art/portraits/lulu.2.json',
      'art/portraits/lulu.2.png',
      'art/portraits/lulu.raw.png',
      'audio/candidates/a.ogg',
    ]);
    expect(findUnshipped(tmp)).toEqual([]);
    expect(readdirSync(join(tmp, 'audio'))).toEqual(['manifest.json']);
    expect(readdirSync(join(tmp, 'art', 'portraits'))).toEqual(['lulu.png']);
  });
});

describe('the production build applies it', () => {
  it('vite.config.ts carries the dist-filter plugin for builds', async () => {
    const config = (await (viteConfig as (env: { command: 'build'; mode: string; isPreview: boolean }) => UserConfig | Promise<UserConfig>)({
      command: 'build',
      mode: 'production',
      isPreview: false,
    })) as UserConfig;
    const names = (config.plugins ?? []).flat().map((p) => (p as Plugin | null)?.name);
    expect(names).toContain('pyrefly-dist-filter');
  });

  // three.js is MIT: its copyright and permission notice must travel with the
  // bundle. The minifier strips comments unless told otherwise (the live
  // index-ChAAAZ-I.js carried no "Three.js Authors" at all).
  it('keeps the bundled licence notices: @license headers in the code, full texts beside it', async () => {
    const config = (await (viteConfig as (env: { command: 'build'; mode: string; isPreview: boolean }) => UserConfig | Promise<UserConfig>)({
      command: 'build',
      mode: 'production',
      isPreview: false,
    })) as UserConfig;
    expect(config.build?.license).toEqual({ fileName: THIRD_PARTY_LICENCES });
    expect(isUnshippedPublicFile(THIRD_PARTY_LICENCES)).toBe(false);
    const output = config.build?.rolldownOptions?.output;
    expect(Array.isArray(output) ? undefined : output?.comments).toMatchObject({ legal: true });
  });
});
