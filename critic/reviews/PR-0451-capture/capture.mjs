#!/usr/bin/env node
/**
 * PR-0451 live capture (FFX only): "FFX bosses now obey Silence".
 *
 * Plays Chapter I (Seymour Flux) on the LIVE site, headless Chromium from node, by REAL KEY PRESSES through the battle menus:
 * Tidus's turn -> L1 (KeyF) opens the party swap -> Wakka -> his Skill list -> Silence Buster / Silence Attack -> target Seymour Flux.
 * Then every other turn is Defend (KeyQ) until Seymour's next turn. The debug API is used ONLY to pick the chapter and the seed
 * (setSeed / gotoChapter) and to READ the log and the state; it never inflicts a status or changes state.
 *
 *   node capture.mjs [--seeds=1,2,3] [--url=https://echoesofspira.com/] [--out=<dir>] [--budgetMin=22]
 *
 * Playwright is imported by absolute path from the main tree's node_modules. Nothing is installed or downloaded.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const URL = String(args.url ?? 'https://echoesofspira.com/');
const OUT = resolve(String(args.out ?? HERE));
const SEEDS = String(args.seeds ?? '1,2,3,4,5,6').split(',').map(Number);
const BUDGET_MS = Number(args.budgetMin ?? 22) * 60_000;
const DEBUG = args.debug === true;
const CONTROL = args.control === true; // control run: nobody Silences Seymour; Defend until his Dispel turn, to show what an unsilenced Dispel looks like
const T0 = Date.now();
const SYMOUR = 'seymour-flux';

const GPU_ARGS = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'];
const dbg = (...a) => { if (DEBUG) console.log(...a); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------------------------------------------------
async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.errors = [];
  page.keys = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${String(e)}`));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(`console.error: ${m.text().slice(0, 300)}`); });
  return page;
}

async function key(page, k, ms = 450) {
  page.keys.push(k);
  await page.keyboard.press(k);
  await sleep(ms);
}

const readState = (page) =>
  page.evaluate((SEY) => {
    const api = window.__pyrefly;
    const st = api.battleState();
    if (!st) return { gone: true, awaitingMenu: false, logLen: 0, seymour: { mp: null, statuses: {} }, party: {}, activeIds: [], reserveIds: [], rows: [], cycle: null, result: 'battle-gone' };
    const pb = api.snapshotState().screenState?.playback;
    const stack = [...document.querySelectorAll('.ig-cmd-stack')].filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order'));
    const rows = stack.flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd')]).map((r) => ({
      label: (r.querySelector('.ffx-cmd__label') ?? r.querySelector('.ffx-cmd--trigger__label') ?? r).textContent.trim(),
      disabled: r.classList.contains('ig-cmd--disabled'),
      selected: r.classList.contains('ig-cmd--selected'),
    }));
    const sey = st.combatants[SEY];
    const party = {};
    for (const id of [...st.activeIds, ...st.reserveIds]) {
      const c = st.combatants[id];
      party[id] = { hp: c.hp, mp: c.mp, statuses: Object.keys(c.statuses ?? {}) };
    }
    return {
      actor: (pb?.phase ?? '').replace('command:', ''),
      awaitingMenu: pb?.awaitingMenu === true,
      played: pb?.played ?? null,
      rows,
      seymour: { hp: sey.hp, mp: sey.mp, statuses: JSON.parse(JSON.stringify(sey.statuses ?? {})) },
      cycle: st.flags['seymour.cycle'] ?? null,
      activeIds: [...st.activeIds],
      reserveIds: [...st.reserveIds],
      party,
      logLen: st.log.length,
      turn: st.turn,
      result: st.result,
    };
  }, SYMOUR);

/** Wait for a NEW command menu (the log grew since `fromLen` and the presenter awaits input). */
async function nextMenu(page, fromLen, timeout = 150_000) {
  await page.waitForFunction(
    (n) => {
      const api = window.__pyrefly;
      const pb = api.snapshotState().screenState?.playback;
      return pb?.awaitingMenu === true && api.battleLog().length > n && document.querySelector('.ig-cmd-stack [data-ui-action]') !== null;
    },
    fromLen,
    { timeout, polling: 100 },
  );
  await page.evaluate(async () => { for (let i = 0; i < 40; i++) await window.__pyrefly.frame(); });
  await sleep(500);
  return readState(page);
}

const selectedLabel = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ig-cmd-stack')].filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order')).flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd--selected')]);
    const r = rows.pop();
    return r ? (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim() : null;
  });

