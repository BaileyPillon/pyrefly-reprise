/**
 * PR-0159: Chapter VIII's voice pass.
 *
 * Game case: FFX only (Chapter VIII, the Fahrenheit; research/writing-bible.md
 * §1.1 Tidus, §1.5 Wakka, §1.6 Lulu, §1.8 Rikku). Round 11 counted 0
 * contractions in 47 lines, so Tidus, Rikku, Wakka and Cid read alike.
 *
 * Kept as written, by the thresholds program's brief: Brother (§1.17's
 * Al Bhed-inflected English is his voice), Cid (untouched), and Rikku's
 * translation of Brother (PR-0160, a question for Bailey). The beats and the
 * line count stay.
 */

import { describe, expect, it } from 'vitest';

import type { SayStep, Step, StoryScript } from '../../src/story/dsl.ts';
import { evraeAirshipScripts } from '../../src/story/scripts/evrae-airship.ts';

function flatten(script: StoryScript): Step[] {
  const out: Step[] = [];
  for (const s of script) {
    out.push(s);
    if (s.type === 'parallel') out.push(...flatten(s.steps));
    if (s.type === 'ifFlag') out.push(...flatten([...s.then, ...(s.else ?? [])]));
  }
  return out;
}

const says: SayStep[] = [
  evraeAirshipScripts.pre,
  evraeAirshipScripts.post,
  ...Object.values(evraeAirshipScripts.midScripts),
].flatMap((s) => flatten(s).filter((x): x is SayStep => x.type === 'say'));

const CONTRACTION = /\b\w+'(s|re|ve|ll|d|t|m)\b|'cause|c'mon|gonna|kinda/i;
const by = (who: string): SayStep[] => says.filter((s) => s.who === who);

describe('Chapter VIII voice pass (PR-0159)', () => {
  it('keeps the beats: 47 lines', () => {
    expect(says).toHaveLength(47);
  });

  it('Tidus, Rikku and Wakka talk like themselves', () => {
    for (const who of ['tidus', 'rikku', 'wakka'] as const) {
      const lines = by(who);
      const casual = lines.filter((l) => CONTRACTION.test(l.text) || /\bya\?|brudda/i.test(l.text));
      expect(casual.length / lines.length, `${who}: ${lines.map((l) => l.text).join(' | ')}`).toBeGreaterThanOrEqual(0.4);
    }
    // Wakka's `ya?` tag on roughly one line in three (§1.5).
    expect(by('wakka').filter((l) => /\bya\?/.test(l.text)).length).toBeGreaterThanOrEqual(2);
  });

  it('no line of the party reads as stilted spelled-out English any more', () => {
    const stilted = /\b(That is it|You are welcome|We are not|It is faster|He is turning|I have potions|You would be|It is not)\b/;
    expect(says.filter((s) => stilted.test(s.text)).map((s) => `${s.who}: ${s.text}`)).toEqual([]);
  });

  it('Brother, Cid and Rikku\'s translation of Brother are untouched', () => {
    expect(by('brother').map((l) => l.text)).toEqual([
      'YUNA! Bevelle! They are marrying her to that man!',
      'She is in there alone.',
      'I am flying! Be quiet and be impressed!',
    ]);
    expect(by('cid').map((l) => l.text)).toEqual([
      'Bevelle. Fine. Everybody hold on to something.',
      'Nobody asked me twice. Nobody is going to have to.',
      'Listen up! I can move this ship, or I can shoot!',
      'Not both. You pick, and you pick fast!',
      'Incoming! That is the city shooting at us!',
      'She is holed. I have to pull her off.',
      'Not like this.',
      'Missiles away! Count them, they are not free!',
    ]);
    expect(by('rikku').map((l) => l.text)).toContain('He says Bevelle. He says within the hour.');
  });
});
