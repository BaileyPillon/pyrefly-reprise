#!/usr/bin/env node
/**
 * **Read a kept continuity recording again, offline** (method check 2026-10-26 step 0 and section 3.1; pc-residues lane, 2026-10-28; both games, critic tooling only).
 *
 * `CONT_RAW_DIR=<dir> node critic/runner/lib/continuity.mjs ...` keeps what the in-page probe recorded (every frame's plane corners, the swaps, the battle log) as
 * `<dir>/<chapter>.json.gz`. This reads such a file with THIS tree's harness (`continuity-analyze.mjs`, the policy, the pose table beside it) and prints the chapter's
 * numbers, so a tool change can be checked against a run that already happened and any later tool can re-read the same run. No browser, no server: the paintings are
 * read from the art folder on disk (a shipped WebP is read as the PNG master it was derived from), and nothing is written but the file `--out` names.
 *
 *   node tools/continuity-reread.mjs <raw.json.gz> [--table=<pose-measure.json>] [--art=<dir>] [--waivers=<file>] [--out=<file>] [--list] [--gated] [--cuts[=<px>]] [--swap=<fig>:<from>:<to>]
 *
 *   --table    the registration records the recording was made against (default: this tree's docs/target/pose-measure.json). A recording keeps the planes AS DRAWN, so a
 *              table that changed since (a pose re-registered) is read against the wrong scale: use the table the run's build had.
 *   --art      the art folder (default PYREFLY_ART_DIR, else public/art). Read only.
 *   --list     print the swap jerks of 40 px or more, the snaps and the CHK-026 failures.
 *   --gated    (held-chapters lane) print only the swap jerks the harness GATES, by figure and pair, with how the swap was made (a cut, a planned smear, a blend of n frames): the readings a
 *              `SCOPE_EXCEPTIONS` "Lifts when" is written in.
 *   --cuts     (held-chapters lane) the planned-cut jerks (a swap jerk at a planned smear, excused or not) of at least <px> (default 120): the count, a minute's rate, and by pair.
 *   --swap     print every swap of one figure and pose pair (e.g. auron:attack:follow) with its head, card-space head (probe 3 recordings), height and feet readings.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = (f) => import(pathToFileURL(path.join(ROOT, 'critic', 'runner', 'lib', f)).href);

/** `--k=v` options of an argv. */
function parseOpts(argv) {
  const o = {};
  const files = [];
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) o[m[1]] = m[2] ?? true;
    else files.push(a);
  }
  return { o, files };
}

