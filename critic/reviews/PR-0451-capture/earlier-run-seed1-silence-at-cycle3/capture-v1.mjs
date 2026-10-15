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
import { mkdir, writeFile } from 'node:fs/promises';
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
    let silencedAt = null; // log index of the status-add that put Silence on Seymour
    let mpBefore = null;
    let cycleBefore = null;
    let tries = 0;
    let postSilenceSeymourTurns = 0;
    let seyShots = 0;
    let framesTaken = { choose: false, target: false, landed: false, refused: false, after: false };

    for (let step = 0; step < 60; step++) {
      if (Date.now() - T0 > BUDGET_MS) { rec.verdict = 'budget'; break; }
      const s = await nextMenu(page, lastLen);
      lastLen = s.logLen;
      const silenced = 'silence' in s.seymour.statuses;
      rec.steps.push({ step, actor: s.actor, rows: s.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join('|'), seymourMp: s.seymour.mp, seymourStatuses: Object.keys(s.seymour.statuses), cycle: s.cycle, active: s.activeIds, logLen: s.logLen });
      dbg(`step ${step}: ${s.actor} cycle=${s.cycle} sey=${Object.keys(s.seymour.statuses)} rows=${s.rows.map((r) => r.label).join('|')}`);
      if (s.result) { rec.verdict = 'battle-over'; break; }

      if (!silenced && silencedAt === null && tries < 5) {
        if (s.actor !== 'wakka') {
          if (!s.activeIds.includes('wakka')) {
            // L1 (KeyF) opens the party swap straight into the reserve list; Wakka takes this turn at once.
            await key(page, 'f', 500);
            if (!(await pickRow(page, 'Wakka'))) { rec.verdict = 'wakka-not-in-swap-list'; break; }
            await key(page, 'Enter', 600);
            lastLen = s.logLen; // the swap writes a log event and Wakka's menu follows
            continue;
          }
          await key(page, 'q', 400); // Defend
          continue;
        }
        // Wakka's turn: Skill -> Silence Buster / Silence Attack -> Seymour Flux.
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
        if (!framesTaken.choose) { await shot(page, '1-silence-command-chosen.png', rec.frames, `Wakka's Skill list, ${chosen} highlighted (the Silence command being chosen)`); framesTaken.choose = true; }
        mpBefore = s.seymour.mp;
        cycleBefore = s.cycle;
        await key(page, 'Enter', 700);
        // Target step: make sure the bracket is on Seymour Flux, not the Mortiorchis.
        let name = await targetName(page);
        for (let k = 0; k < 4 && name && !/seymour/i.test(name); k++) { await key(page, 'ArrowRight', 300); name = await targetName(page); }
        dbg(`target: ${name}`);
        if (!framesTaken.target) { await shot(page, '2-silence-target-seymour.png', rec.frames, `target step: ${chosen} aimed at ${name}`); framesTaken.target = true; }
        const logBefore = (await readState(page)).logLen;
        await key(page, 'Enter', 200);
        tries += 1;
        // Watch the result of the command as the presenter plays it.
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
        if (landed) {
          // wait until the presenter has played the status event, then take the frame
          await page.waitForFunction((seq) => (window.__pyrefly.snapshotState().screenState?.playback?.played ?? 0) > seq, silencedAt, { timeout: 20_000, polling: 50 }).catch(() => {});
          await sleep(350);
          await shot(page, '3-silence-landed-on-seymour.png', rec.frames, `Silence landed on Seymour Flux (status-add seq ${silencedAt}) by ${chosen}`);
          framesTaken.landed = true;
        } else {
          console.log(`  try ${tries} (${chosen}) did not land`);
        }
        lastLen = logBefore;
        continue;
      }

      // Silence is on (or we have given up): Defend with everyone and watch for Seymour's next turns.
      if (silencedAt !== null) {
        const ev = await eventsFrom(page, silencedAt);
        const seyTurns = ev.filter((e) => e.type === 'turn-start' && e.actorId === SYMOUR);
        postSilenceSeymourTurns = seyTurns.length;
        if (seyTurns.length >= 3 || !('silence' in s.seymour.statuses)) {
          // Seymour has had his turns under Silence (or it wore off): the capture is complete.
          rec.verdict = rec.verdict ?? 'complete';
          break;
        }
      } else if (tries >= 5) { rec.verdict = 'silence-never-landed'; break; }

      // Defend, watching for Seymour's turn-start as the log grows.
      const lenBefore = s.logLen;
      if (silencedAt !== null) {
        mpBefore = mpBefore ?? s.seymour.mp;
      }
      await key(page, 'q', 100);
      const t = Date.now();
      let handled = 0;
      const seen = new Set();
      while (Date.now() - t < 30_000) {
        const ev = await eventsFrom(page, lenBefore);
        const st = await readState(page);
        const turn = ev.find((e) => e.type === 'turn-start' && e.actorId === SYMOUR && !seen.has(e.seq) && e.seq > (silencedAt ?? 0));
        if (turn) {
          seen.add(turn.seq);
          const after = ev.filter((e) => e.seq > turn.seq);
          const nextAction = after.find((e) => e.type === 'action-start' || e.type === 'turn-start');
          const acted = nextAction && nextAction.type === 'action-start' && nextAction.actorId === SYMOUR ? nextAction : null;
          // Frame at the moment the presenter reaches this turn.
          await page.waitForFunction((seq) => (window.__pyrefly.snapshotState().screenState?.playback?.played ?? 0) > seq, turn.seq, { timeout: 15_000, polling: 40 }).catch(() => {});
          const mp = (await readState(page)).seymour.mp;
          seyShots += 1;
          const letter = String.fromCharCode(96 + seyShots);
          const fname = acted ? `4${letter}-seymour-turn-${(acted.abilityName ?? 'action').replace(/\W+/g, '-').toLowerCase()}.png` : `4${letter}-seymour-turn-refused.png`;
          await shot(page, fname, rec.frames, acted ? `Seymour's turn (seq ${turn.seq}) under Silence: action-start ${acted.abilityName} (MP ${mp}, cycle ${st.cycle})` : `Seymour's turn (seq ${turn.seq}) under Silence: NO action-start follows (MP ${mp}, cycle ${st.cycle})`);
          rec.seymourTurns = rec.seymourTurns ?? [];
          rec.seymourTurns.push({ turnSeq: turn.seq, acted: acted ? acted.abilityName : null, mpAtTurn: mp, cycleAtTurn: st.cycle, mpBefore, cycleBefore, eventsAfter: after.slice(0, 8) });
          handled += 1;
        }
        if (st.awaitingMenu && st.logLen > lenBefore) break;
        await sleep(50);
      }
    }
    if (!rec.verdict) rec.verdict = 'step-cap';
    rec.final = await readState(page).catch(() => null);
    rec.log = await page.evaluate(() => window.__pyrefly.battleLog());
    rec.pageErrors = page.errors;
    rec.silencedAt = silencedAt;
    rec.mpBefore = mpBefore;
    if (framesTaken.landed) {
      // one more frame a moment later, once the turn has resolved
      await sleep(600);
      await shot(page, '5-after.png', rec.frames, 'after: the fight a moment later');
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
    const rec = await attempt(browser, seed);
    console.log(`seed ${seed}: verdict ${rec.verdict}; silence tries ${rec.silenceTries.map((t) => `${t.ability}:${t.landed}`).join(', ') || 'none'}`);
    attempts.push({ seed: rec.seed, verdict: rec.verdict, silenceTries: rec.silenceTries.map((t) => ({ try: t.try, ability: t.ability, landed: t.landed })), seymourTurns: rec.seymourTurns ?? [] });
    if (rec.silencedAt !== null && rec.silencedAt !== undefined && (rec.seymourTurns?.length ?? 0) > 0) { good = rec; break; }
  }
} finally {
  await browser.close();
}
const summary = { startedAt: new Date(T0).toISOString(), url: URL, attempts, chosenSeed: good?.seed ?? null, build: good?.build ?? null, keys: good?.keys ?? null, frames: good?.frames ?? null, steps: good?.steps ?? null, silenceTries: good?.silenceTries ?? null, seymourTurns: good?.seymourTurns ?? null, mpBefore: good?.mpBefore ?? null, silencedAt: good?.silencedAt ?? null, final: good?.final ?? null, pageErrors: good?.pageErrors ?? null };
await writeFile(resolve(OUT, 'run-summary.json'), JSON.stringify(summary, null, 2));
if (good?.log) await writeFile(resolve(OUT, 'battle-log.json'), JSON.stringify(good.log, null, 2));
console.log(JSON.stringify({ chosenSeed: summary.chosenSeed, attempts: attempts.map((a) => ({ seed: a.seed, verdict: a.verdict })), seymourTurns: summary.seymourTurns?.map((t) => ({ acted: t.acted, mpAtTurn: t.mpAtTurn, cycle: t.cycleAtTurn })) }, null, 1));
process.exit(good ? 0 : 2);
