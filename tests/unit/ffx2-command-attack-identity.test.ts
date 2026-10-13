/**
 * Critic round 04 PR-0024: the duplicate-Attack fix filtered by **category**,
 * so it would have dropped every attack-category ability a dressphere owns.
 *
 * Round 03's gate major was "the Attack submenu lists two rows both labelled
 * ATTACK" — the generic `{kind:'attack'}` row plus the dressphere's own
 * `x2-<sphere>-attack` record pushed a second time out of the offered-abilities
 * loop. The fix written for it was `if (ability.category === 'attack') continue`,
 * which removes *any* attack-category entry from that loop. Audited over the
 * shipped tables (`src/data/ffx2/abilities/**`): that is seven abilities wider
 * than the duplicate on Trainer alone — Kogoro Blaze, Doom Kogoro, Pound!,
 * Sneaky Ghiki, Ghiki Gouge, Bully Ghiki, Maulwings! — plus Lady Luck's
 * Tantalize, and it would take Floral Fallal's two Stigmas and Machina Maw's
 * Howitzer and Blind Shell the day the specials are wired to this loop. Trainer
 * ships no `x2-trainer-attack` at all, so it never had a duplicate to fix.
 *
 * The repair is one line: skip the entry only when it **is** this dressphere's
 * own generic attack, by identity (`x2-<sphereId>-attack`) rather than by
 * category.
 *
 * Player impact today is nil — no shipped chapter offers Trainer or Lady Luck —
 * which is why this is polish and not a blocker. It is still a real defect:
 * the menu would be wrong the moment those dresspheres are offered.
 *
 * ## Which game
 *
 * **FFX-2 only.** Dresspheres, `buildCommands` and this whole menu path belong
 * to the ATB engine; FFX's command menu (`src/battle/ffx/commands.ts`) has no
 * dressphere concept and never had this row, and the last test asserts the FFX
 * side has no `x2-*-attack` record and no such filter
 * [AGENTS.md rule 14, `critic/CHECKS.md` CHK-021].
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { registerBattleContent, ffx2EngineOptions } from '../../src/app/screens/BattleScreenContent.ts';
import { buildCommands } from '../../src/battle/ffx2/menu.ts';
import { gameIdOf } from '../../src/battle/ffx2/adapt/game-ids.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';

beforeAll(async () => {
  await registerBattleContent();
});

/** Every dressphere the game actually ships, straight off the data layer. */
const SHIPPED = Object.values(ffx2data.STANDARD_DRESSPHERES);

/** Build the real menu for one girl wearing one dressphere. */
function menuFor(sphereId: string, girl = 'yuna'): AvailableCommand[] {
  const opts = ffx2EngineOptions();
  const unit = aiUnit(girl, 'party');
  unit.dresspheres = {
    current: sphereId,
    owned: [sphereId],
    garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] },
    abilitiesLearned: {},
  };
  return buildCommands(unit, {
    units: [unit],
    abilities: chainRegistries(opts.abilities, defaultAbilities),
    dresspheres: opts.dresspheres!,
    canEscape: false,
  });
}

/**
 * The ability ids a dressphere offers one girl, as the data layer lists them. Two things are not rows of a girl's menu (re-parity RC7 lane X2-B, the
 * checked note FFX2-G02 sections 2.2 and 3.5): a passive auto-ability (the game's id category 8: Darkproof, Trigger Happy Lv. 2, Magic Counter ...) is not a
 * command, and the Trainer's and the Mascot's pet and borrowed moves are one girl's each (the game gives every girl her own Trainer).
 */
function offeredIds(sphereId: string, girl = 'yuna'): string[] {
  const sphere = ffx2EngineOptions().dresspheres!.get(sphereId);
  const scoped = new Map<string, string | undefined>(
    (ffx2data.STANDARD_DRESSPHERES[sphereId as keyof typeof ffx2data.STANDARD_DRESSPHERES]?.abilities ?? []).map((e) => [e.abilityId, e.character]),
  );
  return (sphere?.abilityIds ?? []).filter((id) => {
    const game = gameIdOf(id);
    if (game !== undefined && game >> 12 === 8) return false;
    const owner = scoped.get(id);
    return owner === undefined || owner === girl;
  });
}

