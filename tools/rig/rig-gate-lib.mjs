/**
 * **The rig gate's core** (the rig program; both games, shared plumbing). Bailey, 2026-10-17: "start rigging for all chapters please. i want a permanent fix now."
 * A rig is `ok` only when ALL of these hold; the CLI is `tools/rig-gate.mjs`, which writes `gate` into rig.json and refuses (exit 1) otherwise:
 *
 *   rig-*            the file is a valid v1 rig (shape, bones, meshes, skin, keys, the PNGs it names)               [rig-format.mjs]
 *   costume-*        it is cut from the ONE approved master: `characters/<subject>/<pose>.png` exists, its sha256 is the rig's `costume.sha`, its size is the rig's `image`
 *                    over `scale`, and the rig plants its soles on that painting's registered ground row (`baseline`)
 *   rest-differs     the rest pose draws the costume painting: silhouette overlap 0.95 or more
 *   key-iou          every key's silhouette overlaps the approved painting of that pose by 0.85 or more, both registered at the idle's scale and feet (`rig-read.mjs`)
 *   key-<flag>       every key is inside its pose class's bands (`tools/posescale/pose-bands.mjs`): stature (a props-out pose reads head to soles), real head, feet, mass,
 *                    stance, overlap, solidity. The same flags the pose gate raises for a painting.
 *   key-unmatched    a key with no approved painting of its pose (and not `source: "authored"`) cannot be verified
 *   key-feet-landmark  the runtime's own planted-feet check: a key not marked `planted: false` keeps its lowest foot landmark (feet, foot*, toe*, heel*, sole*) on the bind row, the
 *                    key's declared `root.dy` aside, to 0.4 percent of the image height (`src/engine/rig/RigValidate.ts`); a rig with no foot landmark fails `rig-landmark`
 *   coverage         (ON BY DEFAULT since the driver's rule of 2026-10-17; `requireCoverage: false` / `--allow-partial` for a rig still being fitted) every pose the game has a registered
 *                    painting of has a key: a pose with no key is drawn as the nearest key down the pose chain (attack to ready to idle), not as its painting, so a partial rig changes
 *                    poses it does not serve, and a figure turns its rig on only with full coverage (no per-pose fallback to paintings). `result.uncovered` lists them either way;
 *                    the stamp records `coverage` (`full` or `partial`), the `exempt` painted poses (staged or part paintings, which no key is owed) and each key's `silhouette`
 *   hole-key         no alpha hole (more than HOLE_PX transparent pixels in the joint's disc) at any body joint in any key
 *   hole-blend       ... nor at 25, 50 and 75 percent between any two keys                                          [rig-holes.mjs]
 *   budget-*         parts <= 24, bones <= 48, vertices <= 8000, texels <= 9 Mpx, PNG bytes <= 9 MB: about twice the hand-cut prototype Kimahri (11 parts, 29 bones,
 *                    3068 vertices, 4.2 Mpx, 4.5 MB), the largest figure cut so far. Four such rigs on screen stay near 140 MB of texture.
 *
 * The readings are the pose model's (`tools/posescale/pose-model.mjs`): this module invents no number and shares no code with the fitter (`tools/rig/rig_fit.py`), so
 * the gate is an independent second reading of what the fitter claims.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bandVerdict } from '../posescale/pose-bands.mjs';
import { listPoses, loadModelInputs } from '../posescale/pose-model.mjs';
import { poseClassOf } from '../posescale/pose-kinds.mjs';
import { drawnMask, maskIou } from '../posescale/pose-pixels.mjs';
import { GATE_BY, GATE_RULES, costumeParts, normaliseRig, readRigFile, rigDigest, rigSize } from './rig-format.mjs';
import { scanHoles } from './rig-holes.mjs';
import { keyPose, restPose, solve, through } from './rig-pose.mjs';
import { loadTextures } from './rig-raster.mjs';
import { approvedTarget, drawKey, keyMask, readApproved, readKey, readsBody, rigContext } from './rig-read.mjs';
import { silhouetteOf } from './rig-silhouette.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The numbers the gate holds a rig to. */
export const RIG_BANDS = Object.freeze({
  /** A key's silhouette overlap with the approved painting of its pose (both registered at the idle's scale and feet). */
  iou: 0.85,
  /** The rest pose against the costume painting itself (the cut is made from the defringed painting: its grey matte ring is gone, so 1.0 is not reachable). */
  restIou: 0.95,
  /** The rig's ground row may differ from the costume painting's registered one by this many 1x painting px. */
  baselinePx: 1.5,
  /** The rig's image over its scale may differ from the costume painting's size by this many px. */
  sizePx: 2,
  /** How far a key's recorded `fit` may be from the gate's reading (a recorded number is the pipeline's claim, not a reading). */
  fitIou: 0.05,
  fitStature: 0.04,
});

