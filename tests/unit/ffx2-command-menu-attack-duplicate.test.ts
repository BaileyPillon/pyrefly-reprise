/**
 * FFX-2 command menu, gate major: "the Attack submenu lists two rows both
 * labelled ATTACK". Reproduced through the **real** engine and the real data
 * registries (`bahamutSetup`/`bevelleParty` — Yuna/Gunner, Rikku/Thief,
 * Paine/Warrior — the shipped default trio, hard rule 3: prove it by running
 * the engine, not by grepping), never a synthetic `AvailableCommand[]`.
 *
 * Root cause: `src/battle/ffx2/targeting.ts`'s `buildCommands()` always pushed
 * the one true Attack row (`ctx.abilities.get('attack')`, `command.kind:
 * 'attack'`, resolved by `execute.ts`/`simulate.ts`/every tactics reader that
 * matches that `kind`) whenever `dressphere.hasAttack`, *and separately*
 * looped the dressphere's own `abilityIds`/`learned` list unfiltered — which,
 * for every standard dressphere `research/ffx2-combat-core.md` §3.1-3.13
 * gives its own `x2-<name>-attack` id, pushed that **same category** a second
 * time as `{kind: 'ability', id: 'x2-gunner-attack', …}`, with its own
 * (different) targeting/flags/message. `CommandMenu.groupRows()` then saw two
 * `category: 'attack'` commands and rendered an "Attack" submenu of two rows
 * both labelled ATTACK — `src/ui/ffx2/CommandMenu.ts` only ever draws what
 * `buildCommands()` hands it, so the fix belongs in `targeting.ts`, not the
 * menu.
 *
 * The fix drops an attack-category entry from the *offered abilities* loop
 * only, keeping the top-level generic row exactly as it always was
 * (`command.kind: 'attack'`, unchanged). The other candidate fix — making the
 * dressphere's own `x2-<name>-attack` the canonical Attack instead — was
 * tried and reverted: it changes `command.kind` from `'attack'` to
 * `'ability'`, which broke `tests/unit/strategy-ffx2-vegnagun-shuyin
 * .test.ts`'s node-targeting harness (and would silently change what every
 * `command.kind === 'attack'` reader in `src/engine/tactics/**` — a
 * different agent's files — sees). That is a wider retarget than "the ability
 * list", which is what this track's brief authorized.
 *
 * Case: FFX-2 only (FFX's command menu, `src/ui/ffx/CommandMenu.ts`, has no
 * dressphere concept). Both games would only apply if the underlying bug
 * were shared plumbing; it is not — the duplication is specific to how FFX-2
 * dresspheres carry their own ability tables (AGENTS.md rule 14).
 * `research/ffx2-combat-core.md` §3.4-3.6 (Songstress/White Mage/Black Mage
 * have no Attack at all) and the berserk/itchy "Attack only" rule (§2.8) are
 * exercised below too, unchanged by this fix.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { bahamutSetup, aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { registerBattleContent, ffx2EngineOptions } from '../../src/app/screens/BattleScreenContent.ts';
import { buildCommands } from '../../src/battle/ffx2/targeting.ts';
import { applyStatus } from '../../src/battle/ffx2/index.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import type { AvailableCommand, Decision } from '../../src/battle/common/types.ts';

// The engine's own built-in `defaultDresspheres` (`src/battle/ffx2/dresspheres.ts`)
// is deliberately empty-`abilityIds` scaffolding — "the command menu prefers
// the girl's own `abilitiesLearned` anyway. Inject a `DressphereRegistry` to
// supply them." The real game never runs on that scaffold: `App` calls
// `registerBattleContent()` once at boot and builds every `FFX2Engine` with
// `ffx2EngineOptions()` (`BattleScreenWiring.ts`), which is the *real*
// `src/data/ffx2/dresspheres/*.ts` table through `adapters.ts`. A test that
// skipped this and used the bare engine would never see the bug at all —
// it did not, on the first draft of this file.
beforeAll(async () => {
  await registerBattleContent();
});

/** Drive the real engine to the first `player-input` decision for `actorId`. */
function decisionFor(actorId: string, seed = 1): AvailableCommand[] {
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.init(bahamutSetup(seed));
  for (let i = 0; i < 200; i++) {
    const decision: Decision = engine.nextDecision();
    if (decision.kind === 'battle-over') throw new Error('battle ended before ' + actorId + ' got a turn');
    if (decision.kind === 'resolved') continue;
    if (decision.kind === 'waiting') {
      engine.tick(decision.nextEventMs);
      continue;
    }
    if (decision.actorId === actorId) return decision.commands;
    // Get everyone else out of the way without caring what they do.
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error(actorId + ' never got a turn in 200 decisions');
}

function attackRows(commands: AvailableCommand[]): AvailableCommand[] {
  return commands.filter((c) => c.category === 'attack');
}

describe('the FFX-2 command menu offers exactly one Attack per dressphere', () => {
  it('Yuna (Gunner, her default) gets one Attack, not two', () => {
    const rows = attackRows(decisionFor('yuna'));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe('Attack');
    // The long-standing top-level command survives unchanged — every
    // `command.kind === 'attack'` reader elsewhere in the engine keeps
    // seeing exactly what it always saw. It is the redundant *second* row
    // (`x2-gunner-attack`, `kind: 'ability'`) that is gone.
    expect(rows[0]!.command).toMatchObject({ kind: 'attack' });
  });

  it('Rikku (Thief, her default) gets one Attack, not two', () => {
    const rows = attackRows(decisionFor('rikku'));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.command).toMatchObject({ kind: 'attack' });
  });

  it('Paine (Warrior, her default) gets one Attack, not two', () => {
    const rows = attackRows(decisionFor('paine'));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.command).toMatchObject({ kind: 'attack' });
  });
});

