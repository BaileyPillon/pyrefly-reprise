/**
 * **The pose model: one reading of a character painting, the way the game draws it** (pose continuity, W1; both games).
 *
 * `readPose(subject, pose)` answers, for one painting of `public/art/characters/<subject>/<pose>.png`: what class it is in, how big and how well-footed
 * it is drawn against its idle, how its silhouette overlaps the idle's, and what the pixels alone say (the independent second reading). It is the one
 * model the gate (`tools/pose-gate.mjs`), the static census and the critic read, so the three cannot disagree:
 *
 *   PaintedScale (the idle's pixel scale x the pose's scale, clamped to 0.35..2.2) + PoseRegistration (stance slid onto the idle's, feetRow, upright)
 *   + HeadLock (the registered head held to the idle's within 0.9..1.1), in `pose-geometry.mjs`; the alpha, the stance and the silhouette in `pose-pixels.mjs`.
 *
 * Built from angle 1 of the 2026-10-16 survey (`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/work/measure_all.py`); against its 1,106 readings this port
 * agrees (see `tests/unit/engine/pose-model.test.ts` and the commit). It reads files and a table; it writes nothing.
 *
 * ```js
 * const r = await readPose('lulu', 'hurt');
 * r.class        // 'standing'
 * r.stature      // 0.907   the figure's height over the idle's, as drawn (head lock applied)
 * r.headReal     // 1.356   the head the player sees over the idle's (a hold's real ratio, not the lock's)
 * r.feetPx       // { x: 309, row: 1136 }   the stance read from the pixels
 * r.fromPixels   // the readings that trust no table (alpha baseline, silhouette stance, height from the alpha baseline)
 * ```
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { gameOf, isPropsOut, mirrorFor, parseFacing, poseClassOf, sideOf, subjectKind } from './pose-kinds.mjs';
import { makeRef, placePose } from './pose-geometry.mjs';
import { checkHires } from './pose-hires.mjs';
import { drawnMask, headBoxOn, maskIou, readPaint } from './pose-pixels.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TABLE_FILES = [['ffx', 'poseRegistrationFfx.ts', 'POSE_REGISTRATION_FFX'], ['ffx2', 'poseRegistrationFfx2.ts', 'POSE_REGISTRATION_FFX2'], ['foes', 'poseRegistrationFoes.ts', 'POSE_REGISTRATION_FOES'], ['exp', 'poseRegistrationExp.ts', 'POSE_REGISTRATION_EXP']];

const facingOf = (m) => parseFacing(m.sidecar?.facing);
const round = (v, n = 4) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10 ** n) / 10 ** n);

/**
 * Everything the model reads besides pixels. Pass `table`, `tableSource`, `koScale` and `records` to supply them (a test, a fixture, a candidate table);
 * otherwise they are the repository's: `src/data/art/poseRegistration*.ts`, `src/engine/KoPoseScale.ts`, `docs/target/pose-measure.json`.
 * `hires: true` also checks each painting's `@2x`/`@3x`/`@4x` masters against it (`pose-hires.mjs`; the gate asks, the critic and the stamp do not).
 * @returns {Promise<{root:string, artDir:string, table:object, tableSource:Record<string,string>, koScale:object, records:object, refs:Map<string,object>}>}
 */
export async function loadModelInputs({ root = ROOT, artDir, table, tableSource, koScale, records, hires = false } = {}) {
  const dir = artDir ?? join(root, 'public', 'art');
  let tbl = table;
  let src = tableSource;
  if (!tbl) {
    tbl = {};
    src = {};
    for (const [tag, file, name] of TABLE_FILES) {
      const mod = await import(pathToFileURL(join(root, 'src', 'data', 'art', file)).href);
      for (const [s, rows] of Object.entries(mod[name])) {
        tbl[s] = { ...(tbl[s] ?? {}), ...rows };
        src[s] = tag;
      }
    }
  }
  const ko = koScale ?? (await import(pathToFileURL(join(root, 'src', 'engine', 'KoPoseScale.ts')).href)).KO_POSE_SCALE;
  let rec = records;
  if (!rec) {
    const p = join(root, 'docs', 'target', 'pose-measure.json');
    rec = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { subjects: {} };
  }
  return { root, artDir: dir, table: tbl, tableSource: src ?? {}, koScale: ko, records: rec, refs: new Map(), hires };
}

