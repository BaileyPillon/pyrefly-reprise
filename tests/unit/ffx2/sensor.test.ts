/**
 * FFX-2 Sensor / Scan — `src/battle/ffx2/sensor.ts`.
 *
 * The defect this suite pins down: nothing in the FFX-2 engine emitted a
 * `'sensor'` {@link BattleEvent}. `x2-gun-mage-scan` resolved as an ordinary
 * zero-power action, so `src/ui/ffx2/BossGauges.ts` — which prints a `SCAN`
 * hint instead of HP numerals until it sees that event — could never leave its
 * SCAN state in real play.
 *
 * Numbers and rules cited here:
 * - Scan "reveals target HP, MP, elemental affinities, status resistances"
 *   [research/ffx2-combat-core.md §3.7, Gun Mage support table].
 * - Libra and Ma'at's Feather are "Scan-equivalent" / "Libra / Scan equivalent"
 *   [research/ffx2-combat-core.md §2.9.2].
 * - Scan Lv. 2 / Lv. 3 are support upgrades, not actions [§3.7].
 * - `immune-to-scan` = "Scan fails"; `immune-to-sensor` = "Sensor returns
 *   '- - -'"; `flags.hideHpBar` = "parts whose HP is a secret"
 *   [src/battle/common/types.ts, `ImmunityFlag` / `CombatantFlags`].
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { revealTarget, sensorKind, weaknessesOf } from '../../../src/battle/ffx2/sensor.ts';
import { aiUnit, bevelleParty, enemy, group } from '../../../src/battle/ffx2/fixtures.ts';
import type { AbilityRegistry, EventDraft, Ffx2Unit } from '../../../src/battle/ffx2/index.ts';
import type {
  AbilityDef,
  BattleEvent,
  BattleSetup,
  EnemyDef,
} from '../../../src/battle/common/types.ts';
import gunMageAbilities from '../../../src/data/ffx2/abilities/gun-mage.ts';

const SCAN_ID = 'x2-gun-mage-scan';

/** The real data table, injected the way `BattleScreen` injects it. */
const dataAbilities: AbilityRegistry = {
  get: (id) => gunMageAbilities.find((a) => a.id === id),
};

function abilityById(id: string): AbilityDef {
  const found = gunMageAbilities.find((a) => a.id === id);
  if (!found) throw new Error(`fixture drift: ${id} is gone from the Gun Mage table`);
  return found;
}

/** A scannable boss: a weakness to find, a sensor line to print. */
function scannable(extra: Partial<EnemyDef> = {}): EnemyDef {
  return enemy(
    'boss',
    'Boss',
    'none',
    { hp: 5000, maxHp: 5000, mp: 400, maxMp: 400, agi: 1 },
    {
      sensorText: 'Kill the arms before you look it in the face.',
      scanText: 'Weak to fire. Its armour is a lie.',
      affinities: { fire: 'weak', gravity: 'immune' },
      ...extra,
    },
  );
}

function setupWith(e: EnemyDef, seed = 1): BattleSetup {
  return {
    game: 'ffx2',
    party: bevelleParty(24, 'first-steps'),
    enemies: group('scan-fixture', [e]),
    triggers: [],
    seed,
    condition: 'scripted',
    canEscape: false,
  };
}

/** Run the engine until a girl may act, collecting everything on the way. */
function driveToInput(engine: FFX2Engine, log: BattleEvent[]): string {
  for (let i = 0; i < 400; i++) {
    const decision = engine.nextDecision();
    if (decision.kind === 'player-input') return decision.actorId;
    if (decision.kind === 'resolved') {
      log.push(...decision.events);
      continue;
    }
    if (decision.kind === 'waiting') {
      log.push(...engine.tick(decision.nextEventMs));
      continue;
    }
    break;
  }
  throw new Error('no player turn arrived');
}

/** Collect the drafts one `revealTarget` call produces. */
function reveal(target: Ffx2Unit, kind: 'scan' | 'sensor'): { drafts: EventDraft[]; ok: boolean } {
  const drafts: EventDraft[] = [];
  const ok = revealTarget((e) => drafts.push(e), 'yuna', target, kind);
  return { drafts, ok };
}

