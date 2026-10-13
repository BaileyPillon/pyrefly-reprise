/**
 * The ladder's ring reader (`helpers/yunalescaRing.ts`, RC6; FFX only) predicts Yunalesca's Mega Death exactly: before each of her ordinary Form III turns
 * with no aeon on the field, it says "Mega Death next" if and only if that turn is the Mega Death. The candidate lines of `re-parity-rc6-ch2-ladder.test.ts`
 * that time something by the ring (a guard, a cure, a held revive) are only as good as this, so it is checked against the engine's own log on 30 seeds
 * (1,098 turns and 197 Mega Deaths over 60 seeds when it was written, all agreeing).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { readRing } from './helpers/yunalescaRing.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
function fallback(d: Input): Command {
  const r = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!r) return { kind: 'defend', targets: [] } as Command;
  const t = r.validTargets[0];
  return { ...r.command, targets: t ? [t] : [] } as Command;
}

describe('the ring reader', () => {
  it('says Mega Death next exactly when her next ordinary turn is the Mega Death', async () => {
    await registerBattleContent();
    let checked = 0;
    let megaDeaths = 0;
    const bad: string[] = [];
    for (let seed = 1; seed <= 30; seed += 1) {
      const chapter = CHAPTERS.find((c) => c.id === 'yunalesca')!;
      const setup: BattleSetup = setupForChapter(chapter, seed);
      const engine = new FFXEngine({ autoResolveMinigames: true });
      engine.setSeed(setup.seed);
      engine.init(setup);
      for (let step = 0; step < 200_000; step += 1) {
        const d = engine.nextDecision();
        if (d.kind === 'resolved' || d.kind === 'waiting') continue;
        if (d.kind === 'battle-over') break;
        engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
      }
      const log = (engine.state() as BattleState).log;
      let entryOpen = false;
      for (let i = 0; i < log.length; i += 1) {
        const e = log[i]!;
        if (e.type === 'form-change' && e.enemyId === 'yunalesca') entryOpen = true;
        if (e.type !== 'turn-start' || e.actorId !== 'yunalesca') continue;
        if (entryOpen) { entryOpen = false; continue; }
        const ring = readRing(log.slice(0, i), 'yunalesca');
        if (ring.form !== 2 || ring.aeonOut) continue;
        let name = '';
        for (let j = i + 1; j < log.length; j += 1) {
          const f = log[j]!;
          if (f.type === 'action-start' && f.actorId === 'yunalesca') { name = f.abilityName ?? ''; break; }
          if (f.type === 'turn-start') break;
        }
        checked += 1;
        const isMega = name === 'Mega Death';
        if (isMega) megaDeaths += 1;
        if (ring.megaDeathNext !== isMega) bad.push(`seed ${seed} log ${i}: ${name} with ${ring.turns} turns`);
      }
    }
    expect(bad).toEqual([]);
    expect(checked).toBeGreaterThan(300);
    expect(megaDeaths).toBeGreaterThan(50);
  }, 120_000);
});
