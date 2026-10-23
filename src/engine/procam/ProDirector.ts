/**
 * THE PRO CAMERA'S DIRECTOR (`?camera=pro`, conference demo, lane "pro-camera", 2026-10-23): the {@link ShotDirector} `BattleMoments` asks at every beat, for Chapter I (FFX, Seymour Flux)
 * and Chapter IV (FFX-2, Bahamut) only. Pure: it talks to the camera through the optional `CameraPort.pro`, to the figures through `BattleStage`; no `three`, no DOM.
 *
 * Bailey's picks (2026-10-22): "Real game's shots, E33 polish" and "Camera on every action". What each beat gets:
 *
 * | beat | Chapter I (FFX) | Chapter IV (FFX-2) |
 * |---|---|---|
 * | plain attack | an Expedition 33-style move: push toward the exchange, follow on the lunge, settle on contact (`ProAttack.ts`) [ours] | the same, lighter [ours]; the group follower and the run-in's truck already move the frame |
 * | cast, item, skill | the real caster close shot, variant 2 (the low push that keeps both figures whole) unless `?castshot=`; eased in and out (the real game hard-cuts) | no shot of its own: the follower frames it, as the real auto camera does |
 * | black-magic landing | the real landing shot A, B or C on the first blow | -- |
 * | Seymour's moves | the real start shot (a slow push on his face), then the real launch shot, squeezed to our move; the two big launches (Total Annihilation, Cross Cleave) on an authored low frame [ours] | -- |
 * | killing blow | the push along the run [ours], then the real tilted close shot at the blow | -- |
 * | special, Mega Flare | -- | a push on the special's pair; a low wide pull on Mega Flare [ours] |
 * | victory | the real close-up of the last actor | declined: the sources withhold the pose in Chapter IV; the follower hands the frame back |
 * | the rest (hit, KO, turn start, command accepted, opening, telegraph, form change) | declined: the game's own camera, as the real game | declined |
 *
 * Rules that hold everywhere: nothing plays over an open FFX-2 command menu (`camera.pro` is absent while the target frame is held, D-357); nothing plays at fast-forward 'skip'; the upright phone
 * keeps its slice rules (A-12); REDUCE MOTION plays every shot as a held frame (a cut in, a cut out) and the plain-attack move not at all; the `steady` and `originals` comfort presets decline everything
 * (the player asked for a camera that holds); the FFX-2 camera never cuts while a bar is live (every FFX-2 entrance and exit is a glide). A beat the director takes returns true, so
 * `BattleMoments` makes none of its own camera moves for it; a beat it declines (false) plays as it does today.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { ActorHandle, BattleStage, CameraPort } from '../BattlePresenterPorts.ts';
import { cameraPreset } from '../CameraPreset.ts';
import { punchMode } from '../feel/FeelSwitch.ts';
import { momentPunch } from '../feel/PunchCurve.ts';
import { specialFx } from '../spellfx/SpellFxSpecials.ts';
import type { ActionShot, ActorShot, BattleStartShot, ImpactShot, ShotAnswer, ShotCtx, ShotDirector } from '../ShotDirector.ts';
import { PRO_AUTO_CAMERA } from '../../data/procam/proShots.ts';
import { ATTACK_FFX, ATTACK_FFX2, attackRun } from './ProAttack.ts';
import { castShotChoice, proCamGame, proCamOn } from './ProCamSwitch.ts';
import { FOLLOW_SAFE, ProFollower, lcg, type Member } from './ProFollower.ts';
import { centreOf, characterOf, finisherKeys, keyRun, laidShot, lowLaunchKeys, megaFlareRun, pickRow, rowsOf, specialRun, type Character } from './ProShots.ts';
import { sampleKeys, type Key, type LiveSpot } from './ProTrack.ts';
import type { ProCamPort, ProFit, ProRun, V3 } from './ProTypes.ts';

/** Seymour Flux's moves that have a camera shot, by ability id: the real start shot group, the real launch group, or the authored low frame. */
const BOSS_MOVES: Readonly<Record<string, { readonly start?: string; readonly launch?: string; readonly low?: boolean }>> = {
  'total-annihilation': { start: 'enemy.start.total-annihilation.v0', low: true },
  'cross-cleave': { low: true },
  'flare-self': { start: 'enemy.start.flare.v0', launch: 'enemy.launch.flare' },
  banish: { start: 'enemy.start.protect.v1', launch: 'enemy.launch.banish' },
  'full-life': { start: 'enemy.start.full-life.v0', launch: 'enemy.launch.full-life' },
};

