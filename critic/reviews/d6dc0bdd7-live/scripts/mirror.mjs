import { launch, bootFresh, toBoard, boardSnap, selectCard, dismissOverlays, shot, screenNow, sleep, step, enterBattle, menuRows, pendingActor, walkTo, aim, waitFor, writeJson, OUT } from './common.mjs';

const phone = process.argv.includes('--phone');
const full = process.argv.includes('--full');
const party = process.argv.includes('--party');
const { browser, page, rec } = await launch(phone ? { w: 390, h: 844, touch: true, name: 'mirror-phone' } : { name: 'mirror-desk' });
const seen = {};
const result = { game: 'FFX', chapter: 'mirror-aeons (XXVII)', viewport: phone ? '390x844' : '1600x900' };

const startSampler = () =>
  page.evaluate(() => {
    window.__fs = [];
    if (window.__fsId) clearInterval(window.__fsId);
    window.__fsId = setInterval(() => {
      const t = window.__pyrefly.targeting?.();
      if (!t) return;
      const snap = window.__pyrefly.app?.current?.stage?.snapshot?.() ?? [];
      const pose = Object.fromEntries(snap.map((q) => [q.id, q.pose + (q.mirrored ? '~' : '')]));
      const now = Math.round(performance.now());
      for (const [id, r] of Object.entries(t.rects)) if (id.startsWith('dark-')) window.__fs.push([now, id, +r.x.toFixed(1), +r.y.toFixed(1), +r.w.toFixed(1), +r.h.toFixed(1), pose[id] ?? '?']);
    }, 40);
  });
const pullSamples = () => page.evaluate(() => window.__fs.splice(0, window.__fs.length));
const allSamples = [];

/** Photograph each (id, size bucket) once: a new bucket is a new pose painting. */
async function watch(ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const snap = await page.evaluate(() => {
      const t = window.__pyrefly.targeting?.();
      const st = window.__pyrefly.app?.current?.stage?.snapshot?.() ?? [];
      const pose = Object.fromEntries(st.map((q) => [q.id, q]));
      return t ? Object.entries(t.rects).filter(([id]) => id.startsWith('dark-')).map(([id, r]) => ({ id, ...r, pose: pose[id]?.pose ?? '?', art: pose[id]?.art ?? '?', mirrored: pose[id]?.mirrored })) : [];
    });
    for (const r of snap) {
      const key = `${r.id}:${r.pose}`;
      if (!seen[key]) {
        seen[key] = { first: label, art: r.art, w: r.w, h: r.h, bottom: +(r.y + r.h).toFixed(1) };
        const cx = Math.max(0, r.x - 20), cy = Math.max(0, r.y - 20);
        const clip = { x: cx, y: cy, width: Math.min(rec.w - cx, r.w + 40), height: Math.min(rec.h - cy, r.h + 40) };
        if (clip.width > 10 && clip.height > 10) await page.screenshot({ path: `${OUT}/shots/${rec.name}-pose-${r.id}-${r.pose.replace('~', 'm')}.png`, clip });
      }
    }
    await sleep(120);
  }
}

const feetOk = (poses) => !!poses && Object.entries(poses).every(([k, m]) => !m || k === 'ko' || (k === 'hurt' ? Math.abs(m.dBottomVsIdle) <= 0.04 * poses.idle.h : Math.abs(m.dBottomVsIdle) <= 2));
const feetSummary = (poses) => ({ idleH: poses?.idle?.h, d: Object.fromEntries(Object.entries(poses ?? {}).map(([k, m]) => [k, m?.dBottomVsIdle])), hurtPctOfH: poses?.hurt ? +((100 * poses.hurt.dBottomVsIdle) / poses.idle.h).toFixed(2) : null });

