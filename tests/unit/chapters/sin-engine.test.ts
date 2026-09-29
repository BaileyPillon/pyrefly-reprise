/**
 * **Chapter XVI, Sin — link 4, Overdrive Sin** (FFX only): the data against
 * `research/ffx-sin.md` with its cites, the clock (three pulls, the melee
 * window, Giga-Graviton on the 13th turn by default, S-1), the scripted Game
 * Over that Auto-Life and an aeon cannot stop, Gaze (six targetings, an aeon's
 * count double), the reach at FAR, the registration (unlisted, reachable by id)
 * and determinism.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleEngine, FFXCombatant } from '../../../src/battle/common/types.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { CHAPTERS, CHAPTER_IDS, UNLISTED_CHAPTERS, getChapter } from '../../../src/data/encounters.ts';
import { OVERDRIVE_SIN_ABILITIES } from '../../../src/data/ffx/enemies/overdrive-sin-abilities.ts';
import { overdriveSinGroup } from '../../../src/data/ffx/enemies/overdrive-sin.ts';
import { sinFahrenheitBuild } from '../../../src/data/ffx/builds/sin-fahrenheit.ts';
import {
  GIGA_GRAVITON_TURN,
  GIGA_GRAVITON_TURN_GESTAHL,
  mouthStage,
} from '../../../src/battle/ffx/ai/overdrive-sin.ts';
import { SIN, actor, atSin, defend, drive, flag, newEngine, row, type Input } from '../helpers/sinUnits.ts';
import { choose } from '../helpers/sinPolicies.ts';

const src = (rel: string): string => readFileSync(new URL(`../../../${rel}`, import.meta.url), 'utf8');

/** Advance to the next player turn (or `null` at the end). */
function next(engine: BattleEngine, max = 400): Input | null {
  for (let i = 0; i < max; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'player-input') return d;
  }
  return null;
}

