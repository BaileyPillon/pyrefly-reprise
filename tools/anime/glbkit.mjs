// glbkit.mjs : a small GLB reader/writer for the proportion and retarget passes (part 2 of the anime chapter).
// Pure node, no dependencies. In-place edits keep the file layout; addAccessor appends data to the BIN chunk.
import { readFileSync, writeFileSync } from 'node:fs';

const COMP = { 5120: [1, Int8Array], 5121: [1, Uint8Array], 5122: [2, Int16Array], 5123: [2, Uint16Array], 5125: [4, Uint32Array], 5126: [4, Float32Array] };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

export function readGlb(file) {
  const b = readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB: ' + file);
  let off = 12;
  let json = null;
  let bin = null;
  while (off < b.length) {
    const len = b.readUInt32LE(off);
    const type = b.readUInt32LE(off + 4);
    const data = b.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004e4942) bin = Buffer.from(data);
    off += 8 + len;
  }
  return { json, bin };
}

export function writeGlb(file, json, bin) {
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  const jpad = (4 - (js.length % 4)) % 4;
  js = Buffer.concat([js, Buffer.alloc(jpad, 0x20)]);
  const bpad = (4 - (bin.length % 4)) % 4;
  const bb = Buffer.concat([bin, Buffer.alloc(bpad, 0)]);
  json.buffers = [{ byteLength: bb.length }];
  js = Buffer.from(JSON.stringify(json), 'utf8');
  const jp = (4 - (js.length % 4)) % 4;
  js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
  const total = 12 + 8 + js.length + 8 + bb.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  out.writeUInt32LE(js.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  js.copy(out, 20);
  const o2 = 20 + js.length;
  out.writeUInt32LE(bb.length, o2);
  out.writeUInt32LE(0x004e4942, o2 + 4);
  bb.copy(out, o2 + 8);
  writeFileSync(file, out);
}

/** Read an accessor to a flat Float64Array (normalized ints are scaled to 0..1 / -1..1), honouring byteStride. Returns { data, count, ncomp }. */
export function readAccessor(g, ai) {
  const a = g.json.accessors[ai];
  const bv = g.json.bufferViews[a.bufferView];
  const [csize, Arr] = COMP[a.componentType];
  const nc = NCOMP[a.type];
  const stride = bv.byteStride || csize * nc;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const out = new Float64Array(a.count * nc);
  const dv = new DataView(g.bin.buffer, g.bin.byteOffset, g.bin.byteLength);
  const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  const norm = a.normalized ? { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType] : 0;
  for (let i = 0; i < a.count; i++) {
    for (let c = 0; c < nc; c++) {
      let v = dv[get](base + i * stride + c * csize, true);
      if (norm) v = Math.max(v / norm, -1);
      out[i * nc + c] = v;
    }
  }
  return { data: out, count: a.count, ncomp: nc };
}

/** Write values back into an existing FLOAT accessor in place (same count and type). */
export function writeAccessorFloat(g, ai, data) {
  const a = g.json.accessors[ai];
  if (a.componentType !== 5126) throw new Error('not float');
  const bv = g.json.bufferViews[a.bufferView];
  const nc = NCOMP[a.type];
  const stride = bv.byteStride || 4 * nc;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const dv = new DataView(g.bin.buffer, g.bin.byteOffset, g.bin.byteLength);
  for (let i = 0; i < a.count; i++) for (let c = 0; c < nc; c++) dv.setFloat32(base + i * stride + c * 4, data[i * nc + c], true);
  // refresh min/max for VEC3 positions and scalar times
  if (a.min || a.max) {
    const mn = new Array(nc).fill(Infinity);
    const mx = new Array(nc).fill(-Infinity);
    for (let i = 0; i < a.count; i++) for (let c = 0; c < nc; c++) { const v = data[i * nc + c]; if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; }
    a.min = mn;
    a.max = mx;
  }
}

/** Append a float accessor (its own tightly packed bufferView) to the BIN; returns the new accessor index. */
export function addAccessorFloat(g, data, type, withMinMax = false) {
  const nc = NCOMP[type];
  const count = data.length / nc;
  const pad = (4 - (g.bin.length % 4)) % 4;
  const start = g.bin.length + pad;
  const buf = Buffer.alloc(count * nc * 4);
  for (let i = 0; i < data.length; i++) buf.writeFloatLE(data[i], i * 4);
  g.bin = Buffer.concat([g.bin, Buffer.alloc(pad), buf]);
  g.json.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: buf.length });
  const acc = { bufferView: g.json.bufferViews.length - 1, componentType: 5126, count, type };
  if (withMinMax) {
    const mn = new Array(nc).fill(Infinity);
    const mx = new Array(nc).fill(-Infinity);
    for (let i = 0; i < count; i++) for (let c = 0; c < nc; c++) { const v = data[i * nc + c]; if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; }
    acc.min = mn;
    acc.max = mx;
  }
  g.json.accessors.push(acc);
  return g.json.accessors.length - 1;
}

export const nodeIndexByName = (g) => {
  const m = new Map();
  g.json.nodes.forEach((n, i) => m.set(n.name, i));
  return m;
};

