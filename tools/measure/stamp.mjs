// Every measuring tool stamps which tool read its numbers (motion-fluidity pass, lane L5; both games, critic plumbing). Built on the post-tool-pin identity (tools/critic-harness-identity.mjs).
//
// The continuity harness drifted three times and each time the tool, not the game, moved a number (PR-0512, R63-T1, round 29). The same is true of a pacing run, an equality matrix or a jolt count: a number with no
// word on the tool that read it is not evidence. So each output file of these tools carries `stamp`: the id of the continuity harness of the tree the tool ran from (the route and the pose table the numbers lean
// on), the tree's HEAD and the files modified since it, and the git blob id of every file of the tool's own import closure, with one digest (`toolId`). `sameTool(a, b)` is what a before/after comparison asks:
// two numbers are comparable only when both were read by the same tool id.
//
// What the id covers (review M2): the entry's import closure, PLUS the files the tool reads at run time without importing them (`extraFiles`: the pacing recorder's page script is loaded with addInitScript,
// so a change to what a frame row holds would otherwise leave the id alone), PLUS a digest of the policy thresholds the tool's numbers depend on (`thresholds`: a jolt count under 2.5 px is not one under 3).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { blobId, harnessFiles, harnessIdentity } from '../critic-harness-identity.mjs';

export const TOOL_STAMP_SCHEMA = 'measure-tool/1';
const sha = (s) => createHash('sha256').update(s).digest('hex');

/** The digest of a tool's file list (path and blob id, sorted) and, when it has any, its thresholds (`thresholdsSha`; without them the digest is the files' alone). */
export function toolDigest(files, thresholdsSha = '') {
  return sha(`${TOOL_STAMP_SCHEMA}\n${Object.keys(files).sort().map((f) => `${f}\t${files[f]}`).join('\n')}\n${thresholdsSha ? `thresholds\t${thresholdsSha}\n` : ''}`).slice(0, 12);
}

/** The digest of a thresholds object (keys sorted, so the order they are written in does not matter; nested objects are written as JSON with their keys sorted too). */
export function thresholdsDigest(thresholds) {
  const canon = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v));
  const keys = Object.keys(thresholds ?? {}).sort();
  return keys.length ? sha(keys.map((k) => `${k}=${canon(thresholds[k])}`).join('\n')).slice(0, 12) : '';
}

/**
 * The stamp of a tool run.
 * @param {string} tool  the tool's name (`pace`, `hz-matrix`, ...)
 * @param {string} entry the tool's entry file, repo-relative (`tools/pace.mjs`)
 * @param {string} root  the tree the tool runs from
 * @param {{ identity?: object, extraFiles?: string[], thresholds?: object|null }} [o] `identity` injects a harness identity (tests); `extraFiles` are repo-relative files the tool reads at run time
 *   without importing them; `thresholds` are the policy numbers its output depends on (digested into the id and written into the stamp)
 */
export function toolStamp(tool, entry, root, { identity, extraFiles = [], thresholds = null } = {}) {
  const id = identity ?? harnessIdentity(root);
  const files = {};
  for (const x of extraFiles) if (!fs.existsSync(path.join(root, x))) throw new Error(`toolStamp(${tool}): the run-time file ${x} is not in ${root}`);
  for (const f of [...harnessFiles(root, [entry], []), ...extraFiles.flatMap((x) => harnessFiles(root, [x], []))]) files[f] = blobId(fs.readFileSync(path.join(root, f)));
  const thresholdsSha = thresholdsDigest(thresholds);
  return {
    schema: TOOL_STAMP_SCHEMA,
    tool,
    toolId: toolDigest(files, thresholdsSha),
    toolFiles: files,
    ...(thresholdsSha ? { thresholds, thresholdsSha } : {}),
    harness: { id: id.id, files: Object.keys(id.files).length, policy: id.policy?.continuitySha256?.slice(0, 8) ?? null, probeVersion: id.probe?.version ?? null },
    tree: { root: id.tree?.root ?? null, head: id.tree?.head ?? null, dirty: id.tree?.dirty ?? null },
    node: process.version,
    at: new Date().toISOString(),
  };
}

/** A line for a log: `pace 3fa9c1d20b44 (harness 4de5d0750fd4; tree D:/x at 24c3922; 2 file(s) modified since HEAD)`. */
export function describeStamp(s) {
  const dirty = s.tree?.dirty?.length ? `; ${s.tree.dirty.length} file(s) modified since HEAD` : '';
  return `${s.tool} ${s.toolId} (harness ${s.harness?.id?.slice(0, 12)}; tree ${s.tree?.root} at ${s.tree?.head?.slice(0, 7) ?? '?'}${dirty})`;
}

/** Were two outputs read by the same tool and the same harness? Returns the reasons they were not (empty: comparable). */
export function incomparable(a, b) {
  if (!a || !b) return ['one of the two outputs has no stamp'];
  const why = [];
  if (a.tool !== b.tool) why.push(`different tools (${a.tool}, ${b.tool})`);
  if (a.toolId !== b.toolId) why.push(`different tool files (${a.toolId}, ${b.toolId})`);
  if (a.harness?.id !== b.harness?.id) why.push(`different continuity harness (${a.harness?.id}, ${b.harness?.id})`);
  return why;
}
