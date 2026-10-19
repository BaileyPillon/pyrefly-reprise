/**
 * **The `anim2` recording** (pass 2 of the animation prototype, 2026-10-19; both games' plumbing, recorded on Lulu, FFX): one browser session at one variant of the engine (`today` = the rig as it ships,
 * `B` = pass 1's showpiece, `P2` = pass 2: the page's own `?anim=proto&style=` query, passed by the recorder), the same script every time, so the variants can be put side by side. Different from
 * pass 1's `anim` mode in the one thing that made pass 1 hard to judge: THE CAMERA. The game's own cuts (the hard cut to whoever is hit, the cast's push) took Lulu out of frame at her contact, and she
 * was 230 px tall. Here the battle camera is put on a rig of this recorder's own (`shots`: a dolly toward her, a look-at that includes where she is going) and FROZEN: every move the presenter asks of it
 * (`moveTo`, `snapTo`, `push`, `release`, `roll`, `offsetTarget`) is answered and ignored; the shake and the punch (the hit's own feel) still play. Everything else is the real game: the real presenter, the
 * real key presses, the real spell and heal effects, the HUD hidden.
 *
 *   attack      the real command (Attack, the first target)
 *   cast        the real command (her first spell, `castKeys`)
 *   item-ally   the real command (Item, the first item, the first target: an ally)
 *   item-self   the same, with the target prompt moved to Lulu herself (`selfKeys`)
 *   hurt-ko     the actor calls the presenter makes on a blow (`flash`, `shake`, `recoil`), a second heavier blow, then the call it makes on a KO (`setPose('ko')`, a flash)
 *
 * Every segment is `<out>/<segment>/f0000.jpg ...` (60 fps) with `segments.json` carrying, per frame, the actor's key, the clip playing, the glow level, the hold time and the length of the battle log (so
 * the frame a log event happened on is known). Nothing in the repository is touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { installGrabber, makeStepper, pauseClock, reachFirstMenu } from './play-common.mjs';

const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 1));

/** The cameras, by segment: `dist` is a fraction of the game's own camera distance (smaller = closer), `look` an offset in world units from Lulu's centre (x along the stage, y up, z toward the camera). */
export const SHOTS = {
  attack: { dist: 0.25, look: [1.3, 0.0, 0] }, // she lunges to the RIGHT of the stage (about 2.9 world units, the game's own choreography), the target's hit effect is just left of where she starts
  cast: { dist: 0.28, look: [-0.2, 0.05, 0] },
  'item-ally': { dist: 0.25, look: [-1.9, 0.0, 0] }, // Lulu on the right, the first ally (Tidus) 3.8 units to her left
  'item-self': { dist: 0.25, look: [0.0, 0.0, 0] },
  'hurt-ko': { dist: 0.25, look: [-0.2, 0.0, 0] },
};