describe('Overdrive Sin data, cited [research/ffx-sin.md §2, §3.4]', () => {
  const sin = overdriveSinGroup.enemies[0]!;

  it('the stat block is §2.1, the head Armored with Defense 40', () => {
    expect(sin.stats).toMatchObject({ hp: 140_000, mp: 999, str: 30, def: 40, mag: 30, mdef: 40, agi: 30, luck: 15, eva: 0 });
    expect(sin.immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe', 'boss']));
    expect(sin.affinities).toEqual({});
    expect(sin.rewards).toMatchObject({ ap: 20_000, apOverkill: 30_000, gil: 12_000, overkillThreshold: 16_000 });
    expect(sin.threatenChance).toBe(0); // S-6: immune
  });

  it('Armor Break and Mental Break land (byte 0); the rest of §2.3 is immune', () => {
    expect(sin.immunities['armor-break']).toBeUndefined();
    expect(sin.immunities['mental-break']).toBeUndefined();
    for (const s of ['ko', 'petrify', 'poison', 'confuse', 'zombie', 'silence', 'slow', 'haste', 'power-break', 'magic-break'] as const) {
      expect(sin.immunities[s], s).toBe(255);
    }
  });

  it('every stat and every non-zero power carries its § cite', () => {
    const enemy = src('src/data/ffx/enemies/overdrive-sin.ts');
    for (const key of ['hp', 'mp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc']) {
      const line = enemy.split('\n').find((l) => new RegExp(`^\\s+${key}: \\d`).test(l));
      expect(line, key).toMatch(/§/);
    }
    const rows = src('src/data/ffx/enemies/overdrive-sin-abilities.ts');
    for (const line of rows.split('\n').filter((l) => /^\s+power: [1-9]/.test(l))) expect(line).toMatch(/§3\.4/);
  });

  it('the rows are §3.4: Gaze 20 / 30 % x3, the aeon Gaze 50, Giga-Graviton 16/16 + Death 255; all always hit', () => {
    const a = OVERDRIVE_SIN_ABILITIES;
    for (const [id, status] of [['overdrive-sin-gaze-petrify', 'petrify'], ['overdrive-sin-gaze-confuse', 'confuse'], ['overdrive-sin-gaze-zombie', 'zombie']] as const) {
      expect(a[id]).toMatchObject({ power: 20, formula: 'magic', damageType: 'other', targeting: 'all-enemies' });
      expect(a[id]!.statusEffects).toEqual([{ status, chance: 30, duration: 254 }]);
    }
    expect(a['overdrive-sin-gaze-aeon']).toMatchObject({ power: 50, formula: 'magic', statusEffects: [] });
    expect(a['overdrive-sin-giga-graviton']).toMatchObject({ power: 16, formula: 'percent-total', damageType: 'magical' });
    expect(a['overdrive-sin-giga-graviton']!.flags).toContain('always-break-damage-limit');
    expect(a['overdrive-sin-giga-graviton']!.statusEffects).toEqual([{ status: 'ko', chance: 255, duration: 0 }]);
    for (const def of Object.values(a)) expect(def.canMiss, def.id).toBe(false); // hard rule 5
    for (const id of Object.keys(a)) expect(ALL_ABILITIES.some((x) => x.id === id), id).toBe(true);
  });
});

describe('the party: Garden of Pain with Yuna\'s Tetra Ring back (S-29, our estimate)', () => {
  it('Yuna wears the Tetra Ring; no Phantom Ring, no One MP Cost, no Talk', () => {
    const yuna = sinFahrenheitBuild.members.find((m) => m.id === 'yuna')!;
    expect(yuna.equipment.armor.name).toBe('Tetra Ring');
    expect(yuna.equipment.armor.autoAbilities).toEqual(['magic-def-20', 'stoneproof', 'death-ward', 'confuse-ward']);
    const lulu = sinFahrenheitBuild.members.find((m) => m.id === 'lulu')!;
    expect(lulu.equipment.weapon.autoAbilities).not.toContain('one-mp-cost');
    for (const m of sinFahrenheitBuild.members) expect(m.learnedAbilityIds).not.toContain('talk');
    expect(sinFahrenheitBuild.activeSlots).toEqual(['tidus', 'yuna', 'auron']);
    expect(sinFahrenheitBuild.aeons.map((a) => a.id)).toEqual(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut']);
  });
});

describe('registration: unlisted, reachable by id', () => {
  it('getChapter finds it; chapter select and CHAPTER_IDS do not', () => {
    const ch = getChapter('sin');
    expect(ch?.game).toBe('ffx');
    expect(ch?.number).toBe(17);
    expect(ch?.enemyGroupRef.id).toBe('overdrive-sin');
    expect(UNLISTED_CHAPTERS.map((c) => c.id)).toContain('sin');
    expect(CHAPTERS.map((c) => c.id)).not.toContain('sin');
    expect(CHAPTER_IDS as readonly string[]).not.toContain('sin');
    expect(ENEMY_GROUPS_BY_ID['overdrive-sin']).toBe(overdriveSinGroup);
  });
});

describe('the clock [§5.4]', () => {
  it('three pulls at FAR, then NEAR; the melee window passes with the mouth; Giga-Graviton on the 13th turn is a Game Over', () => {
    const e = newEngine(3);
    drive(e, () => defend());
    const log = e.state().log;
    const sinActs = log.filter((x) => x.type === 'turn-start' && x.actorId === SIN).length;
    expect(sinActs).toBe(GIGA_GRAVITON_TURN);
    expect(GIGA_GRAVITON_TURN).toBe(13); // S-1 default, Bailey 2026-09-27
    const drawn = log.filter((x) => x.type === 'action-start' && x.actorId === SIN && x.abilityId === 'overdrive-sin-drawn');
    expect(drawn).toHaveLength(3);
    const giga = log.filter((x) => x.type === 'action-start' && x.actorId === SIN && x.abilityId === 'overdrive-sin-giga-graviton');
    expect(giga).toHaveLength(1);
    expect(log.filter((x) => x.type === 'message' && x.kind === 'telegraph' && /mouth/.test(x.text))).toHaveLength(GIGA_GRAVITON_TURN - 4);
    expect(e.state().result?.outcome).toBe('defeat');
    expect(flag(e, 'battle.scriptedGameOver')).toBe(true);
    expect(flag(e, 'sin.turnsLeft')).toBe(0);
  });

  it('the clock counts down one per Sin turn, and the ship closes after the third pull', () => {
    const e = newEngine(5);
    const seen: Array<[number, unknown, unknown]> = [];
    for (let i = 0; i < 2000; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'resolved' && d.events.some((x) => x.type === 'turn-start' && x.actorId === SIN)) {
        seen.push([flag(e, 'sin.turn') as number, flag(e, 'sin.turnsLeft'), flag(e, 'airship.range')]);
      }
      if (d.kind === 'player-input') e.submit(defend());
    }
    expect(seen.map((s) => s[0])).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(seen.map((s) => s[1])).toEqual(Array.from({ length: 13 }, (_, i) => 12 - i));
    expect(seen.slice(0, 2).every((s) => s[2] === 'far')).toBe(true);
    expect(seen.slice(2).every((s) => s[2] === 'near')).toBe(true);
  });

  it('S-1 is one switch: Gestahl\'s reading ends on the 12th turn', () => {
    expect(GIGA_GRAVITON_TURN_GESTAHL).toBe(12);
    const e = newEngine(3, 12);
    drive(e, () => defend());
    expect(e.state().log.filter((x) => x.type === 'turn-start' && x.actorId === SIN)).toHaveLength(12);
    expect(e.state().result?.outcome).toBe('defeat');
  });

  it('the mouth stages (presentation, our estimate): 0 through the pulls, 1-3, then 4 the turn before', () => {
    expect([1, 2, 3, 4, 7, 10, 11, 12].map((n) => mouthStage(n, 13))).toEqual([0, 0, 0, 1, 2, 3, 3, 4]);
  });
});

describe('the scripted Game Over ignores Auto-Life and an aeon [§3.4, verified: 4 sources]', () => {
  it('Auto-Life on everyone does not save the party', () => {
    const e = newEngine(7);
    const st = e.state();
    for (const id of [...st.activeIds, ...st.reserveIds]) {
      (st.combatants[id] as FFXCombatant).statuses['auto-life'] = { id: 'auto-life', turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    }
    drive(e, () => defend());
    expect(e.state().result?.outcome).toBe('defeat');
    expect(flag(e, 'battle.scriptedGameOver')).toBe(true);
  });

  it('an aeon holding the field does not save the party', () => {
    const e = newEngine(7);
    let summoned = false;
    drive(e, (d) => {
      if (!summoned && d.actorId === 'yuna' && flag(e, 'sin.turn') === 11) {
        const s = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && 'id' in c.command && c.command.id === 'bahamut');
        if (s) { summoned = true; return s.command; }
      }
      return e.state().aeonId === d.actorId ? { kind: 'ability', id: 'shield', targets: [d.actorId] } : defend();
    });
    expect(summoned).toBe(true);
    expect(e.state().result?.outcome).toBe('defeat');
  });
});

describe('Gaze [§5.4]: six party targetings, an aeon counts double', () => {
  it('the sixth party action aimed at Sin draws one Gaze, and the count resets', () => {
    const e = newEngine(11);
    let hits = 0;
    drive(e, (d) => {
      const a = atSin(row(d.commands, 'attack'));
      if (a && hits < 12) { hits++; return a; }
      return defend();
    });
    const gazes = e.state().log.filter((x) => x.type === 'counter' && x.actorId === SIN);
    expect(hits).toBe(12);
    expect(gazes).toHaveLength(2);
  });

  it('three aeon attacks draw the aeon Gaze (power 50)', () => {
    const e = newEngine(13);
    let aeonHits = 0;
    drive(e, (d) => {
      if (e.state().aeonId === d.actorId) {
        const a = atSin(row(d.commands, 'attack'));
        if (a && aeonHits < 3) { aeonHits++; return a; }
        return { kind: 'ability', id: 'shield', targets: [d.actorId] };
      }
      if (d.actorId === 'yuna' && flag(e, 'airship.range') === 'near' && e.state().aeonId === null && aeonHits === 0) {
        const s = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && 'id' in c.command && c.command.id === 'bahamut');
        if (s) return s.command;
      }
      return defend();
    });
    expect(aeonHits).toBe(3);
    const counters = e.state().log.filter((x) => x.type === 'counter' && x.actorId === SIN);
    expect(counters.map((c) => (c.type === 'counter' ? c.abilityId : ''))).toEqual(['overdrive-sin-gaze-aeon']);
  });

  it('Stoneproof and Confuse Ward hold: Yuna is never Petrified or Confused', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const e = newEngine(seed);
      drive(e, (d) => atSin(row(d.commands, 'attack')) ?? defend());
      const onYuna = e.state().log.filter((x) => x.type === 'status-add' && x.targetId === 'yuna' && (x.status === 'petrify' || x.status === 'confuse'));
      expect(onYuna, `seed ${seed}`).toHaveLength(0);
    }
  });
});

