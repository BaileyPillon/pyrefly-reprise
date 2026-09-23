/**
 * Round 09 PR-0011 (FFX only): promoting a guaranteed/high-chance status into
 * the panel's brief body (`src/ui/common/enemy-intent-brief-status.ts`).
 *
 * The end-to-end shape — Lance of Atrophy's 100% Zombie actually reaching the
 * FFX panel at brief density, and FFX-2 staying untouched — is proved against
 * `bodyHtml` in `tests/unit/ui-enemy-intent.test.ts`'s density coverage and in
 * the browser check (`docs/screenshots/fix10b/`). This is the pure lookup: pick
 * the right entry out of `view.statusText`, or say nothing.
 */
import { describe, expect, it } from 'vitest';
import { briefStatusChip } from '../../src/ui/common/enemy-intent-brief-status.ts';

describe('briefStatusChip', () => {
  it('is empty with no statuses at all', () => {
    expect(briefStatusChip([])).toBe('');
  });

  it('promotes a 100% status — Lance of Atrophy\'s Zombie against an unwarded target', () => {
    const html = briefStatusChip(['Zombie 100%']);
    expect(html).toContain('Zombie 100%');
    expect(html).toContain('eint__status-chip');
  });

  it('still promotes it at the ~50% a Zombie Ward halves it to — the shipped default party\'s actual case', () => {
    const html = briefStatusChip(['Zombie 50%']);
    expect(html).toContain('Zombie 50%');
  });

  it('says nothing for a status below the meaningful-chance threshold', () => {
    expect(briefStatusChip(['Silence 25%'])).toBe('');
  });

  it('ignores a status a ward already blocked, even at 100%', () => {
    expect(briefStatusChip(['Zombie 100% (blocked)'])).toBe('');
  });

  it('picks the highest-chance eligible status among several', () => {
    const html = briefStatusChip(['Silence 30%', 'Zombie 100%', 'Poison 85%']);
    expect(html).toContain('Zombie 100%');
    expect(html).not.toContain('Poison');
    expect(html).not.toContain('Silence');
  });

  it('falls back to the next-highest when the top one is blocked', () => {
    const html = briefStatusChip(['Zombie 100% (blocked)', 'Poison 85%']);
    expect(html).toContain('Poison 85%');
  });

  it('escapes its text', () => {
    const html = briefStatusChip(['<b>Zombie</b> 100%']);
    expect(html).not.toContain('<b>Zombie</b>');
    expect(html).toContain('&lt;b&gt;');
  });
});
