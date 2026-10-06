// @vitest-environment jsdom
/**
 * PR-0330 (release 39, both games: it is the shared density ladder; the chapters that failed are FFX's): the move-advisor
 * card keeps what the lead costs and what it does when the box is too small for the whole card.
 *
 * Round 21, real runs on live release 38, first menu, seed 1: Chapter VII printed "Steal -> Guado Guardian A IN SPECIAL"
 * (56 characters), Chapter IX "Fire Gem -> Yojimbo IN ITEMS 2,810-3,175 5 HITS", Chapter XII "Tidus 1 Wakka IN SWITCH 2 Cheer ->
 * the party IN SPECIAL", the Sin fights "Tidus Close in IN ORDERS" and "Hastega -> the party IN WHITE MAGIC": a move and where it
 * lives, and no cost and no effect. The cause, measured with the card's own `scrollHeight` in the real HUD
 * (`docs/handoff/r39-uifix.md`): the old ladder threw the lead's **effect** away at rung 2, long before its reason, and its cost
 * whenever the move cost 0 MP; a narrow box wraps the reason to four or five lines (40 to 62 grid px) while the effect is one or
 * two (10 to 18).
 *
 * The advisor's CHOICES are not under test here and are not touched: this file renders views the engine already built.
 */
import { describe, expect, it } from 'vitest';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { MAX_DENSITY, cardHtml, type Density } from '../../src/ui/common/MoveAdvisor.ts';
import { readFileSync } from 'node:fs';

function suggestion(over: Partial<MoveSuggestion> & Pick<MoveSuggestion, 'label' | 'menu'>): MoveSuggestion {
  return {
    command: { kind: 'attack', targets: [] } as unknown as MoveSuggestion['command'],
    targetId: 'boss',
    targetName: 'the boss',
    effect: '',
    reason: '',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    cite: '',
    warning: '',
    score: 1,
    isSwitch: false,
    source: 'simulated',
    ...over,
  } as MoveSuggestion;
}

function view(actorName: string, suggestions: MoveSuggestion[], note = ''): AdvisorView {
  return { actorId: actorName.toLowerCase(), actorName, suggestions, note, considered: 10 } as AdvisorView;
}

/** The real cards of round 21's five stub chapters (first menu, seed 1), text as the advisor wrote it. */
const STEAL = view('Rikku', [
  suggestion({
    label: 'Steal',
    menu: 'Special',
    targetName: 'Guado Guardian A',
    critChance: 3,
    effect: 'Take the pouch off Guado Guardian',
    reason: 'Take the pouch off Guado Guardian A: one successful Steal ends its 1,000 HP Auto-Potion counter and its Hi-Potions for Seymour — and nothing else, so it will still Remedy him',
  }),
]);
const FIRE_GEM = view('Kimahri', [
  suggestion({
    label: 'Fire Gem',
    menu: 'Items',
    targetName: 'Yojimbo',
    estimate: { kind: 'damage', min: 2810, mid: 3000, max: 3175, hits: 5, killsTarget: false },
    hitChance: null,
    critChance: 3,
    effect: 'Deals fire damage to five random enemies.',
    reason: 'Most damage on the board',
  }),
]);
const HASTEGA = view('Tidus', [
  suggestion({
    label: 'Hastega',
    menu: 'White Magic',
    targetName: 'the party',
    mpCost: 30,
    statuses: ['Haste'],
    effect: 'Speeds the party’s turns up',
    reason: 'It puts Haste on the party',
  }),
]);
const CLOSE_IN = view('Tidus', [
  suggestion({ label: 'Close in', menu: 'Orders', targetName: '', effect: '', reason: 'The ship must be in range before anything else lands' }),
]);
const OMNIS = view('Tidus', [
  suggestion({ label: 'Wakka', menu: 'Switch', targetName: '', isSwitch: true, effect: 'Swaps a bench member into the slot; they take this turn', reason: 'Wakka first' }),
  suggestion({ label: 'Cheer', menu: 'Special', targetName: 'the party', effect: '', reason: 'It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all' }),
]);

function html(v: AdvisorView, d: Density): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = cardHtml(v, d);
  return el;
}

const RUNGS: Density[] = [0, 1, 2, 3, 4, 5, 6, 7];
const text = (e: Element | null): string => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('the ladder has eight rungs, the last the bare card', () => {
  it('MAX_DENSITY is 7', () => {
    expect(MAX_DENSITY).toBe(7);
  });
});

