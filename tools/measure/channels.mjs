// The per-frame ENGINE CHANNELS of every figure, read from the running game in one evaluate (motion-fluidity pass, lane L5; both games, tooling). PORTED from the curves lane's rec.mjs (scratch).
//
// `READ` runs INSIDE the page (it is stringified): for each combatant the stage knows it reads the motion channels the engine itself holds (the curve driver's x, lift and squash; the lunge, recoil, hop,
// fall, squash and shake; the inner transform; the slots' fades; the rig's key and its speed), the head and feet projected to CSS px with the camera included, the camera, the hit-stop factor (the field
// clock's share of the display frame: 1 running, under 0.5 held), and the presenter's state (a menu waiting, who). Exact numbers, not pixels read back, so a one-frame step in a curve is a step in the data.
// It reads only: the one thing it adds to the page is a wrapper on the spectacle's `stageDt` that remembers the last factor (`__f`), the way the curves lane's capture did.
// `NEWLOG` returns the battle-log events since index `from`. Both are used by tools/hz-matrix.mjs, tools/jolts.mjs and tools/ab-clip.mjs, in a session from tools/measure/session.mjs.

/** In-page: one frame's channels, or null when the battle is not up. */
export const READ = () => {
  const p = window.__pyrefly;
  const b = p.battle?.();
  if (!b) return null;
  const st = b.stage;
  const cam = st.opts?.camera;
  const canvas = st.opts?.canvas;
  const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: 1600, height: 900 };
  const R = (v, k = 1e4) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * k) / k);
  let vp = null;
  if (cam && cam.projectionMatrix && cam.matrixWorldInverse) {
    const P = cam.projectionMatrix.elements, V = cam.matrixWorldInverse.elements;
    vp = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) vp[c * 4 + r] = P[r] * V[c * 4] + P[4 + r] * V[c * 4 + 1] + P[8 + r] * V[c * 4 + 2] + P[12 + r] * V[c * 4 + 3];
  }
  const proj = (x, y, z) => {
    if (!vp) return [null, null];
    const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12], cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13], cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    return [R(rect.left + ((cx / cw) * 0.5 + 0.5) * rect.width, 100), R(rect.top + (-(cy / cw) * 0.5 + 0.5) * rect.height, 100)];
  };
  if (b.spectacle && !b.spectacle.__w && typeof b.spectacle.stageDt === 'function') {
    const sp = b.spectacle, orig = sp.stageDt.bind(sp);
    sp.__w = true; sp.__f = 1; sp.__in = 0; sp.__out = 0;
    sp.stageDt = (d) => { const r = orig(d); sp.__in = d; sp.__out = r; sp.__f = d > 0 ? r / d : 1; return r; };
  }
  const s = p.battleState();
  const list = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants);
  const actors = {};
  for (const c of list) {
    const a = st.actor(c.id);
    if (!a) continue;
    const i = a.inner;
    const cv = a.curves?.out;
    const sl0 = a.slots?.[0], sl1 = a.slots?.[1];
    let head = null;
    try { const h = a.headPoint(); head = proj(h.x, h.y, h.z); } catch { head = [null, null]; }
    let feet = [null, null];
    try { if (i) { i.updateWorldMatrix(true, false); const e = i.matrixWorld.elements; feet = proj(e[12], e[13], e[14]); } } catch { /* ignore */ }
    const row = {
      side: c.side, hp: c.hp, pose: a.pose ?? null, life: a.lifeState ?? null, blend: a.blending ?? null, alpha: R(a._alpha, 1e3),
      ox: i ? R(i.position.x) : null, oy: i ? R(i.position.y) : null, sx: i ? R(i.scale.x) : null, sy: i ? R(i.scale.y) : null, rz: i ? R(i.rotation.z) : null, ry: i ? R(i.rotation.y) : null,
      gx: R(a.position?.x), gy: R(a.position?.y), gz: R(a.position?.z),
      cx: cv ? R(cv.x) : null, clift: cv ? R(cv.lift) : null, csy: cv ? R(cv.sy) : null, clean: cv ? R(cv.lean) : null,
      lunge: R(a.lungeOffset), recoil: R(a.recoilOffset), hop: R(a.hopHeight), ftilt: R(a.fallTilt), fdrop: R(a.fallDrop), squash: R(a.squashAmount), lie: R(a.lieRoll), shL: R(a.shakeLeftMs, 10), shA: R(a.shakeAmp, 1e4), shP: R(a.shakePhase, 1e3),
      pl: a.life?.posture ? R(a.life.posture.lean, 1e4) : null, pc: a.life?.posture ? R(a.life.posture.crouch, 1e4) : null, pt: a.life?.posture ? R(a.life.posture.tilt, 1e4) : null,
      fac: a.facing ?? null, ay: R(a.appliedYaw, 100), act: a.active ?? null,
      s0: sl0 ? [R(sl0.fade, 1e3), R(sl0.mesh.rotation.z, 1e4), R(sl0.mesh.position.x, 1e4), R(sl0.mesh.position.y, 1e4), sl0.pose ?? null] : null,
      s1: sl1 ? [R(sl1.fade, 1e3), R(sl1.mesh.rotation.z, 1e4), R(sl1.mesh.position.x, 1e4), R(sl1.mesh.position.y, 1e4), sl1.pose ?? null] : null,
      ssc: a.shadow ? [R(a.shadow.position.x), R(a.shadow.scale.x), R(a.shadow.material?.opacity, 1e3)] : null,
      hx: head[0], hy: head[1], fx: feet[0], fy: feet[1],
    };
    if (a.trans) { row.rigKey = a.key ?? null; row.rigBusy = a.trans.busy ?? null; row.rigP = R(a.trans.progress, 1e3); let m = 0; const v = a.trans.velocity; if (v) for (let k = 0; k < v.length; k++) m = Math.max(m, Math.abs(v[k])); row.rigV = R(m, 1e3); }
    actors[c.id] = row;
  }
  const log = s.log ?? [];
  const ps = p.snapshotState()?.screenState?.playback ?? {};
  const sp = b.spectacle;
  return {
    t: R(performance.now(), 10), nLog: log.length, menu: Boolean(ps.awaitingMenu), phase: ps.phase ?? null, playing: Boolean(b.battlePresenter?.playing), menuActor: b.battlePresenter?.pendingMenu?.actorId ?? null,
    hs: sp ? R(sp.__f ?? 1, 1e3) : null, hsIn: sp ? R(sp.__in ?? 0, 1e5) : null, hsOut: sp ? R(sp.__out ?? 0, 1e5) : null,
    cam: cam ? [R(cam.position.x, 1e4), R(cam.position.y, 1e4), R(cam.position.z, 1e4), R(cam.fov, 1e3), R(cam.quaternion.x, 1e5), R(cam.quaternion.y, 1e5), R(cam.quaternion.z, 1e5), R(cam.quaternion.w, 1e5)] : null,
    screen: p.screen(), actors,
  };
};

