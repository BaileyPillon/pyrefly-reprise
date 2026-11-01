import { withLock, openPage, sleep, ss, scr, waitFor } from './lib.mjs';
await withLock('r62 focused review board probe', async () => {
  const h = await openPage({ url: 'http://127.0.0.1:5871/' });
  const { page } = h;
  await waitFor('title', async () => (await scr(page)) === 'title', 60000); await sleep(1500);
  await page.keyboard.press('Enter');
  await waitFor('cs', async () => (await scr(page)) === 'chapter-select', 30000); await sleep(1800);
  const s = await ss(page); console.log(JSON.stringify({ order: s.order, sel: s.selectedId, keys: Object.keys(s) }));
  const seq = [];
  for (const k of ['ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowRight']) { await page.keyboard.press(k); await sleep(260); seq.push((await ss(page)).selectedId); }
  console.log(seq.join(' '));
  await h.browser.close();
}, 5);
