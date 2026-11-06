/**
 * The possessed Rikku and the possessed Paine, the two duels of the hidden chapter "Yuna's Ballad". **FFX-2 only** [AGENTS.md rule 14].
 *
 * **The scripts are the game's own** (`m254` and `m256`, read in `research/re-ffx2-yunas-ballad.md` sections 6.2 and 6.3: the shipped AI source and the compiled workers, which agree on the queued command ids, the
 * `random() % n` modulus and the scene constants). Both are tiny; no state, no HP branch, no status test, empty reaction, menu, targeted and death entries.
 *
 * - **Rikku** [m254.src 14-131]: each poll a target is picked first (the near-weighted `searchr` over the living girls, drawn even for the party-wide throw), then one draw `random() % 10`:
 *   **0 Bomb Core, 1 Arctic Wind, 2 Lightning Marble, 3 Dragon Scale** (each at the picked girl), **4 and 5 Grenade on the whole party**, **6 to 9 Spider Attack** at the picked girl.
 *   So 10 percent for each of the four elemental throws, 20 percent Grenade and 40 percent Spider Attack. (The repo's wiki-level note drew out of nine; the script draws out of ten.)
 * - **Paine** [m256.src 14-140]: each poll, **Attack on the living girl with the most current HP** (a near-weighted search, then `max` keeps every girl tied for the highest HP). Nothing else, no draw.
 *
 * **With Yuna alone every search has one candidate, so no search draw is consumed** (`script-rolls.ts`: nothing is drawn below two candidates); a party of more than one girl would still follow the script. Positions are unread
 * (the scenes' `pos_` files are empty), so the near-weighted pick is the uniform pick here, as in every other Den script (`./den-of-woe.ts`, row D10).
 *
 * **The generic "battle too long" block (inert)** [m254.src, m256.src; `research/re-ffx2-yunas-ballad.md` 6.4]: past 180 to 200 actions in its own scene each script would queue four message rows and the 12-hit Meteor, only
 * behind the guard "no girl is alive and unpetrified", which does not run in play (the Bahamut and Leblanc scripts carry the same block). Nothing to implement.
 *
 * **Under Confusion** a confused Rikku would pick from her record list, which holds the WEAK versions of the items; the engine leaves a Confused monster to its script (`adapt/confusion.ts`), so the strong throws go on
 * and the weak ones are unreachable (pick YB9, pinned by a test as a known gap).
 */

import type { Command } from '../../common/types.ts';
import type { AiScript } from '../internal.ts';
import {
  POSSESSED_PAINE_ATTACK_ID,
  POSSESSED_RIKKU_ARCTIC_WIND_ID,
  POSSESSED_RIKKU_BOMB_CORE_ID,
  POSSESSED_RIKKU_DRAGON_SCALE_ID,
  POSSESSED_RIKKU_GRENADE_ID,
  POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
  POSSESSED_RIKKU_SPIDER_ATTACK_ID,
} from '../../../data/ffx2/enemies/yunas-ballad-abilities.ts';
import { POSSESSED_PAINE_SCRIPT_ID, POSSESSED_RIKKU_SCRIPT_ID } from '../../../data/yunas-ballad-ids.ts';
import { extremeId, girls, pickId, scriptMod } from './script-rolls.ts';

/** Rikku's draw `random() % 10` (m254.src): the four elemental throws are the first four values. */
export const RIKKU_DRAW_MODULUS = 10;
/** The four single-girl throws, by draw value 0 to 3. */
export const RIKKU_THROWS = [
  POSSESSED_RIKKU_BOMB_CORE_ID,
  POSSESSED_RIKKU_ARCTIC_WIND_ID,
  POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
  POSSESSED_RIKKU_DRAGON_SCALE_ID,
] as const;
/** The draw values that throw a Grenade at the whole party. */
export const RIKKU_GRENADE_DRAWS = [4, 5] as const;

function use(id: string, targets: string[] = []): Command {
  return { kind: 'ability', id, targets };
}

/**
 * Possessed Rikku [m254]. The target is picked first (one search over the living girls), then one draw out of ten:
 *
 * ```
 * 0..3 one of the four throws at the picked girl   4, 5 Grenade on the party   6..9 Spider Attack at the picked girl
 * ```
 */
export const possessedRikkuScript: AiScript = {
  id: POSSESSED_RIKKU_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const target = pickId(ctx.rng, party); // made before the draw, and made even for the party-wide throw
    const draw = scriptMod(ctx.rng, RIKKU_DRAW_MODULUS);
    if (draw < RIKKU_THROWS.length) return use(RIKKU_THROWS[draw]!, target);
    if (draw < RIKKU_THROWS.length + RIKKU_GRENADE_DRAWS.length) return use(POSSESSED_RIKKU_GRENADE_ID);
    return use(POSSESSED_RIKKU_SPIDER_ATTACK_ID, target);
  },
};

/** Possessed Paine [m256]: Attack on the living girl with the most current HP, every poll; no draw with one girl. */
export const possessedPaineScript: AiScript = {
  id: POSSESSED_PAINE_SCRIPT_ID,
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    return use(POSSESSED_PAINE_ATTACK_ID, extremeId(ctx.rng, party, (u) => u.hp, 'max'));
  },
};

export const yunasBalladScripts: readonly AiScript[] = [possessedRikkuScript, possessedPaineScript];
