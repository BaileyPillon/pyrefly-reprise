/**
 * **Jormungand against the note** (`research/re-ffx-monster-arena-creations.md` 3.7, "RE n"; FFX only; the hidden Gauntlet chapter's act 3): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-jormungand.ts`) pinned on a **fake context**, where each branch is driven by the raw draw and the front line alone and the odds are counted over all 65,536 values of `GetRandomValue()`
 * (the note's own exact tallies: 21,846 / 21,845 / 21,845 and 49,152 / 16,384); then the real engine on three seeds (no error, an end reached, the digest of the event log recorded) and the statue branch on a party
 * without the Ribbon.
 */
import { describe, expect, it } from 'vitest';

import type { FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { JORMUNGAND_AEON_MODULO, JORMUNGAND_OPEN_MODULO, jormungandTurn } from '../../../src/battle/ffx/ai/gauntlet-jormungand.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';
import { aiOf, fakeArena, rowOf, tally } from '../helpers/gauntletFake.ts';
import { actions, careless, playOne } from '../helpers/gauntletDrive.ts';

const JORM = GAUNTLET_IDS.jormungand;

describe('the script is registered under the id the data names', () => {
  it('the AI script (it has no hit hook: it counters nothing)', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.jormungand)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.jormungand).toBe('gauntlet-jormungand');
  });
});

describe("Jormungand's turn with no aeon and nobody petrified: one draw modulo 3 (RE n 3.7)", () => {
  it('over all 65,536 values: 21,846 Attack, 21,845 Cold Stare, 21,845 Space-Time Vorpal (exact)', () => {
    expect(JORMUNGAND_OPEN_MODULO).toBe(3);
    expect(tally(JORM, jormungandTurn)).toEqual({ [ROW.jormungandAttack]: 21_846, [ROW.coldStare]: 21_845, [ROW.vorpal]: 21_845 });
  });

  it('by residue: 0 Attack, 1 Cold Stare, 2 the Vorpal on the whole front line (no target named)', () => {
    const cmd = (raw: number) => jormungandTurn(aiOf(fakeArena({ boss: JORM, raw, pick: 1 }), JORM));
    expect([0, 1, 2, 3, 4, 5].map((r) => rowOf(cmd(r)))).toEqual([ROW.jormungandAttack, ROW.coldStare, ROW.vorpal, ROW.jormungandAttack, ROW.coldStare, ROW.vorpal]);
    expect(cmd(2)?.targets).toEqual([]);
    expect(cmd(0)?.targets).toEqual(['m1']); // one random living member, here the picker's second
  });

  it('the draws: the mod draw first, then one picker draw over the living members for Attack and Cold Stare (none with one living), none for the Vorpal', () => {
    const run = (living: number, raw: number) => {
      const f = fakeArena({ boss: JORM, raw, living, pick: 1 });
      jormungandTurn(aiOf(f, JORM));
      return f.draws;
    };
    expect(run(3, 0)).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    expect(run(2, 1)).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 1]]);
    expect(run(1, 0)).toEqual([[FfxStream.Script, 0xffff]]);
    expect(run(3, 2)).toEqual([[FfxStream.Script, 0xffff]]);
  });
});

describe('with an aeon in the front line: draw modulo 4, Cold Stare on 0, Attack otherwise, never the Vorpal (RE n 3.7)', () => {
  it('over all 65,536 values: 49,152 Attack (75.00 percent), 16,384 Cold Stare (25.00 percent), no Vorpal', () => {
    expect(JORMUNGAND_AEON_MODULO).toBe(4);
    expect(tally(JORM, jormungandTurn, { aeon: true })).toEqual({ [ROW.jormungandAttack]: 49_152, [ROW.coldStare]: 16_384 });
  });

  it('the aeon is the only target (the front line is the aeon alone); a petrified party member does not change this branch: the aeon test comes first', () => {
    const f = fakeArena({ boss: JORM, raw: 0, aeon: true, petrified: ['m1'] });
    const c = jormungandTurn(aiOf(f, JORM));
    expect([rowOf(c), c?.targets]).toEqual([ROW.coldStare, ['valefor']]);
  });
});

