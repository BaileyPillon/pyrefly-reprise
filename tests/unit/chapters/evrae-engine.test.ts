/**
 * **Evrae, on the deck of the *Fahrenheit*** — the mechanic units from
 * `docs/plans/chapter-evrae-review.md` §9.2, and §9.3's game-specific absence
 * tests.
 *
 * Every case here pins **one research claim** against the real engine and the
 * real data. Nothing greps: hard rule 3 says prove a bug by running the engine,
 * and fields arrive through object spread, so text search misses them.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The last describe block is the
 * absence test the rule requires.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, Command, Decision, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';
import { EVRAE_ABILITIES } from '../../../src/data/ffx/enemies/evrae-abilities.ts';
import { evraeGroup } from '../../../src/data/ffx/enemies/evrae.ts';

const GROUP_ID = 'evrae-airship';
const content = new FFXContentRegistry();
content.addAbilities(ALL_ABILITIES);
content.addItems(Object.values(ITEMS));

function newEngine(seed = 1): BattleEngine {
  const group = ENEMY_GROUPS_BY_ID[GROUP_ID];
  if (!group) throw new Error(`${GROUP_ID} missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: fahrenheitBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Drive the battle until `stop` says so, answering every turn with `choose`. */
function drive(
  engine: BattleEngine,
  choose: (d: Extract<Decision, { kind: 'player-input' }>) => Command,
  stop: (engine: BattleEngine) => boolean,
  maxSteps = 4000,
): void {
  for (let i = 0; i < maxSteps; i++) {
    if (stop(engine)) return;
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return;
    if (d.kind !== 'player-input') continue;
    engine.submit(choose(d));
  }
}

const defend = (): Command => ({ kind: 'defend', targets: [] });

/**
 * Swing at the wyrm on every turn.
 *
 * The gaze counter only moves when the party targets Evrae (+2 physical), so a
 * unit that needs a real Stone Gaze has to actually fight.
 */
function attackEvrae(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled && c.validTargets.includes('evrae'));
  return r ? { kind: 'attack', targets: ['evrae'] } : defend();
}

/** Take the party out of danger so a mechanic unit measures the mechanic. */
function makeInvincible(engine: BattleEngine): void {
  const st = engine.state();
  for (const id of [...st.activeIds, ...st.reserveIds]) {
    const c = st.combatants[id];
    if (!c) continue;
    c.stats.maxHp = 99_999;
    c.hp = 99_999;
  }
}

// ---------------------------------------------------------------------------
// The data, against §1 and §3 of the research
// ---------------------------------------------------------------------------

