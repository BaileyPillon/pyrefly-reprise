/**
 * **Seymour + Anima, Macalania Temple** — the engine and data acceptance cases
 * from `docs/plans/chapter-macalania-review.md` §9, run against the real engine
 * and the real data [AGENTS.md hard rule 3: prove a bug by running the engine,
 * not by grepping — fields arrive through object spread, so text search misses
 * them].
 *
 * **Game case: FFX only.** `A-11` is the absence test for the other game: the
 * four engine capabilities this chapter added are asserted not to move an FFX-2
 * outcome at the same seeds.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleEvent, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
import { SEYMOUR_ANIMA_MACALANIA_ABILITIES } from '../../../src/data/ffx/enemies/seymour-anima-macalania-abilities.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { seymourAnimaMacalania } from '../../../src/engine/tactics/seymour-anima-macalania.ts';
import { SEYMOUR_ANIMA_MACALANIA_GUIDE } from '../../../src/data/guides/seymour-anima-macalania.ts';

const GROUP_ID = 'seymour-anima-macalania';
const SEYMOUR = 'seymour-macalania';
const ANIMA = 'anima-macalania';
const GUARDS = ['guado-guardian-a', 'guado-guardian-b'] as const;

function newEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: macalaniaBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Plain Attack on the first legal target — the dumbest legal driver there is. */
function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = r?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

/** Drive the battle with plain attacks until `stop` says so, or the fight ends. */
function drive(engine: ReturnType<typeof newEngine>, stop: () => boolean, maxDecisions = 4000): void {
  for (let i = 0; i < maxDecisions; i++) {
    if (stop()) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') engine.submit(attack(d));
  }
}

/**
 * Drive with the **shipped** tactic.
 *
 * The plain-attack driver cannot reach act two at all, and that is the
 * encounter working: while a Guardian lives, Cover eats every physical aimed
 * at Seymour, so a party that only swings never moves his bar. Anything that
 * has to *get* to act two or three runs the real line.
 */
function driveIntended(engine: ReturnType<typeof newEngine>, stop: () => boolean, maxDecisions = 20000): void {
  for (let i = 0; i < maxDecisions; i++) {
    if (stop()) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') {
      const tactic = seymourAnimaMacalania(d.actorId, d.commands, engine);
      engine.submit(tactic ?? intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
    }
  }
}

function cmb(engine: ReturnType<typeof newEngine>, id: string): FFXCombatant {
  const c = engine.state().combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
}

describe('Macalania — data', () => {
  // A-5. §13 row 8 records this as a **blocker**: monmagic2 #222 is the boss
  // Anima's Pain (DmgCon 28, 459-518 at MAG 20) and #220 is Yuna's Anima's
  // (DmgCon 20, 328-370). Sharing one record ships the boss at ~70 % of canon
  // damage, or the player's aeon at ~140 %.
  it('A-5: the boss Pain is not the player-aeon Pain', () => {
    const boss = SEYMOUR_ANIMA_MACALANIA_ABILITIES['anima-pain-boss'] as AbilityDef;
    const aeon = ALL_ABILITIES.find((a) => a.id === 'pain');
    expect(boss.power).toBe(28);
    expect(aeon).toBeDefined();
    expect(aeon?.power).toBe(20);
    expect(boss.power).not.toBe(aeon?.power);
    expect(boss.id).not.toBe(aeon?.id);
  });

  // §5.5 [verified: 2 sources]. This fight is Tidus / Yuna / Wakka; Flux is
  // Yuna / Kimahri. §13 row 4 calls a shared table a major defect.
  it("Talk is this chapter's own table, not the Flux fight's", () => {
    const engine = newEngine(1);
    const s = engine.state();
    for (const id of ['tidus', 'yuna', 'wakka']) {
      expect(cmb(engine, id).learnedAbilityIds).toContain('talk');
    }
    // Kimahri has a Talk line in the Flux fight and must not have one here.
    expect(cmb(engine, 'kimahri').learnedAbilityIds).not.toContain('talk');
    void s;
  });

  // §8.6 — "0 % is a rule, not a choice". She was obtained minutes ago.
  it('Shiva arrives with an empty Overdrive gauge and Ice Eater', () => {
    const engine = newEngine(1);
    const shiva = cmb(engine, 'shiva');
    expect(shiva.overdrive?.gauge).toBe(0);
    // §8.4 [verified: 2 sources] — her hidden default armour carries Ice Eater,
    // applied by `setup.ts#AEON_INNATE_AFFINITIES`.
    expect(shiva.affinities['ice']).toBe('absorb');
    // ...and no other aeon gains one by accident.
    expect(cmb(engine, 'valefor').affinities['ice']).toBeUndefined();
    // Ifrit's Fire Eater and Ixion's Lightning Eater are the same default armour,
    // live in every FFX chapter, not only Omnis's (rule 14, 2026-09-25).
    expect(cmb(engine, 'ifrit').affinities).toMatchObject({ fire: 'absorb' });
    expect(cmb(engine, 'ixion').affinities).toMatchObject({ lightning: 'absorb' });
  });

  // §4.3 / §5.1 — Pain's asymmetry needs no engine exception: the hidden Aeon
  // Ribbon is `ko: 255` on every aeon (`setup.ts#AEON_INNATE_IMMUNITIES`), so
  // a 100 % Death rider fails on Shiva and kills a party member. A-4 asserts
  // the **mechanism**, not a hard-coded exception.
  it('A-4: Pain cannot kill an aeon, because of the Aeon Ribbon', () => {
    const engine = newEngine(1);
    expect(cmb(engine, 'shiva').immunities['ko']).toBe(255);
    expect(cmb(engine, 'tidus').immunities['ko'] ?? 0).toBe(0);
    const pain = SEYMOUR_ANIMA_MACALANIA_ABILITIES['anima-pain-boss'] as AbilityDef;
    expect(pain.statusEffects).toEqual([{ status: 'ko', chance: 100, duration: 0 }]);
  });
});

