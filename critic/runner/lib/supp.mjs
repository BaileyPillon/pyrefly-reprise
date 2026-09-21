// Supplementary capture passes. Real input only (mouse clicks on
// [data-ui-action] are wired by src/ui/ffx/rawInput.ts, so a click is a real
// pointer event). Modes: win <idx> | layout <idx> <w> <h> | coach <idx> | dark <idx> <w> <h>
//
// Promoted from critic/rounds/round-06/supp.mjs and fixed for PR-0059: the
// `dark` mode's pause capture asserted `screen=pause` in its own index entry
// without ever calling `screen()` after the Escape that was supposed to open
// it, so the claim was unsupported even though it happened to be true. It
// now reads the screen back with assertScreen, which throws if pause never
// actually opened (CHK-016).
//
// Usage: node critic/runner/lib/supp.mjs <mode> <chapterIndex> [w] [h] --base=<url> --evidence=<dir>
import { open, shoot, assertScreen, assertMenuRows } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireBase, requireEvidence } from './cli.mjs';

const CH = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin'];
const args = parseArgs(process.argv.slice(2));
const mode = args._[0];
const idx = Number(args._[1] ?? 0);
const id = CH[idx];
const game = idx < 3 ? 'ffx' : 'ffx2';
const W = Number(args._[2] ?? 1600);
const H = Number(args._[3] ?? 900);
const BASE = requireBase(args);
const EV = requireEvidence(args);
const dir = `ch${idx + 1}`;
const rec = { mode, chapter: id, game, size: `${W}x${H}`, steps: [] };
const note = (k, v) => { rec.steps.push({ k, v }); console.log(k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 500)); };

const { browser, page, consoleErrors, notFound, htmlImages, net } = await open({ base: BASE, width: W, height: H, fresh: true, touch: W < 500 });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const shot = (file, meta) => shoot(page, EV, file, meta);
const stJson = () => page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {}); } catch { return '{}'; } });
const awaiting = async () => /"awaitingMenu":true/.test(await stJson());

