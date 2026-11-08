/**
 * The Materia owned at the Guard Scorpion: Lightning and Ice (on Cloud from the
 * start) and Restore (picked up on the walkway just before the boss)
 * [core §8.2, verified: 2 sources each]; and, for chapter 44 (Jenova LIFE), Fire, Earth and Barrier with the
 * levels all six reach from banked AP.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Stat changes and AP
 * [core §8.3, single source: Fergusson PM §2.1]; spells [core §8.4, single source:
 * Fergusson PM §2.6]. The Guard Scorpion fight gives 10 AP, so none levels up in it [core §8.3, derived]; its
 * three Materia carry no AP, so they stay at level 1 (`levels` only matters once an orb has `ap`).
 *
 * The level tables are Lifestream Encore's `party.md` §3.5 (Fergusson PM §2.1 read secondhand): Fire, Ice and
 * Lightning 0 / 2,000 / 18,000 AP (x, x2, x3); Earth 0 / 6,000 / 22,000 (Quake, 2, 3); Restore 0 / 2,500 /
 * 17,000 (Cure, Cure2, Regen); Barrier 0 / 5,000 (Barrier, MBarrier). Level 3 of Barrier is Reflect and Level 4
 * of Restore Cure3: neither is carried (chapter 44's picks J6 and the preset), so neither level is built.
 * `[single source: LE party §3.5]`; the stat deltas are by tier (light magic here; Barrier is medium magic).
 */

import type { Ff7MateriaDef } from '../../battle/ff7/defs.ts';
import type { Ff7MateriaId, Ff7SpellId } from './ids.ts';

/** Each light magic Materia: HP -2%, MP +2%, Str -1, Mag +1 [core §8.3, single source: Fergusson PM §2.1]. */
const MAGIC_STATS = { hpPct: -2, mpPct: 2, stat: { str: -1, mag: 1 } } as const;

/** The spells at each level, cumulative, lowest level first, with the AP that reaches it. */
type Tiers = ReadonlyArray<readonly [ap: number, spells: readonly Ff7SpellId[]]>;

function levelsOf(tiers: Tiers): Ff7MateriaDef['levels'] {
  return tiers.map(([ap, spells]) => ({ ap, spells }));
}

function magic(id: Ff7MateriaId, name: string, tiers: Tiers): Ff7MateriaDef {
  return {
    id,
    name,
    kind: 'magic',
    spells: [...(tiers[0]?.[1] ?? [])],
    hpPct: MAGIC_STATS.hpPct,
    mpPct: MAGIC_STATS.mpPct,
    stat: { ...MAGIC_STATS.stat },
    apToLevel2: tiers[1]?.[0] ?? 0,
    levels: levelsOf(tiers),
    cite: `core §8.3, §8.4 [single source: Fergusson PM §2.1, §2.6]; levels LE party §3.5 [single source]; owned at the Guard Scorpion core §8.2 [verified: 2 sources]`,
  };
}

/** Level 2 needs 2,000 AP (Bolt2, Ice2) or 2,500 AP (Cure2) [core §8.3, single source]; Level 3 18,000 (x3) or 17,000 (Regen) [LE party §3.5]. */
export const FF7_MATERIA: Readonly<Record<Ff7MateriaId, Ff7MateriaDef>> = {
  lightning: magic('lightning', 'Lightning', [[0, ['bolt']], [2000, ['bolt', 'bolt2']], [18000, ['bolt', 'bolt2', 'bolt3']]]),
  ice: magic('ice', 'Ice', [[0, ['ice']], [2000, ['ice', 'ice2']], [18000, ['ice', 'ice2', 'ice3']]]),
  restore: magic('restore', 'Restore', [[0, ['cure']], [2500, ['cure', 'cure2']], [17000, ['cure', 'cure2', 'regen']]]),
  fire: magic('fire', 'Fire', [[0, ['fire']], [2000, ['fire', 'fire2']], [18000, ['fire', 'fire2', 'fire3']]]),
  earth: magic('earth', 'Earth', [[0, ['quake']], [6000, ['quake', 'quake2']], [22000, ['quake', 'quake2', 'quake3']]]),
  // Barrier is medium magic: HP -5%, MP +5%, Str -2, Vit -1, Mag +2, Spr +1 [LE party §3.5, single source].
  barrier: {
    id: 'barrier',
    name: 'Barrier',
    kind: 'magic',
    spells: ['barrier'],
    hpPct: -5,
    mpPct: 5,
    stat: { str: -2, vit: -1, mag: 2, spr: 1 },
    apToLevel2: 5000,
    levels: levelsOf([[0, ['barrier']], [5000, ['barrier', 'mbarrier']]]),
    cite: 'LE party §3.5 [single source: Fergusson PM §2.1]; Level 3 (Reflect) is not carried, jl §9 pick J6',
  },
};