/** The black-magic elements that have a landing shot, and the table group each plays. */
const LANDING: Readonly<Record<string, string>> = { fire: 'fire', ice: 'fire', thunder: 'thunder', water: 'thunder' };

/** What each kind of run is worth when two want the camera at once (FFX-2's bars overlap). */
const RANK: Readonly<Record<string, number>> = { attack: 1, cast: 2, boss: 3, special: 3, finisher: 4, mega: 5 };

/** The lengths the squeezed real shots are given, ms (OURS; the real ones run 3.5 to 10.6 s over our 1 to 4 s moves). */
const SQUEEZE = { start: 1700, launch: 3200, lowLaunch: 4200 } as const;

/** Heights read from a standing figure: `headPoint` is 0.92 of the height (`PaintedActor.headPoint`). */
function heightOf(a: ActorHandle): number {
  const h = (a.headPoint().y - a.position.y) / 0.92;
  return Number.isFinite(h) ? Math.min(7, Math.max(1.2, h)) : 1.75;
}

const feet = (a: ActorHandle): V3 => [a.position.x, a.position.y, a.position.z];

/** The director last made, for the debug surface (`debug/procamApi.ts`). */
export const proDebug: { director: ProDirector | null } = { director: null };

export class ProDirector implements ShotDirector {
  private headline: CombatantId | null = null;
  private owner: CombatantId | null = null;
  private ownerRank = 0;
  private ownerKind = '';
  private runs = 0;
  private lastParty: CombatantId | null = null;
  private launched = false;
  private follower: ProFollower | null = null;
  private followerPort: ProCamPort | null = null;
  private still = false;
  private readonly dice = lcg(11);
  /** The last shot played, for the debug surface and the checks. */
  readonly log: Array<{ at: number; beat: string; what: string }> = [];

  constructor(private readonly stage: BattleStage) {
    proDebug.director = this;
  }

  /** The FFX-2 follower's state for the debug surface, or null. */
  followerState(): { candidate: number; weight: number } | null {
    return this.follower ? { candidate: this.follower.candidate, weight: Math.round(this.follower.weight * 1000) / 1000 } : null;
  }

  // ------------------------------------------------------------------------------------ gates

  private note(beat: string, what: string): void {
    if (this.log.length > 400) this.log.shift();
    this.log.push({ at: typeof performance === 'undefined' ? 0 : Math.round(performance.now()), beat, what });
  }

  /** The camera's directed port when the director may play now, else null (the beat then plays as it does today). */
  private ready(ctx: ShotCtx): ProCamPort | null {
    this.still = ctx.reducedMotion === true;
    if (!proCamOn() || ctx.skipping) return null;
    const preset = cameraPreset();
    if (preset === 'steady' || preset === 'originals') return null;
    const port = (ctx.camera as CameraPort).pro;
    if (!port || port.aspect < 1) return null;
    return port;
  }

  private game(): 'ffx' | 'ffx2' | null {
    return proCamGame();
  }

  /** Durations at the live playback speed, and the run's clock rate. */
  private timing(ctx: ShotCtx): { ms: (b: number) => number; rate: number } {
    const scale = ctx.ms(1000) / 1000;
    return { ms: (b) => ctx.ms(b), rate: scale > 0.01 ? 1 / scale : 1 };
  }

  private spot(id: CombatantId, targetId?: CombatantId): LiveSpot | null {
    const a = this.stage.actor(id);
    if (!a) return null;
    const t = targetId !== undefined ? this.stage.actor(targetId) : undefined;
    return { actor: feet(a), target: t ? feet(t) : undefined, height: heightOf(a) };
  }

  /** A fit id for a figure: whole, or its body only (0 to 0.75) when it is a tall foe whose crown and wings may leave the frame. */
  private fitId(id: CombatantId): string {
    const a = this.stage.actor(id);
    return a && heightOf(a) > 3 ? `${id}@0-0.75` : id;
  }

  private begin(port: ProCamPort, run: ProRun, who: CombatantId, kind: string): void {
    const rank = RANK[kind] ?? 1;
    if (port.active && this.owner !== null && this.ownerRank > rank) {
      this.note('begin', `${run.id} refused: ${this.ownerKind} holds the camera`);
      return;
    }
    port.play(run);
    this.curRun = run;
    this.owner = who;
    this.ownerRank = rank;
    this.ownerKind = kind;
    this.runs++;
    this.note('begin', `${run.id} (${kind}) for ${who}`);
  }

