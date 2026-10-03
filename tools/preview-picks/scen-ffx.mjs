// FFX Overdrive apex scenario: a custom AutoStrategy (presenter.setAutoPlay) hands the engine the stated Overdrive for the
// wanted figure when its turn comes (minigame outcome supplied, nothing timed) and a plain Attack for everyone else; the
// presenter plays every action exactly as it plays a human's (held shot, key painting, strike).
// node scen-ffx.mjs <chapter> <preview|live> <tag> <who:odId[,who:odId...]>
import { openGame, enterBattle, sleep, startSampler, poses, shot, OUT } from './drive.mjs';
import fs from 'node:fs';
const [chapter, mode = 'preview', tag = 'a', list = 'wakka:element-reels'] = process.argv.slice(2);
process.env.PYREFLY_BROWSER ??= 'gpu';
const name = `ffx-${chapter}-${tag}`;
const dir = `${OUT}/${name}-${mode}`;
fs.mkdirSync(dir, { recursive: true });
const record = mode === 'preview' && process.env.RECORD !== '0' ? `${OUT}/rec/${name}` : null;
const g = await openGame({ mode, record });
const { page } = g;
const t0 = Date.now();
const markers = [];
const mark = (n, x = {}) => { markers.push({ n, ms: Date.now() - t0, ...x }); console.log('MARK', n, Date.now() - t0); };
// minigame results handed straight to the engine: a stated outcome, nothing invented about the data
const EXTRA = {
  'element-reels': { kind: 'wakka-reels', reels: { symbols: ['fire', 'fire', 'fire'], threeOfAKind: true, timeRemainingMs: 9000 } },
  'fire-fury': { kind: 'lulu-fury', fury: { sweptDegrees: 1800, casts: 4 } },
  mix: { kind: 'rikku-mix', mix: { ingredients: ['potion', 'potion'], resultAbilityId: 'mix-ultra-potion' } },
  'grand-summon': { kind: 'yuna-grand-summon', grandSummon: { aeonId: 'valefor' } },
  'stone-breath': { kind: 'kimahri-rage', rage: { rageId: 'stone-breath' } },
};
const wanted = list.split(',').map((s) => { const [who, od] = s.split(':'); return { who, od, extra: EXTRA[od] ?? null }; });
try {
  await enterBattle(page, chapter, 1);
  await startSampler(page);
  mark('battle');
  await page.evaluate(([wanted]) => {
    const keep = () => { try { const cs = window.__pyrefly.battleState().combatants; for (const c of Array.isArray(cs) ? cs : Object.values(cs)) if (c.side === 'party') { if (c.overdrive) c.overdrive.gauge = 100; if (c.stats) c.stats.maxHp = Math.max(c.stats.maxHp ?? 0, 30000); c.hp = Math.max(c.hp, 29000); } } catch { /* between battles */ } };
    window.__keep = setInterval(keep, 400); keep();
    window.__chosen = [];
    window.__pyrefly.autoBattle((actorId, commands, engine) => {
      const s = engine.state();
      const arr = Array.isArray(s.combatants) ? s.combatants : Object.values(s.combatants);
      const en = arr.find((c) => c.side === 'enemy' && c.alive && !c.removed);
      const w = wanted.find((x) => x.who === actorId && !window.__chosen.includes(x.od));
      if (w) { window.__chosen.push(w.od); window.__chosenAt = (window.__chosenAt ?? []).concat([{ od: w.od, who: actorId, t: performance.now() }]); return { kind: 'overdrive', id: w.od, targets: [en.id], ...(w.extra ? { extra: w.extra } : {}) }; }
      return { kind: 'attack', targets: [en.id] };
    });
  }, [wanted]);
  const done = new Set();
  const t1 = Date.now();
  while (done.size < wanted.length && Date.now() - t1 < 240000) {
    const chosen = await page.evaluate(() => window.__chosen ?? []);
    for (const od of chosen) if (!done.has(od)) {
      done.add(od);
      const w = wanted.find((x) => x.od === od);
      mark(`${w.who}-${od}:start`);
      for (let i = 0; i < 18; i++) { await shot(page, `${dir}/${w.who}-${od}-${String(i).padStart(2, '0')}.jpg`); await sleep(380); }
      mark(`${w.who}-${od}:end`);
    }
    await sleep(120);
  }
  if (done.size < wanted.length) console.log('NOT ALL OVERDRIVES CHOSEN', [...done]);
} catch (e) {
  console.error('FAIL', e.message);
  await page.screenshot({ path: `${dir}/fail.jpg` }).catch(() => {});
}
let pz = []; try { pz = await poses(page); } catch { /* gone */ }
fs.writeFileSync(`${dir}/poses.json`, JSON.stringify(pz));
try { fs.writeFileSync(`${dir}/events.json`, JSON.stringify(await page.evaluate(() => window.__pyrefly.battleLog().filter((e) => e.type === 'action-start').map((e) => ({ seq: e.seq, actorId: e.actorId, abilityId: e.abilityId ?? e.command?.id, kind: e.command?.kind }))))); } catch { /* gone */ }
fs.writeFileSync(`${dir}/markers.json`, JSON.stringify(markers, null, 1));
let r = null;
if (record) { const vid = page.video(); await g.ctx.close(); await g.browser.close(); r = await vid.path(); fs.writeFileSync(`${dir}/video.json`, JSON.stringify({ raw: r, t0, ctxStart: g.ctxStart })); } else await g.browser.close();
console.log('video', r, 'errors', g.errors.slice(0, 5), 'missing', g.missing.slice(0, 8));