/** Landmark names that count as feet (the runtime's `RIG_FOOT_LANDMARKS`), and how far a planted key's lowest foot may leave the bind row, as a share of the image height (`RigValidate.FEET_TOL`). */
const FOOT_LANDMARKS = ['feet', 'foot', 'toe', 'heel', 'sole'];
const FEET_LANDMARK_TOL = 0.004;

/**
 * Is `costume.sha` the sha256 of the master the parts were cut from? The 1x painting (`characters/<subject>/<pose>.png`, the file the pose model reads) or the `@<scale>x` master beside it
 * (the file the cut is made from) both count, by prefix; `costume.sha2x`, when the rig names one, must be the hi-DPI master's too.
 * @returns {{ok: boolean, why: string}}
 */
export function costumeSha(costume, scale, artDir, subject, pose) {
  const dir = join(artDir, 'characters', subject);
  const files = [join(dir, `${pose}.png`), ...(scale > 1 ? [join(dir, `${pose}@${scale}x.png`)] : [])].filter((f) => existsSync(f));
  const have = files.map((f) => sha256File(f));
  const want = String(costume.sha ?? '').toLowerCase();
  if (!want || !have.some((h) => h.startsWith(want))) return { ok: false, why: `characters/${subject}/${pose}.png is not the master the rig was cut from (rig ${want.slice(0, 16)}, files ${have.map((h) => h.slice(0, 16)).join(', ') || 'none'})` };
  if (costume.sha2x && !have.some((h) => h.startsWith(String(costume.sha2x).toLowerCase()))) return { ok: false, why: `the @${scale}x master beside characters/${subject}/${pose}.png is not the one the parts were cut from` };
  return { ok: true, why: '' };
}

export const BUDGET = Object.freeze({ parts: 24, bones: 48, verts: 8000, tris: 14000, texels: 9_000_000, bytes: 9_000_000 });

const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const f3 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? 'n/a' : v.toFixed(3));

const FLAG_WORDS = {
  'stature-low': (r) => `stature ${f3(r.statureRead)} of the idle's height, under the band`,
  'stature-high': (r) => `stature ${f3(r.statureRead)} of the idle's height, over the band`,
  'head-small': (r) => `real head ${f3(r.headReal)} of the idle's, under the band`,
  'head-big': (r) => `real head ${f3(r.headReal)} of the idle's, over the band`,
  'feet-x': (r) => `feet ${f3(r.feet?.dx)} idle heights sideways of the idle's (not planted)`,
  'feet-y': (r) => `feet ${f3(r.feet?.dy)} idle heights above or below the idle's (floating or sunk)`,
  'mass-low': (r) => `mass ${f3(r.massRatio)} of the idle's`,
  'mass-high': (r) => `mass ${f3(r.massRatio)} of the idle's`,
  'no-stance': () => 'no stance can be read from the silhouette',
  'no-overlap': (r) => `overlap ${f3(r.iou)} with the idle: nothing in common`,
  slab: () => 'the silhouette is a rectangle',
  empty: () => 'nothing drawn',
  'props-only': () => 'a prop carries the height',
  'no-head': () => 'the costume painting has no registered head box',
};

