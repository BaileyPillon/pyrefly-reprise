/**
 * THE PRO CAMERA SWITCH (conference demo, lane "pro-camera", 2026-10-23; Bailey's picks of 2026-10-22: "Real game's shots, E33 polish" and "Camera on every action"). Everything this lane adds is
 * behind ONE switch, **OFF at compile time**, ON only in the two demo chapters:
 *
 * | key | values | the piece |
 * |---|---|---|
 * | `?camera=` | `pro`, `off` / `today` | the directed camera: the real FFX shots re-staged on Chapter I, Expedition 33-style moves on plain attacks, FFX-2's auto camera on Chapter IV |
 * | `?camdof=` | `on`, `off` | the soft background behind the acting figures (one extra pass; off unless named) |
 * | `?castshot=` | `0` to `4`, `random` | which of the real game's five caster close shots plays (default 2, the low push that keeps both figures whole; `random` draws as the real game does) |
 *
 * and the shared **`?pack=demo`**, which turns the camera ON (`pro`) in the demo chapters. A key named beside `pack` wins (`?pack=demo&camera=off` is the demo pack with today's camera: the A/B).
 * The playtest switchboard (`app/demo/switchboardModel.ts`) flips it with `;`.
 *
 * **Demo chapters only.** Chapter I is `seymour-flux` (FFX) and Chapter IV is `ffx2-bahamut` (FFX-2), the ids in `data/encounters.ts`; the battle screen names the running chapter
 * (`motion/DemoGate.setDemoChapter`). In any other chapter, and before a chapter is set (the unit tests, every other screen), every answer is today's: merging this lane changes nothing in the
 * live game. Pure: no `three`, no DOM but the address of the page (the `FeelSwitch` pattern).
 */

import { demoChapter, demoGameOf, isDemoChapter, packDemo, queryWord, type DemoGame } from '../motion/DemoGate.ts';

export interface ProCamKeys {
  /** `?camera=pro` true, `?camera=off|today` false, else null (not named). */
  camera: boolean | null;
  pack: boolean;
  dof: boolean | null;
  /** 0..4 a fixed caster shot, 'random' the real game's draw, null not named. */
  castshot: number | 'random' | null;
}

const NONE: ProCamKeys = { camera: null, pack: false, dof: null, castshot: null };

/** Read the keys from a search string (pure; `undefined` = no page). An unknown value is not named. */
export function parseProCamKeys(search: string | undefined): ProCamKeys {
  if (search === undefined) return NONE;
  const camera = queryWord(search, 'camera');
  const dof = queryWord(search, 'camdof');
  const shot = queryWord(search, 'castshot');
  const n = /^[0-4]$/.test(shot) ? Number(shot) : null;
  return {
    camera: camera === 'pro' ? true : camera === 'off' || camera === 'today' ? false : null,
    pack: packDemo(search),
    dof: dof === 'on' ? true : dof === 'off' ? false : null,
    castshot: shot === 'random' ? 'random' : n,
  };
}

let keys: ProCamKeys | null = null;
const forced: { camera?: boolean; dof?: boolean; castshot?: number | 'random' } = {};

function read(): ProCamKeys {
  if (keys === null) keys = parseProCamKeys(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return keys;
}

/** What the address and the setters say, WHATEVER the running chapter (the switchboard shows this). */
export function proCamConfigured(): boolean {
  const k = read();
  return forced.camera ?? k.camera ?? k.pack;
}

/** The directed camera is on right now: configured, and the running chapter is Chapter I or Chapter IV. */
export function proCamOn(): boolean {
  return isDemoChapter(demoChapter()) && proCamConfigured();
}

/** The game of the running demo chapter, or null outside them. */
export function proCamGame(): DemoGame | null {
  const id = demoChapter();
  return isDemoChapter(id) ? demoGameOf(id) : null;
}

/** The soft background is wanted (named only: it is one more pass, judged on its own). */
export function proDofOn(): boolean {
  return proCamOn() && (forced.dof ?? read().dof ?? false);
}

/** Which caster close shot plays: a fixed variant (default 2) or `random`. */
export function castShotChoice(): number | 'random' {
  return forced.castshot ?? read().castshot ?? 2;
}

// ---------------------------------------------------------------- tests and the debug surface

export function setProCam(value: boolean | undefined): void {
  if (value === undefined) delete forced.camera;
  else forced.camera = value;
}
export function setProDof(value: boolean | undefined): void {
  if (value === undefined) delete forced.dof;
  else forced.dof = value;
}
export function setCastShot(value: number | 'random' | undefined): void {
  if (value === undefined) delete forced.castshot;
  else forced.castshot = value;
}

/** Tests: forget the address and every forced value. */
export function resetProCamForTests(search?: string): void {
  keys = search === undefined ? null : parseProCamKeys(search);
  delete forced.camera;
  delete forced.dof;
  delete forced.castshot;
}