describe('the fix does not touch berserk, itchy or a dressphere with no Attack ability yet', () => {
  /** A real Gunner unit, built directly (`buildCommands` is the function under test). */
  function gunner(overrides: Partial<Record<'berserk' | 'itchy', boolean>> = {}) {
    const unit = aiUnit('yuna', 'party');
    unit.dresspheres = {
      current: 'gunner',
      owned: ['gunner'],
      garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    };
    if (overrides.berserk) applyStatus(unit, { status: 'berserk', chance: 255, duration: 3 });
    if (overrides.itchy) applyStatus(unit, { status: 'itchy', chance: 255, duration: 3 });
    return unit;
  }

  it('a berserked Gunner still gets exactly one Attack (the offered-abilities loop is skipped either way)', () => {
    const opts = ffx2EngineOptions();
    const unit = gunner({ berserk: true });
    const commands = buildCommands(unit, {
      units: [unit],
      abilities: chainRegistries(opts.abilities, defaultAbilities),
      dresspheres: opts.dresspheres!,
      canEscape: false,
    });
    const rows = attackRows(commands);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.command).toMatchObject({ kind: 'attack' });
  });

  it('an itchy Gunner gets no Attack at all (§2.8: Itchy leaves only spherechange/Escape)', () => {
    const opts = ffx2EngineOptions();
    const unit = gunner({ itchy: true });
    const commands = buildCommands(unit, {
      units: [unit],
      abilities: chainRegistries(opts.abilities, defaultAbilities),
      dresspheres: opts.dresspheres!,
      canEscape: false,
    });
    expect(attackRows(commands)).toHaveLength(0);
  });

  it('Yuna in White Mage (no Attack command, §3.5) still gets none — this fix never adds one', () => {
    const unit = aiUnit('yuna', 'party');
    const opts = ffx2EngineOptions();
    unit.dresspheres = {
      current: 'white-mage',
      owned: ['white-mage'],
      garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    };
    const commands = buildCommands(unit, {
      units: [unit],
      abilities: chainRegistries(opts.abilities, defaultAbilities),
      dresspheres: opts.dresspheres!,
      canEscape: false,
    });
    expect(attackRows(commands)).toHaveLength(0);
  });

  it('a non-attack ability from the offered list is unaffected (only category "attack" is filtered)', () => {
    const opts = ffx2EngineOptions();
    const unit = gunner();
    const commands = buildCommands(unit, {
      units: [unit],
      abilities: chainRegistries(opts.abilities, defaultAbilities),
      dresspheres: opts.dresspheres!,
      canEscape: false,
    });
    const labels = commands.map((c) => c.label);
    expect(labels).toContain('Trigger Happy');
    expect(labels).toContain('Potshot');
  });
});
