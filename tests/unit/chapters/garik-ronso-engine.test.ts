/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter) on the real engine: the moves with the rows' numbers, the Curse that keeps a Black Mage in her dress, the guard that lights the whole side, and the scripts' own
 * order in a fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * What it pins, each against the engine and not the script (a forced script returns the move the test names; the scripts have their own file, `garik-ronso-ai.test.ts`):
 * 1. **Mighty Guard** [RE §3]: on EVERY monster, Garik himself and both Youths: Shell, Protect, Regen and Haste, Defense and Magic Defense up two stages, Evasion up one; a Dispel strips the four timed ones and not the stages.
 * 2. **Bane Lance** [RE §3]: Curse lands on a Black Mage, and a cursed girl's Change rows are disabled ("Cursed"): she cannot leave the dress.
 * 3. **MP Blowout** [RE §3]: all of the girl's MP, her HP untouched. **Blind** [RE §3]: Darkness at 75. **Time Up Meteor**: the party is gone.
 * 4. **The bout's Protect and Shell** are on Garik alone.
 * 5. **The scripts in a fight**: with the girls unable to die and only defending, Garik's own actions follow the game's order (the guard on his 7th and 14th, no lance without a Black Mage), the bout's beat is Protect, three
 *    blows, Shell, three blows; the Youths use MP Blowout.
 */
import { describe, expect, it } from 'vitest';

import type { BattleSetup, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFX2Engine, registerAiScript } from '../../../src/battle/ffx2/index.ts';
import { garikRonsoBuild } from '../../../src/data/ffx2/builds/garik-ronso.ts';
import { garikFriendlyGroup, garikHostileGroup } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import {
  GARIK_ATTACK_ID,
  GARIK_BANE_LANCE_ID,
  GARIK_BLIND_ID,
  GARIK_MIGHTY_GUARD_ID,
  GARIK_PROTECT_ID,
  GARIK_SHELL_ID,
  RONSO_TIME_UP_METEOR_ID,
  YOUTH_ATTACK_ID,
  YOUTH_MP_BLOWOUT_ID,
} from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import { X2_GARIK_BOUT_ID, X2_GARIK_ID, X2_YOUTH_A_ID, X2_YOUTH_B_ID, X2_YOUTH_BOUT_ID } from '../../../src/data/garik-ronso-ids.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
interface Ev {
  type: string;
  actorId?: string;
  targetId?: string;
  abilityId?: string;
  amount?: number;
  status?: string;
  [key: string]: unknown;
}
interface Unit {
  id: string;
  hp: number;
  mp: number;
  alive: boolean;
  stats: { maxHp: number; maxMp: number };
  statuses: Record<string, { stacks?: number; counter?: number; ticksRemaining?: number | null } | undefined>;
  dresspheres?: { current: string };
}

const unit = (engine: FFX2Engine, id: string): Unit => engine.state().combatants[id] as unknown as Unit;
const logOf = (engine: FFX2Engine): readonly Ev[] => engine.state().log as unknown as readonly Ev[];
const use = (id: string, targets: string[] = []): Command => ({ kind: 'ability', id, targets });

let rigCount = 0;

/** A copy of `base` whose named fighters run queued commands (the rest do nothing): a rig, not a chapter. */
function rigged(base: EnemyGroupDef, queues: Record<string, Command[]>): EnemyGroupDef {
  return {
    ...base,
    enemies: base.enemies.map((e) => {
      const id = `zz-forced-garik-${rigCount++}`;
      const queue = queues[e.id] ?? [];
      registerAiScript({ id, decide: () => queue.shift() ?? null });
      return { ...e, aiScriptId: id };
    }),
  };
}

function open(group: EnemyGroupDef, seed: number, atb: 'wait' | 'active' = 'wait'): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: atb }));
  const setup: BattleSetup = { game: 'ffx2', party: structuredClone(garikRonsoBuild), enemies: group, triggers: [], seed, condition: 'normal', canEscape: false };
  engine.setSeed(seed);
  engine.init(setup);
  return engine;
}

/** The girls cannot die in this fight (a rig, so a long script can be read to its end). */
function immortal(engine: FFX2Engine): void {
  for (const id of ['yuna', 'rikku', 'paine']) {
    const u = unit(engine, id);
    u.stats.maxHp = u.hp = 900_000;
  }
}

/** Play on, the girls defending (or `turn`), until `done` or the battle ends or the budget runs out. */
function play(engine: FFX2Engine, done: () => boolean, turn: (d: Input) => Command | null = () => null, budget = 6000): void {
  for (let i = 0; i < budget && !done(); i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    engine.submit(turn(d as Input) ?? { kind: 'defend', targets: [] });
  }
}

const finished = (engine: FFX2Engine, actor: string, count = 1): (() => boolean) => () => logOf(engine).filter((e) => e.type === 'action-end' && e.actorId === actor).length >= count;
const row = (d: Input, kind: string, id: string, targets: string[]): Command | null => {
  const r = d.commands.find((c) => c.enabled && c.command.kind === kind && 'id' in c.command && (c.command as { id: string }).id === id);
  return r ? ({ ...r.command, targets } as Command) : null;
};

