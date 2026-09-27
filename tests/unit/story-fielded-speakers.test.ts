/**
 * PR-0037 (D-212, Bailey 2026-09-26: "fielded only, with an authored
 * fallback"): a benched character never speaks a mid-battle line, and the
 * authored fallback fires.
 *
 * Game case: both. The rule is shared story plumbing; in FFX it moves lines,
 * in FFX-2 the party is always all three and the rule leaves every line where
 * it is (and keeps FFX names in FFX-2 chapters as voices).
 */

import { describe, expect, it } from 'vitest';

import { say, type SayStep, type Step, type StoryScript } from '../../src/story/dsl.ts';
import { fieldedLine, mayVoice, partyCombatantFor } from '../../src/story/fieldedSpeakers.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

function sayLines(script: StoryScript): SayStep[] {
  const out: SayStep[] = [];
  const walk = (steps: readonly Step[]): void => {
    for (const s of steps) {
      if (s.type === 'say') out.push(s);
      else if (s.type === 'parallel') walk(s.steps);
      else if (s.type === 'ifFlag') walk([...s.then, ...(s.else ?? [])]);
    }
  };
  walk(script);
  return out;
}

describe('fieldedLine (pure)', () => {
  const line = say('rikku', "Eeew! Yunie, don't heal him!", {
    auto: 1200,
    portrait: 'rikku',
    fallback: [{ who: 'kimahri', text: 'Yuna. Do not heal him.' }, { who: 'tidus' }],
  });

  it('a fielded speaker says the line as written, with no fallback list left on it', () => {
    const out = fieldedLine(line, 'ffx', new Set(['tidus', 'yuna', 'rikku']));
    expect(out?.who).toBe('rikku');
    expect(out?.text).toBe(line.text);
    expect(out && 'fallback' in out).toBe(false);
  });

  it('a benched speaker hands the line to the first fielded stand-in, in their own words', () => {
    const out = fieldedLine(line, 'ffx', new Set(['tidus', 'yuna', 'kimahri']));
    expect(out).toMatchObject({ who: 'kimahri', text: 'Yuna. Do not heal him.', auto: 1200 });
    // The benched speaker's portrait override does not follow the line.
    expect(out?.portrait).toBeUndefined();
  });

  it('a stand-in with no text of their own says the line as written', () => {
    const out = fieldedLine(line, 'ffx', new Set(['tidus', 'yuna', 'auron']));
    expect(out).toMatchObject({ who: 'tidus', text: line.text });
  });

  it('with nobody left to say it, the line is dropped rather than spoken from the bench', () => {
    expect(fieldedLine(line, 'ffx', new Set(['yuna', 'auron', 'lulu']))).toBeNull();
    expect(fieldedLine(say('lulu', 'Stay grey.'), 'ffx', new Set(['tidus', 'yuna', 'auron']))).toBeNull();
  });

  it('a boss or a voice is never held back', () => {
    expect(fieldedLine(say('seymour', 'Let it in.'), 'ffx', new Set())?.who).toBe('seymour');
    expect(fieldedLine(say('jecht', 'No overtime in this one, kid.'), 'ffx2', new Set())?.who).toBe('jecht');
  });

  it('party membership is per game: Auron is a Farplane voice in an FFX-2 chapter', () => {
    expect(partyCombatantFor('ffx', 'auron')).toBe('auron');
    expect(partyCombatantFor('ffx2', 'auron')).toBeUndefined();
    expect(mayVoice('ffx2', 'auron', new Set(['yuna', 'rikku', 'paine']))).toBe(true);
    expect(partyCombatantFor('ffx2', 'rikku-x2')).toBe('rikku');
    expect(mayVoice('ffx2', 'rikku-x2', new Set(['yuna', 'paine']))).toBe(false);
  });
});

/**
 * Beats that only fire when their speaker is on the field: a Talk (the talker
 * acted, so is fielded), and Omnis's two named variants, which his rules emit
 * only when Lulu is on the field or Wakka turned the disc
 * (`battle/ffx/ai/seymour-omnis.ts`, `seymour-omnis-rules.ts`).
 */
const SPEAKER_GATED_AI = new Set(['omnis-disc-lesson-lulu', 'omnis-disc-turned-wakka']);
function speakerGated(
  mid: ReadonlyArray<{ id: string; when: { type: string; who?: string } }>,
  name: string,
  who: SayStep['who'],
  game: 'ffx' | 'ffx2',
): boolean {
  if (SPEAKER_GATED_AI.has(name)) return true;
  const trig = mid.find((m) => m.id === name);
  return trig?.when.type === 'ability-used' && trig.when.who === partyCombatantFor(game, who);
}

describe('every chapter: mid-battle lines are spoken by someone on the field', () => {
  for (const ch of CHAPTERS) {
    const game = ch.game;
    const build = ch.buildRef as { activeSlots?: readonly string[]; members: ReadonlyArray<{ id: string }> };
    // FFX: the opening formation. FFX-2: all three, always (no reserve).
    const opening = new Set(build.activeSlots ?? build.members.map((m) => m.id));
    const mids = Object.entries(ch.scriptsRef.midScripts);
    if (mids.length === 0) continue;

    it(`${ch.number} ${ch.id} (${game}): with the opening party, no line comes from the bench and none is lost`, () => {
      for (const [name, script] of mids) {
        for (const step of sayLines(script)) {
          if (speakerGated(ch.scriptsRef.mid, name, step.who, game)) continue;
          const out = fieldedLine(step, game, opening);
          expect(out, `${name}: "${step.text}" (${step.who}) has no fielded speaker`).not.toBeNull();
          expect(mayVoice(game, out!.who, opening), `${name}: ${out!.who} is benched`).toBe(true);
        }
      }
    });

    it(`${ch.number} ${ch.id} (${game}): benching the written speaker never lets them speak`, () => {
      for (const [name, script] of mids) {
        for (const step of sayLines(script)) {
          const id = partyCombatantFor(game, step.who);
          if (id === undefined) continue;
          const without = new Set([...opening].filter((m) => m !== id));
          const out = fieldedLine(step, game, without);
          if (out) expect(out.who, `${name}`).not.toBe(step.who);
        }
      }
    });
  }
});
