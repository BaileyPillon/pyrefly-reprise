/**
 * FFX-2 enemy group and boss-ability registry.
 */

import type { AbilityDef, EnemyGroupDef } from '../../../battle/common/types.ts';

import { bahamutGroup } from './bahamut.ts';
import { bahamutAbilities } from './bahamut-abilities.ts';
import { vegnagunTailGroup } from './vegnagun-tail.ts';
import { vegnagunLegGroup } from './vegnagun-leg.ts';
import { vegnagunBodyGroup } from './vegnagun-body.ts';
import { vegnagunHeadGroup } from './vegnagun-head.ts';
import { shuyinGroup } from './shuyin.ts';
import { vegnagunAbilities } from './vegnagun-abilities.ts';
import { vegnagunBodyAbilities } from './vegnagun-body-abilities.ts';
import { shuyinAbilities } from './shuyin-abilities.ts';

/** Every enemy formation this project ships, in chapter order. */
export const ENEMY_GROUPS: readonly EnemyGroupDef[] = [
  bahamutGroup,
  vegnagunTailGroup,
  vegnagunLegGroup,
  vegnagunBodyGroup,
  vegnagunHeadGroup,
  shuyinGroup,
];

export const ENEMY_GROUPS_BY_ID: Record<string, EnemyGroupDef> = Object.fromEntries(
  ENEMY_GROUPS.map((g) => [g.id, g]),
);

/** Every boss/enemy-only `AbilityDef` this project ships. */
export const ALL_BOSS_ABILITIES: readonly AbilityDef[] = [
  ...bahamutAbilities,
  ...vegnagunAbilities,
  ...vegnagunBodyAbilities,
  ...shuyinAbilities,
];

export {
  bahamutGroup,
  bahamutAbilities,
  vegnagunTailGroup,
  vegnagunLegGroup,
  vegnagunBodyGroup,
  vegnagunHeadGroup,
  shuyinGroup,
  vegnagunAbilities,
  vegnagunBodyAbilities,
  shuyinAbilities,
};

export default ENEMY_GROUPS_BY_ID;
