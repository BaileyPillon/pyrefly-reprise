/**
 * **The lane kit's pure parts** (the rig program, 2026-10-18; both games, shared plumbing): everything the recorder decides that needs no browser, no server and no disk, so the unit tests
 * (`tests/unit/tools/rig-lane.test.ts`) can read it. Arguments, the subject registry (`lane-subjects.json`), which poses to play, the scratch Vite config, the lock files, and which guard files
 * stop a run.
 */

/** `--key value`, `--flag`, and positionals: `{ _: [...], key: 'value', flag: true }`. A value that starts with `--` is a flag's, not the previous key's. */
export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const eq = a.indexOf('=');
    if (eq > 0) { out[a.slice(2, eq)] = a.slice(eq + 1); continue; }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { out[a.slice(2)] = next; i++; } else out[a.slice(2)] = true;
  }
  return out;
}

/** The modes `play.mjs` knows. `poses` and `fight` need no menu choices; `cast` needs `castKeys`. */
export const MODES = Object.freeze(['poses', 'cast', 'hurtko', 'fight', 'anim', 'anim2']);

/** The fields a subject entry of `lane-subjects.json` must have, and what each means. */
export const SUBJECT_FIELDS = Object.freeze({
  actor: 'the combatant id the stage knows the figure by (`stage.actor(id)`)',
  chapter: '{ door, id }: the hidden chapter\'s door word typed on the chapter board, and the chapter id the board must then report',
  poses: 'the poses to play for the authored clips',
  track: '{ head, feet, centroid, hand?, tip? }: the rig landmark names the tracker follows through the live camera (`feet` may list several)',
});

/** Problems with one registry entry (an empty list: it can be recorded). */
export function validateSubject(id, spec) {
  const out = [];
  const bad = (m) => out.push(`${id}: ${m}`);
  if (!spec || typeof spec !== 'object') return [`${id}: not an object`];
  if (typeof spec.actor !== 'string' || !spec.actor) bad('no actor');
  if (!spec.chapter || typeof spec.chapter.door !== 'string' || !/^[a-z0-9]+$/.test(spec.chapter.door) || typeof spec.chapter.id !== 'string') bad('chapter needs a door word (lowercase letters and digits: it is typed key by key) and the chapter id');
  if (!Array.isArray(spec.poses) || !spec.poses.length || spec.poses.some((p) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p))) bad('poses must be a list of pose names');
  const t = spec.track;
  if (!t || typeof t.head !== 'string' || typeof t.centroid !== 'string' || !(typeof t.feet === 'string' || (Array.isArray(t.feet) && t.feet.length))) bad('track needs head, feet and centroid landmark names');
  if (spec.castKeys !== undefined && (!Array.isArray(spec.castKeys) || spec.castKeys.some((k) => typeof k !== 'string'))) bad('castKeys must be a list of key names');
  return out;
}

/** The registry entry for `id`, or throws with the reason (and the ids it does have). */
export function subjectSpec(registry, id) {
  const spec = registry?.subjects?.[id];
  if (!spec) throw new Error(`lane: no subject ${JSON.stringify(id)} in lane-subjects.json (it has ${Object.keys(registry?.subjects ?? {}).join(', ') || 'none'}); \`lane.py new\` adds one`);
  const problems = validateSubject(id, spec);
  if (problems.length) throw new Error(`lane: ${problems.join('; ')}`);
  return spec;
}

/** The poses to play: `arg` (a comma list, or `all`/absent for the entry's own list), each checked against the entry's list unless `any` is set. */
export function resolvePoses(spec, arg, { any = false } = {}) {
  if (arg === undefined || arg === true || arg === 'all') return [...spec.poses];
  const want = String(arg).split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = any ? [] : want.filter((p) => !spec.poses.includes(p));
  if (unknown.length) throw new Error(`lane: ${unknown.join(', ')} is not among ${spec.poses.join(', ')} (--any-pose to play it anyway)`);
  return want;
}

/** The landmark names the tracker reads: `feet` becomes a list. */
export function trackerPoints(spec) {
  const t = spec.track;
  return { head: t.head, feet: Array.isArray(t.feet) ? t.feet : [t.feet], centroid: t.centroid, hand: t.hand ?? null, tip: t.tip ?? null };
}

/**
 * The scratch Vite config text: the repository's own config plus the rig route (`tools/vite-rig-art.mjs`), a private cache dir, no file watching, the port the caller picked. It lives beside
 * `vite.config.ts` while the server runs (a config outside the project cannot import it by a relative path) and is removed on exit. Never committed.
 */
export function viteConfigText({ cacheDir, rigsDir, aliases }) {
  const alias = Object.entries(aliases ?? {}).map(([k, v]) => `${k}=${v}`).join(',');
  return `// lane kit scratch (tools/rig/lane/record.mjs): the repo's vite config plus the rig route. Removed when the recorder exits. NOT committed.
import { mergeConfig } from 'vite';
import factory from '../vite.config.ts';
import { parseAliases, pyreflyRigArt } from './vite-rig-art.mjs';

export default (env) =>
  mergeConfig(factory(env), {
    cacheDir: ${JSON.stringify(cacheDir)},
    plugins: [pyreflyRigArt(${JSON.stringify(rigsDir)}, parseAliases(${JSON.stringify(alias)}))],
    server: { host: '127.0.0.1', strictPort: true, fs: { strict: false }, watch: { ignored: ['**/*'] } },
  });
`;
}

/** What a lock file says: `free` (absent), `held` (a live pid wrote it), `stale` (its pid is gone, or it is not a lock). `alive(pid)` is the caller's. */
export function lockStatus(text, alive) {
  if (text === null || text === undefined) return { state: 'free' };
  let lock = null;
  try { lock = JSON.parse(text); } catch { /* not ours */ }
  if (!lock || !Number.isInteger(lock.pid)) return { state: 'stale', why: 'not a lock file' };
  return alive(lock.pid) ? { state: 'held', by: lock } : { state: 'stale', why: `pid ${lock.pid} is gone`, by: lock };
}

/** The guard files: `REVIEW-BROWSER` (a review is using the browser: no Vite, no browser at all) and `GPU-QUIET` (the GPU must be idle: no recording). `exists(path)` is the caller's. */
export const GUARD_DIR = 'D:/Tools/pyrefly-scratch';
export function guards(exists, dir = GUARD_DIR) {
  const out = [];
  if (exists(`${dir}/REVIEW-BROWSER`)) out.push('REVIEW-BROWSER');
  if (exists(`${dir}/GPU-QUIET`)) out.push('GPU-QUIET');
  return out;
}

/** The files a run of `mode` must leave in its output folder to count as done (the recorder retries a run that did not). */
export function expectedOutputs(mode) {
  return { poses: ['poses-info.json'], cast: ['window-log.json', 'jerks.json'], hurtko: ['window-log.json', 'jerks.json'], fight: ['jerks.json'], anim: ['segments.json', 'console.json'], anim2: ['segments.json', 'console.json'] }[mode] ?? [];
}

/** The virtual-clock step pattern that makes 60 Hz out of whole milliseconds: 16, 17, 17 repeating (50 ms per 3 frames). */
export const FRAME_PATTERN = Object.freeze([16, 17, 17]);
export const frameMs = (n) => FRAME_PATTERN[n % 3];
