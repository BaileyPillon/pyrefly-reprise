/**
 * The *moments*: every camera choreography the battle plays, in one place.
 *
 * FFX's battles are not one locked-off camera — they are a string of short,
 * named shots. The party slides in behind a swirl, the boss gets a slow push
 * and a name plate, every action punches in on the attacker and **cuts** to
 * the target on impact, a charged attack rides a slow zoom under a heartbeat
 * vignette, an Overdrive earns a letterbox and a slab, and the victory pose
 * gets its own rig before the results wipe.
 *
 * This module is the only thing that decides *which shot*. The handlers in
 * `BattlePresenterBeats.ts` used to carry three scattered `camera.moveTo`
 * calls and a boolean (`onActionRig`); everything camera-shaped has moved
 * here so a shot can be read, tuned and unit-tested as a whole.
 *
 * **Same rules as the rest of the presenter**: imports no `three` and touches
 * no DOM. The camera is a {@link CameraPort}, the letterbox/slab/vignette are
 * a {@link MomentsPort}, and both are optional — with neither wired the whole
 * module degrades to nothing happening, which is exactly what the headless
 * tests and `speed: 'skip'` want.
 *
 * ## Skipping
 *
 * Everything here is skippable, because the presenter's playback speed scales
 * every duration through {@link MomentDeps.speed}:
 *
 * - `'normal'` — authored timing.
 * - `'fast'` — 0.32x. Rig moves still happen (the frame would jump without
 *   them) but nothing *blocks*: slabs and letterbox holds resolve immediately.
 * - `'skip'` — no chrome at all, and every rig change becomes a hard snap, so
 *   a whole chapter resolves in milliseconds for e2e and the critic.
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { AudioPort, BattleStage, CameraPort, MomentsPort, PlaybackSpeed } from './BattlePresenterPorts.ts';
import { sfxGame, stingerFor } from '../audio/sfxV2/voicing.ts';
import { roarFor } from '../audio/sfxV2/weapons.ts';
import { momentEvents } from '../audio/sfxV2/battleVoice.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { paceFactor } from './pace.ts';
import { punchMode } from './feel/FeelSwitch.ts'; // the motion program's `?punch=`: today's 0.11 moment punch, or the 2 to 3 percent settle (`feel/PunchCurve.ts`)
import { momentPunch } from './feel/PunchCurve.ts';
import { fittedPush } from './ShotFit.ts';
import { factsFor, moveOfName } from './BattlePresenterStaging.ts';
import type { StagingPort } from './pro/staging/StagingPort.ts';
import { OD_OPEN_HOLD_MS } from './pro/staging/OpeningPlan.ts'; // lane "pro-staging": a staged big move's small name replaces the telegraph's text slab
import { stagingGame, stagingPieceOn } from './pro/staging/StagingSwitch.ts';
import { ShotRules } from './ShotRules.ts';
import { parkParty, slideParty, unparkParty } from './OpeningPark.ts'; // the opening's first frame under the boss card; the party's slide-on (post-fight-start)
import type { ShotAction, ShotActionInfo, ShotAnswer, ShotCtx, ShotDirector, ShotSubject } from './ShotDirector.ts';
import { ProDirector } from './procam/ProDirector.ts'; // `?camera=pro` (demo chapters only): the directed camera, asked when the scene publishes no director of its own
import { proCamOn } from './procam/ProCamSwitch.ts';

/** Authored durations, in ms at `speed: 'normal'`. The one place to tune. */
export const MOMENT_TIMING = {
  /** Battle start: the party's slide-in, then the hold before the boss push. */
  openSlide: 520,
  openHold: 240,
  /** Boss reveal: how long the slow push on the boss runs, and its name plate. */
  revealPush: 1500,
  revealSlab: 1400,
  /** Per action. */
  actionIn: 300,
  /** A spell holds on its caster before the cut; a sword swing does not. */
  castHold: 420,
  returnOut: 620,
  /** Overdrive. */
  odLetterbox: 260,
  odSlab: 1250,
  odPush: 900,
  odOut: 520,
  /** Boss charge telegraph. */
  telegraphZoom: 1200,
  telegraphSlab: 1200,
  /** Form change: the hold on the boss around the flash. */
  formHold: 900,
  /** Victory. */
  victoryIn: 900,
} as const;

