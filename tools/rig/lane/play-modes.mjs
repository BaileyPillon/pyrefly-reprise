/**
 * **The four things a lane records** (the lane kit; the rig program, 2026-10-18), one function each, for any subject of `lane-subjects.json`. Ported from the per-subject scripts the Kimahri and
 * Lulu lanes copied (`strike-frames`, `hurtko-real`, `poses-clip`, `lulu-moment`, `fight-virtual`): the chapter's door word, the actor id and the landmark names are the registry's; nothing else differs.
 *
 *   poses    each named pose set straight on the actor (idle easing into it and held), 130 frames at 60 Hz a pose: the authored clips' frames. Also `rig-signature.json`: a hash a frame of everything the rig
 *            hands the GPU (every part mesh's skinned positions, visibility and depth, and the parts' texture and rim uniforms), so two engines can be compared EXACTLY where a pixel diff has the
 *            ambient grain of the scene in it (`lane.py framediff` reads both) `critical` and `sleep` are driven the way the game drives
 *            them (HP under half, the sleep status: `restPoses.ts`), the others by `setPose`
 *   cast     the other party members defend until the actor has a command; then the actor's own menu (`spec.castKeys`: the keys to its first spell), the first target; frames from the menu to the end of the
 *            played action and a tail
 *   hurtko   the presenter plays an auto battle where everyone defends; the first enemy action that hurts the actor is recorded; then its HP is set to 1 (the ONLY debug write) and the next one downs it
 *   fight    the whole fight on the game's own `autoBattle('intended')`, seed 1, no frames kept: the tracker table and, when the tree has the critic's continuity probe, the probe's verdicts
 *   ko       the same fight, stopped `--tail` frames after the actor's KO swap, with the frames of the last stretch before it kept: once the actor is under half its HP every frame is grabbed into a ring, and
 *            the ring plus the tail is written (`frames/f<n>.jpg`, `ko.json`: the pose, life, projected box and, for a rig, the area of every part mesh as the GPU gets it, a frame). The hurt-to-KO size
 *            jump of an aeon is measured from this (rig on, and `--off` for the painting set), in the real chapter that fields it; the continuity probe runs in it too (vacuous for a rig)
 *
 * Real key presses everywhere else. The page's time only moves when the stepper runs the clock. Nothing in the repository is touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { frameMs, trackerPoints } from './lane-pure.mjs';
import { analyse, collectTracks, installTracker, pushTrack, toSamples } from './track.mjs';
import { installGrabber, makeStepper, pauseClock, reachFirstMenu } from './play-common.mjs';

const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 1));

/** Everything a mode shares: the game at the first menu, the clock paused, the grabber and the tracker installed, a stepper that tracks as it shoots. */
export async function prepare(g, spec, o) {
  await reachFirstMenu(g, spec);
  await pauseClock(g.page);
  const framesDir = path.join(o.out, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });
  const st = makeStepper(g.page, { dir: framesDir, log: g.log, onShot: (n) => pushTrack(g.page, n) });
  for (let i = 0; i < 6; i++) await st.step(false);
  if (o.shoot !== false) await installGrabber(g.page, o.quality);
  await installTracker(g.page, spec.actor, trackerPoints(spec));
  const who = spec.actor;
  const poseInfo = () => g.page.evaluate((id) => {
    const bs = window.__pyrefly.battle();
    if (!bs) return { cls: null, pose: null, life: 'no-battle' };
    const a = bs.stage.actor(id);
    const u = window.__pyrefly.battleState().combatants;
    const k = Array.isArray(u) ? u.find((x) => x.id === id) : u[id];
    return { cls: a.constructor.name, pose: a.pose, life: a.lifeState, blending: a.blending ?? null, hp: k?.hp, alive: k?.alive };
  }, who);
  return { st, framesDir, poseInfo, meta: { rig: o.rig, fps: 60, actor: who, state: await poseInfo() } };
}

async function finish(g, o, meta, withTracks) {
  writeJson(path.join(o.out, 'window-log.json'), meta);
  if (withTracks) {
    const rec = await collectTracks(g.page);
    const res = await analyse(toSamples(rec), o.repo);
    writeJson(path.join(o.out, 'tracks.json'), { records: rec });
    writeJson(path.join(o.out, 'jerks.json'), res);
    g.log('TRACKS', JSON.stringify({ frames: res.frames, jerks: res.jerksHeadFeetPelvis, perPoint: res.perPoint, maxStep: res.maxStepPxPerFrame, cuts: res.cameraCutFrames, keyChanges: res.poseKeyChanges }));
  }
  writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
  g.log('done; console errors', g.consoleErrors.length, 'not found', g.notFound.length);
}