describe('a petrified member in the front line: the Attack that shatters it, no draw of the mod kind (RE n 3.7)', () => {
  it('one statue: Attack on it for every value of the draw, and no draw is taken at all (a pick with one candidate draws nothing, twice)', () => {
    expect(tally(JORM, jormungandTurn, { petrified: ['m1'] })).toEqual({ [ROW.jormungandAttack]: 65_536 });
    const f = fakeArena({ boss: JORM, raw: 2, petrified: ['m1'] });
    const c = jormungandTurn(aiOf(f, JORM));
    expect([rowOf(c), c?.targets]).toEqual([ROW.jormungandAttack, ['m1']]);
    expect(f.draws).toEqual([]);
  });

  it('two statues: the picker is drawn twice (once for the test, once to aim), and the pick is among the statues', () => {
    const f = fakeArena({ boss: JORM, raw: 2, petrified: ['m0', 'm2'], pick: 1 });
    const c = jormungandTurn(aiOf(f, JORM));
    expect([rowOf(c), c?.targets]).toEqual([ROW.jormungandAttack, ['m2']]);
    expect(f.draws).toEqual([[FfxStream.Picker, 1], [FfxStream.Picker, 1]]);
  });

  it('a KO\'d member is not a statue (the front line is looked at alive first)', () => {
    const f = fakeArena({ boss: JORM, raw: 2, living: 2, petrified: ['m2'] });
    const c = jormungandTurn(aiOf(f, JORM));
    expect(rowOf(c), 'm2 is KO\'d: the open branch, draw 2 is the Vorpal').toBe(ROW.vorpal);
  });
});

describe('the real engine: act 3 on three seeds (no error, an end reached, the digest of the log recorded)', () => {
  it('seeds 1, 2 and 3 with the careless line all end in a victory in six turns, before the serpent has acted (a capped Attack empties it in 6 hits); replaying a seed gives the same log', () => {
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'jormungand', careless);
      const b = playOne(seed, 'jormungand', careless);
      expect(a.outcome, `seed ${seed}`).toBe('victory');
      expect(actions(a.events, JORM), `seed ${seed}: it never got a turn`).toEqual([]);
      expect(a.digest, `seed ${seed} replays`).toBe(b.digest);
    }
  });

  it('its actions are the three rows of the note and nothing else; the Attack never lands on the preset (Evasion 255 + Luck 60 against accuracy byte 150) and the Ribbon wards Petrify, so no statue is ever made', () => {
    const allowed = new Set<string>([ROW.jormungandAttack, ROW.coldStare, ROW.vorpal]);
    for (const seed of [1, 2, 3]) {
      const run = playOne(seed, 'jormungand', () => null, 300); // the party only defends: the serpent is slow, a careless party kills it before its first turn (6 hits)
      for (const a of actions(run.events, JORM)) expect(allowed.has(a), `seed ${seed}: ${a}`).toBe(true);
      expect(run.events.filter((e) => e.type === 'status-add' && e.status === 'petrify'), `seed ${seed}`).toEqual([]);
    }
  });

  it('on a party without the Ribbon Cold Stare petrifies (the party only defends, so the slow serpent gets its turns), and its next action is the Attack on the statue', () => {
    const bare: FFXPartyBuild = {
      ...gauntletBuild,
      members: gauntletBuild.members.map((m) => ({ ...m, equipment: { ...m.equipment, armor: { ...m.equipment.armor, autoAbilities: (m.equipment.armor.autoAbilities ?? []).filter((a) => a !== 'ribbon') } } })),
    };
    let checked = 0;
    for (let seed = 1; seed <= 12 && checked < 3; seed++) {
      const run = playOne(seed, 'jormungand', () => null, 300, bare);
      const events = run.events;
      for (let i = 0; i < events.length; i++) {
        const e = events[i]!;
        if (e.type !== 'status-add' || e.status !== 'petrify') continue;
        // The next action-start of Jormungand after the petrify aims at the statue.
        const next = events.slice(i + 1).find((x) => x.type === 'action-start' && x.actorId === JORM);
        if (next === undefined || next.type !== 'action-start') continue;
        expect(next.abilityId, `seed ${seed}`).toBe(ROW.jormungandAttack);
        expect(next.targets, `seed ${seed}`).toEqual([e.targetId]);
        checked++;
        break;
      }
    }
    expect(checked, 'a statue was made and answered on at least one seed').toBeGreaterThan(0);
  });
});
