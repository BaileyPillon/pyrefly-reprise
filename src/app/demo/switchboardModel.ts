/**
 * THE PLAYTEST SWITCHBOARD, THE MODEL (conference demo, Bailey's playtest of 2026-10-22; both games; presentation only; pure: no DOM). Bailey judges each new motion piece by flipping it during a
 * fight: smear paint, blur or off; camera punch today or new; hit-stop on or off; rumble; motion sounds; spell effects; the curves; the per-game moments; the contact shadow; and one key that flips
 * everything. This file is the list of switches and what each one reads and sets, on the lanes' OWN switch modules (`motion/CurvesSwitch`, `motion/SmearSwitch`, `motion/MomentsSwitch`,
 * `feel/FeelSwitch`, `spellfx/FxSwitch`); nothing here has a state of its own, so the board can never disagree with the game.
 *
 * Every switch still only acts in the two demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): a flip outside one is remembered and takes effect when one starts (`motion/DemoGate.ts`).
 * "On" is each lane's new value (`paint`, `new`, `short`, `on`, `follow`); "off" is TODAY's game, which is release 62's. The hit-stop's "off" is today's stop, not no stop.
 *
 * The Tidus T1/T2 art switch is the page's (`switchboard.ts`: it reloads the page, the art being fetched once); it is listed here so the key map is one table.
 */
import {
  feelConfigured,
  setMotionSfxOn,
  setPunchMode,
  setRumbleOn,
  setShadowFollows,
  setStopMode,
} from '../../engine/feel/FeelSwitch.ts';
import { curvesMode, setCurvesMode, type CurvesMode } from '../../engine/motion/CurvesSwitch.ts';
import { partyRigsMode, setPartyRigsMode } from '../../engine/motion/PartyRigsSwitch.ts';
import { momentsMode, setMomentsMode } from '../../engine/motion/MomentsSwitch.ts';
import { smearStyle, setSmearStyle, type SmearStyle } from '../../engine/motion/SmearSwitch.ts';
import { fxMode, setFxMode } from '../../engine/spellfx/FxSwitch.ts';
import { proMode, setProMode } from '../../engine/look/pro/ProSwitch.ts'; // lane pro-look
import { proCamConfigured, setProCam } from '../../engine/procam/ProCamSwitch.ts';
import { setStagingMode, stagingMode } from '../../engine/pro/staging/StagingSwitch.ts'; // lane "pro-staging"

export interface SwitchDef {
  /** `KeyboardEvent.code` (the number row; the numpad digits are the same keys). */
  code: string;
  /** What the key cap says. */
  key: string;
  /** The word on the label. */
  name: string;
  /** What it does, in plain words (the legend that `=` shows). */
  plain: string;
  /** What it is set to now. */
  read(): string;
  /** Flip to the next value and return it. The Tidus switch has no model flip: the page reloads (`flip` is absent). */
  flip?(): string;
  /** Is the piece showing the NEW version now (for the master key and the label's dimming)? */
  isNew(): boolean;
  /** Set the new version (`true`) or today's (`false`) without flipping (the master key). */
  set?(on: boolean): void;
}

const SMEAR_NEXT: Readonly<Record<SmearStyle, SmearStyle>> = { paint: 'blur', blur: 'off', off: 'paint' };

/** The real-clips key: today and new go to snappy, snappy to real, real back to new (the house curves). What the label reads for each curves mode. */
const REAL_NEXT: Readonly<Record<CurvesMode, CurvesMode>> = { today: 'real-snappy', new: 'real-snappy', 'real-snappy': 'real', real: 'new' };
const REAL_READ: Readonly<Record<CurvesMode, string>> = { today: 'off', new: 'off', 'real-snappy': 'snappy (1.1 s)', real: 'real speed' };
const isRealMode = (m: CurvesMode): boolean => m === 'real' || m === 'real-snappy';