/** How far each moment dollies in, as a fraction of the subject distance. */
export const MOMENT_PUSH = {
  action: 0.06,
  /** Spec "Motion & camera": 8deg push-in on Overdrive — a dolly, not an FOV
   * change (the texel ratio has to stay put, visual-bible §6.3), so it is
   * expressed here as the distance fraction that subtends the same amount. */
  overdrive: 0.14,
  telegraph: 0.1,
  reveal: 0.12,
} as const;

/** Spec "Motion & camera": "-4deg roll on every attack". */
export const ATTACK_ROLL_DEG = -4;

/**
 * The heartbeat a charge telegraph throbs at, per stage. Stage 2 — the attack
 * lands next turn — is a frightened pulse.
 *
 * Lives here rather than with the banner because two surfaces beat on it and
 * they must agree: this module's vignette ({@link BattleMoments.telegraph})
 * and the HUD's screen border (`src/ui/ffx/TelegraphBanner.ts`, which imports
 * it). They were the same two numbers written out twice until the drift was
 * obvious enough to fix.
 */
export const TELEGRAPH_BPM: Readonly<Record<1 | 2, number>> = { 1: 84, 2: 132 };

export interface MomentDeps {
  stage: BattleStage;
  moments?: MomentsPort | null;
  /** Lane "pro-staging": the staging's layer, which takes the Overdrive's opening (a small name, a light change) in place of the banner when its `opening` piece is on. */
  staging?: StagingPort | null;
  audio?: AudioPort | null;
  /**
   * The battle HUD, for the *one* thing a moment does to it: the opening keeps
   * it down until the encounter has established itself (see
   * {@link BattleMoments.battleStart}). Optional like every other port.
   */
  hud?: { setVisible(visible: boolean): void } | null;
  /** Speed-scaled sleep. The presenter's own, so a moment obeys fast/skip. */
  sleep(ms: number): Promise<void>;
  /** Live playback speed — read per call, because it can change mid-battle. */
  speed(): PlaybackSpeed;
}

/** A rig change shorter than this is indistinguishable from a cut. */
const CUT_THRESHOLD_MS = 24;

/**
 * Picks and plays the shots. One instance per battle, owned by the presenter's
 * {@link import('./BattlePresenterEvents.ts').EventCtx}.
 */
export class BattleMoments {
  private readonly deps: MomentDeps;

  /** True while the camera is parked on anything other than `idle`. */
  private onActionRig = false;
  /** Set between `overdriveOpen` and `overdriveClose`, so the close is safe to call blind. */
  private overdriveOpen = false;
  /** Set while a charge telegraph's held zoom and vignette are up. */
  private telegraphOpen = false;
  /** Actions opened so far, and the count when the telegraph went up. */
  private actions = 0;
  private telegraphAtAction = -1;
  /** Enemies whose reveal plate has already played, so a chained form does not replay it. */
  private readonly revealed = new Set<CombatantId>();
  /** Set while a Confirm press is cutting the opening short (`OpeningSkip.ts`, PR-0061): every wait collapses. */
  hurry = false;
  /** A-13: an attack was opened and its first hit has not landed yet. */
  private rollOwed = false;
  /** The action opened last and not yet closed: who, and what, for the beats after its opening (`ShotDirector.ts`). */
  private open: { actor: ShotSubject; action: ShotAction } | null = null;
  /** The scene's director took a held shot's opening, so its release is the director's too: a telegraph's, a form change's. */
  private telegraphDirected = false;
  private formDirected = false;
  /** The framing rules a shot is checked against (A-11, A-1, A-12; `ShotRules.ts`). */
  readonly shots: ShotRules;

  constructor(deps: MomentDeps) {
    this.deps = deps;
    this.shots = new ShotRules(deps.stage, () => deps.moments);
  }

  // ------------------------------------------------------------------ timing

  private get scale(): number {
    return this.hurry ? 0 : SPEED_SCALE[this.deps.speed()] * paceFactor('action'); // the pacing option (`pace.ts`)
  }

