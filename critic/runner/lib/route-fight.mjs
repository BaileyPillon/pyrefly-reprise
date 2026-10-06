// Route driver: the fight loop (one attempt), by real input.
//
// Promoted from critic/rounds/round-13/cap/route.mjs (batch t1-b5). What changed:
//   - picks go through `makeChooser` (route-ui.mjs), so the Chapter VIII Orders
//     widget (PULL BACK / CLOSE IN) is chosen like any other menu, a target is
//     confirmed only when a cursor is up, and touch taps rows and reticles;
//   - PR-0202: the engine's own seed (`battleState().seed`) is recorded at every
//     link seam, and the first enemy action of the attempt is kept, so two
//     routes on one pinned seed can be compared;
//   - PR-0213: the mid-fight capture resumes from the pause first and asserts
//     screen=battle; it is retried on later turns rather than shot in pause;
//   - PR-0225 (round 15, promoted from critic/rounds/round-15/cap/lib): a menu row
//     that opens an Overdrive/Grand Summon picker is played with arrows + Enter on
//     the row the advisor names (it was cancelled and replaced by Attack); an open
//     overlay with nothing choosable is escaped and recorded (rec.escapes) instead
//     of polled forever; a wrong-target confirm is recorded (rec.targetMismatches).
//   - PR-0261 (round 19): the Bushido chips and the Swordplay zone on screen are played by real input
//     (route-minigame.mjs; the old Enter after 3 s was 0 correct inputs); the outcome is derived from the
//     final screen and the engine result, and a fight that never finished is 'stalled at link N, <phase>'.
// Both games: shared critic plumbing.
import fs from 'node:fs';
import path from 'node:path';

import { playMinigame } from './route-minigame.mjs';
import { deriveOutcome } from './route-pure.mjs';
import { battleSeedRead, isAllDisabledOverlay, measureCardVsRows, readAdvice, readRows, targetsUp } from './route-ui.mjs';

/**
 * Plays one attempt until the battle screen is left or the budget runs out.
 * `r` is the route context from route.mjs: { page, input, chooser, snap, seq, aud, note, rec, goal, game, budget, env }.
 */
