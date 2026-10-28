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
 *   keys[]        the real key presses after the first command menu opens (default ["Enter","Enter"]: the first command, the first target); each a key name or { "key": "ArrowDown", "afterMs": 400 }, the wait after it
 *   focus[]       actor ids the crop follows (default: every actor)        crop { x, y, w, h }: a fixed region in viewport px instead (a HUD column: the turn-order list, the ATB bars)
 *   align         { kind: "start" } | { kind: "event", type: "damage", actor: "<figure id>", ordinal: 1 } | { kind: "beat", beat: { actor: "seymour", kind: "shake" } }: where the variants are put on the same instant
 *                 (default for an "until" card: that event). A BEAT is what the picture does: the figure's hit shake starting (the contact of a blow on it) or its pose changing ("kind": "pose", "pose": "hurt"). The battle
 *                 log is not the picture: in FFX the engine logs `damage` in the same instant as `action-start`, so only a beat anchors on the contact.
 *   strip         { event: "damage", ordinal: 1, offset: -2, frames: 12 } or { beat: { actor, kind, pose?, ordinal? }, offset: -2 }: where the 12 consecutive 60 Hz frames begin       leadMs 500, settleMs 1000, maxMs 8000
 * THE MOMENT BEYOND "ONE ATTACK" (review M5; every field optional, a card without them films exactly the first version's moment):
 *   setup[]       once the first command menu is open, before the play: { "hp": { "who": W, "set": 1 } } or { "hp": { "who": W, "fraction": 0.04 } } (a boss at a sliver so the first blow is its last; a girl at
 *                 1 HP under the next strike), { "quiet": W } (the chapter's own hit-point-threshold scripts about W count as played: lowering a boss otherwise runs them at the next action and they hold the menu
 *                 for seconds), or { "eval": "<debug-API expression>" } (stage a beat the routes do not reach). W is "party", "enemy" (the ENEMY side only: the boss and its guardians, never the party's aeons),
 *                 "boss" (the enemy with most hit points), "aeon" or a figure id. A sliver is `"set": 1`: a `fraction` of a 70,000-hit-point boss is 1,400 and the first blow (778) is not the last, and the
 *                 setup says so (a warning in the log, in KEY.json). Recorded in rec.json; the same for every variant. See tools/measure/setup.mjs.
 *   holdMenuMs    leave the first command menu OPEN this long before the first key (the ATB bars filling for 5 s: CP-08; the stance held for 2 s: CP-01)
 *   turns         press the keys again at each of the next command menus, up to 12 turns in all (two consecutive turns of the turn-order list: CP-11)
 *   until         { "event": "ko", "who": "<figure id>", "ordinal": 1, "afterMs": 1000 } or, for what the PICTURE does, { "beat": { "actor": "<figure id>", "kind": "life", "life": "down" }, "afterMs": 1500 }: play on,
 *                 turn after turn (the party is kept up), until that battle-log event or visual beat, then afterMs more (the boss going down: CP-06). THE LOG IS NOT THE PICTURE: FFX logs a blow and a knock-out in the
 *                 instant of the key press, a second or two before the figure falls, so a knock-out is a BEAT (life "down"). A card whose moment never happens is FAILED, not plain: exit 3, FAILED.txt, a red footer.
 *   window        { "event": "ko", "who": ..., "ordinal": 1, "beforeMs": 2000, "afterMs": 1500 } or { "beat": {...}, "beforeMs", "afterMs" }: cut the clip around that event or beat, whatever the turns before it
 *                 took (default for an "until" card). Without it the clip ends `settleMs` after the last of `turns` actions finished playing (the `play:action-end` phase), not after the next actor's cut-in.
 *   seconds       the longest the play may run, virtual seconds (default 14)
 * The window is cut by battle-log EVENT (the confirm key to the presenter finishing, plus settleMs), never by wall time. When a variant changes the timing, align on the contact event and each full move is shown.
 * WHAT THE FILM DOES NOT SHOW (review m20, CA-02): the virtual clock is the game at governor level 0, so a clip shows the SHAPE of a motion, not the cost of a frame; the CSS timeline (damage numerals, slabs,
 * the HUD's own animations) and the audio run on REAL time while a screenshot of every frame takes 100 ms or more, so an overlay inside the crop plays several times too fast against the canvas: crop to the
 * figures (the default), or judge a HUD item by its numbers and the booth PC. KEY.json carries the capture's build, tool id and rates beside the key.
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
import { applySetup } from './measure/setup.mjs';
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
        let setupDone = [];
        let setupWarnings = [];
        const cap = await captureSession({
          root: ROOT, base: server.base, query, chapter: spec.chapter, hz, viewport, who: 'mf-l5-abclip', what: `ab-clip ${spec.id} ${v.id} ${hz} Hz`, log,
          afterOpen: async (g) => {
            setupDone = await applySetup(g.page, spec.setup);
            if (setupDone.length) log(`setup: ${JSON.stringify(setupDone.map((d) => d.result))}`);
            setupWarnings = setupDone.flatMap((d) => d.warnings ?? []);
            for (const w of setupWarnings) log(`WARNING (setup): ${w}`);
          },
          play: (s) => playOneAttack({
            ...s, keys: spec.keys ?? ['Enter', 'Enter'], seconds: spec.seconds ?? 14, preRollMs: spec.leadMs ?? 500, tailMs: spec.settleMs ?? 1000,
            holdMenuMs: spec.holdMenuMs ?? 0, turns: spec.turns ?? 1, until: spec.until ?? null, keepAlive: Boolean(spec.until),
            onFrame: async (st, f) => { await s.g.page.screenshot({ path: path.join(dir, 'frames', `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 82 }); shots++; },
          }),
        });
        const meta = { variant: v, hz, query, chapter: spec.chapter, dist, viewport, setup: setupDone, setupWarnings, started: cap.started, ended: cap.result.ended, steps: cap.steps, virtualMs: cap.virtualMs, diag: cap.diag, consoleErrors: cap.consoleErrors, shots, stamp };
        fs.writeFileSync(path.join(dir, 'rec.json'), JSON.stringify({ meta, t0: cap.result.t0, untilAt: cap.result.untilAt ?? null, turns: cap.result.turns ?? 1, pressAt: cap.result.pressAt ?? [], frames: cap.frames, events: cap.events }));
        log(`${v.id} at ${hz} Hz: ${cap.frames.length} frames, ${shots} shots, ${cap.events.length} events, ${cap.result.turns ?? 1} turn(s), ended by ${cap.result.ended}`);
        if (spec.until && cap.result.ended !== 'event') log(`FAILED CARD: ${v.id} at ${hz} Hz never saw ${spec.until.beat ? `the beat ${JSON.stringify(spec.until.beat)}` : `the event ${spec.until.event}${spec.until.who ? ` of ${spec.until.who}` : ''}`} (ended by ${cap.result.ended} after ${cap.result.turns ?? 1} turn(s)): the composer will mark the card FAILED`);
      }
    }
  } catch (e) { log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600)); await server.close(); process.exit(1); }
  await server.close();
}

if (phase === 'compose' || phase === 'all') {
  const captured = [];
  for (const v of spec.variants) for (const hz of rates) {
    try { const r = JSON.parse(fs.readFileSync(path.join(workDir, `${v.id}-${hz}`, 'rec.json'), 'utf8')); captured.push({ variant: v.id, hz, ended: r.meta?.ended ?? null, untilAt: r.untilAt ?? null, turns: r.turns ?? 1, virtualMs: r.meta?.virtualMs ?? null, setup: r.meta?.setup ?? [], setupWarnings: r.meta?.setupWarnings ?? [] }); } catch { /* not captured in this run */ }
  }
  const results = await composeCard({ spec, workDir, outDir, root: ROOT, info: { dist, toolId: stamp.toolId, harness: stamp.harness?.id ?? null, head: stamp.tree?.head ?? null, dirty: stamp.tree?.dirty?.length ?? 0, viewport, captures: captured, setup: captured[0]?.setup ?? null } });
  const failures = results.flatMap((r) => r.failures.map((f) => `${r.hz} Hz ${f}`));
  for (const r of results) for (const f of r.files) log(`${r.hz} Hz ${f.kind}: ${path.basename(f.file)} ${(f.bytes / 1024 / 1024).toFixed(2)} MB${f.seconds ? ` ${f.seconds} s` : ''}${f.over ? '  OVER THE 8 MB BUDGET' : ''}`);
  if (!argv.includes('--keep-raw') && !failures.length) { fs.rmSync(workDir, { recursive: true, force: true }); log('raw frames removed'); }
  else if (failures.length) log(`the raw frames are KEPT in ${workDir} (the card failed; remove them when done)`);
  log(`card written to ${outDir}`);
  if (failures.length) { for (const f of failures) log(`FAILED CARD: ${f}`); process.exit(3); }
}
