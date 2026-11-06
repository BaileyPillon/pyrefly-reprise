// retarget.mjs : copy clips from one Meshy 24-joint GLB to another BY BONE NAME (the anime chapter's part 2: the Wind Waker cast's upright idle and victory on the toon girls).
// Rotations are copied as they are (both rigs run each bone's local Y along the bone with the same roll: the same template); every joint but the root keeps the target's own offsets (its bone lengths,
// so the clip holds no translation track for them); the root's track follows the ratio of the two rigs' leg lengths, then the whole clip is lifted or lowered by one constant so the feet stand where the
// target's rest feet stand (a forward-kinematics read of the toe joints). Every source track is resampled onto the union of all the source's key times (a constant track is stored as two keys).
//
// usage: node retarget.mjs <target.glb> <source.glb> --map idle:idle,victory:victory [--calib median|first] [--report]
import { readGlb, writeGlb, readAccessor, addAccessorFloat, mat4FromTRS, mat4Mul, nodeIndexByName } from './glbkit.mjs';

/** A track's value at time `t` (linear, or a normalised slerp for a quaternion track); `vals` is flat, `nc` numbers per key. */
export function sample(times, vals, nc, t, slerp) {
  const n = times.length;
  if (t <= times[0]) return Array.from(vals.slice(0, nc));
  if (t >= times[n - 1]) return Array.from(vals.slice((n - 1) * nc, n * nc));
  let i = 0;
  while (i < n - 2 && times[i + 1] < t) i++;
  const f = (t - times[i]) / (times[i + 1] - times[i]);
  const a = Array.from(vals.slice(i * nc, (i + 1) * nc));
  const b = Array.from(vals.slice((i + 1) * nc, (i + 2) * nc));
  if (!slerp) return a.map((v, k) => v + (b[k] - v) * f);
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sg = d < 0 ? -1 : 1;
  d = Math.abs(d);
  let wa;
  let wb;
  if (d > 0.9995) { wa = 1 - f; wb = f * sg; } else { const th = Math.acos(d); const sn = Math.sin(th); wa = Math.sin((1 - f) * th) / sn; wb = (Math.sin(f * th) / sn) * sg; }
  const o = a.map((v, k) => v * wa + b[k] * wb);
  const l = Math.hypot(...o) || 1;
  return o.map((v) => v / l);
}

/**
 * Retarget clips of `src` onto `dst` (both `readGlb` results), `maps` = [[sourceName, targetName], ...]. A target clip of the same name is replaced. Returns one report per clip:
 * `{ name, keys, seconds, lift, toeBefore: [min, max], toeAfter: [min, max], rest }`. `dst` is changed in place (its BIN grows); nothing is written to disk.
 */
