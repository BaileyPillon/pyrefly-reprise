/**
 * The FFX-2 half of the "turn-denying status must end" audit
 * [research/ffx2-combat-core.md §1.2, §2.8].
 *
 * Round 03's blockers #3 and #4 were FFX bugs: its CTB queue **excluded**
 * sleeping and Threatened actors, so the turn that would have ended the status
 * never came. The same class of hole was checked here, and the ATB engine does
 * not have it — but nothing pinned that, so this file does.
 *
 * Why the two games differ, from the sources:
 *
 * - FFX pays a duration "by 1 at the **end of the victim's own action**"
 *   (`ffx-combat-core.md` §4.1), so a status that denies turns denies its own
 *   clock unless the turn still arrives.
 * - FFX-2 durations are **wall-clock**: §2.8's table gives Sleep 97 units
 *   (51.4 s) and Stop 60-126 units, and `advanceStatuses` runs over every unit
 *   on every step regardless of whose gauge is full. Sleep's own row says "ATB
 *   frozen" and its duration is "time **and/or** hit"; Stop's says "Agility 0,
 *   ATB frozen". The gauge stops; the clock does not.
 *
 * Game case for this file: **FFX-2 only** in its assertions, pinning shared
 * plumbing (a locked-out unit always gets back into play) that round 03 found
 * broken on the FFX side. The Threaten test below is rule 14's "absent from the
 * other game" check: `ffx-combat-core.md` §11 C12 makes Threaten enemy-only
 * FFX content and FFX-2 has no such status at all.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine, advanceStatuses, applyStatus, canAct } from '../../src/battle/ffx2/index.ts';
import type { EventDraft, Ffx2Unit } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup } from '../../src/battle/ffx2/fixtures.ts';
import type { Command, StatusId } from '../../src/battle/common/types.ts';

function unit(id: string): Ffx2Unit {
  return {
    id, name: id, side: 'party', spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 30, def: 30, mag: 30, mdef: 30, agi: 50, luck: 10, eva: 0, acc: 0, maxHp: 1000, maxMp: 100 },
    hp: 1000, mp: 100, statuses: {}, affinities: {}, immunities: {}, immunityFlags: [],
    controller: 'player', alive: true, removed: false, slot: 0, flags: {},
    level: 24,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0,
  };
}

const sink = (): EventDraft[] => [];

function runDown(u: Ffx2Unit, status: StatusId, stepTicks = 500, maxSteps = 4000): number {
  const drafts: EventDraft[] = sink();
  let steps = 0;
  while (u.statuses[status] !== undefined && steps < maxSteps) {
    advanceStatuses(u, stepTicks, (e) => drafts.push(e));
    steps += 1;
  }
  return steps;
}

describe('FFX-2 turn-denying statuses run on the clock, not on turns (§2.8)', () => {
  it.each<[StatusId]>([['sleep'], ['stop']])(
    '%s expires on its own even though the gauge is frozen',
    (status) => {
      const u = unit('yuna');
      expect(applyStatus(u, { status, chance: 255, duration: 97 })).not.toBeNull();
      expect(canAct(u), `${status} should stop the unit acting`).toBe(false);

      const steps = runDown(u, status);
      expect(steps, `${status} never expired`).toBeLessThan(4000);
      expect(u.statuses[status]).toBeUndefined();
      expect(canAct(u), `${status} wore off but the unit still cannot act`).toBe(true);
    },
  );

  it('a slept unit in a real battle takes a turn again', () => {
    const engine = new FFX2Engine({ minigames: false });
    engine.init(bahamutSetup(31));

    const first = engine.state().activeIds[0];
    expect(first).toBeDefined();
    const sleeper = (engine.state().combatants as Record<string, Ffx2Unit>)[first as string];
    expect(sleeper).toBeDefined();
    applyStatus(sleeper as Ffx2Unit, { status: 'sleep', chance: 255, duration: 97 });

    let inputs = 0;
    for (let i = 0; i < 40000; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(d.nextEventMs);
        continue;
      }
      if (d.kind === 'resolved') continue;
      if (d.actorId === first) inputs += 1;
      const target = d.commands.find((c) => c.command.kind === 'attack')?.validTargets[0];
      engine.submit((target ? { kind: 'attack', targets: [target] } : { kind: 'defend', targets: [] }) as Command);
      if (inputs > 0) break;
    }

    expect(inputs, 'the slept unit never got another turn').toBeGreaterThan(0);
    expect((engine.state().combatants as Record<string, Ffx2Unit>)[first as string]?.statuses['sleep']).toBeUndefined();
  });
});

describe('Threaten is FFX content and stays out of FFX-2 (rule 14)', () => {
  it('no FFX-2 ability inflicts Threaten and no FFX-2 code path reads it', async () => {
    const { ALL_ABILITIES } = await import('../../src/data/ffx2/index.ts');
    const offenders = ALL_ABILITIES.filter((a) =>
      a.statusEffects.some((s) => s.status === 'threaten' || s.status === 'provoke'),
    ).map((a) => a.id);
    expect(offenders).toEqual([]);

    // `canAct` is the FFX-2 lock-out predicate; §2.8 lists exactly three
    // statuses that freeze the gauge, and Threaten is not one of them.
    const u = unit('paine');
    u.statuses['threaten'] = {
      id: 'threaten',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 1,
      permanent: false,
    };
    expect(canAct(u), 'an FFX status must not lock an FFX-2 unit out').toBe(true);
  });
});