describe('Mighty Guard [RE §3]', () => {
  it('lights EVERY monster, Garik himself and both Youths: Shell, Protect, Regen, Haste, Defense up 2, Magic Defense up 2, Evasion up 1', () => {
    const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(GARIK_MIGHTY_GUARD_ID)] }), 1);
    play(engine, finished(engine, X2_GARIK_ID));
    for (const id of [X2_GARIK_ID, X2_YOUTH_A_ID, X2_YOUTH_B_ID]) {
      const s = unit(engine, id).statuses;
      for (const status of ['shell', 'protect', 'regen', 'haste']) expect(s[status], `${id} ${status}`).toBeDefined();
      expect([s['def-up']?.stacks, s['mdef-up']?.stacks, s['eva-up']?.stacks], id).toEqual([2, 2, 1]);
    }
    for (const id of ['yuna', 'rikku', 'paine']) expect(Object.keys(unit(engine, id).statuses).filter((s) => ['shell', 'protect', 'regen', 'haste', 'def-up'].includes(s)), id).toEqual([]);
  });

  it('Shell and Protect last longer than Regen and Haste (126 against 90 units in the row)', () => {
    const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(GARIK_MIGHTY_GUARD_ID)] }), 1);
    play(engine, finished(engine, X2_GARIK_ID));
    const s = unit(engine, X2_YOUTH_A_ID).statuses;
    const left = (status: string): number => s[status]?.counter ?? s[status]?.ticksRemaining ?? 0;
    expect(left('shell')).toBeGreaterThan(left('regen'));
    expect(left('protect')).toBeGreaterThan(left('haste'));
    expect(left('regen')).toBeGreaterThan(0);
  });

  it('a Dispel on Garik strips Shell, Protect, Regen and Haste and leaves the three stat stages (Dispel never touched a stage)', () => {
    const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(GARIK_MIGHTY_GUARD_ID)] }), 1);
    let dispelled = false;
    play(engine, () => dispelled && finished(engine, 'yuna', 2)(), (d) => {
      if (d.actorId !== 'yuna' || unit(engine, X2_GARIK_ID).statuses['shell'] === undefined || dispelled) return null;
      const dispel = row(d, 'ability', 'x2-white-mage-dispel', [X2_GARIK_ID]);
      if (dispel) dispelled = true;
      return dispel;
    });
    expect(dispelled).toBe(true);
    const s = unit(engine, X2_GARIK_ID).statuses;
    for (const status of ['shell', 'protect', 'regen', 'haste']) expect(s[status], status).toBeUndefined();
    expect([s['def-up']?.stacks, s['mdef-up']?.stacks, s['eva-up']?.stacks]).toEqual([2, 2, 1]);
  });
});

describe('Bane Lance and Curse [RE §3]', () => {
  it('curses a Black Mage Yuna (the lance lands on most seeds), and a cursed girl has no Change row she can use: they all read "Cursed"', () => {
    let landed = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(GARIK_BANE_LANCE_ID, ['yuna'])] }), seed);
      unit(engine, 'yuna').dresspheres!.current = 'black-mage';
      play(engine, finished(engine, X2_GARIK_ID));
      if (unit(engine, 'yuna').statuses['curse'] === undefined) continue;
      landed += 1;
      let seen: string[] | null = null;
      play(engine, () => seen !== null, (d) => {
        if (d.actorId !== 'yuna') return null;
        seen = d.commands.filter((c) => c.command.kind === 'spherechange').map((c) => (c.enabled ? 'ENABLED' : (c as { disabledReason?: string }).disabledReason ?? '?'));
        return null;
      });
      expect(seen, `seed ${seed}`).not.toBeNull();
      expect(seen!.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(new Set(seen), `seed ${seed}`).toEqual(new Set(['Cursed']));
    }
    expect(landed).toBeGreaterThanOrEqual(8);
  });

  it('a girl who is not cursed can still Change (the control)', () => {
    const engine = open(rigged(garikHostileGroup, {}), 1);
    let enabled = 0;
    play(engine, () => enabled > 0, (d) => {
      if (d.actorId === 'yuna') enabled = d.commands.filter((c) => c.command.kind === 'spherechange' && c.enabled).length;
      return null;
    });
    expect(enabled).toBeGreaterThan(0);
  });
});

