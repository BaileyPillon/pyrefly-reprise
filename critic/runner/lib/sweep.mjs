// Critic instruments: the legibility sweep (CHK-003, CHK-009) over every screen a review owes, and the six-viewport pause matrix (CHK-002).
//
//   PYREFLY_BROWSER=gpu node critic/runner/lib/sweep.mjs <battle|phone|prep|matrix> --base=<url> --evidence=<dir> [--floor=14] [--chapters=a,b] [--tabs=7]
//
//   battle   every chapter of the board (18) at 1600x900: the first command menu as the player meets it, the menu with the coach marks gone, and the pause opened from it
//   phone    four chapters at 390x844 with a touch context: the same three surfaces
//   prep     Chapter I and Chapter IV (FFX and FFX-2 prep differ) at 1600x900 and 390x844, every prep tab
//   matrix   Chapter I at 390x844, 1280x720, 1600x900, 2000x1012, 2560x1080 and 3840x2160, each in a FRESH browser: the command menu, the pause and the pause plate's geometry
//
// Promoted from the round-25 chief's `sweep14.mjs` (and the capture owner's `pause-matrix.mjs`, whose legibility half it replaces) by lane r43-critic-tools, PR-0450 (b). The
// capture owner swept an 11 px floor, recorded no minimum and ran Chapter I only; CHK-003's floor is 14 css px, it asks for the smallest and the count under it, and it names every
// screen of both games. This sweep takes the floor from `--floor` (default 14), keeps the minimum and the count of every surface, and prints one report line for the whole run.
//
// A surface the sweep could not reach (a pause that did not open, a command menu that was not awaiting input, a chapter that did not load) is written UNVERIFIED with the reason
// and counted in the report line; it is never a pass, and a snapshot is only claimed for the state its read-back found (`makeSnap`, PR-0213). Real keys, headless Playwright from
// node, one browser at a time (never the Claude-in-Chrome extension or the in-app pane). Writes `<evidence>/gaps/sweep/out-<job>.json`. Both games: the floor is the same.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseArgs, requireBase, requireEvidence } from './cli.mjs';
import { bootChapter } from './gap-boot.mjs';
import { LEGIBILITY_FLOOR_PX, collectText, judgeLegibility, sweepReportLine, sweepSummary } from './legibility-pure.mjs';

/** The 19 chapters of the board, in play order (src/data/encounters.ts CHAPTER_IDS; tests/unit/critic-instruments-legibility.test.ts holds the two equal). */
export const BOARD_CHAPTERS = Object.freeze([
  'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern',
  'seymour-natus', 'ffx2-fallen-aeons', 'seymour-omnis', 'ffx2-trema', 'isaaru-via-purifico', 'ffx2-den-of-woe', 'ffx2-ixion-djose', 'sin-fins-core', 'sin-face', 'mirror-aeons',
]);
/** The phone sample: one FFX fight, one FFX-2 fight, and the two long chains (the chief's four). */
export const PHONE_CHAPTERS = Object.freeze(['seymour-flux', 'ffx2-bahamut', 'braskas-final-aeon', 'ffx2-fallen-aeons']);
/** The prep sample: Chapter I (FFX) and Chapter IV (FFX-2), each at a desktop and a phone size. */
export const PREP_CASES = Object.freeze([['seymour-flux', '1600x900', false], ['ffx2-bahamut', '1600x900', false], ['seymour-flux', '390x844', true], ['ffx2-bahamut', '390x844', true]]);
/** CHK-002's six viewports. */
export const MATRIX_SIZES = Object.freeze(['390x844', '1280x720', '1600x900', '2000x1012', '2560x1080', '3840x2160']);
export const PREP_TABS = 7;

// In the page (page.evaluate): self-contained, browser globals only.
const coachCount = () => document.querySelectorAll('.coach-mark,.coach-brief').length;
const activeTab = () => document.querySelector('.party-prep [aria-selected=true], .pp-tab--on, .prep__tab--on, [class*=tab][class*=on], [class*=tab][class*=active], [class*=tab][class*=selected]')?.textContent?.trim().slice(0, 30) ?? null;
const readPlate = () => {
  const img = document.querySelector('.pause__plate:not(.pause__plate--leaving)') || document.querySelector('.pause__plate');
  if (!img) return null;
  const rc = img.getBoundingClientRect();
  const chain = [];
  for (let a = img.parentElement; a && a !== document.body; a = a.parentElement) { const t = getComputedStyle(a).transform; if (t !== 'none') chain.push({ cls: (a.className || '').toString().slice(0, 40), t }); }
  return {
    rect: [rc.left, rc.top, rc.width, rc.height].map((x) => +x.toFixed(1)), vp: [innerWidth, innerHeight], currentSrc: img.currentSrc.split('/').slice(-2).join('/'),
    natural: [img.naturalWidth, img.naturalHeight], slid: img.classList.contains('pause__plate--slid'), ownTransform: getComputedStyle(img).transform, ancestorTransforms: chain,
    dpr: devicePixelRatio, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
  };
};

