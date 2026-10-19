#!/usr/bin/env node
/**
 * **The sizing rule: one size for each painted pose** (pose continuity, W3; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a
 * permanent fix for this please." The release driver picked this rule on 2026-10-17 (item 89e) from the options in `D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/options/notes.md`
 * Part A, under Bailey's standing "I'll go with all of your recommendations".
 *
 * A painting is drawn at ONE size, a single scalar, and a scalar matches the idle in only one length. A painting whose head is bigger or smaller than the idle's for its
 * body's size (Lulu's hurt, Paine's Songstress hurt) cannot match both: the head ruler (D-420) drew Lulu at 0.67 of her height, the height ruler would draw her head 49 percent big.
 * The rule splits the mismatch into two equal errors, one on each length:
 *
 *   mean   = sqrt(headScale x heightScale)       headScale: the scale at which the pose's head is the idle's (the reviewed reading, `reading` in the record);
 *                                                heightScale: the scale at which its stature is 1.0 (the figure's box, or head to soles for a props-out pose)
 *   floor  where the mean's stature falls under the class's floor (0.90; 0.75 for a low pose: critical, sleep, kneel), the stature is LIFTED to the floor and the head cost
 *          is recorded as a hold (`held`: r50.1 did exactly this for nine FFX poses); likewise a mean over 1.10 is held to the ceiling. A lift whose head would pass the hold
 *          range (0.80 to 1.45) is REFUSED: no single size puts the pose in band (Paine's Songstress hurt, mismatch 1.70), so it is drawn at the mean and keeps its legacy waiver
 *          and goes on the repaint list. A mean whose head only falls outside 0.85 to 1.15 (a low pose, floor 0.75) is also a recorded hold.
 *   props-out poses (victory, defend: a raised sword or staff) are measured HEAD TO SOLES, `bodyStature`, for the height scale and for the band (`pose-kinds.mjs`, `pose-bands.mjs`).
 *
 * The result is DATA, computed at install and written into the records (`docs/target/pose-measure.json`, `ruled`, and `held` where the head cost is recorded) and from there into the
 * tables the engine reads (`src/data/art/poseRegistration*.ts`): nothing is decided at run time. A ruled pose registers a VIRTUAL head box (the idle's head over the applied scale), as
 * a hold does, so the engine's head lock stands down and the rule's size stands; `ruled.headRatio` is the head the player sees. Covered: every standing or low pose that has a head
 * reading. Not covered (unchanged): KOs and laid-down planes (their length band is report-only), parts and wide foes (stance only), foes with no face box, twirl paintings, FF7 stills.
 *
 *   node tools/posescale/pose-ruler.mjs                         what the rule gives for every pose, against what the tables draw now (a census; writes nothing)
 *   node tools/posescale/pose-ruler.mjs --check                 exit 1 when a record's rule result is not what the pixels and the rule give now (run by the tests with the art)
 *   node tools/posescale/pose-ruler.mjs --rows F --out P        `measure.py table` calls this: the rows it just built (F), the patches for the records (P)
 *
 * Reads the art folder (`--art`, else `PYREFLY_ART_DIR`, else `public/art`); writes only the file `--out` names.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { statureFloorOf } from './pose-bands.mjs';
import { placePose } from './pose-geometry.mjs';
import { isPropsOut, mirrorFor, parseFacing, poseClassOf } from './pose-kinds.mjs';
import { listSubjects, loadModelInputs, readSubject } from './pose-model.mjs';
import { readPaint } from './pose-pixels.mjs';
import { RULE_BY, RULE_ID, r3, ruleSize, virtualHeadBox } from './pose-rule.mjs';

export { RULE_BY, RULE_ID, ruleSize, virtualHeadBox };

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const facingOf = (m) => parseFacing(m.sidecar?.facing);

/**
 * Rule every pose the records cover. `rows` is `{subject: {pose: row}}` (the registration rows as the table generator just built them: `feetRow` and `stanceX` do not depend on the
 * scale), default the repository's tables. Nothing is written.
 * @param {{root?: string, artDir?: string, records?: object, rows?: object, subjects?: string[], onSubject?: (s: string) => void}} o
 * @returns {Promise<{rules: object[], patches: Record<string, Record<string, object>>}>} `rules`: one entry per ruled pose, with the numbers; `patches`: what each record should become
 */
