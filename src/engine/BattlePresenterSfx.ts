/**
 * The presenter's half of the sound hookup: every cue the beats ask for goes through `playCue`, which
 * asks the chapter's voice (`PresenterDeps.sfxVoice`, D-302's recorded set) what to play for this
 * moment, and otherwise plays exactly what the presenter always played (`SFX_FALLBACKS`).
 *
 * The presenter knows the moment: the event on screen, who is acting and with what command, how many
 * events of the same kind this action has already played, how a beaten enemy leaves. The voice knows
 * the chapter: the game, the engine state (an FFX-2 girl's dressphere) and the ability rows. So this
 * module hands over raw ids and the voice resolves them (`src/app/screens/battleSfxVoice.ts`).
 *
 * Moments that are new with the hookup (the item-use sound at action start, the parry before a
 * counter) play only when a voice answers them, so a chapter without one (FF7, every unit test) hears
 * exactly what it heard before.
 *
 * Same rules as the other beat modules: no `three`, no DOM, ports only. Game case: shared plumbing.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { SFX_FALLBACKS } from './BattlePresenterPorts.ts';
import { DEPARTURE_KINDS } from './BattlePresenterDepartures.ts';
import { LANDING_MOMENTS } from '../audio/sfxV2/eventCues.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { paceFactor } from './pace.ts';
import { STRIKE_BEAT_MS, strikeBeatNow } from './StrikeBeat.ts';

/** What the presenter tells the voice about one cue. */
export interface SfxAsk {
  /** The moment: the presenter's own cue name (`attack`, `cast`, `damage`, `heal`, `status`, ...) or a data `sfx` key. */
  moment: string;
  /** The event being played, when there is one. */
  event: BattleEvent | null;
  /** Who acts: the event's source, else the actor on screen. */
  actorId: CombatantId | null;
  targetId: CombatantId | null;
  /** The action this cue belongs to (its command and resolved ability), `null` when nothing is on screen. */
  action: { command: { kind: string; id?: string }; abilityId?: string } | null;
  /** How many events of this moment the same action played before this one. */
  nth: number;
  /** A beaten enemy's departure (`BattlePresenterDepartures.ts`), `null` for a fiend's dissolve. */
  departure: string | null;
  /** How many landing cues (damage, heal, status, KO...) the same action has already played: 0 for its first landing. */
  landed: number;
}

/**
 * What the chapter's voice answers. `key` is the stand-in to play (absent: the presenter's own cue plays); `events`
 * are the recorded originals to look up first, in order, and `coveredBy` the originals of the same move whose
 * playing silences this stand-in (SFX parity, `audio/sfxV2/eventCues.ts`). With no parity pack listed the mixer
 * ignores `events` and `coveredBy`, so the stand-in plays exactly as it always did.
 */
export type SfxVoiced = { key?: string; gain?: number; events?: readonly string[]; coveredBy?: readonly string[] };
export type SfxVoice = (ask: SfxAsk) => SfxVoiced | null;

/**
 * Moments whose sound is asked for BEFORE the beat it belongs on, and how far ahead (ms at timeScale 1): the swing is
 * asked for at the action's start and its impact is the lunge's apex (`StrikeBeat.ts`). The mixer uses it only to
 * place a recorded original's peak on the beat (`audio/sfxV2/beatTiming.ts`); the shipped stand-ins ignore it.
 */
const BEAT_AHEAD_MS: Readonly<Record<string, number>> = { attack: STRIKE_BEAT_MS };

const LANDING = new Set<string>(LANDING_MOMENTS);

/** Moments the hookup added: silent without a voice, so a chapter without one is unchanged. */
const VOICE_ONLY = new Set(['item', 'counter']);

interface Action {
  serial: number;
  command: { kind: string; id?: string };
  abilityId?: string;
  counts: Map<string, number>;
  /** The recorded originals this action has asked for so far (the first name of each chain): what `coveredBy` is checked against. */
  asked: Set<string>;
}

interface State {
  serial: number;
  event: BattleEvent | null;
  onScreen: Action | null;
  byActor: Map<CombatantId, Action>;
}

const states = new WeakMap<EventCtx, State>();

function stateOf(ctx: EventCtx): State {
  let s = states.get(ctx);
  if (!s) states.set(ctx, (s = { serial: 0, event: null, onScreen: null, byActor: new Map() }));
  return s;
}

/** Called for every event before it plays: which event is on screen, and which action it belongs to. */
export function noteSfxEvent(ctx: EventCtx, event: BattleEvent): void {
  const s = stateOf(ctx);
  s.event = event;
  if (event.type === 'action-start') {
    const command = event.command as { kind: string; id?: string };
    const action: Action = { serial: ++s.serial, command: { kind: command.kind, ...(command.id ? { id: command.id } : {}) }, counts: new Map(), asked: new Set() };
    if (event.abilityId) action.abilityId = event.abilityId;
    s.onScreen = action;
    s.byActor.set(event.actorId, action);
  } else if (event.type === 'action-end') {
    s.onScreen = null;
  }
}

function sourceOf(event: BattleEvent | null): CombatantId | null {
  const e = event as { sourceId?: CombatantId; actorId?: CombatantId; enemyId?: CombatantId } | null;
  return e?.sourceId ?? e?.actorId ?? e?.enemyId ?? null;
}

function targetOf(event: BattleEvent | null): CombatantId | null {
  const e = event as { targetId?: CombatantId; who?: CombatantId } | null;
  return e?.targetId ?? e?.who ?? null;
}

