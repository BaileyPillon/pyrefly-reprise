/**
 * SFX parity, per-actor and per-event cue names (the "slots"): which recorded original answers WHICH event.
 *
 * A parity pack used to answer by the stand-in's name, so one recording of `swing-katana` would have played for
 * every user of that stand-in (Auron's katana and every FFX foe's swing). A slot names ONE event instead: a hook
 * says "at this moment, for this actor/ability/status/tier, play the recorded original called `swing-ormi`", and
 * the mixer looks that name up in the active packs (`SfxSprites.pickEvent`). The stand-in the voice chose stays
 * exactly as it was (`battleVoice.ts` `voiceBattle`): a hook only ADDS the name, so with no pack listed every cue
 * is the one it always was.
 *
 * Exclusive lookup. A battle moment's cue consults the packs ONLY for the names its hook lists; a cue no hook covers
 * lists none (`NO_RECORDING`), so a stand-in that many events share (`hit-1`, `flare`, `swing-katana`, `boss-roar`)
 * never picks up another event's recording by accident. The menu keys, which are not battle moments, keep looking
 * up their own name as before (`SfxSprites.pick`).
 *
 * A hook lists a chain: the event's own name first, then names it falls back to when its own is not recorded
 * (`fire-3` -> `fire-2` -> `fire`, `reflect` -> `shell`): the closer sound that shares today's stand-in. And it may
 * name the other cues of the same move that its original COVERS (an enemy's "attack and blow" is one recorded
 * sample): those cues list `coveredBy`, and the mixer lets their stand-ins stay silent when the covering original
 * is the one playing.
 *
 * Data, not branches: the tables live in `eventCuesFfx.ts` / `eventCuesFfx2.ts`, one `hook(...)` per spec row
 * (`docs/audio/sfx-parity-rows.json` carries the row ids), and `tests/unit/audio-sfx-parity-events.test.ts` walks
 * them against the voice, the data and the rows.
 *
 * Game case (AGENTS.md rule 14): a hook belongs to one game and its table is only consulted for that game, so an
 * FFX-2 chapter can never resolve an FFX event. Shared plumbing, "both"; every hook one game's. Pure: no DOM, no
 * Web Audio, no `three`.
 */

import type { VoiceAsk } from './battleVoice.ts';
import { isV2Key } from './cues.ts';
import type { Weapon } from './weapons.ts';

export type EventGame = 'ffx' | 'ffx2';
export type Side = 'party' | 'enemy' | 'aeon';
type Many<T> = T | readonly T[];

/**
 * What a hook matches. Every field present must match; absent fields match anything. The moments are the
 * presenter's (`attack`, `cast`, `damage`, `heal`, `revive`, `status`, `ko`, `summon`, `charge`, `form-change`, ...)
 * plus two the moment layer asks for directly (`appear`: the boss reveal; `overdrive-start`: an Overdrive or Special
 * opening, `BattleMoments.ts`).
 */
export interface Selector {
  moment: Many<string>;
  /**
   * The v2 cue the voice chose, by name without the prefix (`fire`, `fire-x2`, `hit-heavy-enemy`); `null` when the
   * voice chose none and the presenter's own first-bank cue plays. Absent: any.
   */
  on?: string | null;
  /** The actor's side. */
  side?: Many<Side>;
  /** The target's side. */
  targetSide?: Many<Side>;
  /** The actor's combatant id (the data's id). */
  actor?: readonly string[];
  /** The target's voice (FFX-2 enemies that cry and break as `aeon` or `machina`, `weapons.ts`). */
  targetVoice?: 'aeon' | 'machina';
  /** The weapon a party actor swings. */
  weapon?: readonly Weapon[];
  /** The action's ability id, from the list or the pattern. */
  ability?: readonly string[] | RegExp;
  /** The action's item id (an item command). */
  item?: readonly string[];
  /** `true`: an item's effect; `false`: not an item (a spell or a blow). */
  isItem?: boolean;
  /** The action's command kind (`attack`, `ability`, `item`, `overdrive`, ...). */
  command?: readonly string[];
  /** `status` moments: the status id. */
  status?: readonly string[];
  /** FFX spell tier from the ability's `sfxKey` (1 also matches an action with no tier); never set for FFX-2. */
  tier?: 1 | 2 | 3;
  /** The n-th event of this moment the same action played: `first` is 0, `later` is anything after. */
  nth?: 'first' | 'later';
  /** Whether the action has already landed a cue (damage, heal, status, KO...): `first` is the first landing. */
  landing?: 'first' | 'later';
  /** `charge` moments: 1 first warning, 2 imminent. */
  stage?: 1 | 2;
  /** `spherechange` moments: the dressphere changed to. */
  to?: readonly string[];
  /** `true`: no action on screen (a tick, a trigger); `false`: an action is on screen. */
  bare?: boolean;
}

