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
import { PRE_SUMMON_DAMAGE_CAP } from '../../../src/battle/ffx/ai/macalania-rules.ts';
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
  // §5.2 [verified: 2 sources] — the board the player first sees is already
  // buffed, staged as a scripted pre-turn sequence rather than three turns.
  it('opens with Seymour Shelled and both Guardians Protected', () => {
    const engine = newEngine(1);
    expect(cmb(engine, SEYMOUR).statuses['shell']).toBeDefined();
    for (const g of GUARDS) expect(cmb(engine, g).statuses['protect']).toBeDefined();
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
   * A-3, the half that measures the **cap** rather than the floor.
   *
   * **Measured, and worth writing down:** on the shipped board the cap can
   * never bind. `PRE_SUMMON_DAMAGE_CAP` is 5,999, his pool is 6,000 and
   * `PRE_SUMMON_HP_FLOOR` is 1, so `hpBefore - floor` is *also* 5,999 and the
   * floor alone clamps every oversized blow to the same number. Removing the
   * `damageCapPerHit` assignment entirely changes no observable value in this
   * encounter — checked by deleting it and re-running this file. The cap is
   * therefore belt-and-braces on this board, and a test that only swings at the
   * shipped 6,000 pool cannot tell the two clamps apart, which is how the
   * capability shipped untested.
   *
   * So the cap is pinned where it *can* bind: the pool is widened on purpose so
   * the floor is out of the way, and the blow is still a **real action through
   * the real chain** — `hp.ts#dealDamage` is the single funnel, so only a
   * resolved command exercises it. The second half then puts the shipped 6,000
   * back and asserts the board-level consequence.
   */
  it('A-3: a single blow is clamped to the cap, and on the shipped pool leaves him on 1', () => {
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

    // 1. The cap, with the floor moved out of its way. Strength 400 is worth
    //    well over 9,999 raw through `formulas.ts`, so what comes out is the
    //    cap and nothing else.
    const wide = swing(40_000, 400);
    expect(biggestOn(wide)).toBe(PRE_SUMMON_DAMAGE_CAP);
    expect(cmb(wide, SEYMOUR).alive).toBe(true);

    // 2. The board-level consequence, on his real 6,000 pool: one blow that
    //    would kill him several times over leaves him alive on exactly 1.
    const real = swing(6000, 400);
    expect(biggestOn(real)).toBeLessThanOrEqual(PRE_SUMMON_DAMAGE_CAP);
    expect(cmb(real, SEYMOUR).hp).toBe(1);
    expect(cmb(real, SEYMOUR).alive).toBe(true);
  });

  // A-3. §5.2 [verified: 2 sources] — the HD clamp and floor.
  it('A-3: across a whole real drive to the summon, he never drops below 1', () => {
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
  it('the summon fires at 3,000, kills the Guardians and puts Anima on the field', () => {
    const engine = newEngine(3);
    driveIntended(engine, () => engine.state().flags['macalania.animaSummoned'] === true);
    expect(engine.state().flags['macalania.animaSummoned']).toBe(true);
    expect(engine.state().flags['macalania.act']).toBe(2);
    expect(cmb(engine, SEYMOUR).hp).toBeLessThanOrEqual(3000);
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

    // Let him take a few act-three turns and count the hits per action.
    driveIntended(engine, () => {
      const multi = engine
        .state()
        .log.filter((e: BattleEvent) => e.type === 'damage' && e.sourceId === SEYMOUR && e.hitCount === 2);
      return multi.length >= 2;
    });
    const multi = engine
      .state()
      .log.filter((e: BattleEvent) => e.type === 'damage' && e.sourceId === SEYMOUR && e.hitCount === 2);
    expect(multi.length).toBeGreaterThanOrEqual(2);
    // Two hits, indices 0 and 1, out of one action.
    expect(multi.map((e) => (e.type === 'damage' ? e.hitIndex : -1)).slice(0, 2)).toEqual([0, 1]);
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