/** Press Enter while a coach mark or briefing is up (at most six times), the way a player clears them. */
async function dismissCoaches(b) {
  const { page, input } = b;
  await page.waitForTimeout(1200);
  for (let i = 0; i < 6 && (await page.evaluate(coachCount)); i++) { await input.press('Enter'); await page.waitForTimeout(500); }
}

/** Why the last snapshot did not match what it was asked to read, for the surface that depended on it. */
const whyUnverified = (b, what) => `UNVERIFIED: ${what} (${JSON.stringify(b.fails?.[b.fails.length - 1]?.unverified ?? 'the capture failed')})`;

/**
 * One battle chapter: the first command menu as shown, the menu with the coach marks cleared, then the pause opened from it.
 * `b` is a booted chapter (gap-boot.mjs). Returns the chapter's record and the surfaces it measured or could not.
 */
export async function sweepBattleChapter(b, { id, size, floor = LEGIBILITY_FLOOR_PX }) {
  const { page, input } = b;
  const rec = { id, size };
  const surfaces = [];
  rec.firstMenuAsShown = judgeLegibility(await page.evaluate(collectText), floor);
  surfaces.push({ label: `${id} first menu as shown`, size, result: rec.firstMenuAsShown });
  await dismissCoaches(b);
  rec.battle = judgeLegibility(await page.evaluate(collectText), floor);
  const menuOk = await b.snap('01-battle-menu.png', `battle command menu ${id} ${size}`, { screen: 'battle', awaitingMenu: true });
  rec.battleMenuVerified = menuOk;
  surfaces.push({ label: `${id} battle menu`, size, result: menuOk ? rec.battle : { unverified: whyUnverified(b, 'the battle screen was not awaiting a command when the menu was measured') } });
  await input.pause();
  await page.waitForTimeout(1800);
  rec.screen = await b.scr();
  if (rec.screen === 'pause') {
    rec.pause = judgeLegibility(await page.evaluate(collectText), floor);
    surfaces.push({ label: `${id} pause`, size, result: rec.pause });
    await input.press('Escape');
    await page.waitForTimeout(800);
  } else {
    rec.pause = { unverified: `the pause did not open from the command menu (screen=${rec.screen})` };
    surfaces.push({ label: `${id} pause`, size, result: rec.pause });
  }
  return { rec, surfaces };
}

/** The prep screen of one chapter: every tab, the label of the one showing, and a snapshot of the first. */
export async function sweepPrepTabs(b, { id, size, tabs = PREP_TABS, floor = LEGIBILITY_FLOOR_PX }) {
  const { page, input } = b;
  const rec = { id, size, tabs: [] };
  const surfaces = [];
  for (let t = 0; t < tabs; t++) {
    const s = judgeLegibility(await page.evaluate(collectText), floor);
    const tab = await page.evaluate(activeTab);
    rec.tabs.push({ i: t, tab, ...s, under: s.under.slice(0, 6), truncated: s.truncated.slice(0, 6) });
    surfaces.push({ label: `${id} ${size} prep tab ${t}${tab ? ` (${tab})` : ''}`, size, result: s });
    if (t === 0) await b.snap(`prep-tab${t}.png`, `party prep ${id} ${size} tab ${t}`, { screen: 'party-prep' }).catch(() => false);
    await input.press('ArrowRight');
    await page.waitForTimeout(700);
    for (let i = 0; i < 2 && (await page.evaluate(coachCount)); i++) { await input.press('Enter'); await page.waitForTimeout(500); }
  }
  return { rec, surfaces };
}

/** One viewport of CHK-002: the command menu, the pause, and the pause plate's geometry against the viewport. */
export async function sweepMatrixSize(b, { size, floor = LEGIBILITY_FLOOR_PX }) {
  const { page, input } = b;
  const rec = { size };
  const surfaces = [];
  await dismissCoaches(b);
  rec.battleSweep = judgeLegibility(await page.evaluate(collectText), floor);
  const menuOk = await b.snap('01-battle-menu.png', `battle command menu ${size}`, { screen: 'battle', awaitingMenu: true });
  surfaces.push({ label: `seymour-flux ${size} battle menu`, size, result: menuOk ? rec.battleSweep : { unverified: whyUnverified(b, 'the battle screen was not awaiting a command') } });
  await input.pause();
  await page.waitForTimeout(1800);
  rec.screen = await b.scr();
  if (rec.screen !== 'pause') {
    rec.pauseOpened = false;
    surfaces.push({ label: `seymour-flux ${size} pause`, size, result: { unverified: `the pause did not open (screen=${rec.screen})` } });
    return { rec, surfaces };
  }
  rec.pauseOpened = true;
  rec.plate = await page.evaluate(readPlate);
  rec.pauseSweep = judgeLegibility(await page.evaluate(collectText), floor);
  const pauseOk = await b.snap('02-pause.png', `pause from the command menu by Esc ${size}`, { screen: 'pause' });
  surfaces.push({ label: `seymour-flux ${size} pause`, size, result: pauseOk ? rec.pauseSweep : { unverified: whyUnverified(b, 'the pause was not the screen when it was measured') } });
  await input.press('Escape');
  await page.waitForTimeout(1200);
  rec.afterEsc = await b.scr();
  return { rec, surfaces };
}

