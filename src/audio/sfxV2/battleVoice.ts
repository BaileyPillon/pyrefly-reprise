/**
 * The recorded set's battle hookup (D-302): which v2 cue a battle moment plays, chosen by who acts,
 * with what, and what lands.
 *
 * Pure: every fact arrives already resolved (`src/app/screens/battleSfxVoice.ts` reads the engine
 * state and the ability data; the presenter, `src/engine/BattlePresenterSfx.ts`, supplies the moment).
 * Returns `null` whenever the set has nothing for the moment in that game, and the presenter then plays
 * exactly what it played before (the victory fanfare, a human FFX-2 boss's charge, a data `sfx` key
 * the set does not have).
 *
 * Game case (AGENTS.md rule 14): FFX chapters get the FFX cues, FFX-2 chapters the FFX-2 twins
 * (`-x2`) and weapons, `both` cues in both (`cues.ts` `twin`). FF7 never reaches this module.
 * The moment -> cue table is the set's own proposal (its README "Per-event mapping"), accepted by
 * Bailey on 2026-09-30 with the full hookup; the additions are named where they appear.
 */

import { twin } from './cues.ts';
import { roarFor, WEAPON_CUES, type EnemyVoice, type Weapon } from './weapons.ts';
import { STATUS_CUES } from './statusCues.ts';

export type VoiceGame = 'ffx' | 'ffx2';

export interface VoiceActor {
  id: string;
  side: 'party' | 'enemy' | 'aeon' | null;
  /** A party member's weapon (`weapons.ts`); `null` for enemies, aeons and anyone the tables do not name. */
  weapon: Weapon | null;
  /** An FFX-2 enemy's voice (`weapons.ts` `FFX2_ENEMY_VOICES`). */
  voice: EnemyVoice | null;
}

/** The action on screen, resolved from its command and its ability or item row. */
export interface VoiceAction {
  commandKind: string;
  /** The ability's first element other than `none` (FFX `ElementId`), if any. */
  element: string | null;
  damageType: string | null;
  /** The landing family its data names (`families.ts`), if any. */
  family: string | null;
  isItem: boolean;
}

export interface VoiceAsk {
  game: VoiceGame;
  /** The presenter's moment: `attack`, `cast`, `item`, `damage`, `heal`, `revive`, `miss`, `status`, `ko`, `summon`, `spherechange`, `overdrive`, `charge`, `form-change`, `counter`, `petrify-shatter`, `victory`, or a data `sfx` key. */
  moment: string;
  actor: VoiceActor | null;
  target: VoiceActor | null;
  /** `null`: no action on screen (a poison tick, a Regen heal, a scripted beat). */
  action: VoiceAction | null;
  /** How many events of this moment the same action played before this one (0 = the first). */
  nth: number;
  /** `damage`: the event's element and crit. */
  element?: string | null;
  crit?: boolean;
  /** `status`: the status id. */
  status?: string;
  /** `ko`: the enemy's departure kind (`BattlePresenterDepartures.ts`), `null` for a fiend's dissolve. */
  departure?: string | null;
  /** `charge`: 1 = first warning, 2 = imminent. */
  stage?: number;
  /** `spherechange`: the dressphere changed to. */
  to?: string;
}

export interface Voiced {
  key: string;
  /** Multiplies the presenter's own volume for the moment. */
  gain?: number;
}

const ELEMENT_CUES: Readonly<Record<string, string>> = {
  fire: 'fire',
  ice: 'ice',
  lightning: 'thunder',
  water: 'water',
  holy: 'holy',
};

/** Landing families that play their own cue when the action's first blow lands (then `hit-1`). */
const ONCE_FAMILIES = new Set(['flare', 'explosion', 'breath-attack', 'laser-fire']);

/** Special dresspheres (FFX-2): a Special Dress Up opens with the Special stinger. */
const SPECIAL_DRESSPHERES = new Set(['floral-fallal', 'machina-maw', 'full-throttle']);

function v(key: string | null, gain?: number): Voiced | null {
  return key ? (gain === undefined ? { key } : { key, gain }) : null;
}

function swing(ask: VoiceAsk): string | null {
  const { game, actor, action } = ask;
  if (actor?.side === 'party' && actor.weapon) {
    // FFX-2 Trigger Happy: a Gunner's Overdrive-kind command fires the burst (the set's `gun-burst`).
    if (actor.weapon === 'gun' && action?.commandKind === 'overdrive') return twin('gun-burst', game);
    return twin(WEAPON_CUES[actor.weapon].swing, game);
  }
  return twin(game === 'ffx' ? 'swing-katana' : 'swing-greatsword', game);
}

