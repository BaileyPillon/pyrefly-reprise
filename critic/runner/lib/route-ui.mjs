// Route driver: reading the HUD the player sees and choosing from it.
//
// Promoted from critic/rounds/round-13/cap/route.mjs (batch t1-b5). Changes:
//   - rows are read from the VISIBLE command stack only, and an open overlay
//     stack wins (Chapter VIII's Orders widget, `.ig-cmd-stack.ffx-airship-order`,
//     is a second stack on top of the main one: round 13's reader saw the main
//     stack's "Orders" row as selected while the widget was open, so it could
//     never pick PULL BACK or CLOSE IN);
//   - the label of a trigger row (`.ffx-cmd--trigger__label`) is read without
//     its "Trigger" tag;
//   - a target is only steered and confirmed when a target cursor is really up,
//     so a command that needs none (an order, Defend) never gets a stray Enter
//     that lands in the next character's menu.
// Both games: shared critic plumbing.

/** Command rows of the stack the player is working in (visible rows only; an overlay stack first). */
export function readRows(page) {
  return page.evaluate(() => {
    const vis = (e) => {
      if (e.closest('[hidden]')) return false;
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const stacks = [...document.querySelectorAll('.ig-cmd-stack')].filter(vis);
    const overlay = stacks.filter((s) => s.classList.contains('ffx-airship-order'));
    const use = overlay.length ? overlay : stacks;
    const rows = use.flatMap((s) => [...s.querySelectorAll('.ig-cmd')].filter(vis));
    return rows.map((r, i) => ({
      i,
      label: (r.querySelector('.ffx-cmd__label, .ffx2cmd__label, .ffx-cmd--trigger__label')?.textContent ?? r.textContent ?? '').trim(),
      sel: r.classList.contains('ig-cmd--selected'),
      disabled: r.classList.contains('ig-cmd--disabled'),
      overlay: overlay.length > 0,
    }));
  });
}

/** The advisor card's top move: label, target and the "in <menu>" chip. */
export function readAdvice(page) {
  return page.evaluate(() => {
    const m = document.querySelector('.mad__move');
    if (!m) return null;
    const chip = [...m.querySelectorAll('.mad__stat')].map((e) => e.textContent.trim()).find((t) => /^in /i.test(t));
    return { label: m.querySelector('.mad__label')?.textContent?.trim() ?? null, target: m.querySelector('.mad__target')?.textContent?.trim() ?? null, menu: chip ? chip.replace(/^in /i, '').trim() : null };
  });
}

/** Is a target cursor up (the stage's selection, or reticles in the DOM)? */
export function targetsUp(page) {
  return page.evaluate(() => ({
    n: document.querySelectorAll('[data-target-id]').length,
    lit: [...document.querySelectorAll('[data-target-id]')].filter((e) => !e.classList.contains('ffx-target--dim')).length,
    selecting: (window.__pyrefly?.targeting?.()?.selection ?? null) !== null,
  }));
}

export const slugOf = (name) => String(name ?? '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Chooser for one page and input. Keyboard and gamepad arrow to a row and
 * press Enter; touch taps the row (a click on `[data-ui-action]` selects and
 * chooses it through the same path Enter does, `CommandMenu.onAction`).
 */
export function makeChooser(page, input, contexts) {
  const touch = Boolean(contexts.touch);

  /** Move the highlight to the first row matching `pred` (down, then up: FFX-2 menus do not wrap). */
  async function highlight(pred, max = 40) {
    for (const key of ['ArrowDown', 'ArrowUp']) {
      const seen = [];
      for (let k = 0; k < max; k++) {
        const rows = await readRows(page);
        const cur = rows.find((r) => r.sel);
        if (!cur) return null;
        if (!cur.disabled && pred(cur.label)) return cur;
        if (seen.filter((s) => s === cur.label).length >= 2) break;
        seen.push(cur.label);
        await input.press(key);
        await page.waitForTimeout(120);
        const after = (await readRows(page)).find((r) => r.sel);
        if (after?.label === cur.label && after?.i === cur.i) break; // the end of a non-wrapping list
      }
    }
    return null;
  }

  /** Choose a row: returns its label, or null when no visible row matches. */
  async function choose(pred) {
    if (touch) {
      const rows = await readRows(page);
      const hit = rows.find((r) => !r.disabled && pred(r.label));
      if (!hit) return null;
      const loc = page.locator(hit.overlay ? '.ig-cmd-stack.ffx-airship-order .ig-cmd' : '.ig-cmd-stack .ig-cmd').filter({ visible: true }).nth(hit.i);
      if (!(await input.tap(loc, `row:${hit.label}`))) {
        const cur = await highlight(pred); // the tap was taken by a layer on top: keys, counted as fallbacks
        if (!cur) return null;
        await input.press('Enter');
      }
      await page.waitForTimeout(450);
      return hit.label;
    }
    const cur = await highlight(pred);
    if (!cur) return null;
    await input.press('Enter');
    await page.waitForTimeout(450);
    return cur.label;
  }

  /** With a target cursor up, move it to `name` and confirm; without one, do nothing. */
  async function confirmTarget(name) {
    const t = await targetsUp(page);
    if (!t.n && !t.selecting) return { confirmed: false, reason: 'no target cursor' };
    const slug = slugOf(name);
    if (touch) {
      const ids = await page.evaluate(() => [...document.querySelectorAll('[data-target-id]')].map((e) => ({ id: e.dataset.targetId, dim: e.classList.contains('ffx-target--dim') })));
      const pick = (slug && ids.find((x) => x.id.startsWith(slug) || slug.startsWith(x.id))) || ids.find((x) => !x.dim) || ids[0];
      if (pick) {
        if (await input.tap(page.locator(`[data-target-id="${pick.id}"]`).first(), `target:${pick.id}`)) return { confirmed: true, target: pick.id };
        await input.press('Enter');
        return { confirmed: true, target: 'key fallback (tap blocked)' };
      }
      await input.press('Enter'); // a group cast has no reticle to tap
      return { confirmed: true, target: 'group' };
    }
    if (slug && t.n >= 2 && !/^(all|party)/.test(slug)) {
      for (let k = 0; k < 8; k++) {
        const active = await page.evaluate(() => [...document.querySelectorAll('[data-target-id]')].find((e) => !e.classList.contains('ffx-target--dim'))?.dataset?.targetId ?? null);
        if (!active || active.startsWith(slug) || slug.startsWith(active)) break;
        await input.press('ArrowRight');
        await page.waitForTimeout(150);
      }
    }
    await input.press('Enter');
    return { confirmed: true };
  }

  return { highlight, choose, confirmTarget };
}

// ---------------------------------------------------------------- measures

export const measureFoc = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const vis = (e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const coach = [...document.querySelectorAll('.coach-mark')].filter(vis).map(R);
  const adv = [...document.querySelectorAll('.mad__card')].filter(vis).map(R);
  const cmd = [...document.querySelectorAll('.ig-cmd-stack')].filter(vis).map(R);
  const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const overlaps = [];
  for (const c of coach) { for (const a of adv) if (ov(c, a)) overlaps.push({ with: 'advisor', px: ov(c, a) }); for (const m of cmd) if (ov(c, m)) overlaps.push({ with: 'commands', px: ov(c, m) }); }
  const card = document.querySelector('.mad__card');
  let min = null; let rows = []; let clipped = [];
  if (card && vis(card)) {
    const eff = (el) => { let f = parseFloat(getComputedStyle(el).fontSize); let s = 1; let n = el; while (n && n !== document.documentElement) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const m = new DOMMatrixReadOnly(t); s *= Math.hypot(m.a, m.b); } n = n.parentElement; } return Math.round(f * s * 100) / 100; };
    rows = [...card.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim() && vis(e)).map((e) => ({ t: e.textContent.trim().slice(0, 40), eff: eff(e) }));
    min = rows.length ? Math.min(...rows.map((r) => r.eff)) : null;
    const cr = card.getBoundingClientRect();
    clipped = [...card.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim()).filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > cr.bottom + 1 || r.right > cr.right + 1 || (e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflow === 'hidden'); }).map((e) => e.textContent.trim().slice(0, 40));
  }
  return { viewport: `${innerWidth}x${innerHeight}`, coach, adv, cmd, overlaps, advisorMinEffPx: min, advisorClippedOrOverflowing: clipped, advisorRows: rows.slice(0, 30) };
});