/** A fetchImage over a folder: `/art/characters/x/idle.png` (or `.webp`) is `<art>/characters/x/idle.png`. */
export function folderFetcher(artDir) {
  return async (url) => {
    const rel = String(url).replace(/^\/?art\//, '').replace(/\.webp$/i, '.png');
    const file = path.join(artDir, rel);
    return fs.readFileSync(file);
  };
}

/**
 * Read a kept recording again. Returns `{ meta, records, res, notes, cfg, measure }`.
 * @param {string} rawFile
 * @param {{table?: string, art?: string, waivers?: string|null, root?: string, cfgOverride?: object|null, mutate?: ((rec: {meta: object, records: object[]}) => void)|null}} [opt]
 *   `mutate` edits the parsed recording in place before it is read (what a different fade shape would have recorded: a prediction made from a run that already happened, never a measurement)
 */
export async function reread(rawFile, { table, art, waivers = null, root = ROOT, cfgOverride = null, mutate = null } = {}) {
  const { anchorsForPoses, analyzeRun } = await L('continuity-analyze.mjs');
  const { loadPoseMeasure } = await L('continuity-silhouette.mjs');
  const { loadPoseWaivers } = await L('continuity-waivers.mjs');
  const { continuityConfig, waiverPathFor } = await L('continuity.mjs');
  const { meta, records } = JSON.parse(zlib.gunzipSync(fs.readFileSync(rawFile)).toString('utf8'));
  if (mutate) mutate({ meta, records });
  const cfg = continuityConfig();
  if (cfgOverride) for (const [k, v] of Object.entries(cfgOverride)) cfg[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(cfg[k] ?? {}), ...v } : v;
  const tablePath = path.resolve(table ?? path.join(root, 'docs', 'target', 'pose-measure.json'));
  const measure = loadPoseMeasure(tablePath);
  if (!measure) throw new Error(`the pose table ${tablePath} cannot be read`);
  const ledger = loadPoseWaivers(waivers ?? waiverPathFor({ poseMeasurePath: tablePath, poseWaiversPath: null, cfg, root }));
  const artDir = path.resolve(art ?? process.env.PYREFLY_ART_DIR ?? path.join(root, 'public', 'art'));
  const { anchors, notes } = await anchorsForPoses({ poses: meta.poses, fetchImage: folderFetcher(artDir), measure, waivers: ledger });
  const res = analyzeRun({ meta, records, anchors, cfg, measure });
  return { meta, records, res, notes, cfg, measure };
}

const f = (v) => (v === null || v === undefined ? '-' : String(v));

/** The swap jerks the harness GATES (CHK-027): at a swap, not the figure travelling, not under the wash, not inside a planned smear's cap, not a dissolve's own travel, not a staged twirl step. Pure. */
export function gatedSwapJerks(res) {
  return res.jerks.filter((j) => j.atSwap && !j.commonMode && !j.covered && !j.smeared && !j.stagedExcused && !j.dissolveTravel);
}

/** The jerks at a planned smear's swap of at least `min` px, excused (`smeared`) or not, each with the swap it fell at, and their rate a minute. Pure. */
export function plannedCutJerks(res, min = 120) {
  const rows = [];
  for (const j of res.jerks) {
    if (!(j.atSwap && !j.commonMode && !j.covered && j.px >= min)) continue;
    const s = res.swaps.find((x) => x.fi === j.fi && x.smear && j.n >= x.startFrame - 1 && j.n <= x.n + 2);
    if (s) rows.push({ jerk: j, swap: s, excused: Boolean(j.smeared) });
  }
  const minutes = (res.summary?.battleSeconds ?? 0) / 60;
  return { rows, perMinute: minutes > 0 ? Math.round((rows.length / minutes) * 10) / 10 : null };
}

function swapLine(s) {
  const h = s.head;
  const card = h?.card ? ` card x${h.card.ratio}` : '';
  const lock = h?.lock ? ` lock ${h.lock.from}->${h.lock.to}` : '';
  return `#${s.id} n${s.n} ${s.figure} ${s.fromPose}>${s.toPose} head ${f(h?.ratio)} (${f(h?.label)})${card}${lock} height ${f(s.height?.ratio)} feet ${f(s.feet?.px)} ghost ${s.ghost?.frames ?? 0} ${s.hardCut ? 'CUT' : `blend ${s.blendFrames}`} ${s.smear ? `smear ${s.smear.style}` : ''}`;
}

async function main(argv) {
  const { o, files } = parseOpts(argv);
  if (!files.length || o.help) {
    console.error('usage: node tools/continuity-reread.mjs <raw.json.gz> [--table=<pose-measure.json>] [--art=<dir>] [--out=<file>] [--list] [--swap=fig:from:to]');
    return files.length ? 0 : 2;
  }
  const run = await reread(files[0], { table: o.table, art: o.art, waivers: o.waivers });
  const m = run.res.summary.motion;
  const s = run.res.summary.size;
  console.log(`swaps ${run.res.summary.swaps} counted ${run.res.summary.counted} | head over ${s.headOverTolerance} (worst ${s.maxHeadJumpPct}%, registered ${s.maxHeadJumpPctRegistration}%) | height over band ${s.heightOverBand} | feet over ${s.feetOverTolerance}, silhouette feet over ${s.feetSilOver}`);
  console.log(`snaps ${m.snaps} | planned cuts ${m.hardCuts} | swap jerks ${m.swapJerks} worst ${m.swapJerksWorstPx} px, 40 px or more ${m.swapJerksOverFail} | dashes ${m.dashes} worst ${m.dashesWorstPx} | ghost frames/min ${m.ghostFramesPerMinute} worst severity ${m.worstGhostSeverity}`);
  console.log(`verdicts ${JSON.stringify(Object.fromEntries(Object.entries(run.res.summary.checks).map(([k, v]) => [k, v.result])))}`);
  if (run.notes.length) console.log(`notes: ${run.notes.slice(0, 3).join(' | ')}`);
  if (o.list) {
    // the jerks the policy excuses are marked (review minor 9, 2026-10-28): a dissolve's own travel with its share step and blend length, a twirl step; a plain `swap` line is a GATED swap jerk
    for (const j of run.res.jerks.filter((e) => e.px >= 40)) console.log(`  J ${j.figure} n${j.n} ${j.px}px ${j.part} ${j.kind}${j.smeared ? ' smeared' : ''}${j.unseen ? ' unseen' : ''}${j.commonMode ? ' commonMode' : ''}${j.dissolveTravel ? ` EXCUSED dissolveTravel share ${j.dissolveTravel.shareStep} over ${j.dissolveTravel.blendFrames} blend frames` : ''}${j.stagedExcused ? ' EXCUSED staged (twirl step)' : ''}`);
    for (const x of run.res.swaps.filter((e) => e.snap)) console.log(`  S ${x.figure} ${x.fromPose}>${x.toPose} n${x.n} snap camCut=${x.camCut}`);
    for (const x of run.res.swaps.filter((e) => e.failHead || e.failFeet || e.failHeight || e.failFeetSil)) console.log(`  F ${swapLine(x)} [${[x.failHead && 'head', x.failFeet && 'feet', x.failHeight && 'height', x.failFeetSil && 'feetSil'].filter(Boolean).join('+')}]`);
  }
  if (o.gated) {
    const g = gatedSwapJerks(run.res);
    console.log(`gated swap jerks: ${g.length}`);
    for (const j of g.sort((a, b) => b.px - a.px)) {
      const sw = run.res.swaps.find((x) => x.fi === j.fi && j.n >= x.startFrame - 1 && j.n <= x.n + 2);
      console.log(`  ${j.figure} n${j.n} ${j.px}px ${j.part}${sw ? ` ${sw.fromPose}>${sw.toPose} ${sw.hardCut ? (sw.smear ? 'planned cut' : 'cut') : `blend ${sw.blendFrames}`}${sw.figurePx ? ` (drawn ${Math.round(sw.figurePx)} px, cap ${Math.round(Math.max(120, 0.5 * sw.figurePx))})` : ''}` : ''}`);
    }
  }
  if (o.cuts) {
    const min = o.cuts === true ? 120 : Number(o.cuts);
    const c = plannedCutJerks(run.res, min);
    console.log(`planned-cut jerks of ${min} px or more: ${c.rows.length} (${f(c.perMinute)} a minute), ${c.rows.filter((r) => !r.excused).length} not excused`);
    const by = {};
    for (const r of c.rows) { const k = `${r.jerk.figure} ${r.swap.fromPose}>${r.swap.toPose}`; (by[k] ??= []).push(r.jerk.px); }
    for (const [k, v] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${k.padEnd(30)} x${v.length} ${Math.min(...v)} to ${Math.max(...v)} px`);
  }
  if (o.swap) {
    const [fig, from, to] = String(o.swap).split(':');
    for (const x of run.res.swaps.filter((e) => e.figure === fig && (!from || e.fromPose === from) && (!to || e.toPose === to))) console.log(`  ${swapLine(x)}`);
  }
  if (o.out) {
    fs.writeFileSync(path.resolve(o.out), JSON.stringify({ schema: 'continuity-reread/1', file: path.resolve(files[0]), summary: run.res.summary, swaps: run.res.swaps.map(({ fi, from, to, ...rest }) => rest), jerks: run.res.jerks.map(({ fi, ...rest }) => rest) }, null, 1));
    console.log(`wrote ${o.out}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, (e) => { console.error(String(e?.stack ?? e)); process.exitCode = 2; });
}
