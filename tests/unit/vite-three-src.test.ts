/**
 * **A production build draws `three` from its per-class source modules** (r74-int review MAJOR-1, 2026-11-03; `tools/vite-three-src.mjs`; both games, shared build plumbing). The title page loaded 73.9 KB of
 * `three/build/three.core.js` that only the hidden 3D chapters (behind `import()`) use, because the build is one module and a bundler cannot split inside a module. Resolving the bare `three` to
 * `three/src/Three.js` gives it a module per class. Pins:
 *
 * 1. the plugin is build-only (`apply: 'build'`, `enforce: 'pre'`) with `config` and `transform` and nothing else; Vite keeps it for a build and leaves it out of the dev server; `vite.config.ts` registers it once;
 * 2. it adds one alias, the bare `three` (an exact match: `three/addons/*` and `three/src/*` are left alone) to the entry the installed package really has; `PYREFLY_THREE_SRC=off` is the stock build (no alias, no
 *    transform), and nothing else turns it off;
 * 3. the shader step is `three`'s own: the comment and blank-line stripping of the `/* glsl *\/` literals, written out, and run only on `three/src/**\/*.glsl.js`;
 * 4. **every shader string the plugin produces from `three/src` equals the string in the stock build (`ShaderChunk`), and the stock build holds no shader the source does not produce**: so a shader is neither
 *    bigger nor different than the one release 73 shipped.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from 'vite';
import { ShaderChunk, ShaderLib, ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';

import viteConfig from '../../vite.config.ts';
import { THREE_SRC_ENTRY, THREE_SRC_ENV, minifyGlsl, pyreflyThreeSrc, threeSrcOn } from '../../tools/vite-three-src.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
type Hooked = {
  name: string;
  apply?: string;
  enforce?: string;
  config?: () => { resolve: { alias: Array<{ find: RegExp; replacement: string }> } } | undefined;
  transform?: (code: string, id: string) => { code: string; map: null } | null;
  [k: string]: unknown;
};
const hooked = (p: unknown): Hooked => p as Hooked;
const GLSL = 'export default /* glsl */`\n// a line comment\nvoid main() {\n\n\n\tgl_FragColor = vec4( 1.0 ); /* a block\n comment */\n}\n`;';
const THREE_SHADER = '/work/node_modules/three/src/renderers/shaders/ShaderChunk/common.glsl.js';

describe('the plugin', () => {
  it('is build-only: apply build, enforce pre, config and transform, and no other hook', () => {
    const p = hooked(pyreflyThreeSrc());
    expect(p.name).toBe('pyrefly-three-src');
    expect(p.apply).toBe('build');
    expect(p.enforce).toBe('pre');
    expect(typeof p.config).toBe('function');
    expect(typeof p.transform).toBe('function');
    for (const hook of ['configureServer', 'configurePreviewServer', 'configResolved', 'buildStart', 'resolveId', 'load', 'generateBundle', 'writeBundle', 'closeBundle', 'transformIndexHtml']) expect(p[hook]).toBeUndefined();
  });

  it('Vite itself keeps it for a build and leaves it out of the dev server', async () => {
    const names = async (command: 'build' | 'serve'): Promise<string[]> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyThreeSrc()] }, command, 'development', 'development', false)).plugins.map((p) => p.name);
    expect(await names('build')).toContain('pyrefly-three-src');
    expect(await names('serve')).not.toContain('pyrefly-three-src');
  });

  it('a build resolves the bare `three` to the source entry through Vite\'s own config merge, and the dev server does not', async () => {
    const aliases = async (command: 'build' | 'serve'): Promise<Array<{ find: unknown; replacement: string }>> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyThreeSrc({ env: {} })] }, command, 'development', 'development', false)).resolve.alias as Array<{ find: unknown; replacement: string }>;
    expect((await aliases('build')).filter((a) => a.replacement === THREE_SRC_ENTRY)).toHaveLength(1);
    expect((await aliases('serve')).some((a) => a.replacement === THREE_SRC_ENTRY)).toBe(false);
  });

  it('vite.config.ts registers it once, ahead of the art plugins (a build) and not at all for the dev server', () => {
    const names = (command: 'build' | 'serve'): string[] => (viteConfig as unknown as (env: object) => { plugins: Array<{ name: string }> })({ command, mode: 'production', isPreview: false }).plugins.map((p) => p.name);
    expect(names('build').filter((n) => n === 'pyrefly-three-src')).toHaveLength(1);
    expect(names('build').indexOf('pyrefly-three-src')).toBeLessThan(names('build').indexOf('pyrefly-art-derive'));
    expect(readFileSync(join(REPO, 'vite.config.ts'), 'utf8')).toMatch(/pyreflyThreeSrc\(\), pyreflyFxAssets\(\)/);
  });
});