export const SWITCHES: readonly SwitchDef[] = [
  {
    code: 'Digit1',
    key: '1',
    name: 'smear',
    plain: 'Motion smear: a brush-stroke trail behind fast moves (paint, blur or off)',
    read: () => smearStyle(),
    flip: () => {
      const next = SMEAR_NEXT[smearStyle()];
      setSmearStyle(next);
      return next;
    },
    isNew: () => smearStyle() !== 'off',
    set: (on) => setSmearStyle(on ? (smearStyle() === 'blur' ? 'blur' : 'paint') : 'off'),
  },
  {
    code: 'Digit2',
    key: '2',
    name: 'punch',
    plain: 'Camera punch: the small push-in the camera gives on a hit',
    read: () => feelConfigured().punch,
    flip: () => {
      const next = feelConfigured().punch === 'new' ? 'today' : 'new';
      setPunchMode(next);
      return next;
    },
    isNew: () => feelConfigured().punch === 'new',
    set: (on) => setPunchMode(on ? 'new' : 'today'),
  },
  {
    code: 'Digit3',
    key: '3',
    name: 'stop',
    plain: 'Hit-stop: the short freeze of the field on a heavy hit',
    read: () => feelConfigured().stop,
    flip: () => {
      const next = feelConfigured().stop === 'short' ? 'today' : 'short';
      setStopMode(next);
      return next;
    },
    isNew: () => feelConfigured().stop === 'short',
    set: (on) => setStopMode(on ? 'short' : 'today'),
  },
  {
    code: 'Digit4',
    key: '4',
    name: 'rumble',
    plain: 'Gamepad rumble on heavy hits',
    read: () => (feelConfigured().rumble ? 'on' : 'off'),
    flip: () => {
      const next = !feelConfigured().rumble;
      setRumbleOn(next);
      return next ? 'on' : 'off';
    },
    isNew: () => feelConfigured().rumble,
    set: (on) => setRumbleOn(on),
  },
  {
    code: 'Digit5',
    key: '5',
    name: 'sounds',
    plain: 'Motion sounds: footsteps, whooshes and landings',
    read: () => (feelConfigured().motionsfx ? 'on' : 'off'),
    flip: () => {
      const next = !feelConfigured().motionsfx;
      setMotionSfxOn(next);
      return next ? 'on' : 'off';
    },
    isNew: () => feelConfigured().motionsfx,
    set: (on) => setMotionSfxOn(on),
  },
  {
    code: 'Digit6',
    key: '6',
    name: 'fx',
    plain: "Spell effects and the bosses' attack effects",
    read: () => fxMode(),
    flip: () => {
      const next = fxMode() === 'new' ? 'today' : 'new';
      setFxMode(next);
      return next;
    },
    isNew: () => fxMode() === 'new',
    set: (on) => setFxMode(on ? 'new' : 'today'),
  },
  {
    code: 'Digit7',
    key: '7',
    name: 'curves',
    plain: 'Animation curves: the strike, the cast lift, the recoil and the squash',
    read: () => curvesMode(),
    flip: () => {
      const next: CurvesMode = curvesMode() === 'today' ? 'new' : 'today'; // a real mode (`,`) goes back to today's with this key
      setCurvesMode(next);
      return next;
    },
    isNew: () => curvesMode() !== 'today',
    set: (on) => setCurvesMode(on ? (isRealMode(curvesMode()) ? curvesMode() : 'new') : 'today'), // the master key keeps a real mode that is already chosen
  },
  // `,`: the curves driven by the real game's clips (integration 2): off (the house numbers, `new`), snappy (real proportions at the 1.1 s pick), real (the real speed). The label says it truthfully on key 7.
  {
    code: 'Comma',
    key: ',',
    name: 'real clips',
    plain: "Timing taken from the real game's clips (off, snappy or real speed)",
    read: () => REAL_READ[curvesMode()],
    flip: () => {
      const next: CurvesMode = REAL_NEXT[curvesMode()];
      setCurvesMode(next);
      return REAL_READ[next];
    },
    isNew: () => isRealMode(curvesMode()),
  },
  // `.`: the two party rig pilots, Tidus in Chapter I and Rikku's Dark Knight in Chapter IV (integration 2). Asked when a fight starts: a flip in a fight takes effect in the next one.
  {
    code: 'Period',
    key: '.',
    name: 'party rigs',
    plain: 'The animated party figures, Tidus in Chapter I and Rikku in Chapter IV (a flip plays from the next fight)',
    read: () => partyRigsMode(),
    flip: () => {
      const next = partyRigsMode() === 'on' ? 'off' : 'on';
      setPartyRigsMode(next);
      return next;
    },
    isNew: () => partyRigsMode() === 'on',
  },
  // key 8: Tidus T1 or T2 (the page's: it reloads)
  { code: 'Digit8', key: '8', name: 'Tidus', plain: "Tidus's art, T1 or T2 (reloads the page, so press it between fights)", read: () => 't1', isNew: () => false },
  {
    code: 'Digit9',
    key: '9',
    name: 'moments',
    plain: 'The victory and knock-out moments',
    read: () => momentsMode(),
    flip: () => {
      const next = momentsMode() === 'new' ? 'today' : 'new';
      setMomentsMode(next);
      return next;
    },
    isNew: () => momentsMode() === 'new',
    set: (on) => setMomentsMode(on ? 'new' : 'today'),
  },
  // `/`: the pro look (lane "pro-look"): the arena's "Cinematic contrast" grade, the Chapter IV seam fix, "Ink and light" hits, the glass damage numbers and the markers, all at once. Today = release 62's look.
  {
    code: 'Slash',
    key: '/',
    name: 'look',
    plain: "Pro look: the arena's colour and light, the ink hits, the glass damage numbers, the target and low-HP markers",
    read: () => (proMode() === 'pro' ? 'pro' : 'today'),
    flip: () => {
      const next = proMode() === 'pro' ? 'today' : 'pro';
      setProMode(next);
      return next;
    },
    isNew: () => proMode() === 'pro',
    set: (on) => setProMode(on ? 'pro' : 'today'),
  },
  {
    code: 'Minus',
    key: '-',
    name: 'shadow',
    plain: 'The contact shadow that follows the feet',
    read: () => (feelConfigured().shadow ? 'follow' : 'today'),
    flip: () => {
      const next = !feelConfigured().shadow;
      setShadowFollows(next);
      return next ? 'follow' : 'today';
    },
    isNew: () => feelConfigured().shadow,
    set: (on) => setShadowFollows(on),
  },
  // `;`: the directed camera (lane "pro-camera"): the real FFX shots on Chapter I, moves on plain attacks, FFX-2's auto camera on Chapter IV. Read at each beat: a flip plays from the next action.
  {
    code: 'Semicolon',
    key: ';',
    name: 'camera',
    plain: "Directed camera: the real game's shots, push-ins on attacks, the FFX-2 follow camera and the soft background",
    read: () => (proCamConfigured() ? 'pro' : 'today'),
    flip: () => {
      const next = !proCamConfigured();
      setProCam(next);
      return next ? 'pro' : 'today';
    },
    isNew: () => proCamConfigured(),
    set: (on) => setProCam(on),
  },
  // The backslash key: the pro staging (lane "pro-staging"): the boss big moves' held breath, the boss card as a painting, the victory freeze and the defeat card, the Overdrive opening and the Change's pearl plate. A flip in a fight plays from the next beat (the layer is built as a fight begins).
  {
    code: 'Backslash',
    key: '\\',
    name: 'staging',
    plain: 'Staging: the held breath before Total Annihilation and Mega Flare, the boss card, the victory freeze and the defeat card, the Overdrive opening and the Change plate',
    read: () => stagingMode(),
    flip: () => {
      const next = stagingMode() === 'pro' ? 'today' : 'pro';
      setStagingMode(next);
      return next;
    },
    isNew: () => stagingMode() === 'pro',
    set: (on) => setStagingMode(on ? 'pro' : 'today'),
  },
];

