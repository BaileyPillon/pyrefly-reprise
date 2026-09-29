/**
 * The party for **Sin, the assault from the *Fahrenheit*** (link 4, Overdrive
 * Sin, first; links 1 to 3 will share it).
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — FFX's seven guardians, CTB
 * bench and aeons.
 *
 * ## Bailey's pick (2026-09-27, "all your recommendations")
 *
 * `research/ffx-sin.md` §7.3 option **B** (S-29, our estimate by construction):
 * **`./garden-of-pain.ts` with Yuna's Tetra Ring back**, i.e. Chapter III's
 * `./dreams-end.ts` less the Inside-Sin finds. The Garden of Pain is one
 * dungeon later (Sea of Sorrow, then Omnis), so the only change this point
 * needs is to take back what that dungeon handed out before Omnis: the Phantom
 * Ring (found in the Sea of Sorrow, `garden-of-pain.ts` header) comes off Yuna
 * and her **Tetra Ring** (Magic Def +20 %, Stoneproof, Deathward, Confuseward)
 * goes back on. Everything else is `garden-of-pain.ts` exactly: its stat cells
 * keep the `[estimate]` label `dreams-end.ts` gives them, Lulu has no One MP
 * Cost (an Inside-Sin find), Tidus has no Talk (there is no Trigger Command in
 * link 4, research §3.5 `[verified: 3 sources]`), the five story aeons at
 * Chapter III's gauges, Chapter III's bag.
 *
 * Whether the Tetra armours could have come from these very fights is not
 * established (§7.3 `[unsourced]`); they are the preset's, not a claim.
 *
 * What it means against Gaze (§5.4, §7.2): Stoneproof on Yuna and Lulu,
 * Confuse Ward on Tidus and Yuna, no Zombie protection anywhere.
 *
 * ## Link 4 starts rested
 *
 * §1.2 `[verified: 2 sources]`: after the Core falls the player saves, shops
 * and re-equips before link 4, so HP and MP are full and the Overdrive gauges
 * are the preset's. Links 1 to 3, when they are built, carry state between
 * themselves (§1.2 `[verified: 3 sources]`), not into link 4.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { dreamsEndBuild } from './dreams-end.ts';
import { gardenOfPainBuild } from './garden-of-pain.ts';

/** Yuna's armour in `dreams-end.ts`: the Tetra Ring, which Chapter XII swapped for the Phantom Ring. */
function tetraRing(): FFXMemberBuild['equipment']['armor'] {
  const yuna = dreamsEndBuild.members.find((m) => m.id === 'yuna');
  if (!yuna) throw new Error('sin-fahrenheit: yuna missing from dreams-end');
  return structuredClone(yuna.equipment.armor);
}

function member(m: FFXMemberBuild): FFXMemberBuild {
  const out = structuredClone(m);
  if (out.id === 'yuna') out.equipment.armor = tetraRing();
  return out;
}

export const sinFahrenheitBuild: FFXPartyBuild = {
  game: 'ffx',
  members: gardenOfPainBuild.members.map(member),
  // §7.2: both presets open Tidus, Yuna, Auron; no formation forces a party
  // (`forced_party ""`, [decompiled]), so every switch is legal from turn one.
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: [...gardenOfPainBuild.reserve],
  aeons: gardenOfPainBuild.aeons.map((a) => structuredClone(a)),
  inventory: gardenOfPainBuild.inventory.map((e) => ({ ...e })),
  gil: gardenOfPainBuild.gil,
  sphereInventory: {},
};

/**
 * **Chapter XVII's copy** ("Sin: the Fins and the Core", links 1 to 3): the same
 * preset (D-264), with **Tidus's and Rikku's orders to Cid** added back. In the
 * Fin fights the Trigger Command is Evrae's: "Tidus and Rikku, Trigger Command,
 * **same**" (research/ffx-sin.md §4 `[verified: 4 sources]`), which is the pair
 * of menu markers `pull-back` / `close-in` Chapter VIII's `fahrenheit.ts` gives
 * them and `highbridge.ts` strips for every later chapter. Nothing else changes;
 * link 4 (`sinFahrenheitBuild` above) has no order (§3.5).
 *
 * The markers ride the chain into link 3, where Cid is not in the formation, so
 * `airshipOrderAvailable` refuses them there (a greyed row, §3.5: no Trigger
 * Command in links 3 and 4). How that row reads is package F's and P's.
 */
export const SIN_FINS_ORDER_OWNERS: readonly string[] = ['tidus', 'rikku'];
const ORDERS: readonly string[] = ['pull-back', 'close-in'];

export const sinFinsCoreBuild: FFXPartyBuild = {
  ...sinFahrenheitBuild,
  members: sinFahrenheitBuild.members.map((m) => {
    const out = structuredClone(m);
    if (SIN_FINS_ORDER_OWNERS.includes(out.id)) {
      out.learnedAbilityIds = [...out.learnedAbilityIds.filter((id) => !ORDERS.includes(id)), ...ORDERS];
    }
    return out;
  }),
  reserve: [...sinFahrenheitBuild.reserve],
  aeons: sinFahrenheitBuild.aeons.map((a) => structuredClone(a)),
  inventory: sinFahrenheitBuild.inventory.map((e) => ({ ...e })),
};

export default sinFahrenheitBuild;
