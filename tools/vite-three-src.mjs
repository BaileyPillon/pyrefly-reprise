/**
 * A production build draws `three` from its per-class source modules, so a class only a lazy chapter uses leaves the title page's chunks (r74-int review MAJOR-1, 2026-11-03; both games, shared build plumbing).
 *
 * THE FINDING. `three/build/three.core.js` is ONE module. The title page imports it statically, and the hidden 3D chapters (`src/engine/ww3d`, `src/engine/yrp3d`, loaded behind `import()`) use classes the
 * title page never touches (`AnimationMixer`, `Bone`, `SkinnedMesh`, `MeshToonMaterial`, `SpotLight`, `Shape`, ...). A bundler tree-shakes a module to the UNION of what every importer uses and puts the module in
 * one chunk, so every title load carried those classes: +73.9 KB of `three.core.js` in the closure (1.18 percent of the title page) on release 74's tip. A chunk split cannot cut inside a module.
 *
 * THE CUT. `three` ships `src/` (one module per class, `package.json` exports `./src/*`, `sideEffects` only for `./src/nodes/**`). Resolving the bare `three` to `three/src/Three.js` in a build gives the bundler
 * a module per class, so a class used only behind a dynamic import lands in that import's chunk and the title page keeps the ones it draws with. Measured on the r74-int tip, same environment as the review's
 * builds: the title page 6,421,423 B to 6,333,064 B raw and 1,805,098 B to 1,786,031 B gzip (docs/handoff/r74.md section 9).
 *
 * WHAT IT CHANGES. Nothing in the source: the same code `three/build/*.js` is made from. `three`'s own build does one thing to it besides concatenating: it strips comments and blank lines from the GLSL template
 * strings (`/* glsl *\/` literals in `src/renderers/shaders/**\/*.glsl.js`). This plugin does the same (`minifyGlsl`), and `tests/unit/vite-three-src.test.ts` proves every shader string it produces equals the
 * string in the stock build (`ShaderChunk` and `ShaderLib`), so a shader is neither bigger nor different. `three/addons/*` (examples/jsm) import the bare `three` and follow the alias, so there is ONE copy
 * of three in the bundle (checked on the r74-int build with its source maps: 190 `three/src` modules, none from `three/build`).
 *
 * BUILD ONLY (`apply: 'build'`): the dev server, `vite preview` and vitest keep the stock build, as before.
 *
 * OFF BY DEFAULT SINCE RELEASE 75 (the driver's decision 219w, D-1467, job INT-3). Release 74 shipped it on (the lane read first input handled 0.7 percent slower on Fast 3G in a median of 3 and the driver kept it on within noise) and
 * set the test for release 75: 10 cold runs an arm, HTTP/2 with brotli, Fast 3G with the CPU four times slower, and "the plugin ships off if first input is still slower". It was: first input handled 20,533.5 ms with the plugin
 * against 20,439 ms for the stock build in the medians (+94.5 ms, 0.46 percent; ON slower in 8 of 10 pairs; inside both arms' spread, and 6.5 ms slower on a 10 Mbit link), while first paint was earlier with it in 10 of 10 pairs
 * (162 ms on Fast 3G, 36 ms at 10 Mbit) and the wire 18 KB lighter. The rule was written as a comparison of medians, so it holds: a build without `PYREFLY_THREE_SRC=on` is the stock build, as release 73 shipped it
 * (its title page is 88 KB raw and 19 KB gzip heavier than the plugin's, 6,421,676 B and 1,805,211 B against 6,333,311 B and 1,786,107 B on release 74's tip, over 10 static scripts instead of 18). `PYREFLY_THREE_SRC=on` (any case,
 * blanks trimmed) is the one word that turns the plugin on, and all of it is kept (the alias, the shader step and their tests) for the day the numbers read the other way.
 *
 * Game case: both (shared build plumbing; no source file, no number and no picture changes).
 */

/** The environment variable that turns the plugin on (`on`); since release 75 a build without it is the stock `three` build. */
export const THREE_SRC_ENV = 'PYREFLY_THREE_SRC';

/** What the bare `three` resolves to in a build (the package's `exports` map has `./src/*`). */
export const THREE_SRC_ENTRY = 'three/src/Three.js';

/** The shader files `three`'s own build minifies: `three/src/**\/*.glsl.js`, as a path with forward slashes. */
const GLSL_FILE = /[\\/]three[\\/]src[\\/].*\.glsl\.js$/;

/** Is the plugin on? Off by default since release 75 (INT-3): `PYREFLY_THREE_SRC=on` (any case, blanks trimmed) is the one thing that turns it on; unset, empty and every other word are off. */
export function threeSrcOn(env = process.env) {
  return String(env[THREE_SRC_ENV] ?? '').trim().toLowerCase() === 'on';
}

/**
 * `three`'s own rollup step for shaders, written out: each `/* glsl *\/` template literal becomes a JSON string of its text with the `//` comments, the block comments and the runs of blank lines taken
 * out. Returns the code unchanged when it has no such literal.
 */
export function minifyGlsl(code) {
  return code.replace(/\/\* glsl \*\/`(.*?)`/gs, (_match, text) =>
    JSON.stringify(
      text
        .trim()
        .replace(/\r/g, '')
        .replace(/[ \t]*\/\/.*\n/g, '') // remove //
        .replace(/[ \t]*\/\*[\s\S]*?\*\//g, '') // remove /* */
        .replace(/\n{2,}/g, '\n'), // # \n+ to \n
    ),
  );
}

/** The Vite plugin: build only; resolves `three` to its source modules and minifies their shaders as `three`'s build does. `env` is injectable for tests. */
export function pyreflyThreeSrc({ env = process.env } = {}) {
  return {
    name: 'pyrefly-three-src',
    apply: 'build',
    enforce: 'pre',
    config() {
      if (!threeSrcOn(env)) return undefined;
      return { resolve: { alias: [{ find: /^three$/, replacement: THREE_SRC_ENTRY }] } };
    },
    transform(code, id) {
      if (!threeSrcOn(env) || !GLSL_FILE.test(id.split('?')[0])) return null;
      const out = minifyGlsl(code);
      return out === code ? null : { code: out, map: null };
    },
  };
}
