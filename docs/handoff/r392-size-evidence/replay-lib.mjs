// r392-size: the shared part of the replay tools (harness-replay.mjs, perspective.mjs): load the analysis modules of the current harness or of a git revision, and re-run the analysis on what
// the probe recorded (CONT_RAW_DIR=<dir> node critic/runner/lib/continuity.mjs ...). Both games: shared critic plumbing; it only reads.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const LIB = path.join(ROOT, 'critic', 'runner', 'lib');
const url = (p) => pathToFileURL(p).href;
const MODULES = ['continuity-pure', 'continuity-analyze', 'continuity-silhouette', 'continuity-summary'];

/** The analysis modules of a git revision, in a temp folder whose node_modules is the repo's (the silhouette module needs sharp); removed at exit, the junction first and on its own. */
export function oldHarnessDir(rev) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `r392-old-${rev}-`));
  for (const m of MODULES) fs.writeFileSync(path.join(dir, `${m}.mjs`), execFileSync('git', ['-C', ROOT, 'show', `${rev}:critic/runner/lib/${m}.mjs`], { maxBuffer: 1 << 26 }));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  process.on('exit', () => { try { fs.rmdirSync(path.join(dir, 'node_modules')); } catch { /* already gone */ } try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* temp */ } });
  return dir;
}

/** The harness modules in `dir` (the current ones by default). */
export async function loadHarness(dir = LIB) {
  return {
    analyze: await import(url(path.join(dir, 'continuity-analyze.mjs'))),
    sil: await import(url(path.join(dir, 'continuity-silhouette.mjs'))),
    pure: await import(url(path.join(dir, 'continuity-pure.mjs'))),
  };
}

export const policy = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'critic', 'policy.json'), 'utf8')).continuity;

/** A painting's master from public/art, by the URL the page used (a shipped .webp or @2x file is its master's .png). */
export async function fetchImage(u) {
  const p = decodeURIComponent(String(u).replace(/[?#].*$/, '').replace(/^https?:\/\/[^/]+/, '')).replace(/@\dx(\.[a-z]+)$/i, '$1').replace(/\.webp$/i, '.png');
  const f = path.join(ROOT, 'public', p.replace(/^\//, ''));
  if (!fs.existsSync(f)) throw new Error(`no master for ${u}`);
  return fs.readFileSync(f);
}

/** Re-run the analysis of one raw capture with harness `h`; `measure` is the pose registration records file. */
export async function analyse(file, h, measure = path.join(ROOT, 'docs', 'target', 'pose-measure.json')) {
  const { meta, records } = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));
  const records_ = h.sil.loadPoseMeasure(measure);
  const { anchors } = await h.analyze.anchorsForPoses({ poses: meta.poses, fetchImage, measure: records_ });
  return { meta, records, anchors, res: h.analyze.analyzeRun({ meta, records, anchors, cfg: policy() }) };
}

/** The art subject of a pose key (`/art/characters/<subject>/...`). */
export const subjOf = (meta, k) => ((meta.poses[k]?.url ?? '').match(/\/characters\/([^/]+)\//) ?? [])[1] ?? '?';

/** `--name=value` and `--flag` arguments, and the rest. */
export function parseArgs(argv) {
  const args = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return [m[1], m[2] ?? true]; }));
  return { args, rest: argv.filter((a) => !a.startsWith('--')) };
}

/** The camera's perspective at a frame: the plane's top edge over its bottom edge on screen (1.00 = flat; larger = the top is nearer the camera). */
export function perspectiveOf(q, k1600 = 1) {
  const d = (a, b) => Math.hypot(q[a * 2] - q[b * 2], q[a * 2 + 1] - q[b * 2 + 1]) * k1600;
  return d(0, 1) / d(3, 2);
}
