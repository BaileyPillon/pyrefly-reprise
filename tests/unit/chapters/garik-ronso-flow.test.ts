/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter), through the app's own setup: a seeded run of each fight on three seeds to its verdict, the same seed twice, the rewards of each, and the story triggers firing in
 * their own fight and no other. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is one link either way (no chain, no seam, no carry): `setupForChapter` is the whole path from the record to the engine, with the setting naming the formation (`garik-ronso-trust.test.ts`) and the chapter's mid
 * triggers laid on it. The line is the shipped tactic (the auto-battler's), an input to a run and never game data.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { BattleEngine, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { RONSO_TRUST_DEFAULT, setRonsoTrust, setRonsoTrustStorageForTests, type RonsoTrust } from '../../../src/data/garik-ronso-trust.ts';
import { ffx2GarikRonso } from '../../../src/engine/tactics/ffx2-garik-ronso.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

afterEach(() => setRonsoTrustStorageForTests(undefined));

interface Run {
  engine: FFX2Engine;
  outcome: string | undefined;
  result: { ap: number; exp: number; gil: number; drops: Array<{ itemId: string; count: number }> } | undefined;
  log: readonly BattleEvent[];
}

/** One whole fight from the chapter record under the given trust, the shipped tactic for the girls (or `defendOnly` with girls who cannot die, to read a script to its end). */
function run(trust: RonsoTrust, seed: number, opts: { defendOnly?: boolean; rig?: (e: FFX2Engine) => void } = {}): Run {
  setRonsoTrustStorageForTests(null);
  setRonsoTrust(trust);
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setupForChapter(FFX2_GARIK_RONSO, seed));
  if (opts.defendOnly) {
    for (const id of ['yuna', 'rikku', 'paine']) {
      const u = engine.state().combatants[id] as unknown as { hp: number; stats: { maxHp: number } };
      u.stats.maxHp = u.hp = 900_000;
    }
  }
  opts.rig?.(engine);
  let outcome: string | undefined;
  let result: Run['result'];
  for (let i = 0; i < 40_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      result = d.result as unknown as Run['result'];
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const defend: Command = { kind: 'defend', targets: [] };
    if (opts.defendOnly) {
      // read a script to its end: stop once the fighters have acted a few dozen times (the girls only defend, so the fight never ends)
      if (engine.state().log.filter((e) => e.type === 'action-start').length > 300) break;
      engine.submit(defend);
      continue;
    }
    engine.submit(ffx2GarikRonso(d.actorId, d.commands, engine as unknown as BattleEngine) ?? defend);
  }
  return { engine, outcome, result, log: engine.state().log };
}

describe('a seeded run of each fight, through the app\'s own setup', () => {
  for (const [trust, label, pay] of [['low', 'the hostile fight', { ap: 7, exp: 820, gil: 130 }], ['high', 'the friendly bout', { ap: 5, exp: 600, gil: 110 }]] as const) {
    it(`${label}: seeds 1 to 3 end in a victory that pays the formation's rows (${pay.exp} EXP, ${pay.gil} Gil, ${pay.ap} AP), and the same seed plays the same fight twice`, () => {
      for (const seed of [1, 2, 3]) {
        const a = run(trust, seed);
        expect(a.outcome, `${trust} seed ${seed}`).toBe('victory');
        expect([a.result!.ap, a.result!.exp, a.result!.gil], `${trust} seed ${seed}`).toEqual([pay.ap, pay.exp, pay.gil]);
        const b = run(trust, seed);
        expect(JSON.stringify(b.log), `${trust} seed ${seed}: the same seed, the same log`).toBe(JSON.stringify(a.log));
      }
      expect(JSON.stringify(run(trust, 1).log)).not.toBe(JSON.stringify(run(trust, 2).log));
    });
  }

  it('the drops: Garik\'s Shining Bracer and the Youth\'s Remedy come from the rows (the hostile fight has two Youths to drop one each)', () => {
    const hostile = run('low', 2).result!.drops;
    const friendly = run('high', 2).result!.drops;
    for (const drops of [hostile, friendly]) {
      for (const d of drops) expect(['x2-remedy', 'shining-bracer']).toContain(d.itemId);
    }
    const remedies = (drops: Array<{ itemId: string; count: number }>): number => drops.filter((d) => d.itemId === 'x2-remedy').reduce((n, d) => n + d.count, 0);
    expect(remedies(hostile)).toBeGreaterThanOrEqual(2);
    expect(remedies(friendly)).toBeGreaterThanOrEqual(1);
  });

  it('the defaults: with the setting untouched the chapter plays the hostile fight (three foes, 15,000 HP)', () => {
    setRonsoTrustStorageForTests(null);
    const setup = setupForChapter(FFX2_GARIK_RONSO, 1);
    expect(RONSO_TRUST_DEFAULT).toBe('low');
    expect(setup.enemies.enemies).toHaveLength(3);
    expect(setup.enemies.nextGroupId).toBeUndefined();
    expect(setup.triggers.map((t) => t.id)).toEqual(['first-mighty-guard', 'first-bane-lance', 'first-bout-protect']);
  });
});

describe('the story triggers fire in their own fight and no other', () => {
  const fired = (r: Run): string[] => [...r.engine.state().firedTriggerIds];

  it('hostile: the first Mighty Guard fires on Garik\'s 7th action (read to its end with girls who cannot die); the bout\'s Protect never does', () => {
    const r = run('low', 1, { defendOnly: true });
    expect(fired(r)).toContain('first-mighty-guard');
    expect(fired(r)).not.toContain('first-bout-protect');
    expect(fired(r)).not.toContain('first-bane-lance'); // nobody wears Black Mage
  });

  it('hostile with a Black Mage: the first Bane Lance fires', () => {
    const r = run('low', 1, {
      defendOnly: true,
      rig: (e) => {
        (e.state().combatants['yuna'] as unknown as { dresspheres: { current: string } }).dresspheres.current = 'black-mage';
      },
    });
    expect(fired(r)).toContain('first-bane-lance');
  });

  it('friendly: the first Protect fires on his first action; Mighty Guard and Bane Lance never do', () => {
    const r = run('high', 1, { defendOnly: true });
    expect(fired(r)).toContain('first-bout-protect');
    expect(fired(r)).not.toContain('first-mighty-guard');
    expect(fired(r)).not.toContain('first-bane-lance');
  });
});
