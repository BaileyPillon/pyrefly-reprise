/**
 * WHAT EACH BEAT PLAYS (PRO CAMERA, `?camera=pro`): the run factories the director (`ProDirector.ts`) calls. Pure on the stage's ports: no `three`, no DOM. Each answers the {@link Play} a beat
 * gets (the run, and what kind of run it is, for the director's rank when two want the camera), or null when nothing is played.
 *
 * Game case: the Chapter I plays are FFX only (the real shots of `data/procam/proShots.ts`, laid on the live figures by `ProShots.ts`); the specials and Mega Flare are FFX-2 only; the plain
 * attack is both (lighter in FFX-2). Which of these are the real game's and which are ours is in the table at the head of `ProDirector.ts`.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { ActorHandle, BattleStage } from '../BattlePresenterPorts.ts';
import type { ActionShot, ImpactShot } from '../ShotDirector.ts';
import { ATTACK_FFX, ATTACK_FFX2, attackRun } from './ProAttack.ts';
import { castShotChoice } from './ProCamSwitch.ts';
import { LAUNCH_CLOSER, aeonVictoryRun, centreOf, characterOf, closerKeys, finisherKeys, keyRun, laidShot, lowLaunchKeys, megaFlareRun, pickRow, rowsOf, specialRun } from './ProShots.ts';
import type { Key, LiveSpot } from './ProTrack.ts';
import type { ProRun, V3 } from './ProTypes.ts';

/** Seymour Flux's moves that have a camera shot, by ability id: the real start shot group, the real launch group, or the authored low frame. */
export const BOSS_MOVES: Readonly<Record<string, { readonly start?: string; readonly launch?: string; readonly low?: boolean }>> = {
  'total-annihilation': { start: 'enemy.start.total-annihilation.v0', low: true },
  'cross-cleave': { low: true },
  'flare-self': { start: 'enemy.start.flare.v0', launch: 'enemy.launch.flare' },
  banish: { start: 'enemy.start.protect.v1', launch: 'enemy.launch.banish' },
  'full-life': { start: 'enemy.start.full-life.v0', launch: 'enemy.launch.full-life' },
};

/** The black-magic elements that have a landing shot, and the table group each plays. */
export const LANDING: Readonly<Record<string, string>> = { fire: 'fire', ice: 'fire', thunder: 'thunder', water: 'thunder' };

/** The lengths the squeezed real shots are given, ms (OURS; the real ones run 3.5 to 10.6 s over our 1 to 4 s moves). */
export const SQUEEZE = { start: 1700, launch: 3200, lowLaunch: 4200 } as const;

/** What a play is: the run, and its kind (`attack`, `cast`, `boss`, `special`, `finisher`, `mega`), which ranks it against another. */
export interface Play {
  readonly run: ProRun;
  readonly kind: string;
  /** For the director's log. */
  readonly what?: string;
}

/** Durations at the live playback speed, and the run's clock rate. */
export interface Timing {
  ms(base: number): number;
  readonly rate: number;
}

/** What the plays read of the director and the stage. */
export interface PlayEnv {
  readonly stage: BattleStage;
  /** REDUCE MOTION. */
  readonly still: boolean;
  game(): 'ffx' | 'ffx2' | null;
  /** One draw from the camera's own repeatable dice. */
  dice(): number;
  /** The figures a shot keeps sharp (the soft background), or none when `?camdof=off`. */
  fo(ids: string[]): string[] | undefined;
  /** A fit id for a figure: whole, or its body only for a tall foe. */
  fitId(id: CombatantId): string;
  /** The headline boss, else the tallest foe, else `fallback`. */
  bossOf(fallback: CombatantId): CombatantId;
  spot(id: CombatantId, targetId?: CombatantId): LiveSpot | null;
}

/** Heights read from a standing figure: `headPoint` is 0.92 of the height (`PaintedActor.headPoint`). */
export function heightOf(a: ActorHandle): number {
  const h = (a.headPoint().y - a.position.y) / 0.92;
  return Number.isFinite(h) ? Math.min(7, Math.max(1.2, h)) : 1.75;
}

export const feet = (a: ActorHandle): V3 => [a.position.x, a.position.y, a.position.z];

/** An FFX-2 special: a skill that is not a spell (Darkness, Charon, a trigger...). The ids carry the dressphere; a mage's spells and every plain attack are not. */
export function isSpecial(ability: string): boolean {
  return /^x2-(?:dark-knight|warrior|samurai|gunner|thief|berserker|trainer|lady-luck)-(?!attack$|cure|fire|blizzard|thunder|water|esuna|life|shell|protect|haste)/.test(ability) || /darkness|charon|mega-flare/.test(ability);
}

const held = (env: PlayEnv, t: Timing): number => (env.still ? 0 : t.rate);