describe('Evrae — the stat block and the action rows', () => {
  const evrae = evraeGroup.enemies.find((e) => e.id === 'evrae');
  const cid = evraeGroup.enemies.find((e) => e.id === 'cid');

  it('§1.1 — 32,000 HP, Agility 20, and the decompiled side of every conflict', () => {
    expect(evrae?.stats.hp).toBe(32_000);
    expect(evrae?.stats.agi).toBe(20);
    expect(evrae?.stats.str).toBe(36);
    expect(evrae?.stats.mag).toBe(30);
    // C-3: the decompile, not the wiki (30 not 20, 3 not 4).
    expect(evrae?.doomTurns).toBe(30);
    expect(evrae?.zanmatoLevel).toBe(3);
    // §1.1 — `ronso_rage_id = 0`: Kimahri learns nothing from Evrae, so there
    // is no Ronso Rage row anywhere in the formation.
    expect(evrae?.abilityIds.some((id) => id.includes('rage'))).toBe(false);
  });

  it('§1.2 — every element halved, holy neutral, and the vocabulary is "lightning"', () => {
    expect(evrae?.affinities).toEqual({ fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist' });
    expect(Object.keys(evrae?.affinities ?? {})).not.toContain('thunder');
    expect(Object.keys(evrae?.affinities ?? {})).not.toContain('holy');
  });

  it('§1.3 — Slow and Darkness land at 50, and it is NOT immune to delay', () => {
    expect(evrae?.immunities.slow).toBe(50);
    expect(evrae?.immunities.darkness).toBe(50);
    expect(evrae?.immunities.poison).toBe(255);
    // Byte 0 = fully landable, and the contract spells a 0 as an omitted key.
    expect(evrae?.immunities['power-break']).toBeUndefined();
    expect(evrae?.immunities['reflect']).toBeUndefined();
    // **The only boss in the anthology that can be delayed** [§5.6].
    expect(evrae?.immunityFlags).not.toContain('immune-to-delay');
    expect(evrae?.immunityFlags).not.toContain('immune-to-sensor');
    expect(evrae?.immunityFlags).not.toContain('immune-to-scan');
    // C-4 — 0 means immune in this contract, which is the default until tested.
    expect(evrae?.threatenChance).toBe(0);
  });

  it('§3.1 — Stone Gaze does ZERO HP damage and carries both statuses', () => {
    const gaze = EVRAE_ABILITIES['evrae-stone-gaze'];
    expect(gaze?.formula).toBe('none');
    expect(gaze?.power).toBe(0);
    expect(gaze?.statusEffects).toEqual([
      { status: 'petrify', chance: 100, duration: 254 },
      { status: 'slow', chance: 255, duration: 254 },
    ]);
  });

  it('§3.1 — Photon Spray is 8 hits that each re-roll their target', () => {
    const spray = EVRAE_ABILITIES['evrae-photon-spray'];
    expect(spray?.hits).toBe(8);
    // `docs/CONTRACTS.md`: 'random-enemy' picks a fresh target per hit.
    expect(spray?.targeting).toBe('random-enemy');
    expect(spray?.canMiss).toBe(false);
  });

  it('§6.1 — Darkness blanks Attack and does NOT blank Swooping Scythe', () => {
    expect(EVRAE_ABILITIES['evrae-attack']?.flags).toContain('affected-by-darkness');
    expect(EVRAE_ABILITIES['evrae-swooping-scythe']?.flags).not.toContain('affected-by-darkness');
  });

  it('§3.3 — the shatter chances are 10 on Attack and 50 on the party-wide Scythe', () => {
    expect(EVRAE_ABILITIES['evrae-attack']?.shatterChance).toBe(10);
    const scythe = EVRAE_ABILITIES['evrae-swooping-scythe'];
    expect(scythe?.shatterChance).toBe(50);
    expect(scythe?.targeting).toBe('all-enemies');
    expect(scythe?.flags).toContain('shatter');
  });

  it('§3.3 note 1 / C-14 — the Haste row is reflectable, and that is a decision', () => {
    const haste = EVRAE_ABILITIES['evrae-haste'];
    expect(haste?.formula).toBe('ctb');
    expect(haste?.flags).toContain('heals'); // halves the pending counter
    expect(haste?.flags).toContain('reflectable'); // owner decision 2026-09-21: keep it
    expect(haste?.statusEffects[0]).toEqual({ status: 'haste', chance: 254, duration: 254 });
  });

  it('§3.4 — "Critical Strike" is not shipped under either attribution', () => {
    for (const id of Object.keys(EVRAE_ABILITIES)) expect(id).not.toContain('critical-strike');
  });

  it('§2 — Cid is untargetable, unscannable, and fires 12 fixed hits at Evrae', () => {
    expect(cid?.flags.untargetable).toBe(true);
    expect(cid?.immunityFlags).toContain('immune-to-sensor');
    expect(cid?.immunityFlags).toContain('immune-to-scan');
    expect(cid?.stats.agi).toBe(16); // C-6 — the decompile, not the wiki's 11
    const missiles = EVRAE_ABILITIES['cid-guided-missiles'];
    expect(missiles?.formula).toBe('fixed');
    expect(missiles?.power).toBe(4);
    expect(missiles?.hits).toBe(12);
    expect(missiles?.canMiss).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The engine, against §2, §4 and §5
// ---------------------------------------------------------------------------

describe('Evrae — the airship, run against the real engine', () => {
  it('§4.1 — the battle opens NEAR, with three volleys in the rack', () => {
    const engine = newEngine();
    const flags = engine.state().flags;
    expect(flags['airship.range']).toBe('near');
    expect(flags['airship.missilesLeft']).toBe(3);
    expect(flags['airship.phase']).toBe(1);
  });

  it('§4.2 — only Tidus and Rikku are offered the orders, and the rest are not', () => {
    const engine = newEngine();
    const seen = new Map<string, boolean>();
    drive(
      engine,
      (d) => {
        for (const c of d.commands) {
          if (c.command.kind === 'trigger') seen.set(`${d.actorId}:${c.command.id}`, c.enabled);
        }
        return defend();
      },
      () => seen.size >= 4,
      200,
    );
    expect(seen.get('tidus:pull-back')).toBe(true);
    expect(seen.get('tidus:close-in')).toBe(true);
    expect(seen.get('rikku:pull-back')).toBe(true);
    expect([...seen.keys()].some((k) => k.startsWith('wakka:'))).toBe(false);
  });

  it('§4.2 — an order is queued, not immediate, and the LAST one wins', () => {
    const engine = newEngine();
    let issued = 0;
    drive(
      engine,
      (d) => {
        if (issued === 0 && d.actorId === 'tidus') {
          issued = 1;
          return { kind: 'trigger', id: 'pull-back', targets: [] };
        }
        return defend();
      },
      () => issued === 1,
      200,
    );
    // Queued: the ship has NOT moved yet.
    expect(engine.state().flags['airship.order']).toBe('far');
    expect(engine.state().flags['airship.range']).toBe('near');

    // A second, opposite order before Cid acts collapses onto the first — run
    // as a real second `trigger` submission, because a hand-written flag would
    // pin nothing. The pair only counts when Cid has not flown in between, so
    // the loop keeps trying pairs until it gets a clean one.
    let collapsed = false;
    let rangeAtFirstOrder = '';
    let pending = false;
    for (let i = 0; i < 400 && !collapsed; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const owner = d.actorId === 'tidus' || d.actorId === 'rikku';
      const order = engine.state().flags['airship.order'];
      if (owner && pending && order === 'far') {
        engine.submit({ kind: 'trigger', id: 'close-in', targets: [] });
        collapsed = true;
        continue;
      }
      if (owner) {
        rangeAtFirstOrder = String(engine.state().flags['airship.range']);
        engine.submit({ kind: 'trigger', id: 'pull-back', targets: [] });
        pending = engine.state().flags['airship.order'] === 'far';
        continue;
      }
      pending = pending && order === 'far';
      engine.submit(defend());
    }
    expect(collapsed).toBe(true);
    // One order is waiting, and it is the LAST one.
    expect(engine.state().flags['airship.order']).toBe('near');
    // ...and neither order has moved the ship yet.
    expect(engine.state().flags['airship.range']).toBe(rangeAtFirstOrder);
  });

  it('§2.3, §4.6 — exactly three volleys, then one announcement, then silence', () => {
    const engine = newEngine();
    // The party is taken out of danger on purpose: this unit measures Cid's
    // ammunition, and a wipe would end the battle before the rack is empty.
    makeInvincible(engine);
    // Pull back once and then do nothing at all, so every Cid turn is a spare one.
    let pulled = false;
    drive(
      engine,
      (d) => {
        if (!pulled && (d.actorId === 'tidus' || d.actorId === 'rikku')) {
          pulled = true;
          return { kind: 'trigger', id: 'pull-back', targets: [] };
        }
        return defend();
      },
      (e) => e.state().flags['airship.outOfAmmoAnnounced'] === true,
      2000,
    );
    const log = engine.state().log;
    const volleys = log.filter((e) => e.type === 'action-start' && e.actorId === 'cid');
    expect(volleys).toHaveLength(3);
    expect(engine.state().flags['airship.missilesLeft']).toBe(0);
    // Announced once, and never again.
    const announcements = log.filter((e) => e.type === 'message' && e.text === 'Cid is out of missiles');
    expect(announcements).toHaveLength(1);
  });

  it('§2.1 — Cid is never a valid target of anything, on any turn', () => {
    const engine = newEngine();
    makeInvincible(engine);
    let sawAnyRow = false;
    drive(
      engine,
      (d) => {
        for (const c of d.commands) {
          sawAnyRow = true;
          expect(c.validTargets).not.toContain('cid');
        }
        return defend();
      },
      () => false,
      60,
    );
    expect(sawAnyRow).toBe(true);
  });

  it('§2.1 — a living, unkillable Cid does not hold the battle open', () => {
    const engine = newEngine();
    makeInvincible(engine);
    // Evrae down, Cid still flying: `ActorRuntime.nonCombatant` is the only
    // thing standing between this and a battle that can never be won.
    const evrae = engine.state().combatants['evrae'];
    expect(evrae).toBeDefined();
    if (!evrae) return;
    evrae.hp = 0;
    evrae.alive = false;

    // Stepped inline rather than through `drive`, because what is being
    // asserted is the *end* of the battle and the helper's stop predicate reads
    // the same field the assertion does.
    for (let i = 0; i < 10; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'player-input') engine.submit(defend());
    }
    expect(engine.state().result?.outcome).toBe('victory');
    expect(engine.state().combatants['cid']?.alive).toBe(true);
  });

  it('§9.1 — with no Yuna and no aeons there is no Summon row at all, not a disabled one', () => {
    const engine = newEngine();
    let checked = 0;
    drive(
      engine,
      (d) => {
        expect(d.commands.some((c) => c.category === 'summon')).toBe(false);
        expect(d.commands.some((c) => c.command.kind === 'summon')).toBe(false);
        checked++;
        return defend();
      },
      () => checked >= 6,
      120,
    );
    expect(checked).toBeGreaterThanOrEqual(6);
    expect(fahrenheitBuild.aeons).toHaveLength(0);
    expect(fahrenheitBuild.members.some((m) => m.id === 'yuna')).toBe(false);
  });

  it('§4.3 — at FAR exactly magic, Lancet and Wakka reach; everything else says "Out of reach"', () => {
    const engine = newEngine();
    engine.state().flags['airship.range'] = 'far';
    const rows = new Map<string, AvailableCommand>();
    drive(
      engine,
      (d) => {
        engine.state().flags['airship.range'] = 'far';
        for (const c of d.commands) rows.set(`${d.actorId}:${c.label}`, c);
        return defend();
      },
      () => rows.has('wakka:Attack') && rows.has('rikku:Steal') && rows.has('tidus:Cheer'),
      400,
    );

    // Does not reach: ordinary attacks, Steal, offensive items.
    for (const key of ['tidus:Attack', 'rikku:Attack', 'rikku:Steal', 'tidus:Provoke', 'tidus:Delay Attack']) {
      const r = rows.get(key);
      expect(r, key).toBeDefined();
      expect(r?.enabled, key).toBe(false);
      expect(r?.disabledReason, key).toBe('Out of reach');
    }
    const grenade = rows.get('tidus:Grenade');
    expect(grenade?.enabled).toBe(false);
    expect(grenade?.disabledReason).toBe('Out of reach');

    // Reaches: Wakka's blitzball (a character property), and magic.
    expect(rows.get('wakka:Attack')?.enabled).toBe(true);
    expect(rows.get('wakka:Dark Buster')?.enabled).toBe(true);
    expect(rows.get('tidus:Slow')?.enabled).toBe(true);
    expect(rows.get('rikku:Reflect')?.enabled).toBe(true);

    // §4.3's asymmetry, which must not be smoothed: buffs and items still work.
    expect(rows.get('tidus:Cheer')?.enabled).toBe(true);
    expect(rows.get('tidus:Haste')?.enabled).toBe(true);
    expect(rows.get('tidus:Al Bhed Potion')?.enabled).toBe(true);
  });

  it('§4.3 — a Phoenix Down still revives at FAR, and still cannot be thrown at the wyrm', () => {
    // §4.3's asymmetry, in the one place it decides the fight: "Items and Wht
    // Magic are irrelevant to reach **because they target your own party**".
    // Phoenix Down is `single-any` — it doubles as the anti-undead item — so a
    // gate written on the targeting token alone refuses the party's ONLY revive
    // exactly where the chapter's whole tactic tells the player to stand.
    const engine = newEngine(5);
    const st = engine.state();
    st.flags['airship.range'] = 'far';
    const down = st.combatants['tidus'];
    expect(down).toBeDefined();
    if (!down) return;
    down.hp = 0;
    down.alive = false;

    let row: AvailableCommand | undefined;
    drive(
      engine,
      (d) => {
        engine.state().flags['airship.range'] = 'far';
        const c = d.commands.find((r) => r.label === 'Phoenix Down');
        if (c && d.actorId !== 'tidus') row = c;
        return defend();
      },
      () => row !== undefined,
      400,
    );

    expect(row).toBeDefined();
    expect(row?.disabledReason).toBeUndefined();
    expect(row?.enabled).toBe(true);
    // Reaches the corpse on the deck...
    expect(row?.validTargets).toContain('tidus');
    // ...and not the wyrm: throwing one at an undead enemy is `Use` as offence,
    // which §4.3 lists under "Does not reach".
    expect(row?.validTargets).not.toContain('evrae');
  });

  it('§4.3 — at NEAR everything is legal again', () => {
    const engine = newEngine();
    const rows = new Map<string, AvailableCommand>();
    drive(
      engine,
      (d) => {
        for (const c of d.commands) rows.set(`${d.actorId}:${c.label}`, c);
        return defend();
      },
      () => rows.has('rikku:Steal') && rows.has('tidus:Attack'),
      200,
    );
    expect(rows.get('tidus:Attack')?.enabled).toBe(true);
    expect(rows.get('rikku:Steal')?.enabled).toBe(true);
    expect(rows.get('tidus:Grenade')?.enabled).toBe(true);
  });

  it('§4.5 — a charged breath whiffs when the ship has moved away, and the charge clears', () => {
    const engine = newEngine();
    // Let the NEAR cycle reach its Inhale.
    drive(engine, () => defend(), (e) => e.state().flags['airship.breathCharged'] === true, 600);
    expect(engine.state().flags['airship.breathCharged']).toBe(true);

    engine.state().flags['airship.range'] = 'far';
    const before = engine.state().log.length;
    drive(engine, () => defend(), (e) => e.state().flags['airship.breathCharged'] === false, 600);

    const after = engine.state().log.slice(before);
    expect(after.some((e) => e.type === 'action-start' && e.abilityName === 'Out of Breath Range')).toBe(true);
    expect(after.some((e) => e.type === 'action-start' && e.abilityName === 'Poison Breath')).toBe(false);
    expect(engine.state().flags['airship.breathCharged']).toBe(false);
  });

  it('§5.4 — crossing 10,667 fires the self-Haste, and Guided Missiles can do it', () => {
    const engine = newEngine();
    drive(engine, () => defend(), () => false, 20);
    const evrae = engine.state().combatants['evrae'];
    expect(evrae).toBeDefined();
    if (!evrae) return;
    // Park it one missile volley above the threshold and let Cid do the rest.
    evrae.hp = 12_000;
    engine.state().flags['airship.range'] = 'far';
    drive(engine, () => defend(), (e) => e.state().flags['airship.phase'] === 2, 1200);

    expect(engine.state().flags['airship.phase']).toBe(2);
    expect(engine.state().combatants['evrae']?.statuses['haste']).toBeDefined();
    expect(engine.state().log.some((e) => e.type === 'counter' && e.abilityId === 'evrae-haste')).toBe(true);
  });

  it('C-14 — Reflect on Evrae turns the self-Haste into a free party Haste', () => {
    const engine = newEngine();
    drive(engine, () => defend(), () => false, 20);
    const evrae = engine.state().combatants['evrae'];
    expect(evrae).toBeDefined();
    if (!evrae) return;
    evrae.statuses['reflect'] = {
      id: 'reflect',
      turnsRemaining: 254,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    evrae.hp = 12_000;
    engine.state().flags['airship.range'] = 'far';
    drive(engine, () => defend(), (e) => e.state().flags['airship.phase'] === 2, 1200);

    const st = engine.state();
    // Denied: the wyrm did NOT get its own Haste.
    expect(st.combatants['evrae']?.statuses['haste']).toBeUndefined();
    // Converted: a living party member did.
    const hastedParty = [...st.activeIds, ...st.reserveIds]
      .map((id) => st.combatants[id])
      .filter((c) => c?.statuses['haste'] !== undefined);
    expect(hastedParty.length).toBeGreaterThanOrEqual(1);
  });

  it("C-8 — Stone Gaze's Slow goes through a Slowproof resistance byte, and Auto-Haste blocks it", () => {
    const gaze = EVRAE_ABILITIES['evrae-stone-gaze'];
    expect(gaze?.statusEffects.find((s) => s.status === 'slow')?.chance).toBe(255);

    // Both halves are read off a REAL Stone Gaze resolution. The row is
    // `random-enemy`, so the whole active party is prepared the same way and
    // the assertion holds whoever the roll picks.
    const runGaze = (prepare: (c: FFXCombatant) => void): BattleEngine => {
      const engine = newEngine(3);
      makeInvincible(engine);
      const st = engine.state();
      for (const id of st.activeIds) {
        const c = st.combatants[id] as FFXCombatant | undefined;
        if (c) prepare(c);
      }
      drive(
        engine,
        attackEvrae,
        (e) => e.state().log.some((x) => x.type === 'action-start' && x.abilityId === 'evrae-stone-gaze'),
        600,
      );
      expect(
        engine.state().log.some((x) => x.type === 'action-start' && x.abilityId === 'evrae-stone-gaze'),
        'Stone Gaze never fired',
      ).toBe(true);
      return engine;
    };
    const actives = (engine: BattleEngine): FFXCombatant[] =>
      engine
        .state()
        .activeIds.map((id) => engine.state().combatants[id])
        .filter((c): c is FFXCombatant => c !== undefined);

    // Slowproof / Ribbon are a 255 resistance byte; a chance-255 application
    // returns before `rollStatus` ever reads it, so the Slow lands anyway.
    const proofed = runGaze((c) => {
      c.immunities['slow'] = 255;
    });
    expect(actives(proofed).every((c) => c.immunities['slow'] === 255)).toBe(true);
    expect(actives(proofed).some((c) => c.statuses['slow'] !== undefined)).toBe(true);

    // Auto-Haste is a *permanent* Haste, and `applyStatus` refuses to displace
    // one — which is exactly the one thing the wiki says stops this Slow.
    const hasted = runGaze((c) => {
      c.statuses['haste'] = {
        id: 'haste',
        turnsRemaining: 255,
        ticksRemaining: null,
        charges: null,
        stacks: 0,
        permanent: true,
      };
    });
    // The action really resolved its statuses — the Petrify rider landed on
    // somebody — and the Slow landed on nobody.
    expect(actives(hasted).some((c) => c.statuses['petrify'] !== undefined)).toBe(true);
    expect(actives(hasted).some((c) => c.statuses['slow'] !== undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// §9.3 — the game-specific absence tests [AGENTS.md rule 14, critic CHK-021]
// ---------------------------------------------------------------------------

describe('Evrae — FFX only [rule 14]', () => {
  it('no FFX-2 data file carries the airship flags, the trigger ids or the reach gate', async () => {
    const ffx2 = await import('../../../src/data/ffx2/index.ts');
    const serialised = JSON.stringify(
      {
        groups: ffx2.ENEMY_GROUPS_BY_ID ?? {},
        abilities: ffx2.ALL_ABILITIES ?? [],
      },
      (_k, v) => (typeof v === 'function' ? undefined : v),
    );
    expect(serialised).not.toContain('airship');
    expect(serialised).not.toContain('pull-back');
    expect(serialised).not.toContain('close-in');
    expect(serialised).not.toContain('nonCombatant');
    expect(serialised).not.toContain('rangedWeapon');
  });

  it("the 'long-range' ActionFlag keeps its FFX-2 meaning, and FFX-2 still uses it", async () => {
    const ffx2 = await import('../../../src/data/ffx2/index.ts');
    const withFlag = (ffx2.ALL_ABILITIES ?? []).filter((a) => a.flags.includes('long-range'));
    // The flag is one token with two documented readings; FFX-2's is untouched
    // and its rows still carry it.
    expect(withFlag.length).toBeGreaterThan(0);
  });

  it('the reach gate is inert wherever the airship flag is unset — Chapter 1 is unchanged', () => {
    const group = ENEMY_GROUPS_BY_ID['seymour-flux'];
    expect(group).toBeDefined();
    if (!group) return;
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      // Chapter 1's own party, so this is the shipped fixture and not a
      // borrowed one.
      party: gagazetBuild,
      enemies: group,
      triggers: [],
      seed: 7,
      condition: 'normal',
      canEscape: false,
    });
    makeInvincible(engine);
    // No airship state at all, and no row is ever 'Out of reach'.
    expect(engine.state().flags['airship.range']).toBeUndefined();
    let checked = 0;
    drive(
      engine,
      (d) => {
        for (const c of d.commands) expect(c.disabledReason).not.toBe('Out of reach');
        checked++;
        return defend();
      },
      () => checked >= 8,
      200,
    );
    expect(checked).toBeGreaterThanOrEqual(8);
  });
});
