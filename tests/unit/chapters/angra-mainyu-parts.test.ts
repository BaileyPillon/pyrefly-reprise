/**
 * Angra Mainyu (FFX-2 Chapter 5, the hidden chapter): the two arms, the ending and the pause objectives in the real engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Every test here uses the *immortal* measurement rig (the girls carry Invincible and are topped up at every decision; a rig, not a chapter) so a controlled volley can land while the three scripts run.
 *
 * 1. **The arms' immunities** [`COMPANION_IMMUNITY`, `[inferred]` from group-2 slots 15 and 16 of rows 269 and 270 and from Jegged and the wiki: "Zarich ignores physical, Tawrich ignores magic, Darkness is neither"]:
 *    a blow on Zarich is a miss ("immune"), a spell on Tawrich is a miss, the reverse lands, and Darkness (neither class) reaches the body and both arms. The immunities are laid at the start, one each, and stay through a death.
 * 2. **A fallen arm** [RE §9.5 branches 3 and 4]: the body raises it with Full-Life at full HP, Tawrich before Zarich, and the arm acts again; the fight does not stall on the loop.
 * 3. **The ending** [`[inferred]`, the driver's ruling: when the body falls the fight is over, the arms leave with it]: the body's death is a victory with both arms still standing, and pays what row 268 pays.
 *    Bringing both arms down ends nothing.
 * 4. **The pause objectives** read the real moves: "Survive Perdition's Flame", "Bring both arms down" (both down at the same time), "Defeat Angra Mainyu".
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ANGRA_ABILITY as A } from '../../../src/battle/ffx2/ai/angra-mainyu.ts';
import { angraMainyuBuild } from '../../../src/data/ffx2/builds/angra-mainyu.ts';
import { COMPANION_IMMUNITY } from '../../../src/data/ffx2/enemies/angra-mainyu.ts';
import { ANGRA_MAINYU_ID } from '../../../src/data/chapter-ffx2-angra-mainyu.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { X2_ANGRA_MAINYU_ID as BODY, X2_TAWRICH_ID as TAWRICH, X2_ZARICH_ID as ZARICH } from '../../../src/data/angra-mainyu-ids.ts';
import { evaluateObjective } from '../../../src/ui/common/chapterObjectives.ts';
import { commandOf, driveAngra, logOf, openAngra, playAngra, startsOf, type AngraEv, type AngraInput } from '../helpers/angraMainyuDrive.ts';

const FIRE = 'x2-black-mage-fire';
const DARKNESS = 'x2-dark-knight-darkness';

/** The chapter's preset with Rikku in the Black Mage dressphere and Fire learned: a magical hit on the arms (the shipped preset has no damaging spell). A measurement rig. */
function blackMageRikku(): FFX2PartyBuild {
  const build = structuredClone(angraMainyuBuild);
  const rikku = build.members.find((m) => m.id === 'rikku')!;
  rikku.currentDressphere = 'black-mage';
  rikku.abilitiesLearned['black-mage'] = { learned: [FIRE], ap: 0 };
  return build;
}

type Step = (d: AngraInput) => Command | null;

const attack = (target: string): Step => (d) => {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  return row ? ({ ...row.command, targets: [target] } as Command) : null;
};
const ability = (id: string, targets: string[]): Step => (d) => commandOf(d, 'ability', id, targets);

/** Each girl\'s steps in order, one per decision; a girl with none left defends. */
function volley(plan: Record<string, Step[]>): Step {
  const next: Record<string, number> = {};
  return (d) => {
    const i = next[d.actorId] ?? 0;
    const cmd = plan[d.actorId]?.[i]?.(d) ?? null;
    if (cmd) next[d.actorId] = i + 1;
    return cmd;
  };
}

const unit = (engine: FFX2Engine, id: string): { hp: number; alive: boolean; statuses: Record<string, unknown> } =>
  engine.state().combatants[id] as unknown as { hp: number; alive: boolean; statuses: Record<string, unknown> };

