/**
 * The **full** FFX-2 carry across a chain seam: statuses, the worn dressphere
 * and the grid progress, on top of the HP, MP, KO and items every chain carries
 * (`BattleScreenSetup.carryFfx2`).
 *
 * **FFX-2 only** [AGENTS.md rule 14]; read only for a formation that sets
 * `EnemyGroupDef.carriesFullPartyState`, which Chapter XV's links 2 and 3 alone
 * do (the Den of Woe, Baralai -> Gippal -> Nooj). Bailey took the plan's GP3 = a
 * (`docs/plans/chapter-gippal-review.md`, "I'll go with all your
 * recommendations", 2026-09-25). The sources carry **HP** between the shades
 * (research `ffx2-gippal-den-of-woe.md` §2, 2 sources); carrying statuses and
 * the dressphere too is our reading of "without a break", `[derived]`.
 * Chapters 5, 6 and XI never set the flag, so their chains are unchanged
 * (`tests/unit/chapters/den-of-woe-carry.test.ts` pins them).
 *
 * **The grid stays laid out as it was.** The engine lays a girl's grid out from
 * her build (`ffx2/setup.ts#gridNodeContents`: the worn dressphere first, then
 * `owned` in order, then the worn one moved onto her node). Handing it a new
 * worn dressphere with the same `owned` would shuffle the nodes, so the carried
 * `owned` is re-ordered to reproduce the old layout exactly, and checked. If it
 * cannot be (a grid with empty nodes before full ones) or she is transformed
 * into a special dressphere, she keeps the build's dressphere and grid and only
 * her statuses ride along.
 *
 * Layering: no DOM, no `three`; pure data in, data out.
 */

import type { BattleState, FFX2Combatant, FFX2MemberBuild, FFX2PartyBuild } from '../../battle/common/types.ts';
import { cloneData } from '../../battle/common/clone.ts';
import { gridNodeContents } from '../../battle/ffx2/setup.ts';
import { GARMENT_GRIDS } from '../../data/ffx2/index.ts';

type Worn = NonNullable<FFX2Combatant['dresspheres']>;

/** Every girl keeps her statuses, and her dressphere and grid where the layout allows. */
export function carryFfx2Full(build: FFX2PartyBuild, state: BattleState): FFX2PartyBuild {
  const members = build.members.map((m) => carryMember(m, state.combatants[m.id] as FFX2Combatant | undefined));
  return { ...build, members: members as FFX2PartyBuild['members'] };
}

function carryMember(member: FFX2MemberBuild, live: FFX2Combatant | undefined): FFX2MemberBuild {
  if (!live) return member;
  const withStatuses: FFX2MemberBuild = { ...member, statuses: cloneData(live.statuses ?? {}) };
  const worn = live.dresspheres;
  if (!worn || worn.special || (live as { sdspPartIds?: unknown[] }).sdspPartIds?.length) return withStatuses;
  return wearing(withStatuses, worn) ?? withStatuses;
}

/**
 * PR-0124's switch, **OFF** until Bailey rules (plan §8 Q4): at a **plain** FFX-2 chain seam (a
 * formation without `carriesPartyState` or `carriesFullPartyState`: Chapter V's links, Chapter VI's
 * Acts, Chapter XI's platforms) each girl starts the next battle in the dressphere she ended the last
 * one in, on the same grid layout. **GameFAQs' reading, our estimate** (`research/ffx2-combat-core.md`
 * §10.2: KADFC, *Speed Guide*, FAQ 38278, whose menu step between the Chateau fights only has a purpose
 * if the dressphere carries; one board post agrees). Gate effects and the worn-this-battle list never
 * carry (§4.1, §8.2, `[verified: 2 sources]`), nor does the special-dressphere unlock (bremen FAQ
 * 26991): a girl who ends a link in a special dressphere keeps the preset, an engine choice
 * (unsourced). Statuses do not ride along either (only XIII's and XV's own approved carries do).
 * `setupForNextLink(..., { dressphereCarries })` overrides it for a measurement run.
 */
export const FFX2_DRESSPHERE_CARRIES = false;

/** PR-0124: every girl in the dressphere she wore at the seam, gates reset; the preset where it cannot be reproduced. */
export function carryWornDresspheres(build: FFX2PartyBuild, state: BattleState): FFX2PartyBuild {
  const members = build.members.map((m) => {
    const live = state.combatants[m.id] as FFX2Combatant | undefined;
    const worn = live?.dresspheres;
    if (!worn || worn.special || (live as { sdspPartIds?: unknown[] }).sdspPartIds?.length) return m;
    const next = wearing(m, worn);
    if (!next) return m;
    return { ...next, garmentGrid: { ...next.garmentGrid, passedGates: [], wornThisBattle: [] } };
  });
  return { ...build, members: members as FFX2PartyBuild['members'] };
}

/** The grid's node count as the engine's adapter reads it (`adapters.ts`: clamped 2–6; 6 unknown). */
function nodeCount(gridId: string): number {
  const grid = (GARMENT_GRIDS as Partial<Record<string, { nodeCount: number }>>)[gridId];
  return grid ? Math.max(2, Math.min(6, grid.nodeCount)) : 6;
}

/**
 * The build as it would read had she started the link in what she wears now,
 * on the same grid layout; `null` when that layout cannot be reproduced.
 */
export function wearing(member: FFX2MemberBuild, worn: Worn): FFX2MemberBuild | null {
  if (worn.current === member.currentDressphere && worn.garmentGrid.nodePosition === member.garmentGrid.nodePosition) {
    return { ...member, garmentGrid: cloneData(worn.garmentGrid) };
  }
  if (!member.owned.includes(worn.current) || worn.garmentGrid.id !== member.garmentGrid.id) return null;
  const nodes = nodeCount(member.garmentGrid.id);
  const layout = gridNodeContents(member, nodes);
  const at = worn.garmentGrid.nodePosition;
  if (at < 0 || at >= nodes || layout[at] !== worn.current) return null;
  // The engine fills nodes in `[worn, ...owned]` order, then swaps the worn one
  // onto her node: so the fill order is the layout with node 0 and her node swapped.
  const fill = [...layout];
  fill[0] = layout[at] ?? null;
  fill[at] = layout[0] ?? null;
  if (fill.some((d) => d === null)) return null;
  const onGrid = fill.slice(1) as string[];
  const owned = [...onGrid, ...member.owned.filter((d) => d !== worn.current && !onGrid.includes(d))];
  const candidate: FFX2MemberBuild = {
    ...member,
    currentDressphere: worn.current,
    owned,
    garmentGrid: cloneData(worn.garmentGrid),
  };
  const same = gridNodeContents(candidate, nodes).every((d, i) => d === layout[i]);
  return same ? candidate : null;
}
