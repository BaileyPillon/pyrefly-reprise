/**
 * **The review fixes of the Dark Aeons chapter** (FFX only; the hidden Dark Aeons chapter, review of 2026-11-06, each finding pinned on the engine or the data, not read off a note):
 *
 * - **A Doublecast draws one answer** (two hit events in one action; Dark Ifrit and the first Dark Ixion answer through `hit-gates.ts#react`, the engine's `performCommand` rule, which drops a second reaction while one
 *   waits), and still pays the gauge for each hit event.
 * - **A Ribbon does not stop Dark Shiva's Death** (the game's Ribbon row has no Death byte; only Deathproof does), so no page of the chapter says it does.
 * - **The advisor's copy of the gauge gains is the battle layer's table**, and the second Dark Ixion fight has its own scan and sensor lines (it has no counter).
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { AUTO_ABILITY_RECORDS } from '../../../src/battle/ffx/kernel/gear-table.ts';
import { AUTO_ABILITY_RECORD } from '../../../src/battle/ffx/adapt/gear-ids.ts';
import { SIX_GAINS, SIX_SCRIPTS } from '../../../src/battle/ffx/ai/dark-aeons-six-rules.ts';
import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_ROWS as ROW } from '../../../src/data/ffx/enemies/dark-aeons-six-abilities.ts';
import { DARK_SIX_BODIES } from '../../../src/data/ffx/enemies/dark-aeons-six.ts';
import { DARK_AEONS_GUIDE } from '../../../src/data/guides/dark-aeons.ts';
import { DARK_AEONS_DOC } from '../../../src/data/guides/docs/dark-aeons.ts';
import { DARK_AEONS_META } from '../../../src/data/chapter-meta-dark-aeons.ts';
import { DARK_AEONS_GAINS } from '../../../src/engine/tactics/dark-aeons.ts';
import { withLineUp } from '../helpers/darkAeonsBench.ts';
import * as H from '../helpers/darkAeonsDrive.ts';

const BOSS = { ifrit: 'dark-ifrit', 'ixion-1': 'dark-ixion' } as const;

/** One cast of Blizzard, or Lulu's Doublecast of two (two hit events on the foe in one action); the foe's own actions and gauge changes caused by it. */
function luluCasts(key: 'ifrit' | 'ixion-1', double: boolean): { answers: string[]; gauge: string[] } {
  const engine = H.newEngine(5, key, withLineUp(darkAeonsBuild, ['tidus', 'lulu', 'auron']));
  const boss = BOSS[key];
  let d = H.nextInput(engine);
  for (let guard = 0; d.actorId !== 'lulu' && guard < 30; guard++) {
    engine.submit(H.defend());
    d = H.nextInput(engine);
  }
  let cmd: Command | null = null;
  if (double) {
    const dc = d.commands.find((c) => c.label === 'Doublecast');
    if (dc !== undefined) cmd = { kind: 'ability', id: (dc.command as { id: string }).id, targets: [], casts: [{ id: 'blizzard', targets: [boss] }, { id: 'blizzard', targets: [boss] }] } as unknown as Command;
  } else {
    const sp = d.commands.find((c) => c.command.kind === 'ability' && (c.command as { id: string }).id === 'blizzard');
    if (sp !== undefined) cmd = { ...sp.command, targets: [boss] } as Command;
  }
  if (cmd === null) throw new Error(`Lulu has no ${double ? 'Doublecast' : 'Blizzard'} on offer`);
  const start = H.log(engine).length;
  engine.submit(cmd);
  try {
    H.nextInput(engine);
  } catch {
    /* the battle ended */
  }
  const events = H.log(engine).slice(start) as BattleEvent[];
  return {
    answers: events.flatMap((e) => (e.type === 'action-start' && e.actorId === boss ? [e.abilityId ?? e.command.kind] : [])),
    gauge: events.flatMap((e) => (e.type === 'overdrive-gauge' && e.who === boss ? [`${e.from}>${e.to}:${e.cause}`] : [])),
  };
}

describe('a Doublecast draws one answer, not two (review finding 3)', () => {
  it('Dark Ifrit: one cast is one Attack and +5; a Doublecast is still ONE Attack, and +5 for each of its two hit events', () => {
    expect(luluCasts('ifrit', false)).toEqual({ answers: [ROW.ifritAttack], gauge: ['0>5:targeted'] });
    expect(luluCasts('ifrit', true)).toEqual({ answers: [ROW.ifritAttack], gauge: ['0>5:targeted', '5>10:targeted'] });
  });

  it('the first Dark Ixion: one cast is one blade and +10; a Doublecast is still ONE blade, and +10 for each of its two hit events', () => {
    expect(luluCasts('ixion-1', false)).toEqual({ answers: [ROW.ixionAttack1], gauge: ['0>10:targeted'] });
    expect(luluCasts('ixion-1', true)).toEqual({ answers: [ROW.ixionAttack1], gauge: ['0>10:targeted', '10>20:targeted'] });
  });
});