  /** True when playback is collapsing every wait (e2e, the critic). */
  get skipping(): boolean {
    return this.deps.speed() === 'skip';
  }

  /** The player's reduce-motion setting, as the overlay reports it (A-13). */
  get reducedMotion(): boolean {
    try {
      return this.deps.moments?.reduceMotion?.() === true;
    } catch {
      return false;
    }
  }

  /** The player's REDUCE FLASHES setting, as the overlay reports it (PR-0032): only an action's first blow flashes. */
  get reducedFlashes(): boolean {
    try {
      return this.deps.moments?.reduceFlashes?.() === true;
    } catch {
      return false;
    }
  }

  /** `base` ms at the current playback speed. */
  ms(base: number): number {
    return Math.max(0, base * this.scale);
  }

  private get cam(): CameraPort {
    return this.deps.stage.camera;
  }

  // ------------------------------------------------------------------- rigs

  /** The first of `names` this scene actually publishes, or null. */
  pick(...names: string[]): string | null {
    const have = this.cam.rigNames;
    for (const name of names) if (have.includes(name)) return name;
    return null;
  }

  /**
   * Which rig frames `id`. Every scene publishes `idle`/`action`; most also
   * publish `party` and `enemy`, which is what makes "push in on the attacker,
   * cut to the target" read as two different shots rather than one.
   */
  rigFor(id: CombatantId): string | null {
    const side = this.deps.stage.sideOf(id);
    return side === 'enemy'
      ? this.pick('enemy', 'action', 'idle')
      : this.pick('party', 'action', 'idle');
  }

  /** Move to `rig` over `base` ms, or cut to it when the speed collapses that. */
  private async move(rig: string | null, base: number): Promise<void> {
    if (!rig) return;
    const ms = this.ms(base);
    if (ms < CUT_THRESHOLD_MS) {
      this.cam.snapTo(rig);
      return;
    }
    await this.cam.moveTo(rig, ms);
  }

  /** A hard cut. Never tweened — that is the whole point of a cut. */
  private cut(rig: string | null): void {
    if (rig) this.cam.snapTo(rig);
  }

  // ------------------------------------------------------------- shot director

  /**
   * Ask the scene's shot director (`SceneStaging.shotDirector`, `ShotDirector.ts`) whether it takes this beat's camera. `undefined` when the scene publishes none or it has no handler for the
   * beat: the beat plays as it always has and nothing is awaited. A handler that throws, or whose promise rejects, answers `false`: a broken director costs the shot, never the battle.
   */
  private ask(call: (director: ShotDirector) => ShotAnswer | undefined): ShotAnswer | undefined {
    const director = this.deps.stage.shotDirector ?? this.proDirector();
    if (!director) return undefined;
    try {
      const answer = call(director);
      return answer instanceof Promise ? answer.catch(() => false) : answer;
    } catch {
      return undefined;
    }
  }

  /** `?camera=pro`: the directed camera for the two demo chapters (`procam/ProDirector.ts`), made at the first beat that asks; undefined whenever the switch is off, so every other chapter plays as it always has. */
  private pro: ProDirector | null = null;
  private proDirector(): ShotDirector | undefined {
    if (!proCamOn()) return undefined;
    return (this.pro ??= new ProDirector(this.deps.stage));
  }

  /** What every beat's context carries. */
  private shotCtx(): ShotCtx {
    return { camera: this.cam, speed: this.deps.speed(), skipping: this.skipping, ms: (base) => this.ms(base), ...(this.reducedMotion ? { reducedMotion: true } : {}) };
  }

  /** A combatant and its side, as the stage reports it. */
  private subject(id: CombatantId): ShotSubject {
    return { id, side: this.deps.stage.sideOf(id) };
  }

  /**
   * An explicit `camera` event from a boss's data file. Bypasses the shot
   * grammar (that is what it is for) but still obeys the playback speed.
   */
  async moveToRig(rig: string, base: number): Promise<void> {
    this.onActionRig = rig !== 'idle';
    await this.move(rig, base);
  }

  private cue(key: string, volume = 1, events?: readonly string[]): void {
    try {
      this.deps.audio?.playSfx(key, events ? { volume, events } : { volume });
    } catch {
      /* audio is optional; a moment never fails for a missing cue */
    }
  }

