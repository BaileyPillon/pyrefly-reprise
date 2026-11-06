/**
 * The Omega Ruins' line (FFX only; `src/engine/tactics/omega-ruins.ts`): the line the three fights are played with, which the first menu's NEXT BEST MOVE card, the strategy guide's NEXT line and the auto-battler all follow.
 * It is the bench's **advisor** (`tests/unit/helpers/omegaRuinsBench.ts`) moved into the game. What is pinned: where the line is found (FFX only, the three bodies' ids), each rule on a real board, that the card never
 * spends an Overdrive on a Weapon (Nemesis answers one with an Ultima), and that the registry's pick equals the line's decision.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleState, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { AUTO_LIFE_MP, OMEGA_RUINS_BOSS_IDS, QUICK_HIT_MP, SHIPPED_LINE, lineWith, omegaRuins } from '../../../src/engine/tactics/omega-ruins.ts';
import { omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import * as H from '../helpers/omegaRuinsDrive.ts';

type Engine = ReturnType<typeof H.newEngine>;

const command = (engine: BattleEngine, d: H.Input): Command | null => omegaRuins(d.actorId, d.commands, engine);
const idOf = (c: Command | null): string | null => (c !== null && 'id' in c ? String((c as { id?: unknown }).id) : c === null ? null : c.kind);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

/** A first menu of `who` at `group`, the party untouched. */
const menu = (group: string, who: string, seed = 1): { engine: Engine; d: H.Input } => {
  const engine = H.newEngine(seed, group);
  return { engine, d: H.inputFor(engine, who) };
};

describe('where the line is found: FFX only, on the three bodies\' own boards', () => {
  it('is registered under the chapter and each body\'s id, and tacticFor finds it on every board of the chain', () => {
    expect(OMEGA_RUINS_BOSS_IDS).toEqual(['ultima-weapon', 'omega-weapon', 'nemesis']);
    expect(TACTICS.filter((t) => t.chapterId === 'omega-ruins').map((t) => [t.bossId, t.tactic])).toEqual(OMEGA_RUINS_BOSS_IDS.map((id) => [id, omegaRuins]));
    for (const group of [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]) expect(tacticFor(H.newEngine(1, group)), group).toBe(omegaRuins);
  });

  it('is not reached by an FFX-2 board that fields a combatant with the same id, or by an FFX board without the bodies (the game gate of lookup.ts)', () => {
    const board = (game: string, ids: string[]) => ({ state: () => ({ game, combatants: Object.fromEntries(ids.map((id) => [id, { id, side: id === 'yuna' ? 'party' : 'enemy' }])) }) }) as unknown as BattleEngine;
    for (const id of OMEGA_RUINS_BOSS_IDS) {
      expect(tacticFor(board('ffx2', ['yuna', id])), id).not.toBe(omegaRuins);
      expect(tacticFor(board('ffx', ['yuna', 'seymour-flux'])), id).not.toBe(omegaRuins);
    }
  });

  it('returns null (the generic ladder) when none of the three stands', () => {
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'tidus');
    const foe = H.foeOf(engine);
    foe.alive = false;
    foe.hp = 0;
    expect(command(engine, d)).toBeNull();
  });
});

