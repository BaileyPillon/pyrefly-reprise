/**
 * The battle screen's half of the hidden Last Summoning's seam (FFX only): the chooser the chain loop asks (`EncounterChainOptions.choose`) which formation comes next.
 *
 * Before the first fight, and after each possession link's victory, the loop calls the chooser; for a chain that does not carry `EnemyGroupDef.offersAeons` it is never called, so no other chapter meets it. The chooser reads
 * what has been given up from the formation just won (its id says so: `data/ffx/last-summoning-ids.ts`), works out which aeons the party still holds, shows the offering screen
 * (`ui/ffx/offering/OfferingScreen.ts`) and answers with the id of the chosen aeon's possession link; with nothing held it answers with Yu Yevon's own formation. Pure but for the overlay it shows, so a test drives it
 * with the overlay's instant mode or a fake clock.
 */

import type { ChainChoice } from './BattleEncounterChain.ts';
import {
  OFFERING_KEYS,
  type OfferingKey,
  aeonIdsOf,
  groupIdForPick,
  heldAfter,
  parseGroupId,
  yuYevonGroupId,
} from '../../data/ffx/last-summoning-ids.ts';
import { OfferingOverlay, type OfferingOptions } from '../../ui/ffx/offering/OfferingScreen.ts';

/** What the screen lends the chooser. */
export interface OfferingChooserDeps {
  /** The battle screen's root: the overlay covers it. */
  root: HTMLElement;
  /** The ids of the aeons the party holds (`FFXPartyBuild.aeons`), read when the chooser is called. */
  aeonIds(): readonly string[];
  /** The screen's clock (the pause gate). */
  sleep?: OfferingOptions['sleep'];
  /** `speed: 'skip'`: nobody is watching, give the first held aeon. */
  instant?(): boolean;
  /** True once the screen has been left. */
  cancelled?(): boolean;
  /** REDUCE MOTION. */
  reduceMotion?(): boolean;
  sfx?: OfferingOptions['sfx'];
  /** The screen keeps the overlay while it is up, to forward the frame's input to it (`BattleScreen.handleInput`); `null` when it is gone. */
  attach(overlay: OfferingOverlay | null): void;
}

/** The offerings the party holds at all: an offering is held when every aeon behind it is in the party's list. */
export function ownedOfferings(aeonIds: readonly string[]): OfferingKey[] {
  return OFFERING_KEYS.filter((key) => aeonIdsOf(key).every((id) => aeonIds.includes(id)));
}

/** What has been given up when the chooser is called: nothing before the first fight, else the order the won formation's id names. */
export function takenAt(info: Pick<ChainChoice, 'phase' | 'group'>): OfferingKey[] {
  if (info.phase === 'first') return [];
  return parseGroupId(info.group.id)?.order ?? [];
}

/** The chooser itself. Resolves with the id of the formation to fight next; `undefined` when the screen was left. */
export function offeringChooser(deps: OfferingChooserDeps): (info: ChainChoice) => Promise<string | undefined> {
  return async (info) => {
    const taken = takenAt(info);
    const owned = ownedOfferings(deps.aeonIds());
    const held = heldAfter(taken).filter((k) => owned.includes(k));
    if (held.length === 0) return yuYevonGroupId(taken); // nothing left to give: Yu Yevon himself
    const overlay = new OfferingOverlay({
      root: deps.root,
      owned,
      taken,
      ...(deps.sleep ? { sleep: deps.sleep } : {}),
      ...(deps.instant?.() === true ? { instant: true } : {}),
      ...(deps.cancelled ? { cancelled: deps.cancelled } : {}),
      ...(deps.reduceMotion?.() === true ? { reduceMotion: true } : {}),
      ...(deps.sfx ? { sfx: deps.sfx } : {}),
    });
    deps.attach(overlay);
    try {
      const key = await overlay.show();
      return key === undefined ? undefined : groupIdForPick(taken, key);
    } finally {
      deps.attach(null);
    }
  };
}