describe('the arms\' immunities in the real engine', () => {
  it('Zarich carries Null Physical and Tawrich Null Magic from the first moment, one each, and the body neither', () => {
    expect(COMPANION_IMMUNITY).toEqual({ zarich: 'null-physical', tawrich: 'null-magic' });
    const engine = openAngra(1);
    expect(Object.keys(unit(engine, ZARICH).statuses)).toEqual(['null-physical']);
    expect(Object.keys(unit(engine, TAWRICH).statuses)).toEqual(['null-magic']);
    expect(Object.keys(unit(engine, BODY).statuses)).toEqual([]);
  });

  it('a blow on Zarich is a miss (immune) and lands on Tawrich; a spell on Tawrich is a miss and lands on Zarich (Fire, which she resists); Darkness, neither, lands on all three', () => {
    for (const seed of [1, 2]) {
      const engine = openAngra(seed, { immortal: true, build: blackMageRikku() });
      playAngra(
        engine,
        volley({
          paine: [attack(ZARICH), attack(TAWRICH), ability(DARKNESS, [])],
          rikku: [ability(FIRE, [TAWRICH]), ability(FIRE, [ZARICH])],
        }),
        (e) => startsOf(e, BODY) >= 8,
        { immortal: true },
      );
      const log = logOf(engine);
      const from = (source: string): AngraEv[] => log.filter((e) => e.sourceId === source);
      const paine = from('paine');
      const rikku = from('rikku');
      // Paine's Attack (one hit): Zarich immune, Tawrich hurt.
      expect(paine.filter((e) => e.type === 'miss' && e.targetId === ZARICH).map((e) => e.reason), `seed ${seed}`).toEqual(['immune']);
      expect(paine.filter((e) => e.type === 'damage' && e.hitCount === 1).map((e) => e.targetId), `seed ${seed}`).toEqual([TAWRICH]);
      // Rikku's Fire: Tawrich immune, Zarich hurt (fire, resisted).
      expect(rikku.filter((e) => e.type === 'miss' && e.targetId === TAWRICH).map((e) => e.reason), `seed ${seed}`).toEqual(['immune']);
      const burn = rikku.filter((e) => e.type === 'damage');
      expect(burn.map((e) => e.targetId), `seed ${seed}`).toEqual([ZARICH]);
      expect(burn[0]).toMatchObject({ element: 'fire', affinity: 'resist' });
      expect(burn[0]!.amount!).toBeGreaterThan(0);
      // Paine's Darkness (three hits, one on each body).
      const dark = paine.filter((e) => e.type === 'damage' && e.hitCount === 3);
      expect(dark.map((e) => e.targetId).sort(), `seed ${seed}`).toEqual([BODY, TAWRICH, ZARICH].sort());
      for (const e of dark) expect(e.amount!, `seed ${seed}`).toBeGreaterThan(0);
    }
  });
});