/** In the page: one number for everything the rig draws this frame (null for a painted actor). FNV-1a over the float bits of each part mesh's positions and depth, its visibility and its look uniforms. */
const signature = (g, who) => g.page.evaluate((id) => {
  const a = window.__pyrefly.battle().stage.actor(id);
  const fig = a.figure;
  if (!fig) return null;
  let h = 2166136261 >>> 0;
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  const mix = (n) => { h = Math.imul(h ^ n, 16777619) >>> 0; };
  const num = (v) => { f32[0] = v; mix(u32[0]); };
  for (const m of fig.plane.children) {
    mix(m.visible ? 1 : 0);
    num(m.position.z);
    const pos = m.geometry.getAttribute('position').array;
    mix(pos.length);
    for (let i = 0; i < pos.length; i++) num(pos[i]);
    const u = m.material.uniforms;
    mix(u.rimOn ? u.rimOn.value | 0 : -1);
    mix(u.rimGain ? u.rimGain.value | 0 : -1);
    const img = u.map?.value?.image;
    mix(img && img.width ? img.width : 0);
    mix(img && img.height ? img.height : 0);
  }
  return h;
}, who);

export async function poses(g, spec, o) {
  const { st, framesDir } = await prepare(g, spec, o);
  const who = spec.actor;
  if (o.still) {
    // REDUCE MOTION's own hook: the idle sway and the lag chains fade out (the approach has a time constant of 0.25 s), so after the settle the rig's positions no longer carry the phase the idle
    // happened to be in when the page was paused, and two runs of the same engine hand the GPU the same numbers (`rig-signature.json`). 1800 frames is e^-120 of the sway: below double precision.
    await g.page.evaluate((id) => { window.__pyrefly.battle().stage.actor(id).still = () => true; }, who);
    await st.steps(o.settle, false);
  }
  await g.page.evaluate((id) => { const b = window.__pyrefly.battle(); b.scene.battleCamera.swayOff = () => true; window.__pyrefly.trigger?.('hud:off'); const a = b.stage.actor(id); a.breatheAmp = 0; a.swayAmp = 0; }, who);
  const rectOf = () => g.page.evaluate((id) => window.__pyrefly.battle().stage.projectRect(id), who);
  const info = { rig: o.rig, actor: who, poses: {} };
  const sigs = {};
  for (const pose of o.poses) {
    sigs[pose] = [];
    const restSet = (p) => g.page.evaluate(([id, pp]) => {
      const bs = window.__pyrefly.battle();
      const s = window.__pyrefly.battleState();
      const u = s.combatants;
      const c = Array.isArray(u) ? u.find((x) => x.id === id) : u[id];
      c.hp = c.stats.maxHp; delete c.statuses.sleep;
      if (pp === 'critical') c.hp = 100;
      if (pp === 'sleep') c.statuses.sleep = { turns: 9 };
      bs.hud.syncVitals(s);
    }, [who, p]);
    await g.page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); a.tweens?.killAll?.(); a.setTint?.(0xffffff); a.setDim?.(0); a.setPose('idle', { immediate: true }); }, who);
    await restSet('none');
    await g.page.evaluate((id) => { window.__pyrefly.battle().stage.actor(id).setPose('idle', { immediate: true }); }, who);
    await st.steps(40, false);
    const r0 = await rectOf();
    const dirp = path.join(framesDir, pose);
    fs.mkdirSync(dirp, { recursive: true });
    st.dirOverride = dirp;
    const first = st.frame;
    const shot = async () => {
      const pending = g.page.evaluate(() => window.__grab());
      await g.page.clock.runFor(st.frame % 3 === 0 ? 16 : 17);
      const r = await pending;
      fs.writeFileSync(path.join(dirp, `f${String(st.frame - first).padStart(4, '0')}.jpg`), Buffer.from(r.b64, 'base64'));
      sigs[pose].push(await signature(g, who));
      st.frame++;
    };
    for (let i = 0; i < 20; i++) await shot();
    if (pose === 'critical' || pose === 'sleep') await restSet(pose);
    else await g.page.evaluate(([id, p]) => { window.__pyrefly.battle().stage.actor(id).setPose(p); }, [who, pose]);
    for (let i = 0; i < 110; i++) await shot();
    const r1 = await rectOf();
    const state = await g.page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); return { pose: a.pose, life: a.lifeState, cls: a.constructor.name }; }, who);
    info.poses[pose] = { rectIdle: r0, rectPose: r1, state, frames: 130 };
    g.log(pose, JSON.stringify(info.poses[pose]));
  }
  st.dirOverride = null;
  writeJson(path.join(o.out, 'poses-info.json'), info);
  writeJson(path.join(o.out, 'rig-signature.json'), sigs);
  await finish(g, o, { mode: 'poses', rig: o.rig, actor: who, poses: o.poses }, false);
}

