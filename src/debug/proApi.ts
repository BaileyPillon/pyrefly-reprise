/**
 * `window.__pyrefly.pro(mode?)`, `.proOn()` and `.proPiece(piece, on?)`: the pro-look switch for captures and checks (lane "pro-look"; `engine/look/pro/ProSwitch.ts`).
 *
 * `pro()` returns `'pro'` or `'today'` (from `?look=pro` / `?pack=demo`, default today); `pro('pro' | 'today')` sets it live (the arena's grade is read again at once, the other pieces for what starts from now
 * on). The pro look plays only in the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `proOn()` is the answer for the running chapter. `proPiece(piece, on?)` reads or sets one
 * piece (arena, seam, hits, numbers, markers) and answers whether it plays now.
 */
import { PIECE_HOLDS, TREATED_CHAPTERS, demoChapter, isTreatedChapter, setTreatedScope, skyWord, treatedHolds, treatedScope, type TreatedScope } from '../engine/motion/DemoGate.ts';
import { proTune } from '../engine/look/pro/ProGrade.ts';
import { SKY_CHAPTERS, SKY_CHANGES, SKY_DEFAULTS, SKY_OPTIONS, setSkyOption, skyActive, skyOption, skyScreen, type SkyOption } from '../engine/look/pro/SkyGrade.ts';
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
    return { scope: treatedScope(), chapters: Object.keys(TREATED_CHAPTERS), holds: Object.fromEntries(Object.keys(PIECE_HOLDS).filter((k) => Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, k)).map((k): [string, string[]] => [k, treatedHolds(k)])), running: demoChapter() ?? null, reaches: isTreatedChapter(demoChapter()) };
  };
  /**
   * `booth-ffx2-b4-sky` and `r72-sky` (FFX-2 only): the measuring word of the Farplane's two plates. `skyGrade()` reads `{ word, mode, active, armed, screen, chapters, defaults, options }` (`word`: the option the address or the last call named, null with none, `mode`: the whole word, `a` | `b` | `c` |
   * `today` | `off` | `default`, `active`: the option patching the running room's table (the named one, else the chapter's default: Chapter XI grade C since r72), null outside Chapters V and XI or when no grade reaches the chapter, `armed`: the look rig and the pro arena are up, the only way the table reaches the
   * screen, `screen`: the picture a still taken now shows, `release69` | `r70` | `a` | `b` | `c`, null outside Chapters V and XI: LABEL A STILL BY `screen`, never by `active`); `skyGrade('a' | 'b' | 'c' | 'today' | null)` sets the word live (a battle already running picks it up on the next frame as far as the
   * room's table goes: the LUT key carries it), `skyGrade(null)` plays the room's own grade unpatched (the failing control arm, same page and same frame; `screen` says `r70` where the rig is armed), `skyGrade('today')` is release 71's Chapter XI (its look and arena held again from the next battle on); no argument is a read.
   * The rig is built when a battle sets up, so a call mid-battle changes `active` and not what the rig is: open the page with the word (`?skygrade=`) to film an option or release 71's frame.
   */
  api['skyGrade'] = (w?: SkyOption | 'today' | null) => {
    if (w === null || w === 'today' || (SKY_OPTIONS as readonly string[]).includes(w as string)) setSkyOption(w);
    const armed = lookState.armed && lookState.pro;
    return { word: skyOption(), mode: skyWord(), active: skyActive(), armed, screen: skyScreen(armed), chapters: { ...SKY_CHAPTERS }, defaults: { ...SKY_DEFAULTS }, options: Object.fromEntries(SKY_OPTIONS.map((o) => [o, SKY_CHANGES[o].name])) };
  };
  /** Live tuning of one room's table for captures: `proTune('gagazet', { colour: { exposure: 0.8 } })`. */
  api['proTune'] = (room: string, patch: Record<string, unknown>): boolean => proTune(room, patch);
  api['proPiece'] = (piece: ProPiece, on?: boolean): boolean => {
    if (!PRO_PIECES.includes(piece)) return false;
    if (typeof on === 'boolean') setProPiece(piece, on);
    return proPieceOn(piece);
  };
}
