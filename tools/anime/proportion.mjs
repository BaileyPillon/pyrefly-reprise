// proportion.mjs : the anime chapter's proportion pass (part 2). Bakes a rest-pose proportion change (a smaller head, longer legs / spine / arms)
// into a Meshy 24-joint skinned GLB: the mesh and the inverse-bind matrices are rewritten, the bones' local offsets and every clip's translation tracks follow.
// Free (no credits), pure node (no Blender), one file in, one file out. The maths: per joint j, scale s_j along its OWN bone axes (the bone frames are
// the file's world rotations, kept); a child's local offset T' = s_parent (x) T; a vertex moves by sum_k w_k * [ P'_j + Rw_j * (s_j (x) Rw_j^-1 (v - P_j)) ]
// (linear blend skinning with scaled bones: what 'pose bone scale, apply pose as rest' does in Blender); the new IBM is the inverse of the new rigid rest frame.
//
// usage: node proportion.mjs <in.glb> <out.glb> [--head 0.78] [--heads 6.8 | --k 1.07] [--arm 0.8] [--slim 1.0] [--neck 1.0] [--report]
import { readGlb, writeGlb, readAccessor, writeAccessorFloat, worldMatrices, mat4Inv, mat4FromTRS } from './glbkit.mjs';

export function proportion(g, p) {
  const j = g.json;
  const names = j.nodes.map((n) => n.name);
  const idx = new Map(names.map((n, i) => [n, i]));
  const { world, parent } = worldMatrices(g);
  const skin = j.skins[0];
  const jointNodes = skin.joints;
  const jointOfNode = new Map(jointNodes.map((n, k) => [n, k]));
  // the old IBMs must be the inverse of the bind world matrices (else the mesh node carries a transform we would have to handle)
  const ibm = readAccessor(g, skin.inverseBindMatrices).data;
  let worst = 0;
  jointNodes.forEach((n, k) => { const inv = mat4Inv(world[n]); for (let c = 0; c < 16; c++) worst = Math.max(worst, Math.abs(inv[c] - ibm[k * 16 + c])); });
  if (worst > 2e-3) throw new Error('IBM mismatch ' + worst);

  // scale vector per joint (bone-local axes; the bone runs along local +Y)
  const s = new Map();
  const kLeg = p.leg ?? p.k, kSpine = p.spine ?? p.k;
  const arm = 1 + (kSpine - 1) * p.arm;
  const sx = p.slim;
  const setS = (n, v) => s.set(idx.get(n), v);
  for (const n of names) if (idx.get(n) !== undefined) s.set(idx.get(n), [1, 1, 1]);
  for (const n of ['Spine02', 'Spine01', 'Spine']) setS(n, [sx, kSpine, sx]);
  setS('neck', [1, p.neck, 1]);
  setS('Head', [p.head, p.head, p.head]);
  for (const side of ['Left', 'Right']) {
    setS(side + 'UpLeg', [sx, kLeg, sx]);
    setS(side + 'Leg', [sx, kLeg, sx]);
    setS(side + 'Arm', [sx, arm, sx]);
    setS(side + 'ForeArm', [sx, arm, sx]);
  }

  // new joint world positions (rotations kept)
  const P = jointNodes.map((n) => [world[n][12], world[n][13], world[n][14]]);
  const Rw = jointNodes.map((n) => { const m = world[n]; return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]; }); // column-major 3x3
  const nodeP2 = new Map();
  const newT = new Map();
  const order = []; // parents first
  const seen = new Set();
  const visit = (n) => { if (seen.has(n)) return; if (parent[n] >= 0 && jointOfNode.has(parent[n])) visit(parent[n]); seen.add(n); order.push(n); };
  jointNodes.forEach(visit);
  const rotVec = (R, v) => [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
  const rotVecT = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  const rootNode = order[0];
  for (const n of order) {
    const k = jointOfNode.get(n);
    if (parent[n] < 0 || !jointOfNode.has(parent[n])) { nodeP2.set(n, P[k].slice()); newT.set(n, (j.nodes[n].translation || [0, 0, 0]).slice()); continue; }
    const pk = jointOfNode.get(parent[n]);
    const T = j.nodes[n].translation || [0, 0, 0];
    const sp = s.get(parent[n]);
    const Tn = [T[0] * sp[0], T[1] * sp[1], T[2] * sp[2]];
    newT.set(n, Tn);
    const off = rotVec(Rw[pk], Tn);
    const pp = nodeP2.get(parent[n]);
    nodeP2.set(n, [pp[0] + off[0], pp[1] + off[1], pp[2] + off[2]]);
  }

  // vertices
  const prim = j.meshes[0].primitives[0];
  const posA = prim.attributes.POSITION, norA = prim.attributes.NORMAL;
  const pos = readAccessor(g, posA), nor = readAccessor(g, norA);
  const J = readAccessor(g, prim.attributes.JOINTS_0), W = readAccessor(g, prim.attributes.WEIGHTS_0);
  const nv = pos.count;
  const outPos = new Float64Array(nv * 3), outNor = new Float64Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    const v = [pos.data[i * 3], pos.data[i * 3 + 1], pos.data[i * 3 + 2]];
    const nn = [nor.data[i * 3], nor.data[i * 3 + 1], nor.data[i * 3 + 2]];
    let acc = [0, 0, 0], nacc = [0, 0, 0], wsum = 0;
    for (let c = 0; c < 4; c++) {
      const w = W.data[i * 4 + c];
      if (w <= 0) continue;
      const k = J.data[i * 4 + c];
      const node = jointNodes[k];
      const sv = s.get(node);
      const d = [v[0] - P[k][0], v[1] - P[k][1], v[2] - P[k][2]];
      const loc = rotVecT(Rw[k], d);
      const sc = [loc[0] * sv[0], loc[1] * sv[1], loc[2] * sv[2]];
      const back = rotVec(Rw[k], sc);
      const p2 = nodeP2.get(node);
      acc[0] += w * (p2[0] + back[0]); acc[1] += w * (p2[1] + back[1]); acc[2] += w * (p2[2] + back[2]);
      const nl = rotVecT(Rw[k], nn);
      const ns = [nl[0] / sv[0], nl[1] / sv[1], nl[2] / sv[2]];
      const nb = rotVec(Rw[k], ns);
      nacc[0] += w * nb[0]; nacc[1] += w * nb[1]; nacc[2] += w * nb[2];
      wsum += w;
    }
    if (wsum <= 0) { acc = v; nacc = nn; wsum = 1; }
    outPos[i * 3] = acc[0] / wsum; outPos[i * 3 + 1] = acc[1] / wsum; outPos[i * 3 + 2] = acc[2] / wsum;
    const l = Math.hypot(nacc[0], nacc[1], nacc[2]) || 1;
    outNor[i * 3] = nacc[0] / l; outNor[i * 3 + 1] = nacc[1] / l; outNor[i * 3 + 2] = nacc[2] / l;
  }
  // measure: ground shift (the soles stay on y = their old minimum), the heights, the head
  let oldMin = 1e9, newMin = 1e9, newMax = -1e9;
  for (let i = 0; i < nv; i++) { oldMin = Math.min(oldMin, pos.data[i * 3 + 1]); newMin = Math.min(newMin, outPos[i * 3 + 1]); newMax = Math.max(newMax, outPos[i * 3 + 1]); }
  const dy = oldMin - newMin;
  for (let i = 0; i < nv; i++) outPos[i * 3 + 1] += dy;
  for (const n of order) nodeP2.get(n)[1] += dy;
  const total = newMax - newMin;
  // head height: the face's chin (lowest front vertex of the head weights) to the head's top (99.8th percentile of the head-weighted heights)
  const headIdx = [];
  const isHeadJoint = jointNodes.map((n) => ['Head', 'head_end', 'headfront'].includes(names[n]));
  const hw = new Float64Array(nv);
  for (let i = 0; i < nv; i++) for (let c = 0; c < 4; c++) if (isHeadJoint[J.data[i * 4 + c]]) hw[i] += W.data[i * 4 + c];
  const headNode = idx.get('Head');
  const hp = nodeP2.get(headNode);
  const hys = [];
  let chin = 1e9;
  for (let i = 0; i < nv; i++) {
    if (hw[i] < 0.5) continue;
    hys.push(outPos[i * 3 + 1]);
    const dz = outPos[i * 3 + 2] - hp[2];
    if (dz > 0.04 * p.head && Math.abs(outPos[i * 3] - hp[0]) < 0.07 && outPos[i * 3 + 1] < chin) chin = outPos[i * 3 + 1];
  }
  hys.sort((a, b) => a - b);
  const top = hys[Math.floor(hys.length * 0.998)];
  const headH = top - chin;
  const res = { total, headH, heads: total / headH, chin, top, dy, hips: nodeP2.get(rootNode)[1], hipsOld: P[jointOfNode.get(rootNode)][1], s, nodeP2, newT, order, jointNodes, idx, names, outPos, outNor, parent, Rw, P, world, ibmOld: ibm, jointOfNode, rootNode };
  return res;
}

