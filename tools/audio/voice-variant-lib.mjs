/**
 * The two takes of the FFX voice pass and the plan that stages one of them for `voice-ship.mjs`.
 *
 * Bailey has the 203 recordings in two variants (2026-10-07) and has not yet picked between them:
 *  - `recorded`: the files exactly as ElevenLabs returned them. 81 of them hold a pause of more than 400 ms inside the line, which the
 *    ship gate FAILS (`findings` in voice-ship-lib.mjs), so this variant installs only with those findings accepted.
 *  - `tight`: the same 203 files, with the 81 over-long pauses shortened (`<id>.tight.mp3` beside the original in the listening
 *    folder). The other 122 recordings are the originals unchanged. This is the only variant that passes the gate on its own,
 *    so it is the default.
 *
 * `voice-ship.mjs` reads `<dir>/<id>.mp3`, so a variant is staged as one folder of hard links (copies where a link is not possible)
 * named the way the ship step expects. Nothing here touches the network, the key or a source file. Game case: FFX only (voice-lib.mjs).
 */

import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';

/** A candidate recording: `<id>.mp3` (not a retake `<id>.take2.mp3` and not a shortened `<id>.tight.mp3`). Returns the id or null. */
export function recordingIdOf(fileName) {
  const m = /^(.+)\.mp3$/.exec(fileName);
  if (!m) return null;
  return /\.(take\d+|tight)$/.test(m[1]) ? null : m[1];
}

export function loadVariants(file) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  for (const name of Object.keys(doc.variants)) {
    if (!doc.variants[name].dir) throw new Error(`variant "${name}" names no dir`);
  }
  if (!doc.variants[doc.default]) throw new Error(`default variant "${doc.default}" is not defined`);
  return doc;
}

/**
 * Which file each recording uses under a variant. `overlay` (a folder, with `suffix`) replaces a recording's file when it has one.
 * Returns { files: Map id -> source path, overlaid: [ids], ids: [ids] }. Throws on a replacement with no original beside it,
 * which would mean the two folders do not describe the same recordings.
 */
export function planVariant(variant, { list = readdirSync, exists = existsSync } = {}) {
  const base = new Map();
  for (const name of list(variant.dir)) {
    const id = recordingIdOf(name);
    if (id) base.set(id, path.join(variant.dir, name));
  }
  const files = new Map(base);
  const overlaid = [];
  if (variant.overlay) {
    const suffix = variant.suffix ?? '.tight.mp3';
    for (const name of list(variant.overlay)) {
      if (!name.endsWith(suffix)) continue;
      const id = name.slice(0, -suffix.length);
      if (!base.has(id)) throw new Error(`${name} has no original ${id}.mp3 in ${variant.dir}`);
      if (!exists(path.join(variant.overlay, name))) continue;
      files.set(id, path.join(variant.overlay, name));
      overlaid.push(id);
    }
  }
  return { files, overlaid: overlaid.sort(), ids: [...files.keys()].sort() };
}

/**
 * Put a plan into `stagingDir` as `<id>.mp3`. A file already there with the same size and bytes is kept; anything else the plan
 * does not name is unlinked (the folder holds only links and copies this tool made; the sources are never touched).
 * Returns { linked, copied, kept, removed }.
 */
export function stage(plan, stagingDir) {
  mkdirSync(stagingDir, { recursive: true });
  const out = { linked: 0, copied: 0, kept: 0, removed: 0 };
  const wanted = new Set(plan.ids.map((id) => `${id}.mp3`));
  for (const name of readdirSync(stagingDir)) {
    if (!wanted.has(name)) { unlinkSync(path.join(stagingDir, name)); out.removed++; }
  }
  for (const id of plan.ids) {
    const from = plan.files.get(id);
    const to = path.join(stagingDir, `${id}.mp3`);
    if (existsSync(to)) {
      if (sameFile(from, to)) { out.kept++; continue; }
      unlinkSync(to);
    }
    try { linkSync(from, to); out.linked++; } catch { copyFileSync(from, to); out.copied++; }
  }
  return out;
}

const sameFile = (a, b) => {
  const sa = statSync(a);
  const sb = statSync(b);
  return sa.size === sb.size && readFileSync(a).equals(readFileSync(b));
};

/**
 * The `voice-ship.mjs` arguments for a variant: its staged folder, the mute list, and (for a variant whose files fail the
 * silence gate) the ids to accept. `accept` is the overlaid ids of the variant that has an overlay on the OTHER side, so the
 * caller passes them; an accepted id that has no finding is a no-op in voice-ship.
 */
export function shipArgs({ name, stagingDir, mute = [], accept = [], install = true, extra = [] }) {
  const args = ['--dir', stagingDir, '--variant', name];
  if (mute.length) args.push('--mute', mute.join(','));
  if (accept.length) args.push('--accept', accept.join(','));
  if (install) args.push('--install', '--clean');
  return [...args, ...extra];
}