describe('the alias', () => {
  it('is one exact-match entry for the bare `three`: `three/addons/*` and `three/src/*` do not match it', () => {
    const alias = hooked(pyreflyThreeSrc({ env: {} })).config!()!.resolve.alias;
    expect(alias).toHaveLength(1);
    expect(alias[0]!.replacement).toBe(THREE_SRC_ENTRY);
    expect(alias[0]!.find.test('three')).toBe(true);
    for (const other of ['three/addons/loaders/GLTFLoader.js', 'three/src/Three.js', 'three/webgpu', 'threejs', 'my-three', '@types/three']) expect(alias[0]!.find.test(other), other).toBe(false);
  });

  it('leads to a file the installed package has, and that file re-exports the core', () => {
    const file = createRequire(import.meta.url).resolve(THREE_SRC_ENTRY);
    expect(file.replace(/\\/g, '/')).toMatch(/\/three\/src\/Three\.js$/);
    expect(readFileSync(file, 'utf8')).toMatch(/export \* from '\.\/Three\.Core\.js'/);
  });

  it('PYREFLY_THREE_SRC=off is the stock build, in any case or with blanks; unset, empty and every other value are on', () => {
    expect(THREE_SRC_ENV).toBe('PYREFLY_THREE_SRC');
    for (const v of ['off', 'OFF', ' off ']) {
      expect(threeSrcOn({ [THREE_SRC_ENV]: v }), v).toBe(false);
      const p = hooked(pyreflyThreeSrc({ env: { [THREE_SRC_ENV]: v } }));
      expect(p.config!()).toBeUndefined();
      expect(p.transform!(GLSL, THREE_SHADER)).toBeNull();
    }
    for (const v of [undefined, '', 'on', '1', 'false', 'no']) {
      expect(threeSrcOn({ [THREE_SRC_ENV]: v }), String(v)).toBe(true);
      expect(hooked(pyreflyThreeSrc({ env: { [THREE_SRC_ENV]: v } })).config!()).toBeDefined();
    }
  });
});

describe('the shader step', () => {
  it('takes the comments and the blank-line runs out of a glsl literal, as a JSON string, and nothing else out of the file', () => {
    const out = minifyGlsl(`import x from './y.js';\n${GLSL}\nexport const z = \`kept\`;`);
    expect(out).toContain("import x from './y.js';");
    expect(out).toContain('export const z = `kept`;');
    expect(out).toContain('export default "void main() {\\n\\tgl_FragColor = vec4( 1.0 );\\n}";');
    expect(out).not.toMatch(/comment/);
  });

  it('returns code with no glsl literal unchanged, and the plugin says so with null', () => {
    expect(minifyGlsl('export const a = 1;')).toBe('export const a = 1;');
    const p = hooked(pyreflyThreeSrc({ env: {} }));
    expect(p.transform!('export const a = 1;', THREE_SHADER)).toBeNull();
  });

  it('runs on three\'s own shader files only: a `.glsl.js` of ours, a three file that is not a shader and a query on the id are handled as they should be', () => {
    const p = hooked(pyreflyThreeSrc({ env: {} }));
    expect(p.transform!(GLSL, THREE_SHADER)?.code).toContain('export default "void main()');
    expect(p.transform!(GLSL, 'C:\\work\\node_modules\\three\\src\\renderers\\shaders\\ShaderChunk\\common.glsl.js')?.code).toContain('export default "void main()');
    expect(p.transform!(GLSL, `${THREE_SHADER}?v=1`)?.code).toContain('export default "void main()');
    expect(p.transform!(GLSL, '/work/src/engine/fx/own.glsl.js')).toBeNull();
    expect(p.transform!(GLSL, '/work/node_modules/three/src/core/Object3D.js')).toBeNull();
    expect(p.transform!(GLSL, '/work/node_modules/other/src/x.glsl.js')).toBeNull();
  });
});