export async function cast(g, spec, o) {
  if (!spec.castKeys?.length) throw new Error(`lane: ${o.subject} has no castKeys in lane-subjects.json (the keys, after its menu opens, that choose its first spell)`);
  const { st, poseInfo, meta } = await prepare(g, spec, o);
  const { input, page } = g;
  for (let k = 0; k < 8 && (await g.curActor()) !== spec.actor; k++) {
    g.log('turn of', await g.curActor());
    await input.press('KeyQ');
    await st.steps(20, false);
    for (let i = 0; i < 2400 && !((await g.awaitingMenu()) && !(await page.evaluate(() => window.__pyrefly.battle().battlePresenter.playing))); i++) await st.step(false);
    await st.steps(30, false);
  }
  if ((await g.curActor()) !== spec.actor) throw new Error(`${spec.actor} never got a turn`);
  const logBefore = await page.evaluate(() => window.__pyrefly.battleLog().length);
  const f0 = st.frame;
  await st.steps(90); // the menu up, the idle
  const fOpen = st.frame;
  for (const key of spec.castKeys) { await input.press(key); await st.steps(key === 'Enter' ? 30 : 14); }
  const started = () => page.evaluate((from) => window.__pyrefly.battleLog().slice(from).some((e) => e.type === 'action-start'), logBefore);
  for (let k = 0; k < 10 && !(await started()); k++) { await input.press('Enter'); await st.steps(14); }
  if (!(await started())) throw new Error('the cast was never confirmed');
  const fGo = st.frame;
  const played = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.playback?.played ?? 0);
  const playedEnd = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.playback?.lastEvents ?? []).some((e) => (e.type ?? e) === 'action-end'));
  const playedBefore = await played();
  let ended = -1;
  for (let i = 0; i < 1800 && ended < 0; i++) {
    await st.step();
    if (i % 5 === 4 && (await played()) >= playedBefore + 5 && (await playedEnd())) ended = st.frame;
  }
  if (ended < 0) throw new Error('the cast never finished playing');
  await st.steps(o.tail);
  const events = await page.evaluate((from) => window.__pyrefly.battleLog().slice(from).map((e) => ({ type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, abilityId: e.abilityId ?? null })), logBefore);
  await finish(g, o, { ...meta, mode: 'cast', f0, fOpen, fGo, actionEndFrame: ended, fEnd: st.frame, frames: st.frame, events, after: await poseInfo() }, true);
}