/**
 * One recorded original and where it plays. A hook with no `cue` is a QUIET hook: the cue it matches has no
 * original of its own, and its stand-in stays silent while the original named in `coveredBy` is the one playing
 * (the blows of a move whose one recorded sample covers the whole move).
 */
export interface Hook {
  /** The spec row (`docs/audio/sfx-parity-rows.json`) this original answers: the manifest cue's `specRow`. */
  row: string;
  /** The pack cue's name; `null` for a quiet hook. */
  cue: string | null;
  game: EventGame;
  at: Selector;
  /** Names tried after `cue` when it is not recorded: the closer sound that shares today's stand-in. */
  then?: readonly string[];
  /** Originals (by cue name) that cover this cue: when one is the original playing, this cue's stand-in stays silent. */
  coveredBy?: readonly string[];
}

/** What the voice hands the presenter for one cue: the names to look up, and whom to stand down for. */
export interface EventPlan {
  readonly events: readonly string[];
  readonly coveredBy?: readonly string[];
}

/** A battle-moment cue no hook covers: the packs are not consulted, the stand-in plays. */
export const NO_RECORDING: EventPlan = Object.freeze({ events: Object.freeze([] as string[]) });

export interface EventRule {
  at: Selector;
  plan: EventPlan;
}

/** The hooks as rules, in table order: first match wins, so specific hooks precede general ones. */
export function compileRules(hooks: readonly Hook[]): readonly EventRule[] {
  return hooks.map((h) => ({
    at: h.at,
    plan: { events: h.cue === null ? [] : [h.cue, ...(h.then ?? [])], ...(h.coveredBy ? { coveredBy: h.coveredBy } : {}) },
  }));
}

const inMany = <T>(value: T | null | undefined, want: Many<T>): boolean => {
  if (value === null || value === undefined) return false;
  return Array.isArray(want) ? (want as readonly T[]).includes(value) : value === want;
};

/** Does `at` match this ask, given the v2 key the voice chose (`null` when it chose none)? */
export function matches(at: Selector, ask: VoiceAsk, key: string | null): boolean {
  if (!inMany(ask.moment, at.moment)) return false;
  if (at.on !== undefined && (at.on === null ? key !== null : key !== `v2:${at.on}`)) return false;
  if (at.side !== undefined && !inMany(ask.actor?.side, at.side)) return false;
  if (at.targetSide !== undefined && !inMany(ask.target?.side, at.targetSide)) return false;
  if (at.targetVoice !== undefined && ask.target?.voice !== at.targetVoice) return false;
  if (at.actor !== undefined && !(ask.actor && at.actor.includes(ask.actor.id))) return false;
  if (at.weapon !== undefined && !(ask.actor?.weapon && at.weapon.includes(ask.actor.weapon))) return false;
  const action = ask.action;
  if (at.ability !== undefined) {
    const id = action?.abilityId;
    if (!id) return false;
    if (at.ability instanceof RegExp ? !at.ability.test(id) : !at.ability.includes(id)) return false;
  }
  if (at.item !== undefined && !(action?.isItem && action.commandId && at.item.includes(action.commandId))) return false;
  if (at.isItem !== undefined && (action?.isItem === true) !== at.isItem) return false;
  if (at.command !== undefined && !(action && at.command.includes(action.commandKind))) return false;
  if (at.status !== undefined && !(ask.status && at.status.includes(ask.status))) return false;
  if (at.tier !== undefined && (action?.tier ?? 1) !== at.tier) return false;
  if (at.nth !== undefined && (at.nth === 'first' ? ask.nth !== 0 : ask.nth === 0)) return false;
  if (at.landing !== undefined && (at.landing === 'first' ? (ask.landed ?? 0) !== 0 : (ask.landed ?? 0) === 0)) return false;
  if (at.stage !== undefined && ask.stage !== at.stage) return false;
  if (at.to !== undefined && !(ask.to && at.to.includes(ask.to))) return false;
  if (at.bare !== undefined && (action === null) !== at.bare) return false;
  return true;
}

