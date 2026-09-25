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
// The Leblanc Syndicate — **dev-only, not a playable chapter.** No scene, no
// story script, no art, no music, so it is deliberately absent from
// `src/data/encounters.ts` and `src/data/chapter-meta.ts` and chapter select
// keeps showing it as *Coming*. It is listed here so the unit suites and the
// `window.__pyrefly` debug API can reach it through `ENEMY_GROUPS_BY_ID`,
// exactly as the Macalania and Evrae engine tracks reach theirs through
// `src/data/ffx/index.ts`. [docs/handoff/chapter-leblanc-engine.md]
import { leblancSyndicateGroups } from './leblanc-syndicate-acts.ts';
import { ormiAbilities, logosAbilities, goonAbilities } from './leblanc-syndicate-abilities.ts';
import { leblancAbilities } from './leblanc-syndicate-leblanc-abilities.ts';
// Chapter XI, the fallen aeons (registered, unlisted): `./fallen-aeons-road.ts`.
import { fallenAeonsGroups } from './fallen-aeons-road.ts';
import { x2ShivaAbilities, x2AnimaAbilities } from './fallen-aeons-abilities.ts';
import { magusSistersAbilities } from './magus-sisters-abilities.ts';
// Chapter XV, the Den of Woe (registered, unlisted): `./den-of-woe.ts`.
import { denOfWoeGroups } from './den-of-woe.ts';
import { denOfWoeAbilities } from './den-of-woe-abilities.ts';

/** Every enemy formation this project ships, in chapter order. */
export const ENEMY_GROUPS: readonly EnemyGroupDef[] = [
  bahamutGroup,
  vegnagunTailGroup,
  vegnagunLegGroup,
  vegnagunBodyGroup,
  vegnagunHeadGroup,
  shuyinGroup,
  ...leblancSyndicateGroups,
  ...fallenAeonsGroups,
  ...denOfWoeGroups,
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
  ...ormiAbilities,
  ...logosAbilities,
  ...leblancAbilities,
  ...goonAbilities,
  ...x2ShivaAbilities,
  ...magusSistersAbilities,
  ...x2AnimaAbilities,
  ...denOfWoeAbilities,
];

export { leblancSyndicateGroups, ormiAbilities, logosAbilities, leblancAbilities, goonAbilities };

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
