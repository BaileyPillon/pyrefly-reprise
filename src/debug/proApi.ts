/**
 * `window.__pyrefly.pro(mode?)`, `.proOn()` and `.proPiece(piece, on?)`: the pro-look switch for captures and checks (lane "pro-look"; `engine/look/pro/ProSwitch.ts`).
 *
 * `pro()` returns `'pro'` or `'today'` (from `?look=pro` / `?pack=demo`, default today); `pro('pro' | 'today')` sets it live (the arena's grade is read again at once, the other pieces for what starts from now
 * on). The pro look plays only in the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `proOn()` is the answer for the running chapter. `proPiece(piece, on?)` reads or sets one
 * piece (arena, seam, hits, numbers, markers) and answers whether it plays now.
 */
import { PIECE_HOLDS, TREATED_CHAPTERS, demoChapter, isTreatedChapter, setTreatedScope, treatedScope, type TreatedScope } from '../engine/motion/DemoGate.ts';
import { proTune } from '../engine/look/pro/ProGrade.ts';
import { SKY_CHAPTERS, SKY_CHANGES, SKY_OPTIONS, setSkyOption, skyActive, skyOption, skyScreen, type SkyOption } from '../engine/look/pro/SkyGrade.ts';
import { lookState } from '../engine/look/LookState.ts';
import { bossCleanMode, bossCleanOn, setBossClean, type BossCleanMode } from '../engine/look/pro/BossClean.ts';
import { partyRimMode, partyRimOff, setPartyRim, type PartyRimMode } from '../engine/look/pro/PartyRimSwitch.ts';
import { PRO_PIECES, dangerPulseFromSearch, proLookOn, proMode, proPieceOn, setProMode, setProPiece, type ProMode, type ProPiece } from '../engine/look/pro/ProSwitch.ts';

/** The Danger pulse's off switch on the page (`html[data-danger-pulse='off']`, read by `ui/common/pro-markers.css`): true while the low-HP row pulses. */
function setDangerPulse(on: boolean): boolean {
  const root = typeof document === 'undefined' ? null : document.documentElement;
  if (root) {
    if (on) delete root.dataset['dangerPulse'];
    else root.dataset['dangerPulse'] = 'off';
  }
  return on;
}

export function installProDebug(api: Record<string, unknown>): void {
  setDangerPulse(dangerPulseFromSearch(typeof location === 'undefined' ? undefined : location.search) === 'on'); // `?dangerpulse=off`
  /** `__pyrefly.proDangerPulse(false)` stops the low-HP row's pulse (a steady ring stays), `(true)` brings it back; no argument reads it. */
  api['proDangerPulse'] = (on?: boolean): boolean => (typeof on === 'boolean' ? setDangerPulse(on) : document.documentElement.dataset['dangerPulse'] !== 'off');
  api['pro'] = (mode?: ProMode): ProMode => {
    if (mode === 'pro' || mode === 'today') setProMode(mode);
    return proMode();
  };
  api['proOn'] = (): boolean => proLookOn();
  /** Lane boss-matte: `bossClean()` reads the re-cut bosses' switch (`'clean'` / `'today'`), `bossClean('clean' | 'today')` sets it live, `bossClean(null)` reads the address again; `bossCleanOn()` says whether it plays now. */
  api['bossClean'] = (m?: BossCleanMode | null): BossCleanMode => {
    if (m === 'clean' || m === 'today' || m === null) setBossClean(m);
    return bossCleanMode();
  };
  api['bossCleanOn'] = (): boolean => bossCleanOn();
  /** r63-play: `partyRim()` reads the party rim switch (`'on'` = today's rim, `'off'` = the party draws no screen-space rim), `partyRim('on' | 'off' | null)` sets it live (`null` reads the address again); `partyRimOff()` says whether it plays now. */
  api['partyRim'] = (m?: PartyRimMode | null): PartyRimMode => {
    if (m === 'on' || m === 'off' || m === null) setPartyRim(m);
    return partyRimMode();
  };
  api['partyRimOff'] = (): boolean => partyRimOff();
  /** Release 69 (`booth-leblanc`): `treated()` reads which chapters the treatment reaches (`scope`: `all` = the list, `pack` = release 68's booth pair; `?treated=pack` does the same from the address), the list, each listed chapter's held pieces (the rows of a chapter the r70 verdicts took off the list stay in `PIECE_HOLDS`, unread, and are not reported) and whether the running chapter is reached; `treated('all' | 'pack' | null)` sets the scope for what starts from now on (a fight reads it as it sets up) and `null` reads the address again. */
  api['treated'] = (scope?: TreatedScope | null) => {
    if (scope === 'all' || scope === 'pack' || scope === null) setTreatedScope(scope);
    return { scope: treatedScope(), chapters: Object.keys(TREATED_CHAPTERS), holds: Object.fromEntries(Object.entries(PIECE_HOLDS).filter(([k]) => Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, k)).map(([k, v]) => [k, Object.keys(v)])), running: demoChapter() ?? null, reaches: isTreatedChapter(demoChapter()) };
  };
  /**
   * `booth-ffx2-b4-sky` (FFX-2 only): the measuring word of the Farplane's two plates. `skyGrade()` reads `{ word, active, armed, screen, chapters, options }` (`word`: the option the address or the last call asked for, `active`: the option patching the running room's table, null with
   * no word or outside Chapters V and XI, `armed`: the look rig and the pro arena are up, the only way the table reaches the screen, `screen`: the picture a still taken now shows, `release69` | `r70` | `a` | `b` | `c`, null outside Chapters V and XI: LABEL A STILL BY `screen`, never
   * by `active`); `skyGrade('a' | 'b' | 'c' | null)` sets the word live (a battle already running picks it up on the next frame: the LUT key carries it), `skyGrade(null)` on a page that opened with the word plays the r70 grade unpatched (the failing control arm, same page and same frame; `screen` says `r70`); no
   * argument is a read. On a page that opened WITHOUT the word the rig is not armed (the look is held), so a call mid-battle changes `active` and leaves `screen` at `release69`: open the page with `?skygrade=` to film an option. Default off.
   */
  api['skyGrade'] = (w?: SkyOption | null) => {
    if (w === null || (SKY_OPTIONS as readonly string[]).includes(w as string)) setSkyOption(w as SkyOption | null);
    const armed = lookState.armed && lookState.pro;
    return { word: skyOption(), active: skyActive(), armed, screen: skyScreen(armed), chapters: { ...SKY_CHAPTERS }, options: Object.fromEntries(SKY_OPTIONS.map((o) => [o, SKY_CHANGES[o].name])) };
  };
  /** Live tuning of one room's table for captures: `proTune('gagazet', { colour: { exposure: 0.8 } })`. */
  api['proTune'] = (room: string, patch: Record<string, unknown>): boolean => proTune(room, patch);
  api['proPiece'] = (piece: ProPiece, on?: boolean): boolean => {
    if (!PRO_PIECES.includes(piece)) return false;
    if (typeof on === 'boolean') setProPiece(piece, on);
    return proPieceOn(piece);
  };
}
