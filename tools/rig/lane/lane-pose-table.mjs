/**
 * What the scaffold needs of the pose model (the lane kit; the rig program, 2026-10-18): the poses the game paints a subject in, and each pose's registration row (the head box in fractions of the
 * painting, the stance column), read by the same `tools/posescale/pose-model.mjs` the gate reads, so the scaffold and the gate agree on where the head is.
 *
 *   node tools/rig/lane/lane-pose-table.mjs --subject kimahri [--art D:/pyrefly-art-r50] [--root <tree>]      prints JSON: { subject, poses, rows }
 */
import { resolve } from 'node:path';
import { loadModelInputs, listPoses } from '../../posescale/pose-model.mjs';
import { parseArgs } from './lane-pure.mjs';

const a = parseArgs(process.argv.slice(2));
if (!a.subject) { console.error('usage: node tools/rig/lane/lane-pose-table.mjs --subject <art id> [--art DIR] [--root DIR]'); process.exit(2); }
const inputs = await loadModelInputs({ root: resolve(a.root ?? process.cwd()), artDir: a.art ? resolve(a.art) : undefined });
console.log(JSON.stringify({ subject: a.subject, poses: listPoses(inputs, a.subject), rows: inputs.table[a.subject] ?? {} }));
