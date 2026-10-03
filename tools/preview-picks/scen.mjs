// Scenario runner (menu-driven, real keys). node scen.mjs <scenario> <preview|live> [tag]
// Writes stills (JPEG) + markers/poses/events JSON under OUT/<scenario>-<mode>/, and (preview, record=1) a WebM per scenario.
import { openGame, enterBattle, phase, rows, waitMenu, sleep, startSampler, poses, shot, finishVideo, OUT, waitFor } from './drive.mjs';
import fs from 'node:fs';
import { SCENARIOS } from './scenarios.mjs';

const [name, mode = 'preview', tag = 'a'] = process.argv.slice(2);
process.env.PYREFLY_BROWSER ??= 'gpu';
const sc = SCENARIOS[name];
if (!sc) throw new Error('unknown scenario ' + name + ' (have ' + Object.keys(SCENARIOS).join(', ') + ')');
const dir = `${OUT}/${name}-${mode}`;
fs.mkdirSync(dir, { recursive: true });
const record = mode === 'preview' && process.env.RECORD !== '0' ? `${OUT}/rec/${name}-${tag}` : null;
const g = await openGame({ mode, record, settings: { ffx2Atb: sc.atb ?? 'wait', ...(sc.settings ?? {}) } });
const { page } = g;
if (sc.telegraphHold && mode === 'preview') await page.addInitScript(() => { globalThis.__previewTelegraph = true; });
if (sc.telegraphHold && mode === 'preview') { await page.evaluate(() => { globalThis.__previewTelegraph = true; }); }
const t0 = Date.now();
const markers = [];
const mark = (n, extra = {}) => { markers.push({ n, ms: Date.now() - t0, ...extra }); console.log('MARK', n, Date.now() - t0); };
const key = async (k, n = 1, gap = 130) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(gap); } };
const pickRow = async (re) => {
  await sleep(250);
  const rs = await rows(page);
  const t = rs.findIndex((r) => re.test(r.text));
  const s = rs.findIndex((r) => r.selected);
  if (t < 0) { console.log('rows', rs.map((r) => r.text).join('|')); throw new Error('row not found ' + re); }
  await key(t > s ? 'ArrowDown' : 'ArrowUp', Math.abs(t - s));
  await key('Enter', 1, 450);
};
const burst = async (label, n = 10, gap = 330) => { for (let i = 0; i < n; i++) { await shot(page, `${dir}/${label}-${String(i).padStart(2, '0')}.jpg`); await sleep(gap); } };

try {
  await enterBattle(page, sc.chapter, sc.seed ?? 1);
  await startSampler(page);
  mark('battle');
  // the party cannot die while the capture waits for its turns (debug state, identical in live and preview runs)
  await page.evaluate(() => {
    const keepAlive = () => { try { const cs = window.__pyrefly.battleState().combatants; for (const c of Array.isArray(cs) ? cs : Object.values(cs)) if (c.side === 'party' || c.side === 'aeon') { if (c.stats) c.stats.maxHp = Math.max(c.stats.maxHp ?? 0, 30000); c.hp = Math.max(c.hp, 29000); } } catch { /* between battles */ } };
    window.__keepAlive = setInterval(keepAlive, 400); keepAlive();
  });
  if (sc.prepare) await sc.prepare({ page, mark, sleep });
  const todo = [...sc.steps];
  for (let m = 0; m < (sc.maxMenus ?? 30) && todo.length; m++) {
    await waitMenu(page, 180000);
    await sleep(900);
    const who = ((await phase(page)).phase ?? '').replace('command:', '');
    const i = todo.findIndex((s) => s.who === who);
    if (i < 0) {
      // not a scripted turn: a plain attack so the fight moves on
      try { await pickRow(/^attack/i); await key('Enter', 1, 300); } catch { await key('Enter', 2, 300); }
      await sleep(700);
      continue;
    }
    const st = todo.splice(i, 1)[0];
    if (sc.quiet !== false && st.quiet !== false) {
      // no other girl's menu may open while this action plays (the FFX-2 key slots stand aside for an open menu, KeySlots.FFX2_SUPPRESS_WHILE_MENU)
      await page.evaluate((id) => { try { const cs = window.__pyrefly.battleState().combatants; for (const c of Array.isArray(cs) ? cs : Object.values(cs)) if (c.side === 'party' && c.id !== id && c.atb && !c.charging) { c.atb.ticks = 0; c.atb.gauge = 0; } } catch { /* FFX has no ATB */ } }, who);
    }
    await shot(page, `${dir}/${st.tag}-menu.jpg`);
    if (st.swap) {
      await page.evaluate(async ([id, d]) => {
        const cs = window.__pyrefly.battleState().combatants; const arr = Array.isArray(cs) ? cs : Object.values(cs);
        arr.find((x) => x.id === id).dresspheres.current = d;
        await window.__pyrefly.app.current.stage.setArt(id, `${id}-${d}`);
      }, st.swap);
      await sleep(700);
    }
    mark(`${st.tag}:start`, { who });
    try { for (const re of st.path) await pickRow(re); } catch (e) { console.log('STEP FAILED', st.tag, e.message); await key('Escape', 3, 250); mark(`${st.tag}:failed`); continue; }
    for (let k = 0; k < 3; k++) { const p = await phase(page); if (!p.awaiting) break; await key('Enter', 1, 400); }
    mark(`${st.tag}:submitted`);
    await burst(st.tag, st.burst ?? 10, st.gap ?? 330);
    mark(`${st.tag}:end`);
  }
  if (sc.after) await sc.after({ page, mark, sleep, shot: (l) => shot(page, `${dir}/${l}.jpg`), burst, dir, mode, poses, key });
} catch (e) {
  console.error('FAIL', e.message);
  await page.screenshot({ path: `${dir}/fail.jpg` }).catch(() => {});
}
let pz = [];
try { pz = await poses(page); } catch { /* page gone */ }
fs.writeFileSync(`${dir}/poses.json`, JSON.stringify(pz));
try { fs.writeFileSync(`${dir}/events.json`, JSON.stringify(await page.evaluate(() => window.__pyrefly.battleLog().filter((e) => e.type === 'action-start' || e.type === 'charge').map((e) => ({ seq: e.seq, type: e.type, actorId: e.actorId, abilityId: e.abilityId ?? e.command?.id, kind: e.command?.kind, enemyId: e.enemyId, name: e.name }))))); } catch { /* gone */ }
fs.writeFileSync(`${dir}/markers.json`, JSON.stringify(markers, null, 1));
let r = null;
if (record) { const vid = page.video(); await g.ctx.close(); await g.browser.close(); r = { raw: await vid.path() }; fs.writeFileSync(`${dir}/video.json`, JSON.stringify({ raw: r.raw, t0, ctxStart: g.ctxStart })); } else await g.browser.close();
console.log('video', r && r.raw ? r.raw : r, 'errors', g.errors.slice(0, 5), 'missing', g.missing.slice(0, 8));