  // ------------------------------------------------------------ battle start

  /**
   * The opening: the party slides in from off-stage left, the frame settles on
   * `idle`, then the camera takes a slow push on the boss while its name plate
   * is up.
   *
   * `bossId`/`bossName` are optional — an encounter with no single headline
   * enemy (a pack of fiends) simply gets the party slide and no reveal.
   *
   * ## Why the HUD is down for this, and *only* this
   *
   * The reveal plate is full-bleed chrome hung off the right edge, which is
   * exactly where the CTB list lives — the first capture of this moment had
   * the boss's name printed straight through the turn order
   * (`docs/screenshots/bp1/moment-03-boss-reveal-live.png`, superseded). FFX
   * does not have that problem because its battle HUD is not up yet: the CTB
   * list and the command window arrive *after* the encounter has established
   * itself. So the opening keeps the HUD down and raises it on the way out.
   *
   * This is the only moment that touches HUD visibility. Mid-battle the HUD
   * stays up unconditionally — `BattleScreenCutscenes.ts` records why — and
   * although visual-bible §3.11.0 does author the CTB/command/party windows
   * sliding off for an Overdrive, `HudPort.setVisible` is too blunt an
   * instrument for it: it would take the damage numerals down with them, at
   * the exact moment the biggest number in the fight is printed. That one is
   * left to whoever owns `FFXBattleHud` (see `docs/handoff/bp1-moments.md`).
   */
  async battleStart(opts: {
    partyIds?: readonly CombatantId[];
    bossId?: CombatantId | null;
    bossName?: string | null;
  } = {}): Promise<void> {
    this.shots.headline = opts.bossId ?? this.shots.headline;
    const asked = this.ask((d) => d.battleStart?.({ ...this.shotCtx(), partyIds: opts.partyIds ?? [], boss: opts.bossId ? this.subject(opts.bossId) : null, bossName: opts.bossName ?? null }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the scene's director has the opening's camera: the party still walks on and the plate still shows
    if (!directed) {
      this.shots.fitPhone();
      const intro = this.shots.opening(this.pick('intro', 'idle')); // FFX-2 giants: the master, where the scene's intro would cut one (`ShotRules.opening`)
      this.cut(intro);
    }
    // E-PYRE (decision 61e): the enemy and aeon figures the stage is holding unseen come in now, beside the party's slide, and nothing waits for them:
    // a hurried or skipped opening shows them at once, and the opening's end lands any that is still on its way (`settleEntrances` below).
    // The figures are the stage's, not the camera's: they come in whether the scene's shot director took the opening's camera or not.
    this.enterFigures();
    if (this.skipping) {
      if (!directed) this.cut(this.pick('idle'));
      if (opts.bossId) this.revealed.add(opts.bossId);
      return unparkParty(this.deps.stage, opts.partyIds ?? []); // nothing slides on: a party parked under the card (never at `skip`: no card) comes back
    }

    this.setHudVisible(false);
    try {
      await this.slidePartyIn(opts.partyIds ?? []);
      if (!directed) await this.move(this.pick('idle'), MOMENT_TIMING.openHold);
      this.onActionRig = false;

      if (opts.bossId) await this.revealBoss(opts.bossId, opts.bossName ?? null, directed);
    } finally {
      // Whatever happened — an abort mid-reveal, a scene with no rigs, a
      // throw out of the art layer — the player gets their HUD back.
      this.setHudVisible(true);
      this.settleFigures();
    }
  }

  /** E-PYRE: let the held enemy figures in (see `BattleStage.enter`). A moment never fails for a figure: a stage that throws here is a stage that shows its figures. */
  private enterFigures(): void {
    try {
      void this.deps.stage.enter?.({ instant: this.skipping || this.hurry })?.catch(() => undefined);
    } catch {
      this.settleFigures(true);
    }
  }

  /**
   * E-PYRE: the opening is over. A hurried or skipped one lands every figure at once; otherwise an entrance still playing carries on to its end beside the first
   * menu, which it never delays, and a figure that has not begun begins (see `BattleStage.settleEntrances`).
   */
  private settleFigures(now = this.hurry || this.skipping): void {
    try {
      this.deps.stage.settleEntrances?.(now);
    } catch {
      /* nothing to settle */
    }
  }

  /** The HUD is optional and never worth failing a moment over. */
  private setHudVisible(visible: boolean): void {
    try {
      this.deps.hud?.setVisible(visible);
    } catch {
      /* a HUD that cannot hide is not a reason to lose the opening */
    }
  }

  /** The party walks on (`OpeningPark.slideParty`): staggered, each one body-width further out of frame than the last. A slide that collapses puts back any figure `coverOpening` parked. */
  private async slidePartyIn(ids: readonly CombatantId[]): Promise<void> {
    const ms = this.ms(MOMENT_TIMING.openSlide);
    if (ms < CUT_THRESHOLD_MS || ids.length === 0) return unparkParty(this.deps.stage, ids);
    await slideParty(this.deps.stage, ids, ms);
  }

  /**
   * The boss card is about to fade (`BattleStartBanner` `covered`): put the opening's first frame under it, so the card does not fade onto a party and a HUD that are about to vanish (`OpeningPark.ts`).
   * Only when the slide-on will play (a collapsed opening hides and shows nothing, so there is nothing to put under the card); the opening that follows finds the HUD and the party already down.
   */
  coverOpening(ids: readonly CombatantId[]): void {
    if (this.skipping || this.hurry || ids.length === 0 || this.ms(MOMENT_TIMING.openSlide) < CUT_THRESHOLD_MS) return;
    this.setHudVisible(false);
    parkParty(this.deps.stage, ids);
  }

  /**
   * The boss reveal: a slow push on the enemy's own rig with the name plate
   * up, then back out to `idle`. Plays once per enemy id. `directed`: the scene's shot director has the opening's camera (`battleStart`), so the roar and the plate play and the camera does not move.
   */
  async revealBoss(bossId: CombatantId, bossName: string | null, directed = false): Promise<void> {
    if (this.revealed.has(bossId) || this.hurry) return;
    this.revealed.add(bossId);
    if (this.skipping) return;

    // FFX-2 desktop: a reveal that would pull a girl out of the frame goes less far (`ShotRules.reveal`, B5); everywhere else it is as it was.
    const shot = directed ? null : this.shots.reveal(this.rigFor(bossId), MOMENT_PUSH.reveal);
    const g = sfxGame(); // D-302: the boss's own roar in a voiced chapter (`sfxV2/weapons.ts`), else today's
    const roar = (g && roarFor(g, bossId)) || 'boss-roar';
    this.cue(roar, 0.9, g ? momentEvents(g, 'appear', bossId, this.deps.stage.sideOf(bossId) ?? null, g && roarFor(g, bossId)) : undefined); // SFX parity: the boss's own recorded reveal, when a pack has it
    const push = shot ? this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.revealPush)) : undefined;
    const plate = bossName
      ? this.deps.moments?.nameSlab({
          title: bossName,
          kind: 'reveal',
          holdMs: this.ms(MOMENT_TIMING.revealSlab),
        })
      : undefined;
    if (shot) await this.move(shot.rig, MOMENT_TIMING.revealPush * 0.55);
    await Promise.all([push, plate]);
    if (shot) {
      await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
      await this.move(this.pick('idle'), MOMENT_TIMING.returnOut);
    }
    this.onActionRig = false;
  }