export function retargetClips(dst, src, maps, { calib = 'median', report = false } = {}) {
  const dIdx = nodeIndexByName(dst);
  const sIdx = nodeIndexByName(src);
  const dj = dst.json;
  const sj = src.json;
  const jointNames = dj.skins[0].joints.map((n) => dj.nodes[n].name);
  const dParent = new Array(dj.nodes.length).fill(-1);
  dj.nodes.forEach((n, i) => (n.children || []).forEach((c) => (dParent[c] = i)));
  const root = jointNames.find((n) => !jointNames.includes(dj.nodes[dParent[dIdx.get(n)]]?.name));
  const legLen = (j, idx) => Math.hypot(...j.nodes[idx.get('LeftLeg')].translation) + Math.hypot(...j.nodes[idx.get('LeftFoot')].translation);
  const ratio = legLen(dj, dIdx) / legLen(sj, sIdx);

  function toeMin(trackOf, frames) {
    const out = [];
    for (let f = 0; f < frames; f++) {
      const world = new Map();
      const get = (name) => {
        if (world.has(name)) return world.get(name);
        const ni = dIdx.get(name);
        const t = trackOf(name);
        const local = mat4FromTRS(t.trans(f), t.rot(f), [1, 1, 1]);
        const p = dParent[ni];
        const pname = p >= 0 ? dj.nodes[p].name : null;
        const w = pname && jointNames.includes(pname) ? mat4Mul(get(pname), local) : local;
        world.set(name, w);
        return w;
      };
      out.push(Math.min(get('LeftToeBase')[13], get('RightToeBase')[13]));
    }
    return out;
  }
  const restTrack = (name) => ({ rot: () => dj.nodes[dIdx.get(name)].rotation || [0, 0, 0, 1], trans: () => dj.nodes[dIdx.get(name)].translation || [0, 0, 0] });
  const rest = toeMin(restTrack, 1)[0];

  const built = maps.map(([srcName, dstName]) => {
    const sa = sj.animations.find((a) => a.name === srcName);
    if (!sa) throw new Error('no source clip ' + srcName);
    const chan = {};
    for (const c of sa.channels) { const n = sj.nodes[c.target.node].name; (chan[n] ||= {})[c.target.path] = sa.samplers[c.sampler]; }
    const all = new Set();
    for (const name of jointNames) for (const p of ['rotation', 'translation']) { const smp = chan[name]?.[p]; if (smp) for (const t of readAccessor(src, smp.input).data) all.add(Math.round(t * 1e6) / 1e6); }
    const times = Float64Array.from([...all].sort((a, b) => a - b));
    const frames = times.length;
    const rot = {};
    let rootTrans = null;
    for (const name of jointNames) {
      const ch = chan[name];
      if (!ch || !ch.rotation) throw new Error('the source has no rotation for ' + name);
      const rt = readAccessor(src, ch.rotation.input).data;
      const rv = readAccessor(src, ch.rotation.output).data;
      const o = new Float64Array(frames * 4);
      for (let f = 0; f < frames; f++) o.set(sample(rt, rv, 4, times[f], true), f * 4);
      rot[name] = o;
      if (name === root) {
        const tt = readAccessor(src, ch.translation.input).data;
        const tv = readAccessor(src, ch.translation.output).data;
        rootTrans = new Float64Array(frames * 3);
        for (let f = 0; f < frames; f++) { const v = sample(tt, tv, 3, times[f], false); rootTrans.set([v[0] * ratio, v[1] * ratio, v[2] * ratio], f * 3); }
      }
    }
    const trackOf = (name) => ({
      rot: (f) => [rot[name][f * 4], rot[name][f * 4 + 1], rot[name][f * 4 + 2], rot[name][f * 4 + 3]],
      trans: (f) => (name === root ? [rootTrans[f * 3], rootTrans[f * 3 + 1], rootTrans[f * 3 + 2]] : dj.nodes[dIdx.get(name)].translation),
    });
    const before = toeMin(trackOf, frames);
    let ref;
    if (calib === 'first') ref = before[0];
    else { const s = before.slice().sort((a, b) => a - b); ref = s[Math.floor(s.length / 2)]; }
    const lift = rest - ref;
    for (let f = 0; f < frames; f++) rootTrans[f * 3 + 1] += lift;
    const after = toeMin(trackOf, frames);
    return { dstName, frames, times, rot, rootTrans, info: { name: dstName, keys: frames, seconds: times[frames - 1], lift, toeBefore: [Math.min(...before), Math.max(...before)], toeAfter: [Math.min(...after), Math.max(...after)], rest } };
  });

  if (!report) {
    for (const b of built) {
      const old = dj.animations.findIndex((a) => a.name === b.dstName);
      if (old >= 0) dj.animations.splice(old, 1);
      const tAcc = addAccessorFloat(dst, b.times, 'SCALAR', true);
      const samplers = [];
      const channels = [];
      const add = (name, path, data, type) => {
        samplers.push({ input: tAcc, output: addAccessorFloat(dst, data, type), interpolation: 'LINEAR' });
        channels.push({ sampler: samplers.length - 1, target: { node: dIdx.get(name), path } });
      };
      // only the root's translation moves; every other joint keeps the node's own offsets (the target's bone lengths), and no joint scales: those tracks are left out (smaller file)
      for (const name of jointNames) {
        if (name === root) add(name, 'translation', b.rootTrans, 'VEC3');
        add(name, 'rotation', b.rot[name], 'VEC4');
      }
      dj.animations.push({ name: b.dstName, samplers, channels });
    }
  }
  return { reports: built.map((b) => b.info), ratio, root };
}

// ---- main ----
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('retarget.mjs')) {
  const argv = process.argv.slice(2);
  const opt = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith('--')) opt[a.slice(2)] = true;
    else { opt[a.slice(2)] = nxt; i++; }
  }
  const dst = readGlb(argv[0]);
  const src = readGlb(argv[1]);
  const maps = String(opt.map || '').split(',').filter(Boolean).map((s) => s.split(':'));
  const { reports, ratio } = retargetClips(dst, src, maps, { calib: opt.calib || 'median', report: opt.report === true });
  console.log('leg-length ratio', ratio.toFixed(4));
  for (const r of reports) console.log(`${r.name}: ${r.keys} keys, ${r.seconds.toFixed(3)} s, lift ${r.lift.toFixed(4)} m, toe-min before [${r.toeBefore[0].toFixed(3)}..${r.toeBefore[1].toFixed(3)}] after [${r.toeAfter[0].toFixed(3)}..${r.toeAfter[1].toFixed(3)}] (rest ${r.rest.toFixed(3)})`);
  if (opt.report !== true) { writeGlb(argv[0], dst.json, dst.bin); console.log('wrote', argv[0], 'clips now', dst.json.animations.map((a) => a.name).join(',')); }
}