/** In-page: the battle-log events from index `from` on, reduced to what a moment script needs. */
export const NEWLOG = (from) => {
  const s = window.__pyrefly.battleState();
  const log = s.log ?? [];
  return log.slice(from).map((e) => ({ type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, sourceId: e.sourceId ?? null, abilityId: e.abilityId ?? null, amount: e.amount ?? null, crit: e.crit ?? null }));
};

/** Install READ and NEWLOG as `window.READ_` / `window.NEWLOG_` once per page, so a tick reads in the same evaluate as the frame. */
export async function installChannels(page) {
  await page.evaluate(`window.READ_ = ${READ.toString()}; window.NEWLOG_ = ${NEWLOG.toString()};`);
}

/**
 * One recorded frame: advance the stepper, run the frame, read the channels, and when the log grew read its new events into `events` (each stamped with the frame index).
 * @param {{tick: (read?: string) => Promise<any>}} stepper
 * @param {any} page
 * @param {{frames: any[], events: any[], logLen: number, rec: boolean}} acc
 */
export async function recordTick(stepper, page, acc) {
  const st = await stepper.tick('window.READ_');
  if (acc.rec && st) {
    st.f = acc.frames.length;
    st.vt = stepper.ms; // the virtual clock, ms: exact whatever the page's performance.now() rounding
    if (st.nLog !== acc.logLen) {
      const ev = await page.evaluate(`window.NEWLOG_(${acc.logLen})`);
      for (const e of ev) acc.events.push({ f: st.f, vt: st.vt, ...e });
      acc.logLen = st.nLog;
    }
    acc.frames.push(st);
  } else if (st) acc.logLen = st.nLog;
  return st;
}
