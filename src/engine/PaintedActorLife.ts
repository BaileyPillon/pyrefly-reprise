/**
 * The life layer's cues: the state a pose names, the KO fall and the revive's rise, lying down, and the turn ring and the selection accent.
 *
 * `PaintedActor` was one 2,700-line class. It is now a chain of classes, one responsibility each, every layer calling only the layers below it:
 * `PaintedActorState` (the fields that start at rest) -> `PaintedActorBase` (the other fields, the constructor) -> `PaintedActorPlacement` ->`PaintedActorSizing` -> `PaintedActorEffects` -> `PaintedActorLife` -> `PaintedActorPoses` -> `PaintedActorReaders` -> `PaintedActor`
 * (import that one from `PaintedActor.ts`). A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * The constructor calls eight methods that live in later layers; `PaintedActorBase` declares them abstract.
 */

import { selectAccentStyle } from './selectAccentStyle.ts';
import { AdditiveBlending, CircleGeometry, Mesh, MeshBasicMaterial } from 'three';
import { lifeStateForPose, type LifeCue } from './BattlePresenterActors.ts';
import { lieOffset } from './LieFlat.ts';
import { curvesOn } from './motion/CurvesSwitch.ts';
import { menuHolds } from './motion/MenuHold.ts';
import { momentsGame, momentsOn } from './motion/MomentsSwitch.ts'; // motion pass (lane "core", step 3): the per-game moments (victory, KO settle); default OFF
import { startKoSettle, startStandDown } from './motion/ActorMoments.ts';
import { realFallMs } from './motion/RealMoments.ts'; // `?curves=real` / `real-snappy`: the real clips' knock-out and victory timing
import { koCutMs } from './motion/MomentsPlan.ts';
import { smearOn } from './motion/SmearSwitch.ts';
import { ringTexture, FALL_MS, LIE_TILT } from './PaintedActorKit.ts';
import { PaintedActorEffects } from './PaintedActorEffects.ts';

export abstract class PaintedActorLife extends PaintedActorEffects {
  /** Motion pass, step 3: a chapter whose sources withhold the victory pose (FFX-2 Chapter IV) keeps the stance and stands down: one slow breath out, no leap, no swap. */
  standDown(): void {
    if (this.life?.state === 'down') return; // the fallen stay where they lie
    this.after(this.beatOffset * 240, () => void startStandDown(this.momentsHost(), momentsGame()));
  }

  /** The window of the knock-out's cut in real ms, or undefined when the KO keeps its plain cross (`fx/mix/living.ts` asks as it starts a fall): the moments and the smear both on. */
  koCutWindow(): number | undefined {
    return momentsOn() && smearOn() && !menuHolds() ? koCutMs(this.smear.state.frameMs) : undefined; // an open FFX-2 menu keeps the plain cross (D-357)
  }

  /** The KO's cut window opens, runs (`u` 0 to 1) and closes (`motion/SmearDirector.ts`): the streak and the planned-smear record of a fall's cross. */
  koCutBegin(info: { from: string; to: string; toPlane: 0 | 1; cutMs: number; dirX: number }): void {
    this.smear.beginManual(info);
  }

  koCutStep(u: number): void {
    this.smear.stepManual(u);
  }

  koCutEnd(): void {
    this.smear.endManual();
  }

  /** The life state this fighter is in. `'idle'` when the layer is off. */
  get lifeState(): string {
    return this.life?.state ?? 'idle';
  }

  /**
   * Turn the acting-character ring on or off by hand.
   *
   * Normally the life layer does this: the ring comes up when a fighter is
   * `ready` or acting and fades when the turn passes. This is for screens that
   * drive the field themselves.
   */
  setTurnRing(on: boolean): void {
    if (!this.turnRing) return;
    this.ringOverride = on ? 1 : 0;
  }

  /** Give the ring back to the life layer after {@link setTurnRing}. */
  clearTurnRing(): void {
    this.ringOverride = null;
  }

