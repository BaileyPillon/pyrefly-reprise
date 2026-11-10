/**
 * **The hidden FFX chapters' enemy data, as one barrel** for the data index (`../index.ts` was at 399 of the house 400 lines, so a second hidden chapter could not add its three lines): the rows and the formations of
 * the hidden Biran and Yenke chapter (2026-10-14) and of the hidden Mirror Aeons chapter (2026-10-15). A further hidden FFX chapter joins here, not in the index. FFX only; shared plumbing (both), inert for every other chapter.
 */

import type { AbilityDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { BIRAN_YENKE_ABILITIES, BIRAN_YENKE_GROUPS } from './biran-yenke.ts';
import { DARK_AEONS_ABILITIES, DARK_AEONS_GROUPS } from './dark-aeons-groups.ts';
import { DARK_SIX_ABILITIES, DARK_SIX_GROUPS } from './dark-aeons-six-groups.ts'; // the hidden Dark Aeons chapter (2026-11-06): the six other Dark Aeons
import { SPECTRAL_KEEPER_ABILITIES, spectralKeeperGroup } from './spectral-keeper.ts'; // the hidden Spectral Keeper chapter (2026-11-02)
import { PENANCE_ABILITIES, penanceGroup } from './penance.ts'; // the hidden Penance chapter (2026-11-06)
import { FLOODED_GROUPS, FLOODED_WAYS_ABILITIES } from './flooded-ways-groups.ts'; // the hidden Flooded Ways chapter (2026-11-06): Evrae Altana's three areas and Geosgaeno
import { SANCTUARY_KEEPER_ABILITIES, sanctuaryKeeperGroup } from './sanctuary-keeper.ts'; // the hidden Sanctuary Keeper chapter (2026-11-06)
import { SPHERIMORPH_ABILITIES, spherimorphGroup } from './spherimorph.ts'; // the hidden Spherimorph chapter (2026-11-06)
import { WEAPON_ABILITIES, WEAPON_GROUPS } from './weapons-groups.ts'; // the hidden Omega Ruins chapter (2026-11-06)
import { WENDIGO_ABILITIES, wendigoGroup } from './wendigo.ts'; // the hidden Wendigo chapter (2026-11-06)
import { BELGEMINE_ABILITIES, BELGEMINE_GROUPS } from './belgemine.ts'; // the hidden Belgemine's Challenge chapter (2026-11-09): her eight aeons at the Remiem Temple
import { SHINRYU_ABILITIES, shinryuGroup } from './shinryu.ts'; // the hidden Shinryu chapter (2026-11-07)
import { GAUNTLET_ABILITIES } from './gauntlet-abilities.ts'; // the hidden Gauntlet chapter (54, 2026-11-09): the Monster Arena creations' moves
import { GAUNTLET_GROUPS } from './gauntlet-groups.ts'; // ... and the formations of the tiers built (one in stage 2: acts 1 to 3)

/** Every ability row of the hidden FFX chapters (Bulldoze, the Breaths, Berserk and the half-HP Rages; the Dark Aeons' fourteen rows). */
export const HIDDEN_FFX_ABILITIES: readonly AbilityDef[] = [...Object.values(BIRAN_YENKE_ABILITIES), ...Object.values(DARK_AEONS_ABILITIES), ...Object.values(SPECTRAL_KEEPER_ABILITIES), ...Object.values(DARK_SIX_ABILITIES), ...Object.values(PENANCE_ABILITIES), ...Object.values(FLOODED_WAYS_ABILITIES), ...Object.values(SANCTUARY_KEEPER_ABILITIES), ...Object.values(SPHERIMORPH_ABILITIES), ...Object.values(WEAPON_ABILITIES), ...Object.values(WENDIGO_ABILITIES), ...Object.values(BELGEMINE_ABILITIES), ...Object.values(SHINRYU_ABILITIES), ...Object.values(GAUNTLET_ABILITIES)];

/** Every formation of the hidden FFX chapters (the brothers' duel; the Dark Aeons' eleven). */
export const HIDDEN_FFX_GROUPS: readonly EnemyGroupDef[] = [...BIRAN_YENKE_GROUPS, ...DARK_AEONS_GROUPS, spectralKeeperGroup, ...DARK_SIX_GROUPS, penanceGroup, ...FLOODED_GROUPS, sanctuaryKeeperGroup, spherimorphGroup, ...WEAPON_GROUPS, wendigoGroup, ...BELGEMINE_GROUPS, shinryuGroup, ...GAUNTLET_GROUPS];