describe('Macalania — act one', () => {
  // §5.2 [verified: 2 sources], read again from the game's own script (re-parity D-09, FFX only): nobody opens
  // buffed. The start hook puts every monster first (counter 0, Seymour 1) and each Guardian's first turn is a real
  // Protect, Seymour's a real Shell, so the buffs are in place when the party first gets a decision.
  it('opens with nobody buffed; the first three enemy turns are Protect, Protect and Shell, before the party acts', () => {
    const engine = newEngine(1);
    expect(cmb(engine, SEYMOUR).statuses['shell']).toBeUndefined();
    for (const g of GUARDS) expect(cmb(engine, g).statuses['protect']).toBeUndefined();
    drive(engine, () => cmb(engine, SEYMOUR).statuses['shell'] !== undefined, 10);
    expect(cmb(engine, SEYMOUR).statuses['shell']).toBeDefined();
    for (const g of GUARDS) expect(cmb(engine, g).statuses['protect']).toBeDefined();
    const opening = engine
      .state()
      .log.filter((e: BattleEvent) => e.type === 'action-start')
      .slice(0, 3)
      .map((e) => (e.type === 'action-start' ? `${e.actorId}:${e.abilityId}` : ''));
    expect(opening).toEqual(['guado-guardian-a:protect', 'guado-guardian-b:protect', 'seymour-macalania:shell']);
    // ...and Anima is not on the field.
    const anima = cmb(engine, ANIMA);
    expect(anima.removed).toBe(true);
    expect(anima.flags.hidden).toBe(true);
  });

  // A-6. §2.3 [verified: 2 sources] — a living Guardian intercepts **physical**
  // attacks aimed at Seymour; **magic is never covered**.
  it('A-6: Cover redirects a physical at Seymour, and never a spell', () => {
    const engine = newEngine(7);
    const before = cmb(engine, SEYMOUR).hp;

    // Drive plain attacks aimed at Seymour for a while.
    for (let i = 0; i < 12; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
      if (!r) continue;
      engine.submit({ kind: 'attack', targets: [SEYMOUR] });
    }

    const log = engine.state().log;
    const party = new Set(['tidus', 'yuna', 'rikku', 'wakka', 'auron', 'lulu', 'kimahri']);
    const physicalOnSeymour = log.filter(
      (e: BattleEvent) => e.type === 'damage' && e.targetId === SEYMOUR && e.sourceId !== undefined && party.has(e.sourceId),
    );
    const physicalOnGuards = log.filter(
      (e: BattleEvent) =>
        e.type === 'damage' && (GUARDS as readonly string[]).includes(e.targetId) && e.sourceId !== undefined && party.has(e.sourceId),
    );
    // Every party swing aimed at Seymour landed on a Guardian instead.
    expect(physicalOnGuards.length).toBeGreaterThan(0);
    expect(physicalOnSeymour.length).toBe(0);
    expect(cmb(engine, SEYMOUR).hp).toBe(before);
  });

  /**
   * A-3, re-read from the game's own script (re-parity D-17, FFX only): **there is no cap and no floor.** The old
   * engine clamped every blow to 5,999 and held him on 1 HP until the summon; the script does neither. A lethal
   * blow lands whole (the ordinary 9,999 per-hit cap is the only one), his `onHit` runs before the death check,
   * sees HP 0 and summons Anima, and the same hook puts him back on 6,000. Both halves are pinned here with a
   * real blow through the real chain: on a widened pool the blow is the full 9,999 and he stays above the
   * summon line; on his real 6,000 it is lethal, and what comes out is the summon, not a survivor on 1 HP.
   */
  it('A-3 (D-17): a blow is not clamped to 5,999; a lethal one is the summon, and he is back on 6,000', () => {
    const swing = (pool: number, str: number): ReturnType<typeof newEngine> => {
      const engine = newEngine(3);
      // Magic is never covered, but this party has no Blk Magic at all, so the
      // Cover has to be off the board for a physical to reach him [§2.3].
      for (const g of GUARDS) {
        const c = cmb(engine, g);
        c.hp = 0;
        c.alive = false;
      }
      const seymour = cmb(engine, SEYMOUR);
      expect(seymour.stats.maxHp).toBe(6000);
      seymour.stats.maxHp = pool;
      seymour.hp = pool;
      // A Strength no sphere grid in the chapter can reach: the point is one
      // blow that would kill him outright several times over.
      cmb(engine, 'tidus').stats.str = str;

      let swung = false;
      for (let i = 0; i < 40 && !swung; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled && c.validTargets.includes(SEYMOUR));
        if (d.actorId === 'tidus' && r) {
          engine.submit({ kind: 'attack', targets: [SEYMOUR] });
          swung = true;
          continue;
        }
        engine.submit(attack(d));
      }
      expect(swung).toBe(true);
      return engine;
    };
    const biggestOn = (engine: ReturnType<typeof newEngine>): number => {
      const hits = engine
        .state()
        .log.filter((e: BattleEvent) => e.type === 'damage' && e.targetId === SEYMOUR && e.sourceId === 'tidus');
      expect(hits.length).toBeGreaterThan(0);
      return Math.max(...hits.map((e) => (e.type === 'damage' ? e.amount : 0)));
    };

    // 1. A widened pool: Strength 400 is worth well over 9,999 raw through `formulas.ts`, so what comes out is the
    //    ordinary per-hit cap, not 5,999, and he stands at 40,000 - 9,999 with no summon.
    const wide = swing(40_000, 400);
    expect(biggestOn(wide)).toBe(9_999);
    expect(cmb(wide, SEYMOUR).hp).toBeLessThanOrEqual(40_000 - 9_999); // (the party's other swings in the same round land too)
    expect(cmb(wide, SEYMOUR).hp).toBeGreaterThan(3_000);
    expect(wide.state().flags['macalania.animaSummoned']).not.toBe(true);

    // 2. His real 6,000 pool: the same blow is lethal. It lands whole (9,999 is shown), the script sees HP 0 and
    //    summons Anima, and he is put back on 6,000 at Magic 32 and untargetable.
    const real = swing(6000, 400);
    expect(biggestOn(real)).toBe(9_999);
    expect(real.state().flags['macalania.animaSummoned']).toBe(true);
    expect(cmb(real, SEYMOUR).hp).toBe(6000);
    expect(cmb(real, SEYMOUR).stats.maxHp).toBe(6000);
    expect(cmb(real, SEYMOUR).alive).toBe(true);
    expect(cmb(real, SEYMOUR).flags.untargetable).toBe(true);
  });

  // A-3. §5.2 [verified: 2 sources] — there is no HD clamp or floor any more (re-parity D-17): a decision never
  // finds him at 0 HP, because the hook that sees HP 0 restores him before the next event.
  it('A-3: across a whole real drive to the summon, no decision finds him below 1 HP', () => {
    const engine = newEngine(3);
    const seymour = cmb(engine, SEYMOUR);
    // The companion case above manufactures the one blow that measures the cap.
    // This one measures the *invariant* instead: over every step of the real
    // line, on the real board, the floor is never crossed.
    let everBelowOne = false;
    driveIntended(engine, () => {
      const hp = engine.state().combatants[SEYMOUR]?.hp ?? 0;
      if (hp < 1) everBelowOne = true;
      return engine.state().flags['macalania.animaSummoned'] === true;
    });
    expect(everBelowOne).toBe(false);
    expect(seymour.stats.maxHp).toBe(6000);
  });

  // §5.2 [verified: 2 sources] — the summon kills every living Guardian, and
  // Anima arrives on the field mid-battle.
  it('the summon fires at 3,000 (inclusive) or on a lethal blow, kills the Guardians and puts Anima on the field', () => {
    const engine = newEngine(3);
    driveIntended(engine, () => engine.state().flags['macalania.animaSummoned'] === true);
    expect(engine.state().flags['macalania.animaSummoned']).toBe(true);
    expect(engine.state().flags['macalania.act']).toBe(2);
    // He is put back on 6,000 at the summon (the script's own restoration, D-17), not left at the 3,000 line.
    expect(cmb(engine, SEYMOUR).hp).toBe(6000);
    expect(cmb(engine, SEYMOUR).stats.mag).toBe(32);
    for (const g of GUARDS) expect(cmb(engine, g).alive).toBe(false);
    const anima = cmb(engine, ANIMA);
    expect(anima.removed).toBe(false);
    expect(anima.hp).toBe(18000);
    // C-2, an owner-approved AUTHORED assumption: present but untargetable.
    expect(cmb(engine, SEYMOUR).flags.untargetable).toBe(true);
  });
});