async function pickRow(page, label) {
  for (let k = 0; k < 20; k++) {
    if ((await selectedLabel(page)) === label) return true;
    await key(page, 'ArrowDown', 150);
  }
  return (await selectedLabel(page)) === label;
}

const targetName = (page) => page.evaluate(() => document.querySelector('.ffx-target__plate .ffx-target__name')?.textContent?.trim() ?? null);

async function shot(page, name, notes, note) {
  const file = resolve(OUT, name);
  await page.screenshot({ path: file, type: 'png' });
  notes.push({ file: name, note, atMs: Date.now() - T0 });
  console.log(`  frame ${name}: ${note}`);
}

const eventsFrom = (page, from) =>
  page.evaluate((n) => window.__pyrefly.battleLog().slice(n).map((e) => ({ seq: e.seq, type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null, status: e.status ?? null, abilityName: e.abilityName ?? null, text: e.text ?? null, reason: e.reason ?? null, amount: e.amount ?? null })), from);

// ---------------------------------------------------------------------------------------------------------------------
async function attempt(browser, seed) {
  const page = await newPage(browser);
  const rec = { seed, frames: [], steps: [], silenceTries: [], keys: page.keys, verdict: null };
  try {
    await page.goto(`${URL}?coach=off`);
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
    rec.build = await page.evaluate(() => ({ ...window.__pyrefly.build(), version: window.__pyrefly.version, scripts: [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')), href: location.href }));
    console.log(`seed ${seed}: build ${JSON.stringify(rec.build)}`);
    await page.evaluate((s) => {
      const api = window.__pyrefly;
      api.markCoachSeen?.();
      api.setSeed(s); // chapter + seed only
      api.setBattleSpeed('fast');
      void api.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true }); // no `auto`: the player acts by keys
    }, seed);

    let lastLen = 0;
    let silencedAt = null; // seq of the status-add that put Silence on Seymour
    let mpBefore = null;
    let cycleBefore = null;
    let tries = 0;
    let seyShots = 0;
    let controlFrom = null;
    const seySeen = new Set();
    const taken = { choose: false, target: false, landed: false };
    // Cycle value at which Seymour's NEXT own turn is Dispel, a Silence-gated command (`ai/seymour-flux.ts`: s === 5).
    const DISPEL_CYCLE = 5;

    /** Watch the log for Seymour's own turns after the Silence landed; frame each one as the presenter reaches it. */
    async function watchSeymour(exitLen) {
      const t = Date.now();
      while (Date.now() - t < 40_000) {
        const ev = await eventsFrom(page, (silencedAt ?? controlFrom ?? 0) + 1);
        const st = await readState(page);
        for (const turn of ev.filter((e) => e.type === 'turn-start' && e.actorId === SYMOUR && !seySeen.has(e.seq))) {
          seySeen.add(turn.seq);
          const after = ev.filter((e) => e.seq > turn.seq);
          const nextEv = after.find((e) => e.type === 'action-start' || e.type === 'turn-start');
          const acted = nextEv && nextEv.type === 'action-start' && nextEv.actorId === SYMOUR ? nextEv : null;
          await page.waitForFunction((seq) => (window.__pyrefly.snapshotState().screenState?.playback?.played ?? 0) > seq, turn.seq, { timeout: 15_000, polling: 40 }).catch(() => {});
          const now = await readState(page);
          seyShots += 1;
          const letter = String.fromCharCode(96 + seyShots);
          const fname = acted ? `4${letter}-seymour-turn-${(acted.abilityName ?? 'action').replace(/\W+/g, '-').toLowerCase()}.png` : `4${letter}-seymour-turn-refused.png`;
          await shot(page, fname, rec.frames, acted ? `Seymour's turn (seq ${turn.seq}) while Silenced: action-start ${acted.abilityName} (MP ${now.seymour.mp}, cycle ${now.cycle})` : `Seymour's turn (seq ${turn.seq}) while Silenced: NO action-start follows (MP ${now.seymour.mp}, cycle ${now.cycle})`);
          rec.seymourTurns = rec.seymourTurns ?? [];
          rec.seymourTurns.push({ turnSeq: turn.seq, acted: acted ? acted.abilityName : null, mpBeforeSilence: mpBefore, mpAtTurn: now.seymour.mp, cycleBeforeSilence: cycleBefore, cycleAtTurn: now.cycle, silenceOnSeymourAtTurn: 'silence' in now.seymour.statuses, eventsAfter: after.slice(0, 8) });
        }
        if (st.awaitingMenu && st.logLen > exitLen) return;
        await sleep(50);
      }
    }

    for (let step = 0; step < 70; step++) {
      if (Date.now() - T0 > BUDGET_MS) { rec.verdict = 'budget'; break; }
      const s = await nextMenu(page, lastLen);
      lastLen = s.logLen;
      const silenced = 'silence' in s.seymour.statuses;
      rec.steps.push({ step, actor: s.actor, rows: s.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join('|'), seymourMp: s.seymour.mp, seymourStatuses: Object.keys(s.seymour.statuses), cycle: s.cycle, active: s.activeIds, logLen: s.logLen });
      dbg(`step ${step}: ${s.actor} cycle=${s.cycle} sey=${Object.keys(s.seymour.statuses)} active=${s.activeIds} rows=${s.rows.map((r) => r.label).join('|')}`);
      if (s.result) { rec.verdict = 'battle-over'; break; }

      if (CONTROL) {
        controlFrom ??= s.logLen;
        if (rec.seymourTurns?.some((t) => t.acted === 'Dispel')) { rec.verdict = 'complete'; break; }
        await key(page, 'q', 100);
        await watchSeymour(s.logLen);
        continue;
      }
      if (silencedAt !== null) {
        // The Silence turn has been watched; once Seymour has had a turn after it, the capture is complete.
        if (seySeen.size > 0) { rec.verdict = 'complete'; break; }
      }
      if (tries >= 1 && silencedAt === null) { rec.verdict = 'silence-missed'; break; }

      const atDispel = s.cycle === DISPEL_CYCLE && !silenced && silencedAt === null;
      if (!atDispel) {
        // Not yet: Seymour's next turn is not the gated one. Defend (Triangle on the pad, Q on the keyboard).
        const lenBefore = s.logLen;
        await key(page, 'q', 100);
        if (silencedAt !== null) await watchSeymour(lenBefore);
        continue;
      }

      // Seymour's next turn is Dispel. Silence him now: Wakka takes this turn (L1 swap) and uses Silence Buster / Silence Attack.
      if (s.actor !== 'wakka') {
        if (s.activeIds.includes('wakka')) { await key(page, 'q', 100); continue; }
        await key(page, 'f', 500); // L1: the party swap, straight into the reserve list
        if (!(await pickRow(page, 'Wakka'))) { rec.verdict = 'wakka-not-in-swap-list'; break; }
        await key(page, 'Enter', 600);
        lastLen = s.logLen;
        continue;
      }
      const skillRow = s.rows.find((r) => r.label === 'Skill') ?? s.rows.find((r) => r.label === 'Special');
      if (!skillRow || !(await pickRow(page, skillRow.label))) { rec.verdict = `no-skill-row (${s.rows.map((r) => r.label)})`; break; }
      await key(page, 'Enter', 500);
      const ability = tries % 2 === 0 ? 'Silence Buster' : 'Silence Attack';
      const other = ability === 'Silence Buster' ? 'Silence Attack' : 'Silence Buster';
      let chosen = ability;
      if (!(await pickRow(page, ability))) {
        chosen = other;
        if (!(await pickRow(page, other))) { rec.verdict = 'no-silence-ability-in-skill-list'; break; }
      }
      if (!taken.choose) { await shot(page, '1-silence-command-chosen.png', rec.frames, `Wakka's Skill list with ${chosen} highlighted (the Silence command being chosen); Seymour's cycle ${s.cycle}, MP ${s.seymour.mp}`); taken.choose = true; }
      mpBefore = s.seymour.mp;
      cycleBefore = s.cycle;
      await key(page, 'Enter', 700);
      let name = await targetName(page);
      for (let k = 0; k < 4 && name && !/seymour/i.test(name); k++) { await key(page, 'ArrowRight', 300); name = await targetName(page); }
      dbg(`target: ${name}`);
      if (!taken.target) { await shot(page, '2-silence-target-seymour.png', rec.frames, `target step: ${chosen} aimed at ${name}`); taken.target = true; }
      const logBefore = (await readState(page)).logLen;
      await key(page, 'Enter', 200);
      tries += 1;
      const t = Date.now();
      let landed = false;
      let done = false;
      while (Date.now() - t < 40_000 && !done) {
        const ev = await eventsFrom(page, logBefore);
        const sil = ev.find((e) => e.type === 'status-add' && e.targetId === SYMOUR && e.status === 'silence');
        if (sil) { landed = true; silencedAt = sil.seq; }
        const end = ev.find((e) => e.type === 'action-end' && e.actorId === 'wakka');
        if (sil || end) done = true;
        else await sleep(60);
      }
      rec.silenceTries.push({ try: tries, ability: chosen, landed, events: await eventsFrom(page, logBefore) });
      lastLen = logBefore;
      if (landed) {
        await page.waitForFunction((seq) => (window.__pyrefly.snapshotState().screenState?.playback?.played ?? 0) > seq, silencedAt, { timeout: 20_000, polling: 50 }).catch(() => {});
        await sleep(350);
        await shot(page, '3-silence-landed-on-seymour.png', rec.frames, `Silence landed on Seymour Flux (status-add seq ${silencedAt}) from ${chosen}`);
        taken.landed = true;
        await watchSeymour((await readState(page)).logLen);
      } else {
        console.log(`  try ${tries} (${chosen}) did not land`);
      }
    }
    if (!rec.verdict) rec.verdict = silencedAt !== null && seySeen.size > 0 ? 'complete' : 'step-cap';
    rec.final = await readState(page).catch(() => null);
    rec.log = await page.evaluate(() => window.__pyrefly.battleLog());
    rec.pageErrors = page.errors;
    rec.silencedAt = silencedAt;
    rec.mpBefore = mpBefore;
    if ((taken.landed || CONTROL) && seySeen.size > 0) {
      await sleep(500);
      await shot(page, '5-after.png', rec.frames, `after: the next command menu (${rec.final?.actor ?? '?'}), Seymour MP ${rec.final?.seymour?.mp}, cycle ${rec.final?.cycle}`);
    }
  } catch (err) {
    rec.verdict = `error: ${String(err).slice(0, 400)}`;
    rec.pageErrors = page.errors;
    rec.log = await page.evaluate(() => window.__pyrefly.battleLog()).catch(() => null);
  } finally {
    await page.context().close();
  }
  return rec;
}

// ---------------------------------------------------------------------------------------------------------------------
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
const attempts = [];
let good = null;
try {
  for (const seed of SEEDS) {
    if (Date.now() - T0 > BUDGET_MS) { console.log('budget spent'); break; }
    console.log(`--- seed ${seed} ---`);
    for (const f of await readdir(OUT)) if (/^[1-5][a-z]?-.*.png$/.test(f)) await rm(resolve(OUT, f)); // frames of an earlier attempt do not survive into this one
    const rec = await attempt(browser, seed);
    console.log(`seed ${seed}: verdict ${rec.verdict}; silence tries ${rec.silenceTries.map((t) => `${t.ability}:${t.landed}`).join(', ') || 'none'}`);
    attempts.push({ seed: rec.seed, verdict: rec.verdict, silenceTries: rec.silenceTries.map((t) => ({ try: t.try, ability: t.ability, landed: t.landed })), seymourTurns: rec.seymourTurns ?? [] });
    if ((CONTROL && rec.verdict === 'complete') || (rec.silencedAt !== null && rec.silencedAt !== undefined && (rec.seymourTurns?.length ?? 0) > 0)) { good = rec; break; }
    if (rec.log) await writeFile(resolve(OUT, `attempt-seed-${seed}-log.json`), JSON.stringify(rec.log, null, 2));
  }
} finally {
  await browser.close();
}
const summary = { startedAt: new Date(T0).toISOString(), url: URL, attempts, chosenSeed: good?.seed ?? null, build: good?.build ?? null, keys: good?.keys ?? null, frames: good?.frames ?? null, steps: good?.steps ?? null, silenceTries: good?.silenceTries ?? null, seymourTurns: good?.seymourTurns ?? null, mpBefore: good?.mpBefore ?? null, silencedAt: good?.silencedAt ?? null, final: good?.final ?? null, pageErrors: good?.pageErrors ?? null };
await writeFile(resolve(OUT, 'run-summary.json'), JSON.stringify(summary, null, 2));
if (good?.log) await writeFile(resolve(OUT, 'battle-log.json'), JSON.stringify(good.log, null, 2));
console.log(JSON.stringify({ chosenSeed: summary.chosenSeed, attempts: attempts.map((a) => ({ seed: a.seed, verdict: a.verdict })), seymourTurns: summary.seymourTurns?.map((t) => ({ acted: t.acted, mpAtTurn: t.mpAtTurn, cycle: t.cycleAtTurn })) }, null, 1));
process.exit(good ? 0 : 2);
