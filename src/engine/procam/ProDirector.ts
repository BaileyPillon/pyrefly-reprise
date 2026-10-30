/**
 * THE PRO CAMERA'S DIRECTOR (`?camera=pro`, conference demo, lane "pro-camera", 2026-10-23): the {@link ShotDirector} `BattleMoments` asks at every beat, for Chapter I (FFX, Seymour Flux)
 * and Chapter IV (FFX-2, Bahamut) only. Pure: it talks to the camera through the optional `CameraPort.pro`, to the figures through `BattleStage`; no `three`, no DOM. The runs themselves are
 * built in `ProPlays.ts`; this file decides which beat gets which, who owns the camera, and when the director declines.
 *
 * Bailey's picks (2026-10-22): "Real game's shots, E33 polish" and "Camera on every action". What each beat gets:
 *
 * | beat | Chapter I (FFX) | Chapter IV (FFX-2) |
 * |---|---|---|
 * | plain attack | an Expedition 33-style move: push toward the exchange, follow on the lunge, settle on contact (`ProAttack.ts`) [ours] | the same, lighter [ours]; the group follower and the run-in's truck already move the frame |
 * | cast, item, skill | the real caster close shot, variant 2 (the low push that keeps both figures whole) unless `?castshot=`; a cut in when the view changes a lot (the real game hard-cuts) | no shot of its own: the follower frames it, as the real auto camera does |
 * | black-magic landing | the real landing shot A, B or C on the first blow | -- |
 * | Seymour's moves | the real start shot (a slow push on his face), then the real launch shot, squeezed to our move; the two big launches (Total Annihilation, Cross Cleave) on an authored low frame [ours] | -- |
 * | killing blow | the push along the run [ours], then the real tilted close shot at the blow | -- |
 * | special, Mega Flare | -- | a push on the special's pair; a low wide pull on Mega Flare [ours] |
 * | victory | the real close-up of the last actor | declined: the sources withhold the pose in Chapter IV; the follower hands the frame back |
 * | a hit | TAKEN: the run in flight owns the blow, so the game's own hit cut to the target and its A-13 horizon roll do not play while the camera is on (the real FFX leaves its default view alone on a hit; FFX-2 never cuts per action) | taken, the same |
 * | the rest (KO, turn start, command accepted, opening, telegraph, form change) | declined: the game's own camera, as the real game | declined |
 *
 * Rules that hold everywhere: nothing plays over an open FFX-2 command menu (`camera.pro` is absent while the target frame is held, D-357); nothing plays at fast-forward 'skip'; the upright phone
 * keeps its slice rules (A-12); REDUCE MOTION plays every shot as a held frame (a cut in, a cut out) and the plain-attack move not at all; the `steady` and `originals` comfort presets decline everything
 * (the player asked for a camera that holds); a blend whose view changes a lot is a cut, a small one a glide (`ProLayer.comfortMs`). A beat the director takes returns true, so
 * `BattleMoments` makes none of its own camera moves for it; a beat it declines (false) plays as it does today. A cast it takes it also gives the cast's wind-up hold back
 * (`ActionShot.castHold`): `BattleMoments` returns before its own sleep, so without that the spell landed 0.5 s earlier than it does today.
 *
 * The switch is the layer's too (`ProCamPort.setGate(proCamOn)`, set at the first beat): flipped off in the middle of a shot, the run ends in 320 ms and the FFX-2 follower goes home in 320 ms,
 * without waiting for another beat. An open FFX-2 command menu sends the follower home in the same 320 ms (D-357; `ProFollower.HOME_MS`).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleStage, CameraPort } from '../BattlePresenterPorts.ts';
import { cameraPreset } from '../CameraPreset.ts';
import { punchMode } from '../feel/FeelSwitch.ts';
import { momentPunch } from '../feel/PunchCurve.ts';
import { specialFx } from '../spellfx/SpellFxSpecials.ts';
import type { ActionShot, ActorShot, BattleStartShot, ImpactShot, ShotAnswer, ShotCtx, ShotDirector } from '../ShotDirector.ts';
import { demoChapter } from '../motion/DemoGate.ts';
import { autoCameraFor, scriptedShot } from './ProAutoStage.ts';
import { proCamGame, proCamOn, proDofOn } from './ProCamSwitch.ts';
import { FOLLOW_SAFE, ProFollower, lcg, type Member } from './ProFollower.ts';
import { attackPlay, bossStartPlay, castPlay, feet, ffx2Play, heightOf, isSpecial, landingPlay, overdrivePlay, victoryPlay, type Play, type PlayEnv, type Timing } from './ProPlays.ts';
import type { LiveSpot } from './ProTrack.ts';
import type { ProCamPort, ProFit, ProRun } from './ProTypes.ts';

/** What each kind of run is worth when two want the camera at once (FFX-2's bars overlap). */
const RANK: Readonly<Record<string, number>> = { attack: 1, cast: 2, boss: 3, special: 3, finisher: 4, mega: 5 };