/** A plain attack (both games), or the killing blow's push along the run (FFX). Reduce Motion plays none. */
export function attackPlay(env: PlayEnv, ctx: ActionShot, kind: 'attack' | 'finisher', t: Timing): Play | null {
  const { stage } = env;
  const game = env.game();
  const { actor, targets } = ctx;
  const a = stage.actor(actor.id);
  const target = targets[0]?.id;
  const tg = target !== undefined ? stage.actor(target) : undefined;
  if (!a || env.still) return null;
  if (kind === 'finisher' && game === 'ffx' && tg && target !== undefined) {
    const char = characterOf(stage.artOf?.(actor.id), actor.id);
    const rows = rowsOf(`attack.${char}.finisher`);
    const spot = env.spot(actor.id, target);
    if (rows[0] && spot) {
      const keys = finisherKeys(laidShot(rows[0], spot, 'party', null), feet(a), feet(tg));
      const run = keyRun(`finisher.run.${char}`, keys.slice(0, 2), { inMs: t.ms(300), outMs: t.ms(700), fit: { ids: [actor.id, env.fitId(target)], safe: { x: 0.9, y: 0.95 } }, sway: 0.2, focus: env.fo([actor.id, target]) });
      return { run: { ...run, rate: t.rate }, kind: 'finisher' };
    }
  }
  const params = game === 'ffx2' ? ATTACK_FFX2 : ATTACK_FFX;
  const fit = target !== undefined ? [env.fitId(actor.id), env.fitId(target)] : [env.fitId(actor.id)]; // a 5 m boss acting is fitted like a 5 m boss targeted: by `fitId`, never whole by id (M1: that fit alone popped the eye 1.4 to 3.2 m)
  const run = attackRun(`attack.${actor.id}`, a, tg, fit, params);
  return { run: { ...run, inMs: t.ms(params.inMs), outMs: t.ms(params.outMs), rate: t.rate, onEvent: run.onEvent }, kind: 'attack' };
}

/** A cast or an item (FFX): the real caster close shot. */
export function castPlay(env: PlayEnv, ctx: ActionShot, target: CombatantId | undefined, t: Timing): Play | null {
  const { stage } = env;
  const { actor } = ctx;
  const char = characterOf(stage.artOf?.(actor.id), actor.id);
  const ally = target !== undefined && stage.sideOf(target) === stage.sideOf(actor.id);
  const group = ally && char === 'yuna' ? 'cast.start.yuna.ally' : `cast.start.${char}`;
  const row = pickRow(rowsOf(group), castShotChoice(), env.dice());
  const spot = env.spot(actor.id, target);
  if (!row || !spot) return null;
  const run = keyRun(row.id, laidShot(row, spot, 'party', null), {
    inMs: t.ms(420),
    outMs: t.ms(650),
    fit: { ids: target !== undefined && target !== actor.id ? [actor.id, env.fitId(target)] : [actor.id], safe: { x: 0.92, y: 0.95 } },
    breathe: 0.3,
    still: env.still,
    focus: env.fo(target !== undefined ? [actor.id, target] : [actor.id]),
  });
  return { run: { ...run, rate: held(env, t) }, kind: 'cast' };
}

/** Seymour's own move (FFX): its real start shot. `undefined`: not one of his shot moves (the director plays a plain attack for an attack); `null`: his move with no start shot. */
export function bossStartPlay(env: PlayEnv, ctx: ActionShot, ability: string, t: Timing): Play | null | undefined {
  const move = BOSS_MOVES[ability];
  if (!move) return undefined;
  if (!move.start) return null; // Cross Cleave: no start shot in the real game; its launch plays at the first blow
  const bossId = env.bossOf(ctx.actor.id);
  const row = rowsOf(move.start)[0];
  const spot = env.spot(bossId, ctx.targets[0]?.id);
  if (!row || !spot) return null;
  const run = keyRun(row.id, laidShot(row, spot, 'live', SQUEEZE.start), { inMs: t.ms(350), outMs: t.ms(450), fit: { ids: [env.fitId(bossId)], safe: { x: 0.92, y: 0.95 } }, breathe: 0.25, still: env.still, focus: env.fo([bossId]) });
  return { run: { ...run, rate: held(env, t) }, kind: 'boss' };
}

