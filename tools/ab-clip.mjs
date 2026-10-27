#!/usr/bin/env node
/**
 * The A/B clip factory: ONE command per clip card (T-04 of the motion-fluidity pass, lane L5; both games, tooling).
 *
 *   PYREFLY_BROWSER=gpu node tools/ab-clip.mjs --spec <card.json> [--out <cards folder>] [--work <scratch folder>] [--phase capture|compose|all] [--keep-raw] [--force] [--only V1:120]
 *
 * A look variant of the pass is an address word on ONE built candidate whose default is today (no rebuild between A and B). A card plays every variant of one moment from that SAME build: seed 1, the same real
 * key presses, a virtual clock (tools/measure/session.mjs: Playwright's fake clock and a manual frame queue, so a frame is exactly 1/60, 1/120 or 1/144 s and none is ever late), headless GPU Chromium at the
 * booth's 2560 x 1440. Each (variant, rate) is its own browser session under its own RIG-RECORD hold (10 minutes at most). The composer (tools/measure/ab-compose.mjs, CPU only) then crops every variant to the
 * SAME 16:9 region around the action, scales each panel to 720 x 405, stacks the variants (720 x 810 for two) in a BLIND order seeded by the card id (letters only in the picture; the key is KEY.json), and
 * writes, per rate: the real-time clip (60 fps H.264, CRF 20 stepped up to fit 8 MB, 8 s at most), the quarter-speed copy of captures faster than 60 Hz (every captured frame at a quarter of the capture rate),
 * a 1080 px wide still with the 12-frame strip (A rows over B rows, each frame stamped with its offset and ms), and the speed trace (px per 60 Hz frame at 2560 wide). Names follow the core lane's:
 * AB-<chapter>-<move>-<hz>[-slow4x].mp4. The raw frames (a few hundred MB a card) are deleted after the compose unless --keep-raw.
 *
 * THE SPEC (JSON):
 *   id            the card's name and folder, e.g. "CP-03-ch1-hit-light"            chapter   "seymour-flux" | "ffx2-bahamut" | ...        move   short name for the files ("hit-light")
 *   build         the built folder to serve (default: <repo>/dist-gate; --dist overrides)    queryBase  e.g. "?coach=off"           title, questions[]   the card's heading and one-line questions
 *   variants[]    { id, name, query }: `query` is the variant's address words ("&hit=ramp"); the FIRST variant is "today" by convention. At least two.
 *   rates[]       capture rates, default [60]: 60 for the clip, add 120 (or 144 for a rate item) for the quarter-speed copy
 *   keys[]        the real key presses after the first command menu opens (default ["Enter","Enter"]: the first command, the first target)
 *   focus[]       actor ids the crop follows (default: every actor)        align { kind: "start" } | { kind: "event", type: "damage", ordinal: 1 }: where the variants are put on the same instant
 *   strip         { event: "damage", ordinal: 1, offset: -2, frames: 12 }: where the 12 consecutive 60 Hz frames begin       leadMs 500, settleMs 1000, maxMs 8000
 * The window is cut by battle-log EVENT (the confirm key to the presenter finishing, plus settleMs), never by wall time. When a variant changes the timing, align on the contact event and each full move is shown.
 *
 * Every output file set carries `stamp.json` (tools/measure/stamp.mjs): which tool and which continuity harness made the card.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkSpec, joinQuery } from '../critic/runner/lib/ab-pure.mjs';
import { composeCard } from './measure/ab-compose.mjs';
import { captureSession } from './measure/capture.mjs';
import { playOneAttack } from './measure/fight.mjs';
import { serveDist } from './measure/serve.mjs';
import { describeStamp, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[ab-clip]', ...m);

const specFile = val('spec', null);
if (!specFile) { console.log('usage: node tools/ab-clip.mjs --spec <card.json> [--out <cards folder>] [--work <scratch>] [--phase capture|compose|all] [--keep-raw] [--force] [--only V1:120] (see the header)'); process.exit(64); }
const spec = JSON.parse(fs.readFileSync(path.resolve(specFile), 'utf8'));
const bad = checkSpec(spec);
if (bad.length) { console.error(`the spec ${specFile} cannot be filmed: ${bad.join('; ')}`); process.exit(65); }
const phase = String(val('phase', 'all'));
const outRoot = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'cards'))));
const workDir = path.resolve(String(val('work', path.join(outRoot, '.work', spec.id))));
const outDir = path.join(outRoot, spec.id);
const dist = path.resolve(String(val('dist', spec.build ?? path.join(ROOT, 'dist-gate'))));
const rates = spec.rates ?? [60];
const viewport = { width: spec.viewport?.w ?? 2560, height: spec.viewport?.h ?? 1440 };
const only = val('only', null) ? String(val('only')).split(',') : null; // "V1:120"
process.env.PYREFLY_BROWSER ??= 'gpu';
fs.mkdirSync(workDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
const stamp = toolStamp('ab-clip', 'tools/ab-clip.mjs', ROOT);
log(describeStamp(stamp));
fs.writeFileSync(path.join(outDir, 'stamp.json'), JSON.stringify({ ...stamp, spec: spec.id, dist }, null, 1));

if (phase === 'capture' || phase === 'all') {
  const server = await serveDist(dist);
  log(`serving ${dist} at ${server.base}`);
  try {
    for (const v of spec.variants) {
      for (const hz of rates) {
        if (only && !only.includes(`${v.id}:${hz}`)) continue;
        const dir = path.join(workDir, `${v.id}-${hz}`);
        if (fs.existsSync(path.join(dir, 'rec.json')) && !argv.includes('--force')) { log(`${v.id} at ${hz} Hz is already captured (--force to film again)`); continue; }
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(path.join(dir, 'frames'), { recursive: true });
        const query = joinQuery(spec.queryBase ?? '?coach=off', v.query ?? '');
        log(`== ${spec.id}: ${v.id} (${v.name ?? ''}) at ${hz} Hz, ${query || '(no address words)'}`);
        let shots = 0;
        const cap = await captureSession({
          root: ROOT, base: server.base, query, chapter: spec.chapter, hz, viewport, who: 'mf-l5-abclip', what: `ab-clip ${spec.id} ${v.id} ${hz} Hz`, log,
          play: (s) => playOneAttack({
            ...s, keys: spec.keys ?? ['Enter', 'Enter'], seconds: 14, preRollMs: spec.leadMs ?? 500, tailMs: spec.settleMs ?? 1000,
            onFrame: async (st, f) => { await s.g.page.screenshot({ path: path.join(dir, 'frames', `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 82 }); shots++; },
          }),
        });
        const meta = { variant: v, hz, query, chapter: spec.chapter, dist, viewport, started: cap.started, ended: cap.result.ended, steps: cap.steps, virtualMs: cap.virtualMs, diag: cap.diag, consoleErrors: cap.consoleErrors, shots, stamp };
        fs.writeFileSync(path.join(dir, 'rec.json'), JSON.stringify({ meta, t0: cap.result.t0, frames: cap.frames, events: cap.events }));
        log(`${v.id} at ${hz} Hz: ${cap.frames.length} frames, ${shots} shots, ${cap.events.length} events, ended by ${cap.result.ended}`);
      }
    }
  } catch (e) { log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600)); await server.close(); process.exit(1); }
  await server.close();
}

if (phase === 'compose' || phase === 'all') {
  const results = await composeCard({ spec, workDir, outDir, root: ROOT });
  for (const r of results) for (const f of r.files) log(`${r.hz} Hz ${f.kind}: ${path.basename(f.file)} ${(f.bytes / 1024 / 1024).toFixed(2)} MB${f.seconds ? ` ${f.seconds} s` : ''}${f.over ? '  OVER THE 8 MB BUDGET' : ''}`);
  if (!argv.includes('--keep-raw')) { fs.rmSync(workDir, { recursive: true, force: true }); log('raw frames removed'); }
  log(`card written to ${outDir}`);
}
