// Route driver: playing the Overdrive overlay that is on screen, by real input (PR-0261, critic round 19).
//
// Until now the route pressed Enter once, 3 s after any Overdrive overlay opened. That is a Bushido with 0
// correct inputs and a Swordplay press at a random spot: it understates what a human does and made every
// Auron or Tidus Overdrive a floor (round 19: "the harness enters no Overdrive input", PR-0269's real-key losses).
// This reads the overlay the player sees and types what it shows:
//   - Bushido (Auron): the chips on screen, in their order, one key each (route-pure.mjs#keysForChips);
//   - Swordplay (Tidus): confirm when the marker, carried forward by the key's travel time, is inside the gold
//     zone (route-pure.mjs#swordplayPressNow); a miss only restarts the sweep, as in the game.
// Every other overlay (reels, fury, Mix, the pickers) is left to the caller's old handling.
// Game case: FFX only (the two overlays are FFX's: src/ui/ffx/minigames/). Both are driven through `input`, so
// keyboard, gamepad-shim and touch contexts keep their own recording.
import { keysForChips, minigameKindOf, swordplayPressNow } from './route-pure.mjs';

/** What the overlay on screen shows, or `{ up: false }`. `chips` are the Bushido chip faces in order, `buttons` the abstract button each one presses (`data-btn`, release 39 on). */
export function readMinigame(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.ffx-mg.ig-minigame');
    if (!el) return { up: false };
    const text = (sel) => (el.querySelector(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const bar = el.querySelector('.ig-minigame__bar');
    return {
      up: true,
      title: text('[data-role="title"]'),
      subtitle: text('[data-role="subtitle"]'),
      chips: [...el.querySelectorAll('.ig-minigame__bar--sequence .ig-minigame__key')].map((k) => k.textContent.trim()),
      buttons: [...el.querySelectorAll('.ig-minigame__bar--sequence .ig-minigame__key')].map((k) => k.dataset.btn ?? ''),
      bar: Boolean(bar && !bar.classList.contains('ig-minigame__bar--sequence')),
      timer: text('[data-role="ring-text"]'),
    };
  });
}

/** The newest Overdrive the party played, with the minigame outcome the engine received (`command.extra`), or null. */
export function lastOverdrive(page) {
  return page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    const ev = (st?.log ?? []).filter((e) => e.type === 'action-start' && e.command?.kind === 'overdrive').slice(-1)[0];
    return ev ? { actor: ev.actorId, ability: ev.abilityName ?? ev.abilityId ?? null, extra: ev.command?.extra ?? null } : null;
  }).catch(() => null);
}

/** Installs (once) a capture-phase keydown log that records where Swordplay's marker was at every Enter. */
async function armPressLog(page) {
  await page.evaluate(() => {
    if (window.__mgPressLog) { window.__mgPressLog.length = 0; return; }
    window.__mgPressLog = [];
    window.addEventListener('keydown', (e) => {
      const el = document.querySelector('.ffx-mg [data-role="cursor"]');
      const bar = document.querySelector('.ffx-mg [data-role="bar"]');
      if (!el || !bar) return;
      window.__mgPressLog.push({ key: e.key, pos: parseFloat(el.style.left) || 0, zoneStart: parseFloat(bar.style.getPropertyValue('--ig-zone-start')), zoneWidth: parseFloat(bar.style.getPropertyValue('--ig-zone-width')) });
    }, true);
  });
}

/** Resolves when the marker should be pressed (or the overlay closed, or `maxMs` passed). Runs in the page. */
function waitForZone(page, { leadMs, maxMs }) {
  return page.evaluate(([src, lead, max]) => new Promise((resolve) => {
    const pressNow = new Function(`return ${src}`)();
    const bar = document.querySelector('.ffx-mg [data-role="bar"]');
    const cur = document.querySelector('.ffx-mg [data-role="cursor"]');
    if (!bar || !cur) { resolve({ closed: true }); return; }
    const t0 = performance.now();
    let prev = null; let prevT = 0;
    const tick = () => {
      const now = performance.now();
      if (!bar.isConnected || !document.querySelector('.ffx-mg')) { resolve({ closed: true }); return; }
      if (now - t0 > max) { resolve({ timeout: true }); return; }
      const pos = parseFloat(cur.style.left) || 0;
      const zs = parseFloat(bar.style.getPropertyValue('--ig-zone-start'));
      const zw = parseFloat(bar.style.getPropertyValue('--ig-zone-width'));
      if (prev !== null && pressNow(pos, prev, now - prevT, zs, zw, lead)) { resolve({ pos, zoneStart: zs, zoneWidth: zw }); return; }
      prev = pos; prevT = now;
      requestAnimationFrame(tick);
    };
    tick();
  }), [swordplayPressNow.toString(), leadMs, maxMs]);
}

/**
 * Plays the Overdrive overlay that is up, if it is Bushido or Swordplay. Returns the record kept in
 * `rec.minigames`, or null when the overlay is another kind (the caller then does what it always did).
 * `shot(name, label)` takes the overlay screenshot (first of each kind only).
 */
export async function playMinigame({ page, input, rec, turn, shot, leadMs = 30 }) {
  const m = await readMinigame(page);
  if (!m.up) return null;
  const kind = minigameKindOf(m.subtitle);
  if (!kind) return null;
  rec.minigames = rec.minigames ?? [];
  const played = { turn, kind, title: m.title, subtitle: m.subtitle };
  rec.minigames.push(played);
  rec.minigameShots = rec.minigameShots ?? {};
  if (!rec.minigameShots[kind]) { rec.minigameShots[kind] = true; await shot(kind, `${m.title}: ${m.subtitle}`); }
  const t0 = Date.now();
  if (kind === 'bushido') {
    const { keys, unknown } = keysForChips(m.chips, m.buttons);
    played.chips = m.chips; played.buttons = m.buttons; played.keys = keys; played.unknownGlyphs = unknown;
    if (unknown.length) { played.note = 'a chip glyph has no key in the table: nothing typed, the timer will decide'; }
    else for (const k of keys) { await input.press(k); await page.waitForTimeout(110); }
  } else {
    await armPressLog(page);
    played.attempts = [];
    for (let i = 0; i < 12; i++) {
      const w = await waitForZone(page, { leadMs, maxMs: 6000 });
      if (w.closed || w.timeout) { played.attempts.push(w.closed ? 'overlay closed' : 'no zone crossing in 6 s'); break; }
      await input.press('Enter');
      await page.waitForTimeout(260); // the overlay flashes success for 240 ms before it closes
      played.attempts.push({ seenAt: Number(w.pos.toFixed(1)), zone: [Number(w.zoneStart.toFixed(1)), Number((w.zoneStart + w.zoneWidth).toFixed(1))] });
      if (!(await readMinigame(page)).up) break;
    }
    played.pressLog = (await page.evaluate(() => window.__mgPressLog ?? [])).map((x) => ({ ...x, inZone: x.pos >= x.zoneStart && x.pos <= x.zoneStart + x.zoneWidth }));
  }
  for (let i = 0; i < 30 && (await readMinigame(page)).up; i++) await page.waitForTimeout(100);
  played.closed = !(await readMinigame(page)).up;
  played.ms = Date.now() - t0;
  await page.waitForTimeout(700); // the presenter resubmits the command with the outcome, then logs the action
  played.engine = await lastOverdrive(page);
  return played;
}
