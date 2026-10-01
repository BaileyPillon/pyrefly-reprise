/**
 * **The race term** (PR-0269, round 17; `src/engine/tactics/advisor-race.ts`).
 *
 * Chapter XVIII is a clock: Giga-Graviton on Sin's last turn, and the Game Over is the script
 * (research/ffx-sin.md §3.4 [verified: 4 sources]). A card-follower lost it 5 of 5 in round 17, and
 * the node bench showed why: on Sin's last turn the forecast read Giga-Graviton as a lethal hit and
 * the card spent the party's last actions on Al Bhed Potions, Hi-Potions and Remedies; before that,
 * the line's X-Potions topped up a party nothing could kill.
 *
 * The boards here are reached by the chapter's own line (`intendedStrategy`), which this change
 * does not touch, so the same board is read before and after the fix.
 *
 * Game case: FFX only (the Sin chapters); the last block pins that every other board is unchanged.
 */

import { describe, expect, it } from 'vitest';
import type { BattleState, Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView } from '../../src/engine/tactics/advisor.ts';
import { forecastFromState } from '../../src/engine/tactics/advisor-forecast.ts';
import { offRaceLine, raceHolds, raceLift, raceOf, stable } from '../../src/engine/tactics/advisor-race.ts';
import { DEFAULT_WEIGHTS, lostValue } from '../../src/engine/tactics/advisor-v4/value.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Play `chapterId` on `seed` by the chapter's line until `stop` says so; the board and menu there. */
async function lineUntil(
  chapterId: string,
  seed: number,
  stop: (s: Readonly<BattleState>, d: Input, e: FFXEngine) => boolean,
): Promise<{ e: FFXEngine; d: Input } | null> {
  await registerBattleContent();
  const e = new FFXEngine({ autoResolveMinigames: true });
  const setup = setupForChapter(CHAPTERS.find((c) => c.id === chapterId)!, seed);
  e.setSeed(setup.seed);
  e.init(setup);
  for (let i = 0; i < 20_000; i++) {
    const d = e.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind !== 'player-input') continue;
    if (stop(e.state(), d, e)) return { e, d };
    const pick = intendedStrategy(d.actorId, d.commands, e as never);
    if (!pick || e.submit(pick).length === 0) return null;
  }
  return null;
}

const left = (s: Readonly<BattleState>): number | undefined => {
  const v = s.flags['sin.turnsLeft'];
  return typeof v === 'number' ? v : undefined;
};

const hurt = (s: Readonly<BattleState>): boolean =>
  s.activeIds.some((id) => {
    const c = s.combatants[id]!;
    return c.side !== 'enemy' && c.alive !== false && c.hp < c.stats.maxHp;
  });

const HEALS = /Potion|Elixir|Cura|Cure|Pray|Remedy|Soft|Holy Water|Esuna/;

