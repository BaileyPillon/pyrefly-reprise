// LIVE smoke 3 (1600x900): the 'daigoro' (Tourist Trap) and 'fayth' openings draw a painted backdrop, not black.
import sharp from 'sharp';
import { launch, toBoard, readState, shot, sleep, note, finish, assertScreen, SHOTS, ROOT } from './h.mjs';

const ONLY = process.env.ONLY; // optional: 'daigoro' | 'fayth'
const CASES = [
  { word: 'daigoro', chapter: 'ffx2-tourist-trap', game: 'ffx2', plate: 'ffx2-tourist-trap-cavern', focused: { prep: 33.7, intro: 76.7 } },
  { word: 'fayth', chapter: 'exp-fayth', game: null, plate: 'exp-fayth-deck', focused: { prep: 34.1, intro: 111.1 } },
].filter((c) => !ONLY || c.word === ONLY);

/** mean luminance 0-255 and the share of pixels that are near black (max channel < 14) */
async function stats(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let dark = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (Math.max(r, g, b) < 14) dark++;
  }
  return { lum: Math.round((sum / n) * 10) / 10, darkShare: Math.round((dark / n) * 1000) / 10 };
}

const all = [];
for (const c of CASES) {
  const TAG = `s3-${c.word}`;
  const { browser, page, rec } = await launch(TAG, { width: 1600, height: 900 });
  rec.checks = {};
  const ok = (k, v, detail) => { rec.checks[k] = { ok: !!v, detail: detail ?? null }; note(rec, v ? 'CHECK-OK  ' : 'CHECK-FAIL', k, detail ?? ''); return !!v; };
  const setStage = (n) => { rec.stage = n; stage = n; };
  let stage = 'start';
  try {
    setStage('board');
    await toBoard(page, rec);
    await sleep(1000);
    setStage('door');
    rec.doorAttempts = [];
    let opened = false;
    for (let attempt = 1; attempt <= 3 && !opened; attempt++) {
      for (const ch of c.word) { await page.keyboard.press(ch); await sleep(130); }
      const t0 = Date.now();
      let s = null;
      while (Date.now() - t0 < 12000) { s = await page.evaluate(() => window.__pyrefly.screen()); if (s === 'party-prep') break; await sleep(250); }
      const st = await readState(page);
      rec.doorAttempts.push({ attempt, screen: st.screen, chapter: st.chapter, waitedMs: Date.now() - t0 });
      note(rec, 'door attempt', attempt, st.screen, st.chapter);
      opened = st.screen === 'party-prep' && st.chapter === c.chapter;
      if (!opened) { await sleep(2500); } // the door's own gap limit has long passed: a fresh word
    }
    ok(`typing '${c.word}' opens party prep for ${c.chapter} (first attempt)`, rec.doorAttempts[0]?.screen === 'party-prep' && rec.doorAttempts[0]?.chapter === c.chapter, JSON.stringify(rec.doorAttempts[0]));
    ok(`'${c.word}' opened at all within 3 attempts`, opened, JSON.stringify(rec.doorAttempts));
    if (!opened) throw new Error('door did not open');
    await sleep(1200);
    const e1 = await shot(page, rec, '01-prep', { screen: 'party-prep', chapter: c.chapter });
    rec.prep = await stats(`${ROOT}/${e1.file}`);
    setStage('opening');
    let g = 0;
    while ((await page.evaluate(() => window.__pyrefly.screen())) === 'party-prep' && g++ < 20) { await page.keyboard.press('Enter'); await sleep(900); }
    await assertScreen(page, 'cutscene', 25000);
    await sleep(2200);
    const e2 = await shot(page, rec, '02-opening-1', { screen: 'cutscene' });
    rec.intro1 = await stats(`${ROOT}/${e2.file}`);
    const plateInfo = await page.evaluate(async (plate) => {
      const rs = performance.getEntriesByType('resource').filter((e) => e.name.includes(plate)).map((e) => ({ n: e.name.split('/').slice(-2).join('/'), status: e.responseStatus, bytes: e.encodedBodySize, transfer: e.transferSize }));
      const imgs = [...document.querySelectorAll('img, canvas')].map((e) => ({ tag: e.tagName, src: (e.currentSrc || '').split('/').slice(-1)[0], w: e.naturalWidth ?? e.width, h: e.naturalHeight ?? e.height })).filter((x) => x.w > 300);
      const bgs = [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b && b !== 'none' && b.includes('url(')).map((b) => b.replace(/^.*\/([^/]+)\"?\)$/, '$1')).slice(0, 8);
      return { resources: rs, bigImgs: imgs.slice(0, 6), bgs };
    }, c.plate);
    rec.plateInfo = plateInfo;
    const plateReq = rec.art.filter((a) => a.url.includes(c.plate));
    rec.plateReq = plateReq;
    ok(`the ${c.plate} plate was requested and answered 200 as an image`, plateReq.some((a) => a.status === 200 && /image\//.test(a.ct) && Number(a.len ?? 0) > 100000), JSON.stringify(plateReq));
    ok('the opening is not black: mean luminance well above black and most pixels are not near-black', rec.intro1.lum >= 25 && rec.intro1.darkShare < 50, JSON.stringify({ intro1: rec.intro1, focusedBuild: c.focused.intro }));
    await page.keyboard.press('Enter');
    await sleep(1800);
    const sNow = await page.evaluate(() => window.__pyrefly.screen());
    if (sNow === 'cutscene') {
      const e3 = await shot(page, rec, '03-opening-2', { screen: 'cutscene' });
      rec.intro2 = await stats(`${ROOT}/${e3.file}`);
      ok('the next line of the opening also shows the painting (not black)', rec.intro2.lum >= 25 && rec.intro2.darkShare < 50, JSON.stringify(rec.intro2));
    } else note(rec, 'second line: screen is now', sNow);
    setStage('done');
  } catch (e) {
    note(rec, 'RUN-ABORTED at stage', stage, String(e).slice(0, 600));
    rec.aborted = { stage, err: String(e).slice(0, 600) };
    try { await page.screenshot({ path: `${SHOTS}/${TAG}-abort-${stage}.png` }); } catch { /* none */ }
  }
  finish(rec);
  all.push({ tag: TAG, checks: rec.checks, aborted: rec.aborted ?? null, shotFails: rec.fails, prep: rec.prep, intro1: rec.intro1, intro2: rec.intro2, doorAttempts: rec.doorAttempts, consoleErrors: rec.consoleErrors, pageErrors: rec.pageErrors, notFound: rec.notFound, htmlMedia: rec.htmlMedia, failed: rec.failed, plateInfo: rec.plateInfo, plateReq: rec.plateReq });
  await browser.close();
}
console.log(JSON.stringify(all, null, 1));