/** The cases of a job: `[ { key, id, size, touch } ]`. */
export function casesFor(job, { chapters = null, tabs = PREP_TABS } = {}) {
  const pick = (all) => (chapters && chapters.length ? chapters : all);
  if (job === 'battle') return pick(BOARD_CHAPTERS).map((id) => ({ key: id, id, size: '1600x900', touch: false }));
  if (job === 'phone') return pick(PHONE_CHAPTERS).map((id) => ({ key: id, id, size: '390x844', touch: true }));
  if (job === 'prep') return PREP_CASES.filter(([id]) => !chapters || !chapters.length || chapters.includes(id)).map(([id, size, touch]) => ({ key: `${id}-${size}`, id, size, touch, tabs }));
  if (job === 'matrix') return MATRIX_SIZES.map((size) => ({ key: size, id: 'seymour-flux', size, touch: size === '390x844' }));
  throw new Error(`unknown sweep job "${job}" (battle, phone, prep or matrix)`);
}

/**
 * Runs a job: each case in a fresh browser, the result saved after each, every browser closed, and the totals and the report line at the end.
 * `boot(spec)` gives a booted chapter (default: gap-boot.mjs); a test passes a fake. `save(results)` writes the JSON so far.
 */
export async function runSweepJob({ job, base, evidence, floor = LEGIBILITY_FLOOR_PX, chapters = null, tabs = PREP_TABS, boot = bootChapter, save = () => undefined, log = () => undefined }) {
  const results = {};
  const surfaces = [];
  for (const c of casesFor(job, { chapters, tabs })) {
    let b;
    try {
      b = await boot({ base, evidence, id: c.id, dir: `sweep-${job}-${c.key}`, size: c.size, touch: c.touch, stopAtPrep: job === 'prep' });
      const out = job === 'prep' ? await sweepPrepTabs(b, { id: c.id, size: c.size, tabs: c.tabs, floor }) : job === 'matrix' ? await sweepMatrixSize(b, { size: c.size, floor }) : await sweepBattleChapter(b, { id: c.id, size: c.size, floor });
      results[c.key] = out.rec;
      surfaces.push(...out.surfaces);
      log(`${c.key}: ${out.surfaces.map((s) => (s.result.unverified ? `${s.label.split(' ').slice(1).join(' ')} UNVERIFIED` : `${s.label.split(' ').slice(1).join(' ')} min ${s.result.min} under ${s.result.underCount} cut ${s.result.truncatedCount}`)).join(' | ')}`);
    } catch (e) {
      const why = `the run stopped: ${String(e && e.message ? e.message : e).slice(0, 200)}`;
      results[c.key] = { id: c.id, size: c.size, error: why };
      surfaces.push({ label: `${c.id} ${c.size}`, size: c.size, result: { unverified: why } });
      log(`${c.key} ERR ${why}`);
    } finally {
      try { await b?.browser.close(); } catch { /* closed */ }
    }
    save(results);
  }
  const summary = sweepSummary(surfaces, floor);
  return { results, surfaces, summary, reportLine: sweepReportLine(`legibility sweep, ${job}`, summary) };
}

async function main(argv) {
  const args = parseArgs(argv);
  const job = args._[0];
  if (!job) throw new Error('usage: sweep.mjs <battle|phone|prep|matrix> --base=<url> --evidence=<dir> [--floor=14] [--chapters=a,b] [--tabs=7]');
  const base = requireBase(args);
  const evidence = path.resolve(requireEvidence(args));
  const floor = Number(args.floor ?? LEGIBILITY_FLOOR_PX);
  const chapters = args.chapters ? String(args.chapters).split(',').map((s) => s.trim()).filter(Boolean) : null;
  casesFor(job, { chapters }); // an unknown job stops here, before anything is written
  const gaps = path.join(evidence, 'gaps'); // the gap pass keeps its captures and its index.json under evidence/gaps, as the round-25 chief's sweep did
  const dir = path.join(gaps, 'sweep');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `out-${job}.json`);
  const write = (results, extra = {}) => fs.writeFileSync(file, JSON.stringify({ schema: 'sweep/1', job, base, floor, date: new Date().toISOString(), results, ...extra }, null, 1));
  const out = await runSweepJob({ job, base, evidence: gaps, floor, chapters, tabs: Number(args.tabs ?? PREP_TABS), save: write, log: (l) => console.log(l) });
  write(out.results, { summary: out.summary, reportLine: out.reportLine });
  console.log(`REPORT LINE: ${out.reportLine}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(() => process.exit(0), (e) => { console.error(String(e && e.stack ? e.stack : e)); process.exit(1); });
}
