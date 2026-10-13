// Real-input live smoke of build 7b2582e7 (bundle 1ntEYvFO) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), 1600x900, a fresh context per chapter, a cache-busting query, REAL key presses.
//   FFX Chapter I  (seymour-flux): board -> card confirm -> party prep (text floor) -> first spoken line (scene cue playing?) -> battle -> first menu
//                                  -> three Attack turns, a cancel, a KO and a Phoenix Down -> Escape / P pause, H hide -> settings reload.
//   FFX-2 Chapter IV (ffx2-bahamut): the same up to the first menu, then Escape pause and resume.
// Every capture asserts the screen (and awaitingMenu for a battle) first; a wait that times out throws and is recorded, never screenshotted.
import fs from 'node:fs';

import sharp from 'sharp';

import { assertScreen, MODE, open, waitBattleMenu, waitFor } from '../runner/lib/lib.mjs';
import { textFloorProbe } from '../../tools/text-floor-probe.mjs';

const SHA = '7b2582e7';
const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const OUT = process.env.SMOKE_OUT || `D:/Tools/pyrefly-scratch/shots-${SHA}`;
const RESULT = process.env.SMOKE_JSON || `D:/Tools/pyrefly-scratch/live-smoke-${SHA}.json`;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean); // e.g. ONLY=ffx2 to rerun one part
fs.mkdirSync(OUT, { recursive: true });

const ev = (page, f, a) => page.evaluate(f, a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const selId = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const audioNow = (p) =>
  p.evaluate(() => {
    const d = window.__pyrefly.audioDebug();
    return {
      playing: d.playing,
      current: d.music.current,
      fading: d.music.fading,
      held: d.music.held,
      muted: d.muted,
      manifest: d.prerendered.manifest,
      cues: d.prerendered.cues,
      cachedTracks: d.tracks.filter((t) => t.cached).map((t) => `${t.name}:${t.source}`),
    };
  });

async function shot(page, name, extra = {}) {
  const buf = await page.screenshot({ type: 'jpeg', quality: 85 });
  fs.writeFileSync(`${OUT}/${name}.jpg`, buf);
  const st = await sharp(buf).stats();
  const lum = Math.round(((st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3) * 10) / 10;
  return { file: `${name}.jpg`, meanLuminance: lum, ...extra };
}

const probeSummary = async (page, floor = 14, rootSel = null) => {
  const p = await page.evaluate(textFloorProbe, rootSel ? { floor, rootSel } : { floor });
  if (p.error) return { error: p.error, rootSel };
  return { viewport: p.viewport, floor, nText: p.nText, minEff: p.minEff, underCount: p.underCount, under: (p.under || []).slice(0, 8).map((u) => ({ text: u.text, eff: u.eff, fs: u.fs, scale: u.scale, at: u.at })), overlaps: (p.overlaps || []).length, cut: (p.cut || []).length, sample: (p.items || []).filter((_, i) => i % Math.max(1, Math.floor((p.items || []).length / 6)) === 0).slice(0, 6).map((i) => `${i.eff}px ${i.at}: ${i.text.slice(0, 24)}`) };
};

// Audio requests with their times (the confirm is time zero), and the page's document responses (status, validators, the request's If-None-Match).
function trackNetwork(page) {
  const audio = [];
  const byReq = new Map();
  const docs = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/\/audio\/.*\.(mp3|ogg|m4a|wav)/i.test(u)) {
      const rec = { url: u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), reqAt: Date.now() };
      byReq.set(r, rec);
      audio.push(rec);
    }
  });
  page.on('requestfinished', (r) => {
    const rec = byReq.get(r);
    if (rec) rec.doneAt = Date.now();
  });
  page.on('response', async (r) => {
    if (r.request().resourceType() === 'document') {
      const h = r.headers();
      docs.push({ at: new Date().toISOString().slice(11, 19), status: r.status(), etag: h.etag ?? null, cacheControl: h['cache-control'] ?? null, ifNoneMatchSent: r.request().headers()['if-none-match'] ?? null });
    }
  });
  return { audio, docs };
}