  private curRun: ProRun | null = null;

  private end(port: ProCamPort, who: CombatantId | undefined, outMs?: number): void {
    if (who !== undefined && this.owner !== null && this.owner !== who) return; // another action owns the camera now
    port.stop(outMs);
    this.owner = null;
    this.ownerRank = 0;
    this.ownerKind = '';
    this.curRun = null;
  }

  // ------------------------------------------------------------------------------------ the FFX-2 follower

  private ensureFollower(port: ProCamPort): void {
    if (this.game() !== 'ffx2' || (this.follower && this.followerPort === port)) return;
    const stage = this.stage;
    const members = (): readonly Member[] => {
      const out: Member[] = [];
      for (const id of stage.staged()) {
        const side = stage.sideOf(id);
        const a = stage.actor(id);
        if (!a || side === undefined) continue;
        out.push({ id, feet: feet(a), height: heightOf(a) });
      }
      return out;
    };
    const ids = (): string[] => stage.staged().filter((id) => stage.sideOf(id) !== undefined).map((id) => (stage.sideOf(id) === 'enemy' ? `${id}@0-0.8` : id));
    const fit: ProFit = { ids: [], safe: FOLLOW_SAFE };
    this.follower = new ProFollower(
      {
        members,
        held: () => !proCamOn() || (stage.camera as CameraPort).holding === true,
        still: () => this.still,
        fitK: (pose) => port.fitK(pose, { ...fit, ids: ids() }),
      },
      PRO_AUTO_CAMERA,
    );
    this.followerPort = port;
    const f = this.follower;
    port.setAmbient((dt, base) => (proCamOn() ? f.step(dt, base) : base));
    this.note('follower', 'installed');
  }

  // ------------------------------------------------------------------------------------ beats

  battleStart(ctx: BattleStartShot): ShotAnswer {
    this.headline = ctx.boss?.id ?? null;
    this.owner = null;
    this.ownerRank = 0;
    this.launched = false;
    this.lastParty = null;
    return false; // the opening, the reveal and the name plate are the game's
  }

  turnStart(ctx: ActorShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    this.ensureFollower(port);
    if (ctx.actor?.side === 'party') this.lastParty = ctx.actor.id;
    if (port.active && this.owner === null) port.stop(this.timing(ctx).ms(650)); // a run nobody owns
    return false;
  }

  actionOpen(ctx: ActionShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    this.ensureFollower(port);
    const game = this.game();
    const { actor, targets, action } = ctx;
    if (actor.side === 'party' || actor.side === 'aeon') this.lastParty = actor.id;
    this.launched = false;
    const target = targets[0]?.id;
    const t = this.timing(ctx);
    const ability = action.abilityId ?? '';
    const lethal = action.lethal === true;
    if (game === 'ffx') {
      if (actor.side === 'enemy') this.openBossFfx(port, ctx, ability, t);
      else if (action.kind === 'attack') this.openAttack(port, ctx, lethal ? 'finisher' : 'attack', t);
      else if (action.kind === 'cast' || action.kind === 'item') this.openCast(port, ctx, target, t);
    } else if (game === 'ffx2') {
      const special = specialFx(ability, 'ffx2') === 'megaflare' ? 'mega' : action.kind === 'cast' && this.isSpecial(ability) ? 'special' : null;
      if (special) this.openFfx2Special(port, ctx, special, t);
      else if (action.kind === 'attack') this.openAttack(port, ctx, 'attack', t);
    }
    return true;
  }

  /** An FFX-2 special: a skill that is not a spell (Darkness, Charon, a trigger...). The data marks them `damageType: 'other'` or a skill category; the ids carry the dressphere. */
  private isSpecial(ability: string): boolean {
    return /^x2-(?:dark-knight|warrior|samurai|gunner|thief|berserker|trainer|lady-luck)-(?!attack$|cure|fire|blizzard|thunder|water|esuna|life|shell|protect|haste)/.test(ability) || /darkness|charon|mega-flare/.test(ability);
  }

