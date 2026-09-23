#!/usr/bin/env node
/**
 * Round-4 post-process: productionises the round-3 ping-pong pass
 * (docs/concepts/pause-until-dawn/video-flf/round3/pingpong.md, commit 5ed1f92) and its
 * scratch scripts into one reusable tool, per
 * docs/concepts/pause-until-dawn/video-flf/round4/method-check.md SS3(a): "Colour-match
 * + ping-pong (proven above) is adopted as the standing join method for every clip that
 * reaches judge-quality motion... `tools/gen/video-post.mjs` packages this as a reusable
 * step... so the next clip that passes a motion judge does not need a bespoke script."
 *
 * All the numpy-heavy pixel work (the colour-match fit, the turnaround pick, every box
 * MAD/saturation number, the contact sheet) lives in the python helper
 * (tools/gen/video-post.py, same split as tools/gen/join_report.py) — this file drives
 * it, then does the two things that stay in ffmpeg: encoding the corrected frames into
 * a forward-only and a ping-pong WebM + MP4, and reporting their sizes.
 *
 * Ping-pong construction (pingpong.md SS "What this is"): play forward 1..T, then back
 * down to frame 2 -- frame 1 is never re-shown, so the loop always returns to exactly
 * the pixels it started from and the cut between two different clips lands on their
 * shared anchor (frame 1) instead of on whatever the model's last rendered frame looks
 * like. This tool always builds from the COLOUR-MATCHED frames (step 1 below); the
 * report still carries the raw-vs-cm comparison numbers so a reviewer can see what the
 * colour match changed, matching pingpong.md's own raw/cm side-by-side tables.
 *
 * Usage:
 *   node tools/gen/video-post.mjs <clipDir> --plate <plate.png> \
 *     [--turnaround N | --auto-turnaround] [--fps 24] [--out <dir>] \
 *     [--vae-floor <floor.png>] [--pinned-boxes body,bgLeft,bgRight] \
 *     [--motion-boxes face,eyes,mouth,braid,hairline] \
 *     [--still-window 4] [--calm-factor 3.0] [--search-start-frac 0.5] \
 *     [--lookahead-factor 1.1]
 *
 * Example (this round's own unit-check, both existing clips):
 *   node tools/gen/video-post.mjs D:/Tools/pyrefly-video/flf/idle-blinks/1 \
 *     --plate D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png \
 *     --vae-floor D:/Tools/pyrefly-video/flf/vae-floor/pyrefly-video-plate-f1efe21f6c75-1280x704-floor.png
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync, copyFileSync, linkSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));
const PY_HELPER = join(HERE, 'video-post.py');

// --------------------------------------------------------------------------
// CLI parsing (same small parser as tools/gen/video-flf.mjs)
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function usage() {
  console.error(
    'Usage:\n' +
      '  node tools/gen/video-post.mjs <clipDir> --plate <plate.png>\n' +
      '    [--turnaround N | --auto-turnaround] [--fps 24] [--out <dir>]\n' +
      '    [--vae-floor <floor.png>] [--pinned-boxes body,bgLeft,bgRight]\n' +
      '    [--motion-boxes face,eyes,mouth,braid,hairline]\n' +
      '    [--still-window 4] [--calm-factor 3.0] [--search-start-frac 0.5]\n' +
      '    [--lookahead-factor 1.1]\n',
  );
}

// --------------------------------------------------------------------------
// Step 1: the python helper (colour match, turnaround pick, join numbers,
// contact sheet). See tools/gen/video-post.py's own header for the algorithm.
// --------------------------------------------------------------------------

function runPythonPost(clipDir, plate, outDir, opts) {
  const args = [PY_HELPER, clipDir, plate, outDir];
  if (opts.turnaround) args.push('--turnaround', String(opts.turnaround));
  if (opts.vaeFloor) args.push('--vae-floor', opts.vaeFloor);
  if (opts.pinnedBoxes) args.push('--pinned-boxes', opts.pinnedBoxes);
  if (opts.motionBoxes) args.push('--motion-boxes', opts.motionBoxes);
  if (opts.stillWindow) args.push('--still-window', String(opts.stillWindow));
  if (opts.calmFactor) args.push('--calm-factor', String(opts.calmFactor));
  if (opts.searchStartFrac) args.push('--search-start-frac', String(opts.searchStartFrac));
  if (opts.lookaheadFactor) args.push('--lookahead-factor', String(opts.lookaheadFactor));

  const res = spawnSync('python', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(`video-post.py failed:\n${res.stderr || res.stdout}`);
  }
  const lastLine = res.stdout.trim().split('\n').pop();
  const summary = JSON.parse(lastLine);
  const report = JSON.parse(readFileSync(summary.reportPath, 'utf8'));
  return { summary, report, reportPath: summary.reportPath };
}

// --------------------------------------------------------------------------
// Step 2: build the two frame orderings ffmpeg will encode. Forward-only is
// just the colour-matched frames as they are; ping-pong needs a reordered
// copy (1..T, then T-1..2) because ffmpeg's image2 demuxer wants a single
// sequential numbering.
// --------------------------------------------------------------------------

function pingpongOrder(frameCount, t) {
  const order = [];
  for (let i = 1; i <= t; i++) order.push(i);
  for (let i = t - 1; i >= 2; i--) order.push(i);
  return order;
}

function materialiseSequence(framesCmDir, order, destDir) {
  mkdirSync(destDir, { recursive: true });
  order.forEach((frameNum, idx) => {
    const src = join(framesCmDir, `frame_${String(frameNum).padStart(5, '0')}.png`);
    const dst = join(destDir, `frame_${String(idx + 1).padStart(5, '0')}.png`);
    try {
      // Hardlink is instant and free of disk cost; fall back to a copy if the
      // volume/filesystem does not support it (e.g. across drives).
      linkSync(src, dst);
    } catch {
      copyFileSync(src, dst);
    }
  });
}

// --------------------------------------------------------------------------
// Step 3: ffmpeg encode. Fixed quality (not the round-1 tool's size-fitting
// ladder): VP9 crf 30, H.264 crf 20, exactly as this round's brief asks for.
// --------------------------------------------------------------------------

function encodeWebm(framesDir, frameCount, fps, outPath) {
  const pattern = join(framesDir, 'frame_%05d.png');
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-framerate', String(fps), '-i', pattern, '-frames:v', String(frameCount), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-pix_fmt', 'yuv420p', '-row-mt', '1', outPath],
    { encoding: 'utf8' },
  );
  if (res.status !== 0 || !existsSync(outPath)) throw new Error(`ffmpeg (webm) failed for ${outPath}:\n${res.stderr || res.stdout}`);
  return { path: outPath, size: statSync(outPath).size };
}

function encodeMp4(framesDir, frameCount, fps, outPath) {
  const pattern = join(framesDir, 'frame_%05d.png');
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-framerate', String(fps), '-i', pattern, '-frames:v', String(frameCount), '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath],
    { encoding: 'utf8' },
  );
  if (res.status !== 0 || !existsSync(outPath)) throw new Error(`ffmpeg (mp4) failed for ${outPath}:\n${res.stderr || res.stdout}`);
  return { path: outPath, size: statSync(outPath).size };
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  const [clipDir, ...rest] = process.argv.slice(2);
  if (!clipDir || clipDir.startsWith('--')) {
    usage();
    process.exitCode = 1;
    return;
  }
  const args = parseArgs(rest);
  if (!args.plate) {
    console.error('--plate <png> is required');
    usage();
    process.exitCode = 1;
    return;
  }
  if (args.turnaround && args['auto-turnaround']) {
    console.error('--turnaround and --auto-turnaround are mutually exclusive');
    process.exitCode = 1;
    return;
  }

  const resolvedClipDir = resolve(clipDir);
  if (!existsSync(resolvedClipDir)) throw new Error(`clipDir not found: ${resolvedClipDir}`);

  let job = {};
  const jobPath = join(resolvedClipDir, 'job.json');
  if (existsSync(jobPath)) {
    try {
      job = JSON.parse(readFileSync(jobPath, 'utf8'));
    } catch {
      job = {};
    }
  }

  const outDir = args.out ? resolve(args.out) : join(resolvedClipDir, 'post');
  mkdirSync(outDir, { recursive: true });

  const pyOpts = {
    turnaround: args.turnaround ? Number(args.turnaround) : undefined,
    vaeFloor: args['vae-floor'],
    pinnedBoxes: args['pinned-boxes'],
    motionBoxes: args['motion-boxes'],
    stillWindow: args['still-window'],
    calmFactor: args['calm-factor'],
    searchStartFrac: args['search-start-frac'],
    lookaheadFactor: args['lookahead-factor'],
  };

  console.log(`[video-post] clip: ${resolvedClipDir}`);
  console.log(`[video-post] running colour-match + turnaround pick + join numbers (python)...`);
  const { report, reportPath } = runPythonPost(resolvedClipDir, resolve(args.plate), outDir, pyOpts);
  const { turnaround: t, frameCount: n, framesCmDir } = report;
  console.log(`[video-post] ${n} frames, turnaround T=${t} (${report.turnaroundInfo.method})`);

  const fps = args.fps ? Number(args.fps) : job.fps || 24;

  console.log(`[video-post] encoding forward-only (1..${n}) at ${fps} fps...`);
  const forwardWebm = encodeWebm(framesCmDir, n, fps, join(outDir, 'forward.webm'));
  const forwardMp4 = encodeMp4(framesCmDir, n, fps, join(outDir, 'forward.mp4'));

  const order = pingpongOrder(n, t);
  const pingpongDir = join(outDir, 'frames-pingpong');
  console.log(`[video-post] building ping-pong order (1..${t}, ${t - 1}..2 = ${order.length} frames)...`);
  materialiseSequence(framesCmDir, order, pingpongDir);
  console.log(`[video-post] encoding ping-pong (${order.length} frames) at ${fps} fps...`);
  const pingpongWebm = encodeWebm(pingpongDir, order.length, fps, join(outDir, 'pingpong.webm'));
  const pingpongMp4 = encodeMp4(pingpongDir, order.length, fps, join(outDir, 'pingpong.mp4'));
  rmSync(pingpongDir, { recursive: true, force: true });

  const finalReport = {
    ...report,
    fps,
    builds: {
      forward: { frameCount: n, webm: forwardWebm, mp4: forwardMp4 },
      pingpong: { frameCount: order.length, order: [order[0], '...', order[order.length - 1]], webm: pingpongWebm, mp4: pingpongMp4 },
    },
  };
  writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

  console.log(`[video-post] forward:  ${forwardWebm.path} (${(forwardWebm.size / 1024).toFixed(0)} KiB) / ${forwardMp4.path} (${(forwardMp4.size / 1024).toFixed(0)} KiB)`);
  console.log(`[video-post] pingpong: ${pingpongWebm.path} (${(pingpongWebm.size / 1024).toFixed(0)} KiB) / ${pingpongMp4.path} (${(pingpongMp4.size / 1024).toFixed(0)} KiB)`);
  console.log(`[video-post] contact sheet: ${report.contactSheet}`);
  console.log(`[video-post] report: ${reportPath}`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

export { pingpongOrder, runPythonPost };
