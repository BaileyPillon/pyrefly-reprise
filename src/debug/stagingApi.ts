/**
 * `window.__pyrefly.staging(mode?)`, `.stagingOn()`, `.stagingPiece(piece, on?)`, `.stagingState()` and `.stagingCue(piece, cue)`: the pro staging's switch, its state and its cues, for captures and checks (lane
 * "pro-staging"; `engine/pro/staging/StagingSwitch.ts`).
 *
 * `staging()` returns `'pro'` or `'today'` (from `?staging=` / `?pack=demo`, default today); `staging('pro' | 'today')` sets it for what starts from now on (the layer is built as a fight begins, so a flip in a fight
 * plays in the next one; the presenter's cues themselves read the switch live). `stagingPiece('breath' | 'card' | 'ending' | 'opening', false)` takes one piece back to today's. `stagingCue(piece, cue)` hands the
 * running fight's layer a cue directly (the held breath's `mark`, `tell`, `blow`, `lift`; the ending's `freeze`, `title`, `pullback`, `fall`; the openings' `overdrive`, `change`), filling in the game, the speed
 * and the attacker and party from the field, so a recorder can see a piece without playing the fight to it. Nothing here writes game state.
 */
import {
  setStagingMode,
  setStagingPieceOff,
  stagingMode,
  stagingOffPieces,
  stagingOn,
  stagingPieceOn,
  type StagingMode,
  type StagingPiece,
} from '../engine/pro/staging/StagingSwitch.ts';
import type { StagingPort } from '../engine/pro/staging/StagingPort.ts';

interface Layer extends StagingPort {
  snapshot(): unknown;
  scrubBreath(o: Record<string, unknown>): void;
  advance(ms: number): void;
  release(): void;
}
interface Staged {
  battle?: () => { stagingLayer: Layer | null; stage: { staged(): string[]; sideOf(id: string): string | undefined } } | null;
}

export function installStagingDebug(api: Record<string, unknown>): void {
  api['staging'] = (mode?: StagingMode): StagingMode => {
    if (mode === 'pro' || mode === 'today') setStagingMode(mode);
    return stagingMode();
  };
  api['stagingOn'] = (): boolean => stagingOn();
  api['stagingPiece'] = (piece: StagingPiece, on?: boolean): boolean => {
    if (on !== undefined) setStagingPieceOff(piece, !on);
    return stagingPieceOn(piece);
  };
  api['stagingState'] = (): unknown => {
    const b = (api as Staged).battle?.() ?? null;
    return { mode: stagingMode(), on: stagingOn(), off: [...stagingOffPieces()], layer: b?.stagingLayer ? b.stagingLayer.snapshot() : null };
  };
  /** Captures only: pose the held breath at `t` ms into a tell (the layer's clock is held there until `release: true`). */
  api['stagingScrub'] = (o: Record<string, unknown>): boolean => {
    const b = (api as Staged).battle?.() ?? null;
    const layer = b?.stagingLayer;
    if (!b || !layer) return false;
    const staged = b.stage.staged();
    const foes = staged.filter((id) => b.stage.sideOf(id) === 'enemy');
    const party = staged.filter((id) => b.stage.sideOf(id) === 'party' || b.stage.sideOf(id) === 'aeon');
    const game = staged.includes('bahamut') ? 'ffx2' : 'ffx';
    const attacker = (game === 'ffx' ? foes.find((id) => id === 'mortiorchis') : undefined) ?? foes[0] ?? '';
    layer.scrubBreath({ game, move: game === 'ffx' ? 'total-annihilation' : 'mega-flare', name: game === 'ffx' ? 'Total Annihilation' : 'Mega Flare', attacker, party, companions: foes.filter((id) => id !== attacker), tellMs: 1200, t: 0, ...o });
    return true;
  };
  /** Captures only: hold the layer's clock and step it `ms` forward (after a cue, to pose any piece at an exact time); `stagingRelease()` lets it run. */
  api['stagingAdvance'] = (ms: number): boolean => {
    const layer = ((api as Staged).battle?.() ?? null)?.stagingLayer;
    if (!layer) return false;
    layer.advance(ms);
    return true;
  };
  api['stagingRelease'] = (): boolean => {
    const layer = ((api as Staged).battle?.() ?? null)?.stagingLayer;
    if (!layer) return false;
    layer.release();
    return true;
  };
  api['stagingCue'] = (piece: 'breath' | 'ending' | 'opening', cue: Record<string, unknown>): boolean => {
    const b = (api as Staged).battle?.() ?? null;
    const layer = b?.stagingLayer;
    if (!b || !layer) return false;
    const staged = b.stage.staged();
    const foe = staged.find((id) => b.stage.sideOf(id) === 'enemy') ?? '';
    const party = staged.filter((id) => b.stage.sideOf(id) === 'party' || b.stage.sideOf(id) === 'aeon');
    const game = staged.includes('bahamut') ? 'ffx2' : 'ffx';
    const facts = { game, scale: 1, calm: false, tame: false };
    const full = { ...facts, attacker: foe, boss: foe, party, actor: party[0] ?? '', ...cue } as never;
    if (piece === 'breath') layer.breath(full);
    else if (piece === 'ending') layer.ending(full);
    else layer.opening(full);
    return true;
  };
}