export async function ruleRecords({ root = ROOT, artDir, records, rows, subjects, onSubject } = {}) {
  const inputs = await loadModelInputs({ root, artDir, ...(rows ? { table: rows, tableSource: {} } : {}), ...(records ? { records } : {}) });
  const rec = inputs.records;
  const rules = [];
  const patches = {};
  const known = new Set(listSubjects(inputs));
  for (const subject of subjects ?? Object.keys(rec.subjects ?? {}).sort()) {
    const sub = rec.subjects?.[subject];
    if (!sub || !known.has(subject)) continue;
    const idleHead = sub.idleHead;
    if (!Array.isArray(idleHead) || idleHead.length !== 4 || (idleHead[2] - idleHead[0] === 1 && idleHead[3] - idleHead[1] === 1)) continue; // a foe with no face box has no head to rule
    await readSubject(inputs, subject, { poses: [] }); // builds the idle's side (inputs.refs) and reads no other painting
    const R = inputs.refs.get(subject);
    if (!R?.head) { inputs.refs.delete(subject); continue; }
    const u0 = (1 / R.standing) * (R.refScale || 1);
    for (const pose of R.poses) {
      if (pose === R.refName) continue;
      const r = sub.poses?.[pose];
      const head = r?.reading;
      if (!r || r.skip || !(head > 0) || !Array.isArray(r.anchor) || !r.standing) continue;
      const m = await readPaint(`${inputs.artDir}/characters/${subject}/${pose}.png`, pose);
      const row = inputs.table[subject]?.[pose] ?? {};
      const g = placePose(R, m, { row, rec: {}, koScale: inputs.koScale, facingOf, mirrorFor });
      const cls = poseClassOf({ pose, isRef: false, prone: g.prone, kind: R.kind });
      if (cls !== 'standing' && cls !== 'low') continue;
      const box = m.engineBox ?? { x0: 0, x1: m.W, y0: 0, y1: m.H };
      const bh = idleHead[3] - idleHead[1];
      let basis = 'box';
      let height = R.figH / ((g.anchor - box.y0) * u0);
      if (isPropsOut(pose) && R.bodyH) {
        const topTrue = r.anchor[1] - bh / head / 2; // the real head's top: the head box at the reading, not the virtual one
        if (g.anchor - topTrue > 0) { basis = 'body'; height = R.bodyH / ((g.anchor - topTrue) * u0); }
      }
      if (!(height > 0) || !Number.isFinite(height)) continue;
      const out = ruleSize({ head, height, floor: statureFloorOf(cls, pose) });
      const patch = {
        scaleSrc: out.held ? 'held' : 'ruled',
        scale: out.scale,
        stature: r3(out.stature),
        head: virtualHeadBox({ anchor: r.anchor, idleHead, scale: out.scale }),
        ruled: { rule: RULE_ID, basis, head: r3(head), height: Math.round(height * 1e5) / 1e5, mean: r3(out.mean), lift: out.lift, headRatio: r3(out.headRatio), stature: r3(out.stature) },
        held: out.held ? { by: RULE_BY, reading: r3(head), readingStature: r3(head / height), stature: r3(out.stature), headRatio: r3(out.headRatio) } : null,
        gate: null,
        gateLifted: null,
        allow: null,
      };
      (patches[subject] ??= {})[pose] = patch;
      rules.push({ subject, pose, game: R.game, cls, basis, head, height, mean: out.mean, scale: out.scale, lift: out.lift, held: out.held, headRatio: out.headRatio, stature: out.stature, was: { scale: row.scale ?? r.scale ?? null, src: r.scaleSrc } });
    }
    inputs.refs.delete(subject);
    onSubject?.(subject);
  }
  return { rules, patches };
}