describe("a Ribbon does not stop Dark Shiva's Death (review finding 4)", () => {
  const deathByte = (record: number): number | undefined => AUTO_ABILITY_RECORDS[record]?.resist?.find(([status]) => status === 0)?.[1];

  it("the game's Ribbon row has no Death byte; Deathproof's row has 255 (Ribbon holds off the Confuse and Berserk of the same blow)", () => {
    expect(deathByte(AUTO_ABILITY_RECORD.ribbon)).toBeUndefined();
    expect(deathByte(AUTO_ABILITY_RECORD.deathproof)).toBe(255);
    const ribbon = AUTO_ABILITY_RECORDS[AUTO_ABILITY_RECORD.ribbon]!.resist!.map(([status]) => status);
    expect(ribbon).toContain(8); // Confuse
    expect(ribbon).toContain(9); // Berserk
  });

  /** Every Heavenly Strike of a defending party over a few seeds: how many took the target by the Death status (a KO with no damage dealt first). */
  function heavenlyStrikes(party: FFXPartyBuild): { strikes: number; kos: number } {
    let strikes = 0;
    let kos = 0;
    for (const seed of [41, 42, 43, 44]) {
      const engine = H.newEngine(seed, 'shiva', party);
      for (let guard = 0, n = 0; guard < 3000 && n < 40; guard++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        n++;
        engine.submit(H.defend());
      }
      const log = H.log(engine);
      for (let i = 0; i < log.length; i++) {
        const e = log[i]!;
        if (e.type !== 'action-start' || e.actorId !== 'dark-shiva' || e.abilityId !== ROW.heavenlyStrike) continue;
        strikes++;
        let damage = 0;
        for (let j = i + 1; j < log.length && log[j]!.type !== 'action-end'; j++) {
          const f = log[j]!;
          if (f.type === 'damage') damage += f.amount;
          if (f.type === 'ko' && damage === 0) kos++; // the Death status takes the target before any damage lands; a member already low can still fall to the blow itself, which is not the Death
        }
      }
    }
    return { strikes, kos };
  }

  it('on the engine: every Heavenly Strike on the Ribbon party ends in a KO; with Deathproof in place of the Ribbon none does', () => {
    const armourWith = (autoAbilities: string[]): FFXPartyBuild => {
      const party = structuredClone(darkAeonsBuild);
      for (const m of party.members) if (m.equipment?.armor) m.equipment.armor.autoAbilities = m.equipment.armor.autoAbilities.filter((a) => a !== 'ribbon').concat(autoAbilities as never);
      return party;
    };
    const ribbon = heavenlyStrikes(darkAeonsBuild);
    expect(ribbon.strikes).toBeGreaterThan(3);
    expect(ribbon.kos, 'a Ribbon wearer is killed by the Death every time').toBe(ribbon.strikes);
    const proof = heavenlyStrikes(armourWith(['deathproof']));
    expect(proof.strikes).toBeGreaterThan(3);
    expect(proof.kos, 'Deathproof stops the Death').toBe(0);
  });

  it('no page of the chapter says a Ribbon stops the Death: the guide and the doc name Deathproof', () => {
    const shiva = DARK_AEONS_GUIDE.phases.find((p) => p.label === 'DARK SHIVA')!.note;
    expect(shiva).toContain('Deathproof');
    expect(shiva).not.toMatch(/Ribbon turns/);
    const doc = JSON.stringify(DARK_AEONS_DOC);
    expect(doc).not.toMatch(/Ribbon turns/);
    expect(doc).toContain('Only Deathproof stops her killing touch');
  });
});

describe('the advisor and the texts agree with the data (review minors 2, 3 and 7)', () => {
  it("the advisor's gain table is the battle layer's SIX_GAINS, script by script (a restated copy must not drift)", () => {
    const byScript: Record<string, { perTurn: number; perHit: number }> = {
      [SIX_SCRIPTS.valefor]: SIX_GAINS.valefor,
      [SIX_SCRIPTS.ifrit]: SIX_GAINS.ifrit,
      [SIX_SCRIPTS.ixion1]: SIX_GAINS.ixion1,
      [SIX_SCRIPTS.ixion2]: SIX_GAINS.ixion2,
      [SIX_SCRIPTS.shiva]: SIX_GAINS.shiva,
      [SIX_SCRIPTS.bahamut]: SIX_GAINS.bahamut,
      [SIX_SCRIPTS.anima]: SIX_GAINS.anima,
    };
    expect(Object.keys(DARK_AEONS_GAINS).sort()).toEqual(Object.keys(byScript).sort());
    for (const [script, gain] of Object.entries(byScript)) expect(DARK_AEONS_GAINS[script], script).toEqual({ perTurn: gain.perTurn, perHit: gain.perHit });
  });

  it('the second Dark Ixion fight has no counter, so its sensor and scan lines do not promise one, and differ from the first fight\'s', () => {
    const one = DARK_SIX_BODIES.find((b) => b.id === 'dark-ixion')!;
    const two = DARK_SIX_BODIES.find((b) => b.id === 'dark-ixion-2')!;
    expect(two.sensorText).not.toBe(one.sensorText);
    expect(two.scanText).not.toBe(one.scanText);
    expect(two.sensorText).not.toMatch(/strikes back|answers? (each|every|your) blow/i);
    expect(`${two.sensorText} ${two.scanText}`).not.toMatch(/only waits/i);
    expect(one.sensorText).toMatch(/strikes back/);
  });

  it("the last pause snapshot is Bahamut's, the last link, and says so", () => {
    const last = DARK_AEONS_META.snapshots.at(-1)!;
    expect(last.image).toBe('characters/bahamut/idle.png');
    expect(last.caption).toBe('and the last of them');
  });
});