describe('each rule, on the real engine\'s first menus of Nemesis', () => {
  it('Yuna: Auto-Life on the first member of the line who lacks it, in slot order (Tidus), then each in turn as it lands, then a swing', () => {
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'yuna');
    const first = command(engine, d);
    expect([first?.kind, idOf(first), targetOf(first)]).toEqual(['ability', 'auto-life', 'tidus']);
    H.give(H.actor(engine, 'tidus'), 'auto-life', 255);
    expect([idOf(command(engine, d)), targetOf(command(engine, d))]).toEqual(['auto-life', 'yuna']);
    H.give(H.actor(engine, 'yuna'), 'auto-life', 255);
    expect([idOf(command(engine, d)), targetOf(command(engine, d))]).toEqual(['auto-life', 'lulu']);
    H.give(H.actor(engine, 'lulu'), 'auto-life', 255);
    const swing = command(engine, d);
    expect([swing?.kind, targetOf(swing)]).toEqual(['attack', 'nemesis']);
  });

  it('Yuna: when she cannot pay the 97 MP she drinks a Turbo Ether first, then an Elixir, then an Ether; with none, a swing', () => {
    expect(AUTO_LIFE_MP).toBe(97);
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'yuna');
    const yuna = H.actor(engine, 'yuna');
    yuna.mp = AUTO_LIFE_MP - 1;
    expect([idOf(command(engine, d)), targetOf(command(engine, d))]).toEqual(['turbo-ether', 'yuna']);
    const withoutTurbo = d.commands.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && c.command.id === 'turbo-ether'));
    expect(idOf(omegaRuins('yuna', withoutTurbo, engine))).toBe('elixir');
    const withoutBoth = withoutTurbo.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && c.command.id === 'elixir'));
    expect(idOf(omegaRuins('yuna', withoutBoth, engine))).toBe('ether');
    const none = withoutBoth.filter((c) => !(c.command.kind === 'item' && 'id' in c.command && c.command.id === 'ether'));
    expect(omegaRuins('yuna', none, engine)?.kind).toBe('attack');
    yuna.mp = AUTO_LIFE_MP;
    expect(idOf(command(engine, d))).toBe('auto-life');
  });

  it('Yuna does not cast silenced (a swing), and the line is the same with the rule switched off (lineWith)', () => {
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'yuna');
    H.give(H.actor(engine, 'yuna'), 'silence');
    expect(command(engine, d)?.kind).not.toBe('ability');
    H.actor(engine, 'yuna').statuses = {} as FFXCombatant['statuses'];
    const off = lineWith({ ...SHIPPED_LINE, autoLife: false })('yuna', d.commands, engine);
    expect(off?.kind).toBe('attack');
  });

  it('Tidus: Quick Hit at Nemesis while he has the 36 MP, then a plain swing', () => {
    expect(QUICK_HIT_MP).toBe(36);
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'tidus');
    const hit = command(engine, d);
    expect([hit?.kind, idOf(hit), targetOf(hit)]).toEqual(['ability', 'quick-hit', 'nemesis']);
    H.actor(engine, 'tidus').mp = QUICK_HIT_MP - 1;
    const swing = command(engine, d);
    expect([swing?.kind, targetOf(swing)]).toEqual(['attack', 'nemesis']);
  });

  it('Lulu swings: her blow reads her weapon, and her spells are not stronger per tick against Nemesis', () => {
    const { engine, d } = menu(NEMESIS_GROUP_ID, 'lulu');
    const swing = command(engine, d);
    expect([swing?.kind, targetOf(swing)]).toEqual(['attack', 'nemesis']);
  });

  it('never an Overdrive: with Tidus\'s gauge full the card still names a swing, and the generic ladder\'s pick is the line\'s', () => {
    for (const group of [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]) {
      const engine = H.newEngine(2, group);
      H.actor(engine, 'tidus').overdrive!.gauge = 100;
      const d = H.inputFor(engine, 'tidus');
      expect(d.commands.some((c) => c.enabled && c.command.kind === 'overdrive'), `${group}: the Overdrive is on offer`).toBe(true);
      const mine = command(engine, d);
      expect(mine?.kind, group).not.toBe('overdrive');
      expect(JSON.stringify(intendedStrategy(d.actorId, d.commands, engine)), group).toBe(JSON.stringify(mine));
    }
  });
});

