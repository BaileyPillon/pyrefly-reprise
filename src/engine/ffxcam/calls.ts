/**
 * **The call dictionary** of the camera-program VM (`./vm.ts`): which statement calls change the camera, and which are known and have nothing to do with it.
 *
 * - {@link SOLVER_CALLS}: the calls that write the rig (`D:\Tools\ffx-parity\camera\programs\evrae\SPEC.md` section 6.1 and 6.2). The names are the engine's script names (the FFXDataParser's), one
 *   pair per point: `camSetPolar`/`refSetPolar`, `camSetPos`/`refSetPos`, the character-relative `camSetBtl`/`camSetBtlPolar`/`camSetBtlPolar2`/`camSetChrPolar`/`camSetChrPolar2` (and the `ref` ones
 *   that exist), `camSetRoll`, `camSetScrDpt`, and the moves `camMove`, `camMoveCos`, `camMoveAcc` with their `Polar` variants (`camMovePolar`, `camMovePolarCos`, `camMovePolarAcc`) and the `ref` twins,
 *   plus `camResetMove`/`refResetMove`. The programs of the Evrae fight use none of the Cos or Polar variants; they are here because the format has them and the tests exercise them.
 * - The VM itself handles the calls that touch time or the thread (`wait`, `camWait`, `refWait`, `camReq`) and `writeBtlChrProperty` (it goes to the host).
 * - {@link INERT_CALLS}: known calls with no effect on the camera, ignored by design and counted: presentation flags (`btlSetUpVectorFlag`, `btlSetCursorType`), screen blur, state copies into script
 *   variables (`camGetRealPos`), voice, dialogue and motion requests of the scene drivers, `print?`. Their effect on the picture, where they have one, is not the camera's (SPEC 6.4).
 *
 * A call in none of these is **unknown**: the VM logs it once and ignores it. Pure. Game case: FFX only.
 */

import { EYE, REF, type CameraSolver, type PointId } from './solver.ts';
import type { Recipe } from './recipe.ts';

export type CallHandler = (solver: CameraSolver, a: readonly number[]) => void;

const at = (a: readonly number[], i: number): number => a[i] ?? 0;

function build(): Record<string, CallHandler> {
  const calls: Record<string, CallHandler> = {
    camSetRoll: (s, a) => s.setRoll(at(a, 0)),
    camSetScrDpt: (s, a) => s.setScrDpt(at(a, 0)),
  };
  const points: ReadonlyArray<readonly [string, PointId]> = [
    ['cam', EYE],
    ['ref', REF],
  ];
  for (const [who, p] of points) {
    calls[`${who}SetPos`] = (s, a) => s.setPos(p, at(a, 0), at(a, 1), at(a, 2));
    calls[`${who}SetPolar`] = (s, a) => s.setPolar(p, at(a, 0), at(a, 1), at(a, 2));
    calls[`${who}ResetMove`] = (s) => s.resetMove(p);
    // The blends: the plain ones interpolate x, y and z, the Polar ones yaw, pitch and length about the look-at.
    for (const polar of [false, true]) {
      const infix = polar ? 'Polar' : '';
      calls[`${who}Move${infix}`] = (s, a) => s.armMove(p, { kind: 1, n: at(a, 0), polar });
      calls[`${who}Move${infix}Cos`] = (s, a) => s.armMove(p, { kind: 3, n: at(a, 0), polar });
      calls[`${who}Move${infix}Acc`] = (s, a) => s.armMove(p, { kind: 2, a: at(a, 0), b: at(a, 1), c: at(a, 2), d: at(a, 3), polar });
    }
  }
  // Character-relative destinations: selectors A and B, then a height fraction (percent), a yaw and a pitch (degrees) and a radius (percent).
  const recipe = (p: PointId, kind: Recipe['kind']): CallHandler => (s, a) => s.setRecipe(p, kind, at(a, 0), at(a, 1), at(a, 2), at(a, 3), at(a, 4), at(a, 5));
  calls['refSetBtl'] = recipe(REF, 0);
  calls['camSetBtl'] = recipe(EYE, 0);
  calls['refSetBtlPolar'] = recipe(REF, 1);
  calls['camSetBtlPolar'] = recipe(EYE, 1);
  calls['refSetBtlPolar2'] = recipe(REF, 2);
  calls['camSetBtlPolar2'] = recipe(EYE, 2);
  calls['camSetChrPolar'] = recipe(EYE, 3);
  calls['camSetChrPolar2'] = recipe(EYE, 4);
  return calls;
}

/** The calls that write the rig, by script name. */
export const SOLVER_CALLS: Readonly<Record<string, CallHandler>> = build();

/** The calls the VM runs itself because they touch time, the thread or the host. */
export const VM_CALLS: ReadonlySet<string> = new Set(['wait', 'camWait', 'refWait', 'camReq', 'writeBtlChrProperty']);

/** Known calls with no effect on the camera. */
export const INERT_CALLS: ReadonlySet<string> = new Set([
  'attachToCamera', // binds the worker to the camera controller: the one controller is always the active one here
  'btlSetUpVectorFlag', // presentation flags
  'btlSetCursorType',
  'btlSetCameraSelectMode',
  'camGetPos', // copies of the camera state into script variables; the Evrae programs never read them back
  'refGetPos',
  'camGetRealPos',
  'refGetRealPos',
  'print?', // a debug no-op
  'camBlur', // screen blur is the picture's, not the rig's
  'motionBlurEffect',
  'setMapLayerVisibility',
  'btlWait', // "the battle flow is idle": the scene drivers' wait, not a camera one
  'btlOn',
  'btlStatusOn',
  'btlStatusOff',
  'btlReqMotion',
  'btlmesa', // dialogue, voice and text of the scene drivers
  'btlmeswait_voice',
  'btlVoiceStart',
  'btlVoiceStop',
  'btlVoiceSync',
  'loadBattleVoiceLine',
  'displayBattleString',
  'displayBattleDialogString',
  'closeTextImmediately',
  'closeTextOnConfirm',
  'activateMouthMovement',
  'deactivateMouthMovement',
]);
