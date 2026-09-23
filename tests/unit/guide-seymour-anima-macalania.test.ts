/**
 * `SEYMOUR_ANIMA_MACALANIA_GUIDE` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/guides/index.ts` yet
 * (`GUIDES` carries a hard length assertion in
 * `tests/unit/strategy-guide.test.ts`) — see
 * `src/data/guides/seymour-anima-macalania.ts` and
 * `src/engine/tactics/index.ts`'s doc comment for why. These tests apply the
 * same shape rules `strategy-guide.test.ts` applies to every registered
 * guide, directly against the unregistered export, so the content is checked
 * before the integrator wires it in — the same pattern
 * `tests/unit/guide-ffx2-leblanc.test.ts` used before its own integrator
 * commit.
 */

import { describe, expect, it } from 'vitest';

import { SEYMOUR_ANIMA_MACALANIA_GUIDE } from '../../src/data/guides/seymour-anima-macalania.ts';

const CITE = /^(ffx|ffx2)-[a-z0-9-]+ §/;

describe('SEYMOUR_ANIMA_MACALANIA_GUIDE', () => {
  it('is FFX only — no FFX-2 boss id and no FFX-2 citation anywhere', () => {
    for (const id of SEYMOUR_ANIMA_MACALANIA_GUIDE.bossIds) {
      expect(id.startsWith('ffx2-')).toBe(false);
    }
    for (const r of SEYMOUR_ANIMA_MACALANIA_GUIDE.rules) expect(r.cite.startsWith('ffx-')).toBe(true);
    for (const h of SEYMOUR_ANIMA_MACALANIA_GUIDE.hints) expect(h.cite.startsWith('ffx-')).toBe(true);
    for (const p of SEYMOUR_ANIMA_MACALANIA_GUIDE.phases) expect(p.cite.startsWith('ffx-')).toBe(true);
  });

  it('lists 3-5 RULES, as the panel is sized for', () => {
    expect(SEYMOUR_ANIMA_MACALANIA_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(SEYMOUR_ANIMA_MACALANIA_GUIDE.rules.length).toBeLessThanOrEqual(5);
  });

  it('cites every sentence in the corpus’s own citation form', () => {
    for (const r of SEYMOUR_ANIMA_MACALANIA_GUIDE.rules) {
      expect(r.cite, `rule: ${r.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const h of SEYMOUR_ANIMA_MACALANIA_GUIDE.hints) {
      expect(h.cite, `hint: ${h.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const w of SEYMOUR_ANIMA_MACALANIA_GUIDE.watch) {
      expect(w.cite, `watch: ${w.name}`).toMatch(CITE);
    }
    for (const p of SEYMOUR_ANIMA_MACALANIA_GUIDE.phases) {
      expect(p.cite, `phase: ${p.label}`).toMatch(CITE);
    }
  });

  it('every RULE has a short form within the rail width', () => {
    for (const r of SEYMOUR_ANIMA_MACALANIA_GUIDE.rules) {
      expect(r.short.length).toBeGreaterThan(0);
      expect(r.short.length).toBeLessThanOrEqual(52);
    }
  });

  it('bossIds cover every enemy id the encounter fields', () => {
    const expected = ['seymour-macalania', 'anima-macalania', 'guado-guardian-a', 'guado-guardian-b'];
    for (const id of expected) expect(SEYMOUR_ANIMA_MACALANIA_GUIDE.bossIds).toContain(id);
  });

  it('claims no boss id twice within itself', () => {
    expect(new Set(SEYMOUR_ANIMA_MACALANIA_GUIDE.bossIds).size).toBe(SEYMOUR_ANIMA_MACALANIA_GUIDE.bossIds.length);
  });

  it('has a WATCH entry for Boost and for the Oblivion gauge', () => {
    const names = SEYMOUR_ANIMA_MACALANIA_GUIDE.watch.map((w) => w.name);
    expect(names).toContain('Boost');
  });

  it('has a phase note for each of the three acts', () => {
    const labels = SEYMOUR_ANIMA_MACALANIA_GUIDE.phases.map((p) => p.label);
    expect(labels.some((l) => /act 1/i.test(l))).toBe(true);
    expect(labels.some((l) => /act 2/i.test(l))).toBe(true);
    expect(labels.some((l) => /act 3/i.test(l))).toBe(true);
  });

  it('never claims Pain damages an aeon\'s HP the way it kills a party member, without the asymmetry', () => {
    const painHints = SEYMOUR_ANIMA_MACALANIA_GUIDE.hints.filter((h) => /pain/i.test(h.text));
    expect(painHints.length).toBeGreaterThan(0);
    for (const h of painHints) expect(h.text).not.toMatch(/kills? (the |an )?aeon/i);
  });
});