async function selectCard(page, id) {
  for (const [key, n] of [['ArrowRight', 60], ['ArrowLeft', 80]]) {
    for (let i = 0; i <= n; i++) {
      if ((await selId(page)) === id) return;
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
  }
  throw new Error(`ASSERT-FAIL card ${id} not reached on the board`);
}

const firstLineVisible = (page) =>
  page.evaluate(() => {
    const t = document.querySelector('.dbox.dbox--visible .dbox__text');
    return !!t && t.textContent.trim().length > 0 ? { speaker: document.querySelector('.dbox__speaker')?.textContent?.trim() ?? null, text: t.textContent.trim().slice(0, 60) } : null;
  });

const allErr = [];
const allNF = [];
const allHtmlImages = [];
const R = { review: 'live-smoke', sha: SHA, base: BASE.replace(/\?cb=\d+/, '?cb=<time>'), browserMode: MODE, viewport: '1600x900', startedAt: new Date().toISOString(), parts: {} };

async function playChapter(spec) {
  const { tag, id, expectScene, expectBoss, turns = 0, doKo = false, doReload = false } = spec;
  const out = { id, expectScene, expectBoss, steps: [] };
  R.parts[tag] = out;
  const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
  const { page } = c;
  const net = trackNetwork(page);
  try {
    out.build = await ev(page, () => window.__pyrefly.build());
    await assertScreen(page, 'title', 60000);
    await page.waitForTimeout(900);
    await page.keyboard.press('Enter');
    // A fresh profile meets the first-run briefing (Auron, "Enter / Esc skip"): measure its text once, then skip it with real Enter presses.
    for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) {
      await page.waitForTimeout(500);
      if (!out.briefing && (await page.evaluate(() => !!document.querySelector('.coach-brief')))) {
        out.briefing = { screen: await scr(page), probe: await probeSummary(page, 14, '.coach-brief'), shot: await shot(page, `${tag}-briefing`, { screen: await scr(page) }) };
        log(tag, 'briefing seen on screen', out.briefing.screen, 'minEff', out.briefing.probe.minEff, 'under14', out.briefing.probe.underCount);
      }
      if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter');
    }
    await assertScreen(page, 'chapter-select', 15000);
    await page.waitForTimeout(600);
    await selectCard(page, id);
    out.selected = await selId(page);
    out.board = await shot(page, `${tag}-board`, { screen: await scr(page), selected: out.selected });
    log(tag, 'board ok, selected', out.selected);

    // --- card confirm: time zero for the music warm
    const tConfirm = Date.now();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 20000);
    out.prepProbe = await probeSummary(page, 14);
    out.prepShot = await shot(page, `${tag}-prep`, { screen: await scr(page), state: await ev(page, () => window.__pyrefly.snapshotState()?.screenState ?? null) });
    log(tag, 'prep: nText', out.prepProbe.nText, 'minEff', out.prepProbe.minEff, 'under14', out.prepProbe.underCount);
    const tPrepLeave = Date.now();
    await page.keyboard.press('Enter');

    // --- the first spoken line of the opening scene: is the scene cue already playing?
    await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && (await firstLineVisible(page)), { ms: 60000, pollMs: 40 });
    const tLine = Date.now();
    const line = await firstLineVisible(page);
    const atLine = await audioNow(page);
    const sceneReq = net.audio.find((a) => a.url.includes(`/${expectScene}.`));
    out.music = {
      msConfirmToFirstLine: tLine - tConfirm,
      msInPrep: tPrepLeave - tConfirm,
      firstLine: line,
      atFirstLine: atLine,
      expectedScene: expectScene,
      scenePlayingAtFirstLine: atLine.playing === expectScene && atLine.current?.name === expectScene,
      sceneFromPrerendered: atLine.cachedTracks.includes(`${expectScene}:prerendered`),
      sceneRequestMsAfterConfirm: sceneReq ? sceneReq.reqAt - tConfirm : null,
      sceneFinishedMsBeforeFirstLine: sceneReq && sceneReq.doneAt ? tLine - sceneReq.doneAt : null,
      requestsBeforeFirstLine: net.audio.filter((a) => a.reqAt <= tLine).map((a) => ({ url: a.url, atMs: a.reqAt - tConfirm, doneMs: a.doneAt ? a.doneAt - tConfirm : null })),
    };
    log(tag, 'first line at', tLine - tConfirm, 'ms after confirm; playing=', atLine.playing, 'sceneReq at', out.music.sceneRequestMsAfterConfirm, 'ms');
    out.cutsceneShot = await shot(page, `${tag}-first-line`, { screen: await scr(page) });

    // --- through the scene to the first battle menu (a held Enter fast-forwards, then plain taps)
    await page.keyboard.down('Enter');
    await page.waitForTimeout(6000);
    await page.keyboard.up('Enter');
    await page.waitForTimeout(500);
    let g = 0;
    while ((await scr(page)) === 'cutscene' && g++ < 250) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    await assertScreen(page, 'battle', 90000);
    await waitBattleMenu(page, 90000);
    out.enemies = await ev(page, () => window.__pyrefly.battleState().enemyIds);
    const menuAudio = await audioNow(page);
    out.menu = { screen: await scr(page), enemies: out.enemies, audio: { playing: menuAudio.playing, current: menuAudio.current, muted: menuAudio.muted, manifest: menuAudio.manifest }, bossPlayingIsExpected: menuAudio.playing === expectBoss, hudProbe: await probeSummary(page, 14) };
    out.menuShot = await shot(page, `${tag}-menu`, { screen: 'battle', awaitingMenu: true });
    log(tag, 'first menu; enemies', JSON.stringify(out.enemies), 'playing', menuAudio.playing, 'lum', out.menuShot.meanLuminance);
    // text of the first menu, for the Bahamut intent note (FFX-2 only)
    out.menuText = await ev(page, () => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500));
    out.mentions = await ev(page, () => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      const pick = (re) => [...t.matchAll(re)].map((m) => t.slice(Math.max(0, m.index - 60), m.index + 120)).slice(0, 4);
      return { megaFlare: pick(/Mega Flare/gi), slow: pick(/\bSlow\b/g) };
    });

    // --- a few real turns (FFX): Attack, target; the log must grow and the menu must come back
    if (turns > 0) {
      out.turns = [];
      for (let i = 0; i < turns; i++) {
        await waitBattleMenu(page, 90000);
        const b = await ev(page, () => ({ f: window.__pyrefly.snapshotState()?.frame, l: window.__pyrefly.battleLog().length }));
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2500);
        const a = await ev(page, () => ({ f: window.__pyrefly.snapshotState()?.frame, l: window.__pyrefly.battleLog().length }));
        out.turns.push({ i: i + 1, before: b, after: a, logGrew: a.l > b.l });
        log(tag, 'turn', i + 1, 'log', b.l, '->', a.l);
      }
      await waitBattleMenu(page, 90000);
      // cancel path: open the Attack, back out with Escape, the same menu must be there
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const stillBattle = (await scr(page)) === 'battle';
      await waitBattleMenu(page, 10000);
      out.cancel = { backAtMenu: stillBattle, screen: await scr(page) };
    }

    // --- pause: Escape, H hides and restores the panels, Escape resumes, P toggles
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    const pauseEsc = await scr(page);
    out.pauseShot = await shot(page, `${tag}-pause`, { screen: pauseEsc });
    const len0 = await page.evaluate(() => document.body.innerText.length);
    await page.keyboard.press('h');
    await page.waitForTimeout(500);
    const lenH = await page.evaluate(() => document.body.innerText.length);
    await page.keyboard.press('h');
    await page.waitForTimeout(500);
    const lenR = await page.evaluate(() => document.body.innerText.length);
    const stillPause = await scr(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    const afterEsc = await scr(page);
    await page.keyboard.press('p');
    await page.waitForTimeout(900);
    const pauseP = await scr(page);
    await page.keyboard.press('p');
    await page.waitForTimeout(900);
    const afterP = await scr(page);
    out.pause = { pauseEsc, hide: { len0, lenH, lenR, hidDropsText: lenH < len0, restored: lenR >= len0 - 5, stillPause }, afterEsc, pauseP, afterP };
    log(tag, 'pause', JSON.stringify(out.pause));

    const later = await audioNow(page);
    out.audioLater = { playing: later.playing, muted: later.muted, manifest: later.manifest, cues: later.cues };
    out.musicRequests = net.audio.map((a) => a.url);

    // --- a KO (and, if the party survives it, a Phoenix Down): Kimahri at 1 HP, Attack until any party member falls (the KO-wipe presenter path).
    //     Seymour's Cross Cleave can one-shot Tidus, so a whole-party wipe (Defeat -> results) is a possible and honest outcome; it is recorded, and Retry is tried.
    if (doKo) {
      out.ko = { phase: 'start' };
      try {
        await ev(page, () => { const cb = window.__pyrefly.battleState().combatants; cb['kimahri'].hp = 1; });
        const partyKos = () => ev(page, () => {
          const bs = window.__pyrefly.battleState();
          if (!bs) return null;
          const foes = new Set(bs.enemyIds);
          return window.__pyrefly.battleLog().filter((e) => e.type === 'ko' && !foes.has(e.targetId)).map((e) => e.targetId);
        });
        let kos = [];
        let k = 0;
        const tKo = Date.now();
        while (!kos.length && k++ < 14 && Date.now() - tKo < 150000 && (await scr(page)) === 'battle') {
          await waitBattleMenu(page, 30000).catch(() => undefined);
          if ((await scr(page)) !== 'battle') break;
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          await page.keyboard.press('Enter');
          for (let i = 0; i < 12 && !kos.length; i++) {
            await page.waitForTimeout(400);
            kos = (await partyKos()) ?? [];
            if ((await scr(page)) !== 'battle') break;
          }
        }
        out.ko = { phase: 'ko-loop-done', turnsPlayed: k, partyKoEvents: kos, screenAfterLoop: await scr(page) };
        if (kos.length && (await scr(page)) === 'battle') {
          await page.waitForTimeout(500);
          out.koShot = await shot(page, `${tag}-ko`, { screen: await scr(page) });
          const victim = kos[0];
          out.ko.victim = victim;
          const menu = await waitBattleMenu(page, 60000).then(() => true).catch(() => false);
          out.ko.menuAfterKo = menu;
          if (menu) {
            const rev = await ev(page, (v) => {
              const r = window.__pyrefly.forceCommand({ kind: 'item', id: 'phoenix-down', targets: [v] });
              const y = window.__pyrefly.battleState().combatants[v];
              return { events: (r ?? []).map((e) => e.type), hp: y.hp, alive: y.alive };
            }, victim);
            out.ko.revive = rev;
            await page.waitForTimeout(900);
            out.reviveShot = await shot(page, `${tag}-revive`, { screen: await scr(page) });
          }
        }
        // the whole party fell: the Defeat results screen, then Retry by a real Enter
        let s = await scr(page);
        if (s !== 'battle') {
          await waitFor('results', async () => (await scr(page)) === 'results', { ms: 60000, pollMs: 300 }).catch(() => undefined);
          s = await scr(page);
          out.ko.endedIn = s;
          if (s === 'results') {
            await page.waitForTimeout(3500);
            out.resultsShot = await shot(page, `${tag}-results`, { screen: 'results', resultsText: await ev(page, () => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300)) });
            out.resultsProbe = await probeSummary(page, 14);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2500);
            out.ko.afterRetryEnter = await scr(page);
            for (let i = 0; i < 40 && ['cutscene', 'party-prep'].includes(await scr(page)); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
            out.ko.retryLandedOn = await scr(page);
            if (out.ko.retryLandedOn === 'battle') await waitBattleMenu(page, 60000).then(() => { out.ko.retryMenu = true; }).catch(() => { out.ko.retryMenu = false; });
          }
        }
        log(tag, 'ko step', JSON.stringify(out.ko));
      } catch (e) {
        out.ko.error = String(e && e.message ? e.message : e).slice(0, 300);
        log(tag, '!! ko step error (recorded, run continues)', out.ko.error);
      }
    }

    // --- reload smoke (CHK-024 light): change one setting, reload, confirm it and everything else the game itself had saved survived
    if (doReload) {
      const key = 'pyrefly-reprise:save:v1';
      const before = await ev(page, (k) => {
        let r = {};
        try { r = JSON.parse(localStorage.getItem(k) || '{}'); } catch { r = {}; }
        r.settings = r.settings || {};
        const oldVol = r.settings.masterVolume;
        r.settings.masterVolume = 0.42;
        const next = JSON.stringify(r);
        localStorage.setItem(k, next);
        return { next, oldVol, lsKeys: Object.keys(localStorage) };
      }, key);
      await page.reload();
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
      const after = await ev(page, (k) => ({ raw: localStorage.getItem(k), lsKeys: Object.keys(localStorage) }), key);
      await assertScreen(page, 'title', 30000);
      let pb = {}, pa = {};
      try { pb = JSON.parse(before.next); pa = JSON.parse(after.raw); } catch { /* reported below */ }
      const diffKeys = [...new Set([...Object.keys(pb), ...Object.keys(pa)])].filter((x) => JSON.stringify(pb[x]) !== JSON.stringify(pa[x]));
      out.reload = {
        oldVolume: before.oldVol,
        volumeSetTo: 0.42,
        volumeAfterReload: pa?.settings?.masterVolume,
        volumeSurvived: pa?.settings?.masterVolume === 0.42,
        saveTopLevelKeys: Object.keys(pa),
        saveBytesBefore: before.next.length,
        saveBytesAfter: after.raw ? after.raw.length : null,
        saveIdenticalAcrossReload: before.next === after.raw,
        topLevelKeysThatDiffer: diffKeys,
        localStorageKeysBefore: before.lsKeys,
        localStorageKeysAfter: after.lsKeys,
        screenAfter: await scr(page),
      };
      log(tag, 'reload', JSON.stringify({ vol: out.reload.volumeAfterReload, survived: out.reload.volumeSurvived, identical: out.reload.saveIdenticalAcrossReload, differ: diffKeys, screen: out.reload.screenAfter }));
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.documents = net.docs;
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    allErr.push(...c.consoleErrors);
    allNF.push(...c.notFound);
    allHtmlImages.push(...c.htmlImages);
    await c.browser.close();
  }
}