describe('Macalania — the element cycle', () => {
  // A-9. §5.2 [verified: 2 sources] — ice, lightning, water, fire, and it
  // never varies. The player can always know the next element; that is the
  // whole pre-commitment loop the chapter teaches.
  it('A-9: twelve consecutive Seymour turns are the same four elements, in order', () => {
    const engine = newEngine(11);
    const wanted = ['ice', 'lightning', 'water', 'fire'];
    drive(engine, () => {
      const cast = engine
        .state()
        .log.filter((e: BattleEvent) => e.type === 'damage' && e.sourceId === SEYMOUR && e.hitIndex === 0);
      return cast.length >= 12;
    });
    const elements = engine
      .state()
      .log.filter((e: BattleEvent) => e.type === 'damage' && e.sourceId === SEYMOUR && e.hitIndex === 0)
      .slice(0, 12)
      .map((e) => (e.type === 'damage' ? e.element : 'none'));
    expect(elements.length).toBeGreaterThanOrEqual(4);
    elements.forEach((el, i) => {
      expect(el).toBe(wanted[i % 4]);
    });
  });
});

describe('Macalania — Steal economics', () => {
  // A-7. §2.3, §14 row 1 [verified: 2 sources]. Steal disables Auto-Potion and
  // Hi-Potion-on-Seymour and **nothing else** — both Remedy branches survive.
  // Gating them too would silently double the poison route's value.
  it('A-7: one Steal stops Auto-Potion and leaves both Remedy branches firing', () => {
    const engine = newEngine(5);
    // Steal from whichever Guardian Rikku can reach first.
    for (let i = 0; i < 60; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const steal = d.commands.find((c) => c.enabled && c.label === 'Steal');
      const target = steal?.validTargets.find((t) => (GUARDS as readonly string[]).includes(t));
      if (steal && target) {
        engine.submit({ ...steal.command, targets: [target] } as Command);
        if (engine.state().flags[`macalania.hasPotions.${target}`] === false) break;
        continue;
      }
      engine.submit(attack(d));
    }
    const robbed = GUARDS.filter((g) => engine.state().flags[`macalania.hasPotions.${g}`] === false);
    expect(robbed.length).toBeGreaterThan(0);
    const id = robbed[0] as string;

    // **Stopped.** Auto-Potion is a counter, so it is measured by counting the
    // counters the robbed Guardian actually fires. `learnedAbilityIds` would
    // prove nothing either way: it is static data off `EnemyDef.abilityIds` and
    // no code path can take an id out of it.
    const potions = (): number =>
      engine
        .state()
        .log.filter((e: BattleEvent) => e.type === 'counter' && e.actorId === id && e.abilityId === 'guardian-auto-potion')
        .length;
    const before = potions();
    // The party is taken out of danger on purpose: this case measures a
    // Guardian's supply, and a wipe would end the battle mid-measurement.
    for (const pid of [...engine.state().activeIds, ...engine.state().reserveIds]) {
      const c = engine.state().combatants[pid];
      if (!c) continue;
      c.stats.maxHp = 99_999;
      c.hp = 99_999;
    }
    for (let i = 0; i < 40; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled && c.validTargets.includes(id));
      engine.submit(r ? { kind: 'attack', targets: [id] } : attack(d));
    }
    // It was being hit — and it healed itself not once.
    const hits = engine
      .state()
      .log.filter((e: BattleEvent) => e.type === 'damage' && e.targetId === id && e.amount > 0);
    expect(hits.length).toBeGreaterThan(0);
    expect(potions()).toBe(before);

    // **Still firing.** Poison the robbed Guardian and it reaches for a Remedy
    // on its very next turn: the supply gate is on the two potion rows only,
    // and gating the Remedies too would silently halve what the poison route
    // costs the player [§2.3, §14 row 1].
    const g = cmb(engine, id);
    // Put the bar back: the loop above was beating on it, and a Guardian that
    // dies of poison before its own turn measures nothing.
    g.hp = g.stats.maxHp;
    g.alive = true;
    g.statuses['poison'] = {
      id: 'poison',
      turnsRemaining: 254,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    const remedies = (): number =>
      engine
        .state()
        .log.filter(
          (e: BattleEvent) =>
            e.type === 'action-start' && e.actorId === id && (e.abilityId ?? '').startsWith('guardian-remedy'),
        ).length;
    for (let i = 0; i < 60 && remedies() === 0; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      engine.submit({ kind: 'defend', targets: [] });
    }
    expect(remedies()).toBeGreaterThan(0);
  });
});

