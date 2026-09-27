// @vitest-environment jsdom
/**
 * The phone tip names the menu its move lives in (critic round 13 PR-0126,
 * phone half; CHK-004 "say where").
 *
 * Before: the phone sheet shows only `.mad__line` of the lead move and hides
 * every `.mad__stats` line, which is where the "in <menu>" chip lives, so every
 * phone tip read "TIP Darkness → all enemies" or "TIP Wakka" (a Switch) with no
 * menu named. Now the line itself carries the menu as `.mad__where`, which the
 * phone sheet shows ("TIP Darkness → all enemies · Black Magic") and the
 * desktop sheet leaves to the chip it already prints.
 *
 * **Game case: both** [AGENTS.md rule 14]: the phone tip is shared chrome and
 * each game's menu word comes from its own grouping rule (`advisor-menu.ts`).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { cardHtml, MAX_DENSITY, type Density } from '../../src/ui/common/MoveAdvisor.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f: string): string => readFileSync(join(HERE, '..', '..', 'src', 'ui', 'common', f), 'utf8');

function suggestion(label: string, menu: string, targetName: string | null): MoveSuggestion {
  return {
    command: { kind: 'ability', id: 'x', targets: [] },
    label,
    menu,
    targetId: null,
    targetName,
    effect: 'Deals damage.',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: false,
    reason: 'A reason',
    cite: '',
    score: 1,
    source: 'simulated',
  } as unknown as MoveSuggestion;
}

function view(...s: MoveSuggestion[]): AdvisorView {
  return { actorId: 'paine', actorName: 'Paine', suggestions: s, note: '' } as unknown as AdvisorView;
}

describe('the tip line carries the menu (PR-0126 phone half)', () => {
  it('the lead line names the menu at every density rung', () => {
    const v = view(suggestion('Darkness', 'Dark Knight', 'all enemies'), suggestion('Pray', 'White Magic', 'the party'));
    for (let d = 0; d <= MAX_DENSITY; d++) {
      const host = document.createElement('div');
      host.innerHTML = cardHtml(v, d as Density);
      const line = host.querySelector('.mad__move:not(.mad__move--alt) .mad__line');
      expect(line?.querySelector('.mad__where')?.textContent, `density ${d}`).toBe('Dark Knight');
      // After the target, so the tip reads "Darkness → all enemies · Dark Knight".
      const kids = [...(line?.children ?? [])].map((e) => e.className);
      expect(kids.indexOf('mad__where')).toBeGreaterThan(kids.indexOf('mad__target'));
    }
  });

  it('a Switch tip names the Switch menu', () => {
    const host = document.createElement('div');
    host.innerHTML = cardHtml(view(suggestion('Wakka', 'Switch', null)), MAX_DENSITY);
    expect(host.querySelector('.mad__line .mad__where')?.textContent).toBe('Switch');
  });

  it('a top-level row prints no empty menu span', () => {
    const host = document.createElement('div');
    host.innerHTML = cardHtml(view(suggestion('Attack', '', 'Bahamut')), 0);
    expect(host.querySelector('.mad__where')).toBeNull();
  });

  it('the phone sheet shows it and keeps it whole; the desktop sheet leaves it to the chip', () => {
    const phone = read('phone-battle-parts.css');
    const rule = phone.match(/html\[data-phone-battle\] \.mad__where\s*\{([^}]*)\}/);
    expect(rule, 'phone rule').not.toBeNull();
    expect(rule![1]).not.toMatch(/display:\s*none/);
    expect(rule![1]).toMatch(/flex:\s*none/);
    const hiddenList = phone.match(/([^{}]*)\{\s*display:\s*none !important;\s*\}/g)?.join('\n') ?? '';
    expect(hiddenList).not.toMatch(/\.mad__where/);
    const desk = read('move-advisor.css');
    expect(desk).toMatch(/\.mad__where\s*\{[^}]*display:\s*none/);
  });
});