describe('every shipped dressphere offers exactly one generic Attack', () => {
  it.each(SHIPPED.map((d) => [d.id as string]))('%s', (sphereId) => {
    const rows = menuFor(sphereId);
    const generic = rows.filter((c) => c.command.kind === 'attack');
    const hasAttack = ffx2EngineOptions().dresspheres!.get(sphereId)?.hasAttack ?? true;

    // Songstress, White Mage and Black Mage have no Attack command at all
    // (`research/ffx2-combat-core.md` §3.4-3.6); everyone else has exactly one.
    expect(generic).toHaveLength(hasAttack ? 1 : 0);
    for (const row of generic) expect(row.label).toBe('Attack');

    // And the dressphere's own `x2-<sphere>-attack` record is never offered a
    // second time as an ability row — that was round 03's duplicate.
    const dupes = rows.filter(
      (c) => c.command.kind === 'ability' && c.command.id === `x2-${sphereId}-attack`,
    );
    expect(dupes).toEqual([]);
  });
});

/** The two dances that need a key item the engine does not model: the game lists them only for a girl who holds the item (FFX2-G02 section 2.2). */
const KEY_ITEM_ONLY = new Set(['x2-songstress-mp-mambo', 'x2-songstress-magical-masque']);

describe('no other attack-category ability is dropped (PR-0024)', () => {
  it.each(SHIPPED.map((d) => [d.id as string]))('%s keeps its whole kit', (sphereId) => {
    // every command of the table is offered to the girl it belongs to; the Trainer and the Mascot are checked for each of the three
    for (const girl of ['yuna', 'rikku', 'paine']) {
      const rows = menuFor(sphereId, girl);
      const offeredAsAbility = new Set(
        rows.filter((c) => c.command.kind === 'ability').map((c) => (c.command as { id: string }).id),
      );
      const missing = offeredIds(sphereId, girl).filter(
        (id) => id !== `x2-${sphereId}-attack` && !offeredAsAbility.has(id) && !KEY_ITEM_ONLY.has(id),
      );
      expect(missing, `${sphereId} lost rows from its ability table for ${girl}`).toEqual([]);
    }
  });

  // The two the critic named by name, so a regression reads as itself.
  it("Trainer keeps the whole pet kit it never had a duplicate for (each girl her own: Kogoro Yuna's, Ghiki Rikku's, Flurry Paine's)", () => {
    const kits: Array<[string, string[]]> = [
      ['yuna', ['Kogoro Blaze', 'Doom Kogoro', 'Pound!']],
      ['rikku', ['Sneaky Ghiki', 'Ghiki Gouge', 'Bully Ghiki']],
      ['paine', ['Maulwings!']],
    ];
    for (const [girl, names] of kits) {
      const labels = menuFor('trainer', girl).map((c) => c.label);
      for (const name of names) expect(labels, `Trainer lost ${name} for ${girl}`).toContain(name);
    }
    // the game gives every girl her own Trainer: Yuna's menu has no Ghiki and Rikku's no Kogoro
    expect(menuFor('trainer', 'yuna').map((c) => c.label)).not.toContain('Sneaky Ghiki');
    expect(menuFor('trainer', 'rikku').map((c) => c.label)).not.toContain('Kogoro Blaze');
    // Trainer ships no generic `x2-trainer-attack` record at all.
    expect(offeredIds('trainer')).not.toContain('x2-trainer-attack');
  });

  it('Lady Luck keeps Tantalize beside its one Attack', () => {
    const rows = menuFor('lady-luck');
    expect(rows.map((c) => c.label)).toContain('Tantalize');
    expect(rows.filter((c) => c.command.kind === 'attack')).toHaveLength(1);
  });
});

describe('the filter is by identity, not by category [AGENTS.md hard rule 3]', () => {
  it('menu.ts no longer discards a whole category', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../src/battle/ffx2/menu.ts', import.meta.url)),
      'utf8',
    );
    expect(source).not.toMatch(/if \(ability\.category === 'attack'\) continue;/);
    expect(source).toContain('`x2-${sphereId}-attack`');
  });

  it('FFX has no dressphere attack record and no such filter — the other game is untouched', () => {
    const ffx = readFileSync(
      fileURLToPath(new URL('../../src/battle/ffx/commands.ts', import.meta.url)),
      'utf8',
    );
    expect(ffx).not.toContain('x2-');
    expect(ffx).not.toContain('dressphere');
  });
});