/**
 * The moment a cue stands for, from the event being played: the beats name some cues by their sound
 * (`damage` arrives as `fire` or `damage-crit`, a revive and a Dressphere change reuse `heal` and
 * `summon`), and the voice needs the moment itself.
 */
function momentOf(event: BattleEvent | null, name: string): string {
  switch (event?.type) {
    case 'damage':
      return event.amount < 0 ? 'heal' : 'damage';
    case 'heal':
    case 'revive':
    case 'miss':
    case 'ko':
    case 'summon':
    case 'spherechange':
    case 'charge':
    case 'form-change':
    case 'victory':
    case 'counter':
      return event.type;
    case 'overdrive-gauge':
      return 'overdrive';
    case 'status-add':
      return name === 'petrify-shatter' ? name : 'status';
    case 'sfx':
      return event.key;
    default:
      return name;
  }
}

function ask(ctx: EventCtx, name: string): { ask: SfxAsk; action: Action | null } {
  const s = stateOf(ctx);
  const event = s.event;
  const moment = momentOf(event, name);
  const actorId = sourceOf(event) ?? ctx.actingId;
  // FFX-2's ATB overlaps actions: a blow resolves by its own striker's latest action (as the spell effects do).
  const action = s.onScreen ? ((actorId && s.byActor.get(actorId)) || s.onScreen) : null;
  const nth = action ? (action.counts.get(moment) ?? 0) : 0;
  let landed = 0;
  if (action) {
    for (const [m, n] of action.counts) if (LANDING.has(m)) landed += n; // before this cue is counted
    action.counts.set(moment, nth + 1);
  }
  const targetId = targetOf(event);
  return {
    ask: {
      moment,
      event,
      actorId,
      targetId,
      action: action ? { command: action.command, ...(action.abilityId ? { abilityId: action.abilityId } : {}) } : null,
      nth,
      departure: targetId ? (DEPARTURE_KINDS[targetId] ?? null) : null,
      landed,
    },
    action,
  };
}

/** ms at timeScale 1 -> the ms the presenter's own waits take at the current speed and pacing (`BattlePresenter.sleep`). */
function scaled(ctx: EventCtx, ms: number): number {
  const speed = typeof ctx.speed === 'function' ? ctx.speed() : 'normal'; // a test double may carry no speed
  return Math.max(0, ms * SPEED_SCALE[speed] * (ctx.deps.timeScale ?? 1) * paceFactor('action'));
}

/** Play one presenter cue: the voice's answer, else the presenter's own cue with its fallbacks. */
export function playCue(ctx: EventCtx, name: string, opts?: { volume?: number; delay?: number }): void {
  const audio = ctx.deps.audio;
  if (!audio) return;
  let voiced: SfxVoiced | null = null;
  let moment = name;
  let action: Action | null = null;
  let actorId: CombatantId | undefined;
  try {
    if (ctx.deps.sfxVoice) {
      const built = ask(ctx, name);
      moment = built.ask.moment;
      action = built.action;
      actorId = built.ask.actorId ?? undefined;
      voiced = ctx.deps.sfxVoice(built.ask) ?? null;
    }
  } catch {
    voiced = null; // a voice that fails costs its answer, never the beat
  }
  if (!voiced && VOICE_ONLY.has(name)) return;
  const key = voiced?.key ?? SFX_FALLBACKS[name] ?? name;
  const volume = voiced?.gain !== undefined ? (opts?.volume ?? 1) * voiced.gain : opts?.volume;
  let o: ParityOpts | undefined = volume === undefined ? opts : { ...opts, volume };
  if (voiced) o = withParity(ctx, o, voiced, moment, action, actorId);
  // Unknown keys fall back to a generic cue rather than going silent, so a
  // boss's bespoke `sfxKey` never has to exist before the fight is playable.
  try {
    audio.playSfx(key, o);
  } catch {
    try {
      // The generic hit is the old fallback, unchanged: it asks for no recorded original and no beat.
      const { events: _events, coveredBy: _coveredBy, beatMs: _beatMs, ...plain } = o ?? {};
      audio.playSfx(SFX_FALLBACKS['generic']!, o === undefined ? o : plain);
    } catch {
      /* audio is optional; never break playback for a missing cue */
    }
  }
}

type ParityOpts = { volume?: number; delay?: number; events?: readonly string[]; coveredBy?: readonly string[]; beatMs?: number };

/**
 * The parity options of a voiced cue: the originals to look up, the originals whose playing silences this stand-in
 * (only those this very action has asked for, so a move that never opened with its sample is not silenced), and the
 * beat the cue's peak belongs on. The mixer ignores all three unless a parity pack supplies the sound.
 */
function withParity(ctx: EventCtx, o: ParityOpts | undefined, voiced: SfxVoiced, moment: string, action: Action | null, actorId?: CombatantId): ParityOpts | undefined {
  const extra: ParityOpts = {};
  if (voiced.events) {
    extra.events = voiced.events;
    const first = voiced.events[0];
    if (first) action?.asked.add(first);
  }
  const covered = voiced.coveredBy?.filter((c) => action?.asked.has(c));
  if (covered && covered.length > 0) extra.coveredBy = covered;
  const ahead = moment === 'attack' ? strikeBeatNow(actorId ? ctx.stage?.actor?.(actorId)?.strikeHeft?.() : undefined) : BEAT_AHEAD_MS[moment]; // the sampled strike's contact when the new curves are on (motion pass, lane "core"): a heavy body's strike lands later
  if (ahead !== undefined && voiced.events) extra.beatMs = scaled(ctx, ahead);
  return Object.keys(extra).length === 0 ? o : { ...o, ...extra };
}