describe('recognising a reveal in the data table', () => {
  it('recognises the real `x2-gun-mage-scan` with no data change', () => {
    expect(sensorKind(abilityById(SCAN_ID))).toBe('scan');
  });

  it('leaves ordinary Gun Mage actions alone', () => {
    for (const id of ['x2-gun-mage-attack', 'x2-gun-mage-1000-needles', 'x2-gun-mage-mighty-guard']) {
      expect(sensorKind(abilityById(id))).toBeNull();
    }
  });

  it('does not treat a support upgrade as an action', () => {
    // Fiend Hunter Lv. 2 is the shape every Gun Mage support upgrade has in
    // this data: `targeting: 'self'` plus `extra.passive`. Scan Lv. 2 / Lv. 3
    // [§3.7] land here when they are transcribed, and must not reveal anything.
    expect(sensorKind(abilityById('x2-gun-mage-fiend-hunter-lv2'))).toBeNull();

    const scanLv2: AbilityDef = {
      ...abilityById('x2-gun-mage-fiend-hunter-lv2'),
      id: 'x2-gun-mage-scan-lv2',
      name: 'Scan Lv. 2',
    };
    expect(sensorKind(scanLv2)).toBeNull();
  });

  it('recognises the special-dressphere equivalents by name [§2.9.2]', () => {
    const base = abilityById(SCAN_ID);
    expect(sensorKind({ ...base, id: 'x2-floral-fallal-libra', name: 'Libra' })).toBe('scan');
    expect(sensorKind({ ...base, id: 'x2-full-throttle-maats-feather', name: "Ma'at's Feather" })).toBe('scan');
    expect(sensorKind({ ...base, id: 'x2-machina-maw-scan', name: 'Scan' })).toBe('scan');
  });

  it('honours an explicit `extra` marker ahead of any name match', () => {
    const base = abilityById(SCAN_ID);
    expect(sensorKind({ ...base, id: 'x2-thing', name: 'Thing', extra: { reveals: 'sensor' } })).toBe('sensor');
    expect(sensorKind({ ...base, id: 'x2-thing', name: 'Thing', extra: { scan: true } })).toBe('scan');
  });
});

describe('Scan through the whole engine', () => {
  it('emits one `sensor` event per target carrying HP, MP and weaknesses', () => {
    const engine = new FFX2Engine({ abilities: dataAbilities, minigames: false });
    engine.init(setupWith(scannable()));
    const log: BattleEvent[] = [];
    const actorId = driveToInput(engine, log);

    const events = engine.submit({ kind: 'ability', id: SCAN_ID, targets: ['boss'] });
    const sensed = events.filter((e) => e.type === 'sensor');
    expect(sensed).toHaveLength(1);

    const event = sensed[0];
    if (event?.type !== 'sensor') throw new Error('unreachable');
    expect(event.targetId).toBe('boss');
    expect(event.full).toBe(true);
    expect(event.text).toBe('Weak to fire. Its armour is a lie.');
    expect(event.hp).toBe(5000);
    expect(event.maxHp).toBe(5000);
    expect(event.mp).toBe(400);
    expect(event.maxMp).toBe(400);
    expect(event.weaknesses).toEqual(['fire']);
    expect(actorId).toBeTruthy();
  });

  it('is a pure information action: no chain, no damage, no miss', () => {
    const engine = new FFX2Engine({ abilities: dataAbilities, minigames: false });
    engine.init(setupWith(scannable()));
    driveToInput(engine, []);
    const events = engine.submit({ kind: 'ability', id: SCAN_ID, targets: ['boss'] });
    const kinds = new Set(events.map((e) => e.type));
    expect(kinds.has('damage')).toBe(false);
    expect(kinds.has('chain')).toBe(false);
    expect(kinds.has('miss')).toBe(false);
    // It still costs the turn.
    expect(kinds.has('action-end')).toBe(true);
  });

  it('marks the target revealed in `state()` for the rest of the battle', () => {
    const engine = new FFX2Engine({ abilities: dataAbilities, minigames: false });
    engine.init(setupWith(scannable()));
    driveToInput(engine, []);

    expect(engine.state().combatants['boss']?.revealed).toBeUndefined();
    engine.submit({ kind: 'ability', id: SCAN_ID, targets: ['boss'] });
    expect(engine.state().combatants['boss']?.revealed).toBe(true);

    // Keep playing: the flag survives further turns, damage and gauge ticks,
    // so the boss strip never falls back to its `SCAN` hint mid-fight.
    for (let i = 0; i < 12; i++) {
      const decision = engine.nextDecision();
      if (decision.kind === 'battle-over') break;
      if (decision.kind === 'waiting') {
        engine.tick(decision.nextEventMs);
        continue;
      }
      if (decision.kind === 'player-input') {
        const attack = decision.commands.find((c) => c.command.kind === 'attack');
        const targetId = attack?.validTargets[0];
        engine.submit(
          attack && targetId ? { kind: 'attack', targets: [targetId] } : { kind: 'defend', targets: [] },
        );
      }
    }
    expect(engine.state().combatants['boss']?.revealed).toBe(true);
    expect(engine.state().log.some((e) => e.type === 'sensor')).toBe(true);
  });

  it('reveals every target of a party-wide reveal', () => {
    const wide: AbilityDef = { ...abilityById(SCAN_ID), targeting: 'all-enemies' };
    const registry: AbilityRegistry = { get: (id) => (id === SCAN_ID ? wide : undefined) };
    const engine = new FFX2Engine({ abilities: registry, minigames: false });
    const left = { ...scannable(), id: 'left', name: 'Left', spriteKey: 'left', slot: 0 };
    const right = { ...scannable(), id: 'right', name: 'Right', spriteKey: 'right', slot: 1 };
    engine.init({
      game: 'ffx2',
      party: bevelleParty(24, 'first-steps'),
      enemies: group('scan-pair', [left, right]),
      triggers: [],
      seed: 3,
      condition: 'scripted',
      canEscape: false,
    });
    driveToInput(engine, []);
    const events = engine.submit({ kind: 'ability', id: SCAN_ID, targets: ['left'] });
    expect(events.filter((e) => e.type === 'sensor').map((e) => (e.type === 'sensor' ? e.targetId : '')))
      .toEqual(['left', 'right']);
    expect(engine.state().combatants['left']?.revealed).toBe(true);
    expect(engine.state().combatants['right']?.revealed).toBe(true);
  });
});