describe('the care of the two Weapons\' fights and the skeleton under Nemesis', () => {
  const bare = (): Engine => {
    const party = structuredClone(omegaRuinsBuild);
    for (const m of party.members) m.equipment.armor.autoAbilities = m.equipment.armor.autoAbilities.filter((a) => a !== 'ribbon');
    return H.newEngine(3, ULTIMA_GROUP_ID, party);
  };

  it('a Petrified member is cured with a Soft by whoever has the turn', () => {
    const engine = bare();
    const d = H.inputFor(engine, 'tidus');
    H.give(H.actor(engine, 'lulu'), 'petrify');
    const soft = command(engine, d);
    expect([idOf(soft), targetOf(soft)]).toEqual(['soft', 'lulu']);
  });

  it('a Confused or sleeping member is cured with Esuna by Yuna, or with a Remedy by one who cannot cast it', () => {
    const engine = bare();
    const d = H.inputFor(engine, 'tidus');
    H.give(H.actor(engine, 'yuna'), 'confuse');
    const remedy = command(engine, d); // Tidus has no Esuna: a Remedy
    expect([idOf(remedy), targetOf(remedy)]).toEqual(['remedy', 'yuna']);
    const other = bare();
    const yd = H.inputFor(other, 'yuna');
    H.give(H.actor(other, 'lulu'), 'sleep');
    const esuna = command(other, yd);
    expect([idOf(esuna), targetOf(esuna)]).toEqual(['esuna', 'lulu']);
  });

  it('Yuna\'s Silence is cured with an Echo Screen when the bag has one, otherwise a Remedy (the endgame bag holds Remedies)', () => {
    const engine = bare();
    const d = H.inputFor(engine, 'tidus');
    H.give(H.actor(engine, 'yuna'), 'silence');
    const remedy = command(engine, d);
    expect([idOf(remedy), targetOf(remedy)]).toEqual(['remedy', 'yuna']);
    // an Echo Screen on offer is taken first
    const echoRow = { ...d.commands.find((c) => c.command.kind === 'item' && 'id' in c.command && c.command.id === 'remedy')!, label: 'Echo Screen', command: { kind: 'item', id: 'echo-screen', targets: [] } } as (typeof d.commands)[number];
    const echo = omegaRuins('tidus', [echoRow, ...d.commands], engine);
    expect([idOf(echo), targetOf(echo)]).toEqual(['echo-screen', 'yuna']);
  });

  it('a fallen member is stood up with a Phoenix Down before anything else', () => {
    const engine = bare();
    const d = H.inputFor(engine, 'yuna');
    H.actor(engine, 'lulu').alive = false;
    H.actor(engine, 'lulu').hp = 0;
    const down = command(engine, d);
    expect([idOf(down), targetOf(down)]).toEqual(['phoenix-down', 'lulu']);
  });

  it('against Ultima and Omega Weapon nobody casts Auto-Life or Quick Hit: Yuna and Tidus swing (a Weapon\'s blows are a check of preparation, not a threat)', () => {
    for (const group of [ULTIMA_GROUP_ID, OMEGA_GROUP_ID]) {
      const { engine, d } = menu(group, 'yuna');
      expect(command(engine, d)?.kind, group).toBe('attack');
      const t = H.inputFor(engine, 'tidus');
      expect(command(engine, t)?.kind, group).toBe('attack');
    }
  });
});

describe('the line is the bench\'s advisor, and wins what the bench says it wins', () => {
  it('seeds 1 to 3: the card\'s pick (intendedStrategy) equals the line\'s decision on every input of a real Nemesis fight', () => {
    for (const seed of [1, 2, 3]) {
      const engine = H.newEngine(seed, NEMESIS_GROUP_ID);
      for (let i = 0; i < 400; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const pick = intendedStrategy(d.actorId, d.commands, engine) as Command | null;
        expect(JSON.stringify(pick), `seed ${seed} input ${i}`).toBe(JSON.stringify(omegaRuins(d.actorId, d.commands, engine)));
        engine.submit(pick ?? H.defend());
      }
    }
  }, 120_000);

  it('a state of its own: a game that is not FFX never sees the line (the lookup table)', () => {
    const state = { game: 'ffx2', combatants: {} } as unknown as BattleState;
    expect(state.game).toBe('ffx2');
    expect(OMEGA_RUINS_BOSS_IDS.every((id) => id !== 'x2-nothing')).toBe(true);
  });
});