describe('Macalania — both-games absence test', () => {
  // A-11. The four capabilities this chapter added — enemy Cover, the
  // `flags.hidden` off-field start, the per-hit damage cap / HP floor and the
  // gauge-on-being-targeted hook — all live in `src/battle/ffx/**` and are
  // read from `ActorRuntime`, which nothing outside that folder can reach.
  // Nothing in `src/battle/ffx2/**` imports any of them.
  it('A-11: no FFX-2 module imports the new FFX capabilities', async () => {
    const ffx2 = await import('../../../src/battle/ffx2/index.ts');
    expect(ffx2).toBeDefined();
    // The Macalania flags exist only in an FFX battle's state.
    const engine = newEngine(1);
    expect(engine.state().flags['macalania.act']).toBe(1);
    expect(engine.state().game).toBe('ffx');
  });

  // Every other shipped FFX enemy is `petrify: 255`, so the new
  // "a petrified monster always shatters" rule cannot fire in any of them.
  it('the shatter rule is unreachable in the three shipped FFX chapters', () => {
    for (const id of ['seymour-flux', 'yunalesca', 'braskas-final-aeon']) {
      const group = ENEMY_GROUPS_BY_ID[id];
      expect(group).toBeDefined();
      for (const e of [...(group?.enemies ?? []), ...(group?.parts ?? [])]) {
        expect(e.immunities['petrify'] ?? 0).toBe(255);
      }
    }
  });
});