describe('a fallen arm in the real engine [RE §9.5 branches 3 and 4]', () => {
  /** Both arms at 1 HP, Paine's Attack on Tawrich and Rikku's Fire on Zarich in their first turns: both are down long before the body\'s second action. */
  function bothArmsFall(seed: number, bodyActions: number): FFX2Engine {
    const engine = openAngra(seed, { immortal: true, build: blackMageRikku() });
    unit(engine, TAWRICH).hp = 1;
    unit(engine, ZARICH).hp = 1;
    playAngra(engine, volley({ paine: [attack(TAWRICH)], rikku: [ability(FIRE, [ZARICH])] }), (e) => startsOf(e, BODY) >= bodyActions, { immortal: true });
    return engine;
  }

  it('the body raises Tawrich first and Zarich next with Full-Life, aimed by id, each back at full HP; each then acts again, still carrying its immunity', () => {
    for (const seed of [1, 2, 3]) {
      const engine = bothArmsFall(seed, 6);
      const log = logOf(engine);
      expect(log.filter((e) => e.type === 'ko').map((e) => e.targetId).sort(), `seed ${seed}`).toEqual([TAWRICH, ZARICH]);
      const body = log.filter((e) => e.type === 'action-start' && e.actorId === BODY);
      expect(body.slice(0, 3).map((e) => e.abilityId), `seed ${seed}`).toEqual([A.flame, A.fullLife, A.fullLife]);
      expect(body.slice(1, 3).map((e) => e.targets), `seed ${seed}`).toEqual([[TAWRICH], [ZARICH]]);
      const revives = log.filter((e) => e.type === 'revive');
      expect(revives.map((e) => [e.targetId, e.hp, e.cause]), `seed ${seed}`).toEqual([[TAWRICH, 5440, A.fullLife], [ZARICH, 5440, A.fullLife]]);
      for (const arm of [TAWRICH, ZARICH]) {
        const raisedAt = log.findIndex((e) => e.type === 'revive' && e.targetId === arm);
        expect(log.slice(raisedAt).some((e) => e.type === 'action-start' && e.actorId === arm), `seed ${seed}: ${arm} acts after its revive`).toBe(true);
      }
      expect(unit(engine, TAWRICH).alive && unit(engine, ZARICH).alive).toBe(true);
      expect(Object.keys(unit(engine, ZARICH).statuses)).toContain('null-physical');
      expect(Object.keys(unit(engine, TAWRICH).statuses)).toContain('null-magic');
    }
  });

  it('with only Zarich down the body raises her alone; it never stalls on the loop (the fight goes on for many more actions)', () => {
    const engine = openAngra(1, { immortal: true, build: blackMageRikku() });
    unit(engine, ZARICH).hp = 1;
    const over = !playAngra(engine, volley({ rikku: [ability(FIRE, [ZARICH])] }), (e) => startsOf(e, BODY) >= 30, { immortal: true });
    expect(over).toBe(false);
    const body = logOf(engine).filter((e) => e.type === 'action-start' && e.actorId === BODY);
    expect(body[1]).toMatchObject({ abilityId: A.fullLife, targets: [ZARICH] });
    expect(body.filter((e) => e.abilityId === A.fullLife)).toHaveLength(1);
    expect(body.length).toBeGreaterThanOrEqual(30);
  });
});

describe('the ending in the real engine', () => {
  /** The body at 400 HP and one Darkness from Paine: the body falls with both arms standing. */
  function bodyFalls(seed: number): FFX2Engine {
    const engine = openAngra(seed, { immortal: true });
    unit(engine, BODY).hp = 400;
    playAngra(engine, volley({ paine: [ability(DARKNESS, [])] }), () => false, { immortal: true });
    return engine;
  }

  it('when the body falls the battle is a victory with both arms still standing, and it pays row 268: 30 AP, 5,000 EXP, 5,000 gil and the Ribbon', () => {
    for (const seed of [1, 2, 3]) {
      const engine = bodyFalls(seed);
      const log = logOf(engine);
      const victory = log.filter((e) => e.type === 'victory');
      expect(victory, `seed ${seed}`).toHaveLength(1);
      expect(victory[0]!.result).toMatchObject({ outcome: 'victory', ap: 30, exp: 5000, gil: 5000, drops: [{ itemId: 'ribbon', count: 1 }] });
      expect(log.some((e) => e.type === 'defeat')).toBe(false);
      expect(unit(engine, ZARICH).alive && unit(engine, TAWRICH).alive, `seed ${seed}: the arms were never touched`).toBe(true);
      expect(unit(engine, BODY).alive).toBe(false);
    }
  });

  it('bringing both arms down ends nothing: the fight goes on until the body falls', () => {
    const engine = openAngra(1, { immortal: true, build: blackMageRikku() });
    unit(engine, TAWRICH).hp = 1;
    unit(engine, ZARICH).hp = 1;
    const still = playAngra(engine, volley({ paine: [attack(TAWRICH)], rikku: [ability(FIRE, [ZARICH])] }), (e) => startsOf(e, BODY) >= 3, { immortal: true });
    expect(still).toBe(true);
    const log = logOf(engine);
    expect(log.filter((e) => e.type === 'ko').map((e) => e.targetId).sort()).toEqual([TAWRICH, ZARICH]);
    expect(log.some((e) => e.type === 'victory' || e.type === 'defeat')).toBe(false);
  });

  it('a party that only defends loses it: the chapter can be lost and retried', () => {
    const run = driveAngra('defend', 1);
    expect(run.outcome).toBe('defeat');
  });
});