/**
 * Judge one rig folder.
 * @param {object} o
 * @param {string} o.rig the folder with rig.json @param {string} [o.root] @param {string} [o.artDir] the art folder with `characters/` (default `<root>/public/art`)
 * @param {object} [o.inputs] pose-model inputs (tests pass a synthetic table) @param {boolean} [o.blends=true] scan the blends too
 * @param {boolean} [o.requireCoverage=true] fail `coverage` when a registered pose has no key. **On by default** (the driver's rule, 2026-10-17: a figure turns its rig on only with FULL coverage,
 *   and there is no per-pose fallback to paintings); `false` is for a rig still being fitted, and its stamp says `coverage: "partial"`, which the deploy refuses
 * @returns {Promise<object>} `{ subject, status: 'ok'|'refused', failures, keys, rest, holes, size, digest, bands, budget, uncovered, exempt, silhouettes }`
 */
export async function gateRig({ rig, root = ROOT, artDir, inputs, blends = true, requireCoverage = true } = {}) {
  const failures = [];
  const fail = (code, message, pose) => failures.push(pose ? { code, pose, message } : { code, message });
  const { raw, dir } = readRigFile(rig);
  const { problems, rt } = normaliseRig(raw, { dir });
  const result = { subject: raw?.name ?? null, status: 'refused', failures, keys: [], rest: null, holes: null, uncovered: [], size: rigSize(raw ?? {}, dir), digest: rigDigest(raw ?? {}, dir), bands: RIG_BANDS, budget: BUDGET, rigDir: dir };
  result.exempt = []; // painted poses with no key that the rig is not held to (staged or part paintings): stamped, so the runtime and the deploy can tell them from a pose painted after the gate ran
  result.silhouettes = {}; // each key's posed box, feet and painted front in the master's px (`rig-silhouette.mjs`), stamped for the HUD's brackets and the strike's reach
  for (const p of problems) fail(p.code, p.message);
  if (!rt) return result;
  // ---- budget
  const sz = result.size;
  const over = (code, n, cap, what) => { if (n > cap) fail(`budget-${code}`, `${n.toLocaleString('en-US')} ${what}, over the budget of ${cap.toLocaleString('en-US')}`); };
  over('parts', sz.parts, BUDGET.parts, 'parts');
  over('bones', sz.bones, BUDGET.bones, 'bones');
  over('verts', sz.verts, BUDGET.verts, 'vertices');
  over('tris', sz.tris, BUDGET.tris, 'triangles');
  over('texels', sz.texels, BUDGET.texels, 'texels');
  over('bytes', sz.bytes, BUDGET.bytes, 'bytes of PNG');
  if (failures.some((f) => f.code.startsWith('rig-'))) return result;
  // ---- the costume painting
  const inp = inputs ?? (await loadModelInputs({ root, artDir }));
  const costumePose = costumeParts(rt.costume.painting)?.pose ?? 'idle';
  const costumeFile = join(inp.artDir, 'characters', rt.name, `${costumePose}.png`);
  if (!existsSync(costumeFile)) { fail('costume-missing', `the costume painting characters/${rt.name}/${costumePose}.png is not in the art folder`); return result; }
  const sha = costumeSha(raw.costume, rt.scale, inp.artDir, rt.name, costumePose);
  if (!sha.ok) fail('costume-stale', `${sha.why}: a repainted costume needs its rig cut again`);
  let ctx;
  try { ctx = await rigContext(rt, inp); } catch (e) { fail('costume-missing', `the pose model cannot read ${rt.name}: ${e instanceof Error ? e.message : String(e)}`); return result; }
  const { W1, H1, cr } = ctx;
  if (Math.abs(raw.image.w - W1 * rt.scale) > RIG_BANDS.sizePx * rt.scale || Math.abs(raw.image.h - H1 * rt.scale) > RIG_BANDS.sizePx * rt.scale) fail('costume-size', `the rig's image ${raw.image.w} x ${raw.image.h} is not the costume painting's ${W1} x ${H1} at scale ${rt.scale}`);
  if (Math.abs(ctx.anchor1 - cr.drawn.anchor) > RIG_BANDS.baselinePx) fail('baseline', `the rig plants its soles on row ${ctx.anchor1.toFixed(1)} (1x), the costume painting is registered on row ${cr.drawn.anchor.toFixed(1)}`);
  await loadTextures(rt, dir);
  // ---- the rest pose is the costume painting
  const rest = await drawKey(ctx, restPose(rt));
  const costume = await readApproved(ctx, costumePose);
  const restIou = costume ? maskIou(keyMask(ctx, rest.vp), drawnMask(costume.m, cr.drawn.upp, cr.drawn.anchor, cr.drawn.shift, cr.drawn.mirror)) : null;
  result.rest = { iou: restIou };
  if (restIou === null || restIou < RIG_BANDS.restIou) fail('rest-differs', `the rest pose overlaps the costume painting by ${f3(restIou)}, under ${RIG_BANDS.restIou}: the cut parts do not make the painting`);
  // ---- the keys
  const footNames = Object.keys(rt.landmarks).filter((n) => FOOT_LANDMARKS.some((f) => n.startsWith(f)));
  if (!footNames.length) fail('rig-landmark', `no foot landmark (a landmark named ${FOOT_LANDMARKS.join(', ')} ...): the runtime checks a planted key's feet through it`);
  const lowestFoot = (k) => Math.max(...footNames.map((n) => through(k, rt.landmarks[n].bone, rt.landmarks[n].x, rt.landmarks[n].y)[1]));
  const bindFoot = footNames.length ? lowestFoot(solve(rt, restPose(rt)).k) : 0;
  for (const [pose, key] of Object.entries(rt.keys)) {
    const drawn = await drawKey(ctx, keyPose(rt, key));
    const reading = readKey(ctx, pose, drawn);
    const found = await readApproved(ctx, pose);
    const entry = { pose, class: reading.class, source: key.source, planted: true, iou: null, stature: reading.stature, bodyStature: reading.bodyStature, statureRead: reading.stature, headReal: reading.headReal, feet: reading.feet, flags: [], report: [], propsOut: false, normK: 1, ok: false };
    result.keys.push(entry);
    if (found) {
      const t = approvedTarget(ctx, found.apr, found.m);
      entry.iou = maskIou(keyMask(ctx, drawn.vp), t.mask);
      entry.propsOut = t.propsOut;
      entry.normK = Math.round(t.k * 1000) / 1000;
      if (t.propsOut && reading.bodyStature !== null) { entry.statureRead = reading.bodyStature; reading.stature = reading.bodyStature; }
      if (entry.iou === null || entry.iou < RIG_BANDS.iou) fail('key-iou', `silhouette overlap ${f3(entry.iou)} with the approved painting of ${pose}, under ${RIG_BANDS.iou} (both registered at the idle's scale and feet)`, pose);
    } else if (key.source !== 'authored') {
      fail('key-unmatched', `there is no approved painting of ${pose} to hold the key against (a key with no painting must say \`source: "authored"\`)`, pose);
    }
    if (!found && readsBody(ctx.R, null) && reading.bodyStature !== null) { entry.propsOut = true; entry.statureRead = reading.bodyStature; reading.stature = reading.bodyStature; } // no painting, but the subject is read head to soles
    // what the pipeline claims it measured (`fit`) must be what the gate measures: a typed-in number is not a reading
    if (key.fit && entry.iou !== null && Number.isFinite(key.fit.iou) && Math.abs(key.fit.iou - entry.iou) > RIG_BANDS.fitIou) fail('key-fit-stale', `the key says it overlaps its painting by ${f3(key.fit.iou)}, the gate reads ${f3(entry.iou)}`, pose);
    if (key.fit && Number.isFinite(key.fit.stature) && entry.statureRead !== null && Math.abs(key.fit.stature - entry.statureRead) > RIG_BANDS.fitStature) fail('key-fit-stale', `the key says it stands ${f3(key.fit.stature)} of the idle's height, the gate reads ${f3(entry.statureRead)}`, pose);
    if (footNames.length && key.planted) {
      const err = lowestFoot(drawn.k) - (bindFoot + key.root.dy);
      if (Math.abs(err) > FEET_LANDMARK_TOL * rt.image.h) fail('key-feet-landmark', `the lowest foot landmark is ${err.toFixed(1)} px from the bind row (limit ${(FEET_LANDMARK_TOL * rt.image.h).toFixed(1)}), the key's own root.dy aside`, pose);
    }
    const sil = silhouetteOf(ctx.frame, drawn, rt, footNames);
    if (sil) result.silhouettes[pose] = sil;
    const v = bandVerdict({ ...reading, stature: entry.statureRead });
    // a key that is allowed to leave the floor (`planted: false`: a leap, a KO that lies down) is not held to the idle's soles; everything else about it is judged
    entry.planted = key.planted;
    entry.flags = v.flags.filter((f) => f !== 'unregistered' && (key.planted || !['feet-x', 'feet-y', 'feet-sunk'].includes(f)));
    entry.report = v.report;
    for (const f of entry.flags) fail(`key-${f}`, `${FLAG_WORDS[f]?.({ ...reading, statureRead: entry.statureRead }) ?? f}`, pose);
    entry.ok = !failures.some((x) => x.pose === pose);
  }
  // ---- coverage: the poses the game can draw this figure in that the rig has no key for
  // `required` are the painted poses the battle draws a figure in; `exempt` the painted poses with no key that the rig is not held to (a staged or part painting, or one the pose table has no row for):
  // the stamp records them, so the runtime and the deploy can tell a pose that was never required from one painted after the gate ran
  const painted = listPoses(inp, rt.name);
  const required = painted.filter((p) => (inp.table[rt.name]?.[p] || p === ctx.R.refName) && !['staged', 'part'].includes(poseClassOf({ pose: p, isRef: false, prone: false, kind: ctx.R.kind })));
  result.uncovered = required.filter((p) => !rt.keys[p]);
  result.exempt = painted.filter((p) => !rt.keys[p] && !required.includes(p));
  if (requireCoverage && result.uncovered.length) fail('coverage', `no key for ${result.uncovered.join(', ')}: a figure turns its rig on only with a key for every pose it is painted in, and those poses would draw as the nearest key down the pose chain, not as their paintings (--allow-partial is for a rig still being fitted, and the deploy refuses it)`);
  // ---- holes
  const scan = scanHoles(ctx, { blends });
  result.holes = { joints: scan.joints, rendered: scan.rendered, keysWithHoles: scan.keys.filter((k) => k.holes.length).map((k) => k.pose), blendsWithHoles: scan.blends.filter((b) => b.holes.length).length, blends: scan.blends.filter((b) => b.holes.length).slice(0, 12) };
  for (const k of scan.keys) if (k.holes.length) fail('hole-key', `a hole at ${k.holes.map((h) => `${h.name} (${h.count} px)`).join(', ')}`, k.pose);
  for (const b of scan.blends) if (b.holes.length) fail('hole-blend', `a hole at ${b.holes.map((h) => `${h.name} (${h.count} px)`).join(', ')} ${Math.round(b.t * 100)} percent of the way from ${b.from} to ${b.to}`, `${b.from}>${b.to}`);
  result.status = failures.length ? 'refused' : 'ok';
  return result;
}