describe('Overdrive Sin: the clock (Chapter XVIII)', () => {
  it('Giga-Graviton is not a lethal hit to heal against: the last turn’s card deals damage', async () => {
    let checked = 0;
    for (const seed of [1, 2, 3, 5]) {
      const at = await lineUntil('sin-face', seed, (s) => left(s) === 1 && hurt(s));
      if (!at) continue;
      const s = at.e.state();
      const card = buildAdvisorView(s, { actorId: at.d.actorId, commands: at.d.commands }, {})!;
      const top = card.suggestions[0]!;
      expect((top.facts ?? []).some((x) => x.kind === 'saves-from-lethal')).toBe(false);
      expect(top.label).not.toMatch(/Potion|Elixir|Cura|Pray/);
      // The forecast no longer names the scripted Game Over (it would read every member lethal).
      const f = forecastFromState(s, {});
      expect(f?.abilityId ?? null).not.toBe('overdrive-sin-giga-graviton');
      expect(stable(s, f)).toBe(true);
      expect(raceOf(s)).toEqual({ kind: 'clock', turnsLeft: 1 });
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  it('on Sin’s last turn a raise gives way to damage (the raised ally cannot act before Giga-Graviton)', async () => {
    const at = await lineUntil('sin-face', 1, (s) => left(s) === 1);
    expect(at).not.toBeNull();
    const s = at!.e.state();
    const base = { hpDelta: {}, healingToAllies: 0, harmToAllies: 0, hits: 0, misses: 0, kills: [], statusChanges: [], mpSpent: 0, rejected: false, ability: null, events: [] };
    const row = (outcome: object) => ({ suggestion: { score: 1, source: 'tactic' as const, isSwitch: false }, outcome: { ...base, ...outcome } as never, facts: [] });
    const raise = row({ revives: ['auron'], damageToEnemies: 0, healingToAllies: 3246 });
    const swing = row({ revives: [], damageToEnemies: 2500 });
    expect(raceLift(s, [raise, swing], forecastFromState(s, {}))).toBe(swing);
    // Earlier on the clock a raise stands: the ally has turns left to give.
    const early = await lineUntil('sin-face', 1, (b) => (left(b) ?? 0) >= 5 && (left(b) ?? 0) <= 9);
    expect(raceLift(early!.e.state(), [raise, swing], forecastFromState(early!.e.state(), {}))).toBeNull();
  });

  it('with nobody in lethal range, a line heal gives way to the row that deals the most damage', async () => {
    let checked = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const at = await lineUntil('sin-face', seed, (s, d, e) => {
        const pick = intendedStrategy(d.actorId, d.commands, e as never);
        if (!pick || !/potion/.test(String((pick as { id?: unknown }).id ?? ''))) return false;
        return stable(s, forecastFromState(s, {}));
      });
      if (!at) continue;
      const s = at.e.state();
      const card = buildAdvisorView(s, { actorId: at.d.actorId, commands: at.d.commands }, {})!;
      const top = card.suggestions[0]!;
      expect(top.label).not.toMatch(HEALS);
      // The card's words are its existing ones for that row: no "the long plan is still X-Potion".
      expect(top.reason).not.toMatch(/long plan/);
      const out = simulateFFXCommand(s, at.d.actorId, top.command);
      expect(out!.damageToEnemies).toBeGreaterThan(0);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  it('advisor v4: on the clock a stable party’s challenger must deal damage or raise', async () => {
    const at = await lineUntil('sin-face', 1, (s) => (left(s) ?? 99) <= 9 && hurt(s));
    expect(at).not.toBeNull();
    const s = at!.e.state();
    const intent = forecastFromState(s, {});
    expect(stable(s, intent)).toBe(true);
    const heal = at!.d.commands.find((c) => c.enabled && c.label === 'Hi-Potion');
    if (heal) {
      const target = s.activeIds.find((id) => s.combatants[id]!.side !== 'enemy')!;
      const out = simulateFFXCommand(s, at!.d.actorId, { ...heal.command, targets: [target] } as never);
      expect(offRaceLine(s, out, intent)).toBe(true);
    }
    const swing = at!.d.commands.find((c) => c.enabled && c.command.kind === 'attack');
    const hit = simulateFFXCommand(s, at!.d.actorId, { ...swing!.command, targets: ['overdrive-sin'] } as never);
    expect(offRaceLine(s, hit, intent)).toBe(false);
    // ...and v3's own damage row stands without a search; upkeep does not.
    expect(raceHolds(s, swing!.command, hit, intent)).toBe(true);
    if (heal) {
      const target = s.activeIds.find((id) => s.combatants[id]!.side !== 'enemy')!;
      const cmd = { ...heal.command, targets: [target] } as never;
      expect(raceHolds(s, heal.command, simulateFFXCommand(s, at!.d.actorId, cmd), intent)).toBe(false);
    }
  });

  it('advisor v4: a lost future on the clock is worth the share of Sin it took, below any win', async () => {
    const root = await lineUntil('sin-face', 1, () => true);
    const leaf = await lineUntil('sin-face', 1, (s) => (left(s) ?? 99) <= 2);
    const v = lostValue(root!.e.state(), leaf!.e.state(), { rootAhead: 0, leafAhead: 0 }, DEFAULT_WEIGHTS);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(DEFAULT_WEIGHTS.victory);
  });
});

describe('only the Sin boards race', () => {
  it('Chapter XVII is an HP race (v4 credit only); no other FFX chapter is a race', async () => {
    const fins = await lineUntil('sin-fins-core', 1, () => true);
    expect(raceOf(fins!.e.state())).toEqual({ kind: 'hp' });
    for (const id of ['seymour-flux', 'yunalesca', 'braskas-final-aeon']) {
      const b = await lineUntil(id, 1, () => true);
      const s = b!.e.state();
      expect(raceOf(s)).toBeNull();
      expect(lostValue(s, s, { rootAhead: 1, leafAhead: 0 }, DEFAULT_WEIGHTS)).toBe(0);
      expect(offRaceLine(s, null, null)).toBe(false);
      expect(raceHolds(s, { kind: 'switch' }, null, null)).toBe(false);
    }
  });
});
