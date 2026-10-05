/**
 * Dev and preview serve an art URL written `idle%402x.png` (release 39, the live check's finding LV-2; both games, shared plumbing).
 *
 * The game now asks for a master with its `@` percent-encoded (src/engine/ArtShipped.ts), because Cloudflare answers the raw
 * `idle@2x.png` with a 307 first. Vite's static middleware (sirv: dev server and `vite preview`) decodes with `decodeURI`, which
 * leaves `%40` alone, so without the plugin the request found no file and was answered 200 with index.html. The plugin writes
 * `@` back into the path of an `/art/` request ahead of Vite's own middleware, and nothing else.
 */
import { describe, expect, it } from 'vitest';
import { atSignInArtPath, pyreflyArtAtSign } from '../../tools/vite-art-at.mjs';

type Middleware = (req: { url?: string }, res: unknown, next: () => void) => void;
interface FakeServer { middlewares: { use(fn: Middleware): void } }
interface ServePlugin { name: string; apply: string; configureServer(server: FakeServer): void; configurePreviewServer(server: FakeServer): void }

describe('atSignInArtPath', () => {
  it('writes the @ back into the path of an art URL, behind any base path', () => {
    expect(atSignInArtPath('/art/characters/tidus/idle%402x.png')).toBe('/art/characters/tidus/idle@2x.png');
    expect(atSignInArtPath('/pyrefly-reprise/art/backdrops/gagazet%402x.webp')).toBe('/pyrefly-reprise/art/backdrops/gagazet@2x.webp');
    expect(atSignInArtPath('/art/characters/tidus/idle%402x.json')).toBe('/art/characters/tidus/idle@2x.json');
    expect(atSignInArtPath('/art/characters/tidus/idle%40%404x.png')).toBe('/art/characters/tidus/idle@@4x.png');
  });

  it('leaves the query, the hash and every URL outside art/ exactly as it was', () => {
    expect(atSignInArtPath('/art/characters/tidus/idle%402x.png?next=a%40b#h%40')).toBe('/art/characters/tidus/idle@2x.png?next=a%40b#h%40');
    for (const url of ['/index.html?mail=a%40b.test', '/fx/gagazet/idle%402x.png', '/martart/characters/tidus/idle%402x.png', '/audio/idle%402x.mp3', '/art/characters/tidus/idle.png', '/']) {
      expect(atSignInArtPath(url), url).toBe(url);
    }
  });
});

describe('pyreflyArtAtSign', () => {
  const run = (hook: 'configureServer' | 'configurePreviewServer', url: string | undefined) => {
    const plugin = pyreflyArtAtSign() as unknown as ServePlugin;
    const mounted: Middleware[] = [];
    plugin[hook]({ middlewares: { use: (fn) => { mounted.push(fn); } } });
    expect(mounted).toHaveLength(1);
    const req: { url?: string } = url === undefined ? {} : { url };
    let called = 0;
    mounted[0]!(req, {}, () => { called++; });
    return { url: req.url, called };
  };

  it('is a serve-only plugin: the dev server and vite preview, never a build', () => {
    const plugin = pyreflyArtAtSign() as unknown as ServePlugin;
    expect(plugin.name).toBe('pyrefly-art-at-sign');
    expect(plugin.apply).toBe('serve');
  });

  it('mounts one middleware ahead of Vite\'s own on both servers, rewrites req.url and always calls next', () => {
    for (const hook of ['configureServer', 'configurePreviewServer'] as const) {
      expect(run(hook, '/art/characters/tidus/idle%402x.png?v=1')).toEqual({ url: '/art/characters/tidus/idle@2x.png?v=1', called: 1 });
      expect(run(hook, '/index.html')).toEqual({ url: '/index.html', called: 1 });
      expect(run(hook, undefined)).toEqual({ url: undefined, called: 1 });
    }
  });
});