describe('the lead keeps its cost on every rung, with no height added', () => {
  it.each([
    ['Steal (0 MP)', STEAL, /no MP/],
    ['Fire Gem (0 MP)', FIRE_GEM, /no MP/],
    ['Hastega (30 MP)', HASTEGA, /30 MP/],
    ['Close in (0 MP)', CLOSE_IN, /no MP/],
    ['Wakka, a switch (0 MP)', OMNIS, /no MP/],
  ])('%s', (_name, v, cost) => {
    for (const d of RUNGS) {
      const lead = html(v, d).querySelector('.mad__move:not(.mad__move--alt)')!;
      expect(text(lead), `rung ${d}`).toMatch(cost);
    }
  });

  it('the cost chip sits in the menu chip\'s own row on the last rung (one row, so it costs no height)', () => {
    for (const v of [STEAL, FIRE_GEM, HASTEGA, CLOSE_IN]) {
      const rows = html(v, MAX_DENSITY).querySelectorAll('.mad__move:not(.mad__move--alt) .mad__stats');
      expect(rows.length).toBe(1);
      expect(rows[0]!.querySelectorAll('.mad__stat').length).toBe(2); // "in <menu>" and the cost
    }
  });
});

describe('the lead keeps its effect to the last rung but one; its reason shortens before it goes', () => {
  it('effect: on rungs 0 to 5, gone at 6 and 7 (a view with an effect line)', () => {
    for (const v of [STEAL, FIRE_GEM, HASTEGA]) {
      for (const d of RUNGS) {
        const has = !!html(v, d).querySelector('.mad__move:not(.mad__move--alt) .mad__effect');
        expect(has, `${v.suggestions[0]!.label} rung ${d}`).toBe(d <= 5);
      }
    }
  });

  it('a move with no effect text prints none and loses nothing else for it (Close in)', () => {
    for (const d of RUNGS) expect(html(CLOSE_IN, d).querySelector('.mad__effect'), `rung ${d}`).toBeNull();
  });

  it('reason: whole on rungs 0 to 3, its first whole clause on rung 4 (a reason with no semicolon or second sentence stays whole), gone from rung 5; never an ellipsis or a clamp', () => {
    for (const d of RUNGS) {
      const why = html(STEAL, d).querySelector('.mad__move:not(.mad__move--alt) .mad__why');
      expect(!!why, `rung ${d}`).toBe(d <= 4);
      expect(why?.classList.contains('mad__why--clamp') ?? false, `rung ${d} clamped`).toBe(false);
    }
    expect(text(html(STEAL, 3).querySelector('.mad__why'))).toContain('and nothing else, so it will still Remedy him');
    // a dash or a colon is no place to cut: what follows is the point, so a reason with no semicolon or second sentence is whole or gone
    expect(text(html(STEAL, 4).querySelector('.mad__why'))).toBe(text(html(STEAL, 3).querySelector('.mad__why')));
  });

  it('a card reached by the old rungs 0 and 1 prints what it printed (a lone lead is the same words on rungs 0 to 3)', () => {
    for (const v of [STEAL, FIRE_GEM, HASTEGA]) {
      const t0 = text(html(v, 0));
      for (const d of [1, 2, 3] as Density[]) expect(text(html(v, d)), `${v.suggestions[0]!.label} rung ${d}`).toBe(t0);
    }
  });
});

describe('a runner-up keeps its old thresholds, and its reason shortens to a clause before the last rung takes it', () => {
  it('its effect goes at rung 1, its reason is a whole clause from rung 4 and stays until the last rung', () => {
    const alt = (d: Density): Element => html(OMNIS, d).querySelector('.mad__move--alt')!;
    for (const d of [0, 1, 2, 3, 4, 5, 6] as Density[]) expect(!!alt(d).querySelector('.mad__why'), `rung ${d}`).toBe(true);
    expect(!!alt(7).querySelector('.mad__why')).toBe(false);
    expect(text(alt(3).querySelector('.mad__why'))).toBe('It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all.');
    expect(text(alt(4).querySelector('.mad__why'))).toBe('It puts Cheer on the party.');
    // and on the bare row it prints the path chip only, no cost
    expect(alt(7).querySelectorAll('.mad__stat').length).toBe(1); // "in Special" only
  });

  it('the lead effect is whole on every rung it is printed on (0 to 5) and never clamped', () => {
    for (const d of RUNGS) {
      const eff = html(OMNIS, d).querySelector('.mad__move:not(.mad__move--alt) .mad__effect');
      expect(!!eff, `rung ${d}`).toBe(d <= 5);
      expect(eff?.classList.contains('mad__effect--clamp') ?? false, `rung ${d} clamped`).toBe(false);
      if (eff) expect(text(eff), `rung ${d}`).toBe('Swaps a bench member into the slot; they take this turn');
    }
  });
});

