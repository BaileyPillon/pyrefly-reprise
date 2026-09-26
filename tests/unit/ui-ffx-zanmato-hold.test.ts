// @vitest-environment jsdom
/**
 * PR-0191 (ZG-1), FFX only (Chapter IX): the Zanmato gauge follows the
 * presented events, not the state that is already ahead of them.
 *
 * The engine empties Yojimbo's gauge when he decides on Zanmato (sourced, and
 * fine): its `overdrive-gauge` 100 -> 0 event is presented *before* the strike's
 * `action-start`. The panel used to read "0%" and "Next: Daigoro" for the whole
 * strike, and the reset cut the one-shot banner short (about 0.6 s of its
 * 2.6 s). Now the panel holds the full "Zanmato" view until Yojimbo's
 * `action-end`, after the 9,999 has landed, and the banner always finishes its
 * hold.
 *
 * The events come from the real engine and the real Chapter IX data (hard rule 3).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { yojimboCavernBuild } from '../../src/data/ffx/builds/yojimbo-cavern.ts';
import { BANNER_HOLD_MS, ZanmatoGauge } from '../../src/ui/ffx/ZanmatoGauge.ts';

/** Yojimbo's combatant id in the Cavern group. */
const YOJIMBO = 'yojimbo';

interface Step {
  events: BattleEvent[];
  state: BattleState;
}

/** Play Chapter IX with a fixed command rotation until Yojimbo's first Zanmato. */
function routeToZanmato(): Step[] {
  const content = new FFXContentRegistry();
  content.addAbilities([...ALL_ABILITIES]);
  content.addItems(Object.values(ITEMS));
  for (let seed = 1; seed < 80; seed++) {
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: yojimboCavernBuild,
      enemies: ENEMY_GROUPS_BY_ID['yojimbo-cavern']!,
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    });
    const steps: Step[] = [];
    for (let i = 0; i < 1500; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      let events: BattleEvent[];
      if (d.kind === 'resolved') events = d.events;
      else if (d.kind === 'player-input') {
        const cmds = d.commands.filter((c) => c.enabled !== false);
        events = engine.submit(cmds[(i * 7 + seed) % cmds.length]!.command);
      } else break;
      steps.push({ events, state: structuredClone(engine.state()) as BattleState });
      if (events.some((e) => e.type === 'action-start' && e.abilityId === 'yojimbo-zanmato')) return steps;
    }
  }
  throw new Error('no Zanmato on any seed');
}

function mountWidget(): ZanmatoGauge {
  const host = document.createElement('div');
  const stage = document.createElement('div');
  host.append(stage);
  document.body.append(host);
  host.getBoundingClientRect = () =>
    ({ width: 1600, height: 900, left: 0, top: 0, right: 1600, bottom: 900, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  const g = new ZanmatoGauge();
  g.mount(stage, host);
  return g;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('PR-0191: the gauge holds Zanmato until the 9,999 lands', () => {
  it('reads Zanmato (full) through the strike, then 0 after its action-end', () => {
    const steps = routeToZanmato();
    const g = mountWidget();
    g.sync(steps[0]!.state);
    const seen: Array<{ type: string; gauge: string; full: boolean; text: string }> = [];
    for (const step of steps) {
      for (const e of step.events) {
        g.onEvent(e);
        seen.push({
          type: e.type,
          gauge: g.panelEl.dataset['gauge'] ?? '',
          full: g.panelEl.classList.contains('ffx-zg__panel--full'),
          text: g.panelEl.textContent ?? '',
        });
      }
      g.sync(step.state);
    }
    const all = steps.flatMap((x) => x.events);
    const start = all.findIndex((e) => e.type === 'action-start' && e.abilityId === 'yojimbo-zanmato');
    const nineNines = all.findIndex((e, k) => k > start && e.type === 'damage' && e.amount === 9999);
    expect(start).toBeGreaterThan(0);
    expect(nineNines).toBeGreaterThan(start);
    // From the reset event through the 9,999: the full view, never "Next: Daigoro".
    const reset = all.findIndex((e) => e.type === 'overdrive-gauge' && e.who === YOJIMBO && e.to === 0 && e.from === 100);
    expect(reset).toBeGreaterThan(0);
    expect(reset).toBeLessThan(start);
    for (let k = reset; k <= nineNines; k++) {
      expect(seen[k]!.full, `event ${k} (${seen[k]!.type})`).toBe(true);
      expect(seen[k]!.text).toContain('Zanmato');
      expect(seen[k]!.text).not.toContain('Next: Daigoro');
    }
    // Once Yojimbo's action has ended, the panel tells the truth again.
    const end = all.findIndex((e, k) => k > nineNines && e.type === 'action-end');
    expect(seen[end]!.full).toBe(false);
    expect(g.panelEl.dataset['gauge']).toBe('0');
  });

  it('the banner finishes its 2.6 s even when the reset arrives 0.6 s in', async () => {
    vi.useFakeTimers();
    const g = mountWidget();
    const steps = routeToZanmato();
    g.sync(steps[0]!.state);
    const all = steps.flatMap((x) => x.events);
    const full = all.findIndex((e) => e.type === 'overdrive-gauge' && e.who === YOJIMBO && e.to === 100);
    for (const e of all.slice(0, full + 1)) g.onEvent(e);
    expect(g.bannerEl.hidden).toBe(false);
    await vi.advanceTimersByTimeAsync(600);
    for (const e of all.slice(full + 1)) g.onEvent(e); // the reset, the strike, its end
    await vi.advanceTimersByTimeAsync(BANNER_HOLD_MS - 600 - 100);
    expect(g.bannerEl.hidden).toBe(false);
    await vi.advanceTimersByTimeAsync(800);
    expect(g.bannerEl.hidden).toBe(true);
    g.dispose();
  });
});
