/**
 * **Loading the camera programs**: `loadFfxCameraPrograms('evrae-airship')` fetches Bailey's own FFX camera data from the dev server's local route and hands the director a validated
 * {@link FfxCameraPrograms}, or null.
 *
 * The programs are a transcription of FFX's scripts, so (AGENTS.md hard rule 8) they are never in the repo, in `public/`, in `dist/` or on the site. They sit next to his converted models,
 * `D:\Tools\ffx-parity\assets\runtime\camera\<encounter>\` (`PYREFLY_FFX_LOCAL` overrides the root), and reach the game only through the dev server's read-only `/__ffx-local/` route
 * (`tools/vite-ffx-local.mjs`). The rules are the model probe's (`../ffx3d/localAssets.ts`):
 *
 * - **`import.meta.env.DEV` is checked first and read at call time.** A production bundle replaces it with `false`, drops the rest, and never asks for the route; nothing here fetches otherwise.
 * - **Nothing there is null, quietly**: no route, no folder (a 404), a network error. The chapter then plays its own camera, as the website always does.
 * - **Data that is there but wrong is null with ONE `console.warn`** naming the first thing wrong: an index that is not JSON or the wrong shape, a program file that cannot be fetched or fails
 *   validation, a tag that names a program the index does not list. Half a camera is worse than none, so nothing partial is returned.
 *
 * **The index** (`index.json`, written beside the programs by `D:\Tools\ffx-parity\assets\tools\camera-runtime\build-index.mjs` from the lane's `INDEX.json`; format `ffxcam-index/1`):
 *
 * ```
 * { format, encounter, source,
 *   programs: ["programs/<id>.json", ...],          // paths relative to the index, inside the folder
 *   scripts:  ["<formation script>", "<common script>"],      // candidate order
 *   tags:     { "<script>:<hook slot, decimal>:<tag>": "<program id>", ... },
 *   actions:  { party|monster|items: { "<ability id>": { command, steps: [{ at: "start"|"launch", tags: [..], worker }] } }, attack: { party?: row, monster?: row } },
 *   constants: { "<query name>": number },           // answers to value queries, e.g. the battle number
 *   range:    { tag, variable, chr, distanceProp, pullBack: { value, distance }, moveIn: { value, distance } } | null }
 * ```
 *
 * {@link buildFfxCameraPrograms} is the pure half (the shape checks, the programs through `./ir.ts`), so the tests and the checks against his folder run it without a network.
 *
 * Game case: FFX only.
 */

import { ProgramBook, type ActionRow, type ActionStep, type ActionTable, type FfxCameraPrograms, type RangeMove, type RangeSpec } from './book.ts';
import { checkProgram, type Program } from './ir.ts';

export const CAMERA_INDEX_FORMAT = 'ffxcam-index/1';

class IndexProblem extends Error {}