/** Walk title -> chapter select -> prep -> scene -> battle with real keys. */
async function toBattle() {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
  await assertScreen(page, 'chapter-select');
  for (let i = 0; i < idx; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(280); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
  await assertScreen(page, 'party-prep');
  await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  for (let i = 0; i < 40 && await scr() === 'cutscene'; i++) {
    await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  }
  await assertScreen(page, 'battle', 60000);
}

/** The advisor's top recommendation, as the player reads it off the card. */
const readPick = () => page.evaluate(() => {
  const m = document.querySelector('.mad__move');
  if (!m) return null;
  const menuChip = [...m.querySelectorAll('.mad__stat')].map((e) => e.textContent.trim()).find((t) => /^in /i.test(t));
  return {
    label: m.querySelector('.mad__label')?.textContent?.trim() ?? null,
    target: m.querySelector('.mad__target')?.textContent?.trim() ?? null,
    menu: menuChip ? menuChip.replace(/^in /i, '').trim() : null,
    badge: !!m.querySelector('.mad__badge'),
  };
});

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Move the cursor to the named row with real arrow keys, then confirm. Uses
 * the same `.ig-cmd` read as lib.mjs's assertMenuRows (PR-0059). */
async function pickRow(text) {
  let rs = await assertMenuRows(page, { context: `pickRow(${text})` });
  if (!rs.length) return null;
  const want = rs.find((r) => norm(r.text) === norm(text))
    ?? rs.find((r) => norm(r.text).startsWith(norm(text)) && norm(text).length > 2)
    ?? rs.find((r) => norm(text).startsWith(norm(r.text)) && norm(r.text).length > 2);
  if (!want) return null;
  for (let guard = 0; guard < 20; guard++) {
    rs = await assertMenuRows(page, { context: `pickRow(${text}) guard` });
    const cur = rs.findIndex((r) => r.selected);
    const tgt = rs.findIndex((r) => norm(r.text) === norm(want.text));
    if (tgt < 0) return null;
    if (cur === tgt || cur < 0) break;
    await page.keyboard.press(cur < tgt ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(180);
  }
  await page.keyboard.press('Enter');
  return want.text;
}

try {
  if (mode === 'dark') {
    // Fresh profile, no key pressed: the candidate must show no onboarding anywhere.
    await page.waitForTimeout(1500);
    rec.title = await page.evaluate(() => ({
      screen: window.__pyrefly.screen(),
      text: document.body.innerText.replace(/\s+/g, ' '),
      briefingChip: /BRIEFING/i.test(document.body.innerText),
      coachNodes: [...document.querySelectorAll('[class*="coach"],[class*="briefing"]')].map((e) => ({ cls: e.className.toString().slice(0, 60), vis: e.getBoundingClientRect().width > 2 })),
      coachingOn: (() => { try { return window.__pyrefly.coaching?.(); } catch { return 'n/a'; } })(),
    }));
    note('dark.title', rec.title);
    await shot(`dark/00-title-fresh-${W}x${H}.png`, { game: 'both', chapter: 'n/a', state: 'fresh profile title, onboarding dark', size: `${W}x${H}`, input: 'none (boot)', injected: false, asserted: 'screen=title' });
    await toBattle();
    rec.battleCoach = await page.evaluate(() => [...document.querySelectorAll('[class*="coach"],[class*="briefing"]')].map((e) => ({ cls: e.className.toString().slice(0, 60), r: e.getBoundingClientRect().width + 'x' + e.getBoundingClientRect().height, txt: e.textContent.trim().slice(0, 80) })));
    note('dark.battleCoach', rec.battleCoach);
    await page.keyboard.press('Escape');
    // PR-0059 fix: this used to shoot dark/01-pause and claim `asserted:
    // "screen=pause"` without ever reading screen() back. assertScreen
    // throws here if Escape did not actually open the pause screen.
    rec.pauseScreen = await assertScreen(page, 'pause', 10000);
    rec.pauseText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    rec.pauseHasOnboarding = /BRIEFING|TUTORIAL|COACH|SHOW TIPS|FIRST-USE/i.test(rec.pauseText);
    note('dark.pauseHasOnboarding', rec.pauseHasOnboarding);
    await shot(`dark/01-pause-${W}x${H}.png`, { game, chapter: id, state: 'pause, no onboarding rows', size: `${W}x${H}`, input: 'keyboard Escape', injected: false, asserted: `screen=${rec.pauseScreen}` });
  }

  if (mode === 'layout') {
    await toBattle();
    for (let i = 0; i < 60 && !(await awaiting()); i++) await page.waitForTimeout(500);
    // PR-0050: measure the COLLAPSED toggle against the boss plate, guide off.
    // The panel stays in the DOM when hidden, so read the chip's own label:
    // "G HIDE GUIDE" = open, "G GUIDE" = collapsed.
    const chipText = () => page.evaluate(() => document.querySelector('.sgd__toggle')?.textContent?.trim().toUpperCase() ?? '');
    rec.chipTextBefore = await chipText();
    if (/HIDE/.test(rec.chipTextBefore)) { await page.keyboard.press('g'); await page.waitForTimeout(700); }
    rec.chipTextCollapsed = await chipText();
    note('chip text open->collapsed', [rec.chipTextBefore, rec.chipTextCollapsed]);
    rec.chip = await page.evaluate(() => {
      const chip = document.querySelector('.sgd__toggle');
      if (!chip) return null;
      const r = chip.getBoundingClientRect();
      const boxes = [];
      for (const e of document.querySelectorAll('*')) {
        const cls = e.className?.toString?.() ?? '';
        if (!/plate|enemy|boss|nameplate|hpbar|hp__|scan/i.test(cls)) continue;
        const b = e.getBoundingClientRect();
        if (b.width < 10 || b.height < 6) continue;
        const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left);
        const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        if (ox > 1 && oy > 1) boxes.push({ cls: cls.slice(0, 70), ox: Math.round(ox), oy: Math.round(oy), txt: e.textContent.trim().slice(0, 40) });
      }
      const cs = getComputedStyle(chip);
      return { text: chip.textContent.trim().slice(0, 30), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, inlineTop: chip.style.top || null, cssTop: cs.top, vw: innerWidth, vh: innerHeight, overlaps: boxes.slice(0, 15) };
    });
    note('chipCollapsed', rec.chip);
    await shot(`${dir}/L-${W}x${H}-chip-collapsed.png`, { game, chapter: id, state: 'collapsed G GUIDE chip, guide off', size: `${W}x${H}`, input: 'keyboard g', injected: false, asserted: 'awaitingMenu true' });
    // PR-0001 inside the guide column only.
    await page.keyboard.press('g'); await page.waitForTimeout(800);
    rec.chipTextReopened = await chipText();
    rec.guide = await page.evaluate(() => {
      const g = document.querySelector('.sgd__stack');
      if (!g) return null;
      const gr = g.getBoundingClientRect();
      if (gr.width < 4 || gr.height < 4) return { hidden: true };
      const eff = (el) => {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        let s = 1, n = el;
        while (n && n !== document.documentElement) {
          const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
          if (m.a && m.a !== 1) s *= m.a;
          n = n.parentElement;
        }
        return Math.round(fs * s * 100) / 100;
      };
      const out = [];
      for (const e of g.querySelectorAll('*')) {
        if (e.children.length || !e.textContent.trim()) continue;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        out.push({ t: e.textContent.trim().slice(0, 44), eff: eff(e), clipped: e.scrollWidth > e.clientWidth + 1 });
      }
      const r = g.getBoundingClientRect();
      return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, n: out.length, under14: out.filter((x) => x.eff < 14), minEff: out.length ? Math.min(...out.map((x) => x.eff)) : null };
    });
    note('guide', { n: rec.guide?.n, minEff: rec.guide?.minEff, under14: rec.guide?.under14?.length });
    await shot(`${dir}/L-${W}x${H}-guide-open.png`, { game, chapter: id, state: 'strategy guide open, type measured', size: `${W}x${H}`, input: 'keyboard g', injected: false, asserted: 'awaitingMenu true' });
    // PR-0046 disclosure: what the FFX-2 clock badge actually says in this candidate.
    rec.clockBadge = await page.evaluate(() => {
      const hit = [...document.querySelectorAll('*')].filter((e) => !e.children.length && /ATB (RUNNING|HELD)|^ACTIVE|^WAIT/i.test(e.textContent.trim()));
      return hit.map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), vis: r.width > 2 && r.height > 2, r: [Math.round(r.x), Math.round(r.y)] }; });
    });
    note('clockBadge', rec.clockBadge);
    // Portrait chips on the battle HUD (PR-0014 neighbourhood).
    rec.hudChips = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src).split('/').slice(-1)[0], nw: i.naturalWidth, vis: i.getBoundingClientRect().width > 3 })).filter((x) => x.src));
  }

  if (mode === 'coach') {
    await page.evaluate(() => window.__pyrefly.setCoaching(true));
    await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
    await page.evaluate(() => window.__pyrefly.setCoaching(true));
    await page.waitForTimeout(1500);
    rec.coachingOn = await page.evaluate(() => { try { return window.__pyrefly.coaching?.(); } catch { return 'n/a'; } });
    rec.briefingUp = await page.evaluate(() => !!document.querySelector('.coach-briefing, [class*="briefing"]'));
    note('coach.forced', { coachingOn: rec.coachingOn, briefingUp: rec.briefingUp });
    await shot(`coach/00-briefing-${W}x${H}.png`, { game: 'both', chapter: 'n/a', state: 'briefing forced on (injected: setCoaching)', size: `${W}x${H}`, input: 'debug setCoaching + boot', injected: true, asserted: 'briefing present' });
    if (rec.briefingUp) {
      // PR-0049: Tab must move focus between the two controls, not dismiss.
      await page.keyboard.press('Tab'); await page.waitForTimeout(500);
      rec.afterTab = await page.evaluate(() => ({ up: !!document.querySelector('.coach-briefing, [class*="briefing"]'), focus: document.activeElement?.textContent?.trim().slice(0, 40) ?? null }));
      note('PR-0049 afterTab', rec.afterTab);
      await shot(`coach/01-after-Tab-${W}x${H}.png`, { game: 'both', chapter: 'n/a', state: 'briefing still up after Tab (PR-0049)', size: `${W}x${H}`, input: 'keyboard Tab', injected: true, asserted: 'briefing queried' });
      await page.keyboard.press('KeyQ'); await page.waitForTimeout(400);
      rec.afterQ = await page.evaluate(() => !!document.querySelector('.coach-briefing, [class*="briefing"]'));
      rec.footer = await page.evaluate(() => document.querySelector('[class*="briefing"]')?.textContent?.replace(/\s+/g, ' ').slice(0, 600) ?? null);
      note('PR-0049 afterQ briefingUp', rec.afterQ);
      // PR-0048: contrast of the briefing lines at this size.
      rec.briefingLayout = await page.evaluate(() => {
        const b = document.querySelector('[class*="briefing"]');
        if (!b) return null;
        const art = [...b.querySelectorAll('img,[class*="art"],[class*="paint"]')].map((e) => { const r = e.getBoundingClientRect(); return { cls: e.className.toString().slice(0, 50), r: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }; });
        const lines = [...b.querySelectorAll('p,li,span,footer,div')].filter((e) => !e.children.length && e.textContent.trim()).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: e.textContent.trim().slice(0, 50), r: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], color: cs.color, bg: cs.backgroundColor, parentBg: getComputedStyle(e.parentElement).backgroundColor }; });
        return { vw: innerWidth, vh: innerHeight, art, lines: lines.slice(0, 30) };
      });
      note('PR-0048 layout', { art: rec.briefingLayout?.art?.length, lines: rec.briefingLayout?.lines?.length });
    }
  }

  if (mode === 'win') {
    await toBattle();
    await shot(`${dir}/W-00-battle-start.png`, { game, chapter: id, state: 'battle start, guided line', size: `${W}x${H}`, input: 'keyboard', injected: false, asserted: 'screen=battle' });
    rec.atbModeEl = await page.evaluate(() => {
      const e = document.querySelector('.ffx2-atbmode');
      if (!e) return 'element absent';
      const r = e.getBoundingClientRect();
      return { hidden: e.hidden, text: e.textContent, w: Math.round(r.width), h: Math.round(r.height), display: getComputedStyle(e).display };
    });
    note('atbModeEl (PR-0046 HUD half)', rec.atbModeEl);
    const t0 = Date.now();
    let turns = 0;
    rec.picks = []; rec.rowCounts = []; rec.zeroRow = 0;
    const budget = Number(args._[4] ?? 900000);
    while (await scr() === 'battle' && Date.now() - t0 < budget) {
      if (!(await awaiting())) { await page.waitForTimeout(400); continue; }
      const menuRows = await assertMenuRows(page, { context: `win turn ${turns}` });
      rec.rowCounts.push(menuRows.length);
      if (menuRows.length === 0) {
        rec.zeroRow++;
        rec.zeroRowState = await stJson();
        await shot(`${dir}/W-ZERO-ROW-${turns}.png`, { game, chapter: id, state: 'awaitingMenu with zero command rows', size: `${W}x${H}`, input: 'none', injected: false, asserted: 'awaitingMenu true, rows=0' });
        break;
      }
      // Open the advisor once so the pick is readable, then keep it open.
      if (turns === 0) { await page.keyboard.press('n'); await page.waitForTimeout(600); }
      // Make sure we are at the TOP of the command menu before reading the pick:
      // a leftover submenu or targeting layer is what made earlier turns no-ops.
      for (let b = 0; b < 3; b++) {
        const atTop = await page.evaluate(() => {
          const t = document.querySelector('.ffx-cmd-breadcrumb, .ffx2cmd__title');
          return !t || !t.textContent.trim() || /command|^$/i.test(t.textContent.trim());
        });
        if (atTop) break;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      const pick = await readPick();
      rec.picks.push(pick);
      let pathPicked = null;
      if (pick?.menu) pathPicked = await pickRow(pick.menu);
      if (pathPicked) { await page.waitForTimeout(500); }
      const leaf = await pickRow(pick?.label ?? 'Attack');
      await page.waitForTimeout(500);
      rec.picks[rec.picks.length - 1] = { ...pick, path: pathPicked, leaf };
      if (!leaf && !pathPicked) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
      // Target step: take the default unless the advisor named one we can see.
      const tg = await page.evaluate(() => { try { const t = window.__pyrefly.targeting(); return t ? { active: !!t.active, sel: t.selection ?? null } : null; } catch { return null; } });
      if (turns === 1) await shot(`${dir}/W-01-targeting.png`, { game, chapter: id, state: 'target selection', size: `${W}x${H}`, input: 'keyboard arrows + Enter', injected: false, asserted: 'in battle' });
      rec.lastTargeting = tg;
      await page.keyboard.press('Enter'); await page.waitForTimeout(900);
      turns++;
      if (turns === 3) {
        await shot(`${dir}/W-02-midfight.png`, { game, chapter: id, state: 'mid-fight after three guided turns', size: `${W}x${H}`, input: 'mouse + keyboard', injected: false, asserted: 'in battle' });
      }
      if (turns > 300) break;
    }
    rec.turns = turns;
    rec.ms = Date.now() - t0;
    rec.endScreen = await scr();
    note('win.end', { screen: rec.endScreen, turns, ms: rec.ms, zeroRow: rec.zeroRow, rowMin: rec.rowCounts.length ? Math.min(...rec.rowCounts) : null });
    rec.battleLog = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.battleLog()).slice(0, 600000); } catch { return null; } });
    for (let i = 0; i < 40 && await scr() === 'cutscene'; i++) {
      if (i === 0) await shot(`${dir}/W-03-post-scene.png`, { game, chapter: id, state: 'post-battle cutscene', size: `${W}x${H}`, input: 'keyboard', injected: false, asserted: 'screen=cutscene' });
      await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    }
    for (let i = 0; i < 25 && !/results/.test(await scr() ?? ''); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(700); }
    rec.resultsScreen = await scr();
    if (/results/.test(rec.resultsScreen ?? '')) {
      await shot(`${dir}/W-04-results.png`, { game, chapter: id, state: 'results after guided outcome', size: `${W}x${H}`, input: 'keyboard', injected: false, asserted: `screen=${rec.resultsScreen}` });
      rec.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 2500));
      rec.resultsImgs = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src).split('/').slice(-1)[0], nw: i.naturalWidth })));
      rec.resultsMonograms = await page.evaluate(() => [...document.querySelectorAll('[class*="mono"],[class*="chip"]')].map((e) => ({ cls: e.className.toString().slice(0, 50), txt: e.textContent.trim().slice(0, 12), hasImg: !!e.querySelector('img') })).slice(0, 30));
      note('results', (rec.resultsText || '').slice(0, 200));
      // Return to chapter select (CHK-022).
      await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
      await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
      rec.afterResults = await scr();
      note('afterResults', rec.afterResults);
      await shot(`${dir}/W-05-after-results.png`, { game, chapter: id, state: 'destination after results', size: `${W}x${H}`, input: 'keyboard', injected: false, asserted: `screen=${rec.afterResults}` });
    }
  }
} catch (e) {
  rec.error = String(e);
  rec.errorScreen = await scr().catch(() => null);
  console.log('CAUGHT', rec.error, rec.errorScreen);
}
rec.consoleErrors = consoleErrors; rec.notFound = notFound; rec.htmlImages = htmlImages; rec.mediaRequests = [...new Set(net)];
fs.mkdirSync(path.join(EV, dir), { recursive: true });
fs.writeFileSync(path.join(EV, dir, `supp-${mode}-${W}x${H}.json`), JSON.stringify(rec, null, 1));
await browser.close();
console.log('DONE', mode, id, W + 'x' + H, 'err=', consoleErrors.length, '404=', notFound.length);