export async function hurtko(g, spec, o) {
  const { st, framesDir, poseInfo, meta } = await prepare(g, spec, o);
  const { page } = g;
  await page.evaluate(() => { window.__pyrefly.autoBattle('defend'); });
  const logBefore0 = await page.evaluate(() => window.__pyrefly.battleLog().length);
  const marks = { firstHurtLogged: -1, hpSetAt: -1, koSeenAt: -1 };
  const ring = 150;
  let keepFrom = -1;
  const killOld = (n) => { if (keepFrom < 0 && n - ring >= 6) { try { fs.unlinkSync(path.join(framesDir, `f${String(n - ring).padStart(4, '0')}.jpg`)); } catch { /* none */ } } };
  let hpSet = false;
  const hits = (evs) => evs.some((e) => e.type === 'damage' && (e.targetId ?? e.target) === spec.actor);
  const t0 = st.frame;
  for (let i = 0; i < 12000; i++) {
    await st.step();
    killOld(st.frame - 1);
    if (i % 3 !== 2) continue;
    const evs = await page.evaluate((from) => window.__pyrefly.battleLog().slice(from).map((e) => ({ type: e.type, targetId: e.targetId ?? null })), logBefore0);
    if (marks.firstHurtLogged < 0 && hits(evs)) { marks.firstHurtLogged = st.frame; keepFrom = Math.max(6, st.frame - ring); g.log('first hit logged at frame', st.frame, JSON.stringify(await poseInfo())); }
    if (marks.firstHurtLogged >= 0 && !hpSet) {
      const lastEvents = await page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.playback?.lastEvents ?? []).map((e) => e.type ?? e));
      if (st.frame - marks.firstHurtLogged > 150 && lastEvents.includes('action-end')) {
        await page.evaluate((id) => { const u = window.__pyrefly.battleState().combatants; (Array.isArray(u) ? u.find((x) => x.id === id) : u[id]).hp = 1; }, spec.actor);
        hpSet = true; marks.hpSetAt = st.frame; g.log('HP set to 1 at frame', st.frame);
      }
    }
    if (hpSet) {
      const pi = await poseInfo();
      if (pi.life === 'no-battle') break;
      if (marks.koSeenAt < 0 && pi.life === 'down') { marks.koSeenAt = st.frame; g.log('KO beat reached at frame', st.frame); }
      if (marks.koSeenAt >= 0 && st.frame - marks.koSeenAt > 150) break;
    }
    if (marks.firstHurtLogged < 0 && i > 11000) throw new Error('no enemy action ever hit the actor');
  }
  const events = await page.evaluate((from) => window.__pyrefly.battleLog().slice(from).map((e) => ({ type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, abilityId: e.abilityId ?? null, amount: e.amount ?? e.damage ?? null })), logBefore0);
  await finish(g, o, { ...meta, mode: 'hurtko', f0: t0, keepFrom, marks, fEnd: st.frame, frames: st.frame, events }, true);
}

export async function fight(g, spec, o) {
  const { st, meta } = await prepare(g, spec, { ...o, shoot: false });
  const { page } = g;
  let probe = null;
  const probePath = `${o.repo}/critic/runner/lib/continuity.mjs`;
  if (fs.existsSync(probePath)) {
    const { attachProbe } = await import(pathToFileURL(probePath).href);
    probe = await attachProbe({ page, outDir: o.out, chapter: spec.chapter.id, game: spec.game ?? 'ffx', base: o.base, mode: process.env.PYREFLY_BROWSER ?? 'gpu', poseMeasurePath: `${o.repo}/docs/target/pose-measure.json`, log: g.log });
  }
  st.recording = false;
  const track = async (n) => pushTrack(page, n);
  const started = await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  g.log('autoBattle handed over:', started);
  const t0 = Date.now();
  for (let i = 0; i < o.cap; i++) {
    await page.clock.runFor(16);
    await track(st.frame++);
    if (i % 120 === 119) {
      const s = await g.scr();
      if (s !== 'battle') break;
      if (i % 1200 === 1199) g.log('frame', st.frame, 'virtual s', ((st.frame * 16) / 1000).toFixed(1), 'real s', ((Date.now() - t0) / 1000).toFixed(0));
    }
  }
  g.log('fight over after', st.frame, 'frames; screen', await g.scr());
  await page.clock.resume();
  if (probe) {
    const res = await probe.finish();
    writeJson(path.join(o.out, 'probe.json'), { checks: res.checks ?? null, error: res.error ?? null });
  }
  await finish(g, o, { ...meta, mode: 'fight', frames: st.frame, probe: probe !== null }, true);
}

