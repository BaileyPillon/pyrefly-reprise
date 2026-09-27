/**
 * Real-input helpers for the hidden FF7 Guard Scorpion fight (FF7 only).
 *
 * Every command is chosen with real keys (`page.keyboard.press`) or real taps
 * (`locator.tap`) on the FF7 HUD. The debug API is only **read**: which window
 * is open, whose turn it is, whether the tail is up, the message on screen. It
 * never submits a command.
 */
import type { Page } from '@playwright/test';

import './pyrefly-window.ts';

export const SAVE_KEY = 'pyrefly-reprise:save:v1';
export const EXPERIMENTS_KEY = 'pyrefly-reprise:experiments:v1';

export interface Look {
  stack: string[];
  battle: boolean;
  ready: string | null;
  menu: null | {
    view: string;
    topIdx: number;
    sub: string | null;
    subIdx: number;
    edge: string | null;
    slots: Array<string | null>;
    rows: Array<{ label: string; enabled: boolean }>;
  };
  tailUp: boolean;
  over: boolean;
  message: string | null;
  seed: number | null;
  /** Cloud's world x on the field (the melee run: home 4.1, the strike point near 0). */
  cloudX: number | null;
}

/** What is on screen now, read through the debug API (never written). */
export function look(page: Page): Promise<Look> {
  return page.evaluate(() => {
    const api = window.__pyrefly!;
    const stack = api.app.screens.map((s) => s.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = api.battle() as any;
    if (!b || !b.hud || !b.engine) return { stack, battle: false, ready: null, menu: null, tailUp: false, over: false, message: null, seed: null, cloudX: null };
    const seen = b.hud.inspect?.() ?? {};
    const m = seen.menu ?? null;
    const st = b.engine.state();
    const boss = st.combatants['guard-scorpion'];
    const subSlot = m?.sub ? m.slots.find((s: { label: string } | null) => s && s.label.toLowerCase() === m.sub) : null;
    return {
      stack,
      battle: true,
      ready: seen.ready ?? null,
      menu: m && {
        view: m.view,
        topIdx: m.topIdx,
        sub: m.sub,
        subIdx: m.subIdx,
        edge: m.edge ?? null,
        slots: m.slots.map((s: { label: string } | null) => (s ? s.label : null)),
        rows: (subSlot?.rows ?? []).map((r: { label: string; enabled: boolean }) => ({ label: r.label, enabled: r.enabled })),
      },
      tailUp: (boss?.ff7?.formIndex ?? 0) === 1,
      over: !!st.result,
      message: seen.message ?? null,
      seed: b.opts?.seed ?? null,
      cloudX: b.stage?.actor?.('cloud')?.position?.x ?? null,
    };
  });
}

export type Policy = 'sensible' | 'naive';
export type Via = 'keys' | 'taps';

export interface TurnHooks {
  /** Called with a moment name when the HUD reaches it (the spec takes the frame). */
  moment: (name: 'turn' | 'magic' | 'target' | 'limit-full' | 'limit-window' | 'defend') => Promise<void>;
  /** Attack into the raised tail once (the Tail Laser frame), then play sensibly. */
  laserOnce: boolean;
}

const press = async (page: Page, key: string, times = 1): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
};

async function tapSel(page: Page, sel: string): Promise<void> {
  await page.locator(sel).first().tap({ force: true });
  await page.waitForTimeout(120);
}

/** Move the finger on the four slots to slot `i` (keys), or tap it (taps). */
async function chooseSlot(page: Page, via: Via, i: number): Promise<void> {
  if (via === 'taps') return tapSel(page, `.ff7-layer--menu .ff7-hit[data-slot="${i}"]`);
  // Down skips the blank Summon slot, so press until the finger is there.
  for (let k = 0; k < 5 && (await look(page)).menu?.topIdx !== i; k++) await press(page, 'ArrowDown');
  await press(page, 'Enter');
}

async function chooseRow(page: Page, via: Via, idx: number): Promise<void> {
  if (via === 'taps') return tapSel(page, `.ff7-layer--menu .ff7-hit[data-row="${idx}"]`);
  for (let k = 0; k < 6 && ((await look(page)).menu?.subIdx ?? 0) < idx; k++) await press(page, 'ArrowRight');
  await press(page, 'Enter');
}

