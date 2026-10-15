/**
 * **What a production build of the hidden Fayth chapter's scene contains** (`src/scenes/exp-fayth-deck.ts`; FFX only; AGENTS.md hard rule 8): the website's scene is the painted skin with the **table camera**, and
 * must hold none of what is Bailey's own copy of the game: not the camera programs' loader and VM, not the model loader and the skin, not the route that serves his folder.
 *
 * A real Vite production build of the scene (`import.meta.env.DEV` replaced by `false`, so the dev-gated branches are dropped; a library entry; no minification, so names survive; nothing written; the repo's plugins
 * left out) is read for what is and is not in it:
 *
 * - **In**: the table director, the table camera, the shot table's format string, the painted B's filter, the pose latch and the camera sink.
 * - **Out**: the dev camera and skin glue, FFX's camera director, the VM and its solver and book, the program loader, the model loader and the skin, the local route, both debug handles, the dev-only probes, and any
 *   instruction or script name (a program id, an IR format, a call name) in the table's data.
 *
 * Game case: FFX only.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function productionBundle(): Promise<string> {
  const out = await build({
    root: REPO,
    configFile: false, // the repo's plugins (the art derivation) are the site's build, not this proof's: the scene's code is what is read
    mode: 'production',
    logLevel: 'silent',
    // vitest runs with NODE_ENV=test, and Vite takes DEV from NODE_ENV: say what a production build says
    define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' },
    build: {
      write: false,
      minify: false,
      sourcemap: false,
      copyPublicDir: false,
      lib: { entry: join(REPO, 'src', 'scenes', 'exp-fayth-deck.ts'), formats: ['es'], fileName: 'deck' },
    },
  });
  const results = Array.isArray(out) ? out : [out];
  const chunks = results.flatMap((r) => ('output' in r ? r.output : []));
  const text = chunks.map((c) => (c.type === 'chunk' ? c.code : '')).join('\n');
  // an unminified library build keeps the doc comments, and ours name what is not here: what is read is the code
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

describe('a production build of the deck scene', () => {
  it('holds the table camera and none of the local camera data, the VM, the skin, the model loader or the route', async () => {
    const text = await productionBundle();
    expect(text.length).toBeGreaterThan(100_000); // it built the scene, not an empty shell

    // what the website's scene is made of. The stub director (phase 1's scene, the factory's own) is named by its body, `battleStart: () => false`: the bundler inlines a constant used once, so whether the identifier
    // `STUB_SHOT_DIRECTOR` survives depends on the order the modules come in (a new import edge in the shared data layer flipped it, FOC46-04), and the proof is that the stub is in, not what it is called.
    for (const needle of ['TableDirector', 'TableCamera', 'echoes-evrae-shots/1', 'paintedBFilter', 'PoseLatch', 'ThreeCameraSink', 'sky-roll', 'battleStart: () => false']) {
      expect(text.includes(needle), `${needle} should be in the bundle`).toBe(true);
    }

    // what is Bailey's own copy of the game, or only the dev server's
    const absent = [
      'stageFaythCamera', 'stageFaythSkin', 'FaythCamera', 'FfxCameraDirector', 'CameraVm', 'CameraSolver', 'ProgramBook', 'buildFfxCameraPrograms', 'loadFfxCameraPrograms', 'ffxcam-index',
      'FfxSkin', 'loadFfxModels', 'FfxAnimator', 'FfxSky', 'probeFfxLocal', '__ffx-local', '__ffxcam', '__ffxtable', 'exp-fayth-skin', 'exp-fayth-camera', 'FAYTH_ROSTER', 'farFit',
    ];
    for (const needle of absent) expect(text.includes(needle), `${needle} must not be in a production bundle`).toBe(false);
    // the model loader's own code: three's loader class is imported by `models.ts`, which is not here
    expect(text.includes('GLTFLoader')).toBe(false);

    // nothing of the programs in the table's data: no program id, no IR format, no script name, no call name
    for (const re of [/hiku15/, /system_01/, /ffx-cam-ir/, /\bcamSetPolar\b/, /\brefSetPos\b/, /\bcamReq\b/, /\bcamMoveAcc\b/, /\breadBtlChrProperty\b/]) {
      expect(text.match(re)?.[0], String(re)).toBeUndefined();
    }
  }, 240_000);
});