describe('the pause objectives read the real moves', () => {
  const meta = getChapterMeta(ANGRA_MAINYU_ID)!;
  const rule = (id: string) => meta.objectives.find((o) => o.id === id)!.rule;
  const ctx = (log: readonly AngraEv[]) => ({ state: null, log: log as unknown as readonly BattleEvent[], links: 1 });

  it('"Survive Perdition\'s Flame" is false before the Flame has resolved, true after it with the party standing, false after a wipe', () => {
    const survive = rule('survive-perditions-flame');
    expect(survive).toEqual({ kind: 'survived-ability', ability: A.flame });
    expect(evaluateObjective(survive, ctx([]))).toBe(false);
    const engine = openAngra(1, { immortal: true });
    playAngra(engine, () => null, (e) => logOf(e).some((x) => x.type === 'action-end' && x.actorId === BODY), { immortal: true });
    const log = logOf(engine);
    const started = log.findIndex((e) => e.type === 'action-start' && e.abilityId === A.flame);
    expect(evaluateObjective(survive, ctx(log.slice(0, started + 1)))).toBe(false);
    expect(evaluateObjective(survive, ctx(log))).toBe(true);
    expect(evaluateObjective(survive, ctx([...log, { type: 'defeat' }]))).toBe(false);
  });

  it('"Bring both arms down" is true once both have been down at the same time, and the body\'s Full-Life afterwards does not take it back', () => {
    const arms = rule('both-arms-down');
    expect(arms).toEqual({ kind: 'parts-downed', targetIds: [ZARICH, TAWRICH] });
    const engine = openAngra(1, { immortal: true, build: blackMageRikku() });
    unit(engine, TAWRICH).hp = 1;
    unit(engine, ZARICH).hp = 1;
    expect(evaluateObjective(arms, ctx(logOf(engine)))).toBe(false);
    playAngra(engine, volley({ paine: [attack(TAWRICH)], rikku: [ability(FIRE, [ZARICH])] }), (e) => startsOf(e, BODY) >= 4, { immortal: true });
    expect(evaluateObjective(arms, ctx(logOf(engine)))).toBe(true);
    // One arm down is not both: only Tawrich falls (Zarich is left at full HP and unhurt).
    const one = openAngra(1, { immortal: true, build: blackMageRikku() });
    unit(one, TAWRICH).hp = 1;
    playAngra(one, volley({ paine: [attack(TAWRICH)] }), (e) => startsOf(e, BODY) >= 4, { immortal: true });
    expect(logOf(one).filter((e) => e.type === 'ko').map((e) => e.targetId)).toEqual([TAWRICH]);
    expect(evaluateObjective(arms, ctx(logOf(one))), 'one arm down is not both').toBe(false);
  });

  it('"Defeat Angra Mainyu" is the victory', () => {
    const win = rule('defeat-angra-mainyu');
    expect(win).toEqual({ kind: 'victory' });
    expect(evaluateObjective(win, ctx([]))).toBe(false);
    const engine = openAngra(1, { immortal: true });
    unit(engine, BODY).hp = 400;
    playAngra(engine, volley({ paine: [ability(DARKNESS, [])] }), () => false, { immortal: true });
    expect(evaluateObjective(win, ctx(logOf(engine)))).toBe(true);
  });
});