/** The keys that are not a piece's own, with what they do in plain words (the legend names them after the pieces). */
export const EXTRA_KEYS: ReadonlyArray<{ key: string; plain: string }> = [
  { key: '0', plain: "Everything: if every piece is new, all go back to today's; otherwise all go to new" },
  { key: '=', plain: 'This legend, then hide the label, then the label again' },
];

/** The master key, `0`. */
export const MASTER_CODE = 'Digit0';
/** Hide or show the label, `=`. */
export const HIDE_CODE = 'Equal';
/** The Tidus T1/T2 key. */
export const TIDUS_CODE = 'Digit8';

/** `KeyboardEvent.code` normalised: the numpad digits are the number row's. */
export function normaliseCode(code: string): string {
  return code.startsWith('Numpad') && /^Numpad\d$/.test(code) ? `Digit${code.slice(6)}` : code === 'NumpadSubtract' ? 'Minus' : code;
}

/** The switch a key flips, or undefined. */
export function switchOfCode(code: string): SwitchDef | undefined {
  const c = normaliseCode(code);
  return SWITCHES.find((s) => s.code === c);
}

/** True when every flippable piece shows the new version. */
export function allNew(): boolean {
  return SWITCHES.every((s) => !s.set || s.isNew());
}

/** The master key: if every piece is new, all go to today's; else all go to new. Returns the state it set (`true` = all new). */
export function flipAll(): boolean {
  const toNew = !allNew();
  for (const s of SWITCHES) s.set?.(toNew);
  return toNew;
}

/** Every piece's name and value, for the label and `__pyrefly.switchboard()`. */
export function boardState(): Array<{ key: string; name: string; value: string; isNew: boolean }> {
  return SWITCHES.filter((s) => s.code !== TIDUS_CODE).map((s) => ({ key: s.key, name: s.name, value: s.read(), isNew: s.isNew() }));
}

/** The legend `=` shows: every key in plain words with what it is set to now (the pieces in key order, then the keys that are not a piece's own). */
export function legendRows(): Array<{ key: string; name: string; plain: string; value: string; isNew: boolean }> {
  const rows = SWITCHES.map((s) => ({ key: s.key, name: s.name, plain: s.plain, value: s.read(), isNew: s.isNew() }));
  return [...rows, ...EXTRA_KEYS.map((e) => ({ key: e.key, name: e.key === '0' ? 'all' : 'legend', plain: e.plain, value: '', isNew: false }))];
}
