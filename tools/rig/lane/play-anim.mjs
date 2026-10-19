/**
 * **The `anim` recording** (the animation prototype, 2026-10-18; both games' plumbing, recorded on Lulu, FFX): one browser session at one variant of the engine (`today` = the rig as it ships, or the
 * prototype's style A, B or C: the page's own `?anim=proto&style=` query, passed by the recorder), the same script every time, so the variants can be put side by side.
 *
 *   idle      5 s of the stance (another member's menu is up: Lulu stands)
 *   attack    the real command (Attack, the first target) through the real presenter: wind-up, lunge, contact, follow-through, home
 *   cast      the real command (her first spell, `castKeys`) through the real presenter and the spell effect
 *   item      the real command (Item, the first item, the first target) through the real presenter: the vial
 *   victory   `setPose('victory')`, the call the presenter makes on a victory, held 3.5 s
 *   hurt      the actor calls the presenter makes on a blow (`flash`, `shake`, `recoil`): the flinch, then home
 *   ko        the call the presenter makes on a KO (`setPose('ko')`, a flash): the fall
 *
 * Every segment is `<out>/<segment>/f0000.jpg ...` (60 fps, 1600 x 900) with `segments.json` carrying, per frame, the actor's key and the clip playing, the rects of Lulu and of her target (for the
 * crop of the comparison), and the frame of the first press. attack, cast and item go through real key presses and the real presenter; victory, hurt and KO call the actor as the presenter does (so no
 * enemy action has to hit her), and that is said in the notes. Nothing in the repository is touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { installGrabber, makeStepper, pauseClock, reachFirstMenu } from './play-common.mjs';

const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 1));

export async function anim(g, spec, o) {
  const { page, input } = g;
  await reachFirstMenu(g, spec);
  await pauseClock(page);
  const st = makeStepper(page, { dir: o.out, log: g.log });
  for (let i = 0; i < 6; i++) await st.step(false);
  await installGrabber(page, o.quality);
  const who = spec.actor;
  await page.evaluate(() => { const b = window.__pyrefly.battle(); b.scene.battleCamera.swayOff = () => true; window.__pyrefly.trigger?.('hud:off'); });
  const info = { variant: o.variant ?? 'today', actor: who, segments: {} };

  const sample = () => page.evaluate((id) => {
    const a = window.__pyrefly.battle().stage.actor(id);
    return { pose: a.pose, clip: a.anim?.anim?.playing ?? null, blending: a.blending ?? null };
  }, who);
  const rectOf = (id) => page.evaluate((x) => { try { return window.__pyrefly.battle().stage.projectRect(x); } catch { return null; } }, id);
  const targetId = await page.evaluate((id) => { const u = window.__pyrefly.battleState().combatants; const l = Array.isArray(u) ? u : Object.values(u); return l.find((c) => c.side === 'enemy' && c.alive !== false)?.id ?? l.find((c) => c.id !== id)?.id ?? null; }, who);

  /** Record `n` frames into `<out>/<name>/`, sampling the actor each frame. `while` (optional) is polled every 3 frames to stop early; `onFrame` runs before each step. */
  async function record(name, n, { until, extra = 0, onFrame } = {}) {
    const dir = path.join(o.out, name);
    fs.mkdirSync(dir, { recursive: true });
    st.dirOverride = dir;
    const first = st.frame;
    const seg = { frames: 0, samples: [], rectLulu: await rectOf(who), rectTarget: targetId ? await rectOf(targetId) : null, firstFrame: first };
    let stop = -1;
    for (let i = 0; i < n; i++) {
      if (onFrame) await onFrame(i);
      const pending = page.evaluate(() => window.__grab());
      await page.clock.runFor(st.frame % 3 === 0 ? 16 : 17);
      const r = await pending;
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
    g.log(name, 'frames', seg.frames);
    return seg;
  }
  const skip = async (n) => { for (let i = 0; i < n; i++) await st.step(false); };
  const idleBusy = async () => !((await g.awaitingMenu()) && !(await page.evaluate(() => window.__pyrefly.battle().battlePresenter.playing)));
  const settle = async (max = 2400) => { for (let i = 0; i < max && (await idleBusy()); i++) await st.step(false); await skip(40); };

  /** Pass every turn that is not hers (defend) until her menu is up. */
  async function toHerTurn() {
    for (let k = 0; k < 12 && (await g.curActor()) !== who; k++) {
      g.log('turn of', await g.curActor());
      await input.press('KeyQ');
      await skip(20);
      await settle();
    }
    if ((await g.curActor()) !== who) throw new Error(`${who} never got a turn`);
    await skip(30);
  }
  const rows = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd-stack .ig-cmd')].map((e) => ({ label: e.querySelector('.ffx-cmd__label')?.textContent?.trim() ?? '', sel: e.classList.contains('ig-cmd--selected'), i: Number(e.getAttribute('data-ui-action')) })));
  /** Move the cursor to the row whose label starts with `label` (ArrowDown until it is selected). */
  async function pickRow(label) {
    for (let k = 0; k < 16; k++) {
      const r = await rows();
      const sel = r.find((x) => x.sel);
      if (sel && sel.label.toLowerCase().startsWith(label.toLowerCase())) return true;
      await input.press('ArrowDown');
      await skip(8);
    }
    g.log('rows seen:', JSON.stringify(await rows()));
    return false;
  }
  const logLen = () => page.evaluate(() => window.__pyrefly.battleLog().length);
  const played = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.playback?.played ?? 0);
  const ended = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.playback?.lastEvents ?? []).some((e) => (e.type ?? e) === 'action-end'));
  const started = (from) => page.evaluate((f) => window.__pyrefly.battleLog().slice(f).some((e) => e.type === 'action-start'), from);

  // idle: she must be standing, not choosing
  if ((await g.curActor()) === who) { await input.press('KeyQ'); await skip(20); await settle(); }
  g.log('idle: current actor', await g.curActor(), JSON.stringify(await sample()));
  await record('idle', 300);

  /** One real action: `keys` are pressed (each followed by a few frames), recording from the first press until the action has played and `o.tail` frames after. */
  async function action(name, keys, tail = 100) {
    await toHerTurn();
    const from = await logLen();
    const playedBefore = await played();
    const pressLog = [];
    let done = false;
    const seg = await record(name, 2400, {
      extra: tail,
      onFrame: async (i) => {
        if (i < 6) return;
        const k = Math.floor((i - 6) / 16);
        if ((i - 6) % 16 === 0 && k < keys.length) { const key = typeof keys[k] === 'function' ? await keys[k]() : keys[k]; if (key) { await input.press(key); pressLog.push({ frame: i, key }); } }
        if (!done && k >= keys.length && !(await started(from)) && (i - 6) % 24 === 0) { await input.press('Enter'); pressLog.push({ frame: i, key: 'Enter (retry)' }); }
      },
      until: async () => { done = true; return (await started(from)) && (await played()) >= playedBefore + 5 && (await ended()); },
    });
    seg.presses = pressLog;
    seg.events = await page.evaluate((f) => window.__pyrefly.battleLog().slice(f).map((e) => ({ type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, abilityId: e.abilityId ?? null })), from);
    writeJson(path.join(o.out, 'segments.json'), info);
    await settle();
  }

  await action('attack', ['Enter', 'Enter']);
  await action('cast', spec.castKeys ?? ['ArrowDown', 'ArrowDown', 'Enter', 'Enter']);
  const itemKeys = [async () => { await pickRow('item'); return 'Enter'; }, 'Enter', 'Enter'];
  await action('item', itemKeys);

  // victory, hurt and ko: the actor, as the presenter calls it
  await page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); a.setPose('idle', { immediate: true }); }, who);
  await skip(60);
  await record('victory', 215, { onFrame: async (i) => { if (i === 20) await page.evaluate((id) => window.__pyrefly.battle().stage.actor(id).setPose('victory'), who); } });
  await page.evaluate((id) => window.__pyrefly.battle().stage.actor(id).setPose('idle'), who);
  await skip(90);
  await record('hurt', 150, { onFrame: async (i) => { if (i === 30) await page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); a.flash(0xffd0c0, 200, 0.8); a.shake(0.1, 340); void a.recoil(360, 0.22); }, who); } });
  await skip(60);
  await record('ko', 210, { onFrame: async (i) => { if (i === 30) await page.evaluate((id) => { const a = window.__pyrefly.battle().stage.actor(id); a.setPose('ko'); a.flash(0x4a5a78, 320, 0.7); }, who); } });
  writeJson(path.join(o.out, 'console.json'), { consoleErrors: g.consoleErrors, notFound: g.notFound });
  g.log('anim done; console errors', g.consoleErrors.length, 'not found', g.notFound.length);
}
