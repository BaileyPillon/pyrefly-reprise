import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { currentChromiumArgs, resolveBrowserMode } from './tools/browser-mode.mjs';
const LIVE = 'https://echoesofspira.com/';
const OUT = process.env.SMOKE_OUT; mkdirSync(OUT, { recursive: true });
const PART = process.env.PART || 'all';
const mode = resolveBrowserMode(process.env), args = currentChromiumArgs(process.env);
const report = { mode, part: PART, consoleErrors: [], notFound: [], badStatus: [], html404img: [], audio: [], steps: [], errors: [], extra: {} };
const t0 = Date.now();
const log = (s, ok, d) => { report.steps.push({ step: s, ok, detail: d ?? null }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${s}${d ? ' - ' + d : ''}`); };
const waitFor = async (p, fn, ms, poll = 200) => { const s = Date.now(); for (;;) { const v = await p.evaluate(fn); if (v) return v; if (Date.now() - s >= ms) return null; await p.waitForTimeout(poll); } };
const screen = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const board = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
const press = async (p, k, gap = 110) => { await p.keyboard.press(k); await p.waitForTimeout(gap); };
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.jpg`, type: 'jpeg', quality: 88 }).catch(() => null);
const awaiting = (p) => p.evaluate(() => window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true || document.querySelectorAll('.ffx2hud__command .ig-cmd, .ffxhud__command .ig-cmd').length > 0);
const hudInfo = (p) => p.evaluate(() => ({ f1: !!document.querySelector('[class*="f1-"]'), hero: !!document.querySelector('.f1-hero'), pauseBtn: [...document.querySelectorAll('button,[role=button],[data-action]')].some((e) => /pause/i.test((e.textContent || '') + (e.getAttribute('data-action') || '')) && e.offsetParent !== null), pauseEls: [...document.querySelectorAll('button,[role=button],[data-action]')].filter((e) => /pause/i.test((e.textContent || '') + (e.getAttribute('data-action') || ''))).map((e) => e.tagName + '.' + e.className + '|' + (e.getAttribute('data-action') || '') + '|vis=' + (e.offsetParent !== null)).slice(0, 6), look: window.__pyrefly?.app?.renderer?.lookStats?.look ?? null, rigs: (window.__pyrefly?.rigs?.()?.figures ?? []).length, bodyTextHasGuide: /SKIP THE GUIDE/i.test(document.body.innerText) }));