/** The director last made, for the debug surface (`debug/procamApi.ts`). */
export const proDebug: { director: ProDirector | null } = { director: null };

export class ProDirector implements ShotDirector, PlayEnv {
  private headline: CombatantId | null = null;
  private owner: CombatantId | null = null;
  private ownerRank = 0;
  private ownerKind = '';
  private runs = 0;
  /** The run the director started and still owns (it takes the blow's contact beat). */
  private curRun: ProRun | null = null;
  private lastParty: CombatantId | null = null;
  /** The combatants that acted as an aeon this fight: the victory frames one that struck last whole (`aeonVictoryPlay`). */
  private readonly aeons = new Set<CombatantId>();
  private launched = false;
  private follower: ProFollower | null = null;
  private followerPort: ProCamPort | null = null;
  private stillNow = false;
  private readonly rng = lcg(11);
  /** The last shots played, for the debug surface and the checks. */
  readonly log: Array<{ at: number; beat: string; what: string }> = [];

  constructor(readonly stage: BattleStage) {
    proDebug.director = this;
  }

  /** The FFX-2 follower's state for the debug surface, or null. */
  followerState(): { candidate: number; weight: number } | null {
    return this.follower ? { candidate: this.follower.candidate, weight: Math.round(this.follower.weight * 1000) / 1000 } : null;
  }

  /** Tests and the debug surface: the shots played so far. */
  get played(): number {
    return this.runs;
  }

  // ------------------------------------------------------------------------------------ what the plays read (PlayEnv)

  get still(): boolean {
    return this.stillNow;
  }

  game(): 'ffx' | 'ffx2' | null {
    return proCamGame();
  }

  dice(): number {
    return this.rng();
  }

  fo(ids: string[]): string[] | undefined {
    return proDofOn() ? ids : undefined;
  }

  /** FFX: a tall foe is fitted by its body (the real shots frame the body and let the crown go). FFX-2: whole -- the pick is "nobody cropped", and Bahamut's head and wings are the picture. */
  fitId(id: CombatantId): string {
    const a = this.stage.actor(id);
    return a && heightOf(a) > 3 && this.game() !== 'ffx2' ? `${id}@0-0.75` : id;
  }

  bossOf(fallback: CombatantId): CombatantId {
    if (this.headline !== null && this.stage.actor(this.headline)) return this.headline;
    let best: CombatantId | null = null;
    let h = 0;
    for (const id of this.stage.staged()) {
      const a = this.stage.sideOf(id) === 'enemy' ? this.stage.actor(id) : undefined;
      if (a && heightOf(a) > h) {
        h = heightOf(a);
        best = id;
      }
    }
    return best ?? fallback;
  }

  spot(id: CombatantId, targetId?: CombatantId): LiveSpot | null {
    const a = this.stage.actor(id);
    if (!a) return null;
    const t = targetId !== undefined ? this.stage.actor(targetId) : undefined;
    return { actor: feet(a), target: t ? feet(t) : undefined, height: heightOf(a) };
  }

