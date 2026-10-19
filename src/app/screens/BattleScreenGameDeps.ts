/**
 * The presenter deps that depend on the chapter's game: the ability rows every
 * game has (`battleAbilityFacts.ts`), the voice for the recorded SFX set
 * (`battleSfxVoice.ts`, FFX and FFX-2 only), and FF7's own action motion
 * (`BattleScreenFf7Motion.ts`).
 *
 * Shared plumbing (both + FF7): an FFX or FFX-2 chapter gets exactly the deps it
 * had before (its ability rows, no motion port); only an FF7 chapter with an FF7
 * build gets `actionMotion`. One addition, per game: an FFX chapter's deps carry
 * `itemGesture: 'orb'` and an FFX-2 chapter's `'spark'` (each game's own item picture,
 * `BattlePresenterItem.ts`); FF7 has none.
 */

import type { BattleState, GameId } from '../../battle/common/types.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';
import type { PresenterDeps } from '../../engine/BattlePresenterPorts.ts';
import { abilityFactsFor } from './battleAbilityFacts.ts';
import { sfxVoiceFor } from './battleSfxVoice.ts';
import { Ff7ActionMotion } from './BattleScreenFf7Motion.ts';
import { RunInMotion } from './BattleScreenRunIn.ts';

export function presenterGameDeps(game: GameId, build: unknown, state?: () => BattleState | null): Pick<PresenterDeps, 'abilityFacts' | 'actionMotion' | 'sfxVoice' | 'itemGesture'> {
  const abilityFacts = abilityFactsFor(game);
  const sfxVoice = sfxVoiceFor(game, state); // D-302: FFX and FFX-2 each their own voice for the recorded set; FF7 none
  const ff7 = build as Partial<Ff7PartyBuild> | null | undefined;
  if (game === 'ffx2') return { abilityFacts, sfxVoice, actionMotion: new RunInMotion(state), itemGesture: 'spark' }; // FFX-2 only: its own item picture, a small white-blue spark and a burst, no orb (driver decision 147); r38-motion RUN-IN: FFX-2 only (sourced); inert without BATTLE SPECTACLE, under REDUCE MOTION, or over a menu
  if (game === 'ffx') return { abilityFacts, sfxVoice, itemGesture: 'orb' }; // FFX only (research `re-ffx-party-motion-timing.md` section 6, measured on the Steam copy): an item use is an orb of light tossed to the ally or a glow around the user, no flask; FFX-2 and FF7 keep what they had
  if (game !== 'ff7' || ff7?.game !== 'ff7' || !Array.isArray(ff7.members)) return { abilityFacts, sfxVoice };
  return { abilityFacts, sfxVoice, actionMotion: Ff7ActionMotion.forBuild(ff7 as Ff7PartyBuild, state) }; // FF7: who stands at the win (D1)
}
