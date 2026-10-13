// The browser proof, part 1: every prep tab of both games at a phone size, opened by a real touch tap, with a DOM sweep of the text
// (font-size times every ancestor's scale, offscreen text included), the layout checks and screenshots.
//   PYREFLY_BROWSER=gpu node proof-shots.mjs --w=390 --h=844 --tag=build [--base=http://127.0.0.1:5843/] [--mode=build|base]
// --mode=base (the pristine origin/main server) captures the same screens and the same sweep, with no checks that need the new markup.
import fs from 'node:fs';
import { launch, openPrep, dismissCards, mkdir, join, OUT_ROOT } from './lib.mjs';
import { textFloorProbe } from './probe.mjs';
import { tapSel, drag, settle, scrollInfo, scrollTo, hit, stripY } from './touch.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const W = Number(args.w ?? 390);
const H = Number(args.h ?? 844);
const TAG = String(args.tag ?? 'build');
const MODE = String(args.mode ?? 'build');
const GAMES = String(args.games ?? 'seymour-flux,ffx2-bahamut').split(',');
// The server comes from the environment (PREP_BASE), read by lib.mjs when it loads.
const OUT = join(OUT_ROOT, 'proof', `${TAG}-${W}x${H}`);
mkdir(OUT);

const PAGE_TABS = ['stats', 'equipment', 'items', 'overdrive', 'dresspheres', 'accessories'];
const results = [];
const check = (game, name, ok, detail = '') => {
  results.push({ game, name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${game.padEnd(13)} ${name}${detail ? '  ' + detail : ''}`);
};

/** Bring a tab fully into the strip by swiping it (touch) when it is not, then tap it. */
async function goTab(page, scr, id) {
  const sel = `.prep__tab[data-action="prep:tab:${id}"]`;
  for (let i = 0; i < 5; i++) {
    const h = await hit(page, sel);
    if (h.found && h.box.x >= 4 && h.box.x + h.box.w <= W - 24) break;
    const left = h.found && h.box.x < 4;
    const y = await stripY(page);
    await drag(page, left ? 60 : W - 60, y, left ? Math.min(W - 60, 60 + 200) : Math.max(60, W - 60 - 200), y);
    await page.waitForTimeout(450);
  }
  await tapSel(page, sel, 0, { wait: 900, partial: true });
  await dismissCards(page, scr);
  await page.waitForTimeout(500);
}

const readState = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('.prep');
    const strip = document.querySelector('.prep__tabs');
    const roster = document.querySelector('.prep__roster');
    const host = [...document.querySelectorAll('.prep__panel:not([hidden]) > .prph')][0] ?? null;
    const r = (e) => (e ? (({ left, top, right, bottom }) => ({ l: Math.round(left), t: Math.round(top), r: Math.round(right), b: Math.round(bottom) }))(e.getBoundingClientRect()) : null);
    const start = document.querySelector('.prep__start');
    const secs = host ? [...host.querySelectorAll('.prph-sec')].map((s) => Math.round(s.getBoundingClientRect().width)) : [];
    const lastKid = host?.lastElementChild ?? null;
    return {
      tab: p.dataset.tab,
      phone: p.dataset.phone ?? null,
      scrolled: p.classList.contains('is-scrolled'),
      top: p.scrollTop,
      sh: p.scrollHeight,
      ch: p.clientHeight,
      overflowY: getComputedStyle(p).overflowY,
      docScrollW: document.documentElement.scrollWidth,
      docClientW: document.documentElement.clientWidth,
      prepScrollW: p.scrollWidth,
      prepClientW: p.clientWidth,
      strip: r(strip),
      roster: r(roster),
      host: r(host),
      lastKid: r(lastKid),
      start: r(start),
      secW: secs,
      cue: document.querySelector('.prep__phone-cue')?.classList.contains('is-visible') ?? null,
      sel: document.querySelector('.prep__tab[aria-selected="true"]')?.textContent?.trim() ?? null,
    };
  });

const summary = [];
const browser = await launch();
try {
  for (const id of GAMES) {
    const game = id === 'seymour-flux' ? 'FFX' : 'FFX-2';
    const { ctx, page, scr } = await openPrep(browser, { id, width: W, height: H, touch: true, dpr: 1 });
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.prep__tab')].map((e) => e.getAttribute('data-action').replace('prep:tab:', '')));
    console.log(`--- ${game} (${id}) ${W}x${H}, tabs: ${tabs.join(', ')}`);
    for (let t = 0; t < tabs.length; t++) {
      const tab = tabs[t];
      if (t > 0) await goTab(page, scr, tab);
      const nn = String(t).padStart(2, '0');
      const base = `${id}-${nn}-${tab}`;
      await page.waitForTimeout(300);
      const s0 = await readState(page);
      await page.screenshot({ path: join(OUT, `${base}.png`) });
      const probe = await page.evaluate(textFloorProbe, { floor: 14, offscreen: true });
      const underDock = (o) => /START BATTLE|MORE BELOW/.test(`${o.a} ${o.b}`);
      const row = { game, id, tab, tabIndex: t, state: s0, nText: probe.nText, minEff: probe.minEff, under: probe.underCount, underList: probe.under.slice(0, 8).map((u) => `${u.eff}px ${u.text} @ ${u.at}`), overlaps: probe.overlaps.length, overlapsUnderDock: probe.overlaps.filter(underDock).length, overlapList: probe.overlaps.slice(0, 4), cut: probe.cut.length, cutList: probe.cut.slice(0, 4).map((c) => `${c.text} @ ${c.at}`) };
      if (MODE === 'build') {
        check(game, `${tab}: opened by a touch tap`, s0.tab === tab && s0.sel?.toLowerCase() === (tab === 'sphere-grid' ? 'sphere grid' : tab), `data-tab=${s0.tab} selected=${s0.sel}`);
        const own = tab === 'chapter' || tab === 'sphere-grid';
        check(game, `${tab}: ${own ? 'keeps its own phone page (no data-phone)' : 'takes the stacked page (data-phone=page)'}`, own ? s0.phone === null : s0.phone === 'page', `data-phone=${s0.phone}`);
        check(game, `${tab}: no text under 14 px (offscreen text included)`, probe.underCount === 0, `n=${probe.nText} min=${probe.minEff} under=${probe.underCount} ${row.underList.join(' | ')}`);
        check(game, `${tab}: no sideways scroll`, s0.docScrollW <= s0.docClientW && s0.prepScrollW <= s0.prepClientW + 1, `doc ${s0.docScrollW}/${s0.docClientW} prep ${s0.prepScrollW}/${s0.prepClientW}`);
        check(game, `${tab}: no overprinting or cut text (text that scrolls under the pinned START BATTLE or MORE BELOW is not counted; ${row.overlapsUnderDock} such)`, probe.overlaps.length === row.overlapsUnderDock && probe.cut.length === 0, `overlaps=${probe.overlaps.length - row.overlapsUnderDock} cut=${probe.cut.length} ${row.cutList.join(' | ')}`);
        if (!own) {
          check(game, `${tab}: the page fills the width (sections 12 px in from each edge)`, s0.host && s0.host.l >= 0 && s0.host.r <= W && s0.secW.every((w) => w >= W - 24 - 2 && w <= W - 24 + 2), `host ${JSON.stringify(s0.host)} sections ${[...new Set(s0.secW)].join(',')}`);
          check(game, `${tab}: the strip is 45 px and the faces row 65 px, one above the other, full width`, s0.strip && s0.roster && s0.strip.b - s0.strip.t === 45 && s0.roster.b - s0.roster.t === 65 && s0.roster.t === s0.strip.b && s0.strip.l === 0 && s0.strip.r === W, `strip ${JSON.stringify(s0.strip)} roster ${JSON.stringify(s0.roster)}`);
          // Scroll to the end by touch and look again.
          if (s0.sh > s0.ch + 4) {
            const top = await scrollTo(page, 99999, W, H);
            const s1 = await readState(page);
            await page.screenshot({ path: join(OUT, `${base}-end.png`) });
            check(game, `${tab}: a touch drag scrolls the page to its end (${top} of ${s1.sh - s1.ch})`, top >= Math.min(s1.sh - s1.ch, 20) && Math.abs(top - (s1.sh - s1.ch)) <= 2, `scrollTop=${top} max=${s1.sh - s1.ch}`);
            if (top >= 60) check(game, `${tab}: the strip and faces stay pinned while it scrolls, on a solid ground`, s1.strip?.t === 0 && s1.roster?.t === 45 && s1.scrolled === true, `strip.t=${s1.strip?.t} roster.t=${s1.roster?.t} is-scrolled=${s1.scrolled}`);
            else check(game, `${tab}: the page scrolls only ${top} px here, less than the 40 px eyebrow, so the bar rides up by ${top} and is not yet pinned`, s1.strip?.t === 40 - top && s1.roster?.t === 85 - top, `strip.t=${s1.strip?.t} roster.t=${s1.roster?.t}`);
            check(game, `${tab}: the last row ends above START BATTLE at the end of the page`, s1.lastKid && s1.start && s1.lastKid.b <= s1.start.t, `last.b=${s1.lastKid?.b} start.t=${s1.start?.t}`);
            check(game, `${tab}: MORE BELOW at the top, gone at the end`, s0.cue === true && s1.cue === false, `top=${s0.cue} end=${s1.cue}`);
            row.endState = s1;
            await scrollTo(page, 0, W, H);
          } else {
            check(game, `${tab}: fits one screen with START BATTLE below it`, s0.lastKid && s0.start && s0.lastKid.b <= s0.start.t, `last.b=${s0.lastKid?.b} start.t=${s0.start?.t}`);
          }
        }
        const sb = await hit(page, '.prep__start');
        check(game, `${tab}: START BATTLE is on screen, uncovered and 44 px or taller`, sb.found && sb.inView && !sb.covered && sb.box.h >= 44, `${JSON.stringify(sb.box)} covered=${sb.covered}`);
      }
      summary.push(row);
    }
    if (page.errors.length) console.log(`${game} page errors:`, page.errors.slice(0, 4));
    check(game, 'no page errors', page.errors.length === 0, page.errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
} finally {
  await browser.close().catch(() => {});
}
fs.writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ w: W, h: H, mode: MODE, tag: TAG, rows: summary, checks: results }, null, 1));
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length} of ${results.length} checks pass; ${bad.length} fail`);
process.exit(bad.length ? 1 : 0);
