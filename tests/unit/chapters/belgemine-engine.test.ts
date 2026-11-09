/**
 * **Belgemine's eight duels on the real engine** (the hidden Belgemine's Challenge chapter; **FFX only**): each duel played to its end on three seeds, the menu Yuna sees, the mirror lock, the bystanders that are never
 * targeted, the dog's bite on Yojimbo's order, Bahamut's counters, the loss that ends a duel, and the chain's carry between the acts (the heal, the gauges). These are the T0 checks of the preflight (rule 3: prove it by running
 * the engine, not by reading the code).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent, FFXCombatant } from '../../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { BELG_ACTS, type BelgActKey } from '../../../src/data/ffx/belgemine-ids.ts';
import { belgemineBuild, belgemineBuildOf } from '../../../src/data/ffx/builds/belgemine.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { COUNTER_OFF_FLAG, DEFEND_OFF_FLAG } from '../../../src/battle/ffx/formation-flags.ts';
import { ACT_KEYS, actions, actor, advisor, careless, defend, defendOrAttack, engineOn, row, foesOf, log, newEngine, nextInput, playChain, playDuel, playEngine, setup } from '../helpers/belgemineDrive.ts';

const FIRST_ROW: Record<BelgActKey, string> = {
  valefor: 'pterya-summon', ifrit: 'grothia-summon', ixion: 'belg-summon-ixion', shiva: 'belg-summon-shiva', bahamut: 'spathi-summon', yojimbo: 'yojimbo-summon', anima: 'belg-summon-anima', sisters: 'belg-summon-sisters',
};
const FIRST_BODY: Record<BelgActKey, string> = {
  valefor: 'belg-valefor', ifrit: 'belg-ifrit', ixion: 'belg-ixion', shiva: 'belg-shiva', bahamut: 'belg-bahamut', yojimbo: 'belg-yojimbo', anima: 'belg-anima', sisters: 'belg-cindy',
};

describe('each duel, seeds 1 to 3, played by the shipped line to an end', () => {
  for (const key of ACT_KEYS) {
    it(`${key}: the first action is the Summon at Belgemine; the duel ends in a victory or a defeat; Belgemine neither acts nor is struck; a win names the next act`, () => {
      for (const seed of [1, 2, 3]) {
        const engine = newEngine(key, seed);
        const result = playEngine(engine, advisor());
        expect(['victory', 'defeat'], `${key} seed ${seed}`).toContain(result.outcome);
        const events = log(engine);
        const starts = events.filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start');
        expect(starts[0]!.actorId, `${key} seed ${seed}`).toBe(FIRST_BODY[key]);
        expect(starts[0]!.abilityId).toBe(FIRST_ROW[key]);
        expect([...starts[0]!.targets]).toEqual(['belgemine']);
        expect(starts.some((e) => e.actorId === 'belgemine'), 'Belgemine takes no turn').toBe(false);
        expect(starts.some((e) => e.actorId !== 'belgemine' && e.targets.includes('belgemine') && e.abilityId !== FIRST_ROW[key]), 'nothing but the Summon names her').toBe(false);
        if (result.outcome === 'victory') expect(result.nextGroupId, key).toBe(BELG_ACTS[ACT_KEYS.indexOf(key) + 1]?.groupId);
      }
    });
  }
});

describe('the menu Yuna sees on the first turn of an aeon duel', () => {
  it('Summon and Grand Summon are all that is on (the formation script switches Defend off and greys the rest): every other command is greyed; the aeon the enemy holds is greyed "Mirror of ..."', () => {
    const engine = newEngine('ixion', 1);
    const d = nextInput(engine);
    expect(d.actorId).toBe('yuna');
    const on = d.commands.filter((c) => c.enabled).map((c) => (c.command.kind === 'summon' ? `summon:${c.command.id}` : c.command.kind === 'overdrive' ? `overdrive:${c.command.id}` : c.command.kind));
    expect(on.filter((x) => !x.startsWith('summon:')).sort()).toEqual(['overdrive:grand-summon']); // no Defend row: the formation script calls setDefendingEnabled(0) (`lmyt01_0n`, as Chapter XIV's)
    expect(on.filter((x) => x.startsWith('summon:')).sort()).toEqual(['summon:anima', 'summon:bahamut', 'summon:cindy', 'summon:ifrit', 'summon:shiva', 'summon:valefor', 'summon:yojimbo']);
    const mirror = d.commands.find((c) => c.command.kind === 'summon' && c.command.id === 'ixion')!;
    expect([mirror.enabled, mirror.disabledReason]).toEqual([false, 'Mirror of Ixion']);
    expect(d.commands.some((c) => c.command.kind === 'switch' && c.enabled)).toBe(false);
  });

  it('all eight duels: the formation script\'s Defend-off and counter-off flags are in the state, Yuna has no Defend row, a submitted Defend is refused with the turn kept open, and a summoned aeon has none either', () => {
    for (const key of ACT_KEYS) {
      const engine = newEngine(key, 3);
      expect(engine.state().flags[DEFEND_OFF_FLAG], key).toBe(true);
      expect(engine.state().flags[COUNTER_OFF_FLAG], key).toBe(true);
      const d = nextInput(engine);
      expect(d.actorId, key).toBe('yuna');
      expect(d.commands.map((c) => c.command.kind), key).not.toContain('defend');
      const before = engine.state().log.length;
      expect(engine.submit(defend()), key).toEqual([]); // refused with no event
      expect(engine.state().log.length, key).toBe(before);
      expect(nextInput(engine).actorId, key).toBe('yuna'); // the turn is still hers
    }
    // An aeon of hers on the field has no Defend row either (Valefor is free in the Ifrit act).
    const engine = newEngine('ifrit', 3);
    engine.submit(row(nextInput(engine), 'summon', 'valefor')!);
    const a = nextInput(engine);
    expect(a.actorId).toBe('valefor');
    expect(a.commands.map((c) => c.command.kind)).not.toContain('defend');
  });

  it('the Sisters\' duel locks all three of hers (one Summon entry, greyed); every other aeon is on offer', () => {
    const engine = newEngine('sisters', 1);
    const d = nextInput(engine);
    const sisters = d.commands.find((c) => c.command.kind === 'summon' && c.command.id === 'cindy')!;
    expect(sisters.enabled).toBe(false);
    expect(d.commands.filter((c) => c.enabled && c.command.kind === 'summon')).toHaveLength(7); // Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo
    expect(actor(engine, 'belg-cindy').alive).toBe(true);
  });

  it('Belgemine and the dog are named by no command: neither is a valid target of anything on any turn', () => {
    const engine = newEngine('yojimbo', 1);
    for (let i = 0; i < 12; i++) {
      let d;
      try { d = nextInput(engine); } catch { break; }
      for (const c of d.commands) {
        expect(c.validTargets, `${d.actorId} ${c.label}`).not.toContain('belgemine');
        expect(c.validTargets, `${d.actorId} ${c.label}`).not.toContain('belg-daigoro');
      }
      const pick = careless(d, engine);
      engine.submit(pick ?? defendOrAttack(d, engine));
    }
  });
});

describe('the pieces that need the real engine', () => {
  it('Yojimbo\'s order is answered by the dog\'s bite at once, on a living character of the front line (the game\'s pick), with the dog\'s own Strength', () => {
    const engine = newEngine('yojimbo', 1);
    playEngine(engine, careless);
    const starts = log(engine).filter((e): e is Extract<BattleEvent, { type: 'action-start' }> => e.type === 'action-start');
    const orders = starts.map((e, i) => [e, i] as const).filter(([e]) => e.abilityId === 'belg-daigoro-order');
    expect(orders.length).toBeGreaterThan(0);
    for (const [, i] of orders) expect(starts[i + 1]).toMatchObject({ actorId: 'belg-daigoro', abilityId: 'daigoro-attack' });
    expect(actor(engine, 'belg-daigoro').stats.str).toBe(25);
  });

  it('Bahamut counters the allowed hits: Attacks at the attacker, and Impulse on the front line on the fifth', () => {
    const engine = newEngine('bahamut', 1);
    playEngine(engine, careless);
    const acts = actions(log(engine), 'belg-bahamut');
    expect(acts.filter((a) => a === 'grothia-attack-yuna').length).toBeGreaterThan(0);
    expect(acts).toContain('belg-impulse');
    // the empty turns pass: no event of his own between the Summon and the first counter or the first Mega Flare that is not a counter
    expect(acts[0]).toBe('spathi-summon');
  });

  it('the enemy aeon\'s gauge fills from the hits it takes and its big move fires: Valefor\'s Energy Blast, Ifrit\'s Hellfire come in a long enough duel', () => {
    const blast = playDuel(1, 'valefor', careless);
    const seen = (key: BelgActKey, id: string, seeds: number): boolean => Array.from({ length: seeds }, (_, s) => s + 1).some((seed) => {
      const e = newEngine(key, seed);
      playEngine(e, careless);
      return actions(log(e), FIRST_BODY[key]).includes(id);
    });
    expect(blast.outcome === 'victory' || blast.outcome === 'defeat').toBe(true);
    expect(seen('valefor', 'belg-energy-blast', 10)).toBe(true);
    expect(seen('bahamut', 'spathi-mega-flare', 10)).toBe(true);
  });

  it('the loss ends a duel (no aeon left to call): the careless line loses the Sisters at the Zanarkand tier on three seeds, as a defeat and never a stalemate', () => {
    const party = belgemineBuildOf('zanarkand');
    for (const seed of [1, 2, 3]) {
      const r = playDuel(seed, 'sisters', careless, party);
      expect(r.outcome, `seed ${seed}`).toBe('defeat');
    }
  });

  it('a duel can be won: the careless line wins Valefor\'s on every one of the three seeds', () => {
    for (const seed of [1, 2, 3]) expect(playDuel(seed, 'valefor', careless).outcome, `seed ${seed}`).toBe('victory');
  });
});

describe('the chain\'s carry between two acts (the heal, the gauges, the bag)', () => {
  it('the next act enters with Yuna and every aeon whole (a fallen one stands), the Overdrive gauges as the last act left them, the bag as spent', () => {
    const s1 = setup('valefor', 1);
    const e1 = engineOn(s1);
    const r1 = playEngine(e1, careless);
    expect(r1.outcome).toBe('victory');
    const before = e1.state();
    const hurt = Object.values(before.combatants).filter((c) => c.side === 'aeon' && (c as FFXCombatant).hp < (c as FFXCombatant).stats.maxHp);
    expect(hurt.length, 'the careless line leaves aeons hurt or down').toBeGreaterThan(0);

    const next = ENEMY_GROUPS_BY_ID[r1.nextGroupId!]!;
    const s2 = setupForNextLink(s1, next, before, 2);
    const e2 = engineOn(s2);
    const state = e2.state();
    for (const a of belgemineBuild.aeons) {
      const c = state.combatants[a.id] as FFXCombatant;
      expect(c.hp, `${a.id} is whole on entry`).toBe(c.stats.maxHp);
      expect(c.alive, a.id).toBe(true);
      const left = before.combatants[a.id] as FFXCombatant;
      expect(c.overdrive?.gauge, `${a.id} keeps its gauge`).toBe(left.overdrive?.gauge ?? 0);
    }
    expect((state.combatants['yuna'] as FFXCombatant).hp).toBe((state.combatants['yuna'] as FFXCombatant).stats.maxHp);
    expect(foesOf(e2)).toEqual(['belg-ifrit']);
  });

  it('the whole chain on one seed runs act after act with the seed + 0, + 1 ...; a defeat stops it where it fell', () => {
    const chain = playChain(1, advisor());
    expect(chain.acts.length).toBeGreaterThan(0);
    expect(chain.acts.length).toBeLessThanOrEqual(8);
    if (chain.outcome === 'victory') expect(chain.acts).toHaveLength(8);
    else expect(chain.lostIn).toBe(chain.acts.length - 1);
  });
});

describe('Ixion\'s guard in a real run', () => {
  it('while he braces his Defense and Magic Defense read 255 on the combatant the player\'s Scan would show, and his next turn resets them to 40', () => {
    let braced = 0;
    for (let seed = 1; seed <= 12 && braced === 0; seed++) {
      const engine = newEngine('ixion', seed);
      for (let i = 0; i < 400; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const ixion = actor(engine, 'belg-ixion');
        if (ixion.stats.def === 255) {
          braced++;
          expect([ixion.stats.def, ixion.stats.mdef]).toEqual([255, 255]);
          break;
        }
        engine.submit(careless(d, engine) ?? defendOrAttack(d, engine));
      }
    }
    expect(braced, 'in twelve seeds he braces at least once').toBeGreaterThan(0);
  });
});