/** Confirm the target step on the boss (its only valid target). */
async function confirmBoss(page: Page, via: Via): Promise<void> {
  if (via === 'taps') return tapSel(page, '.ff7-layer--menu .ff7-hit[data-target="guard-scorpion"]');
  await press(page, 'Enter');
}

async function defend(page: Page, via: Via, hooks: TurnHooks): Promise<void> {
  if (via === 'taps') {
    await tapSel(page, '.ff7-layer--menu .ff7-hit[data-edge="defend"]'); // the finger goes off the right edge
    await hooks.moment('defend');
    return tapSel(page, '.ff7-layer--menu .ff7-hit[data-edge="defend"]'); // and Defend is chosen
  }
  await press(page, 'ArrowRight');
  await hooks.moment('defend');
  await press(page, 'Enter');
}

/**
 * Play one turn for the fighter whose menu is open. Sensible: Defend while the
 * tail is up, Bolt (Cloud) or Attack (Barret) while it is down, a full Limit at
 * once. Naive: attack every turn, tail or not.
 */
export async function takeTurn(page: Page, via: Via, policy: Policy, hooks: TurnHooks, state: { lasered: boolean }): Promise<void> {
  const now = await look(page);
  if (!now.menu || now.menu.view !== 'top') return;
  const actor = now.ready;
  const slots = now.menu.slots;
  if (now.tailUp && policy === 'sensible' && !(hooks.laserOnce && !state.lasered)) return defend(page, via, hooks);
  if (now.tailUp) state.lasered = true;
  if (slots[0] === 'Limit') {
    await hooks.moment('limit-full');
    await chooseSlot(page, via, 0);
    await page.waitForTimeout(250);
    await hooks.moment('limit-window');
    await chooseRow(page, via, 0);
    return confirmBoss(page, via);
  }
  if (actor === 'cloud' && policy === 'sensible' && !now.tailUp && slots[1] === 'Magic') {
    await hooks.moment('turn');
    await chooseSlot(page, via, 1);
    const open = await look(page);
    const bolt = open.menu?.rows.findIndex((r) => r.label === 'Bolt' && r.enabled) ?? -1;
    if (bolt >= 0) {
      await hooks.moment('magic');
      await chooseRow(page, via, bolt);
      await page.waitForTimeout(150);
      await hooks.moment('target');
      return confirmBoss(page, via);
    }
    if (via === 'keys') await press(page, 'Escape');
    else await tapSel(page, '.ff7-layer--menu .ff7-scrim');
  }
  await chooseSlot(page, via, 0);
  return confirmBoss(page, via);
}

/**
 * Play until the fight is over. Calls `onTick` with each look (frames of
 * passing moments, such as the Tail Laser's name). Resolves with the stack.
 */
export async function playToEnd(
  page: Page,
  via: Via,
  policy: Policy,
  hooks: TurnHooks & { onLook?: (l: Look) => Promise<void> },
  timeoutMs = 540_000,
): Promise<'victory' | 'defeat' | 'timeout'> {
  const state = { lasered: false };
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const now = await look(page);
    if (hooks.onLook) await hooks.onLook(now);
    if (!now.battle || now.over) break;
    if (now.menu && now.menu.view === 'top' && now.ready) await takeTurn(page, via, policy, hooks, state);
    else await page.waitForTimeout(120);
  }
  const outcome = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = window.__pyrefly!.battle() as any;
    return (b?.engine?.state().result?.outcome as string | undefined) ?? null;
  });
  return outcome === 'victory' || outcome === 'defeat' ? outcome : 'timeout';
}

/** The board as a player sees it: the screen's own snapshot (tiles, order, cursor, beaten of total) and the board's words. */
export function boardView(page: Page): Promise<{ snap: Record<string, unknown> | null; words: string }> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = window.__pyrefly!.app.current as any;
    const words = (document.querySelector('.fe-cselect__board')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { snap: (cur?.name === 'chapter-select' ? cur.snapshot() : null) as Record<string, unknown> | null, words };
  });
}
