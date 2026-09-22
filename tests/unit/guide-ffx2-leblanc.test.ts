/**
 * `FFX2_LEBLANC_GUIDE` standalone content checks.
 *
 * This chapter is **not registered** in `src/data/guides/index.ts` yet
 * (`GUIDES` carries a hard length assertion in
 * `tests/unit/strategy-guide.test.ts`) — see
 * `src/data/guides/ffx2-leblanc.ts` for why. These tests apply the same
 * shape rules `strategy-guide.test.ts` applies to every registered guide,
 * directly against the unregistered export, so the content is checked before
 * the integrator wires it in.
 */

import { describe, expect, it } from 'vitest';

import { FFX2_LEBLANC_GUIDE } from '../../src/data/guides/ffx2-leblanc.ts';

const CITE = /^(ffx|ffx2)-[a-z0-9-]+ §/;

describe('FFX2_LEBLANC_GUIDE', () => {
  it('is FFX-2 only — no FFX boss id and no FFX citation anywhere', () => {
    for (const id of FFX2_LEBLANC_GUIDE.bossIds) {
      expect(id.startsWith('ffx-')).toBe(false);
    }
    for (const r of FFX2_LEBLANC_GUIDE.rules) expect(r.cite.startsWith('ffx2-')).toBe(true);
    for (const h of FFX2_LEBLANC_GUIDE.hints) expect(h.cite.startsWith('ffx2-')).toBe(true);
    for (const p of FFX2_LEBLANC_GUIDE.phases) expect(p.cite.startsWith('ffx2-')).toBe(true);
  });

  it('lists 3-5 RULES, as the panel is sized for', () => {
    expect(FFX2_LEBLANC_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(FFX2_LEBLANC_GUIDE.rules.length).toBeLessThanOrEqual(5);
  });

  it('cites every sentence in the corpus’s own citation form', () => {
    for (const r of FFX2_LEBLANC_GUIDE.rules) {
      expect(r.cite, `rule: ${r.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const h of FFX2_LEBLANC_GUIDE.hints) {
      expect(h.cite, `hint: ${h.text.slice(0, 40)}`).toMatch(CITE);
    }
    for (const w of FFX2_LEBLANC_GUIDE.watch) {
      expect(w.cite, `watch: ${w.name}`).toMatch(CITE);
    }
    for (const p of FFX2_LEBLANC_GUIDE.phases) {
      expect(p.cite, `phase: ${p.label}`).toMatch(CITE);
    }
  });

  it('every RULE has a short form within the rail width', () => {
    for (const r of FFX2_LEBLANC_GUIDE.rules) {
      expect(r.short.length).toBeGreaterThan(0);
      expect(r.short.length).toBeLessThanOrEqual(52);
    }
  });

  it('bossIds cover every enemy id the data and AI scripts field', () => {
    // `leblanc-syndicate.ts` (Act III) + `leblanc-syndicate-acts.ts` (Acts I/II).
    const expected = [
      'leblanc',
      'logos',
      'ormi',
      'logos-room',
      'ormi-logos-room',
      'ormi-entrance',
      'dr-goon',
      'fem-goon',
    ];
    for (const id of expected) expect(FFX2_LEBLANC_GUIDE.bossIds).toContain(id);
  });

  it('claims no boss id twice within itself', () => {
    expect(new Set(FFX2_LEBLANC_GUIDE.bossIds).size).toBe(FFX2_LEBLANC_GUIDE.bossIds.length);
  });

  it('has no WATCH entries — no ability in this fight emits a `charge` event', () => {
    expect(FFX2_LEBLANC_GUIDE.watch).toEqual([]);
  });

  it('has a phase note for each of the three acts', () => {
    const bossIds = FFX2_LEBLANC_GUIDE.phases.map((p) => p.bossId);
    expect(bossIds).toContain('ormi-entrance');
    expect(bossIds).toContain('logos-room');
    expect(bossIds).toContain('leblanc');
  });

  it('never recommends a cure for Eject, matching §4.3’s "no cure exists"', () => {
    const eject = FFX2_LEBLANC_GUIDE.hints.filter((h) => /eject/i.test(h.text));
    for (const h of eject) expect(h.text).not.toMatch(/cures? eject/i);
  });
});
