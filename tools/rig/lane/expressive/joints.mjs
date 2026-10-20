// joints.mjs <rigDir> <artDir> : the joints the hole test watches (rig-holes.bodyJoints): name, depth and disc radius in the gate's raster px, the raster frame (sx, ox, oy) -> JSON on stdout
import { createRequire } from 'node:module';
const sharp = createRequire('D:/pyrefly-rig-rikkudk/package.json')('sharp'); // eslint-disable-line
import { loadModelInputs } from 'file:///D:/pyrefly-rig-rikkudk/tools/posescale/pose-model.mjs';
import { normaliseRig, readRigFile } from 'file:///D:/pyrefly-rig-rikkudk/tools/rig/rig-format.mjs';
import { bodyJoints } from 'file:///D:/pyrefly-rig-rikkudk/tools/rig/rig-holes.mjs';
import { rigContext } from 'file:///D:/pyrefly-rig-rikkudk/tools/rig/rig-read.mjs';
import { loadTextures } from 'file:///D:/pyrefly-rig-rikkudk/tools/rig/rig-raster.mjs';
const [rigDir, artDir] = process.argv.slice(2);
const { raw, dir } = readRigFile(rigDir);
const { rt } = normaliseRig(raw, { dir });
const inp = await loadModelInputs({ root: 'D:/pyrefly-rig-rikkudk', artDir });
const ctx = await rigContext(rt, inp);
await loadTextures(rt, dir);
const js = bodyJoints(ctx).map((j) => ({ name: j.name, depth: j.depth, r: j.r, meet: j.meet }));
console.log(JSON.stringify({ frame: { sx: ctx.frame.sx, sy: ctx.frame.sy, ox: ctx.frame.ox, oy: ctx.frame.oy, W: ctx.frame.W, H: ctx.frame.H }, joints: js }));