/** The plan of the first rule that matches, or `null`. */
export function planFor(rules: readonly EventRule[], ask: VoiceAsk, key: string | null): EventPlan | null {
  for (const rule of rules) if (matches(rule.at, ask, key)) return rule.plan;
  return null;
}

/** Make a hook; a function so a table reads as one line per row. */
export function hook(game: EventGame, row: string, cue: string, at: Selector, more: { then?: readonly string[]; coveredBy?: readonly string[] } = {}): Hook {
  return { game, row, cue, at, ...more };
}

/** A quiet hook: `at` has no original of its own and stands down while `coveredBy` plays. */
export function quiet(game: EventGame, row: string, at: Selector, coveredBy: readonly string[]): Hook {
  return { game, row, cue: null, at, coveredBy };
}

/** The moments that land a cue on a target: the first of them an action plays is its landing (`Selector.landing`). */
export const LANDING_MOMENTS: readonly string[] = ['damage', 'heal', 'revive', 'status', 'ko', 'miss', 'petrify-shatter'];

/**
 * A move whose ONE recorded sample plays at its first landing (the "at the move's landing" rows). Its other
 * landings stand down while the original plays. `who` selects the action (ability ids, a pattern, or actor ids).
 */
export function atLanding(game: EventGame, row: string, cue: string, who: Pick<Selector, 'ability' | 'actor'>, then?: readonly string[]): Hook[] {
  return [
    hook(game, row, cue, { moment: LANDING_MOMENTS, ...who, landing: 'first' }, then ? { then } : {}),
    quiet(game, row, { moment: LANDING_MOMENTS, ...who, landing: 'later' }, [cue]),
  ];
}

/**
 * A move whose ONE recorded sample plays when the move opens (`attack` or `cast`), and which covers the move's
 * landings too (an enemy's "attack and blow", Cross Cleave).
 */
export function atOpening(game: EventGame, row: string, cue: string, who: Pick<Selector, 'ability' | 'actor' | 'command'>, moments: Many<string> = ['attack', 'cast']): Hook[] {
  return [hook(game, row, cue, { moment: moments, ...who }), quiet(game, row, { moment: LANDING_MOMENTS, ...who }, [cue])];
}

/**
 * The plan for a cue: the first matching hook's chain, `NO_RECORDING` for a v2 cue no hook covers, or `null` for
 * a moment the voice leaves to the presenter's own first-bank cue (nothing to look up).
 */
export function eventPlan(rules: Readonly<Record<EventGame, readonly EventRule[]>>, ask: VoiceAsk, key: string | null): EventPlan | null {
  const hit = planFor(rules[ask.game], ask, key);
  if (hit) return hit;
  return key !== null && isV2Key(key) ? NO_RECORDING : null;
}

/** A row with no battle hook: a menu key, a flow slot a screen plays, or open (nothing to answer it yet). */
export interface Unhooked {
  kind: 'menu' | 'flow' | 'open';
  why: string;
}

export const menu = (why = 'the key plays by its own name (voiceKey), not at a battle moment'): Unhooked => ({ kind: 'menu', why });
export const flow = (why: string): Unhooked => ({ kind: 'flow', why });
export const open = (why: string): Unhooked => ({ kind: 'open', why });
