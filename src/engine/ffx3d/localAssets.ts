/**
 * The probe for Bailey's own converted FFX files (the hidden Fayth chapter's `ffx` skin; `docs/plans/fayth-3d.md`): is there a `/__ffx-local/` route behind this page, and what does its manifest
 * list?
 *
 * The files are his own copy of the game, converted on his PC (glTF and PNG under `D:\Tools\ffx-parity\assets\runtime\`), served read-only by the dev server alone (`tools/vite-ffx-local.mjs`).
 * They are never in the repo, in `public/`, in `dist/` or on the site (AGENTS.md hard rule 8). So the answer here is **no** everywhere but a dev server that has the folder:
 *
 * - **`import.meta.env.DEV` is checked first and read at call time.** A production bundle replaces it with `false` and drops the rest of {@link probeFfxLocal}, so it never asks for the route and has
 *   no model loader behind it; `tests/unit/ffx-local-guard.test.ts` pins that nothing is fetched when it is false.
 * - **Nothing there is `null`, quietly**: no route, no folder (a 404), a network error. The game then plays with its painted art, as the website always does.
 * - **A manifest that is there but wrong is `null` with one `console.warn`** (dev only, by construction): not JSON, or JSON of the wrong shape ({@link checkFfxLocalManifest} names the first thing wrong).
 *   A half-written or hand-edited manifest never reaches the scene.
 *
 * The manifest is written by the converter lane to the root of the folder as `manifest.json`, so the route is `/__ffx-local/manifest.json`, and every `file` in it is a path relative to the manifest
 * (so under the route). Nothing calls the probe yet: the scene's `ffx` skin reads it in a later phase.
 *
 * Game case: FFX only (the files are FFX's).
 */

/** One actor's model: a file relative to the manifest, and the model's height as the game stores it. */
export interface FfxLocalActor {
  /** The glTF binary, relative to the manifest (`evrae/tidus.glb`). */
  readonly file: string;
  /** The model's height in the game's own units (`units: 'ffx'`). Raw model heights are not proportions between characters (`party-stature.ts`): this only sizes the model against itself. */
  readonly rawHeight: number;
}

/**
 * What the converter writes to `manifest.json` (the shape the coordinator fixed, 2026-10-10). `actors` is keyed by the engine's combatant ids: `evrae`, `tidus`, `wakka`, `rikku`, and later `lulu`,
 * `auron`, `kimahri`. The two conventions are the only ones the converter writes, and the only ones accepted: a model that is not Y-up in the game's units would be drawn sideways or at the wrong
 * size, so a manifest that says otherwise is refused rather than guessed at.
 */
export interface FfxLocalManifest {
  readonly version: 1;
  /** The encounter the files are for, as the chapter's enemy group id (`evrae-airship`). */
  readonly encounter: string;
  readonly upAxis: 'y';
  readonly units: 'ffx';
  /** The stage's glTF (the Fahrenheit's deck), relative to the manifest. */
  readonly stage: { readonly file: string };
  /** The model of each combatant, by combatant id. */
  readonly actors: Readonly<Record<string, FfxLocalActor>>;
  /** Where the files came from, in words (provenance for whoever reads the manifest; never shown). */
  readonly source: string;
}

/** The manifest's address under the dev server's base. */
const MANIFEST_PATH = '__ffx-local/manifest.json';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * A path the manifest may name: relative to the manifest, inside the route. No scheme or drive letter, no absolute path, no backslash, no parent step, no empty step, and none of the characters that
 * would change what a URL means when the path is appended to it (`%`, `?`, `#`, NUL).
 */
export function isManifestPath(v: unknown): v is string {
  if (typeof v !== 'string' || v === '' || v.length > 260) return false;
  if (/[\\:%?#\0]/.test(v) || v.startsWith('/') || v.endsWith('/')) return false;
  return v.split('/').every((step) => step !== '' && step !== '.' && step !== '..');
}

/** Either the manifest, typed, or the first thing wrong with `raw` in a few words. Pure: nothing is logged. */
export function checkFfxLocalManifest(raw: unknown): { manifest: FfxLocalManifest } | { problem: string } {
  if (!isRecord(raw)) return { problem: 'it is not an object' };
  if (raw['version'] !== 1) return { problem: `version is ${JSON.stringify(raw['version'])}, not 1` };
  const { encounter, upAxis, units, stage, actors, source } = raw;
  if (typeof encounter !== 'string' || encounter === '') return { problem: 'encounter is not a non-empty string' };
  if (upAxis !== 'y') return { problem: `upAxis is ${JSON.stringify(upAxis)}, not "y"` };
  if (units !== 'ffx') return { problem: `units is ${JSON.stringify(units)}, not "ffx"` };
  if (!isRecord(stage) || !isManifestPath(stage['file'])) return { problem: 'stage.file is not a relative path inside the folder' };
  if (!isRecord(actors)) return { problem: 'actors is not an object keyed by combatant id' };
  if (typeof source !== 'string') return { problem: 'source is not a string' };
  const out: Record<string, FfxLocalActor> = {};
  for (const [id, actor] of Object.entries(actors)) {
    if (id === '' || !isRecord(actor)) return { problem: `actors.${id} is not an object` };
    const { file, rawHeight } = actor;
    if (!isManifestPath(file)) return { problem: `actors.${id}.file is not a relative path inside the folder` };
    if (typeof rawHeight !== 'number' || !Number.isFinite(rawHeight) || rawHeight <= 0) return { problem: `actors.${id}.rawHeight is not a positive number` };
    out[id] = { file, rawHeight };
  }
  return { manifest: { version: 1, encounter, upAxis: 'y', units: 'ffx', stage: { file: stage['file'] }, actors: out, source } };
}

/** A manifest of the right shape, or null. Pure; the quiet half of {@link checkFfxLocalManifest}. */
export function parseFfxLocalManifest(raw: unknown): FfxLocalManifest | null {
  const checked = checkFfxLocalManifest(raw);
  return 'manifest' in checked ? checked.manifest : null;
}

/**
 * The local files' manifest, or null. Null unless this is a dev server (`import.meta.env.DEV`) with the folder behind `/__ffx-local/`; never throws. A manifest that is found and malformed logs one
 * `console.warn` and is null.
 */
export async function probeFfxLocal(): Promise<FfxLocalManifest | null> {
  if (!import.meta.env.DEV) return null; // a production build never asks, and nothing below it is shipped
  let res: Response;
  try {
    res = await fetch(`${import.meta.env.BASE_URL}${MANIFEST_PATH}`, { cache: 'no-store' });
  } catch {
    return null; // no server behind the page: nothing to say
  }
  if (!res.ok) return null; // no folder, no manifest: the ordinary case for everyone but Bailey
  let problem: string;
  try {
    const checked = checkFfxLocalManifest(await res.json());
    if ('manifest' in checked) return checked.manifest;
    problem = checked.problem;
  } catch {
    problem = 'it is not valid JSON';
  }
  console.warn(`[ffx-local] ignoring ${MANIFEST_PATH}: ${problem}. The chapter plays with its painted art.`);
  return null;
}

/**
 * The URL of a file under the route, from a path relative to the manifest (`evrae/tidus.glb`): the one way the model loader (`./models.ts`) names a local file. It builds a string and asks for nothing; only the
 * `ffx` skin calls it, after {@link probeFfxLocal} found the folder.
 */
export function ffxLocalUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${MANIFEST_PATH.slice(0, MANIFEST_PATH.lastIndexOf('/') + 1)}${path}`;
}