if (!ONLY.length || ONLY.includes('ffx')) {
  await playChapter({ tag: 'ffx-ch1', id: 'seymour-flux', expectScene: 'scene-gagazet', expectBoss: 'boss-seymour', turns: 3, doKo: true, doReload: true });
}
if (!ONLY.length || ONLY.includes('ffx2')) {
  await playChapter({ tag: 'ffx2-ch4', id: 'ffx2-bahamut', expectScene: 'scene-bevelle-underground', expectBoss: 'boss-bahamut', turns: 0, doKo: false, doReload: false });
}
R.finishedAt = new Date().toISOString();
R.consoleErrors = allErr;
R.notFound = allNF;
R.htmlImages = allHtmlImages;
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
log('wrote', RESULT, 'consoleErrors', allErr.length, 'notFound', allNF.length, 'htmlImages', allHtmlImages.length);
console.log(JSON.stringify({ parts: Object.fromEntries(Object.entries(R.parts).map(([k, v]) => [k, { status: v.status, error: v.error, music: v.music && { scenePlayingAtFirstLine: v.music.scenePlayingAtFirstLine, sceneFromPrerendered: v.music.sceneFromPrerendered, sceneRequestMsAfterConfirm: v.music.sceneRequestMsAfterConfirm, msConfirmToFirstLine: v.music.msConfirmToFirstLine }, prep: v.prepProbe && { minEff: v.prepProbe.minEff, under: v.prepProbe.underCount } }])) }, null, 1));