export async function anim2(g, spec, o) {
  const { page, input } = g;
  await reachFirstMenu(g, spec);
  await pauseClock(page);
  const st = makeStepper(page, { dir: o.out, log: g.log });
  for (let i = 0; i < 6; i++) await st.step(false);
  await installGrabber(page, o.quality);
  const who = spec.actor;
  await page.evaluate(() => { const b = window.__pyrefly.battle(); b.scene.battleCamera.swayOff = () => true; window.__pyrefly.trigger?.('hud:off'); });
  const info = { variant: o.variant ?? 'today', actor: who, view: o.view, segments: {} };
  const want = o.segments ?? Object.keys(SHOTS);
  const shots = { ...SHOTS, ...(o.shots ?? {}) };

  /** Put the battle camera on this segment's rig and freeze it. Returns the figures' facts for the log. */
  const shot = (name) => page.evaluate(({ id, s, name: n }) => {
    const b = window.__pyrefly.battle();
    const bc = b.scene.battleCamera;
    if (!bc.__orig) {
      bc.__orig = { snapTo: bc.snapTo.bind(bc), idle: bc.getRig('idle') ?? bc.getRig(bc.rigName) };
      for (const k of ['moveTo', 'push', 'release', 'roll', 'rollTo']) bc[k] = () => Promise.resolve();
      bc.snapTo = () => {};
      bc.offsetTarget = () => {};
    }
    const base = bc.__orig.idle;
    const a = b.stage.actor(id);
    const c = a.centerPoint();
    const look = base.lookAt.clone().set(c.x + s.look[0], c.y + s.look[1], c.z + s.look[2]);
    const dir = base.position.clone().sub(base.lookAt);
    const len = dir.length();
    dir.normalize();
    const pos = look.clone().addScaledVector(dir, len * s.dist);
    bc.addRig(`p2-${n}`, { position: pos.toArray(), lookAt: look.toArray(), ...(base.fov !== undefined ? { fov: base.fov } : {}), sway: 0 });
    bc.__orig.snapTo(`p2-${n}`);
    bc.camera.updateMatrixWorld(true);
    const cv = document.querySelector('canvas');
    const V = bc.camera.position.constructor;
    const px = (p) => { const v = new V(p.x, p.y, p.z).project(bc.camera); return [Math.round((v.x * 0.5 + 0.5) * cv.width), Math.round((1 - (v.y * 0.5 + 0.5)) * cv.height)]; };
    const at = (aid) => { const x = b.stage.actor(aid); return x ? { centre: px(x.centerPoint()), head: px(x.headPoint()), feet: px(x.position) } : null; };
    return { proj: { canvas: [cv.width, cv.height], lulu: at(id), tidus: at('tidus'), auron: at('auron'), armLeft: at('sinspawn-gui-arm-left'), body: at('sinspawn-gui') }, len, centre: [c.x, c.y, c.z], pos: pos.toArray(), look: look.toArray(), fov: bc.camera.fov, size: [window.innerWidth, window.innerHeight, window.devicePixelRatio] };
  }, { id: who, s: shots[name], name });

  if (o.probe) { // what the camera really is after the shot, a few frames on (the first run's frames showed the game's own wide camera)
    for (const n of Object.keys(shots)) { const r = await shot(n); g.log('SHOT', n, JSON.stringify(r.proj)); }
    await shot('attack');
    for (let i = 0; i < 12; i++) await st.step(false);
    g.log('PROBE', JSON.stringify(await page.evaluate(() => {
      const b = window.__pyrefly.battle();
      const bc = b.scene.battleCamera;
      const r = b.scene.renderer ?? null;
      return { rigName: bc.rigName, rigs: bc.rigNames, pos: bc.camera.position.toArray(), zoom: bc.camera.zoom, fov: bc.camera.fov, view: bc.camera.view ?? null, sceneKeys: Object.keys(b.scene).slice(0, 40), stageKeys: Object.keys(b.stage).slice(0, 50), sameAsRenderer: r ? r.camera === bc.camera : null };
    })));
    const pending = page.evaluate(() => window.__grab());
    await page.clock.runFor(16);
    fs.writeFileSync(path.join(o.out, 'probe.jpg'), Buffer.from((await pending).b64, 'base64'));
    writeJson(path.join(o.out, 'segments.json'), info);
    writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
    return;
  }
  const sample = () => page.evaluate((id) => {
    const a = window.__pyrefly.battle().stage.actor(id);
    const an = a.anim?.anim;
    return { pose: a.pose, clip: an?.playing ?? null, charge: an ? Math.round(an.charge * 100) / 100 : null, hold: an ? Math.round(an.holding) : null, log: window.__pyrefly.battleLog().length };
  }, who);

  async function record(name, n, { until, extra = 0, onFrame } = {}) {
    const dir = path.join(o.out, name);
    fs.mkdirSync(dir, { recursive: true });
    st.dirOverride = dir;
    const seg = { frames: 0, samples: [], firstFrame: st.frame, shot: await shot(name) };
    let stop = -1;
    for (let i = 0; i < n; i++) {
      if (onFrame) await onFrame(i);
      const pending = page.evaluate(() => window.__grab());
      await page.clock.runFor(st.frame % 3 === 0 ? 16 : 17);
      const r = await pending;
      if (i === 0) seg.grab = [r.w, r.h];
      fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(r.b64, 'base64'));
      st.frame++;
      seg.samples.push(await sample());
      seg.frames = i + 1;
      if (until && stop < 0 && i % 3 === 2 && (await until())) stop = i + extra;
      if (stop >= 0 && i >= stop) break;
    }
    st.dirOverride = null;
    info.segments[name] = seg;
    writeJson(path.join(o.out, 'segments.json'), info);
    g.log(name, 'frames', seg.frames, JSON.stringify(seg.shot));
    return seg;
  }
  const skip = async (n) => { for (let i = 0; i < n; i++) await st.step(false); };
  const idleBusy = async () => !((await g.awaitingMenu()) && !(await page.evaluate(() => window.__pyrefly.battle().battlePresenter.playing)));
  const settle = async (max = 2400) => { for (let i = 0; i < max && (await idleBusy()); i++) await st.step(false); await skip(40); };
  const heal = () => page.evaluate(() => {
    const bs = window.__pyrefly.battle();
    const s = window.__pyrefly.battleState();
    const u = s.combatants;
    for (const c of Array.isArray(u) ? u : Object.values(u)) if (c.side !== 'enemy') { c.hp = c.stats.maxHp; c.statuses = {}; }
    bs.hud.syncVitals(s);
  });
  async function toHerTurn() {
    for (let k = 0; k < 12 && (await g.curActor()) !== who; k++) { g.log('turn of', await g.curActor()); await input.press('KeyQ'); await skip(20); await settle(); }
    if ((await g.curActor()) !== who) throw new Error(`${who} never got a turn`);
    await heal();
    await skip(30);
  }
  const rows = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd-stack .ig-cmd')].map((e) => ({ label: e.querySelector('.ffx-cmd__label')?.textContent?.trim() ?? '', sel: e.classList.contains('ig-cmd--selected') })));
  async function pickRow(label) {
    for (let k = 0; k < 16; k++) {
      const r = await rows();
      const sel = r.find((x) => x.sel);
      if (sel && sel.label.toLowerCase().startsWith(label.toLowerCase())) return true;
      await input.press('ArrowDown');
      await skip(8);
    }
    return false;
  }
  const logLen = () => page.evaluate(() => window.__pyrefly.battleLog().length);
  const playing = () => page.evaluate(() => { const p = window.__pyrefly.battle().battlePresenter.playing; return p ? Promise.race([p.then(() => false, () => false), Promise.resolve().then(() => true)]) : false; });
  const started = (from) => page.evaluate((f) => window.__pyrefly.battleLog().slice(f).some((e) => e.type === 'action-start'), from);

  // she must be standing, not choosing
  if ((await g.curActor()) === who) { await input.press('KeyQ'); await skip(20); await settle(); }

  /** One real action: `keys` are pressed (each followed by a few frames), recording from the first press until the action has played and `tail` frames after. */
  async function action(name, keys, tail = 70, prelude = null) {
    await toHerTurn();
    if (prelude) await prelude();
    await shot(name);
    await skip(6);
    const from = await logLen();
    const pressLog = [];
    let sawPlaying = false;
    const seg = await record(name, 1800, {
      extra: tail,
      onFrame: async (i) => {
        if (i < 6) return;
        const k = Math.floor((i - 6) / 16);
        if ((i - 6) % 16 === 0 && k < keys.length) { await input.press(keys[k]); pressLog.push({ frame: i, key: keys[k] }); }
        if (k >= keys.length && (i - 6) % 24 === 0 && !(await started(from))) { await input.press('Enter'); pressLog.push({ frame: i, key: 'Enter (retry)' }); }
      },
      until: async () => { const pl = await playing(); if (pl) sawPlaying = true; return sawPlaying && !pl && (await started(from)); },
    });
    seg.presses = pressLog;
    seg.events = await page.evaluate((f) => window.__pyrefly.battleLog().slice(f).map((e, i) => ({ i: f + i, type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, sourceId: e.sourceId ?? null, abilityId: e.abilityId ?? null, amount: e.amount ?? null, hitIndex: e.hitIndex ?? null })), from);
    writeJson(path.join(o.out, 'segments.json'), info);
    await settle();
  }

  if (want.includes('attack')) await action('attack', ['Enter', 'Enter']);
  if (want.includes('cast')) await action('cast', spec.castKeys ?? ['ArrowDown', 'ArrowDown', 'Enter', 'Enter']);
  const itemPrelude = async () => { if (!(await pickRow('item'))) throw new Error('no Item row in the command menu'); };
  if (want.includes('item-ally')) await action('item-ally', ['Enter', 'Enter', 'Enter'], 70, itemPrelude);
  if (want.includes('item-self')) await action('item-self', ['Enter', 'Enter', ...(spec.selfKeys ?? o.selfKeys ?? ['ArrowRight', 'ArrowRight']), 'Enter'], 70, itemPrelude); // the target prompt opens on the first ally (Tidus): two to the right is Lulu
  if (want.includes('hurt-ko')) {
    await heal();
    await page.evaluate((id) => window.__pyrefly.battle().stage.actor(id).setPose('idle', { immediate: true }), who);
    await skip(60);
    const blow = (kind) => page.evaluate(({ id, strong }) => { const a = window.__pyrefly.battle().stage.actor(id); a.flash(strong ? 0xffffff : 0xffd0c0, strong ? 260 : 200, strong ? 1 : 0.8); a.shake(strong ? 0.16 : 0.1, 340); void a.recoil(360, strong ? 0.34 : 0.22); }, { id: who, strong: kind === 'strong' });
    await record('hurt-ko', 560, {
      onFrame: async (i) => {
        if (i === 40) await blow('weak');
        if (i === 230) await blow('strong');
        if (i === 330) await page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); a.setPose('ko'); a.flash(0x4a5a78, 320, 0.7); }, who);
      },
    });
  }
  writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
  g.log('anim2 done; console errors', g.consoleErrors.length, 'not found', g.notFound.length);
}
