/**
 * The battle-start card: the approved Ink & Gold boss card, shown once per encounter, with the opening covered under it.
 *
 * `BattleScreen.ts` was one 1,085-line class. It is now a short chain of classes, every layer calling only the layers below it:
 * `BattleScreenBase` (state) -> `BattleScreenPause` (the pause, the input, the stall watch) -> `BattleScreenCard` (the battle-start card) -> `BattleScreenEncounter` (enter, the encounter loop)
 * -> `BattleScreen` (the frame, the debug beats, exit; import that one from `BattleScreen.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where another layer reads it.
 * Source-text tests read the screen's wiring across the whole chain (`tests/unit/helpers/battleScreenSource.ts`).
 */

import { backdropFileOf, inArtNamespace } from '../../data/art/artNamespace.ts';
import { BattleStartBanner } from '../../ui/common/BattleStartBanner.ts';
import { stagingPieceOn } from '../../engine/pro/staging/StagingSwitch.ts';
import { cardHoldOption, coverOption } from '../../ui/common/transitions/cardHold.ts'; // the card's hold (the hurried one, or the full one less the time the card over the entry has been up); the opening's first frame under it
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';
import { BattleScreenPause } from './BattleScreenPause.ts';

export abstract class BattleScreenCard extends BattleScreenPause {
  /**
   * The approved Ink & Gold boss card, once per encounter.
   *
   * Resolves immediately — and shows nothing — for a run with nobody watching
   * (`speed: 'skip'`, which is e2e and the critic) and for the demo reel, which
   * has no boss to name.
   */
  protected async showBattleStart(): Promise<void> {
    const chapter = this.opts.chapter; // FF7 draws no Ink & Gold card (FF7 HUD spec §7 #15, §8)
    if (this.opts.speed === 'skip' || this.preview || chapter.game === 'ff7') return this.opts.speed === 'skip' || this.preview ? undefined : this.airship?.opening?.(); // FF7: its opening camera (F1)
    const state = this.engine?.state();
    if (!state) return;
    const boss = headlineEnemy(state, chapter.enemyGroupRef.bossId); // PR-0243
    if (!boss) return;
    const ns = this.scene?.slots.artNamespace; // the scene's art namespace (the experimental Leblanc chapter): the card shows the paintings the field stages
    const party = state.activeIds
      .map((id) => state.combatants[id])
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      // Both keys, not one. The card wants the character's own id to find her
      // portrait and the sprite key to find the painting the field is staging
      // — which in FFX-2 is her dressphere, and in FFX is the same string.
      .map((c) => ({ id: c.id, artId: inArtNamespace(ns, c.spriteKey || c.id), name: c.name }));

    const banner = new BattleStartBanner({
      root: this.root,
      chapterNumber: chapter.number,
      ...(chapter.experimental ? { experimental: true as const } : {}),
      ...(stagingPieceOn('card') ? { pro: true as const } : {}), // pro staging: the card is a full-bleed painting (demo chapters only)
      location: chapter.location,
      bossName: boss.name,
      subline: chapter.subtitle,
      artKey: inArtNamespace(ns, boss.spriteKey || boss.id),
      backdropKey: backdropFileOf(chapter.sceneKey), // the start card's wash is a backdrop file (a code key names its plate: `artNamespace.ts#SCENE_BACKDROP_FILE`)
      party,
      game: chapter.game,
      ...cardHoldOption(!!this.opts.openingHurry), ...coverOption(!!this.opts.openingHurry, () => { if (!this.exited) this.presenter?.moments.coverOpening(state.activeIds); }), // 700 ms hurried; else 1.9 s, less the time the loading card over the entry has been up (`transitions/cardHold.ts`); as the card leaves, the HUD and the party go down under it, where the opening starts from (`OpeningPark.ts`)
      until: () => this.stage?.planSettled() ?? Promise.resolve(), // the card is the cover: CHAPTER FRAMING's first plan lands under it, never under the first menu (`fx/mix/openingGate.ts`)
    });
    this.battleStartBanner = banner;
    await banner.show();
    this.battleStartBanner = null;
  }
}