/** A special or Mega Flare (FFX-2). */
export function ffx2Play(env: PlayEnv, ctx: ActionShot, kind: 'special' | 'mega', t: Timing): Play | null {
  const { stage } = env;
  const { actor, targets } = ctx;
  const a = stage.actor(actor.id);
  if (!a) return null;
  const party = stage.staged().filter((id) => stage.sideOf(id) === 'party');
  const foe = stage.staged().find((id) => stage.sideOf(id) === 'enemy');
  let run: ProRun;
  if (kind === 'mega') {
    const group: V3[] = [...party, ...(foe ? [foe] : [])].map((id) => feet(stage.actor(id)!));
    const focus = centreOf(group);
    run = megaFlareRun('mega-flare', [focus[0], 1.4, focus[2]], env.still, { ids: [...party, ...(foe ? [`${foe}@0-0.7`] : [])], safe: { x: 0.86, y: 0.9 } });
  } else {
    const tg = (targets[0] !== undefined ? stage.actor(targets[0].id) : undefined) ?? (foe ? stage.actor(foe) : undefined);
    if (!tg) return null;
    run = specialRun(`special.${actor.id}`, feet(a), heightOf(a), feet(tg), heightOf(tg), env.still, { ids: [...party, `${targets[0]?.id ?? foe}@0-0.6`], safe: { x: 0.9, y: 0.92 } });
  }
  return { run: { ...run, inMs: env.still ? 0 : t.ms(run.inMs), outMs: env.still ? 0 : t.ms(run.outMs), rate: held(env, t) }, kind };
}

/** An Overdrive's start (FFX): the real skill-start close shot. */
export function overdrivePlay(env: PlayEnv, ctx: ActionShot, t: Timing): Play | null {
  const { actor, targets } = ctx;
  const char = characterOf(env.stage.artOf?.(actor.id), actor.id);
  const group = rowsOf(`skill.start.${char}`).length ? `skill.start.${char}` : 'skill.start.tidus';
  const row = pickRow(rowsOf(group), castShotChoice(), env.dice());
  const spot = env.spot(actor.id, targets[0]?.id);
  if (!row || !spot) return null;
  const tall = (env.stage.actor(actor.id) ? heightOf(env.stage.actor(actor.id)!) : 0) > 3; // an aeon (Bahamut, about 5 m) backs further than a hero
  const ids = [tall ? actor.id : env.fitId(actor.id), ...(targets[0] !== undefined ? [env.fitId(targets[0].id)] : [])]; // an aeon whole, wings and head too; the foe by its body
  const run = keyRun(row.id, laidShot(row, spot, 'party', null), { inMs: t.ms(420), outMs: t.ms(700), fit: { ids, safe: { x: 0.92, y: 0.95 }, maxK: tall ? 4 : undefined }, breathe: 0.3, still: env.still, focus: env.fo([actor.id]) });
  return { run: { ...run, rate: held(env, t) }, kind: 'cast' };
}

/**
 * The victory frame keeps clear of the real HUD (the options book's mock-up was drawn with the HUD hidden): the party plates fill the lower right (x above 0.3, y below -0.43 of the frame, NDC) and
 * the turn-order column the right edge (x above 0.72). The winning party's union stands at `VICTORY_AT` and fits inside `VICTORY_SAFE` half-extents about it: x from -0.88 to 0.32, y from
 * -0.42 to 0.82. OURS.
 */
export const VICTORY_SAFE = { x: 0.6, y: 0.62 } as const;
export const VICTORY_AT = { x: -0.28, y: 0.2 } as const;
/** The party members who stand with the one the victory close-up is about: within this many metres of him (the whole party, as the pick keeps "both heroes whole"). */
const VICTORY_COMPANY_M = 4.5;

/** An aeon's victory frame (OURS): the aeon whole, standing left of the middle so the title and the party plates stay clear: half-extents of the box it fits inside and where its middle stands (NDC). */
export const AEON_VICTORY_SAFE = { x: 0.46, y: 0.78 } as const;
export const AEON_VICTORY_AT = { x: -0.26, y: 0.02 } as const;

/** The victory of an aeon that landed the last blow (FFX, Chapter I; OURS, labelled so in the log): see {@link aeonVictoryRun}. Null when the aeon is not on the stage. */
export function aeonVictoryPlay(env: PlayEnv, id: CombatantId, t: Timing): Play | null {
  const a = env.stage.actor(id);
  if (!a) return null;
  const run = aeonVictoryRun(`victory.aeon.${id}`, feet(a), heightOf(a), { still: env.still, fit: { ids: [id], safe: AEON_VICTORY_SAFE, to: AEON_VICTORY_AT, maxK: 3 }, focus: env.fo([id]) });
  return { run: { ...run, rate: held(env, t) }, kind: 'cast', what: `${run.id} [ours: the sources give no aeon victory shot]` };
}