/** In the page: what the KO measurement reads of the actor this frame (its pose and life, HP, projected box, and a rig's part meshes with the area of each as the GPU gets it). */
const koFrameMeta = (id) => {
  const b = window.__pyrefly.battle();
  const a = b.stage.actor(id);
  const u = window.__pyrefly.battleState().combatants;
  const c = Array.isArray(u) ? u.find((x) => x.id === id) : u[id];
  if (!a) return { inStage: false, hp: c?.hp ?? null, maxHp: c?.stats?.maxHp ?? null };
  const parts = a.figure ? a.figure.plane.children.map((mm) => {
    const pos = mm.geometry.getAttribute('position').array;
    const idx = mm.geometry.index ? mm.geometry.index.array : null;
    let area = 0;
    const T = idx ? idx.length / 3 : pos.length / 9;
    for (let t = 0; t < T; t++) {
      const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
      area += Math.abs((pos[i1 * 3] - pos[i0 * 3]) * (pos[i2 * 3 + 1] - pos[i0 * 3 + 1]) - (pos[i1 * 3 + 1] - pos[i0 * 3 + 1]) * (pos[i2 * 3] - pos[i0 * 3])) / 2;
    }
    return { name: mm.name || null, visible: mm.visible, area };
  }) : null;
  let rect = null;
  try { rect = b.stage.projectRect(id); } catch { /* not projectable this frame */ }
  return { inStage: true, pose: a.pose, life: a.lifeState, blending: a.blending ?? null, hp: c?.hp ?? null, maxHp: c?.stats?.maxHp ?? null, alive: c?.alive ?? null, rect, parts };
};

export async function ko(g, spec, o) {
  const { st, meta } = await prepare(g, spec, o);
  st.recording = false; // this mode grabs its own frames (a ring, written at the end)
  const { page } = g;
  const who = spec.actor;
  let probe = null;
  const probePath = `${o.repo}/critic/runner/lib/continuity.mjs`;
  if (fs.existsSync(probePath)) {
    const { attachProbe } = await import(pathToFileURL(probePath).href);
    probe = await attachProbe({ page, outDir: o.out, chapter: spec.chapter.id, game: spec.game ?? 'ffx', base: o.base, mode: process.env.PYREFLY_BROWSER ?? 'gpu', poseMeasurePath: `${o.repo}/docs/target/pose-measure.json`, log: g.log });
  }
  const started = await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  g.log('autoBattle handed over:', started);
  const ringMax = 240;
  const ring = [];
  let armed = false;
  let koFrame = -1;
  const t0 = Date.now();
  for (let i = 0; i < o.cap; i++) {
    const n = st.frame;
    const pending = armed ? page.evaluate(() => window.__grab()) : null;
    await page.clock.runFor(frameMs(n));
    let m = null;
    if (pending) {
      const r = await pending;
      m = await page.evaluate(koFrameMeta, who);
      ring.push({ n, b64: r.b64, m });
      if (koFrame < 0 && ring.length > ringMax) ring.shift();
    }
    await pushTrack(page, n);
    st.frame++;
    if (armed || i % 15 === 14) {
      m = m ?? (await page.evaluate(koFrameMeta, who));
      const frac = m.maxHp ? (m.hp ?? 0) / m.maxHp : 1;
      if (!armed && frac < 0.5) armed = true;
      if (koFrame < 0 && (m.pose === 'ko' || (m.hp ?? 1) <= 0)) { koFrame = n; g.log('KO beat at frame', n, JSON.stringify({ pose: m.pose, life: m.life, hp: m.hp })); armed = true; }
    }
    if (koFrame >= 0 && n >= koFrame + o.tail) break;
    if (i % 120 === 119 && (await g.scr()) !== 'battle') break;
    if (i % 1800 === 1799) g.log('frame', st.frame, 'virtual s', ((st.frame * 16.67) / 1000).toFixed(1), 'real s', ((Date.now() - t0) / 1000).toFixed(0), armed ? 'armed' : '');
  }
  await page.clock.resume();
  const dir = path.join(o.out, 'frames');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ring) fs.writeFileSync(path.join(dir, `f${String(f.n).padStart(5, '0')}.jpg`), Buffer.from(f.b64, 'base64'));
  writeJson(path.join(o.out, 'ko.json'), { actor: who, rig: o.rig, koFrame, tail: o.tail, frames: ring.map((f) => f.n), meta: ring.map((f) => ({ n: f.n, ...f.m })) });
  g.log('ko run over: KO frame', koFrame, '; kept', ring.length, 'frames; screen', await g.scr());
  if (probe) {
    const res = await probe.finish();
    writeJson(path.join(o.out, 'probe.json'), { checks: res.checks ?? null, error: res.error ?? null });
  }
  await finish(g, o, { ...meta, mode: 'ko', koFrame, frames: st.frame, probe: probe !== null }, true);
  if (koFrame < 0) throw new Error(`${who} was never knocked out in ${st.frame} frames (the fight was lost, or the cap was too small)`);
}