describe('Macalania — act three', () => {
  /**
   * A-8. §5.4 [verified: 2 sources] — on Anima's dismissal Seymour returns to
   * **6,000 HP** with **Magic 25 -> 32**, and casts the Multi- version of his
   * -ra spell **twice in one turn**.
   *
   * The two hits come out of one `AbilityDef` with `hits: 2` and
   * `targeting: 'random-enemy'`, which `resolveAbility` re-resolves per hit —
   * so they are two independent draws and one Nul charge absorbs one of them,
   * which is exactly what C-3 recommends, for free.
   */
  it('A-8: Anima at 0 restores him to 6,000 at Magic 32, and Multi- lands twice', () => {
    // Seed 2 -> 1 on 2026-10-08 (re-parity W1, FFX only): the engine now draws hit, variance and critical in the
    // game's order, so seed 2's act three shows only one Multi- hit before the fight ends; seed 1 shows two.
    // Seed 1 -> 3 on 2026-10-09 (re-parity W2, FFX only): the opening counters are the game's 26 fixed draws and statuses roll through the
    // game's infliction step, so the draws moved again; on seed 1 a Nul charge absorbs the first hit of both Multi- casts it sees and the
    // fight ends before one cast has landed both hits. Seed 3 is the first of seeds 1 to 30 whose act three has such a cast (checked by
    // running the engine; seeds 3 to 9, 11, 16, 18 to 21, 23, 25, 28 and 29 do).
    // Seed 3 -> 1 on 2026-10-10 (re-parity W2 merged onto release candidate 1, FFX only): the two sets of changes move the draws again. Seed 1 is
    // the first of seeds 1 to 40 whose act three has a cast that lands both hits (checked by running the engine; 2, 4 to 23, 25 to 31, 33, 34, 38
    // to 40 do, and 3, 24, 32, 35 to 37 do not).
    // Seed 1 -> 2 on 2026-10-10 (re-parity W5, FFX only): the steal roll is the game's byte, a wiped aeon's recovery count is the game's, and the Overdrive gauges
    // follow the game's hooks, so the draws move again; seed 2 is the first of seeds 1 to 40 whose act three has a cast that lands both hits (checked by running the
    // engine; 2, 3, 5, 7 to 10, 12, 13, 15, 18, 19, 21, 22, 24, 28, 30, 33 and 37 to 40 do, and 1, 4, 6, 11, 14, 16, 17, 20, 23, 25 to 27, 29, 31, 32, 34 to 36 do not).
    const engine = newEngine(2);
    driveIntended(engine, () => engine.state().flags['macalania.act'] === 3);
    expect(engine.state().flags['macalania.act']).toBe(3);

    const seymour = cmb(engine, SEYMOUR);
    expect(seymour.stats.mag).toBe(32);
    expect(seymour.flags.untargetable).toBe(false);
    // Anima is off the field again.
    expect(cmb(engine, ANIMA).removed).toBe(true);

    const restored = engine
      .state()
      .log.some((e: BattleEvent) => e.type === 'heal' && e.targetId === SEYMOUR && e.cause === 'seymour-restored');
    expect(restored).toBe(true);

    // Let him take act-three turns until one action has landed BOTH of its hits: hit 0, then hit 1, in a row. (Re-parity W2: a hit that
    // a Nul charge absorbs leaves no damage event, so the first two Multi- damage events can be the second hit of two different actions;
    // the claim is that one action lands twice, so the test waits for one that did.)
    const hitIndexes = (): number[] =>
      engine
        .state()
        .log.filter((e: BattleEvent) => e.type === 'damage' && e.sourceId === SEYMOUR && e.hitCount === 2)
        .map((e) => (e.type === 'damage' ? e.hitIndex : -1));
    const fullActions = (): number => {
      const idx = hitIndexes();
      let n = 0;
      for (let i = 0; i + 1 < idx.length; i++) if (idx[i] === 0 && idx[i + 1] === 1) n++;
      return n;
    };
    driveIntended(engine, () => fullActions() >= 1);
    // Two hits, indices 0 and 1, out of one action.
    expect(fullActions()).toBeGreaterThanOrEqual(1);
  });
});

describe('Macalania — the written guide', () => {
  /**
   * The guide is written but **not registered**: `src/data/guides/index.ts` is
   * integrator-only and the chapter is not playable
   * [docs/plans/chapter-macalania-review.md §8.1]. It is checked here instead,
   * to the same standard `strategy-guide.test.ts` holds the shipped five to,
   * so the integrator's one-line addition cannot be the thing that goes red.
   */
  it('cites every sentence it prints, and claims only this chapter’s bosses', () => {
    const g = SEYMOUR_ANIMA_MACALANIA_GUIDE;
    const cite = /^ffx-[a-z0-9-]+ §/;
    for (const r of g.rules) {
      expect(r.cite, r.text.slice(0, 40)).toMatch(cite);
      expect(r.short.length, r.short).toBeLessThanOrEqual(52);
    }
    for (const h of g.hints) expect(h.cite, h.text.slice(0, 40)).toMatch(cite);
    for (const w of g.watch) expect(w.cite, w.name).toMatch(cite);
    for (const p of g.phases) expect(p.cite, p.label).toMatch(cite);
    expect(g.id).toBe(GROUP_ID);
    expect([...g.bossIds].sort()).toEqual([ANIMA, ...GUARDS, SEYMOUR].sort());
  });
});
