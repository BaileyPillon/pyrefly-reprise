/**
 * `window.__pyrefly.smear(style?)`, `.smearOn()`, `.smearLog(reset?)` and `.smearStats()`: the smear's switch and its record, for captures and for the continuity harness (motion pass, lane "core", step 2).
 *
 * `smear()` returns `'off' | 'paint' | 'blur'` (from `?smear=` / `?pack=demo`, default off); `smear('paint' | 'blur' | 'off')` sets it for what starts from now on. The smear plays only in the demo
 * chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `smearOn()` is the answer for the running chapter. `smearLog()` returns every cut the engine planned as a smear, oldest first
 * (`engine/motion/SmearLog.ts`): the continuity harness excuses a fast swap in CHK-027 only when it matches one of these.
 */
import { resetSmearLog, smearLog, type PlannedSmear } from '../engine/motion/SmearLog.ts';
import { setSmearStyle, smearOn, smearStyle, type SmearStyle } from '../engine/motion/SmearSwitch.ts';
import { pinnedRelightCount, relightStats } from '../engine/look/relight/FigureRelight.ts';
import { resetSwapLog, swapLog } from '../engine/motion/SwapLog.ts';
import { causeClasses, causeMode, interludeMode, setCauseMode, setInterludeMode, setStanceMode, setSwapScope, stanceMode, swapScope, type CauseMode, type InterludeMode, type StanceMode, type SwapClass } from '../engine/motion/SwapSwitch.ts';

export function installSmearDebug(api: Record<string, unknown>): void {
  api['smear'] = (style?: SmearStyle): SmearStyle => {
    if (style === 'off' || style === 'paint' || style === 'blur') setSmearStyle(style);
    return smearStyle();
  };
  api['smearOn'] = (): boolean => smearOn();
  api['smearLog'] = (reset = false): PlannedSmear[] => smearLog(reset === true);
  api['smearStats'] = (): { planned: number; plane: number; rig: number; relightPinned: number; relight: typeof relightStats } => {
    const l = smearLog();
    return { planned: l.length, plane: l.filter((e) => e.kind === 'plane').length, rig: l.filter((e) => e.kind === 'rig').length, relightPinned: pinnedRelightCount(), relight: { ...relightStats } };
  };
  api['smearReset'] = (): void => resetSmearLog();
  // The fluidity pass (lane L1; `motion/SwapSwitch.ts`): `swapLog()` is why the presenter asked for a painting and every blend it designed; `swapSwitch({...})` reads or forces the switches.
  api['swapLog'] = (reset = false) => {
    const out = swapLog(reset === true);
    if (reset === true) resetSwapLog();
    return out;
  };
  api['swapSwitch'] = (set?: { interlude?: InterludeMode; stance?: StanceMode; cause?: CauseMode; classes?: SwapClass[]; scope?: 'pack' | 'all' }) => {
    if (set?.scope) setSwapScope(set.scope);
    if (set?.interlude) setInterludeMode(set.interlude);
    if (set?.stance) setStanceMode(set.stance);
    if (set?.cause || set?.classes) setCauseMode(set.cause ?? causeMode(), set.classes ?? undefined);
    return { interlude: interludeMode(), stance: stanceMode(), cause: causeMode(), classes: [...causeClasses()], scope: swapScope() };
  };
}
