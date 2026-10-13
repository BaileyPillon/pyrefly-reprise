// Why was the scene cue late at the first line? For one fast-route run of a chapter on the live build 7b2582e7, log every network response that finished between the card
// confirm and the first spoken line (CDP Network events: url, encoded bytes, when it finished), grouped by kind. Fresh headless Chromium (PYREFLY_BROWSER=gpu), 1600x900, real keys.
//   CHAPTER=seymour-flux node critic/reviews/7b2582e7-live-music-diag.mjs
import fs from 'node:fs';

import { assertScreen, MODE, open, waitFor } from '../runner/lib/lib.mjs';

const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const ID = process.env.CHAPTER || 'seymour-flux';
const RESULT = process.env.DIAG_JSON || `D:/Tools/pyrefly-scratch/live-music-diag-${ID}.json`;
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const selId = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
const { page } = c;
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
const reqs = new Map();
cdp.on('Network.requestWillBeSent', (e) => reqs.set(e.requestId, { url: e.request.url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), t: Date.now(), type: e.type }));
cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.protocol = e.response.protocol; r.fromCache = e.response.fromDiskCache === true; } });
cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) { r.done = Date.now(); r.bytes = e.encodedDataLength; } });
cdp.on('Network.loadingFailed', (e) => { const r = reqs.get(e.requestId); if (r) { r.done = Date.now(); r.failed = e.errorText; } });
const R = { review: 'live-music-diag', sha: '7b2582e7', browserMode: MODE, chapter: ID, startedAt: new Date().toISOString() };
try {
  await assertScreen(page, 'title', 60000);
  await page.waitForTimeout(900);
  const tUnlock = Date.now();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) { await page.waitForTimeout(500); if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter'); }
  await assertScreen(page, 'chapter-select', 15000);
  await page.waitForTimeout(600);
  for (const [key, n] of [['ArrowRight', 60], ['ArrowLeft', 80]]) { let hit = false; for (let i = 0; i <= n; i++) { if ((await selId(page)) === ID) { hit = true; break; } await page.keyboard.press(key); await page.waitForTimeout(150); } if (hit) break; }
  const t0 = Date.now();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
  await assertScreen(page, 'party-prep', 20000);
  await page.keyboard.press('Enter');
  await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && (await page.evaluate(() => { const t = document.querySelector('.dbox.dbox--visible .dbox__text'); return !!t && t.textContent.trim().length > 0; })), { ms: 60000, pollMs: 30 });
  const tLine = Date.now();
  const playing = await page.evaluate(() => window.__pyrefly.audioDebug().playing);
  const kind = (u) => (/\/audio\/music\//.test(u) ? 'music' : /\/audio\//.test(u) ? 'sfx-sprite' : /\/art\//.test(u) ? 'art' : /\/fonts\//.test(u) ? 'font' : /assets\//.test(u) ? 'code' : 'other');
  const all = [...reqs.values()].filter((r) => r.t >= tUnlock);
  const rel = (r) => ({ kind: kind(r.url), url: r.url, status: r.status, protocol: r.protocol, startedMs: r.t - t0, doneMs: r.done ? r.done - t0 : null, bytes: r.bytes ?? null, failed: r.failed ?? undefined });
  const inWindow = all.filter((r) => r.t <= tLine).map(rel);
  const sum = (arr) => arr.reduce((n, r) => n + (r.bytes || 0), 0);
  const group = (k) => ({ requests: inWindow.filter((r) => r.kind === k).length, finishedBeforeFirstLine: inWindow.filter((r) => r.kind === k && r.doneMs !== null && r.doneMs <= tLine - t0).length, megabytesFinished: Math.round((sum(inWindow.filter((r) => r.kind === k && r.doneMs !== null && r.doneMs <= tLine - t0)) / 1048576) * 10) / 10 });
  R.timeline = { msUnlockToConfirm: t0 - tUnlock, msConfirmToFirstLine: tLine - t0, playingAtFirstLine: playing };
  R.byKind = Object.fromEntries(['music', 'sfx-sprite', 'art', 'font', 'code', 'other'].map((k) => [k, group(k)]));
  R.musicAndSprites = inWindow.filter((r) => r.kind === 'music' || r.kind === 'sfx-sprite');
  R.largestArt = inWindow.filter((r) => r.kind === 'art').sort((a, b) => (b.bytes || 0) - (a.bytes || 0)).slice(0, 8);
  R.megabytesFinishedAfterUnlockBeforeFirstLine = Math.round((sum(all.filter((r) => r.done && r.done <= tLine).map(rel)) / 1048576) * 10) / 10;
  R.status = 'ran';
} catch (e) {
  R.status = 'error';
  R.error = String(e && e.message ? e.message : e).slice(0, 300);
} finally {
  fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
  await c.browser.close();
}
console.log(JSON.stringify({ status: R.status, error: R.error, timeline: R.timeline, byKind: R.byKind, megabytesFinishedAfterUnlockBeforeFirstLine: R.megabytesFinishedAfterUnlockBeforeFirstLine, music: R.musicAndSprites?.map((m) => `${m.url} ${m.startedMs}->${m.doneMs} ${m.bytes ? (m.bytes / 1048576).toFixed(1) + 'MB' : ''} ${m.protocol ?? ''}`) }, null, 1));