export async function playFight(r) {
  const { page, input, chooser, snap, seq, aud, note, rec, goal, game, budget, env } = r;
  const scr = () => page.evaluate(() => window.__pyrefly.screen());
  const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
  const pbk = async () => (await ss())?.playback ?? null;
  const txt = (sel = '#ui', n = 800) => page.evaluate(([s, k]) => (document.querySelector(s)?.innerText ?? '').replace(/\s+/g, ' ').slice(0, k), [sel, n]);
  const escPause = async () => { for (let i = 0; i < 4 && (await scr()) === 'pause'; i++) { await input.press('Escape'); await page.waitForTimeout(700); } };

  const tb = Date.now();
  let turns = 0; let lastLinks = rec.firstState?.links ?? 1; let enemySeq = false; let attackSeq = false; let allTargetShot = false;
  let changed = false; let lastHpSig = ''; let idleSince = Date.now(); let bestLog = []; let lastLogPull = 0; let pendingSeam = null;
  let midfightDone = false; let firstEnemy = null;
  rec.seamCard = []; rec.pauseRecoveries = 0; rec.misses = []; rec.orders = []; rec.escapes = []; rec.targetMismatches = []; rec.pickerPlays = [];
  /** Records a target confirm; a confirm on something other than the wanted target is kept in rec.targetMismatches. */
  const noteTarget = (c, adv) => { if (c?.mismatch || c?.unresolved) rec.targetMismatches.push({ turn: turns, want: adv?.target ?? null, ...c }); return c; };
  /** Backs out of an open menu with nothing choosable in it, and records that it did (PR-0225 issue 2). */
  const escapeDeadMenu = async (why, rowsNow) => {
    rec.escapes.push({ turn: turns, ms: Date.now() - tb, why, rows: rowsNow.map((x) => `${x.label}${x.disabled ? ' (disabled)' : ''}`) });
    if (rec.escapes.length === 1) await snap(`${r.pref ?? ''}27-dead-menu-escaped.png`, `an open menu with nothing choosable, before Escape (${why})`, { screen: 'battle' });
    await input.press('Escape'); await page.waitForTimeout(400);
  };

  // r391: a watchdog on the battle log. A fight in which nothing happens for STALL_MS (the route waiting in a submenu it cannot leave, a menu that wants
  // an item it cannot reach) used to wait out the whole budget, 15 minutes in round 22's Chapter VI (PR-0348); now it backs out of the menus, and after
  // STALL_TRIES backings-out with still nothing it gives the fight up as stalled. Time in the pause is not stall time (`lastLogAt` moves with the pause).
  const STALL_MS = Number(process.env.ROUTE_STALL_MS ?? 120000), STALL_TRIES = 3;
  let lastLogLen = -1, lastLogAt = Date.now(), stallTries = 0;
  rec.stallRecoveries = 0;

  while (['battle', 'pause'].includes(await scr()) && Date.now() - tb < budget) {
    if ((await scr()) === 'pause') { rec.pauseRecoveries++; lastLogAt = Date.now(); await input.press('Escape'); await page.waitForTimeout(700); continue; }
    if (Date.now() - lastLogPull > 4000) {
      lastLogPull = Date.now();
      const l = await page.evaluate(() => { try { return window.__pyrefly.battleLog() ?? []; } catch { return []; } });
      if (l.length >= bestLog.length) bestLog = l;
      if (l.length !== lastLogLen) { lastLogLen = l.length; lastLogAt = Date.now(); }
    }
    if (Date.now() - lastLogAt > STALL_MS) {
      stallTries++; rec.stallRecoveries = stallTries;
      note('stallRecovery', { n: stallTries, quietMs: Date.now() - lastLogAt, rows: (await readRows(page)).map((x) => x.label).slice(0, 12), phase: (await ss())?.playback?.phase ?? null });
      if (stallTries === 1) await snap(`${r.pref ?? ''}27b-stalled-menu.png`, 'the fight made no progress for two minutes (a submenu the route could not leave?), before it backed out', { screen: 'battle' });
      if (stallTries > STALL_TRIES) { rec.stuckStop = `no battle event for ${Math.round((Date.now() - lastLogAt) / 1000)} s after ${STALL_TRIES} recoveries`; break; }
      for (let i = 0; i < 3; i++) { await input.press('Escape'); await page.waitForTimeout(500); }
      await escPause();
      lastLogAt = Date.now();
      continue;
    }
    if (!firstEnemy) {
      const sr = await battleSeedRead(page);
      if (sr.firstEnemyAction) { firstEnemy = sr.firstEnemyAction; rec.firstEnemyAction = firstEnemy; note('firstEnemyAction', firstEnemy); }
    }
    const s = await ss();
    if (s?.links) rec.lastChain = { links: s.links, chainLength: s.chainLength ?? null, phase: s.playback?.phase ?? '', turn: turns, ms: Date.now() - tb };
    if (s?.links && s.links !== lastLinks) {
      rec.seams.push({ from: lastLinks, to: s.links, ms: Date.now() - tb, phase: s.playback?.phase });
      await seq(`seq-seam-${s.links}`, 8, 300, `chain seam ${lastLinks} -> ${s.links} (phase change)`);
      pendingSeam = s.links; lastLinks = s.links;
      await aud(`seam-${s.links}`);
      for (const dt of [1500, 3000]) { await page.waitForTimeout(1500); await aud(`seam-${s.links}+${dt}`); }
      rec.battleSeeds.push({ at: `link ${s.links}`, ...(await battleSeedRead(page)) });
      await snap(`20-link-${s.links}.png`, `fight, encounter link ${s.links} of ${s.chainLength}`, { screen: 'battle', links: s.links });
    }
    const ph = s?.playback?.phase ?? '';
    const lastEv = s?.playback?.lastEvents?.slice(-1)[0]?.type ?? '';
    if (!enemySeq && !s?.playback?.awaitingMenu && /action-start|ability|damage/.test(lastEv) && !/command/.test(ph) && turns > 0) {
      enemySeq = true; await seq('seq-action-playing', 10, 180, `an action playing out (${ph})`);
    }
    // A chooser overlay that waits for the player (the Ronso Rage picker): confirm it, as a player would.
    if (!s?.playback?.awaitingMenu && /minigame/.test(ph)) {
      const shot = (kind, label) => snap(`${r.pref ?? ''}28-${kind}-overlay.png`, label, { screen: 'battle' });
      if (await playMinigame({ page, input, rec, turn: turns, shot })) { rec.mgSince = null; continue; } // Bushido / Swordplay: typed as shown
    }
    if (!s?.playback?.awaitingMenu && ph === 'hud:minigame-request') { // any other overlay (reels, fury, Mix, a picker): the old Enter after 3 s
      rec.mgSince = rec.mgSince ?? Date.now();
      if (Date.now() - rec.mgSince > 3000) { rec.mgConfirms = (rec.mgConfirms ?? 0) + 1; note('minigameConfirm', { after: Date.now() - rec.mgSince }); await input.press('Enter'); rec.mgSince = null; }
    } else rec.mgSince = null;
    if (!s?.playback?.awaitingMenu) {
      await page.waitForTimeout(250);
      if (goal === 'lose' && game === 'ffx2') {
        const sig = JSON.stringify(Object.values(s?.battle?.combatants ?? {}).map((c) => c.hp));
        if (sig !== lastHpSig) { lastHpSig = sig; idleSince = Date.now(); }
        if (Date.now() - idleSince > 90000) { note('idleNoProgress', { phase: ph }); break; }
      }
      continue;
    }
    if (goal === 'lose' && game === 'ffx2') { // idle under ACTIVE: let the enemy act
      const sig = JSON.stringify(Object.values(s.battle?.combatants ?? {}).map((c) => c.hp));
      if (sig !== lastHpSig) { lastHpSig = sig; idleSince = Date.now(); }
      if (Date.now() - idleSince > 90000) { note('idleNoProgress', { phase: ph }); break; }
      await page.waitForTimeout(700); continue;
    }
    if (pendingSeam) {
      await page.waitForTimeout(900);
      const m = await measureCardVsRows(page);
      rec.seamCard.push({ link: pendingSeam, actor: ph, ...m });
      await snap(`24-seam-${pendingSeam}-first-menu.png`, `first command menu after chain seam into link ${pendingSeam}`, { screen: 'battle', awaitingMenu: true, links: pendingSeam }, { pr0091: m });
      pendingSeam = null;
    }
    let adv = goal === 'win' ? await readAdvice(page) : null;
    if (adv && env.FOCUS && env.AVOID && new RegExp(env.AVOID, 'i').test(adv.target ?? '')) { rec.refocus = (rec.refocus ?? 0) + 1; adv = { ...adv, target: env.FOCUS }; }
    if (game === 'ffx2' && goal === 'win' && !changed && turns >= 2 && !env.NOCHANGE) { // a scripted spherechange once, with real input
      changed = true;
      if (await chooser.choose((l) => /^change$/i.test(l))) {
        rec.changeText = await txt('#ui', 800);
        await snap('21-change-open.png', 'CHANGE opened (Garment Grid)', { screen: 'battle' });
        await input.press('ArrowRight'); await page.waitForTimeout(300); await input.press('Enter'); await page.waitForTimeout(250);
        await seq('seq-spherechange', 10, 200, 'a spherechange chosen by real input');
        rec.changeResult = await page.evaluate(() => (window.__pyrefly.battleLog() ?? []).filter((e) => /sphere|dress|change/i.test(e.type)).slice(-3));
        await escPause(); turns++; continue;
      }
    }
    const rows = await readRows(page);
    if (!rows.length) {
      // A target cursor left open (a tap a coach layer swallowed, or a scripted line): confirm it, as a player would.
      const up = await targetsUp(page);
      rec.emptyMenuPolls = (rec.emptyMenuPolls ?? 0) + 1;
      if ((up.n || up.selecting) && rec.emptyMenuPolls % 8 === 0) { note('openCursorConfirm', { phase: ph, coach: await page.evaluate(() => document.querySelectorAll('.coach-mark').length) }); await input.press('Enter'); }
      await page.waitForTimeout(300); continue;
    }
    const pick = { turn: turns, ms: Date.now() - tb, actor: ph, want: adv, took: null, viaMenu: null };
    // What the engine actually did since the last pick: the record of truth when a row read goes wrong.
    const did = await page.evaluate((after) => {
      const st = window.__pyrefly.battleState();
      const cs = st?.combatants ?? {};
      return (st?.log ?? []).filter((e) => e.type === 'action-start' && e.seq > after && cs[e.actorId]?.side !== 'enemy').map((e) => ({ seq: e.seq, actor: e.actorId, did: e.abilityName ?? e.command?.kind ?? null, targets: e.targets }));
    }, rec.lastPartySeq ?? -1).catch(() => []);
    if (did.length) { rec.lastPartySeq = did[did.length - 1].seq; const prev = rec.picks[rec.picks.length - 1]; if (prev) prev.engineDid = did; }
    let took = null;
    if (goal === 'win' && adv && /^doublecast/i.test(adv.label ?? '') && (rec.dcFail ?? 0) < 2) { // Special > Doublecast > spell x2
      const spell = (adv.label.split(':')[1] ?? '').trim().toLowerCase();
      const dc = { turn: turns, actor: ph, want: adv, steps: [] };
      if (await chooser.choose((l) => /^special$/i.test(l))) {
        const h = await chooser.choose((l) => /^doublecast/i.test(l));
        dc.steps.push({ found: h });
        for (let k = 0; h && k < 2; k++) {
          const sp = spell ? await chooser.choose((l) => l.toLowerCase().includes(spell)) : null;
          dc.steps.push({ k, spell: sp });
          if (!sp) break;
          noteTarget(await chooser.confirmTarget(adv.target), adv); await page.waitForTimeout(700);
          if (!(await pbk())?.awaitingMenu) break;
        }
      }
      await page.waitForTimeout(2500);
      (rec.doublecast = rec.doublecast ?? []).push(dc);
      if (rec.doublecast.length === 1) await snap('25-doublecast.png', 'after a Doublecast chosen by real input', {});
      await escPause();
      if (!dc.steps.some((x) => x.spell)) { rec.dcFail = (rec.dcFail ?? 0) + 1; for (let i = 0; i < 3 && (await pbk())?.awaitingMenu; i++) { await input.press('Escape'); await page.waitForTimeout(400); } }
      turns++; continue;
    }
    const deadRows = new Set(); // command rows whose list proved to have nothing choosable this turn (PR-0225)
    if (goal === 'lose') {
      // Lose route: Defend (top level, else FFX's Special > Defend); then a standing order in Chapter VIII; then Attack below.
      took = await chooser.choose((l) => /^defend$/i.test(l));
      if (!took && rows.some((r) => /^special$/i.test(r.label) && !r.disabled) && (await chooser.choose((l) => /^special$/i.test(l)))) {
        if (!(await readRows(page)).length) took = 'Special (a one-item group: it resolved on Enter)';
        else {
          took = await chooser.choose((l) => /^defend$/i.test(l));
          if (took) pick.viaMenu = 'Special'; else { await input.press('Escape'); await page.waitForTimeout(350); }
        }
      }
      if (!took && rows.some((r) => /^orders$/i.test(r.label) && !r.disabled)) {
        if (await chooser.choose((l) => /^orders$/i.test(l))) { pick.viaMenu = 'Orders'; if (!rec.ordersShot) rec.ordersShot = await snap('26-orders-widget.png', 'Chapter VIII Orders widget open by real input (lose route)', { screen: 'battle', awaitingMenu: true }); took = await chooser.choose(() => true); if (!took) { deadRows.add('Orders'); await escapeDeadMenu('Orders: every order disabled (one standing, or already there)', await readRows(page)); } else rec.orders.push({ turn: turns, order: took, why: 'lose route' }); }
      }
    } else if (adv) {
      const before = JSON.stringify(rows.map((x) => x.label));
      let opened = null; let direct = false;
      if (adv.menu && (await chooser.choose((l) => l.toUpperCase() === adv.menu.toUpperCase()))) {
        opened = adv.menu;
        let rr = await readRows(page);
        if (rr.some((x) => x.overlay) && !rec.ordersShot) rec.ordersShot = await snap('26-orders-widget.png', `Chapter VIII Orders widget open by real input (${rr.map((x) => x.label).join(' / ')})`, { screen: 'battle', awaitingMenu: true });
        if (/overdrive/i.test(adv.menu) && /kimahri/.test(ph) && JSON.stringify(rr.map((x) => x.label)) === before) { rec.rageSecondEnter = (rec.rageSecondEnter ?? 0) + 1; await input.press('Enter'); await page.waitForTimeout(650); rr = await readRows(page); }
        if (JSON.stringify(rr.map((x) => x.label)) === before || (await targetsUp(page)).n > 0) direct = true; // a one-item group resolves straight from the top row
      }
      pick.viaMenu = opened;
      // PR-0225 (round 15 patch, promoted): a menu row that opens an Overdrive picker or minigame overlay
      // directly (Yuna's Grand Summon list, an aeon's Overdrive, Wakka's reels) leaves no command rows.
      // The promoted harness then pressed Escape (cancelling the picker) and fell back to Attack: in
      // round 15's first Chapter II run, 14 of 14 Grand Summons were thrown away that way. Play the
      // picker as a player would: arrow to the aeon the card names if the list shows it, then Enter.
      if (opened && !direct) {
        const mg = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('.ffx-mg-list__row')].map((r) => ({ t: r.textContent.trim(), sel: r.classList.contains('ffx-mg-list__row--selected') }));
          const up = !!document.querySelector('.ffx-mg-list, [class*="ffx-mg"], [class*="od-overlay"], [class*="overdrive-overlay"]') || window.__pyrefly.snapshotState()?.screenState?.playback?.phase === 'hud:minigame-request';
          return { up, rows, card: (document.querySelector('.mad__card')?.innerText ?? '').replace(/\s+/g, ' ') };
        });
        if (mg.up && !(await readRows(page)).length) {
          let chosen = null;
          if (mg.rows.length) {
            const hay = `${adv.label ?? ''} ${adv.target ?? ''} ${mg.card}`.toLowerCase();
            const want = mg.rows.findIndex((r) => hay.includes(r.t.replace(/×2$/, '').trim().toLowerCase()));
            const cur = Math.max(0, mg.rows.findIndex((r) => r.sel));
            const idx = want >= 0 ? want : cur;
            for (let k = 0; k < Math.abs(idx - cur); k++) { await input.press(idx > cur ? 'ArrowDown' : 'ArrowUp'); await page.waitForTimeout(150); }
            chosen = mg.rows[idx]?.t ?? null;
            await input.press('Enter'); await page.waitForTimeout(700);
          }
          rec.pickerPlays.push({ turn: turns, want: adv, list: mg.rows.map((r) => r.t), chosen, why: mg.rows.length ? 'list picker: row chosen by arrows + Enter' : 'non-list overlay: left to the minigame handler' });
          rec.picks.push({ ...pick, took: `${adv.label} (picker opened${chosen ? `: ${chosen}` : ''})`, target: { confirmed: Boolean(chosen), picker: true } });
          turns++; continue;
        }
      }
      if (direct) {
        const c = noteTarget(await chooser.confirmTarget(adv.target), adv);
        rec.picks.push({ ...pick, took: `${adv.label} (one-item group, direct)`, target: c });
        await page.waitForTimeout(700); turns++; continue;
      }
      const w = (adv.label ?? '').toLowerCase();
      took = w ? await chooser.choose((l) => l.toLowerCase() === w || l.toLowerCase().includes(w)) : null;
      if (took && /^orders$/i.test(opened ?? '')) rec.orders.push({ turn: turns, order: took, why: 'advisor' });
      if (!took && opened) { rec.misses.push({ turn: turns, want: adv, subRows: await readRows(page) }); await input.press('Escape'); await page.waitForTimeout(350); }
      else if (!took) rec.misses.push({ turn: turns, want: adv, topRows: rows });
      if (!took && !opened && adv.label && (await chooser.choose((l) => /^items?$/i.test(l)))) { // the card named an item with no "in Item" chip
        took = await chooser.choose((l) => l.toLowerCase() === w || l.toLowerCase().includes(w));
        if (took) { pick.viaMenu = 'Item (harness fallback, no chip)'; rec.itemFallback = (rec.itemFallback ?? 0) + 1; } else { await input.press('Escape'); await page.waitForTimeout(350); }
      }
    }
    if (!took) took = await chooser.choose((l) => /^attack$/i.test(l));
    if (!took && goal === 'lose') { // nothing harmless is enabled (VIII at range with an order standing): the first enabled row that has something in it
      for (let k = 0; k < rows.length && !took; k++) {
        const first = await chooser.choose((l) => !deadRows.has(l));
        if (!first) break;
        const inner = await readRows(page);
        if (isAllDisabledOverlay(inner)) { deadRows.add(first); await escapeDeadMenu(`${first} opened a list with every row disabled`, inner); continue; }
        took = inner.length && !(await targetsUp(page)).n ? `${first} > ${(await chooser.choose(() => true)) ?? 'none'}` : first;
      }
    }
    // PR-0225 (round 15 patch, promoted): a menu where nothing could be chosen, again and again (Chapter VIII lose route,
    // round 15: 393 empty picks, engine frozen at turn 15). Capture it once and stop after 25.
    if (!took) {
      rec.emptyPicks = (rec.emptyPicks ?? 0) + 1;
      if (rows.some((x) => x.overlay) && isAllDisabledOverlay(rows)) await escapeDeadMenu('every row disabled, nothing chosen', rows);
      if (rec.emptyPicks === 3) {
        rec.stuckRows = await page.evaluate(() => [...document.querySelectorAll('.ig-cmd-stack')].map((s) => ({ cls: s.className, vis: s.getBoundingClientRect().width > 0 && getComputedStyle(s).display !== 'none', rows: [...s.querySelectorAll('.ig-cmd')].map((r) => `${r.className} :: ${r.textContent.replace(/\s+/g, ' ').trim()}`) })));
        rec.stuckState = await page.evaluate(() => { const s = window.__pyrefly.snapshotState(); return { screen: s?.screen, playback: s?.screenState?.playback ? { phase: s.screenState.playback.phase, awaitingMenu: s.screenState.playback.awaitingMenu } : null }; });
        await snap(`${r.pref ?? ''}27-no-choosable-row.png`, 'a command menu where the lose route found no row it could choose', { screen: 'battle' });
      }
      if (rec.emptyPicks >= 25) { rec.stuckStop = true; break; }
    } else rec.emptyPicks = 0;
    pick.took = took;
    pick.engineHp = Object.values(s?.battle?.combatants ?? {}).map((c) => `${c.id}:${c.hp}/${c.maxHp}`);
    const tg = await targetsUp(page);
    if (!allTargetShot && tg.n >= 2 && tg.lit >= 2) { allTargetShot = true; await snap('22-target-all.png', `multi-target selection (${adv?.label} -> ${adv?.target})`, { screen: 'battle', targeting: true }, { lit: `${tg.lit}/${tg.n}` }); }
    pick.target = noteTarget(await chooser.confirmTarget(adv?.target ?? null), adv);
    rec.picks.push(pick);
    if (!attackSeq) { attackSeq = true; await seq('seq-party-action', 10, 180, `a party command resolving (${took})`); } else await page.waitForTimeout(600);
    turns++;
    if (turns >= 3 && !midfightDone) { // PR-0213: never shoot "mid-fight" in the pause
      await escPause();
      if ((await scr()) === 'battle') midfightDone = await snap('23-midfight.png', `mid-fight after ${turns} real commands`, { screen: 'battle' });
    }
    if (turns > 400) break;
  }
  return { turns, ms: Date.now() - tb, bestLog };
}