const bad = (why: string): never => {
  throw new IndexProblem(why);
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/** A path the index may name: relative to the index, inside the folder (the model probe's rule: no scheme, no drive, no backslash, no parent step, nothing that changes a URL's meaning). */
export function isIndexPath(v: unknown): v is string {
  if (typeof v !== 'string' || v === '' || v.length > 260) return false;
  if (/[\\:%?#\0]/.test(v) || v.startsWith('/') || v.endsWith('/')) return false;
  return v.split('/').every((step) => step !== '' && step !== '.' && step !== '..');
}

function readStep(raw: unknown, where: string): ActionStep {
  if (!isRecord(raw)) return bad(`${where}: a step is not an object`);
  const { at, tags, worker } = raw;
  if (at !== 'start' && at !== 'launch') return bad(`${where}: a step's "at" is ${JSON.stringify(at)}, not "start" or "launch"`);
  if (!Array.isArray(tags) || !tags.every(isInt)) return bad(`${where}: a step's tags are not a list of integers`);
  if (typeof worker !== 'boolean') return bad(`${where}: a step's "worker" is not true or false`);
  return { at, tags: tags as number[], worker };
}

function readRow(raw: unknown, where: string): ActionRow {
  if (!isRecord(raw) || !isInt(raw['command']) || !Array.isArray(raw['steps'])) return bad(`${where}: a row needs an integer "command" and a "steps" list`);
  return { command: raw['command'], steps: raw['steps'].map((s) => readStep(s, where)) };
}

function readTable(raw: unknown, where: string): Record<string, ActionRow> {
  if (raw === undefined) return {};
  if (!isRecord(raw)) return bad(`${where} is not an object`);
  const out: Record<string, ActionRow> = {};
  for (const [id, row] of Object.entries(raw)) out[id] = readRow(row, `${where}.${id}`);
  return out;
}

function readMove(raw: unknown, where: string): RangeMove {
  if (!isRecord(raw) || !isInt(raw['value']) || !isInt(raw['distance'])) return bad(`${where} needs integer "value" and "distance"`);
  return { value: raw['value'], distance: raw['distance'] };
}

function readRange(raw: unknown): RangeSpec | null {
  if (raw === null || raw === undefined) return null;
  if (!isRecord(raw) || !isInt(raw['tag']) || typeof raw['variable'] !== 'string' || !isInt(raw['chr']) || !isInt(raw['distanceProp'])) {
    return bad('range needs an integer "tag", a "variable" name, and integer "chr" and "distanceProp"');
  }
  return { tag: raw['tag'], variable: raw['variable'], chr: raw['chr'], distanceProp: raw['distanceProp'], pullBack: readMove(raw['pullBack'], 'range.pullBack'), moveIn: readMove(raw['moveIn'], 'range.moveIn') };
}

interface ParsedIndex {
  readonly encounter: string;
  readonly source: string;
  readonly files: readonly string[];
  readonly scripts: readonly string[];
  readonly tags: Readonly<Record<string, string>>;
  readonly actions: ActionTable;
  readonly constants: Readonly<Record<string, number>>;
  readonly range: RangeSpec | null;
}

function readIndex(raw: unknown): ParsedIndex {
  if (!isRecord(raw)) return bad('index.json is not an object');
  if (raw['format'] !== CAMERA_INDEX_FORMAT) return bad(`format is ${JSON.stringify(raw['format'])}, not "${CAMERA_INDEX_FORMAT}"`);
  const { encounter, source, programs, scripts, tags } = raw;
  if (typeof encounter !== 'string' || encounter === '') return bad('encounter is not a non-empty string');
  if (!Array.isArray(programs) || programs.length === 0 || !programs.every(isIndexPath)) return bad('programs is not a non-empty list of relative paths inside the folder');
  if (!Array.isArray(scripts) || scripts.length === 0 || !scripts.every((s) => typeof s === 'string' && s !== '')) return bad('scripts is not a non-empty list of names');
  if (!isRecord(tags)) return bad('tags is not an object');
  const tagMap: Record<string, string> = {};
  for (const [key, id] of Object.entries(tags)) {
    if (typeof id !== 'string' || id === '') return bad(`tags["${key}"] is not a program id`);
    tagMap[key] = id;
  }
  const actions = raw['actions'];
  if (!isRecord(actions)) return bad('actions is not an object');
  const attack = actions['attack'] === undefined ? {} : actions['attack'];
  if (!isRecord(attack)) return bad('actions.attack is not an object');
  const constants: Record<string, number> = {};
  if (raw['constants'] !== undefined) {
    if (!isRecord(raw['constants'])) return bad('constants is not an object');
    for (const [name, v] of Object.entries(raw['constants'])) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return bad(`constants.${name} is not a number`);
      constants[name] = v;
    }
  }
  return {
    encounter,
    source: typeof source === 'string' ? source : '',
    files: programs as string[],
    scripts: scripts as string[],
    tags: tagMap,
    actions: {
      party: readTable(actions['party'], 'actions.party'),
      monster: readTable(actions['monster'], 'actions.monster'),
      items: readTable(actions['items'], 'actions.items'),
      attack: {
        party: attack['party'] === undefined ? undefined : readRow(attack['party'], 'actions.attack.party'),
        monster: attack['monster'] === undefined ? undefined : readRow(attack['monster'], 'actions.attack.monster'),
      },
    },
    constants,
    range: readRange(raw['range']),
  };
}

/** The program file paths an index lists, or the first thing wrong with it. Pure. */
export function checkCameraIndex(raw: unknown): { files: readonly string[] } | { problem: string } {
  try {
    return { files: readIndex(raw).files };
  } catch (e) {
    if (e instanceof IndexProblem) return { problem: e.message };
    throw e;
  }
}

/**
 * The encounter's camera data from its parsed `index.json` and the program files it lists (`files`: the parsed JSON of each, by the path the index gave), or the first thing wrong, in a few words.
 * Pure: nothing is fetched or logged.
 */
export function buildFfxCameraPrograms(rawIndex: unknown, files: ReadonlyMap<string, unknown>): { programs: FfxCameraPrograms } | { problem: string } {
  try {
    const index = readIndex(rawIndex);
    const programs: Program[] = [];
    const ids = new Set<string>();
    for (const path of index.files) {
      if (!files.has(path)) return bad(`${path} was not provided`);
      const checked = checkProgram(files.get(path));
      if (!('program' in checked)) return bad(`${path}: ${checked.problem}`);
      if (ids.has(checked.program.id)) return bad(`${path}: program id ${checked.program.id} is listed twice`);
      ids.add(checked.program.id);
      programs.push(checked.program);
    }
    for (const [key, id] of Object.entries(index.tags)) if (!ids.has(id)) return bad(`tags["${key}"] names ${id}, which no listed file defines`);
    const built: FfxCameraPrograms = { encounter: index.encounter, source: index.source, book: new ProgramBook(programs, index.tags, index.scripts), actions: index.actions, constants: index.constants, range: index.range };
    return { programs: built };
  } catch (e) {
    if (e instanceof IndexProblem) return { problem: e.message };
    throw e;
  }
}

/** How many program files are fetched at once. */
const FETCH_AT_ONCE = 12;

/**
 * The encounter's camera data, or null. Null unless this is a dev server (`import.meta.env.DEV`) with the folder behind `/__ffx-local/camera/<encounter>/`; never throws. Data that is found and wrong
 * logs one `console.warn` and is null. `fetcher` is `fetch` (a test passes its own).
 */
export async function loadFfxCameraPrograms(encounter: string, fetcher: typeof fetch = (input, init) => fetch(input, init)): Promise<FfxCameraPrograms | null> {
  if (!import.meta.env.DEV) return null; // a production build never asks, and nothing below it is shipped
  const warn = (problem: string): null => {
    console.warn(`[ffx-local] ignoring the camera data for ${encounter}: ${problem}. The chapter plays with its own camera.`);
    return null;
  };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(encounter)) return warn('the encounter name is not a plain folder name');
  const base = `${import.meta.env.BASE_URL}__ffx-local/camera/${encounter}/`;
  let res: Response;
  try {
    res = await fetcher(`${base}index.json`, { cache: 'no-store' });
  } catch {
    return null; // no server behind the page: nothing to say
  }
  if (!res.ok) return null; // no folder, no index: the ordinary case for everyone but Bailey
  let rawIndex: unknown;
  try {
    rawIndex = await res.json();
  } catch {
    return warn('index.json is not valid JSON');
  }
  const checked = checkCameraIndex(rawIndex);
  if ('problem' in checked) return warn(checked.problem);
  const files = new Map<string, unknown>();
  for (let i = 0; i < checked.files.length; i += FETCH_AT_ONCE) {
    const batch = checked.files.slice(i, i + FETCH_AT_ONCE);
    try {
      const got = await Promise.all(
        batch.map(async (path) => {
          const r = await fetcher(`${base}${path}`, { cache: 'no-store' });
          if (!r.ok) throw new IndexProblem(`${path} could not be fetched (${r.status})`);
          return [path, (await r.json()) as unknown] as const;
        }),
      );
      for (const [path, json] of got) files.set(path, json);
    } catch (e) {
      return warn(e instanceof IndexProblem ? e.message : `a program file could not be read (${String(e)})`);
    }
  }
  const built = buildFfxCameraPrograms(rawIndex, files);
  return 'programs' in built ? built.programs : warn(built.problem);
}
