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

export interface SwitchDef {
  /** `KeyboardEvent.code` (the number row; the numpad digits are the same keys). */
  code: string;
  /** What the key cap says. */
  key: string;
  /** The word on the label. */
  name: string;
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
    read: () => partyRigsMode(),
    flip: () => {
      const next = partyRigsMode() === 'on' ? 'off' : 'on';
      setPartyRigsMode(next);
      return next;
    },
    isNew: () => partyRigsMode() === 'on',
  },
  // key 8: Tidus T1 or T2 (the page's: it reloads)
  { code: 'Digit8', key: '8', name: 'Tidus', read: () => 't1', isNew: () => false },
  {
    code: 'Digit9',
    key: '9',
    name: 'moments',
    read: () => momentsMode(),
    flip: () => {
      const next = momentsMode() === 'new' ? 'today' : 'new';
      setMomentsMode(next);
      return next;
    },
    isNew: () => momentsMode() === 'new',
    set: (on) => setMomentsMode(on ? 'new' : 'today'),
  },
  {
    code: 'Minus',
    key: '-',
    name: 'shadow',
    read: () => (feelConfigured().shadow ? 'follow' : 'today'),
    flip: () => {
      const next = !feelConfigured().shadow;
      setShadowFollows(next);
      return next ? 'follow' : 'today';
    },
    isNew: () => feelConfigured().shadow,
    set: (on) => setShadowFollows(on),
  },
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