/**
 * Every subject folder under `characters/`, sorted. A folder that is a link or a junction counts (`statSync` follows it): the build follows it into `dist`, so
 * a gate that did not would pass paintings it never read.
 */
export function listSubjects(inputs) {
  const dir = join(inputs.artDir, 'characters');
  const isDir = (d) => d.isDirectory() || (d.isSymbolicLink() && statSync(join(dir, d.name), { throwIfNoEntry: false })?.isDirectory() === true);
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter(isDir).map((d) => d.name).sort() : [];
}

/** The paintings the game can ask for: no `@2x` masters, no `.1` candidates. */
export function listPoses(inputs, subject) {
  const dir = join(inputs.artDir, 'characters', subject);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).filter((n) => !n.includes('@') && !n.includes('.')).sort();
}

const pngOf = (inputs, subject, pose) => join(inputs.artDir, 'characters', subject, `${pose}.png`);

/** The pose every other is read against: the idle; else the first that is not laid down. */
async function referenceName(inputs, subject, poses) {
  if (poses.includes('idle')) return 'idle';
  for (const n of poses) {
    const meta = await sharp(pngOf(inputs, subject, n)).metadata();
    if (!(meta.width > meta.height * 1.15)) return n;
  }
  return poses[0];
}

/** The idle's side of one subject, built once: its measurements, its placement and its silhouette on the grid. */
export async function referenceOf(inputs, subject) {
  const hit = inputs.refs.get(subject);
  if (hit) return hit;
  const poses = listPoses(inputs, subject);
  if (!poses.length) throw new Error(`pose-model: no paintings for ${subject} under ${inputs.artDir}`);
  const refName = await referenceName(inputs, subject, poses);
  const refM = await readPaint(pngOf(inputs, subject, refName), refName);
  const reg = inputs.table[subject] ?? {};
  const kind = subjectKind(subject);
  const game = gameOf(subject, refM.sidecar.game, inputs.tableSource[subject]);
  const R = makeRef({ subject, refName, ref: refM, reg, koScale: inputs.koScale, want: sideOf(subject), facingOf, mirrorFor });
  R.kind = kind;
  R.game = game;
  R.poses = poses;
  R.pixelFigH = refM.engineBox && refM.engineBase ? (refM.engineBase - refM.engineBox.y0) * R.upp : null; // the idle's height from its own alpha baseline
  R.mask = drawnMask(refM, R.upp, R.anchor, 0, R.mirror);
  inputs.refs.set(subject, R);
  return R;
}

