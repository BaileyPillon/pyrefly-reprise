// @vitest-environment jsdom
/**
 * The intent panel's honesty about what it does not know, in the DOM
 * (`src/ui/common/EnemyIntent.ts` and the phone rules in
 * `src/ui/common/phone-battle-parts.css`).
 *
 * - **PR-0153** (both games): a rolled victim renders every candidate under a
 *   "random target" head, each with its own lethal flag, and the SCRIPTED badge
 *   stays on the move. The engine half is `intent-random-target.test.ts`.
 * - **PR-0207** (both games): the phone strip kept the move and the first
 *   damage row but hid the SCRIPTED / MOST LIKELY badge, so "Kick · PAINE
 *   179-202" read as certain when the desktop card said "Kick MOST LIKELY 50%".
 *   The badge now rides the phone line; the Odds table stays desktop-only.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { EnemyIntentPanel, type IntentTargetView, type IntentView } from '../../src/ui/common/EnemyIntent.ts';

const css = readFileSync(join(__dirname, '../../src/ui/common/phone-battle-parts.css'), 'utf8');

const live: EnemyIntentPanel[] = [];
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

function row(id: string, name: string, lethal = false): IntentTargetView {
  return { targetId: id, targetName: name, amount: 750, min: 707, max: 799, hpFraction: lethal ? 1.2 : 0.3, lethal, hitChancePercent: null };
}

function view(overrides: Partial<IntentView> = {}): IntentView {
  return {
    enemyId: 'seymour-flux',
    enemyName: 'Seymour Flux',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Lance of Atrophy',
    abilityId: 'lance-of-atrophy',
    description: 'Physical non-elemental damage to one character - never misses.',
    elements: [],
    statusText: ['Zombie 100%'],
    estimate: { name: 'Lance of Atrophy', hits: 1, totalHarmToParty: 750, heals: false, perTarget: [row('tidus', 'Tidus')] },
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: [],
    cite: '',
    ...overrides,
  };
}

function render(v: IntentView, density: 'full' | 'brief' = 'brief'): HTMLElement {
  const overlay = document.createElement('div');
  document.body.appendChild(overlay);
  const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => true, writeVisible: () => undefined });
  panel.mount(overlay, { host: overlay, scale: () => 2.5, project: () => ({ x: 800, y: 400 }), avoid: () => [], density });
  panel.setSource(() => v);
  live.push(panel);
  return overlay;
}

describe('PR-0153: a random target is every candidate, never one name', () => {
  const random = { rows: [row('tidus', 'Tidus'), row('yuna', 'Yuna', true), row('auron', 'Auron')], perHit: false, hits: 1 };

  it('renders one row per candidate under a "random target" head, lethal flags per row', () => {
    for (const density of ['brief', 'full'] as const) {
      const root = render(view({ randomTarget: random }), density);
      const list = root.querySelector('.eint__dmgs');
      expect(list?.classList.contains('eint__dmgs--random')).toBe(true);
      const names = [...root.querySelectorAll('.eint__dmg .eint__who')].map((n) => n.textContent);
      expect(names).toEqual(['Tidus', 'Yuna', 'Auron']);
      expect(root.querySelector('.eint__dmg--lethal .eint__who')?.textContent).toBe('Yuna');
      expect(root.querySelector('.eint__head')?.textContent?.toLowerCase()).toContain('random target');
      // SCRIPTED still answers for the move.
      expect(root.querySelector('.eint__move .eint__conf')?.textContent).toBe('Scripted');
      live.pop()!.unmount();
    }
  });

  it('a per-hit random volley says its rows are one hit each', () => {
    const root = render(view({ randomTarget: { ...random, perHit: true, hits: 8 } }));
    expect(root.textContent?.toLowerCase()).toContain('8 hits');
    expect(root.textContent?.toLowerCase()).toContain('per hit');
  });

  it('shows every row of a random-target list on the phone, not just the first', () => {
    expect(css).toMatch(/html\[data-phone-battle\] \.eint__dmgs--random \.eint__dmg \+ \.eint__dmg,?[^{]*\{[^}]*display:\s*inline/);
  });

  it('a fixed victim keeps the plain Damage head', () => {
    const root = render(view());
    expect(root.querySelector('.eint__dmgs--random')).toBeNull();
    expect(root.querySelector('.eint__head')?.textContent).toBe('Damage');
  });
});
