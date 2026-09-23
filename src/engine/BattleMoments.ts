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
import type {
  AudioPort,
  BattleStage,
  CameraPort,
  MomentsPort,
  PlaybackSpeed,
} from './BattlePresenterPorts.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';

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

  constructor(deps: MomentDeps) {
    this.deps = deps;
  }

  // ------------------------------------------------------------------ timing

  private get scale(): number {
    return this.hurry ? 0 : SPEED_SCALE[this.deps.speed()];
  }

  /** True when playback is collapsing every wait (e2e, the critic). */
  get skipping(): boolean {
    return this.deps.speed() === 'skip';
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

  /**
   * An explicit `camera` event from a boss's data file. Bypasses the shot
   * grammar (that is what it is for) but still obeys the playback speed.
   */
  async moveToRig(rig: string, base: number): Promise<void> {
    this.onActionRig = rig !== 'idle';
    await this.move(rig, base);
  }

  private cue(key: string, volume = 1): void {
    try {
      this.deps.audio?.playSfx(key, { volume });
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
    const intro = this.pick('intro', 'idle');
    this.cut(intro);
    if (this.skipping) {
      this.cut(this.pick('idle'));
      if (opts.bossId) this.revealed.add(opts.bossId);
      return;
    }

    this.setHudVisible(false);
    try {
      await this.slidePartyIn(opts.partyIds ?? []);
      await this.move(this.pick('idle'), MOMENT_TIMING.openHold);
      this.onActionRig = false;

      if (opts.bossId) await this.revealBoss(opts.bossId, opts.bossName ?? null);
    } finally {
      // Whatever happened — an abort mid-reveal, a scene with no rigs, a
      // throw out of the art layer — the player gets their HUD back.
      this.setHudVisible(true);
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

  /**
   * The party walks on. Each active member starts one body-width further out
   * of frame than the last so they arrive staggered rather than as a block.
   */
  private async slidePartyIn(ids: readonly CombatantId[]): Promise<void> {
    const ms = this.ms(MOMENT_TIMING.openSlide);
    if (ms < CUT_THRESHOLD_MS || ids.length === 0) return;

    const runs = ids.map((id, i) => {
      const actor = this.deps.stage.actor(id);
      if (!actor) return Promise.resolve();
      const home = { x: actor.position.x, y: actor.position.y, z: actor.position.z };
      // Off-stage on the party's own side of the frame (party slots sit left
      // of the hall axis in every scene — see each scene's PARTY_SLOTS note).
      actor.moveTo({ x: home.x - 4.2 - i * 0.5, y: home.y, z: home.z }, 0);
      actor.setAlpha(0);
      void actor.fadeTo(1, ms * 0.5);
      return actor.moveTo(home, ms + i * 70);
    });
    await Promise.all(runs);
  }

  /**
   * The boss reveal: a slow push on the enemy's own rig with the name plate
   * up, then back out to `idle`. Plays once per enemy id.
   */
  async revealBoss(bossId: CombatantId, bossName: string | null): Promise<void> {
    if (this.revealed.has(bossId) || this.hurry) return;
    this.revealed.add(bossId);
    if (this.skipping) return;

    const rig = this.rigFor(bossId);
    this.cue('boss-roar', 0.9);
    const push = this.cam.push?.(MOMENT_PUSH.reveal, this.ms(MOMENT_TIMING.revealPush));
    const plate = bossName
      ? this.deps.moments?.nameSlab({
          title: bossName,
          kind: 'reveal',
          holdMs: this.ms(MOMENT_TIMING.revealSlab),
        })
      : undefined;
    await this.move(rig, MOMENT_TIMING.revealPush * 0.55);
    await Promise.all([push, plate]);
    await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.move(this.pick('idle'), MOMENT_TIMING.returnOut);
    this.onActionRig = false;
  }

  // ---------------------------------------------------------------- per turn

  /** A new turn begins: fall back to the neutral framing if a shot is still up. */
  async turnStart(): Promise<void> {
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
  async actionOpen(actorId: CombatantId, pose: string): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    const rig = this.rigFor(actorId);
    if (this.skipping) {
      this.cut(rig);
      return;
    }
    void this.move(rig, MOMENT_TIMING.actionIn);
    void this.cam.push?.(MOMENT_PUSH.action, this.ms(MOMENT_TIMING.actionIn * 2));
    if (pose === 'attack') void this.cam.roll?.(ATTACK_ROLL_DEG, this.ms(MOMENT_TIMING.returnOut));
    if (pose === 'cast') await this.deps.sleep(MOMENT_TIMING.castHold);
  }

  /**
   * The impact cut. FFX hard-cuts to whoever is being hit — it does not pan —
   * so this snaps, and only on the **first** hit of a multi-hit action, or the
   * frame would strobe through a twelve-hit Attack Reels.
   */
  impact(targetId: CombatantId, opts: { hitIndex?: number; heavy?: boolean } = {}): void {
    if (this.skipping) return;
    if ((opts.hitIndex ?? 0) !== 0) return;
    const rig = this.rigFor(targetId);
    if (rig && rig !== this.cam.rigName) {
      this.cut(rig);
      this.onActionRig = true;
    }
    if (opts.heavy) void this.cam.punch(0.11, this.ms(460));
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
    if (this.overdriveOpen) await this.overdriveEnd();
    if (this.telegraphOpen && this.actions > this.telegraphAtAction) await this.telegraphEnd();
    await this.turnStart();
  }

  // -------------------------------------------------------------- overdrive

  /**
   * An Overdrive gets its own rig: a brief letterbox, the Ink & Gold name slab
   * and a held push-in, then the payoff plays under it.
   */
  async overdriveStart(actorId: CombatantId, name: string): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    const rig = this.rigFor(actorId);
    if (this.skipping) {
      this.cut(rig);
      return;
    }
    this.overdriveOpen = true;
    this.cue('overdrive-full', 1);
    const bars = this.deps.moments?.letterbox(true, this.ms(MOMENT_TIMING.odLetterbox));
    void this.move(rig, MOMENT_TIMING.actionIn);
    void this.cam.push?.(MOMENT_PUSH.overdrive, this.ms(MOMENT_TIMING.odPush));
    await bars;
    await this.deps.moments?.nameSlab({
      title: name,
      subtitle: 'OVERDRIVE',
      kind: 'overdrive',
      holdMs: this.ms(MOMENT_TIMING.odSlab),
    });
  }

  /** Drop the letterbox and the push once the payoff has landed. */
  async overdriveEnd(): Promise<void> {
    if (!this.overdriveOpen) return;
    this.overdriveOpen = false;
    await this.deps.moments?.letterbox(false, this.ms(MOMENT_TIMING.odOut));
    await this.cam.release?.(this.ms(MOMENT_TIMING.odOut));
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
    if (this.skipping) return;
    const rig = this.rigFor(enemyId);
    this.onActionRig = true;
    this.telegraphOpen = true;
    this.telegraphAtAction = this.actions;
    const imminent = stage === 2;

    this.deps.moments?.vignette(true, { bpm: TELEGRAPH_BPM[stage] });
    void this.cam.push?.(
      MOMENT_PUSH.telegraph * (imminent ? 1.35 : 1),
      this.ms(MOMENT_TIMING.telegraphZoom),
    );
    await this.move(rig, MOMENT_TIMING.telegraphZoom * 0.4);
    if (imminent && name) {
      await this.deps.moments?.nameSlab({
        title: name,
        kind: 'telegraph',
        holdMs: this.ms(MOMENT_TIMING.telegraphSlab),
      });
    }
  }

  /** The charged attack resolved (or was interrupted): drop the zoom and throb. */
  async telegraphEnd(): Promise<void> {
    if (!this.telegraphOpen) return;
    this.telegraphOpen = false;
    this.deps.moments?.vignette(false);
    await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
  }

  // ------------------------------------------------------------ form change

  /** A boss changing form: hold on it, hard, while the flash carries the swap. */
  async formChange(enemyId: CombatantId): Promise<void> {
    // A new form is a new fight: let its reveal plate play again.
    this.revealed.delete(enemyId);
    if (this.skipping) return;
    this.onActionRig = true;
    void this.cam.push?.(MOMENT_PUSH.reveal, this.ms(MOMENT_TIMING.formHold));
    await this.move(this.rigFor(enemyId), MOMENT_TIMING.formHold * 0.35);
  }

  /** Let the new form settle back into the neutral framing. */
  async formChangeEnd(): Promise<void> {
    if (this.skipping) return;
    await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.turnStart();
  }

  // ---------------------------------------------------------------- victory

  /** The party pose, on its own rig, under the fanfare. */
  async victory(): Promise<void> {
    this.onActionRig = false;
    await this.telegraphEnd();
    await this.overdriveEnd();
    const rig = this.pick('victory', 'party', 'idle');
    if (this.skipping) {
      this.cut(rig);
      return;
    }
    void this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.move(rig, MOMENT_TIMING.victoryIn);
  }

  /** Drop every layer this battle put up. Called when the screen leaves. */
  clear(): void {
    this.overdriveOpen = false;
    this.telegraphOpen = false;
    this.revealed.clear();
    this.deps.moments?.clear();
    // An abort during the opening skips `battleStart`'s own restore, and a HUD
    // left hidden would follow the player into the next battle on this screen.
    this.setHudVisible(true);
  }
}
