/**
 * `window.__pyrefly.pro(mode?)`, `.proOn()` and `.proPiece(piece, on?)`: the pro-look switch for captures and checks (lane "pro-look"; `engine/look/pro/ProSwitch.ts`).
 *
 * `pro()` returns `'pro'` or `'today'` (from `?look=pro` / `?pack=demo`, default today); `pro('pro' | 'today')` sets it live (the arena's grade is read again at once, the other pieces for what starts from now
 * on). The pro look plays only in the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `proOn()` is the answer for the running chapter. `proPiece(piece, on?)` reads or sets one
 * piece (arena, seam, hits, numbers, markers) and answers whether it plays now.
 */
import { proTune } from '../engine/look/pro/ProGrade.ts';
import { PRO_PIECES, proLookOn, proMode, proPieceOn, setProMode, setProPiece, type ProMode, type ProPiece } from '../engine/look/pro/ProSwitch.ts';

export function installProDebug(api: Record<string, unknown>): void {
  api['pro'] = (mode?: ProMode): ProMode => {
    if (mode === 'pro' || mode === 'today') setProMode(mode);
    return proMode();
  };
  api['proOn'] = (): boolean => proLookOn();
  /** Live tuning of one room's table for captures: `proTune('gagazet', { colour: { exposure: 0.8 } })`. */
  api['proTune'] = (room: string, patch: Record<string, unknown>): boolean => proTune(room, patch);
  api['proPiece'] = (piece: ProPiece, on?: boolean): boolean => {
    if (!PRO_PIECES.includes(piece)) return false;
    if (typeof on === 'boolean') setProPiece(piece, on);
    return proPieceOn(piece);
  };
}
