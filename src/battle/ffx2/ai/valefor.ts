/**
 * Valefor at Besaid Temple (FFX-2 Chapter 3, "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: `research/ffx2-fallen-aeons.md` §7.1 (SinirothX's *Enemy Encyclopedia* + the FF Wiki prose, `[verified: 2 sources]`; the wiki's "after 6 / 12 / 20 counts" is the same
 * 30 / 60 / 100 at 5 per count, §11 row 9). **Valefor's own script has not been read from the game yet**, so this is the research's description built on the engine's
 * action counter, in the shape of the scripts of the family it belongs to (Shiva's and Anima's, `./fallen-aeons.ts`; Ixion's, `./ixion.ts`), and each reading that is ours is
 * tagged `[model]` in `docs/plans/ch-besaid-valefor-review.md` §2 and §3. The RE session's note `research/re-ffx2-yojimbo-valefor.md` (the game's own monster row) is pinned
 * in `tests/fixtures/parity/ffx2/besaid_valefor_rows.json`; when a script read lands it replaces this reading.
 *
 * Each poll, in this order:
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | AC at least 100 (read before the poll's own gain) | AC := 0, both Ray flags cleared; **Energy Blast** on all the party |
 * | 2 | else AC gains 5 (her own action); the new AC has reached 30 and the 30 flag is clear, or has reached 60 and the 60 flag is clear (the lower first) | that flag is set; **Energy Ray** |
 * | 3 | else `random() mod 3` = 0 | **Sonic Wings** on the furthest living girl ({@link furthestGirl}) |
 * | 4 | else (1 or 2) | **Normal Attack** on a uniform living girl |
 *
 * The reaction entry adds 5 to AC for every result another character applies to her (`resultGauge(5)`: a landing strike, a miss, a no-effect result; the guard holds unless she
 * is stopped, asleep, petrified, confused, berserk or ejected): `[model]`, the reading the project applies to every other fallen aeon, whose scripts were read from the game
 * (`research/re-ffx2-ai-fallen-trema.md` 1.2), where §7.1 says "+5 when she acts or is attacked".
 *
 * **The two positional moves** (preflight §4). The engine has no positions (a girl is her party `slot`: rule 1 keeps stage positions out of the engine):
 *
 * - **Sonic Wings** "on the character furthest away" goes to the **back of the formation, the highest `slot` among the living girls**: Ormi's owner-approved stand-in
 *   (`./syndicate-ormi.ts`, decision D-018/q3, 2026-09-21), reused and not re-decided. `[model]`. It draws nothing (that stand-in's habit).
 * - **Energy Ray** hits "everyone in a 160 degree arc in front of her". In the fixed formation all three girls stand in front of her (the largest angle from the boss's facing to a
 *   girl in the four scenes on record, `research/re-ffx2-ai-scene-positions.md`, is about 17 degrees; the arc is 80 either side) and the engine tracks no later movement, so the move is
 *   `all-enemies`: **it hits every living girl, exactly as Energy Blast does**. `[model]`. The data row is `../../../data/ffx2/enemies/valefor-abilities.ts`.
 *
 * "Crossing 30 and 60" is one Energy Ray per threshold per cycle (a flag each, cleared at the Blast); a multi-hit volley that passes both thresholds at once gives the two Rays on
 * her next two turns, the lower first. `[model]`. Which roll value is Sonic Wings (0) is `[model]` too: the research gives only the weights, 2/3 Attack and 1/3 Sonic Wings.
 *
 * The attack target is a uniform pick among the living girls, as every other FFX-2 script here does where the game weights by closeness and facing (`./script-rolls.ts`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { AC, AC_OVERDRIVE, acOf, bumpAc, resultGauge } from './fallen-aeons.ts';
import { girls, pickGirl, scriptModCtx } from './script-rolls.ts';

/** The script id (`EnemyFields.aiScriptId`; the data file `src/data/ffx2/enemies/valefor.ts` names the same string, a test pins it). */
export const VALEFOR_SCRIPT = 'x2-valefor';