/** One line per failure, in the pose gate's shape: `subject/pose  code  message`. */
export const formatRigFailure = (subject, x) => `${subject}/${x.pose ?? '*'}  ${x.code}  ${x.message}`;

/** The poses a rig serves: the keys that passed everything (only meaningful when the rig is `ok`, when it is every key). */
export const riggedPoses = (result) => (result.status === 'ok' ? result.keys.map((k) => k.pose) : []);

const stable = (v) => (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}` : JSON.stringify(v));

/**
 * The seal on a stamp's ship record: a fingerprint of the digest and of the fields the digest does not cover (`keys`, `coverage`, `uncovered`, `exempt`, `silhouettes`), written with them and
 * checked by `verifyStamp({full})`. It catches a hand edit of the record (a typed-in `coverage`, an exempt pose added to excuse a missing key) the way the digest catches an edit of the rig;
 * like the digest it is a tamper-evident seal, not a signature, and the full gate (`rig-gate` without `--verify`, which renders) is what a forged stamp meets.
 */
export const sealOf = (g) => createHash('sha256').update(stable({ digest: g.digest, keys: g.keys, coverage: g.coverage, uncovered: g.uncovered ?? [], exempt: g.exempt, silhouettes: g.silhouettes })).digest('hex').slice(0, 32);

/**
 * Write the gate's verdict into rig.json: `gate: { status: 'ok' | 'refused', at, by: 'tools/rig-gate.mjs', digest, why?, rules, keys }` (`RigGate` of
 * `src/data/art/rigTypes.ts` plus `rules` and `keys`; the runtime draws a rig whose status is `ok`). The digest is the rig's own fingerprint (`rigDigest`), so an `ok` stamp dies the
 * moment a key, a mesh or a texture changes. The only writer of `gate`.
 */
export function stampRig(dir, result, { at = new Date().toISOString().slice(0, 10) } = {}) {
  const file = join(dir, 'rig.json');
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  delete raw.gate;
  const digest = rigDigest(raw, dir);
  const codes = [...new Set(result.failures.map((f) => f.code))];
  raw.gate = {
    status: result.status === 'ok' ? 'ok' : 'refused', at, by: GATE_BY,
    ...(codes.length ? { why: `${result.failures.length} failure(s): ${codes.join(', ')}` } : {}),
    rules: GATE_RULES, digest, keys: result.keys.filter((k) => k.ok).map((k) => k.pose),
    // the ship record: coverage (`full`: every painted pose the battle draws has a key; the deploy and the runtime accept nothing else), the painted poses the rig is not held to, and each key's silhouette
    coverage: (result.uncovered ?? []).length ? 'partial' : 'full', ...((result.uncovered ?? []).length ? { uncovered: result.uncovered } : {}),
    exempt: result.exempt ?? [], silhouettes: result.silhouettes ?? {},
  };
  raw.gate.seal = sealOf(raw.gate);
  writeFileSync(file, JSON.stringify(raw));
  return raw.gate;
}

/**
 * The cheap check on a stamp (no rendering): the rig says `ok`, by this gate's rules, and its digest is the content's now. With `full` (what a rig that SHIPS must pass, the deploy's and
 * `rig-gate --verify`'s) the stamp must also say `coverage: "full"` and carry the exempt poses and a silhouette for every key it passed.
 * @returns {{ok: boolean, code?: string, message?: string, raw?: object, dir?: string}}
 */
export function verifyStamp(rig, { full = false } = {}) {
  let read;
  try { read = readRigFile(rig); } catch (e) { return { ok: false, code: 'rig-missing', message: e instanceof Error ? e.message : String(e) }; }
  const g = read.raw.gate;
  if (!g || g.status !== 'ok') return { ok: false, code: 'gate-not-ok', message: g ? `the rig's gate says ${g.status}${g.why ? ` (${g.why})` : ''}` : 'the rig has no gate stamp: run node tools/rig-gate.mjs', ...read };
  if (g.by !== GATE_BY || g.rules !== GATE_RULES) return { ok: false, code: 'gate-rules', message: `the stamp is by ${g.by} (${g.rules}), not ${GATE_BY} (${GATE_RULES})`, ...read };
  if (g.digest !== rigDigest(read.raw, read.dir)) return { ok: false, code: 'gate-stale', message: 'the rig changed after the gate stamped it (its digest is not the one stamped): run node tools/rig-gate.mjs again', ...read };
  if (full) {
    if (g.coverage !== 'full') return { ok: false, code: 'gate-partial', message: g.coverage === 'partial' ? `the stamp says coverage partial: no key for ${(g.uncovered ?? []).join(', ') || 'some painted poses'}; a figure turns its rig on only with a key for every pose it is painted in` : 'the stamp does not say coverage full (it is from before the rule): run node tools/rig-gate.mjs again', ...read };
    if (!Array.isArray(g.exempt)) return { ok: false, code: 'gate-exempt', message: 'the stamp does not list the exempt poses: run node tools/rig-gate.mjs again', ...read };
    if (g.seal !== sealOf(g)) return { ok: false, code: 'gate-seal', message: 'the ship record of the stamp (coverage, exempt poses, silhouettes) was edited after the gate wrote it: run node tools/rig-gate.mjs again', ...read };
    const bare = (g.keys ?? []).filter((p) => !g.silhouettes?.[p]);
    if (bare.length) return { ok: false, code: 'gate-silhouettes', message: `the stamp has no silhouette for ${bare.join(', ')}: run node tools/rig-gate.mjs again`, ...read };
  }
  return { ok: true, ...read };
}