  // ------------------------------------------------------------------------------------ gates

  private note(beat: string, what: string): void {
    if (this.log.length > 400) this.log.shift();
    this.log.push({ at: typeof performance === 'undefined' ? 0 : Math.round(performance.now()), beat, what });
  }

  /** The camera's directed port when the director may play now, else null (the beat then plays as it does today). */
  private ready(ctx: ShotCtx): ProCamPort | null {
    this.stillNow = ctx.reducedMotion === true;
    if (!proCamOn() || ctx.skipping) return null;
    const preset = cameraPreset();
    if (preset === 'steady' || preset === 'originals') return null;
    const port = (ctx.camera as CameraPort).pro;
    if (!port) return null;
    port.setGate(proCamOn); // the layer asks the switch itself every frame: flipped off in the middle of a shot, the shot ends (the playtest key `;`)
    return port.aspect < 1 ? null : port;
  }

  private timing(ctx: ShotCtx): Timing {
    const scale = ctx.ms(1000) / 1000;
    return { ms: (b) => ctx.ms(b), rate: scale > 0.01 ? 1 / scale : 1 };
  }

  /** Start a play, unless a bigger one holds the camera. */
  private begin(port: ProCamPort, play: Play, who: CombatantId): void {
    const rank = RANK[play.kind] ?? 1;
    if (port.active && this.owner !== null && this.ownerRank > rank) {
      this.note('begin', `${play.run.id} refused: ${this.ownerKind} holds the camera`);
      return;
    }
    port.play(play.run);
    this.curRun = play.run;
    this.owner = who;
    this.ownerRank = rank;
    this.ownerKind = play.kind;
    this.runs++;
    const ours = play.what?.match(/\[ours[^\]]*\]/)?.[0]; // a shot the sources do not give says so in the log
    this.note('begin', `${play.run.id} (${play.kind}) for ${who}${ours ? ` ${ours}` : ''}`);
  }

  /** The first blow's shot replaces whatever plays (a cut or a blend by its own `inMs`); the action stays the owner. */
  private replace(port: ProCamPort, play: Play): void {
    this.launched = true;
    this.curRun = null;
    port.play(play.run);
    this.ownerKind = play.kind;
    this.note('impact', play.what ?? play.run.id);
  }

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
        const a = stage.actor(id);
        if (a && stage.sideOf(id) !== undefined) out.push({ id, feet: feet(a), height: heightOf(a) });
      }
      return out;
    };
    const ids = (): string[] => stage.staged().filter((id) => stage.sideOf(id) !== undefined); // everyone whole: the girls and Bahamut, head and wings too (the pick, "nobody cropped")
    const fit: ProFit = { ids: [], safe: FOLLOW_SAFE };
    this.follower = new ProFollower(
      {
        members,
        held: () => !proCamOn() || port.aspect < 1 || (stage.camera as CameraPort).holding === true, // the switch off, an upright phone, or a command menu: home in 320 ms, then the rig's own
        scripted: () => scriptedShot(demoChapter(), (stage.camera as CameraPort).rigName), // a mid-battle script cut to a shot of its own that the scene draws by position (Chapter XI's between-links plate): the rig's own pose, at once
        still: () => this.stillNow,
        fitK: (pose) => port.fitK(pose, { ...fit, ids: ids() }),
      },
      autoCameraFor(demoChapter()), // Chapter IV: the generated Bevelle camera; a chapter with a stage row (`ProAutoStage.AUTO_STAGES`, Leblanc) has its candidates retargeted about its own plate's front
    );
    this.followerPort = port;
    const f = this.follower;
    port.setAmbient((dt, base) => f.step(dt, base)); // always stepped: while held it is the way home and then the rig's own pose
    this.note('follower', 'installed');
  }

  // ------------------------------------------------------------------------------------ beats

  battleStart(ctx: BattleStartShot): ShotAnswer {
    this.headline = ctx.boss?.id ?? null;
    this.owner = null;
    this.ownerRank = 0;
    this.launched = false;
    this.lastParty = null;
    this.aeons.clear();
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
    const { actor, targets, action } = ctx;
    if (actor.side === 'party' || actor.side === 'aeon') this.lastParty = actor.id;
    if (actor.side === 'aeon') this.aeons.add(actor.id);
    this.launched = false;
    const t = this.timing(ctx);
    const ability = action.abilityId ?? '';
    let play: Play | null | undefined = null;
    if (this.game() === 'ffx') {
      if (actor.side === 'enemy') {
        play = bossStartPlay(this, ctx, ability, t);
        if (play === undefined && action.kind === 'attack') play = attackPlay(this, ctx, 'attack', t);
      } else if (action.kind === 'attack') {
        play = attackPlay(this, ctx, action.lethal === true ? 'finisher' : 'attack', t);
      } else if (action.kind === 'cast' || action.kind === 'item') {
        play = castPlay(this, ctx, targets[0]?.id, t);
      }
    } else if (this.game() === 'ffx2') {
      const special = specialFx(ability, 'ffx2') === 'megaflare' ? 'mega' : action.kind === 'cast' && isSpecial(ability) ? 'special' : null;
      play = special ? ffx2Play(this, ctx, special, t) : action.kind === 'attack' ? attackPlay(this, ctx, 'attack', t) : null;
    }
    if (play) this.begin(port, play, actor.id);
    else if (this.still && action.kind === 'attack') this.note('actionOpen', 'attack held: reduce motion');
    // taking the beat takes the cast's wind-up hold with it (`BattleMoments` returns before its own sleep): the director gives it back, so a spell lands when it always did
    return action.kind === 'cast' && ctx.castHold ? ctx.castHold().then(() => true) : true;
  }

  impact(ctx: ImpactShot): boolean {
    const port = this.ready(ctx);
    if (!port) return false;
    const first = ctx.hitIndex === 0;
    if (first && ctx.action && ctx.actor && this.game() === 'ffx' && !this.launched) {
      const play = landingPlay(this, ctx, this.timing(ctx), this.ownerKind === 'finisher');
      if (play) this.replace(port, play);
    }
    // the run the blow belongs to takes its contact beat
    if (first && this.curRun?.onEvent && this.owner === ctx.actor?.id) this.curRun.onEvent('impact');
    if (ctx.heavy && !this.still) {
      const fx = (this.stage as { fx?: { enabled(): boolean } }).fx;
      const punch = momentPunch(punchMode(), fx?.enabled() === true);
      if (punch > 0) void ctx.camera.punch(punch, ctx.ms(460));
    }
    return true;
  }

  actionClose(ctx: ActorShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port) return false;
    if (this.game() === 'ffx2' && this.follower) this.follower.effectEnd();
    this.end(port, ctx.actor?.id, this.timing(ctx).ms(ctx.action?.kind === 'attack' && this.game() === 'ffx' ? 720 : 650));
    return true;
  }

  overdriveStart(ctx: ActionShot): ShotAnswer {
    const port = this.ready(ctx);
    if (!port || this.game() !== 'ffx') return false;
    const play = overdrivePlay(this, ctx, this.timing(ctx));
    if (!play) return false;
    this.begin(port, play, ctx.actor.id);
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
    if (this.game() !== 'ffx') {
      // FFX-2 Chapter IV: the sources withhold the victory pose; hand the frame back to the game's own victory rig
      this.end(port, undefined, 0);
      port.setAmbient(null);
      this.follower = null;
      return false;
    }
    const id = this.lastParty ?? this.stage.staged().find((i) => this.stage.sideOf(i) === 'party');
    const play = id === undefined ? null : victoryPlay(this, id, this.timing(ctx), this.aeons.has(id));
    if (!play || id === undefined) return false;
    this.end(port, undefined, 0);
    this.begin(port, play, id);
    return true;
  }
}