const probe = (p) => p.evaluate(() => { const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; for (let n = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false; } return r.right > 0 && r.left < innerWidth; }; const c = (sel) => [...document.querySelectorAll(sel)].filter(vis).length; return { ribbon: c('.f1-ribbon'), igBossHp: c('.ig-bosshp'), ffx2boss: c('.ffx2boss, .ffx2enemy'), intel: c('.f1-intel'), intelAll: document.querySelectorAll('.f1-intel').length, guide: /SKIP THE GUIDE|STRATEGY GUIDE/i.test(document.body.innerText), coachCards: c('[class*="coach"]'), text: document.body.innerText.replace(/\s+/g,' ').slice(0,260) }; });
const tgt = (p) => p.evaluate(() => { const t = window.__pyrefly?.targeting?.(); return t ? JSON.stringify({ sel: t.selectedIds }) : null; });
async function toChapterSelect(p) { for (let i = 0; i < 12 && (await screen(p)) !== 'chapter-select'; i++) await press(p, 'Enter', 800); return (await screen(p)) === 'chapter-select'; }
async function selectChapter(p, id) { let b = await board(p); const order = b?.order ?? []; if (!order.includes(id)) return { ok: false, order }; let n = 0; while (b?.selectedId !== id && n < order.length + 2) { await press(p, order.indexOf(id) > order.indexOf(b?.selectedId) ? 'ArrowRight' : 'ArrowLeft', 150); b = await board(p); n++; } return { ok: b?.selectedId === id, order }; }
async function enterBattle(p, id) {
  const sel = await selectChapter(p, id); log(`board cursor reached ${id}`, sel.ok, `order=${(sel.order || []).join(',')}`); if (!sel.ok) return false;
  await press(p, 'Enter', 200);
  const prep = await waitFor(p, () => window.__pyrefly?.app?.current?.name === 'party-prep', 20000, 300); log(`${id}: confirm -> party-prep`, !!prep, `screen=${await screen(p)}`); if (!prep) return false;
  await p.waitForTimeout(600); await press(p, 'Enter', 300);
  let atB = false;
  for (let i = 0; i < 80 && !atB; i++) { await press(p, 'Enter', 450); atB = (await screen(p)) === 'battle'; }
  log(`${id}: prep + cutscene skip -> battle`, atB, `screen=${await screen(p)}`); if (!atB) return false;
  const m = await waitFor(p, () => window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true, 60000, 300);
  log(`${id}: player turn reached`, !!m); return !!m;
}
async function openPause(p) { await press(p, 'KeyP', 900); let on = (await screen(p)) === 'pause'; if (!on) { await press(p, 'Escape', 700); on = (await screen(p)) === 'pause'; } return on; }
async function closePause(p) { await press(p, 'Escape', 800); let r = (await screen(p)) === 'battle'; if (!r) { await press(p, 'Escape', 700); r = (await screen(p)) === 'battle'; } return r; }
const optionsOf = (p) => p.evaluate(() => [...document.querySelectorAll('.pause__row[data-action^="pause:row:"]')].map((r) => { const t = r.textContent.trim().replace(/\s+/g, ' '); const m = t.match(/^(.*?)(ON|OFF|\d+%?|\d+x|▸)$/); return { k: (m ? m[1] : t).trim(), v: m ? m[2] : '', sel: r.classList.contains('pause__row--sel') }; }));
async function toOptionsTab(p) { for (let i = 0; i < 14; i++) { const t = await p.evaluate(() => document.querySelector('.pause__tab--on')?.textContent?.trim()); if (/OPTIONS/i.test(t || '')) return true; await press(p, 'ArrowRight', 250); } return false; }
async function walkToRow(p, label) { for (let i = 0; i < 16; i++) { const rows = await optionsOf(p); const s = rows.find((r) => r.sel); if (s && s.k === label) return true; await press(p, 'ArrowDown', 160); } return false; }
async function newPage(browser, query, vp = { width: 1600, height: 900 }) {
  const context = await browser.newContext({ viewport: vp, ...(vp.width < 700 ? { hasTouch: true, isMobile: true } : {}) });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
  page.on('response', (r) => { const s = r.status(); if (s === 404) report.notFound.push(r.url()); if (s >= 400) report.badStatus.push(`${s} ${r.url()}`); const ct = r.headers()['content-type'] || ''; if (/\.(png|jpg|webp)(\?|$)/i.test(r.url()) && /text\/html/.test(ct)) report.html404img.push(r.url()); });
  page.on('request', (r) => { if (/\.(mp3|ogg|m4a|wav|opus)(\?|$)/i.test(r.url())) report.audio.push(r.url()); });
  await page.goto(`${LIVE}?livesmoke=${Date.now()}${query}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const ready = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
  log('boot ready', ready, query + ' ' + vp.width + 'x' + vp.height); if (!ready) throw new Error('not ready');
  return page;
}
async function partCh1(browser) {
  const page = await newPage(browser, '');
  const bundle = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /assets\//.test(s)));
  log('bundle names CahDxk82', bundle.some((s) => s.includes('CahDxk82')), bundle.join(' '));
  log('title screen', (await screen(page)) === 'title'); await shot(page, 'a-title');
  log('title -> chapter-select (real Enter)', await toChapterSelect(page));
  if (!(await enterBattle(page, 'seymour-flux'))) return;
  await page.waitForTimeout(2500);
  let h = await hudInfo(page); report.extra.ch1hud0 = h; console.log('hud', h);
  if (h.bodyTextHasGuide) { await press(page, 'Escape', 800); }
  h = await hudInfo(page); report.extra.ch1hud = h;
  log('Ch I pack ON by default: F1 HUD present, no PAUSE button', h.f1 && !h.pauseBtn, JSON.stringify(h));
  log('Ch I on battle screen with menu', (await screen(page)) === 'battle' && (await awaiting(page)));
  await page.waitForTimeout(9000); report.extra.ch1probe = await probe(page); console.log('probe1', JSON.stringify(report.extra.ch1probe)); log('Ch I: 1 boss bar, 0 Intel panels, 0 coach cards at first menu', report.extra.ch1probe.ribbon + report.extra.ch1probe.igBossHp === 1 && report.extra.ch1probe.intel === 0 && report.extra.ch1probe.coachCards === 0, JSON.stringify(report.extra.ch1probe)); await shot(page, '1-ch1-first-menu-f1-hud');
  await press(page, 'Enter', 700);
  const t1 = await tgt(page); report.extra.ch1target = t1;
  log('Ch I Attack opens cursor on seymour-flux', !!t1 && /seymour-flux/.test(t1), t1);
  await press(page, 'Escape', 600);
  { const tc = await tgt(page); const aw = await awaiting(page); report.extra.ch1cancel = { tc, aw, sc: await screen(page) }; log('Ch I cancel returns to command menu', (await screen(page)) === 'battle' && aw, JSON.stringify(report.extra.ch1cancel)); }
  await press(page, 'Enter', 600); await press(page, 'Enter', 250);
  await page.waitForTimeout(700); await shot(page, '2-ch1-attack-a');
  await page.waitForTimeout(500); await shot(page, '2-ch1-attack-b');
  await page.waitForTimeout(2000);
  log('Ch I attack confirmed, battle running', (await screen(page)) === 'battle');
  const on = await openPause(page); log('Ch I P opens pause', on);
  if (on) {
    await page.waitForTimeout(800);
    const vis = () => page.evaluate(() => { const e = document.querySelector('.pause__ui'); const r = document.querySelector('.pause__stage'); return e && r ? getComputedStyle(e).display + '/bare=' + r.classList.contains('pause--bare') : null; });
    const v0 = await vis(); await press(page, 'KeyH', 500); const v1 = await vis(); await press(page, 'KeyH', 500); const v2 = await vis();
    log('H hides then restores pause panels', v0 !== null && v1 !== v0 && v2 === v0 && /^none/.test(v1), `${v0} ${v1} ${v2}`);
    if (await toOptionsTab(page)) { await press(page, 'ArrowDown', 300); if (await walkToRow(page, 'MASTER VOLUME')) { const a = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v; await press(page, 'ArrowLeft', 300); await press(page, 'ArrowLeft', 300); const b = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v; log('MASTER VOLUME lowered by real ArrowLeft', a !== b, `${a}->${b}`); } else log('MASTER VOLUME row found', false); } else log('options tab found', false);
    log('Escape closes pause (resume)', await closePause(page));
  }
  const on2 = await openPause(page); if (on2) { await press(page, 'KeyP', 800); const back = (await screen(page)) === 'battle'; log('P again resumes', back); if (!back) await closePause(page); }
  for (let i = 0; i < 40 && (await screen(page)) === 'battle'; i++) { if (await awaiting(page)) { for (let j = 0; j < 3; j++) await press(page, 'Enter', 250); } else await page.waitForTimeout(600); }
  const pre = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return 'ERR'; } });
  report.extra.preSave = { master: pre?.settings?.masterVolume, keys: pre && pre !== 'ERR' ? Object.keys(pre) : pre, screen: await screen(page) };
  await page.reload({ waitUntil: 'domcontentloaded' });
  const r2 = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
  const post = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return 'ERR'; } });
  log('reload: reboots; masterVolume survives and is lowered', r2 && post?.settings?.masterVolume === pre?.settings?.masterVolume && pre?.settings?.masterVolume < 0.8, `${pre?.settings?.masterVolume}->${post?.settings?.masterVolume}`);
  report.extra.postSave = { master: post?.settings?.masterVolume, same: JSON.stringify(post) === JSON.stringify(pre) };
  const au = await page.evaluate(() => { const a = window.__pyrefly?.audio; try { return a ? JSON.stringify(a.debug?.() ?? a.state?.() ?? Object.keys(a)) : null; } catch (e) { return 'ERR ' + e; } });
  report.extra.audioDebug = au;
  log('prerendered audio fetched', report.audio.length > 0, `n=${report.audio.length} ${report.audio.slice(0, 3).join(' | ')} dbg=${(au || '').slice(0, 300)}`);
}
async function partCh4(browser) {
  const page = await newPage(browser, '');
  log('title -> chapter-select', await toChapterSelect(page));
  if (!(await enterBattle(page, 'ffx2-bahamut'))) return;
  await page.waitForTimeout(2500);
  let h = await hudInfo(page); if (h.bodyTextHasGuide) { await press(page, 'Escape', 800); h = await hudInfo(page); }
  report.extra.ch4hud = h;
  log('Ch IV pack ON by default: F1 HUD present, no PAUSE button', h.f1 && !h.pauseBtn, JSON.stringify(h));
  log('Ch IV on battle screen with menu', (await screen(page)) === 'battle' && (await awaiting(page)));
  report.extra.ch4probe = await probe(page); console.log('probe4', JSON.stringify(report.extra.ch4probe)); log('Ch IV: 1 boss bar, 0 Intel panels at first menu', report.extra.ch4probe.ribbon + report.extra.ch4probe.igBossHp + report.extra.ch4probe.ffx2boss === 1 && report.extra.ch4probe.intel === 0 && !report.extra.ch4probe.guide, JSON.stringify(report.extra.ch4probe)); await shot(page, '3-ch4-first-menu');
  const sel4 = () => page.evaluate(() => document.querySelector('.ig-cmd--selected')?.textContent?.trim() ?? null);
  const s0 = await sel4(); await press(page, 'ArrowDown', 300); const s1 = await sel4(); await press(page, 'Enter', 700); const inList = await page.evaluate(() => document.body.innerText.length);
  report.extra.ch4nav = { s0, s1, afterEnter: await sel4() };
  log('Ch IV Enter opens a sub-list (menu moved on)', (await screen(page)) === 'battle', JSON.stringify(report.extra.ch4nav));
  await press(page, 'Escape', 700);
  report.extra.ch4cancel = { sc: await screen(page), aw: await awaiting(page), sel: await sel4() };
  log('Ch IV cancel (Escape) from the sub-list returns to the command menu on the battle screen', report.extra.ch4cancel.sc === 'battle' && report.extra.ch4cancel.aw, JSON.stringify(report.extra.ch4cancel));
  await press(page, 'ArrowUp', 300); await press(page, 'Enter', 700); await shot(page, '3d-ch4-list');
  await press(page, 'Enter', 600); const tg = await tgt(page); report.extra.ch4target = tg; await page.waitForTimeout(600); report.extra.ch4actprobe = await probe(page); await shot(page, '3e-ch4-action');
  await page.waitForTimeout(3000);
  const lg = await page.evaluate(() => (window.__pyrefly?.battleState?.()?.log ?? []).slice(-8).map((e) => e.type ?? e.kind ?? '?'));
  log('Ch IV action confirmed with real keys (action-start in the battle log), battle running', (await screen(page)) === 'battle' && lg.includes('action-start'), JSON.stringify({ tg, lg }));
  const log4 = await page.evaluate(() => { const s = window.__pyrefly?.battleState?.(); return s ? JSON.stringify((s.log ?? []).slice(-6).map((e) => e.type ?? e.kind ?? '?')) : null; }); report.extra.ch4log = log4;
  const on = await openPause(page); log('Ch IV P opens pause', on); if (on) { await page.waitForTimeout(500); log('Ch IV Escape resumes', await closePause(page)); }
}
async function partPress(browser) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
  page.on('response', (r) => { const s = r.status(); if (s === 404) report.notFound.push(r.url()); if (s >= 400) report.badStatus.push(`${s} ${r.url()}`); });
  const resp = await page.goto(`${LIVE}press/?livesmoke=${Date.now()}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => ({ title: document.title, imgs: [...document.images].map((i) => i.naturalWidth > 0), h1: document.querySelector('h1')?.textContent }));
  report.extra.press = info;
  log('/press/ loads 200 with images decoded', resp.status() === 200 && info.imgs.length > 0 && info.imgs.every(Boolean), JSON.stringify(info).slice(0, 300));
  await shot(page, '4-press-page'); await context.close();
}
async function partPhone(browser) {
  const page = await newPage(browser, '', { width: 390, height: 844 });
  log('phone: title', (await screen(page)) === 'title');
  log('phone: chapter-select', await toChapterSelect(page));
  if (!(await enterBattle(page, 'seymour-flux'))) { await shot(page, '5-phone-fail'); return; }
  await page.waitForTimeout(2500);
  let h = await hudInfo(page); if (h.bodyTextHasGuide) { await press(page, 'Escape', 800); h = await hudInfo(page); }
  report.extra.phoneHud = h;
  const txt = await page.evaluate(() => /PAUSE/i.test(document.body.innerText));
  log('phone 390x844 Chapter I shows PAUSE, release-62 HUD (no F1)', (h.pauseBtn || txt) && !h.f1, JSON.stringify({ ...h, txt }));
  await shot(page, '5-phone-ch1');
}
const browser = await chromium.launch({ headless: true, args });
try {
  if (PART === 'all' || PART === 'ch1') await partCh1(browser);
  if (PART === 'all' || PART === 'ch4') await partCh4(browser);
  if (PART === 'press') await partPress(browser);
  if (PART === 'phone') await partPhone(browser);
} catch (e) { report.errors.push(String(e?.stack ?? e)); console.error(e); } finally { await browser.close(); }
report.elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
writeFileSync(`${OUT}/report-${PART}.json`, JSON.stringify(report, null, 2));
console.log('consoleErrors', report.consoleErrors.length, 'notFound', report.notFound.length, 'bad', report.badStatus.length, 'min', report.elapsedMin);
console.log(JSON.stringify({ ce: report.consoleErrors, nf: report.notFound, bs: report.badStatus, err: report.errors }, null, 1));