function damage(ask: VoiceAsk): Voiced | null {
  const { game, actor, action, nth } = ask;
  if (ask.crit) return v(twin('critical', game));
  if (!action) return v(twin('hit-2', game), 0.6); // a tick with nothing on screen
  const family = action.family;
  // A family this game has no cue for (FFX's Energy Ray names the FFX-2 laser) lands by the rules below.
  const once = family && ONCE_FAMILIES.has(family) ? twin(nth === 0 ? family : 'hit-1', game) : null;
  if (once) return v(once);
  const element = ask.element && ask.element !== 'none' ? ask.element : null;
  const elementCue = element ? ELEMENT_CUES[element] : undefined;
  if (elementCue) return v(twin(elementCue, game));
  if (family && ELEMENT_CUES[family]) return v(twin(ELEMENT_CUES[family]!, game));
  if (action.isItem) return v(twin('hit-2', game));
  if (action.damageType === 'magical') return v(twin(nth === 0 ? 'flare' : 'hit-1', game));
  if (actor?.side === 'party' && actor.weapon) return v(twin(WEAPON_CUES[actor.weapon].hit, game));
  if (actor?.side === 'enemy') return v(twin('hit-heavy-enemy', game));
  return v(twin('hit-1', game));
}

function heal(ask: VoiceAsk): Voiced | null {
  const { game, action, nth } = ask;
  if (!action) return v(twin('cure', game), 0.6); // Regen, Mortibsorption: no action on screen
  if (nth > 0) return v(twin('status-applied', game));
  return v(twin(action.family === 'cure-3' ? 'cure-3' : 'cure', game));
}

function ko(ask: VoiceAsk): Voiced | null {
  const { game, target } = ask;
  if (target?.side !== 'enemy') return v(twin('ko-fall', game));
  if (ask.departure && ask.departure !== 'dissolve' && ask.departure !== 'returns') return v(twin('ko-fall', game));
  if (target.voice === 'machina') return v(twin('machina-destroy', game));
  // Fiends disperse their pyreflies in both games (research/ffx-vs-ffx2-presentation.md line 132,
  // [verified: 2 sources]); the set tags the cue FFX, the source makes it both.
  return v('v2:dissolve-pyreflies');
}

/** The v2 cue for one battle moment, or `null` to keep the presenter's own cue. */
export function voiceBattle(ask: VoiceAsk): Voiced | null {
  const { game, moment } = ask;
  switch (moment) {
    case 'attack':
      return v(swing(ask));
    case 'cast':
      return v(twin('magic-charge', game));
    case 'item': // added for the hookup: the item-use sound at action start
      return v(twin('item-use', game));
    case 'damage':
      return damage(ask);
    case 'heal':
      return heal(ask);
    case 'revive':
      if (ask.action?.isItem) return v(twin('phoenix-down', game));
      return v(twin('life', game));
    case 'miss':
      return v(twin('whiff', game));
    case 'status': {
      if (ask.nth > 0 || !ask.action) return v(twin('status-applied', game));
      const cue = ask.status ? STATUS_CUES[ask.status as keyof typeof STATUS_CUES] : undefined;
      return v(twin(cue ?? 'debuff-generic', game));
    }
    case 'petrify-shatter':
      return v(twin('petrify-shatter', game));
    case 'ko':
      return ko(ask);
    case 'summon':
      return v(twin('summon', game));
    case 'spherechange':
      return v(twin(ask.to && SPECIAL_DRESSPHERES.has(ask.to) ? 'special-stinger' : 'spherechange', game));
    case 'overdrive':
      return v(twin('overdrive-full', game));
    case 'charge':
      if (ask.stage === 2) return v(twin('boss-overdrive-warning', game));
      return v(ask.actor ? roarFor(game, ask.actor.id) : null);
    case 'form-change':
      return v(twin('boss-phase-shift', game));
    case 'counter': // added for the hookup: the parry tick before a counter-blow
      return v(twin('counter', game));
    case 'victory':
      return null; // the set has no fanfare: the shipped one stays
    default:
      // A data `sfx` key the set has a cue of the same name for in this game (`laser-charge`, `explosion`, ...).
      return v(twin(moment, game));
  }
}