export const measureCardVsRows = (page) => page.evaluate(() => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const vis = (e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const card = [...document.querySelectorAll('.mad__card')].filter(vis).map(R)[0] ?? null;
  const rows = [...document.querySelectorAll('.ffx2stat, .ig-stat-list, .ig-stat-list > *')].filter(vis).map(R);
  const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const hits = card ? rows.map((r) => ov(card, r)).filter((v) => v > 0) : [];
  const cardText = (document.querySelector('.mad__card')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 200);
  return { viewport: `${innerWidth}x${innerHeight}`, card, rows: rows.length, overlapPx2: hits.reduce((a, b) => a + b, 0), cardText };
});

/** Seed and first enemy action of the battle on screen now (PR-0202). */
export const battleSeedRead = (page) => page.evaluate(() => {
  const st = window.__pyrefly?.battleState?.();
  const snap = window.__pyrefly?.snapshotState?.();
  const combatants = st?.combatants ?? {};
  const first = (st?.log ?? []).find((e) => e.type === 'action-start' && combatants[e.actorId]?.side === 'enemy');
  return {
    engineSeed: st?.seed ?? null,
    links: snap?.screenState?.links ?? null,
    firstEnemyAction: first ? { seq: first.seq, actor: first.actorId, ability: first.abilityName ?? first.abilityId ?? null, targets: first.targetIds ?? first.targets ?? first.targetId ?? null } : null,
  };
});
