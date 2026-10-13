// The browser proof, part 2: every function of the stacked prep page works by real touch and by keys.
//   PYREFLY_BROWSER=gpu PREP_BASE=http://127.0.0.1:5843/ node proof-input.mjs --w=390 --h=844 --tag=input
// Touch: Playwright's touchscreen.tap and CDP touch drags that end at rest. Keys: the player's keys (page.keyboard).
import fs from 'node:fs';
import { launch, openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';
import { tapSel, drag, settle, scrollInfo, scrollTo, hit, stripY } from './touch.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const W = Number(args.w ?? 390);
const H = Number(args.h ?? 844);
const TAG = String(args.tag ?? 'input');
const ONLY = args.only ? String(args.only).split(',') : ['FFX', 'FFX-2'];
const OUT = join(OUT_ROOT, 'proof', `${TAG}-${W}x${H}`);
mkdir(OUT);

const results = [];
const check = (game, name, ok, detail = '') => {
  results.push({ game, name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${game.padEnd(6)} ${name}${detail ? '  ' + detail : ''}`);
};
const sleep = (page, ms) => page.waitForTimeout(ms);

async function goTab(page, scr, id) {
  const sel = `.prep__tab[data-action="prep:tab:${id}"]`;
  for (let i = 0; i < 5; i++) {
    const h = await hit(page, sel);
    if (h.found && h.box.x >= 4 && h.box.x + h.box.w <= W - 24) break;
    const left = h.found && h.box.x < 4;
    const y = await stripY(page);
    await drag(page, left ? 60 : W - 60, y, left ? Math.min(W - 60, 260) : Math.max(60, W - 260), y);
    await sleep(page, 450);
  }
  await tapSel(page, sel, 0, { wait: 900, partial: true });
  await dismissCards(page, scr);
  await sleep(page, 400);
}

const tabNow = (page) => page.evaluate(() => document.querySelector('.prep').dataset.tab);
const who = (page) => page.evaluate(() => document.querySelector('.prep__panel:not([hidden]) .prph-who em')?.textContent ?? null);
const selMember = (page) =>
  page.evaluate(() => {
    const ms = [...document.querySelectorAll('.prep__member')];
    const i = ms.findIndex((m) => m.classList.contains('prep__member--sel'));
    return { i, name: ms[i]?.querySelector('.prep__member-name')?.textContent ?? null, n: ms.length };
  });
const secState = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('.prep__panel:not([hidden]) .prph-sec')].map((s) => {
        const body = s.querySelector('.prph-sec__b');
        const dg = s.querySelector('.prph-dg');
        return [s.dataset.fold, { open: s.classList.contains('is-open'), aria: s.querySelector('[data-fold-head]').getAttribute('aria-expanded'), bodyShown: body.offsetHeight > 0, digestShown: !!dg && dg.offsetHeight > 0, digest: dg?.textContent ?? null }];
      }),
    ),
  );

async function foldFlow(game, page, key, label) {
  const sel = `.prep__panel:not([hidden]) .prph-sec[data-fold="${key}"] [data-fold-head]`;
  const before = (await secState(page))[key];
  await tapSel(page, sel, 0, { wait: 300 });
  const mid = (await secState(page))[key];
  check(game, `${label}: one tap on the header ${before.open ? 'folds' : 'opens'} the section`, mid.open === !before.open && mid.aria === String(mid.open) && mid.bodyShown === mid.open && mid.digestShown === !mid.open, `open ${before.open} -> ${mid.open}, aria=${mid.aria}, body shown=${mid.bodyShown}, digest shown=${mid.digestShown}`);
  await tapSel(page, sel, 0, { wait: 300 });
  const end = (await secState(page))[key];
  check(game, `${label}: a second tap puts it back`, end.open === before.open && end.aria === String(before.open), `open ${mid.open} -> ${end.open}`);
  return { before, mid };
}

/** The numbers the hidden desktop board holds for the member now selected, by label, against what the phone page prints. */
const numbersPhoneVsBoard = (page, game) =>
  page.evaluate((game) => {
    const phone = {};
    for (const r of document.querySelectorAll('.prep__panel:not([hidden]) .prph-sec:not([data-fold^="s:"]) .prph-row')) {
      phone[r.querySelector('.prph-l').textContent.trim().toUpperCase()] = r.querySelector('.prph-n').textContent.trim();
    }
    const board = {};
    const rows = game === 'FFX' ? document.querySelectorAll('.ffxprep-stat') : document.querySelectorAll('.x2prep-stat');
    for (const r of rows) {
      const k = r.querySelector(game === 'FFX' ? '.ffxprep-stat__k' : '.x2prep-stat__k').textContent.trim().toUpperCase();
      board[k] = r.querySelector(game === 'FFX' ? '.ffxprep-stat__v' : '.x2prep-stat__v').textContent.trim();
    }
    return { phone, board };
  }, game);

async function flow(game, id) {
  const { ctx, page, scr } = await openPrep(browser, { id, width: W, height: H, touch: true, dpr: 1 });
  const members = await page.evaluate(() => [...document.querySelectorAll('.prep__member')].map((m) => m.querySelector('.prep__member-name')?.textContent ?? ''));
  console.log(`--- ${game} (${id}) ${W}x${H}, party: ${members.join(', ')}`);

  // ---- tabs by touch
  const tabs = game === 'FFX' ? ['stats', 'equipment', 'items', 'overdrive'] : ['dresspheres', 'stats', 'accessories', 'items'];
  for (const t of tabs) {
    await goTab(page, scr, t);
    const st = await page.evaluate(() => ({ tab: document.querySelector('.prep').dataset.tab, phone: document.querySelector('.prep').dataset.phone, hosts: document.querySelectorAll('.prep__panel:not([hidden]) > .prph').length }));
    check(game, `tab ${t}: a tap opens it, with its phone page`, st.tab === t && st.phone === 'page' && st.hosts === 1, JSON.stringify(st));
  }

  // ---- faces by touch (every member), and the numbers against the hidden board
  const statsTab = game === 'FFX' ? 'stats' : 'stats';
  await goTab(page, scr, statsTab);
  if (game === 'FFX') {
    // Open DEFENSE first: it must stay open as the faces change.
    await tapSel(page, '.prep__panel:not([hidden]) .prph-sec[data-fold="defense"] [data-fold-head]', 0, { wait: 300 });
  } else {
    await tapSel(page, '.prep__panel:not([hidden]) .prph-sec[data-fold="s:gunner"] [data-fold-head]', 0, { wait: 300 });
  }
  const keep = game === 'FFX' ? 'defense' : 's:gunner';
  let allFaces = true;
  let detail = [];
  let numbersOk = true;
  const seenNames = [];
  for (let i = 0; i < members.length; i++) {
    await tapSel(page, '.prep__member', i, { wait: 450 });
    const sm = await selMember(page);
    const w = await who(page);
    const sec = (await secState(page))[keep];
    const nums = await numbersPhoneVsBoard(page, game);
    const keys = Object.keys(nums.board);
    const same = keys.length >= 10 && keys.every((k) => nums.phone[k] === nums.board[k]);
    if (!same) numbersOk = false;
    seenNames.push(w);
    if (!(sm.i === i && w === members[i] && sec?.open === true)) allFaces = false;
    detail.push(`${i}:${w}${same ? '' : '!'}`);
  }
  check(game, `faces: a tap on each of the ${members.length} selects that member, the page names her, and the section left open stays open`, allFaces, detail.join(' '));
  check(game, 'faces: every number on the phone page equals the one on the board for each member', numbersOk, `labels ${game === 'FFX' ? 'ten stats' : 'ten stats'}`);
  // Back to the first face.
  await tapSel(page, '.prep__member', 0, { wait: 450 });
  // fold the extra section back
  await tapSel(page, `.prep__panel:not([hidden]) .prph-sec[data-fold="${keep}"] [data-fold-head]`, 0, { wait: 300 });

  // ---- folds by touch
  if (game === 'FFX') {
    await foldFlow(game, page, 'defense', 'Stats DEFENSE (folded)');
    await foldFlow(game, page, 'pool', 'Stats HP · MP (open)');
    // A tap on the body of an open section does nothing.
    const bodySel = '.prep__panel:not([hidden]) .prph-sec[data-fold="pool"] .prph-sec__b';
    await tapSel(page, bodySel, 0, { wait: 250 });
    check(game, 'Stats: a tap on the ivory body of an open section leaves it open', (await secState(page)).pool.open === true);
  } else {
    await foldFlow(game, page, 's:gunner', 'Stats GUNNER (folded)');
    await foldFlow(game, page, 'worn', 'Stats WORN (open)');
    await goTab(page, scr, 'dresspheres');
    await foldFlow(game, page, 'grid', 'Dresspheres GARMENT GRID (folded)');
    await foldFlow(game, page, 'owned', 'Dresspheres ALSO OWNED (folded)');
    await foldFlow(game, page, 'learned', 'Dresspheres LEARNED (open)');
    await goTab(page, scr, 'accessories');
    await foldFlow(game, page, 'slot1', 'Accessories SLOT 1 (open)');
  }

  // ---- the tab strip by swipe
  await goTab(page, scr, game === 'FFX' ? 'stats' : 'stats');
  const stripBefore = await page.evaluate(() => { const s = document.querySelector('.prep__tabs'); return { sl: s.scrollLeft, sw: s.scrollWidth, cw: s.clientWidth }; });
  const sy = await stripY(page);
  await drag(page, W - 50, sy, 50, sy);
  await sleep(page, 500);
  const stripAfter = await page.evaluate(() => document.querySelector('.prep__tabs').scrollLeft);
  check(game, 'tab strip: a touch swipe along it scrolls the tabs sideways', stripAfter > stripBefore.sl + 50, `scrollLeft ${stripBefore.sl} -> ${stripAfter} (width ${stripBefore.sw} in ${stripBefore.cw})`);
  const lastTab = game === 'FFX' ? 'overdrive' : 'items';
  await goTab(page, scr, lastTab);
  check(game, `tab strip: the last tab (${lastTab}) is reachable by touch after the swipe`, (await tabNow(page)) === lastTab);

  // ---- FFX Overdrive: the one control
  if (game === 'FFX') {
    const mi = await page.evaluate(() => {
      // The member with two modes or more: read from the board's own rows (hidden but live).
      return [...document.querySelectorAll('.prep__member')].map((_, i) => i);
    });
    let tried = null;
    for (const i of mi) {
      await tapSel(page, '.prep__member', i, { wait: 400 });
      const rows = await page.evaluate(() => [...document.querySelectorAll('.prep__panel:not([hidden]) .prph-mode')].map((r) => ({ mode: r.dataset.mode, sel: r.classList.contains('is-sel') })));
      if (rows.length >= 2) {
        tried = { i, rows };
        break;
      }
    }
    if (!tried) check(game, 'Overdrive: a member with two modes or more', false, 'none found');
    else {
      const other = tried.rows.find((r) => !r.sel).mode;
      const was = tried.rows.find((r) => r.sel).mode;
      await tapSel(page, `.prep__panel:not([hidden]) .prph-mode[data-mode="${other}"]`, 0, { wait: 400 });
      const after = await page.evaluate(() => ({
        phone: [...document.querySelectorAll('.prep__panel:not([hidden]) .prph-mode.is-sel')].map((r) => r.dataset.mode),
        tag: document.querySelector('.prep__panel:not([hidden]) .prph-mode.is-sel .prph-mode__tag')?.textContent ?? null,
        board: [...document.querySelectorAll('.ffxprep-mode-row--selected')].map((r) => r.dataset.mode),
        digest: document.querySelector('.prep__panel:not([hidden]) .prph-dg')?.textContent ?? null,
      }));
      check(game, `Overdrive: a tap equips ${other} (was ${was}); the EQUIPPED tag, the board's row and the digest agree`, after.phone.length === 1 && after.phone[0] === other && after.tag === 'EQUIPPED' && after.board[0] === other, JSON.stringify(after));
      // Switch member and back: the mode stays.
      const j = (tried.i + 1) % members.length;
      await tapSel(page, '.prep__member', j, { wait: 450 });
      await tapSel(page, '.prep__member', tried.i, { wait: 450 });
      const again = await page.evaluate(() => [...document.querySelectorAll('.prep__panel:not([hidden]) .prph-mode.is-sel')].map((r) => r.dataset.mode));
      check(game, 'Overdrive: the chosen mode is still equipped after another face and back', again.length === 1 && again[0] === other, JSON.stringify(again));
      await page.screenshot({ path: join(OUT, `${id}-overdrive-changed.png`) });
    }
  }

  // ---- page scroll by touch on the longest tab
  const longTab = game === 'FFX' ? 'items' : 'stats';
  await goTab(page, scr, longTab);
  await scrollTo(page, 330, W, H);
  const mid = await page.evaluate(() => { const p = document.querySelector('.prep'); const s = document.querySelector('.prep__tabs').getBoundingClientRect(); const r = document.querySelector('.prep__roster').getBoundingClientRect(); return { top: p.scrollTop, scrolled: p.classList.contains('is-scrolled'), strip: Math.round(s.top), roster: Math.round(r.top) }; });
  check(game, `page: a touch drag scrolls the ${longTab} page and the strip and faces stay pinned`, mid.top > 200 && mid.strip === 0 && mid.roster === 45 && mid.scrolled, JSON.stringify(mid));
  // Taps still work while scrolled: a face (pinned) and a tab (pinned).
  await tapSel(page, '.prep__member', 1, { wait: 450 });
  const sm1 = await selMember(page);
  check(game, 'page: a tap on a pinned face works while the page is scrolled', sm1.i === 1, `selected ${sm1.i} (${sm1.name})`);
  await tapSel(page, '.prep__member', 0, { wait: 450 });
  await scrollTo(page, 0, W, H);
  const top = await page.evaluate(() => ({ top: document.querySelector('.prep').scrollTop, scrolled: document.querySelector('.prep').classList.contains('is-scrolled') }));
  check(game, 'page: a drag back to the top clears the pinned bar\'s ground', top.top === 0 && top.scrolled === false, JSON.stringify(top));

  // ---- keys
  await goTab(page, scr, game === 'FFX' ? 'stats' : 'stats');
  const m0 = await selMember(page);
  await page.keyboard.press('ArrowDown');
  await sleep(page, 450);
  const m1 = await selMember(page);
  await page.keyboard.press('ArrowUp');
  await sleep(page, 450);
  const m2 = await selMember(page);
  check(game, 'keys: Down and Up walk the party, and the phone page follows', m1.i === (m0.i + 1) % m0.n && m2.i === m0.i && (await who(page)) === members[m0.i], `${m0.i} -> ${m1.i} -> ${m2.i}`);
  const t0 = await tabNow(page);
  await page.keyboard.press('ArrowRight');
  await sleep(page, 700);
  await dismissCards(page, scr);
  const t1 = await tabNow(page);
  await page.keyboard.press('ArrowLeft');
  await sleep(page, 700);
  await dismissCards(page, scr);
  const t2 = await tabNow(page);
  check(game, 'keys: Right and Left walk the tabs', t1 !== t0 && t2 === t0, `${t0} -> ${t1} -> ${t2}`);
  const foldAllTab = game === 'FFX' ? 'stats' : 'stats';
  await goTab(page, scr, foldAllTab);
  const n0 = (await secState(page));
  const openCount = (s) => Object.values(s).filter((x) => x.open).length;
  await page.keyboard.press('Tab');
  await sleep(page, 300);
  const n1 = await secState(page);
  await page.keyboard.press('Tab');
  await sleep(page, 300);
  const n2 = await secState(page);
  const total = Object.keys(n0).length;
  check(game, 'keys: Tab (Triangle) opens every folded section, and once none is folded it folds them all', openCount(n1) === total && openCount(n2) === 0, `${openCount(n0)} open of ${total} -> ${openCount(n1)} -> ${openCount(n2)}`);
  // PageDown / PageUp on the long tab.
  await goTab(page, scr, longTab);
  if (game === 'FFX-2') {
    // The Tab check above left every Stats section folded; open them all so the page is long again.
    await page.keyboard.press('Tab');
    await sleep(page, 400);
  }
  {
    const max = (await scrollInfo(page)).max;
    await page.keyboard.press('PageDown');
    await sleep(page, 400);
    const p1 = (await scrollInfo(page)).top;
    await page.keyboard.press('PageUp');
    await sleep(page, 400);
    const p2 = (await scrollInfo(page)).top;
    check(game, `keys: PageDown pages the ${longTab} page (a screen of its own content, or to its end) and PageUp pages it back; the browser does not scroll it a second time`, max > 100 && p1 >= Math.min(max, 100) && p1 <= max && p2 === 0, `scrollTop 0 -> ${p1} -> ${p2} (max ${max})`);
  }
  // Escape goes back.
  await page.keyboard.press('Escape');
  await sleep(page, 1500);
  const scrNow = await scr();
  check(game, 'keys: Esc leaves the prep screen (back to the chapter board)', scrNow === 'chapter-select', `screen=${scrNow}`);
  if (page.errors.length) console.log(`${game} page errors:`, page.errors.slice(0, 4));
  check(game, 'no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/** START BATTLE by touch, from a page tab, in a fresh context. */
async function startFlow(game, id, tab) {
  const { ctx, page, scr } = await openPrep(browser, { id, width: W, height: H, touch: true, dpr: 1 });
  await goTab(page, scr, tab);
  const before = await scr();
  await tapSel(page, '.prep__start', 0, { wait: 200 });
  const t0 = Date.now();
  let now = before;
  while (Date.now() - t0 < 40000 && now === 'party-prep') {
    await sleep(page, 400);
    now = await scr();
  }
  check(game, `START BATTLE (a touch tap on the pinned button, from the ${tab} page) begins the fight`, now !== 'party-prep', `screen ${before} -> ${now} in ${Date.now() - t0} ms`);
  await ctx.close();
}

const browser = await launch();
try {
  if (ONLY.includes('FFX')) {
    await flow('FFX', 'seymour-flux');
    await startFlow('FFX', 'seymour-flux', 'equipment');
  }
  if (ONLY.includes('FFX-2')) {
    await flow('FFX-2', 'ffx2-bahamut');
    await startFlow('FFX-2', 'ffx2-bahamut', 'accessories');
  }
} finally {
  await browser.close().catch(() => {});
}
fs.writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ w: W, h: H, tag: TAG, checks: results }, null, 1));
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length} of ${results.length} checks pass; ${bad.length} fail`);
process.exit(bad.length ? 1 : 0);