/** Debug-assisted: with the field at rest, force each painted pose in turn and read the feet line (rect bottom) and a clip. */
async function staticPoses(ids, label) {
  const out = {};
  for (const id of ids) {
    const names = await page.evaluate((id) => {
      const a = window.__pyrefly.app.current.stage.actors.get(id)?.actor;
      return a ? a.poseNames : null;
    }, id);
    if (!names) { out[id] = null; continue; }
    out[id] = {};
    for (const pose of names) {
      await page.evaluate(({ id, pose }) => {
        const a = window.__pyrefly.app.current.stage.actors.get(id).actor;
        a.setPose(pose, { immediate: true, force: true });
      }, { id, pose });
      await sleep(350);
      const m = await page.evaluate(({ id }) => {
        const st = window.__pyrefly.app.current.stage;
        const r = st.projectRect(id);
        const a = st.actors.get(id).actor;
        return r ? { pose: a.pose, x: r.x, y: r.y, w: r.w, h: r.h, bottom: r.y + r.h, cx: r.x + r.w / 2, mirrored: a.mirrored } : null;
      }, { id });
      out[id][pose] = m ? { ...m, bottom: +m.bottom.toFixed(1), cx: +m.cx.toFixed(1), w: +m.w.toFixed(1), h: +m.h.toFixed(1) } : null;
      if (m) {
        const cx0 = Math.max(0, m.x - 20), cy0 = Math.max(0, m.y - 20);
        const clip = { x: cx0, y: cy0, width: Math.min(rec.w - cx0, m.w + 40), height: Math.min(rec.h - cy0, m.h + 40) };
        if (clip.width > 10 && clip.height > 10) await page.screenshot({ path: `${OUT}/shots/${rec.name}-static-${label}-${id}-${pose}.png`, clip });
      }
    }
    await page.evaluate((id) => window.__pyrefly.app.current.stage.actors.get(id).actor.setPose('idle', { immediate: true, force: true }), id);
    await sleep(300);
    const base = out[id].idle?.bottom;
    for (const [pose, m] of Object.entries(out[id])) if (m && base !== undefined) m.dBottomVsIdle = +(m.bottom - base).toFixed(1);
  }
  return out;
}