  /**
   * The **selection accent**: the soft pool on the ground under a figure the
   * player is currently aiming at (option B, "hand, ring and a quiet dim",
   * approved by Bailey 2026-09-19).
   *
   * Deliberately *not* the turn ring. The turn ring answers "whose decision is
   * this?" and belongs to the life layer; this answers "what am I about to
   * hit?", is driven by the command menu, and the two are on screen together
   * all the time — the acting character's own ring is lit while they choose an
   * enemy. Sharing one mesh made the aeon's ring flicker between two colours.
   *
   * A figure that **levitates** (`hover`) gets a halo *behind* it instead of a
   * pool under it: Vegnagun's head and both Yu Pagodas have no feet, and a gold
   * disc on the floor several units below them marks the floor, not the target.
   *
   * @param colour accent colour, or `null` to clear it.
   */
  setSelectAccent(colour: number | string | null): void {
    if (colour === null) {
      this.accentWanted = 0;
      return;
    }
    this.ensureAccent();
    this.accentColour.set(colour as never);
    (this.accent!.material as MeshBasicMaterial).color.copy(this.accentColour);
    this.accentWanted = 1;
  }

  /** Whether a selection accent is currently asked for. */
  get hasSelectAccent(): boolean {
    return this.accentWanted > 0;
  }