describe('every shader of the source build equals the stock build\'s', () => {
  const root = join(dirname(createRequire(import.meta.url).resolve(THREE_SRC_ENTRY)), 'renderers', 'shaders');
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.glsl.js') ? [join(dir, e.name)] : []));

  it('the plugin\'s output for each shader file, run as a module, is exactly a string of the stock build, and each stock chunk has a source', async () => {
    const plugin = hooked(pyreflyThreeSrc({ env: {} }));
    const found: Array<{ file: string; name: string; text: string }> = [];
    for (const file of files(root)) {
      const out = plugin.transform!(readFileSync(file, 'utf8'), file)?.code;
      expect(out, file).toBeDefined();
      const mod = (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(out!).toString('base64')}`)) as Record<string, unknown>;
      for (const [name, text] of Object.entries(mod)) {
        expect(typeof text, `${file} ${name}`).toBe('string');
        found.push({ file, name, text: text as string });
      }
    }
    expect(found.length).toBeGreaterThan(100);
    // The stock build embeds each minified shader as a JSON string literal. Some programs (the VSM shadow pair, the background and cube programs) are reached by `WebGLRenderer` directly and are in no public
    // table, so the build's files are read, not its exports: `three.core.js` and `three.module.js`, the two files `three.cjs`'s neighbours.
    const buildDir = dirname(createRequire(import.meta.url).resolve('three'));
    const stockText = ['three.core.js', 'three.module.js'].map((n) => readFileSync(join(buildDir, n), 'utf8')).join('\n');
    for (const f of found) expect(stockText.includes(JSON.stringify(f.text)), `${f.file.slice(root.length)} ${f.name}: a string the stock build does not have`).toBe(true);
    // and the other way, for the public tables: each ShaderChunk string, each lib program's two stages and a bare ShaderMaterial's two defaults are produced by some source file
    const made = new Set(found.map((f) => f.text));
    const dflt = new ShaderMaterial();
    const wanted: Array<[string, string]> = [
      ...Object.entries(ShaderChunk).map(([k, v]): [string, string] => [`ShaderChunk.${k}`, v as string]),
      ...Object.entries(ShaderLib).flatMap(([k, l]): Array<[string, string]> => [[`ShaderLib.${k}.vertexShader`, l.vertexShader], [`ShaderLib.${k}.fragmentShader`, l.fragmentShader]]),
      ['ShaderMaterial.vertexShader', dflt.vertexShader],
      ['ShaderMaterial.fragmentShader', dflt.fragmentShader],
    ];
    expect(wanted.length).toBeGreaterThan(130);
    for (const [name, text] of wanted) expect(made.has(text), `${name}: not produced by any source file`).toBe(true);
    // a source that was NOT minified would differ from the stock build, so the equality above can fail
    expect(readFileSync(join(root, 'ShaderChunk', 'common.glsl.js'), 'utf8')).toMatch(/\/\/ |\/\*/);
    expect(ShaderChunk.common).not.toMatch(/^\s*\/\//m);
  });
});