export function apply(g, r, p) {
  const j = g.json;
  const prim = j.meshes[0].primitives[0];
  writeAccessorFloat(g, prim.attributes.POSITION, r.outPos);
  writeAccessorFloat(g, prim.attributes.NORMAL, r.outNor);
  // new IBMs = inverse of the new rigid rest frames
  const skin = j.skins[0];
  const ibm = new Float64Array(r.jointNodes.length * 16);
  r.jointNodes.forEach((n, k) => {
    const pk = r.nodeP2.get(n);
    const R = r.Rw[k];
    const F = [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, pk[0], pk[1], pk[2], 1];
    const inv = mat4Inv(F);
    for (let c = 0; c < 16; c++) ibm[k * 16 + c] = inv[c];
  });
  writeAccessorFloat(g, skin.inverseBindMatrices, ibm);
  // nodes' local translations (the root's gets the ground shift too)
  for (const n of r.order) {
    const t = r.newT.get(n).slice();
    if (n === r.rootNode) t[1] = (j.nodes[n].translation || [0, 0, 0])[1] + (r.hips - r.hipsOld);
    j.nodes[n].translation = t;
  }
  // clips: translation tracks follow the parent's scale; the root's rises with the hips
  const names = r.names;
  const done = new Set();
  for (const an of j.animations || []) {
    for (const ch of an.channels) {
      if (ch.target.path !== 'translation') continue;
      const node = ch.target.node;
      if (!r.jointOfNode.has(node)) continue;
      const smp = an.samplers[ch.sampler];
      if (done.has(smp.output)) throw new Error('shared sampler output ' + smp.output);
      done.add(smp.output);
      const out = readAccessor(g, smp.output).data;
      if (node === r.rootNode) {
        const ratio = r.hips / r.hipsOld;
        for (let i = 0; i < out.length; i += 3) out[i + 1] *= ratio;
      } else {
        const sp = r.s.get(r.parent[node]);
        for (let i = 0; i < out.length; i += 3) { out[i] *= sp[0]; out[i + 1] *= sp[1]; out[i + 2] *= sp[2]; }
      }
      writeAccessorFloat(g, smp.output, out);
    }
  }
}