/** One painting's reading against the subject's reference. */
async function readOne(inputs, R, pose) {
  const { subject } = R;
  const m = pose === R.refName ? R.M : await readPaint(pngOf(inputs, subject, pose), pose);
  const row = inputs.table[subject]?.[pose] ?? {};
  const rec = inputs.records.subjects?.[subject]?.poses?.[pose] ?? {};
  const g = placePose(R, m, { row, rec, koScale: inputs.koScale, facingOf, mirrorFor });
  const cls = poseClassOf({ pose, isRef: g.isRef, prone: g.prone, kind: R.kind });
  const iou = g.isRef ? 1 : maskIou(drawnMask(m, g.drawn.upp, g.drawn.anchor, g.drawn.shift, g.drawn.mirror), R.mask);
  const baseline = m.engineBase ? m.engineBase : m.H;
  const heightPx = m.engineBox ? baseline - m.engineBox.y0 : null;
  const hasStanceBoth = !!m.stance && R.stanceMeasured !== null;
  return {
    subject, pose, kind: R.kind, game: R.game, class: cls, isRef: g.isRef, refPose: R.refName,
    sha: m.sha, size: [m.W, m.H], empty: m.empty, solidity: round(m.empty ? null : m.area / ((m.bbox[2] - m.bbox[0]) * (m.bbox[3] - m.bbox[1]))), areaOverIdle: round(R.M.area ? (m.area * g.uppEff ** 2) / (R.M.area * R.upp ** 2) : null),
    headBox: (() => { const b = headBoxOn(m, row.head); return b ? { cy: round(b.cy), coverage: round(b.coverage) } : null; })(),
    hasRow: g.hasRow, hasHead: g.hasHead, hasStance: g.hasStance, held: g.held, heldHeadRatio: g.heldHeadRatio, ruled: g.ruled, realHeadRatio: round(g.realHeadRatio), heldGap: round(g.heldGap),
    // a raised sword or staff stands above the head: the band reads head to soles (`bodyStature`), not the box (pose-kinds.mjs PROPS_OUT_POSES)
    propsOut: (cls === 'standing' || cls === 'low') && isPropsOut(pose),
    refHasHead: !!R.head, refWide: R.M.proneRaw,
    status: row.status ?? null, rowSha: row.sha ?? null,
    scale: g.scale, scaleSrc: g.scaleSrc, anchorRow: g.anchor, anchorSrc: g.anchorSrc, clamped: g.clamped, lock: round(g.lock), prone: g.prone, mirror: g.mirror,
    stature: round(g.stature), statureTable: round(g.statureTable), bodyStature: round(g.bodyStature), headReal: round(g.headReal), headTable: round(g.headTable),
    lengthRatio: round(g.lengthRatio), massRatio: round(R.M.mass ? (m.mass * g.uppEff) / (R.M.mass * R.upp) : null), iou: round(iou),
    feetPx: m.stance ? { x: m.stance.x, row: m.stance.row } : null,
    feet: g.feetDx === null || g.feetDy === null ? null : { dx: round(g.feetDx), dy: round(g.feetDy) },
    feetRowGap: round(g.feetRowGap), sinkIdle: round(g.sinkIdle),
    stanceRegistered: g.stanceRegistered, stanceDiffPx: g.stanceDiffPx === null ? null : round(g.stanceDiffPx, 1),
    // the readings that trust no table: the file's own alpha and silhouette
    fromPixels: {
      size: [m.W, m.H], alphaBaseline: m.engineBase, alphaBox: m.engineBox, bbox: m.bbox,
      stanceX: m.stance ? m.stance.x : null, stanceRow: m.stance ? m.stance.row : null,
      figureHeightPx: heightPx,
      heightOverIdle: round(heightPx !== null && R.pixelFigH ? (heightPx * g.uppEff) / R.pixelFigH : null),
      feetRowGap: round(g.feetRowGap), sinkIdle: round(g.sinkIdle),
      stanceBothRead: hasStanceBoth,
    },
    drawn: { upp: g.uppEff, anchor: g.anchor, shift: g.shift, mirror: g.mirror },
    // the hi-DPI masters beside it, when the caller asked (`loadModelInputs({ hires: true })`): null when not checked
    hires: inputs.hires ? await checkHires(join(inputs.artDir, 'characters', subject), pose, m) : null,
  };
}

/**
 * Read every painting of a subject, or only `poses`. The idle is decoded once; each other painting is decoded, read and dropped.
 * @returns {Promise<Array<ReturnType<typeof readOne> extends Promise<infer T> ? T : never>>}
 */
export async function readSubject(inputs, subject, { poses } = {}) {
  const R = await referenceOf(inputs, subject);
  const names = poses ?? R.poses;
  const out = [];
  for (const pose of names) {
    if (!R.poses.includes(pose)) throw new Error(`pose-model: ${subject}/${pose}.png does not exist under ${inputs.artDir}`);
    out.push(await readOne(inputs, R, pose));
  }
  return out;
}

const defaults = new Map();

/**
 * The reading of one painting. `opts.inputs` (from {@link loadModelInputs}) is reused across calls; without it the repository's own are loaded once.
 * @param {string} subject the art id (`lulu`, `paine-lady-luck`) @param {string} pose the pose name (`hurt`)
 */
export async function readPose(subject, pose, opts = {}) {
  let inputs = opts.inputs;
  if (!inputs) {
    const key = `${opts.root ?? ROOT}|${opts.artDir ?? ''}`;
    if (!defaults.has(key)) defaults.set(key, loadModelInputs({ root: opts.root, artDir: opts.artDir }));
    inputs = await defaults.get(key);
  }
  return (await readSubject(inputs, subject, { poses: [pose] }))[0];
}

/**
 * Every painting of the given subjects (default: all), `concurrency` subjects at a time. `onSubject(subject, readings)` is called as each finishes.
 * @returns {Promise<object[]>} the readings in subject order
 */
export async function readAll(inputs, { subjects, concurrency = 2, onSubject } = {}) {
  const todo = subjects ?? listSubjects(inputs);
  const results = new Array(todo.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= todo.length) return;
      results[i] = await readSubject(inputs, todo[i]);
      inputs.refs.delete(todo[i]); // a census does not keep a thousand silhouettes
      onSubject?.(todo[i], results[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return results.flat();
}
