/** Types for `tools/measure/fight.mjs`. */
import type { GameSession, Stepper } from './session.mjs';
export interface Acc { frames: any[]; events: any[]; logLen: number; rec: boolean }
export type KeyStep = string | { key: string; afterMs?: number };
export interface UntilEvent { event?: string; beat?: { actor: string; kind: 'shake' | 'pose' | 'life'; pose?: string; life?: string; ordinal?: number }; who?: string | null; ordinal?: number; afterMs?: number }
export declare function healParty(page: any): Promise<number>;
export declare function playOneAttack(o: {
  g: GameSession; stepper: Stepper; acc: Acc; hz: number; keys?: KeyStep[]; seconds?: number; preRollMs?: number; gapMs?: number; tailMs?: number; onFrame?: ((st: any, f: number) => Promise<void>) | null;
  holdMenuMs?: number; turns?: number; until?: UntilEvent | null; keepAlive?: boolean; maxTurns?: number;
}): Promise<{ t0: number; confirmedAt: number; ended: 'menu' | 'timeout' | 'left-battle' | 'event'; frames: number; turns: number; untilAt: number | null; pressAt: number[]; retried: number; pressedTurns: number }>;
export declare function playFight(o: { g: GameSession; stepper: Stepper; acc: Acc; hz: number; seconds?: number }): Promise<{ acted: number; healed: number; ended: 'time' | 'left-battle'; marks: Array<{ f: number; what: string }> }>;
