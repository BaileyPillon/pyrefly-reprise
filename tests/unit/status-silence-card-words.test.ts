/**
 * The Silence card's words, pinned per game (AGENTS.md rule 14: two tables, never merged).
 *
 * **FFX only.** Silence is a flag on the command record (re-parity RC7 lane L-CMD, FFX-G07,
 * `research/re-ffx-command-gate.md` section 1): every White and Black Magic record carries it (Scan and Esuna among them, Scan being
 * White Magic), and the Summon list, Grand Summon, Doublecast and every Overdrive carry none. A Silenced Yuna can summon, so the FFX
 * card says "no White or Black Magic" and nothing about Summon. Until 2026-10-14 it said "and no Summon".
 *
 * **FFX-2 only.** Its own card used to list what Silence stops as the research's section 2.8 did (White Magic, Black Magic and Arcana).
 * Since the RC7 command lane (X2-B, FFX2-G02) Silence stops everything the game stops, every Dance and Song and the Moogle, Cait and
 * Eraser spells included (and leaves Pray, Vigor, Focus and MP Absorb alone), so the desktop sentence says "no spells, Dances or Songs"
 * (2026-10-14, release candidate r48-rc). The phone sentence and the phone one-row line never listed what is stopped and did not change.
 *
 * The Studio's FFX-only rule row (`learn/studio/rules.ts`, "Silence") says the same as the FFX card, so it is pinned here too.
 */

import { describe, expect, it } from 'vitest';
import { STUDIO_RULES } from '../../learn/studio/rules.ts';
import { cureHint, hintStatuses } from '../../src/ui/common/statusWords.ts';

describe('FFX Silence card: White and Black Magic only (a Silenced Yuna can still summon)', () => {
  it('the desktop sentence names White and Black Magic and the three cures, and nothing about Summon', () => {
    const hint = cureHint('ffx', 'silence', 'Tidus', 'tidus')!;
    expect(hint.html).toBe(
      '<b>Tidus is silenced:</b> no White or Black Magic. <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.',
    );
  });

  it('the short sentence names only the cure, as before', () => {
    const hint = cureHint('ffx', 'silence', 'Tidus', 'tidus')!;
    expect(hint.short).toBe('<b>Tidus is silenced:</b> <b>Echo Screen</b> cures it.');
    expect(hint.label).toBe('SILENCE');
  });

  it('FFX has no one-row phone form (that is FFX-2 only)', () => {
    expect(cureHint('ffx', 'silence', 'Tidus', 'tidus')!.line).toBeUndefined();
  });

  it('no FFX Silence text mentions Summon or an aeon, for any party member, Yuna included', () => {
    for (const [name, id] of [['Tidus', 'tidus'], ['Yuna', 'yuna'], ['Auron', 'auron'], ['Lulu', 'lulu']] as const) {
      const hint = cureHint('ffx', 'silence', name, id)!;
      expect(hint.html, `${name} html`).not.toMatch(/summon|aeon/i);
      expect(hint.short, `${name} short`).not.toMatch(/summon|aeon/i);
    }
  });

  it('FFX still has a Silence card, in the order the card lists the statuses', () => {
    expect(hintStatuses('ffx')).toEqual(['zombie', 'sleep', 'silence', 'curse']);
  });
});

describe('FFX-2 Silence card: no spells, Dances or Songs (the phone forms unchanged)', () => {
  it('the desktop sentence says "no spells, Dances or Songs" and no longer lists the three magics', () => {
    const hint = cureHint('ffx2', 'silence', 'Rikku', 'rikku')!;
    expect(hint.html).toBe(
      '<b>Rikku is silenced:</b> no spells, Dances or Songs. <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.',
    );
    expect(hint.html).not.toMatch(/White Magic|Black Magic|Arcana/);
  });

  it('the sentence is the same for every girl (only the name changes) and the FFX card still says White or Black Magic', () => {
    for (const [name, id] of [['Yuna', 'yuna'], ['Rikku', 'rikku'], ['Paine', 'paine']] as const) {
      expect(cureHint('ffx2', 'silence', name, id)!.html, name).toContain(`<b>${name} is silenced:</b> no spells, Dances or Songs.`);
    }
    expect(cureHint('ffx', 'silence', 'Tidus', 'tidus')!.html).toContain('no White or Black Magic.');
    expect(cureHint('ffx', 'silence', 'Tidus', 'tidus')!.html).not.toMatch(/Dance|Song|spells/);
  });

  it('the phone sentence names the whole cure list', () => {
    const hint = cureHint('ffx2', 'silence', 'Rikku', 'rikku')!;
    expect(hint.short).toBe('Rikku is silenced: <b>Echo Screen</b>, <b>Esuna</b> or a <b>Remedy</b> cures it.');
    expect(hint.label).toBe('SILENCE');
  });

  it('the phone one-row line is unchanged', () => {
    expect(cureHint('ffx2', 'silence', 'Rikku', 'rikku')!.line).toBe('Rikku: <b>Echo Screen</b>, <b>Esuna</b>, <b>Remedy</b>');
  });

  it('the two games keep their own words: FFX never says Arcana, FFX-2 never says "White or Black Magic"', () => {
    const ffx = cureHint('ffx', 'silence', 'Rikku', 'rikku')!;
    const ffx2 = cureHint('ffx2', 'silence', 'Rikku', 'rikku')!;
    expect(ffx.html).not.toMatch(/Arcana/);
    expect(ffx2.html).not.toMatch(/White or Black Magic/);
    expect(ffx2.html).not.toBe(ffx.html);
  });
});

describe("the Studio's FFX-only Silence rule row", () => {
  it('says Silence blocks Black and White Magic and never blocks Summon or an Overdrive', () => {
    const row = STUDIO_RULES.find((r) => r.id === 'status-silence');
    expect(row, 'the Silence row exists').toBeDefined();
    expect(row!.line).toBe('Blocks Black and White Magic, but never blocks Summon or an Overdrive.');
    expect(row!.line).not.toMatch(/and Summon/);
  });
});