/** Apply a patch to a record in place: a `null` value removes the key. */
export function applyPatch(rec, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete rec[k];
    else rec[k] = v;
  }
  return rec;
}

/**
 * Is a record what the rule gives now? Compares the stored result with a fresh one (from the pixels), key by key.
 * @returns {string[]} one sentence per record that differs
 */
export function diffRecords(records, rules) {
  const out = [];
  for (const x of rules) {
    const r = records.subjects[x.subject].poses[x.pose];
    const key = `${x.subject}/${x.pose}`;
    if (r.ruled?.rule !== RULE_ID) { out.push(`${key}: not ruled (the rule gives scale ${x.scale}); run measure.py table`); continue; }
    if (Math.abs(r.scale - x.scale) > 0.0015) out.push(`${key}: scale ${r.scale} stored, the rule gives ${x.scale} (${x.lift ?? 'mean'})`);
    if (Math.abs(r.ruled.height - x.height) > 0.002 * x.height) out.push(`${key}: height scale ${r.ruled.height} stored, ${x.height.toFixed(5)} from the pixels`);
    if ((r.ruled.lift ?? null) !== x.lift) out.push(`${key}: lift ${r.ruled.lift ?? 'none'} stored, ${x.lift ?? 'none'} now`);
  }
  return out;
}

// ---------------------------------------------------------------- the command line

const f3 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? '  n/a' : v.toFixed(3));

async function main(argv) {
  const get = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
  const root = resolve(get('--root', ROOT));
  const art = get('--art', process.env.PYREFLY_ART_DIR);
  const rowsFile = get('--rows');
  const rows = rowsFile ? JSON.parse(readFileSync(resolve(rowsFile), 'utf8')) : undefined;
  const subjects = get('--subjects')?.split(',').filter(Boolean);
  const { rules, patches } = await ruleRecords({ root, artDir: art ? resolve(art) : undefined, rows, subjects });
  if (get('--out')) {
    writeFileSync(resolve(get('--out')), JSON.stringify({ rule: RULE_ID, patches }));
    console.error(`pose-ruler: ${rules.length} poses ruled; patches written to ${get('--out')}`);
    return 0;
  }
  if (argv.includes('--check')) {
    const records = JSON.parse(readFileSync(resolve(root, 'docs', 'target', 'pose-measure.json'), 'utf8'));
    const diffs = diffRecords(records, rules);
    for (const d of diffs) console.log(`FAIL  ${d}`);
    console.log(diffs.length ? `pose-ruler: FAIL, ${diffs.length} record(s) are not what the rule gives` : `pose-ruler: PASS, ${rules.length} ruled poses match the rule`);
    return diffs.length ? 1 : 0;
  }
  const by = (k) => rules.reduce((m, x) => ((m[x[k] ?? 'none'] = (m[x[k] ?? 'none'] ?? 0) + 1), m), {});
  for (const x of rules) console.log(`${(`${x.subject}/${x.pose}`).padEnd(36)} ${x.cls.padEnd(8)} ${x.basis.padEnd(4)} head ${f3(x.head)} height ${f3(x.height)} mean ${f3(x.mean)} -> scale ${f3(x.scale)} ${(x.lift ?? 'mean').padEnd(7)} stature ${f3(x.stature)} head x${f3(x.headRatio)}${x.held ? ' HELD' : ''}  (draws ${f3(x.was.scale)})`);
  console.log(`pose-ruler: ${rules.length} poses; by lift ${JSON.stringify(by('lift'))}; held ${rules.filter((x) => x.held).length}`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(e instanceof Error ? e.stack : String(e));
    process.exitCode = 2;
  }
}