try {
  await bootFresh(page);
  result.build = await page.evaluate(() => window.__pyrefly.build());
  await toBoard(page);
  await dismissOverlays(page);
  await selectCard(page, 'mirror-aeons');
  await sleep(1200);
  const card = await page.evaluate(() => {
    const t = document.body.innerText;
    const i = t.search(/LOCATION/);
    return t.slice(i, i + 260).replace(/\n+/g, ' | ');
  });
  result.boardCard = card;
  step(rec, 'board card BOSS row', /BOSS \| Dark Sandy and Dark Mindy, then Dark Yojimbo/.test(card), card);
  step(rec, 'board card LOCATION whole', /LOCATION \| Mushroom Rock Road and the Cavern \|/.test(card), card.slice(0, 80));
  await shot(page, rec, '1-board');

  await enterBattle(page, rec, {
    onPrep: async () => {
      result.prepText = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 700));
      await shot(page, rec, '2-prep');
    },
  });
  step(rec, 'reached battle by real keys', (await screenNow(page)) === 'battle');
  await startSampler();
  await waitFor('first menu', async () => (await pendingActor(page)).awaiting, { ms: 120000, pollMs: 400 });
  await sleep(1500);
  await dismissOverlays(page);
  const staged = await waitFor('staged', async () => { const k = await page.evaluate(() => Object.keys(window.__pyrefly.targeting()?.rects ?? {})); return k.length ? k : false; }, { ms: 20000 }).catch(() => []);
  result.staged = staged;
  step(rec, 'Act I field is the pair', staged.includes('dark-mindy') && staged.includes('dark-sandy') && !staged.includes('dark-cindy'), staged);
  await shot(page, rec, '3-act1-first-menu');
  result.staticAct1 = await staticPoses(['dark-mindy', 'dark-sandy'], 'act1');
  if (party) {
    result.staticParty = await staticPoses(['tidus', 'yuna', 'lulu'], 'party');
    for (const [id, poses] of Object.entries(result.staticParty)) step(rec, `baseline party ${id} pose deltas vs idle`, true, Object.fromEntries(Object.entries(poses ?? {}).map(([k, m]) => [k, m?.dBottomVsIdle])));
  }
  await startSampler(); // natural samples only from here: the static probe's forced poses are not in them
  for (const [id, poses] of Object.entries(result.staticAct1)) {
    step(rec, `static feet line ${id}: stances within 2px of idle; hurt within 4% of height; KO is a lying pose`, feetOk(poses), feetSummary(poses));
  }

  // guide text on screen: any quote attributed to the game?
  const guide = await page.evaluate(() => document.body.innerText);
  result.guideMentions = {
    inGameDescription: /In Game Description/i.test(guide),
    wrongColours: /wrong colours|called up by a Yevon/i.test(guide),
    guideOpenOnScreen: /Dark Magus Sisters|Boss Battle/i.test(guide),
  };
  step(rec, 'no "In Game Description" on the first-menu screen', !result.guideMentions.inGameDescription, result.guideMentions);

  // dark paintings requested?
  const darkReq = () => [...new Set(rec.requests.filter((u) => /art\/characters\/dark-/.test(u)))];
  result.darkRequests = darkReq();
  step(rec, 'Dark painting files requested', darkReq().length >= 2, darkReq());
  const bd = rec.requests.filter((u) => /backdrops\//.test(u));
  result.backdropRequests = [...new Set(bd)];
  step(rec, 'backdrop requests', bd.length > 0, [...new Set(bd)]);
  step(rec, 'no mirror-aeons.png backdrop asked for', !rec.requests.some((u) => /backdrops\/mirror-aeons/.test(u)), null);

  if (!phone) {
    await watch(5000, 'act1-idle');
    // real-key turns
    for (let t = 0; t < 4; t++) {
      await waitFor('menu', async () => (await pendingActor(page)).awaiting, { ms: 120000, pollMs: 400 });
      await dismissOverlays(page);
      const rows = (await menuRows(page)).rows.map((r) => r.label);
      const actor = (await pendingActor(page)).actor;
      const ok = await walkTo(page, /^attack/i);
      if (!ok) {
        step(rec, `turn ${t}: Attack row`, false, rows);
        break;
      }
      await page.keyboard.press('Enter');
      await sleep(300);
      await aim(page);
      step(rec, `turn ${t}: ${actor} Attack by real keys`, true, rows);
      await watch(3500, `act1-turn${t}`);
    }
    // let the engine run so the sisters attack/cast; sampled
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('skip');
      window.__pyrefly.autoBattle('intended');
    });
    await watch(25000, 'act1-auto');
    await page.evaluate(() => {
      window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null);
      window.__pyrefly.setBattleSpeed('normal');
    });
    allSamples.push(...(await pullSamples()));

    if (full) {
      // short Act I, to reach Act II: debug hp (the smoke tool's own method), then watch Dark Yojimbo
      await page.evaluate(() => {
        for (const id of ['dark-mindy', 'dark-sandy']) {
          const c = window.__pyrefly.battleState().combatants[id];
          if (c) c.hp = 1;
        }
        window.__pyrefly.setBattleSpeed('normal');
        window.__pyrefly.autoBattle('intended');
      });
      let link2 = false;
      const t0 = Date.now();
      while (Date.now() - t0 < 6 * 60_000) {
        const en = await page.evaluate(() => window.__pyrefly.battleState?.()?.enemyIds ?? []);
        if (en.includes('dark-yojimbo')) {
          await page.evaluate(() => {
            window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null);
            window.__pyrefly.setBattleSpeed('normal');
          });
          link2 = true;
          break;
        }
        await watch(1000, 'seam');
      }
      step(rec, 'Act II reached (Act I shortened by debug hp, the smoke tool method)', link2);
      if (link2) {
        await waitFor('act2 menu', async () => (await pendingActor(page)).awaiting, { ms: 120000, pollMs: 400 });
        await sleep(2500);
        await dismissOverlays(page);
        result.stagedAct2 = await page.evaluate(() => Object.keys(window.__pyrefly.targeting()?.rects ?? {}));
        await shot(page, rec, '4-act2-first-menu');
        allSamples.push(...(await pullSamples()));
        result.staticAct2 = await staticPoses(['dark-yojimbo', 'dark-daigoro'], 'act2');
        await startSampler();
        for (const [id, poses] of Object.entries(result.staticAct2)) {
          step(rec, `static feet line ${id}: stances within 2px of idle; hurt within 4% of height; KO is a lying pose`, feetOk(poses), feetSummary(poses));
        }
        const g2 = await page.evaluate(() => document.body.innerText);
        result.act2Guide = { inGameDescription: /In Game Description/i.test(g2), wrongColours: /wrong colours|called up by a Yevon/i.test(g2) };
        step(rec, 'Act II: no "In Game Description" on screen', !result.act2Guide.inGameDescription, result.act2Guide);
        await watch(4000, 'act2-idle');
        for (let t = 0; t < 3; t++) {
          await waitFor('menu', async () => (await pendingActor(page)).awaiting, { ms: 120000, pollMs: 400 });
          await dismissOverlays(page);
          const ok = await walkTo(page, /^attack/i);
          if (!ok) break;
          await page.keyboard.press('Enter');
          await sleep(300);
          await aim(page);
          await watch(3500, `act2-turn${t}`);
        }
        await page.evaluate(() => {
          window.__pyrefly.setBattleSpeed('skip');
          window.__pyrefly.autoBattle('intended');
        });
        await watch(20000, 'act2-auto');
        allSamples.push(...(await pullSamples()));
      }
    }
  }
  result.darkRequestsEnd = darkReq();
} catch (e) {
  step(rec, 'THREW', false, String(e).slice(0, 400));
  try { await shot(page, rec, 'zz-failure'); } catch {}
} finally {
  try { allSamples.push(...(await pullSamples())); } catch {}
  writeJson(`${rec.name}-samples.json`, allSamples);
  // foot analysis
  const byId = {};
  for (const [t, id, x, y, w, h, pose] of allSamples) (byId[id] ??= []).push({ t, x, y, w, h, pose, bottom: +(y + h).toFixed(1), cx: +(x + w / 2).toFixed(1) });
  const analysis = {};
  for (const [id, arr] of Object.entries(byId)) {
    const poses = {};
    for (const s of arr) {
      const b = (poses[s.pose] ??= { n: 0, minBottom: 1e9, maxBottom: -1e9, minH: 1e9, maxH: -1e9 });
      b.n++; b.minBottom = Math.min(b.minBottom, s.bottom); b.maxBottom = Math.max(b.maxBottom, s.bottom);
      b.minH = Math.min(b.minH, s.h); b.maxH = Math.max(b.maxH, s.h);
    }
    // pose changes: bottom delta across the change vs the typical per-sample bottom step (movement)
    const steps = [];
    for (let i = 1; i < arr.length; i++) if (arr[i].pose === arr[i - 1].pose && arr[i].t - arr[i - 1].t < 200) steps.push(Math.abs(arr[i].bottom - arr[i - 1].bottom));
    steps.sort((p, q) => p - q);
    const medianStep = steps.length ? steps[Math.floor(steps.length / 2)] : 0;
    const p95Step = steps.length ? steps[Math.floor(steps.length * 0.95)] : 0;
    const changes = [];
    const calm = (i0, i1) => { for (let k = Math.max(1, i0); k <= Math.min(arr.length - 1, i1); k++) if (Math.abs(arr[k].bottom - arr[k - 1].bottom) > 1.5 && arr[k].pose === arr[k - 1].pose) return false; return true; };
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1], b = arr[i];
      if (a.pose !== b.pose && b.t - a.t < 200) changes.push({ t: b.t, from: a.pose, to: b.pose, dBottom: +(b.bottom - a.bottom).toFixed(1), dCx: +(b.cx - a.cx).toFixed(1), dH: +(b.h - a.h).toFixed(1), atRest: calm(i - 4, i - 1) && calm(i + 1, i + 4) });
    }
    analysis[id] = { samples: arr.length, poses, medianStepPx: +medianStep.toFixed(2), p95StepPx: +p95Step.toFixed(2), poseChanges: changes.length, maxAbsDBottomAtChange: changes.length ? Math.max(...changes.map((c) => Math.abs(c.dBottom))) : 0, atRestChanges: changes.filter((c) => c.atRest).length, maxAbsDBottomAtRestChange: Math.max(0, ...changes.filter((c) => c.atRest).map((c) => Math.abs(c.dBottom))), changes: changes.slice(0, 80) };
  }
  result.footAnalysis = analysis;
  result.seenPoses = seen;
  result.consoleErrors = rec.consoleErrors;
  result.badResponses = rec.badResponses;
  result.failed = rec.failed;
  result.htmlAsMedia = rec.htmlAsMedia;
  result.steps = rec.steps;
  writeJson(`${rec.name}-result.json`, result);
  console.log(JSON.stringify({ footAnalysis: analysis, seenPoses: seen, consoleErrors: rec.consoleErrors, badResponses: rec.badResponses, failed: rec.failed }, null, 1));
  await browser.close();
}
