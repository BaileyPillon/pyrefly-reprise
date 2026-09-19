// Chromium launch-arg sets for headless verification, and the switch between
// them. Node built-ins only (no dependencies) so any script — playwright.config.ts,
// tools/screenshot.mjs, an e2e helper — can import this without pulling in Playwright.
//
// Default is SwiftShader: deterministic, identical pixels everywhere this repo
// runs (this machine, CI, another dev's laptop), just slow (see docs/DEV.md
// "Fast browser" for the measured numbers). PYREFLY_BROWSER=gpu opts into the
// real GPU for local iteration speed only — never for golden-image screenshots
// (see the same section for why).

/** SwiftShader (software WebGL). The default. Deterministic; works on any machine. */
export const SWIFTSHADER_ARGS = Object.freeze([
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
]);

/**
 * Real-GPU headless. Opt-in only (`PYREFLY_BROWSER=gpu`). Needs a machine with
 * an actual GPU and up-to-date drivers; ANGLE picks D3D11 on Windows.
 * Renderer string should name the physical GPU, not "SwiftShader" or "Google
 * SwiftShader" — verify with tools/gpu-check.mjs if a run looks suspiciously slow.
 */
export const GPU_ARGS = Object.freeze([
  '--use-angle=d3d11',
  '--enable-gpu',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
]);

/** The two supported modes. Anything else in PYREFLY_BROWSER falls back to 'swiftshader'. */
export const BROWSER_MODES = Object.freeze(['swiftshader', 'gpu']);

/** Reads PYREFLY_BROWSER from the given env (defaults to process.env). */
export function resolveBrowserMode(env = process.env) {
  const raw = (env.PYREFLY_BROWSER ?? '').trim().toLowerCase();
  return BROWSER_MODES.includes(raw) ? raw : 'swiftshader';
}

/** Chromium launch args for a mode name (see resolveBrowserMode). */
export function chromiumArgsForMode(mode) {
  return mode === 'gpu' ? GPU_ARGS : SWIFTSHADER_ARGS;
}

/** Convenience: the args for whatever PYREFLY_BROWSER currently says. */
export function currentChromiumArgs(env = process.env) {
  return chromiumArgsForMode(resolveBrowserMode(env));
}