describe('the Youth\'s MP Blowout, Blind and Time Up Meteor [RE §3]', () => {
  it('MP Blowout empties the MP of the girl it hits and touches nothing else of hers (the race against accuracy 120 decides the hit)', () => {
    let hit = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = open(rigged(garikHostileGroup, { [X2_YOUTH_A_ID]: [use(YOUTH_MP_BLOWOUT_ID, ['yuna'])] }), seed);
      const yuna = unit(engine, 'yuna');
      const before = { hp: yuna.hp, mp: yuna.mp };
      expect(before.mp).toBeGreaterThan(0);
      play(engine, finished(engine, X2_YOUTH_A_ID));
      const missed = logOf(engine).some((e) => e.type === 'miss' && e.targetId === 'yuna');
      if (missed) {
        expect(yuna.mp, `seed ${seed}`).toBe(before.mp);
        continue;
      }
      hit += 1;
      expect(yuna.mp, `seed ${seed}`).toBe(0);
      expect(yuna.hp, `seed ${seed}`).toBe(before.hp);
    }
    expect(hit).toBeGreaterThanOrEqual(14);
  });

  it('Blind lands Darkness at 75: most casts at Rikku land and not all of them do', () => {
    let landed = 0;
    const casts = 40;
    for (let seed = 1; seed <= casts; seed++) {
      const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(GARIK_BLIND_ID, ['rikku'])] }), seed);
      play(engine, finished(engine, X2_GARIK_ID));
      if (unit(engine, 'rikku').statuses['darkness'] !== undefined) landed += 1;
    }
    expect(landed).toBeGreaterThan(casts / 2);
    expect(landed).toBeLessThan(casts);
  });

  it('Time Up Meteor ends the fight: twelve hits on everyone, the party is defeated', () => {
    const engine = open(rigged(garikHostileGroup, { [X2_GARIK_ID]: [use(RONSO_TIME_UP_METEOR_ID)] }), 1);
    play(engine, () => false);
    const log = logOf(engine);
    expect(log.some((e) => e.type === 'defeat')).toBe(true);
    for (const id of ['yuna', 'rikku', 'paine']) expect(unit(engine, id).alive, id).toBe(false);
  });
});

describe('the bout\'s Protect and Shell are on Garik alone [RE §2.2]', () => {
  it('Protect, then Shell: Garik wears them and the Youth does not', () => {
    const engine = open(rigged(garikFriendlyGroup, { [X2_GARIK_BOUT_ID]: [use(GARIK_PROTECT_ID, [X2_GARIK_BOUT_ID]), use(GARIK_SHELL_ID, [X2_GARIK_BOUT_ID])] }), 1);
    play(engine, finished(engine, X2_GARIK_BOUT_ID, 2));
    expect([unit(engine, X2_GARIK_BOUT_ID).statuses['protect'] !== undefined, unit(engine, X2_GARIK_BOUT_ID).statuses['shell'] !== undefined]).toEqual([true, true]);
    expect(Object.keys(unit(engine, X2_YOUTH_BOUT_ID).statuses).filter((s) => ['protect', 'shell'].includes(s))).toEqual([]);
  });
});

describe('the scripts in a fight, the girls unable to die and only defending [RE §2]', () => {
  const garikActs = (engine: FFX2Engine, id: string): string[] => logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === id).map((e) => e.abilityId!);

  it('hostile: Garik\'s own 7th and 14th actions are Mighty Guard, the rest Attacks and Blinds, and no Bane Lance (nobody wears Black Mage)', () => {
    for (const seed of [1, 2, 3]) {
      const engine = open(garikHostileGroup, seed);
      immortal(engine);
      play(engine, finished(engine, X2_GARIK_ID, 15));
      const acts = garikActs(engine, X2_GARIK_ID).slice(0, 14);
      expect(acts, `seed ${seed}`).toHaveLength(14);
      expect([acts[6], acts[13]], `seed ${seed}`).toEqual([GARIK_MIGHTY_GUARD_ID, GARIK_MIGHTY_GUARD_ID]);
      for (const [i, a] of acts.entries()) if (i !== 6 && i !== 13) expect([GARIK_ATTACK_ID, GARIK_BLIND_ID], `seed ${seed} action ${i + 1}`).toContain(a);
    }
  });

  it('hostile: the Youths swing, and one turn in eight a Youth uses MP Blowout (over three seeds of 40 Youth actions each, at least one)', () => {
    let blowouts = 0;
    for (const seed of [1, 2, 3]) {
      const engine = open(garikHostileGroup, seed);
      immortal(engine);
      play(engine, finished(engine, X2_YOUTH_A_ID, 40));
      const acts = garikActs(engine, X2_YOUTH_A_ID);
      expect(acts.every((a) => a === YOUTH_ATTACK_ID || a === YOUTH_MP_BLOWOUT_ID), `seed ${seed}`).toBe(true);
      blowouts += acts.filter((a) => a === YOUTH_MP_BLOWOUT_ID).length;
    }
    expect(blowouts).toBeGreaterThanOrEqual(1);
  });

  it('friendly: the bout\'s beat is Protect, Attack x3, Shell, Attack x3, Protect, Attack x3 (Garik\'s first 12 actions), and the Youth only swings', () => {
    for (const seed of [1, 2, 3]) {
      const engine = open(garikFriendlyGroup, seed);
      immortal(engine);
      play(engine, finished(engine, X2_GARIK_BOUT_ID, 12));
      const beat = [GARIK_PROTECT_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID, GARIK_SHELL_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID, GARIK_PROTECT_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID, GARIK_ATTACK_ID];
      expect(garikActs(engine, X2_GARIK_BOUT_ID).slice(0, 12), `seed ${seed}`).toEqual(beat);
      expect(new Set(garikActs(engine, X2_YOUTH_BOUT_ID)), `seed ${seed}`).toEqual(new Set([YOUTH_ATTACK_ID]));
    }
  });
});
