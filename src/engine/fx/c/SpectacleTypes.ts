/** The stage, splash and dependency shapes of the Spectacle stage side (moved out of SpectacleFx.ts at the r63 integration to keep that file under 400 lines; both games, types only). */
import type { PerspectiveCamera, Scene } from 'three';
import type { CombatantId } from '../../../battle/common/types.ts';
import type { PaintedActor } from '../../PaintedActor.ts';
import type { SpectaclePass } from './SpectaclePass.ts';
import type { SpectacleFlags, SpectacleGame } from './SpectacleRules.ts';

export interface SpectacleStage {
  actor(id: CombatantId): PaintedActor | undefined;
  staged(): CombatantId[];
  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined;
  snapshot(): Array<{ id: string; art: string }>;
}

export interface SplashPort {
  play(o: { art: string | null; name: string; at: { x: number; y: number } | null; mode: 'full' | 'repeat' | 'calm'; staticLines: boolean; holdMs: number; from: 'left' | 'right' }): Promise<void>;
  stop(): void;
}

export interface SpectacleDeps {
  game: SpectacleGame;
  scene: Scene;
  camera: PerspectiveCamera;
  stage: SpectacleStage;
  pass: SpectaclePass;
  enabled(): boolean;
  flags(): SpectacleFlags;
  /** A strength dial (`?fxdial=`), 1 = as tuned. */
  dial(name: 'orbit' | 'splash' | 'heat'): number;
  sub(id: string): boolean;
  splash: SplashPort | null;
  /** The painting a splash shows for an actor, or null. */
  splashArt(id: CombatantId, art: string, kind: 'overdrive' | 'special'): string | null;
  /** CSS px per drawing-buffer px, and the canvas CSS size. */
  view(): { w: number; h: number; dpr: number };
}