/** Writes the attempt's logs and returns the outcome read from the engine log. */
export async function closeFight(r, { turns, ms, bestLog }) {
  const { page, rec, evidence, dir, pref, note } = r;
  rec.turns = turns; rec.fightMs = ms; rec.afterFight = await page.evaluate(() => window.__pyrefly.screen());
  let log = await page.evaluate(() => { try { return window.__pyrefly.battleLog() ?? []; } catch { return []; } });
  if (log.length < bestLog.length) log = bestLog;
  const end = deriveOutcome({ screenAtEnd: rec.afterFight, log, seen: rec.lastChain });
  rec.outcome = end.outcome; rec.outcomeFrom = end.from; rec.stalledAt = end.stalledAt ?? null;
  if (end.outcome === 'stalled') rec.fails.push({ stalled: end.detail, from: end.from });
  rec.logKinds = {}; for (const e of log) rec.logKinds[e.type] = (rec.logKinds[e.type] ?? 0) + 1;
  fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  fs.writeFileSync(path.join(evidence, dir, `${pref}battle-log.json`), JSON.stringify(log));
  fs.writeFileSync(path.join(evidence, dir, `${pref}turn-log.json`), JSON.stringify(rec.picks, null, 1));
  note('fight', { outcome: rec.outcome, turns, ms, seams: rec.seams.length, orders: rec.orders.length });
}