/** The victory (FFX): the real close-up of `id`, the last party member to act, with whoever stands beside him kept whole; an aeon that struck last is framed whole instead ({@link aeonVictoryPlay}). */
export function victoryPlay(env: PlayEnv, id: CombatantId, t: Timing, aeon = false): Play | null {
  if (aeon) return aeonVictoryPlay(env, id, t);
  const char = characterOf(env.stage.artOf?.(id), id);
  const row = pickRow(rowsOf(`victory.${char}`), castShotChoice() === 'random' ? 'random' : 0, env.dice());
  const spot = env.spot(id, env.bossOf(id));
  if (!row || !spot) return null;
  const me = env.stage.actor(id);
  const company = env.stage.staged().filter((o) => {
    const a = env.stage.actor(o);
    return o !== id && env.stage.sideOf(o) === 'party' && a !== undefined && me !== undefined && Math.hypot(a.position.x - me.position.x, a.position.z - me.position.z) <= VICTORY_COMPANY_M;
  });
  const run = keyRun(row.id, laidShot(row, spot, 'party', null), { inMs: t.ms(700), outMs: t.ms(500), fit: { ids: [id, ...company], safe: VICTORY_SAFE, to: VICTORY_AT, maxK: 4 }, breathe: 0.35, still: env.still, focus: env.fo([id, ...company]) });
  return { run: { ...run, rate: held(env, t) }, kind: 'cast' };
}

/**
 * The first blow of an action (FFX): the killing blow's real tilted close shot (when `finisherOwned`: the push along the run is playing), Seymour's launch (the real shot, or the authored low
 * frame), or a black-magic landing for a party caster. The run replaces whatever plays, with no blend in where it is a cut.
 */
export function landingPlay(env: PlayEnv, ctx: ImpactShot, t: Timing, finisherOwned: boolean): Play | null {
  const { stage } = env;
  const { actor, action, target } = ctx;
  if (!actor || !action) return null;
  const ability = action.abilityId ?? '';
  if (ctx.lethal && actor.side !== 'enemy' && finisherOwned && stage.actor(actor.id)) {
    const char = characterOf(stage.artOf?.(actor.id), actor.id);
    const rows = rowsOf(`attack.${char}.finisher`);
    const spot = env.spot(actor.id, target.id);
    if (rows[0] && spot) {
      const keys = finisherKeys(laidShot(rows[0], spot, 'party', null), spot.actor, spot.target ?? spot.actor);
      const tail = keys.slice(2).map((k) => ({ ...k, t: k.t - keys[2]!.t }));
      const run = keyRun(`finisher.blow.${char}`, tail, { inMs: 0, outMs: t.ms(700), fit: { ids: [actor.id], safe: { x: 0.92, y: 0.95 } }, still: env.still, sway: 0.2, focus: env.fo([actor.id, target.id]) });
      return { run: { ...run, rate: held(env, t) }, kind: 'finisher', what: `${run.id} (the killing blow)` };
    }
  }
  if (actor.side === 'enemy') {
    const move = BOSS_MOVES[ability];
    if (!move) return null;
    const bossId = env.bossOf(actor.id);
    const spot = env.spot(bossId, target.id);
    if (!spot) return null;
    const party = stage.staged().filter((id) => stage.sideOf(id) === 'party').map((id) => feet(stage.actor(id)!));
    let keys: Key[] | null = null;
    let id = `launch.${ability}`;
    if (move.low) {
      keys = lowLaunchKeys(party, spot.actor, SQUEEZE.lowLaunch);
    } else if (move.launch) {
      const row = pickRow(rowsOf(move.launch), 'random', env.dice());
      if (row) {
        keys = closerKeys(laidShot(row, spot, 'live', SQUEEZE.launch), LAUNCH_CLOSER); // the real sweep reads far and small on our stage: the party was 13 percent of the frame
        id = row.id;
      }
    }
    if (!keys) return null;
    const run = keyRun(id, keys, { inMs: env.still ? 0 : move.low ? t.ms(500) : 0, outMs: t.ms(650), fit: { ids: party.length ? [env.fitId(target.id)] : [], safe: { x: 0.92, y: 0.95 } }, breathe: 0.2, still: env.still, focus: env.fo([target.id]) });
    return { run: { ...run, rate: held(env, t) }, kind: 'boss', what: `${id} (Seymour's launch)` };
  }
  const group = LANDING[ctx.element ?? ''];
  if (group && action.kind === 'cast') {
    const char = characterOf(stage.artOf?.(actor.id), actor.id) === 'tidus' ? 'tidus' : 'lulu';
    const row = pickRow(rowsOf(`cast.launch.${group}.${char}`), 'random', env.dice());
    const spot = env.spot(actor.id, target.id);
    if (!row || !spot) return null;
    const run = keyRun(row.id, laidShot(row, spot, 'party', null), { inMs: 0, outMs: t.ms(650), fit: { ids: [actor.id, env.fitId(target.id)], safe: { x: 0.94, y: 0.95 } }, breathe: 0.25, still: env.still, focus: env.fo([target.id]) });
    return { run: { ...run, rate: held(env, t) }, kind: 'cast', what: `${row.id} (black-magic landing)` };
  }
  return null;
}
