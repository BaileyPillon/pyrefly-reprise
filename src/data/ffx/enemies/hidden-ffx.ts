/**
 * **The hidden FFX chapters' enemy data, as one barrel** for the data index (`../index.ts` was at 399 of the house 400 lines, so a second hidden chapter could not add its three lines): the rows and the formations of
 * the hidden Biran and Yenke chapter (2026-10-14) and of the hidden Mirror Aeons chapter (2026-10-15). A further hidden FFX chapter joins here, not in the index. FFX only; shared plumbing (both), inert for every other chapter.
 */

import type { AbilityDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { BIRAN_YENKE_ABILITIES, BIRAN_YENKE_GROUPS } from './biran-yenke.ts';
import { DARK_AEONS_ABILITIES, DARK_AEONS_GROUPS } from './dark-aeons-groups.ts';

/** Every ability row of the hidden FFX chapters (Bulldoze, the Breaths, Berserk and the half-HP Rages; the Dark Aeons' fourteen rows). */
export const HIDDEN_FFX_ABILITIES: readonly AbilityDef[] = [...Object.values(BIRAN_YENKE_ABILITIES), ...Object.values(DARK_AEONS_ABILITIES)];

/** Every formation of the hidden FFX chapters (the brothers' duel; the Dark Aeons' eleven). */
export const HIDDEN_FFX_GROUPS: readonly EnemyGroupDef[] = [...BIRAN_YENKE_GROUPS, ...DARK_AEONS_GROUPS];