describe('enemies the fight keeps secret', () => {
  function target(patch: Partial<Ffx2Unit>): Ffx2Unit {
    const unit = aiUnit('boss', 'enemy', 5000);
    unit.mp = 400;
    unit.sensorText = 'It cannot be reasoned with.';
    unit.scanText = 'Nothing here is true.';
    unit.affinities = { fire: 'weak', holy: 'absorb' };
    return Object.assign(unit, patch);
  }

  it('`immune-to-scan` fails the Scan outright and reports it as immune', () => {
    const boss = target({ immunityFlags: ['boss', 'immune-to-scan'] });
    const { drafts, ok } = reveal(boss, 'scan');
    expect(ok).toBe(false);
    expect(boss.revealed).toBeUndefined();
    expect(drafts).toEqual([{ type: 'miss', targetId: 'boss', sourceId: 'yuna', reason: 'immune' }]);
  });

  it('`immune-to-sensor` still announces the target, with no numerals', () => {
    const boss = target({ immunityFlags: ['boss', 'immune-to-sensor'] });
    const { drafts, ok } = reveal(boss, 'scan');
    expect(ok).toBe(false);
    expect(boss.revealed).toBeUndefined();
    expect(drafts).toHaveLength(1);
    const event = drafts[0];
    if (event?.type !== 'sensor') throw new Error('expected a sensor draft');
    expect(event.text).toBe('Nothing here is true.');
    expect(event.hp).toBeUndefined();
    expect(event.maxHp).toBeUndefined();
    expect(event.weaknesses).toBeUndefined();
  });

  it('a part whose HP is a secret (`hideHpBar`) keeps its numerals', () => {
    const part = target({ flags: { isPart: true, hideHpBar: true } });
    const { drafts, ok } = reveal(part, 'scan');
    expect(ok).toBe(false);
    expect(part.revealed).toBeUndefined();
    const event = drafts[0];
    if (event?.type !== 'sensor') throw new Error('expected a sensor draft');
    expect(event.hp).toBeUndefined();
  });

  it('the one-line bar prints `sensorText`, the full panel prints `scanText`', () => {
    const bar = reveal(target({}), 'sensor').drafts[0];
    if (bar?.type !== 'sensor') throw new Error('expected a sensor draft');
    expect(bar.full).toBe(false);
    expect(bar.text).toBe('It cannot be reasoned with.');

    const panel = reveal(target({}), 'scan').drafts[0];
    if (panel?.type !== 'sensor') throw new Error('expected a sensor draft');
    expect(panel.full).toBe(true);
    expect(panel.text).toBe('Nothing here is true.');
  });

  it('a one-line Sensor bar is not a Scan, so `immune-to-scan` does not block it', () => {
    const boss = target({ immunityFlags: ['boss', 'immune-to-scan'] });
    const { ok } = reveal(boss, 'sensor');
    expect(ok).toBe(true);
    expect(boss.revealed).toBe(true);
  });
});

describe('weaknesses', () => {
  it('reports only `weak` elements, in HUD order, and never `none`', () => {
    const unit = aiUnit('boss', 'enemy');
    unit.affinities = { fire: 'weak', ice: 'resist', lightning: 'weak', holy: 'absorb', none: 'weak' };
    expect(weaknessesOf(unit)).toEqual(['fire', 'lightning']);
  });

  it('is an empty array, not undefined, for an enemy with no weakness', () => {
    const unit = aiUnit('boss', 'enemy');
    unit.affinities = { gravity: 'immune' };
    expect(weaknessesOf(unit)).toEqual([]);
  });
});