  // ---- plain attacks and the killing blow
  private openAttack(port: ProCamPort, ctx: ActionShot, kind: 'attack' | 'finisher', t: { ms: (b: number) => number; rate: number }): void {
    const game = this.game();
    const { actor, targets } = ctx;
    const a = this.stage.actor(actor.id);
    const target = targets[0]?.id;
    const tg = target !== undefined ? this.stage.actor(target) : undefined;
    if (!a) return;
    if (this.still) {
      this.note('actionOpen', `attack held: reduce motion`);
      return;
    }
    if (kind === 'finisher' && game === 'ffx' && tg && target !== undefined) {
      const char = characterOf(this.stage.artOf?.(actor.id), actor.id);
      const rows = rowsOf(`attack.${char}.finisher`);
      const spot = this.spot(actor.id, target);
      if (rows[0] && spot) {
        const keys = finisherKeys(laidShot(rows[0], spot, 'party', null), feet(a), feet(tg));
        const first = keys.slice(0, 2); // the push along the run; the tilted close shot is the blow's (`impact`)
        const run = keyRun(`finisher.run.${char}`, first.map((k, i) => (i === 0 ? { ...k } : k)), {
          inMs: t.ms(300),
          outMs: t.ms(700),
          fit: { ids: [actor.id, this.fitId(target)], safe: { x: 0.9, y: 0.95 } },
          sway: 0.2,
          focus: [actor.id, target],
        });
        this.begin(port, { ...run, rate: t.rate }, actor.id, 'finisher');
        return;
      }
    }
    const params = game === 'ffx2' ? ATTACK_FFX2 : ATTACK_FFX;
    const fit = target !== undefined ? [actor.id, this.fitId(target)] : [actor.id];
    const run = attackRun(`attack.${actor.id}`, a, tg, fit, params);
    this.begin(port, { ...run, inMs: t.ms(params.inMs), outMs: t.ms(params.outMs), rate: t.rate, onEvent: run.onEvent }, actor.id, 'attack');
  }

  // ---- casts, items, skills (FFX)
  private openCast(port: ProCamPort, ctx: ActionShot, target: CombatantId | undefined, t: { ms: (b: number) => number; rate: number }): void {
    const { actor } = ctx;
    const char = characterOf(this.stage.artOf?.(actor.id), actor.id);
    const ally = target !== undefined && this.stage.sideOf(target) === this.stage.sideOf(actor.id);
    const group = ally && char === 'yuna' ? 'cast.start.yuna.ally' : `cast.start.${char}`;
    const row = pickRow(rowsOf(group), castShotChoice(), this.dice());
    const spot = this.spot(actor.id, target);
    if (!row || !spot) return;
    const keys = laidShot(row, spot, 'party', null);
    const run = keyRun(row.id, keys, {
      inMs: t.ms(420),
      outMs: t.ms(650),
      fit: { ids: target !== undefined && target !== actor.id ? [actor.id, this.fitId(target)] : [actor.id], safe: { x: 0.92, y: 0.95 } },
      breathe: 0.3,
      still: this.still,
      focus: target !== undefined ? [actor.id, target] : [actor.id],
    });
    this.begin(port, { ...run, rate: this.still ? 0 : t.rate }, actor.id, 'cast');
  }

  // ---- Seymour's moves (FFX)
  private openBossFfx(port: ProCamPort, ctx: ActionShot, ability: string, t: { ms: (b: number) => number; rate: number }): void {
    const { actor, targets, action } = ctx;
    const move = BOSS_MOVES[ability];
    const bossId = this.headline ?? actor.id;
    if (!move) {
      if (action.kind === 'attack') this.openAttack(port, ctx, 'attack', t);
      return;
    }
    if (!move.start) return; // Cross Cleave: no start shot in the real game; its launch plays at the first blow
    const row = rowsOf(move.start)[0];
    const spot = this.spot(bossId, targets[0]?.id);
    if (!row || !spot) return;
    const keys = laidShot(row, spot, 'live', SQUEEZE.start);
    const run = keyRun(row.id, keys, {
      inMs: t.ms(350),
      outMs: t.ms(450),
      fit: { ids: [this.fitId(bossId)], safe: { x: 0.92, y: 0.95 } },
      breathe: 0.25,
      still: this.still,
      focus: [bossId],
    });
    this.begin(port, { ...run, rate: this.still ? 0 : t.rate }, actor.id, 'boss');
  }

