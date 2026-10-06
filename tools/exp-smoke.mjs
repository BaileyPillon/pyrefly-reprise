#!/usr/bin/env node
/**
 * The real-key smoke of the experimental Leblanc chapter (branch `exp-leblanc`; FFX-2 only): a `BASE_PATH=/` build, a `vite preview` of it, and
 * a headless Playwright run that plays the chapter's first minutes by keyboard.
 *
 *   node tools/exp-smoke.mjs build                       vite build into D:/Tools/pyrefly-scratch/exp-leblanc/dist-smoke (EXP_DIST) WITHOUT copying public/
 *   node tools/exp-smoke.mjs preview [--port 4190]       vite preview of that build (foreground; stop it when done)
 *   PYREFLY_BROWSER=gpu node tools/exp-smoke.mjs run [--base http://127.0.0.1:4190/] [--out docs/screenshots/exp-leblanc] [--tag smoke]
 *
 * Why `build` does not copy `public/`: the art is 10 GB and D: is nearly full. The build is of the CODE (`vite.config.ts` through
 * `tools/exp-leblanc.vite.config.mjs`, `PYREFLY_ART_WEBP=off`, `BASE_PATH=/`); `public/art`, `audio`, `fonts` and `fx` are put beside it as
 * junctions, and the preview serves them from there. A change to the registration table (`poseRegistrationExp.ts`) or any source file needs
 * a new `build` (about 3 seconds); a new painting does not (the art is read from the junction). The junctions are removed with `rmdir`
 * (which cannot delete a folder with files, so it can never follow a link into the art) before a rebuild empties the folder.
 *
 * `run` plays: title, chapter select (the experiment is the last card: one step back from the first wraps to it), party prep, the pre-battle
 * scene, the first menu, then Attack by real keys until Yuna has acted; it takes a screenshot at each step, asserts that every figure on the
 * field is read from the experimental namespace and that a party attack landed, and lists any art request that still reads the base art.
 * Exit code 1 on a failed step. Headless only (`PYREFLY_BROWSER=gpu`); never the Chrome extension or the browser pane.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = process.env.EXP_DIST ?? 'D:/Tools/pyrefly-scratch/exp-leblanc/dist-smoke';
const CONFIG = join(REPO, 'tools', 'exp-leblanc.vite.config.mjs');
const LINKED = ['art', 'audio', 'fonts', 'fx'];
const env = { ...process.env, BASE_PATH: '/', PYREFLY_ART_WEBP: 'off' };
const nat = (p) => p.replace(/\//g, '\\');
const vite = () => [process.execPath, [join(REPO, 'node_modules', 'vite', 'bin', 'vite.js')]];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function build() {
  for (const n of LINKED) {
    const link = join(DIST, n);
    if (existsSync(link)) spawnSync('cmd', ['/c', 'rmdir', nat(link)], { stdio: 'inherit' }); // a junction: rmdir removes the link, never what it points at
  }
  const [bin, base] = vite();
  const r = spawnSync(bin, [...base, 'build', '--config', CONFIG], { cwd: REPO, env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  for (const n of LINKED) {
    const link = join(DIST, n);
    if (!existsSync(link)) {
      const m = spawnSync('cmd', ['/c', 'mklink', '/J', nat(link), nat(join(REPO, 'public', n))], { encoding: 'utf8' });
      if (m.status !== 0) throw new Error(`mklink ${link} failed: ${m.stderr || m.stdout}`);
    }
  }
  console.log(`built ${DIST} (base /, art served through junctions to ${join(REPO, 'public')})`);
}

function preview() {
  const [bin, base] = vite();
  const child = spawn(bin, [...base, 'preview', '--config', CONFIG, '--port', arg('--port', '4190'), '--strictPort'], { cwd: REPO, env, stdio: 'inherit' });
  child.on('exit', (c) => process.exit(c ?? 0));
}

async function run() {
  const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
  const BASE = arg('--base', 'http://127.0.0.1:4190/');
  const OUT = resolve(REPO, arg('--out', 'docs/screenshots/exp-leblanc'));
  const TAG = arg('--tag', 'smoke');
  mkdirSync(OUT, { recursive: true });
  const steps = [];
  const failures = [];
  const log = (k, v) => {
    steps.push({ k, v });
    console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
  };
  const check = (name, ok, detail) => {
    log(`check.${name}`, { ok, detail });
    if (!ok) failures.push(name);
  };
  const ctx = await open({ base: BASE, fresh: true });
  const { page, browser } = ctx;
  const shot = async (name) => {
    const p = join(OUT, `${TAG}-${name}.png`);
    await page.screenshot({ path: p });
    log(`shot.${name}`, p);
  };
  const requests = [];
  page.on('request', (r) => {
    if (/\/art\/(characters|backdrops)\//.test(r.url())) requests.push(r.url());
  });
  const screen = () => page.evaluate(() => window.__pyrefly.screen());
  try {
    await assertScreen(page, 'title');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await assertScreen(page, 'chapter-select');
    await page.waitForTimeout(2500);
    const selected = () => page.evaluate(() => document.querySelector('.fe-card--sel')?.getAttribute('data-card') ?? null);
    for (let attempt = 0; attempt < 4 && (await selected()) !== 'exp-leblanc'; attempt++) {
      if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
        await page.keyboard.press('Escape'); // the first-run guide of a fresh profile takes the first key
        await page.waitForTimeout(900);
      }
      await page.keyboard.press('ArrowLeft'); // one step back from the first card wraps to the last: the experiment
      await page.waitForTimeout(1500);
    }
    const board = await page.evaluate(() => {
      const sel = document.querySelector('.fe-card--sel');
      const cards = [...document.querySelectorAll('.fe-card')];
      return { selected: sel?.getAttribute('data-card') ?? null, selectedText: sel?.textContent.replace(/\s+/g, ' ').trim() ?? null, cards: cards.length, strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
    });
    log('board', board);
    check('board shows the experiment last and selected', board.selected === 'exp-leblanc' && board.cards === 19 && /Experimental: Leblanc \(new art\)/.test(board.selectedText ?? ''), board);
    check('"of 18 beaten" stays the eighteen', /of 18/.test(board.strip ?? ''), board.strip);
    await shot('2-chapter-select-experiment');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2200);
    await assertScreen(page, 'party-prep');
    await shot('3-party-prep');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await screen();
    if (s === 'cutscene') {
      await shot('4-cutscene');
      await page.keyboard.down('Enter');
      await page.waitForTimeout(7000);
      await page.keyboard.up('Enter');
      await page.waitForTimeout(600);
      s = await screen();
    }
    for (let guard = 0; s === 'cutscene' && guard < 250; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      s = await screen();
    }
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(1500);
    await shot('5-battle-first-menu');
    const field = await page.evaluate(() => {
      const st = window.__pyrefly.snapshotState();
      const sc = st?.screenState ?? {};
      return { chapter: sc.chapter, scene: sc.scene, actors: (sc.actors ?? []).map((a) => ({ id: a.id, art: a.art, placeholder: a.placeholder })) };
    });
    log('field', field);
    check('the chapter and scene are the experiment\'s', field.chapter === 'exp-leblanc' && field.scene === 'exp-leblanc-last-room', field);
    check('every figure is read from the experimental namespace', field.actors.length >= 6 && field.actors.every((a) => String(a.art).startsWith('exp-leblanc-') && a.placeholder === false), field.actors);

    // Attack by real keys until Yuna has acted: Enter takes Attack, Enter opens the target, Enter confirms it.
    const girls = ['yuna', 'rikku', 'paine'];
    const partyActions = () => page.evaluate((g) => (window.__pyrefly.battleLog?.() ?? []).filter((e) => e.type === 'action-start' && g.includes(e.actorId)).map((e) => e.actorId), girls);
    const acted = [];
    for (let round = 0; round < 8; round++) {
      const had = (await partyActions()).length;
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(800);
        if ((await partyActions()).length > had) break;
      }
      const now = await partyActions();
      acted.push(now.length > had ? now.at(-1) : null);
      if (now.length > had && now.at(-1) === 'yuna') {
        await page.waitForTimeout(250);
        await shot('7a-yuna-attack-start');
        await page.waitForTimeout(450);
        await shot('7b-yuna-attack-hit');
        break;
      }
      await page.waitForTimeout(2200);
      await waitBattleMenu(page, 60000).catch(() => null);
    }
    log('actors', acted);
    await page.waitForTimeout(1200);
    const hit = await page.evaluate((g) => (window.__pyrefly.battleLog?.() ?? []).filter((e) => e.type === 'damage' && g.includes(e.sourceId)).slice(-3).map((e) => ({ from: e.sourceId, to: e.targetId, amount: e.amount })), girls);
    check('a party attack landed', hit.length > 0, hit);

    const urls = [...new Set(requests.map((u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')))];
    const baseFigures = urls.filter((u) => /\/art\/characters\/(leblanc|logos|ormi|ffx2-dr-goon|ffx2-fem-goon)\//.test(u) && !/exp-leblanc-/.test(u));
    log('requests', { total: urls.length, experimental: urls.filter((u) => /exp-leblanc-/.test(u)).length, baseArtStillRead: urls.filter((u) => !/exp-leblanc-/.test(u)) });
    check('no fiend and no backdrop is read from the base art in battle (the story scenes\' figures are the known exception)', baseFigures.every((u) => /\/(leblanc|ormi|logos)\/idle\./.test(u)), baseFigures);
    check('no console errors', ctx.consoleErrors.length === 0, ctx.consoleErrors);
    check('no 404s', ctx.notFound.length === 0, ctx.notFound);
  } catch (e) {
    log('FAILED', String(e?.stack ?? e));
    failures.push('exception');
    try {
      await shot('z-failure');
    } catch {
      /* the page is gone */
    }
  } finally {
    writeFileSync(join(OUT, `${TAG}-log.json`), `${JSON.stringify({ base: BASE, failures, steps }, null, 1)}\n`);
    await browser.close();
  }
  console.log(failures.length ? `SMOKE FAILED: ${failures.join(', ')}` : 'SMOKE PASSED');
  process.exitCode = failures.length ? 1 : 0;
}

const cmd = process.argv[2];
if (cmd === 'build') build();
else if (cmd === 'preview') preview();
else if (cmd === 'run') await run();
else {
  console.error('usage: node tools/exp-smoke.mjs build | preview [--port N] | run [--base URL] [--out DIR] [--tag T]');
  process.exitCode = 2;
}