describe('rung 6 and the bare rung keep one tight line of the effect of the lead when it fits (release 39.1: the Sin strip, Chapter XVIII; Chapter XII)', () => {
  const tight = (v: AdvisorView): HTMLElement => {
    const el = document.createElement('div');
    el.innerHTML = cardHtml(v, MAX_DENSITY, true);
    return el;
  };
  it('prints the effect after the path row, only for the lead and only when asked', () => {
    const eff = tight(HASTEGA).querySelector('.mad__move:not(.mad__move--alt) .mad__effect');
    expect(text(eff)).toBe('Speeds the party’s turns up');
    expect(eff?.classList.contains('mad__effect--tight')).toBe(true);
    expect(html(HASTEGA, MAX_DENSITY).querySelector('.mad__effect'), 'not asked: the bare rung as it was').toBeNull();
    expect(tight(OMNIS).querySelector('.mad__move--alt .mad__effect')).toBeNull();
  });
  it('prints nothing for a move with no effect text (Close in) and changes no other rung', () => {
    expect(tight(CLOSE_IN).querySelector('.mad__effect')).toBeNull();
    for (const d of [0, 1, 2, 3, 4, 5] as Density[]) expect(cardHtml(HASTEGA, d, true)).toBe(cardHtml(HASTEGA, d));
  });
  it('gives rung 6 its effect back the same way (it loses it otherwise), for the lead alone', () => {
    const el = document.createElement('div');
    el.innerHTML = cardHtml(OMNIS, 6, true);
    expect(text(el.querySelector('.mad__move:not(.mad__move--alt) .mad__effect'))).toBe('Swaps a bench member into the slot; they take this turn');
    expect(el.querySelector('.mad__move--alt .mad__effect')).toBeNull();
    expect(html(OMNIS, 6).querySelector('.mad__effect')).toBeNull();
  });
});

describe('the actor leads the first line too: shown instead of the head row on the last rung and in a narrow card', () => {
  it('rung 7: no title, no head row, the actor in the lead line, shown on its own (the Sin strip fits its 37 grid px)', () => {
    for (const v of [STEAL, HASTEGA, CLOSE_IN, OMNIS]) {
      const el = html(v, MAX_DENSITY);
      expect(el.querySelector('.mad__head')).toBeNull();
      expect(el.querySelector('.mad__title')).toBeNull();
      const inline = el.querySelectorAll('.mad__actor--inline');
      expect(inline.length).toBe(1);
      expect(inline[0]!.classList.contains('mad__actor--always')).toBe(true);
      expect(inline[0]!.closest('.mad__move:not(.mad__move--alt)')).not.toBeNull();
      expect(text(inline[0]!)).toBe(v.actorName);
    }
  });

  it('rungs 0 to 6 keep the head row with the title and the actor, and carry the name in the first line as well (a narrow card shows that one)', () => {
    for (const d of [0, 1, 2, 3, 4, 5, 6] as Density[]) {
      const el = html(HASTEGA, d);
      expect(el.querySelector('.mad__head .mad__title')).not.toBeNull();
      expect(text(el.querySelector('.mad__head .mad__actor'))).toBe('Tidus');
      const inline = el.querySelectorAll('.mad__actor--inline');
      expect(inline.length, `rung ${d}`).toBe(1);
      expect(inline[0]!.classList.contains('mad__actor--always'), `rung ${d}`).toBe(false);
    }
  });

  it('a runner-up never carries the name', () => {
    for (const d of RUNGS) expect(html(OMNIS, d).querySelector('.mad__move--alt .mad__actor--inline'), `rung ${d}`).toBeNull();
  });

  it('on the phone the inline name is hidden with the head (the tip prints the move line only, as before)', () => {
    const css = readFileSync('src/ui/common/phone-battle-parts.css', 'utf8');
    expect(css).toMatch(/html\[data-phone-battle\] \.mad__head,\s*html\[data-phone-battle\] \.mad__actor--inline,/);
  });
});

describe('the stylesheet', () => {
  const css = readFileSync('src/ui/common/move-advisor.css', 'utf8');

  it('in a narrow card the title is hidden (it wrapped to a head of three rows) and the actor moves onto the first line', () => {
    expect(css).toMatch(/\.mad__card\s*\{\s*container-type:\s*inline-size/);
    const narrow = css.slice(css.indexOf('@container (max-width: 104px)'));
    expect(narrow).toMatch(/\.mad__title\s*\{\s*display:\s*none/);
    expect(narrow).toMatch(/\.mad__head\s*\{\s*display:\s*none/);
    expect(narrow).toMatch(/\.mad__actor--inline\s*\{\s*display:\s*inline/);
  });

  it('no sentence on the card is clamped to an ellipsis (round 22, PR-0330) and the tight effect line of the strip has its own leading', () => {
    expect(css).not.toMatch(/line-clamp/);
    expect(css).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(css).toMatch(/\.mad__effect--tight\s*\{[^}]*line-height:\s*1\.15/);
  });
});