// ---- tiny matrix / quaternion helpers (column-major 4x4 as glTF) ----
export const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qinv = (a) => [-a[0], -a[1], -a[2], a[3]];
export const qnorm = (a) => { const l = Math.hypot(a[0], a[1], a[2], a[3]) || 1; return [a[0] / l, a[1] / l, a[2] / l, a[3] / l]; };
export function qrot(q, v) {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}
export const mat4Identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function mat4Mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; }
  return o;
}
export function mat4FromTRS(t, q, s) {
  const [x, y, z, w] = q;
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * s[0], 2 * (xy + wz) * s[0], 2 * (xz - wy) * s[0], 0,
    2 * (xy - wz) * s[1], (1 - 2 * (xx + zz)) * s[1], 2 * (yz + wx) * s[1], 0,
    2 * (xz + wy) * s[2], 2 * (yz - wx) * s[2], (1 - 2 * (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}
export function mat4Inv(m) {
  const inv = new Array(16);
  inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
  inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
  inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
  inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
  inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
  inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
  inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
  inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
  inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
  inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
  inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
  inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
  inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
  inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
  inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
  inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
  let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
  det = 1 / det;
  return inv.map((v) => v * det);
}

/** Node world matrices from the local TRS in the JSON (bind pose). Returns an array of 16-arrays by node index. */
export function worldMatrices(g) {
  const n = g.json.nodes;
  const parent = new Array(n.length).fill(-1);
  n.forEach((nd, i) => (nd.children || []).forEach((c) => (parent[c] = i)));
  const world = new Array(n.length);
  const local = (nd) => nd.matrix ? nd.matrix.slice() : mat4FromTRS(nd.translation || [0, 0, 0], nd.rotation || [0, 0, 0, 1], nd.scale || [1, 1, 1]);
  const calc = (i) => {
    if (world[i]) return world[i];
    const l = local(n[i]);
    world[i] = parent[i] < 0 ? l : mat4Mul(calc(parent[i]), l);
    return world[i];
  };
  n.forEach((_, i) => calc(i));
  return { world, parent };
}

/**
 * Repack the glTF: drop the accessors nothing refers to and keep only the bufferViews something still refers to (an accessor or an image), in their order, 4-byte aligned, and renumber every reference. Drops the bytes a rewrite left behind (a replaced index
 * accessor, a replaced image). Returns the number of bytes freed.
 */
export function compactGlb(g) {
  const j = g.json;
  // 1. drop the accessors nothing refers to (a replaced index list leaves its old accessor behind), renumbering the references
  const refd = new Set();
  const note = (i) => { if (i !== undefined) refd.add(i); };
  for (const m of j.meshes || []) for (const p of m.primitives || []) { Object.values(p.attributes || {}).forEach(note); note(p.indices); for (const t of p.targets || []) Object.values(t).forEach(note); }
  for (const sk of j.skins || []) note(sk.inverseBindMatrices);
  for (const an of j.animations || []) for (const sm of an.samplers || []) { note(sm.input); note(sm.output); }
  const amap = new Map();
  const accs = [];
  (j.accessors || []).forEach((a, i) => { if (refd.has(i)) { amap.set(i, accs.length); accs.push(a); } });
  const re = (i) => (i === undefined ? i : amap.get(i));
  for (const m of j.meshes || []) for (const p of m.primitives || []) {
    for (const k of Object.keys(p.attributes || {})) p.attributes[k] = re(p.attributes[k]);
    if (p.indices !== undefined) p.indices = re(p.indices);
    for (const t of p.targets || []) for (const k of Object.keys(t)) t[k] = re(t[k]);
  }
  for (const sk of j.skins || []) if (sk.inverseBindMatrices !== undefined) sk.inverseBindMatrices = re(sk.inverseBindMatrices);
  for (const an of j.animations || []) for (const sm of an.samplers || []) { sm.input = re(sm.input); sm.output = re(sm.output); }
  if (j.accessors) j.accessors = accs;
  // 2. repack the bufferViews something still refers to
  const used = new Set();
  for (const a of j.accessors || []) if (a.bufferView !== undefined) used.add(a.bufferView);
  for (const im of j.images || []) if (im.bufferView !== undefined) used.add(im.bufferView);
  const map = new Map();
  const views = [];
  const pieces = [];
  let off = 0;
  (j.bufferViews || []).forEach((bv, i) => {
    if (!used.has(i)) return;
    const pad = (4 - (off % 4)) % 4;
    if (pad) { pieces.push(Buffer.alloc(pad)); off += pad; }
    const start = bv.byteOffset || 0;
    pieces.push(g.bin.subarray(start, start + bv.byteLength));
    map.set(i, views.length);
    views.push({ ...bv, byteOffset: off });
    off += bv.byteLength;
  });
  const before = g.bin.length;
  for (const a of j.accessors || []) if (a.bufferView !== undefined) a.bufferView = map.get(a.bufferView);
  for (const im of j.images || []) if (im.bufferView !== undefined) im.bufferView = map.get(im.bufferView);
  j.bufferViews = views;
  g.bin = Buffer.concat(pieces);
  return before - g.bin.length;
}

/** Replace image `index`'s bytes (an embedded image) with `bytes`: a new bufferView at the end of the BIN (call {@link compactGlb} after to drop the old bytes). */
export function replaceImage(g, index, bytes, mimeType) {
  const pad = (4 - (g.bin.length % 4)) % 4;
  const start = g.bin.length + pad;
  g.bin = Buffer.concat([g.bin, Buffer.alloc(pad), bytes]);
  g.json.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: bytes.length });
  g.json.images[index].bufferView = g.json.bufferViews.length - 1;
  if (mimeType) g.json.images[index].mimeType = mimeType;
}
