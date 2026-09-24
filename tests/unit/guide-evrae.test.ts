/**
 * `EVRAE_GUIDE` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/guides/index.ts` yet
 * (`GUIDES` carries a hard length assertion in
 * `tests/unit/strategy-guide.test.ts`) — see `src/data/guides/evrae.ts` and
 * `docs/handoff/chapter-evrae-engine.md` for why. These tests apply the same
 * shape rules `strategy-guide.test.ts` applies to every registered guide,
 * directly against the unregistered export, the same pattern
 * `tests/unit/guide-seymour-anima-macalania.test.ts` used before its own
 * integrator commit.
 */

import { describe, expect, it } from 'vitest';

import { EVRAE_GUIDE } from '../../src/data/guides/evrae.ts';

const CITE = /^(ffx|ffx2)-[a-z0-9-]+ §/;

describe('EVRAE_GUIDE', () => {
  it('is FFX only — no FFX-2 boss id and no FFX-2 citation anywhere', () => {
    for (const id of EVRAE_GUIDE.bossIds) {
      expect(id.startsWith('ffx2-')).toBe(false);
    }
    for (const r of EVRAE_GUIDE.rules) expect(r.cite.startsWith('ffx-')).toBe(true);
    for (const h of EVRAE_GUIDE.hints) expect(h.cite.startsWith('ffx-')).toBe(true);
    for (const p of EVRAE_GUIDE.phases) expect(p.cite.startsWith('ffx-')).toBe(true);
  });

  it('lists 3-5 RULES, as the panel is sized for', () => {
    expect(EVRAE_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(EVRAE_GUIDE.rules.length).toBeLessThanOrEqual(5);
  });

  it('cites every sentence in the corpus’s own citation form', () => {
    for (const r of EVRAE_GUIDE.rules) {
      expect(r.cite, `rule: ${r.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const h of EVRAE_GUIDE.hints) {
      expect(h.cite, `hint: ${h.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const w of EVRAE_GUIDE.watch) {
      expect(w.cite, `watch: ${w.name}`).toMatch(CITE);
    }
    for (const p of EVRAE_GUIDE.phases) {
      expect(p.cite, `phase: ${p.label}`).toMatch(CITE);
    }
  });

  it('every RULE has a short form within the rail width', () => {
    for (const r of EVRAE_GUIDE.rules) {
      expect(r.short.length).toBeGreaterThan(0);
      expect(r.short.length).toBeLessThanOrEqual(52);
    }
  });

  it('bossIds cover the encounter, with no id claimed twice', () => {
    expect(EVRAE_GUIDE.bossIds).toContain('evrae');
    expect(new Set(EVRAE_GUIDE.bossIds).size).toBe(EVRAE_GUIDE.bossIds.length);
  });

  it('has a WATCH entry for the Inhale telegraph', () => {
    const names = EVRAE_GUIDE.watch.map((w) => w.name);
    expect(names).toContain('Inhale');
  });

  it('has a phase note for both the range game and the phase-2 trap', () => {
    const labels = EVRAE_GUIDE.phases.map((p) => p.label);
    expect(labels.some((l) => /phase 1/i.test(l))).toBe(true);
    expect(labels.some((l) => /phase 2/i.test(l))).toBe(true);
  });

  it('never tells the player to aim an element at a weakness — none exists on this boss', () => {
    const elementHints = EVRAE_GUIDE.hints.filter((h) =>
      h.when.labels?.some((l) => /Watera|Thundara|Blizzara|Fira|Water|Thunder|Blizzard|Fire/.test(l)),
    );
    expect(elementHints.length).toBeGreaterThan(0);
    for (const h of elementHints) expect(h.text).toMatch(/no weakness/i);
  });

  it('every hint that names a reflectable spell also warns about the Reflect bounce', () => {
    const reflectSensitive = EVRAE_GUIDE.hints.filter((h) => h.when.labels?.includes('Slow'));
    for (const h of reflectSensitive) expect(h.text).toMatch(/reflect/i);
  });

  it('keys the "holds a breath and the ship is FAR" hint on that state, not the label alone', () => {
    // `harmlessTurn()` (`src/engine/tactics/evrae-quiet.ts`) can land on the
    // same three item labels from its end-of-line fallback too (nothing
    // reaches, no bench swap applies), which is not the breath dodge this
    // line describes — see the comment on the hint itself and
    // `tests/unit/guide-hint-flags.test.ts` for the matcher this depends on.
    const spareItemHint = EVRAE_GUIDE.hints.find((h) => h.when.labels?.includes('Eye Drops'));
    expect(spareItemHint).toBeDefined();
    expect(spareItemHint!.when.flags).toEqual({
      'airship.breathCharged': true,
      'airship.range': 'far',
    });
  });
});