/** The ability ids (the data file `valefor-abilities.ts` owns the rows; `src/battle/**` imports no `src/data/**`, so a test pins these against it). */
export const VALEFOR_ABILITY = {
  attack: 'x2-valefor-attack',
  sonicWings: 'x2-valefor-sonic-wings',
  energyRay: 'x2-valefor-energy-ray',
  energyBlast: 'x2-valefor-energy-blast',
} as const;

/** AI memory: 1 once the Energy Ray of the 30 mark (resp. the 60 mark) has been fired this cycle. */
export const VALEFOR_RAY_30_FIRED = 'valeforRay30';
export const VALEFOR_RAY_60_FIRED = 'valeforRay60';

/** The counter marks `[verified: 2 sources]` (§7.1): an Energy Ray on crossing each; the Overdrive is {@link AC_OVERDRIVE}. */
export const VALEFOR_RAY_MARKS: readonly [number, number] = [30, 60];
/** AC gained by her own poll, and per result applied to her `[model: the sibling aeons' rule; §7.1 "+5 when she acts or is attacked"]`. */
export const VALEFOR_AC_PER_ACTION = 5;
export const VALEFOR_AC_PER_RESULT = 5;
/** The roll value (`random() mod 3`) that is Sonic Wings: 1 of 3, so Attack gets the other 2 of 3 `[model: the weights are sourced, which value is not]`. */
export const VALEFOR_SONIC_WINGS_ROLL = 0;

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/**
 * "The character furthest away": the **back of the formation**, the highest `slot` among the living girls (Ormi's stand-in, D-018/q3). With Yuna, Rikku and Paine up that is Paine;
 * with Paine down, Rikku; Yuna alone, Yuna. No draw. One function is the whole seam: if the game's scene positions for this fight are ever pinned, this becomes a distance sort.
 */
export function furthestGirl(ctx: AiContext): string[] {
  let furthest: Ffx2Unit | undefined;
  for (const unit of girls(ctx)) if (furthest === undefined || unit.slot > furthest.slot) furthest = unit;
  return furthest === undefined ? [] : [furthest.id];
}

export const x2ValeforScript: AiScript = {
  id: VALEFOR_SCRIPT,
  decide(ctx) {
    const self = ctx.self;
    if (girls(ctx).length === 0) return null;
    // Row 1: AC read before this poll's own gain. The Overdrive resets the counter and re-arms both Rays.
    if (acOf(self) >= AC_OVERDRIVE) {
      setMem(self, AC, 0);
      setMem(self, VALEFOR_RAY_30_FIRED, 0);
      setMem(self, VALEFOR_RAY_60_FIRED, 0);
      return use(VALEFOR_ABILITY.energyBlast, []);
    }
    // Row 2: her own action adds 5; an Energy Ray for each mark the counter has reached and not yet answered, the lower first.
    bumpAc(self, VALEFOR_AC_PER_ACTION);
    const ac = acOf(self);
    if (ac >= VALEFOR_RAY_MARKS[0] && mem(self, VALEFOR_RAY_30_FIRED) === 0) {
      setMem(self, VALEFOR_RAY_30_FIRED, 1);
      return use(VALEFOR_ABILITY.energyRay, []);
    }
    if (ac >= VALEFOR_RAY_MARKS[1] && mem(self, VALEFOR_RAY_60_FIRED) === 0) {
      setMem(self, VALEFOR_RAY_60_FIRED, 1);
      return use(VALEFOR_ABILITY.energyRay, []);
    }
    // Rows 3 and 4: one in three Sonic Wings on the back of the formation, else a Normal Attack on a uniform living girl.
    if (scriptModCtx(ctx, 3) === VALEFOR_SONIC_WINGS_ROLL) return use(VALEFOR_ABILITY.sonicWings, furthestGirl(ctx));
    return use(VALEFOR_ABILITY.attack, pickGirl(ctx));
  },
  ...resultGauge(VALEFOR_AC_PER_RESULT),
};