  /**
   * Build the selection accent the first time one is asked for: a soft pool
   * lying on the ground, or — for a figure that levitates — an upright halo
   * behind it, parented to `inner` so it follows the bob.
   */
  private ensureAccent(): void {
    if (this.accent) return;
    const mat = new MeshBasicMaterial({
      map: ringTexture(),
      color: this.accentColour,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(new CircleGeometry(1, 48), mat);
    mesh.name = 'select-accent';
    // A station-lifted figure (the Yu Pagodas) wears the halo too: PR-0031, `selectAccentStyle.ts`.
    this.accentHalo = selectAccentStyle(this.hoverHeight, this.position.y) === 'halo';
    if (this.accentHalo) {
      // Behind the figure, not under it. A lower `renderOrder` than the planes,
      // with `depthWrite` off, is what makes the halo read as light around the
      // silhouette rather than a disc pasted over it.
      mesh.renderOrder = 3;
      mesh.position.y = this.worldHeight * 0.5;
      this.inner.add(mesh);
    } else {
      mesh.rotation.x = -Math.PI / 2;
      // Above the contact shadow and the turn ring, still below the figure.
      mesh.position.y = 0.026;
      mesh.renderOrder = 6;
      this.add(mesh);
    }
    this.accent = mesh;
  }

  /**
   * Move the life state on, from a pose name, and fire whatever one-shots the
   * transition asks for. Called by every {@link setPose}.
   */
  protected enterLife(pose: string, immediate: boolean): void {
    const life = this.life;
    if (!life) return;
    const change = life.set(lifeStateForPose(pose), { immediate });
    if (!change) return;
    // Any real state change cancels a flinch that has not handed the pose back
    // yet, so a KO landing mid-flinch is not undone 200 ms later.
    if (change.to !== 'hurt') this.flinchToken++;
    if (immediate) {
      // Staging someone who is already down: no fall, no cheering, no glow.
      if (change.to === 'down') {
        this.fallTilt = 1;
        this.fallDrop = 1;
      } else if (change.from === 'down') {
        this.fallTilt = 0;
        this.fallDrop = 0;
      }
      return;
    }
    for (const cue of change.cues) this.playCue(cue);
  }

  private playCue(cue: LifeCue): void {
    switch (cue) {
      case 'step':
        // Their turn: the weight coming up on to the front foot. Motion pass (lane "core"): with the new curves it is a small leap (a settle and a landing squash); the docs are silent on
        // either game's turn-start, so it is the same neutral weight shift for both (an open question in the handoff).
        // The landing squash is 0.011, not 0.015: its sound strength (land / 0.06 = 0.18) must stay under `MotionSfx.MIN_LAND_STRENGTH` (0.2), or the weight shift thuds at every turn start (integration review M1).
        void (curvesOn() ? this.leap(this.worldHeight * 0.03, 340, { anticipation: 0.1, crouch: 0.012, stretch: 0.012, land: 0.011, landMs: 160, apex: 0.5 }) : this.hop(this.worldHeight * 0.035, 300));
        return;
      case 'flinch':
        // Only when something set `hurt` directly; `recoil` brings its own knock-back.
        if (this.flinching) return;
        this.tintHurt(260);
        void this.knockBack(300, this.worldHeight * 0.1);
        return;
      case 'fall':
        this.fall();
        return;
      case 'rise':
        this.rise();
        return;
      case 'hop':
        if (momentsOn()) {
          this.cheerDue = true; // the cheer (`beginCheer`, called by `setPose` right after this): a crouch, a spring with the victory painting cut in on the take-off, a landing
          return;
        }
        // Victory, staggered per fighter so a party does not cheer like a chorus line.
        this.after(this.beatOffset * 240, () => {
          void this.hop(this.worldHeight * 0.13, 460);
        });
        return;
    }
  }

  /** Tip over and hit the ground: the KO. */
  private fall(): void {
    this.fallDue = true;
    this.landHeld = false;
    this.tweens.to(0, 1, {
      durationMs: realFallMs(this.name) ?? FALL_MS, // `?curves=real` / `real-snappy` (integration 2): the body reaches the floor when the real clip's does (Tidus 1.0 s), else today's 300 ms
      easing: 'quadIn',
      onUpdate: (v) => {
        this.fallTilt = v;
        this.fallDrop = v;
      },
      onComplete: () => {
        // Landing (already played on the cut when the KO run is up, `landFall`), then the extra tilt relaxes into the `down` posture.
        if (!this.landHeld) this.landFall();
        this.tweens.to(1, 0, {
          durationMs: 420,
          easing: 'quadOut',
          onUpdate: (v) => {
            this.fallTilt = v;
            this.fallDrop = v;
          },
        });
      },
    });
  }

  /** The KO's landing (squash, settle, ground shake), once per fall: MF-09, the KO run plays it on the cut, the fall tween's end (58 to 92 ms later) only for a KO with no run. */
  landFall(): void {
    this.landHeld = false;
    if (!this.fallDue) return;
    this.fallDue = false;
    void this.squash(280, 0.5);
    if (momentsOn() && !menuHolds()) void startKoSettle(this.momentsHost()); // motion pass, step 3: the landing rebounds a little (a boss less); not over an open FFX-2 menu (D-357)
    this.shake(this.worldHeight * 0.018, 200, 0); // the ground shake starts at rest (phase 0) and is the same in every take
  }

  /** Back on their feet, with the Phoenix Down's glow still on them. */
  private rise(): void {
    const from = this.fallTilt;
    const drop = this.fallDrop;
    this.tweens.to(1, 0, {
      durationMs: 320,
      easing: 'quadOut',
      onUpdate: (v) => {
        this.fallTilt = from * v;
        this.fallDrop = drop * v;
      },
    });
    this.flash(0xcfe9ff, 640, 0.55);
    void this.hop(this.worldHeight * 0.07, 520);
    // A body laid down (`lieDown`) gets up with it (FF7's KO'd fighter revived by a Phoenix Down).
    if (this.lieRoll > 0) {
      const lying = this.lieRoll;
      this.tweens.to(1, 0, { durationMs: 360, easing: 'quadOut', onUpdate: (v) => (this.lieRoll = lying * v) });
    }
  }

  /**
   * Fall onto its back and stay there, flat on the floor over its own station
   * ({@link lieOffset}): a defeat that leaves a body with no painted `ko`
   * (Seymour at Macalania, D-046, the `'body'` departure). `ms` 0 lies down at
   * once. Both games' plumbing; only FFX's Seymour uses it today. `tilt` is the tip back, radians (default flat
   * on the floor, face up); FF7 passes less, so a KO'd fighter lies on the floor still readable from its low
   * camera instead of a flat smear (repair item 4). A revive stands the body back up (`rise`).
   */
  lieDown(ms = 520, tilt = LIE_TILT): Promise<void> {
    this.lieTilt = tilt;
    if (ms <= 0) {
      this.lieRoll = 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.tweens.to(this.lieRoll, 1, {
        durationMs: ms,
        easing: 'quadIn',
        onUpdate: (v) => {
          this.lieRoll = v;
        },
        onComplete: () => {
          void this.squash(260, 0.35);
          this.shake(this.worldHeight * 0.012, 220);
          resolve();
        },
      });
    });
  }

  /** Where the rolled body goes: `[dx, lift]`, on the floor over its own station (`LieFlat.ts`). */
  protected lieOffset(angle: number): [number, number, number] {
    const slot = this.slots[this.active]!;
    return lieOffset(slot.scale.contentBox, slot.mesh.scale.x < 0, angle, this.lieTilt * this.lieRoll);
  }
}
