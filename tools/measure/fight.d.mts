/** Types for `tools/measure/fight.mjs`. */
import type { GameSession, Stepper } from './session.mjs';
export interface Acc { frames: any[]; events: any[]; logLen: number; rec: boolean }
export declare function playOneAttack(o: { g: GameSession; stepper: Stepper; acc: Acc; hz: number; keys?: string[]; seconds?: number; preRollMs?: number; gapMs?: number; tailMs?: number; onFrame?: ((st: any, f: number) => Promise<void>) | null }): Promise<{ t0: number; confirmedAt: number; ended: 'menu' | 'timeout' | 'left-battle'; frames: number }>;
export declare function playFight(o: { g: GameSession; stepper: Stepper; acc: Acc; hz: number; seconds?: number }): Promise<{ acted: number; healed: number; ended: 'time' | 'left-battle'; marks: Array<{ f: number; what: string }> }>;
