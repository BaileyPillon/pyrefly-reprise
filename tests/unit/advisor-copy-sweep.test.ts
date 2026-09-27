/**
 * The advisor's composed sentences are plain English, one claim each (critic
 * round 13 PR-0074; CHK-007).
 *
 * Before: the planner joined any two facts with ", and", so a damage figure or
 * a forecast was glued onto the lead clause as if it were a second deed: "It
 * finishes Fem-Goon, and 565 damage." / "It puts Max Hp X2 on the party, and
 * Left-Arm Strike is worth about 2490." And the effect line and the reason
 * said the same status twice: "Inflicts Shell" over "It puts Shell on the
 * party."
 *
 * The sweep follows the card's top row through six chapters of both games and
 * reads every card it prints (at least 300).
 *
 * **Game case: both** [AGENTS.md rule 14]: the sentence composer and the effect
 * line are shared by both games' cards.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { harnessFor } from '../../critic/bench/advisor-v2/harness.ts';
import { buildAdvisorView, clearAdvisorCache, type MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { sentenceFor } from '../../src/engine/tactics/advisor-say.ts';
import { dropRepeatedStatuses } from '../../src/engine/tactics/advisor-copy.ts';

const CHAPTERS = ['ffx2-leblanc', 'braskas-final-aeon', 'ffx2-bahamut', 'seymour-flux', 'yunalesca', 'ffx2-vegnagun-shuyin'];

/** Statuses the effect line names ("inflicts Slow, Poison" / "grants Shell"). */
function effectStatuses(effect: string): string[] {
  const m = effect.match(/(?:inflicts|grants) ([^·]+)/i);
  return m ? m[1]!.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
}

function sweep(): MoveSuggestion[] {
  const out: MoveSuggestion[] = [];
  for (const ch of CHAPTERS) {
    for (const seed of [1, 2]) {
      clearAdvisorCache();
      const { engine, options } = harnessFor(ch, seed);
      let cards = 0;
      for (let i = 0; i < 20_000 && cards < 40; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') {
          engine.tick?.(100);
          continue;
        }
        const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ...options, planner: true });
        cards++;
        out.push(...(view?.suggestions ?? []));
        const top = view?.suggestions[0]?.command;
        const row = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
        const fallback = row ? ({ ...row.command, targets: [row.validTargets[0]!] } as Command) : ({ kind: 'defend', targets: [] } as Command);
        engine.submit(top ?? fallback);
      }
    }
  }
  return out;
}

let swept: MoveSuggestion[] | null = null;
function sweepOnce(): MoveSuggestion[] {
  swept ??= sweep();
  return swept;
}

describe('advisor copy sweep (PR-0074)', () => {
  const all = sweepOnce();

  it('reads at least 300 cards', () => {
    expect(all.length).toBeGreaterThanOrEqual(300);
  });

  it('never glues a bare damage figure on with "and"', () => {
    for (const s of all) expect(s.reason, s.label).not.toMatch(/\band \d[\d,]* damage\b/);
  });

  it('never says the same status in the effect line and the reason', () => {
    for (const s of all) {
      const reason = s.reason.toLowerCase();
      for (const st of effectStatuses(s.effect)) {
        expect(reason.includes(st), `${s.label}: "${s.effect}" / "${s.reason}"`).toBe(false);
      }
    }
  });

  it('prints HP and MP in capitals inside status names', () => {
    for (const s of all) expect(`${s.effect} ${s.reason}`, `${s.label}: ${s.effect} / ${s.reason}`).not.toMatch(/\b(Hp|Mp)\b/);
  });
});

describe('the second clause is templated by its kind', () => {
  const kill = { kind: 'kills', text: 'it finishes Fem-Goon', value: 500, source: 'sim' } as const;
  const buff = { kind: 'certain-status', text: 'it puts Protect on the party', value: 100, source: 'sim' } as const;

  it('a kill plus its damage reads "with N damage"', () => {
    const phase = { kind: 'phase', text: '565 damage', value: 565, source: 'sim' } as const;
    expect(sentenceFor([kill, phase], 'certain')).toBe('It finishes Fem-Goon with 565 damage');
  });

  it('a status plus its damage says the move deals it', () => {
    const phase = { kind: 'phase', text: '1875 damage', value: 1875, source: 'sim' } as const;
    expect(sentenceFor([buff, phase], 'certain')).toBe('It puts Protect on the party, and it deals 1,875 damage');
  });

  it('a forecast is context: "next, <move> hits for about N"', () => {
    const inc = { kind: 'incoming', text: 'Left-Arm Strike hits for about 2,500', value: 2490, source: 'forecast' } as const;
    expect(sentenceFor([buff, inc], 'certain')).toBe('It puts Protect on the party; next, Left-Arm Strike hits for about 2,500');
  });

  it('a lost place in the turn order is a cost: "but"', () => {
    const tempo = { kind: 'tempo', text: 'it costs 1 place in the turn order', value: 1, source: 'turnOrder' } as const;
    expect(sentenceFor([buff, tempo], 'certain')).toBe('It puts Protect on the party, but it costs 1 place in the turn order');
  });
});

describe('dropRepeatedStatuses', () => {
  it('takes a repeated status out of a derived "inflicts" list and keeps the rest', () => {
    expect(dropRepeatedStatuses('Physical damage · inflicts Def Down', 'It puts Def Down on Ormi', ['Def Down'])).toBe('Physical damage');
    expect(dropRepeatedStatuses('Inflicts Shell', 'It puts Shell on the party', ['Shell'])).toBe('');
    expect(dropRepeatedStatuses('Magic damage · inflicts Slow, Poison', 'Slow on Yu Pagoda A lands about 40 times in 100', [])).toBe(
      'Magic damage · inflicts Poison',
    );
  });

  it('drops a menu-help sentence that names a status the reason says', () => {
    expect(dropRepeatedStatuses('Grants Protect to the whole party', 'It puts Protect on the party', ['Protect'])).toBe('');
  });

  it('leaves an effect line alone when nothing repeats', () => {
    expect(dropRepeatedStatuses('Fire magic damage', 'It finishes Ormi with 565 damage', [])).toBe('Fire magic damage');
  });

  it('every swept card: no applied status in both lines', () => {
    for (const s of sweepOnce()) {
      for (const st of s.statuses) {
        const both = new RegExp(`\\b${st.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        expect(both.test(s.effect) && both.test(s.reason), `${s.label}: "${s.effect}" / "${s.reason}"`).toBe(false);
      }
    }
  });
});