  // ---------------------------------------------------------------- per turn

  /** A new turn begins (`actorId`: whose, when the presenter says): fall back to the neutral framing if a shot is still up. */
  async turnStart(actorId?: CombatantId): Promise<void> {
    const asked = this.ask((d) => d.turnStart?.({ ...this.shotCtx(), actor: actorId === undefined ? undefined : this.subject(actorId) }));
    if (asked instanceof Promise ? await asked : asked === true) {
      this.onActionRig = false; // the director brought the frame back: no shot of ours is up
      return;
    }
    return this.settle();
  }

  /** Fall back to the neutral framing if a shot is still up: a turn begins, an action closes, a form settles. */
  private async settle(): Promise<void> {
    if (!this.onActionRig) return;
    this.onActionRig = false;
    void this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    void this.move(this.pick('idle'), MOMENT_TIMING.returnOut);
  }

  /**
   * Open an action: push in on the attacker.
   *
   * `pose` is the painted pose the beat picked, which is also the shot's
   * grammar — an `attack` kicks the horizon over by the spec's -4deg and cuts
   * away fast, a `cast` holds on the caster long enough to see the spell wind
   * up before the impact cut takes the frame to the target.
   */
  async actionOpen(actorId: CombatantId, pose: string, targets: readonly CombatantId[] = [], info?: ShotActionInfo): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    // A-13: the roll lands on the attack's first hit (`impact`), not the swing.
    this.rollOwed = pose === 'attack';
    this.shots.focus = this.shots.enemy(actorId) ?? targets.map((t) => this.shots.enemy(t)).find((t) => t !== null) ?? null;
    const action: ShotAction = { ...info, kind: pose };
    this.open = { actor: this.subject(actorId), action };
    const asked = this.ask((d) => d.actionOpen?.({ ...this.shotCtx(), actor: this.subject(actorId), targets: targets.map((t) => this.subject(t)), action, castHold: () => this.deps.sleep(MOMENT_TIMING.castHold) }));
    if (asked instanceof Promise ? await asked : asked === true) return; // the director has the push in on the attacker, and the cast's hold
    if (this.skipping) {
      this.cut(this.shots.fit(this.rigFor(actorId), 0).rig);
      return;
    }
    const shot = this.shots.fit(this.rigFor(actorId), MOMENT_PUSH.action);
    void this.move(shot.rig, MOMENT_TIMING.actionIn);
    void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.actionIn * 2));
    if (pose === 'cast') await this.deps.sleep(MOMENT_TIMING.castHold);
  }

  /**
   * The impact cut. FFX hard-cuts to whoever is being hit — it does not pan —
   * so this snaps, and only on the **first** hit of a multi-hit action, or the
   * frame would strobe through a twelve-hit Attack Reels.
   */
  impact(targetId: CombatantId, opts: { hitIndex?: number; heavy?: boolean; element?: string; lethal?: boolean } = {}): void {
    const taken = this.ask((d) => d.impact?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action, target: this.subject(targetId), hitIndex: opts.hitIndex ?? 0, heavy: opts.heavy === true, element: opts.element, lethal: opts.lethal }));
    if (taken === true) {
      this.rollOwed = false; // the roll is the hit's camera move, and the director took it
      return;
    }
    if (this.skipping) {
      this.rollOwed = false;
      return;
    }
    if ((opts.hitIndex ?? 0) !== 0) return;
    this.shots.focus = this.shots.focus ?? this.shots.enemy(targetId);
    const rig = this.shots.fit(this.rigFor(targetId), MOMENT_PUSH.action).rig;
    if (rig && rig !== this.cam.rigName) {
      this.cut(rig);
      this.onActionRig = true;
    }
    const punch = momentPunch(punchMode(), this.deps.stage.fx?.enabled() === true); // today 0.11; `?punch=new` leaves it to the spectacle's kick while that is on
    if (opts.heavy && punch > 0) void this.cam.punch(punch, this.ms(460));
    this.rollOnHit();
  }

  /**
   * A-13, the spec's "-4deg roll on every attack" (`presentation-ink-and-gold.md`
   * "Motion & camera"; both games): kick the horizon over on the attack's first
   * hit and let it fall back level, at the playback speed. Never awaited, so it
   * adds no time to the action; none under reduce-motion.
   */
  private rollOnHit(): void {
    if (!this.rollOwed) return;
    this.rollOwed = false;
    if (this.reducedMotion) return;
    void this.cam.roll?.(ATTACK_ROLL_DEG, this.ms(MOMENT_TIMING.returnOut));
  }

  /**
   * The action is over: back to the neutral framing.
   *
   * A charge telegraph outlives the action it was raised in — that is the
   * whole point of it — so its vignette is only dropped once a *later* action
   * has ended, which mirrors the rule `FFXBattleHud` uses for the screen
   * border it raises from the same `charge` event.
   */
  async actionClose(): Promise<void> {
    this.rollOwed = false;
    const asked = this.ask((d) => d.actionClose?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director brings the frame back: the letterbox and the vignette still come down, with no release of ours
    if (this.overdriveOpen) await this.overdriveEnd(directed);
    if (this.telegraphOpen && this.actions > this.telegraphAtAction) await this.telegraphEnd(directed);
    this.open = null;
    if (directed) this.onActionRig = false;
    else await this.settle();
  }

  // -------------------------------------------------------------- overdrive

  /**
   * An Overdrive gets its own rig: a brief letterbox, the Ink & Gold name slab
   * and a held push-in, then the payoff plays under it.
   */
  async overdriveStart(actorId: CombatantId, name: string, targets: readonly CombatantId[] = [], info?: ShotActionInfo): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    this.shots.focus = this.shots.enemy(actorId);
    const action: ShotAction = { ...info, kind: 'overdrive', name };
    this.open = { actor: this.subject(actorId), action };
    const rig = this.rigFor(actorId);
    const asked = this.ask((d) => d.overdriveStart?.({ ...this.shotCtx(), actor: this.subject(actorId), targets: targets.map((t) => this.subject(t)), action }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the Overdrive's rig and push: the stinger, the letterbox and the slab still play
    if (this.skipping) {
      if (!directed) this.cut(rig);
      return;
    }
    this.overdriveOpen = true;
    const staged = this.deps.staging != null && !this.hurry && stagingPieceOn('opening') && stagingGame() === 'ffx'; // pro staging (FFX only: an Overdrive is FFX's): a small name, a push and a light change, no banner and no bars
    const game = sfxGame();
    const stinger = stingerFor(game);
    this.cue(stinger ?? 'overdrive-full', 1, game && stinger ? momentEvents(game, 'overdrive-start', actorId, this.deps.stage.sideOf(actorId) ?? null, stinger) : undefined); // D-302: the Overdrive / Special stinger; SFX parity: that character's own recorded opening, when a pack has it
    const bars = staged ? undefined : this.deps.moments?.letterbox(true, this.ms(MOMENT_TIMING.odLetterbox));
    if (!directed) {
      const shot = this.shots.fit(rig, MOMENT_PUSH.overdrive);
      void this.move(shot.rig, MOMENT_TIMING.actionIn);
      void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.odPush));
    }
    await bars;
    if (staged) {
      this.deps.staging!.opening({ ...factsFor(this.deps.speed(), this.reducedMotion, this.reducedFlashes), kind: 'overdrive', actor: actorId, name });
      await this.deps.sleep(OD_OPEN_HOLD_MS); // the presenter's own sleep: it scales with the playback speed and freezes under the pause
      return;
    }
    await this.deps.moments?.nameSlab({
      title: name,
      subtitle: 'OVERDRIVE',
      kind: 'overdrive',
      holdMs: this.ms(MOMENT_TIMING.odSlab),
    });
  }

  /** Drop the letterbox and the push once the payoff has landed. `directed`: the scene's shot director has already taken this beat (an action close or the victory it is part of): the letterbox comes down, no release of ours. */
  async overdriveEnd(directed = false): Promise<void> {
    if (!this.overdriveOpen) return;
    this.overdriveOpen = false;
    let ours = !directed;
    if (ours) {
      const asked = this.ask((d) => d.overdriveEnd?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action }));
      ours = !(asked instanceof Promise ? await asked : asked === true);
    }
    await this.deps.moments?.letterbox(false, this.ms(MOMENT_TIMING.odOut));
    if (ours) await this.cam.release?.(this.ms(MOMENT_TIMING.odOut));
  }

  // -------------------------------------------------------------- telegraph

  /**
   * A boss winding up something that ends the fight — Total Annihilation, Mega
   * Flare, the Ultimate Jecht Shot, Terror of Zanarkand.
   *
   * The banner itself belongs to the HUD (`TelegraphBanner`); the *moment* is
   * the slow zoom onto the boss and the heartbeat vignette pulse under it,
   * which is what makes the wind-up feel like a countdown rather than a label.
   * Stage 2 — the attack lands next turn — pulses faster and pushes further.
   */
  async telegraph(enemyId: CombatantId, stage: 1 | 2, name?: string): Promise<void> {
    const asked = this.ask((d) => d.telegraph?.({ ...this.shotCtx(), enemy: this.subject(enemyId), stage, name }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the slow zoom: the vignette and the slab still play
    if (this.skipping) return;
    this.shots.focus = enemyId;
    this.onActionRig = true;
    this.telegraphOpen = true;
    this.telegraphDirected = directed; // and its release, when it ends (`telegraphEnd`)
    this.telegraphAtAction = this.actions;
    const imminent = stage === 2;
    const shot = directed ? null : this.shots.fit(this.rigFor(enemyId), MOMENT_PUSH.telegraph * (imminent ? 1.35 : 1));

    this.deps.moments?.vignette(true, { bpm: TELEGRAPH_BPM[stage] });
    if (shot) {
      void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.telegraphZoom));
      await this.move(shot.rig, MOMENT_TIMING.telegraphZoom * 0.4);
    }
    if (imminent && name && !(stagingPieceOn('breath') && moveOfName(name) !== null)) { // pro staging: "the text slab at the top is retired" for the two staged moves (the held breath names them small under the boss)
      await this.deps.moments?.nameSlab({
        title: name,
        kind: 'telegraph',
        holdMs: this.ms(MOMENT_TIMING.telegraphSlab),
      });
    }
  }

  /** The charged attack resolved (or was interrupted): drop the zoom and throb. `directed`: the scene's shot director has the frame (an action close or the victory this is part of): the vignette goes, no release of ours. */
  async telegraphEnd(directed = false): Promise<void> {
    if (!this.telegraphOpen) return;
    this.telegraphOpen = false;
    const theirs = directed || this.telegraphDirected; // a director that took the zoom took its release
    this.telegraphDirected = false;
    this.deps.moments?.vignette(false);
    if (!theirs) await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
  }

  // ------------------------------------------------------------ form change

  /** A boss changing form: hold on it, hard, while the flash carries the swap. */
  async formChange(enemyId: CombatantId): Promise<void> {
    // A new form is a new fight: let its reveal plate play again.
    this.revealed.delete(enemyId);
    const asked = this.ask((d) => d.formChange?.({ ...this.shotCtx(), enemy: this.subject(enemyId) }));
    const directed = asked instanceof Promise ? await asked : asked === true;
    if (this.skipping) return;
    this.onActionRig = true;
    this.formDirected = directed; // the director has the hold on the boss, and its release when the form settles (`formChangeEnd`)
    if (directed) return;
    const rig = this.rigFor(enemyId);
    void this.cam.push?.(fittedPush(this.deps.stage, this.cam, rig, MOMENT_PUSH.reveal), this.ms(MOMENT_TIMING.formHold));
    await this.move(rig, MOMENT_TIMING.formHold * 0.35);
  }

  /** Let the new form settle back into the neutral framing. */
  async formChangeEnd(): Promise<void> {
    if (this.skipping) return;
    const directed = this.formDirected;
    this.formDirected = false;
    if (directed) {
      this.onActionRig = false;
      return;
    }
    await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.settle();
  }

  // ---------------------------------------------------------------- victory

  /** The party pose, on its own rig, under the fanfare. */
  async victory(): Promise<void> {
    this.onActionRig = false;
    const asked = this.ask((d) => d.victory?.(this.shotCtx()));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the victory rig: an open telegraph's and Overdrive's chrome still comes down
    await this.telegraphEnd(directed);
    await this.overdriveEnd(directed);
    const rig = this.pick('victory', 'party', 'idle');
    if (this.skipping) {
      if (!directed) this.cut(rig);
      return;
    }
    if (directed) return;
    void this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.move(rig, MOMENT_TIMING.victoryIn);
  }

  /** Drop every layer this battle put up. Called when the screen leaves. */
  clear(): void {
    this.overdriveOpen = false;
    this.telegraphOpen = false;
    this.telegraphDirected = false;
    this.formDirected = false;
    this.open = null;
    this.revealed.clear();
    this.deps.moments?.clear();
    // An abort during the opening skips `battleStart`'s own restore, and a HUD
    // left hidden would follow the player into the next battle on this screen.
    this.setHudVisible(true);
  }
}
