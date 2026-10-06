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

/**
 * The preview's screenshots, 1600x900 JPEGs: `<out>/<tag>-<n>-<name>.jpg`. The same real-key route as `run` up to the first menu, then the debug route
 * (`autoBattle`) to carry Acts I and II to Act III's first command menu (all six figures on the field), where the keys take over again for a party
 * attack and an enemy action, and the debug route plays the fight to its victory, the story beat and the results screen.
 *
 *   PYREFLY_BROWSER=gpu node tools/exp-smoke.mjs shots --base http://127.0.0.1:4190/ [--out docs/screenshots/exp-leblanc] [--tag preview]
 */
async function runShots() {
  const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
  const BASE = arg('--base', 'http://127.0.0.1:4190/');
  const OUT = resolve(REPO, arg('--out', 'docs/screenshots/exp-leblanc'));
  const TAG = arg('--tag', 'preview');
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
    const p = join(OUT, `${TAG}-${name}.jpg`);
    await page.screenshot({ path: p, type: 'jpeg', quality: 90 });
    log(`shot.${name}`, p);
    return p;
  };
  const screen = () => page.evaluate(() => window.__pyrefly.screen());
  const arts = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.actors ?? []).map((a) => ({ id: a.id, art: a.art, placeholder: a.placeholder })));
  const actors = () => page.evaluate(() => (window.__pyrefly.snapshotState()?.screenState?.actors ?? []).map((a) => ({ id: a.id, side: a.side, art: a.art, pose: a.pose, facing: a.facing, mirrored: a.mirrored })));
  const events = () => page.evaluate(() => (window.__pyrefly.battleLog?.() ?? []).map((e) => ({ type: e.type, actorId: e.actorId ?? null, sourceId: e.sourceId ?? null, targetId: e.targetId ?? null, amount: e.amount ?? null })));
  const girls = ['yuna', 'rikku', 'paine'];
  try {
    await assertScreen(page, 'title');
    await page.evaluate(() => window.__pyrefly.setSeed(1)); // the fight is the same fight on every run
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await assertScreen(page, 'chapter-select');
    await page.waitForTimeout(2500);
    const selected = () => page.evaluate(() => document.querySelector('.fe-card--sel')?.getAttribute('data-card') ?? null);
    for (let attempt = 0; attempt < 4 && (await selected()) !== 'exp-leblanc'; attempt++) {
      if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(900);
      }
      await page.keyboard.press('ArrowLeft'); // one step back from the first card wraps to the last: the experiment
      await page.waitForTimeout(1500);
    }
    check('the board selects the experiment', (await selected()) === 'exp-leblanc', await selected());
    await page.waitForTimeout(1200);
    await shot('1-chapter-select');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2200);
    await assertScreen(page, 'party-prep');
    await shot('2-party-prep');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await screen();
    if (s === 'cutscene') {
      await page.waitForTimeout(2500);
      await shot('3-story-scene');
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
    await page.waitForTimeout(1800);
    await shot('4-act1-first-menu');

    // Acts I and II by the debug route, at a fast pace, until Act III's figures stand on the field.
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('fast');
      window.__pyrefly.autoBattle('intended');
    });
    await waitFor('Act III on the field', async () => (await arts()).some((a) => a.art === 'exp-leblanc-leblanc'), { ms: 240000, pollMs: 60 });
    await page.evaluate(() => {
      window.__pyrefly.battle().battlePresenter.setAutoPlay(null); // the keys take over
      window.__pyrefly.setBattleSpeed('normal');
    });
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2600);
    const six = await arts();
    log('field.act3', six);
    const want = ['exp-leblanc-yuna-gunner', 'exp-leblanc-rikku-thief', 'exp-leblanc-paine-warrior', 'exp-leblanc-leblanc', 'exp-leblanc-logos', 'exp-leblanc-ormi'];
    check('Act III stages the six figures from the experiment', want.every((w) => six.some((a) => a.art === w && a.placeholder === false)), six);
    await shot('5-act3-first-menu');
    await page.evaluate(() => window.__pyrefly.trigger('hud:off'));
    await page.waitForTimeout(1000);
    await shot('5b-act3-first-menu-clean');
    await page.evaluate(() => window.__pyrefly.trigger('hud:on'));
    await page.waitForTimeout(800);

    // The facing decisions, read off the live stage: every figure of the experiment stands turned toward the other side and none is drawn mirrored
    // (the girls' paintings face right, the fiends' face left, so the engine's mirror (`mirrorFor`) never flips one).
    const stage = await actors();
    log('stage.act3', stage);
    check('every figure faces its opponents and none is drawn mirrored', stage.length >= 6 && stage.every((a) => a.mirrored === false && a.facing === (a.side === 'party' ? 1 : -1)), stage);

    // A party attack, an enemy action and a hit by real keys: Enter takes Attack, Enter opens the target, Enter confirms it; the frames are taken
    // the moment a figure strikes its attack or cast pose (the stage's own snapshot says which pose each figure is in).
    const acted = { party: null, enemy: null, hurt: null };
    for (let round = 0; round < 26 && !(acted.party && acted.enemy); round++) {
      await waitBattleMenu(page, 90000).catch(() => null);
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(650);
      }
      const t0 = Date.now();
      while (Date.now() - t0 < 7000 && !(acted.party && acted.enemy)) {
        const now = await actors();
        const girl = now.find((a) => girls.includes(a.id) && (a.pose === 'attack' || a.pose === 'cast'));
        if (girl && !acted.party) {
          await page.waitForTimeout(170);
          await shot('6-party-attack');
          acted.party = { id: girl.id, pose: girl.pose, art: girl.art };
        }
        const foe = now.find((a) => a.side === 'enemy' && (a.pose === 'attack' || a.pose === 'cast'));
        if (foe && !acted.enemy) {
          await page.waitForTimeout(170);
          await shot('7-enemy-action');
          acted.enemy = { id: foe.id, pose: foe.pose, art: foe.art };
        }
        const hit = now.find((a) => girls.includes(a.id) && a.pose === 'hurt');
        if (hit && !acted.hurt) {
          await page.waitForTimeout(100);
          await shot('7b-party-hurt');
          acted.hurt = { id: hit.id, pose: hit.pose, art: hit.art };
        }
        await page.waitForTimeout(50);
      }
    }
    log('acted', acted);
    check('a party attack and an enemy action were photographed', !!(acted.party && acted.enemy), acted);

    // Victory, played to the end by the debug route.
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('fast');
      window.__pyrefly.autoBattle('intended');
    });
    await waitFor('the victory', async () => (await events()).some((e) => e.type === 'victory'), { ms: 240000, pollMs: 200 });
    await page.evaluate(() => window.__pyrefly.setBattleSpeed('normal'));
    // The victory frame: once the party has struck its victory pose (the stage's own snapshot), a moment for it to settle.
    const poseT0 = Date.now();
    let victors = [];
    while (Date.now() - poseT0 < 14000 && victors.length < 2) {
      victors = (await actors()).filter((a) => girls.includes(a.id) && a.pose === 'victory');
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(900);
    log('victory.poses', (await actors()).map((a) => ({ id: a.id, pose: a.pose, life: a.life })));
    await shot('8-victory');
    let end = await screen();
    for (let guard = 0; end !== 'results' && guard < 160; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      end = await screen();
    }
    await page.waitForTimeout(2800);
    check('the results screen follows the victory', (await screen()) === 'results', await screen());
    await shot('9-results');
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
  console.log(failures.length ? `SHOTS FAILED: ${failures.join(', ')}` : 'SHOTS DONE');
  process.exitCode = failures.length ? 1 : 0;
}

const cmd = process.argv[2];
if (cmd === 'build') build();
else if (cmd === 'preview') preview();
else if (cmd === 'run') await run();
else if (cmd === 'shots') await runShots();
else {
  console.error('usage: node tools/exp-smoke.mjs build | preview [--port N] | run [--base URL] [--out DIR] [--tag T] | shots [--base URL] [--out DIR] [--tag T]');
  process.exitCode = 2;
}