// ---- main ----
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('proportion.mjs')) {
  const argv = process.argv.slice(2);
  const inFile = argv[0];
  const outFile = argv[1];
  const opt = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith('--')) opt[a.slice(2)] = true;
    else { opt[a.slice(2)] = nxt; i++; }
  }
  const num = (k, d) => (opt[k] !== undefined && opt[k] !== true ? Number(opt[k]) : d);
  const p = { head: num('head', 0.78), k: num('k', 1.0), arm: num('arm', 0.8), slim: num('slim', 1.0), neck: num('neck', 1.0) };
  if (opt.leg) p.leg = Number(opt.leg);
  if (opt.spine) p.spine = Number(opt.spine);
  const g0 = readGlb(inFile);
  if (opt.heads) {
    const target = Number(opt.heads);
    let lo = 0.9, hi = 1.4;
    for (let it = 0; it < 40; it++) { p.k = (lo + hi) / 2; const r = proportion(readGlb(inFile), p); if (r.heads < target) lo = p.k; else hi = p.k; }
  }
  const r = proportion(g0, p);
  console.log(JSON.stringify({ params: p, heads: +r.heads.toFixed(3), total: +r.total.toFixed(4), headH: +r.headH.toFixed(4), chin: +r.chin.toFixed(4), top: +r.top.toFixed(4), hips: +r.hips.toFixed(4), hipsOld: +r.hipsOld.toFixed(4), dy: +r.dy.toFixed(4) }));
  if (!opt.report) { apply(g0, r, p); writeGlb(outFile, g0.json, g0.bin); console.log('wrote', outFile); }
}