describe('the gap and the orders [§5.4, §3.5]', () => {
  it('at FAR only Wakka, magic and long-range rows reach; Auron reaches once the ship is in', () => {
    const e = newEngine(17);
    let farChecked = false;
    let nearChecked = false;
    drive(e, (d) => {
      const far = flag(e, 'airship.range') === 'far';
      if (d.actorId === 'auron') {
        const armorBreak = row(d.commands, 'ability', 'armor-break');
        if (far) { expect(armorBreak?.enabled).toBe(false); farChecked = true; }
        else { expect(armorBreak?.validTargets).toContain(SIN); nearChecked = true; }
      }
      return defend();
    });
    expect(farChecked && nearChecked).toBe(true);
  });

  it('no Trigger Command is offered: Cid is not in this formation', () => {
    const e = newEngine(19);
    const d = next(e)!;
    expect(d.commands.some((c) => c.command.kind === 'trigger')).toBe(false);
    expect(actor(e, 'cid')).toBeUndefined();
  });
});

describe('determinism', () => {
  it('the same seed and the same line give the same log; another seed differs', () => {
    const run = (seed: number): string => {
      const e = newEngine(seed);
      drive(e, (d) => choose('sensible', e, d));
      return JSON.stringify(e.state().log);
    };
    expect(run(23)).toBe(run(23));
    expect(run(23)).not.toBe(run(24));
  });
});
