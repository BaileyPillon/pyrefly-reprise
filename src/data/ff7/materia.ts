/**
 * The Materia owned at the Guard Scorpion: Lightning and Ice (on Cloud from the
 * start) and Restore (picked up on the walkway just before the boss)
 * [core §8.2, verified: 2 sources each].
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Stat changes and AP
 * [core §8.3, single source: Fergusson PM §2.1]; spells [core §8.4, single source:
 * Fergusson PM §2.6]. The fight gives 10 AP, so none levels up in it [core §8.3, derived].
 */

import type { Ff7MateriaDef } from '../../battle/ff7/defs.ts';
import type { Ff7MateriaId, Ff7SpellId } from './ids.ts';

/** Each of the three: HP -2%, MP +2%, Str -1, Mag +1 [core §8.3, single source: Fergusson PM §2.1]. */
const MAGIC_STATS = { hpPct: -2, mpPct: 2, stat: { str: -1, mag: 1 } } as const;

function magic(id: Ff7MateriaId, name: string, spell: Ff7SpellId, apToLevel2: number): Ff7MateriaDef {
  return {
    id,
    name,
    kind: 'magic',
    spells: [spell],
    hpPct: MAGIC_STATS.hpPct,
    mpPct: MAGIC_STATS.mpPct,
    stat: { ...MAGIC_STATS.stat },
    apToLevel2,
    cite: `core §8.3, §8.4 [single source: Fergusson PM §2.1, §2.6]; owned at the fight core §8.2 [verified: 2 sources]`,
  };
}

/** Level 2 needs 2,000 AP (Bolt2, Ice2) or 2,500 AP (Cure2) [core §8.3, single source]. */
export const FF7_MATERIA: Readonly<Record<Ff7MateriaId, Ff7MateriaDef>> = {
  lightning: magic('lightning', 'Lightning', 'bolt', 2000),
  ice: magic('ice', 'Ice', 'ice', 2000),
  restore: magic('restore', 'Restore', 'cure', 2500),
};