  // ---- specials and Mega Flare (FFX-2)
  private openFfx2Special(port: ProCamPort, ctx: ActionShot, kind: 'special' | 'mega', t: { ms: (b: number) => number; rate: number }): void {
    const { actor, targets } = ctx;
    const a = this.stage.actor(actor.id);
    if (!a) return;
    const party = this.stage.staged().filter((id) => this.stage.sideOf(id) === 'party');
    const foe = this.stage.staged().find((id) => this.stage.sideOf(id) === 'enemy');
    let run: ProRun;
    if (kind === 'mega') {
      const group: V3[] = [...party, ...(foe ? [foe] : [])].map((id) => feet(this.stage.actor(id)!));
      const focus = centreOf(group);
      const ids = [...party, ...(foe ? [`${foe}@0-0.7`] : [])];
      run = megaFlareRun('mega-flare', [focus[0], 1.4, focus[2]], this.still, { ids, safe: { x: 0.86, y: 0.9 } });
    } else {
      const target = targets[0] !== undefined ? this.stage.actor(targets[0].id) : undefined;
      const tg = target ?? (foe ? this.stage.actor(foe) : undefined);
      if (!tg) return;
      run = specialRun(`special.${actor.id}`, feet(a), heightOf(a), feet(tg), heightOf(tg), this.still, { ids: [actor.id, `${targets[0]?.id ?? foe}@0-0.6`], safe: { x: 0.8, y: 0.88 } });
    }
    this.begin(port, { ...run, inMs: this.still ? 0 : t.ms(run.inMs), outMs: this.still ? 0 : t.ms(run.outMs), rate: this.still ? 0 : t.rate }, actor.id, kind);
  }

  impact(ctx: ImpactShot): boolean {
    const port = this.ready(ctx);
    if (!port) return false;
    const t = this.timing(ctx);
    const action = ctx.action;
    const first = ctx.hitIndex === 0;
    const game = this.game();
    if (first && action && ctx.actor && game === 'ffx') this.landing(port, ctx, t);
    // the run the blow belongs to takes its contact beat
    if (first && this.curRun?.onEvent && this.owner === ctx.actor?.id) this.curRun.onEvent('impact');
    if (ctx.heavy && !this.still) {
      const fx = (this.stage as { fx?: { enabled(): boolean } }).fx;
      const punch = momentPunch(punchMode(), fx?.enabled() === true);
      if (punch > 0) void ctx.camera.punch(punch, ctx.ms(460));
    }
    return true;
  }

  /** The first blow of an action: a landing shot, the launch of a boss move, the killing blow's close shot. */
  private landing(port: ProCamPort, ctx: ImpactShot, t: { ms: (b: number) => number; rate: number }): void {
    const { actor, action, target } = ctx;
    if (!actor || !action || this.launched) return;
    const ability = action.abilityId ?? '';
    // 1. the killing blow: the real tilted close shot, cut to at the blow
    if (ctx.lethal && actor.side !== 'enemy' && this.ownerKind === 'finisher' && this.stage.actor(actor.id)) {
      const char = characterOf(this.stage.artOf?.(actor.id), actor.id);
      const rows = rowsOf(`attack.${char}.finisher`);
      const spot = this.spot(actor.id, target.id);
      if (rows[0] && spot) {
        const keys = finisherKeys(laidShot(rows[0], spot, 'party', null), spot.actor, spot.target ?? spot.actor);
        const tail = keys.slice(2).map((k) => ({ ...k, t: k.t - keys[2]!.t }));
        const run = keyRun(`finisher.blow.${char}`, tail, { inMs: 0, outMs: t.ms(700), fit: { ids: [actor.id], safe: { x: 0.92, y: 0.95 } }, still: this.still, sway: 0.2, focus: [actor.id, target.id] });
        this.launched = true;
        this.curRun = null;
        port.play({ ...run, rate: this.still ? 0 : t.rate });
        this.ownerKind = 'finisher';
        this.note('impact', `${run.id} (the killing blow)`);
        return;
      }
    }
    // 2. Seymour's launch
    if (actor.side === 'enemy') {
      const move = BOSS_MOVES[ability];
      if (!move) return;
      const bossId = this.headline ?? actor.id;
      const spot = this.spot(bossId, target.id);
      if (!spot) return;
      const party = this.stage.staged().filter((id) => this.stage.sideOf(id) === 'party').map((id) => feet(this.stage.actor(id)!));
      let keys: Key[] | null = null;
      let id = `launch.${ability}`;
      if (move.low) {
        keys = lowLaunchKeys(party, spot.actor, SQUEEZE.lowLaunch);
      } else if (move.launch) {
        const row = pickRow(rowsOf(move.launch), 'random', this.dice());
        if (row) {
          keys = laidShot(row, spot, 'live', SQUEEZE.launch);
          id = row.id;
        }
      }
      if (!keys) return;
      const run = keyRun(id, keys, { inMs: this.still ? 0 : move.low ? t.ms(500) : 0, outMs: t.ms(650), fit: { ids: party.length ? [this.fitId(target.id)] : [], safe: { x: 0.92, y: 0.95 } }, breathe: 0.2, still: this.still, focus: [target.id] });
      this.launched = true;
      port.play({ ...run, rate: this.still ? 0 : t.rate });
      this.curRun = null;
      this.ownerKind = 'boss';
      this.note('impact', `${id} (Seymour's launch)`);
      return;
    }
    // 3. a black-magic landing for a party caster
    const group = LANDING[ctx.element ?? ''];
    if (group && action.kind === 'cast') {
      const char = characterOf(this.stage.artOf?.(actor.id), actor.id) === 'tidus' ? 'tidus' : 'lulu';
      const row = pickRow(rowsOf(`cast.launch.${group}.${char}`), 'random', this.dice());
      const spot = this.spot(actor.id, target.id);
      if (!row || !spot) return;
      const keys = laidShot(row, spot, 'party', null);
      const run = keyRun(row.id, keys, { inMs: 0, outMs: t.ms(650), fit: { ids: [actor.id, this.fitId(target.id)], safe: { x: 0.94, y: 0.95 } }, breathe: 0.25, still: this.still, focus: [target.id] });
      this.launched = true;
      port.play({ ...run, rate: this.still ? 0 : t.rate });
      this.curRun = null;
      this.ownerKind = 'cast';
      this.note('impact', `${row.id} (black-magic landing)`);
    }
  }

