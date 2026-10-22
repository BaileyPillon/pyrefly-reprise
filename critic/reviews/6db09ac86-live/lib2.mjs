export const fxRead = (page) => page.evaluate(() => { const s = window.__pyrefly.snapshotState()?.screenState; return { phase: s?.playback?.phase, awaiting: s?.playback?.awaitingMenu, fl: s?.spellFx?.flights, running: s?.spellFx?.running, quads: s?.spellFx?.quads }; });
export const targetIds = (page) => page.evaluate(() => [...document.querySelectorAll('[data-target-id]')].map(e => ({ id: e.dataset.targetId, dim: e.classList.contains('ffx-target--dim') })));
export const selected = (page) => page.evaluate(() => window.__pyrefly.targeting?.()?.selection ?? null);
export const actorNow = (page) => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.playback?.phase ?? '').replace(/^command:/, ''));
// open Items, Enter on row (first press opens submenu rows, second selects), until a target cursor is up
export async function openItem(b, labelRe) {
  const { page, input, chooser } = b;
  await chooser.choose((l) => /^items?$/i.test(l));
  await page.waitForTimeout(700);
  const hit = await chooser.highlight((l) => labelRe.test(l));
  if (!hit) throw new Error('item row not found ' + labelRe);
  await input.press('Enter'); await page.waitForTimeout(900);
  let t = await selected(page);
  for (let i = 0; i < 3 && !t; i++) { await input.press('Enter'); await page.waitForTimeout(900); t = await selected(page); }
  if (!t) throw new Error('no target cursor after item select');
  return t;
}
export async function steerTo(b, id) {
  const { page, input } = b;
  let cur = (await selected(page))?.ids?.[0];
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight']) {
    for (let k = 0; k < 6 && cur !== id; k++) { await input.press(key); await page.waitForTimeout(250); cur = (await selected(page))?.ids?.[0]; }
    if (cur === id) break;
  }
  return cur;
}