  actionClose(ctx: ActorShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    const t = this.timing(ctx);
    if (this.game() === 'ffx2' && this.follower) this.follower.effectEnd();
    this.end(port, ctx.actor?.id, t.ms(ctx.action?.kind === 'attack' && this.game() === 'ffx' ? 720 : 650));
    return true;
  }

  overdriveStart(ctx: ActionShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port || this.game() !== 'ffx') return false;
    const { actor, targets } = ctx;
    const t = this.timing(ctx);
    const char = characterOf(this.stage.artOf?.(actor.id), actor.id);
    const rows = rowsOf(rowsOf(`skill.start.${char}`).length ? `skill.start.${char}` : 'skill.start.tidus');
    const row = pickRow(rows, castShotChoice(), this.dice());
    const spot = this.spot(actor.id, targets[0]?.id);
    if (!row || !spot) return false;
    const run = keyRun(row.id, laidShot(row, spot, 'party', null), {
      inMs: t.ms(420),
      outMs: t.ms(700),
      fit: { ids: [actor.id], safe: { x: 0.92, y: 0.95 } },
      breathe: 0.3,
      still: this.still,
      focus: [actor.id],
    });
    this.begin(port, { ...run, rate: this.still ? 0 : t.rate }, actor.id, 'cast');
    return true;
  }

  overdriveEnd(ctx: ActorShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    this.end(port, ctx.actor?.id, this.timing(ctx).ms(700));
    return true;
  }

  victory(ctx: ShotCtx): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    const t = this.timing(ctx);
    if (this.game() !== 'ffx') {
      // FFX-2 Chapter IV: the sources withhold the victory pose; hand the frame back to the game's own victory rig
      this.end(port, undefined, 0);
      port.setAmbient(null);
      this.follower = null;
      return false;
    }
    const id = this.lastParty ?? this.stage.staged().find((i) => this.stage.sideOf(i) === 'party');
    if (id === undefined) return false;
    const char = characterOf(this.stage.artOf?.(id), id);
    const rows = rowsOf(`victory.${char}`);
    const row = pickRow(rows, castShotChoice() === 'random' ? 'random' : 0, this.dice());
    const foe = this.headline ?? this.stage.staged().find((i) => this.stage.sideOf(i) === 'enemy');
    const spot = this.spot(id, foe);
    if (!row || !spot) return false;
    const run = keyRun(row.id, laidShot(row, spot, 'party', null), {
      inMs: t.ms(700),
      outMs: t.ms(500),
      fit: { ids: [id], safe: { x: 0.88, y: 0.94 } },
      breathe: 0.35,
      still: this.still,
      focus: [id],
    });
    this.end(port, undefined, 0);
    this.begin(port, { ...run, rate: this.still ? 0 : t.rate }, id, 'cast');
    return true;
  }

  /** Tests and the debug surface: the shots played so far. */
  get played(): number {
    return this.runs;
  }

  /** The pose a key list holds at `tMs` (tests). */
  static poseAt = sampleKeys;

  /** The group's centre (tests). */
  static centre = centreOf;
}

export type { Character };
