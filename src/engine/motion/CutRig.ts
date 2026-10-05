/**
 * The rigs the camera may cut to at an action's first hit (round 21, PR-0364; FFX-2 only: only FFX-2 has a run-in and the A-1 framing rule).
 *
 * `BattleMoments.impact` asks `rigFor` for the struck foe's rig (`enemy`, else `action`, else `idle`) and lets the FFX-2 framing rule
 * (`ShotFit.ffx2Shot`) pick the first of that rig, `action`, `idle` that keeps the enemy in play and the whole party on screen; the
 * comfort preset then goes to its own version of that rig (`PresetCamera.shotRig`: `action~calm`, half the way from the master). The
 * run-in's truck stays on through that cut, so the planner has to judge the girls by the rig it lands on.
 *
 * The pick is made at the blow, with the runner at her stop and the boss in whatever pose it is in (Bahamut's wings change the quad it
 * reports), so the same attack was measured landing on `action~calm` in one run and on `idle` in the next. So this does not guess one
 * rig: it names each rig the rule could pick, those that keep every girl who is not running on screen at rest (the others stay where
 * they are through the run), and the master, which the rule falls back to. Pure on its ports; no `three`, no DOM.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleStage, CameraPort } from '../BattlePresenterPorts.ts';
import { FFX2_PARTY_MIN, partySubjects } from '../ShotFit.ts';

/** The rigs the first hit's cut may land on, by the name the camera knows each as (`real` maps an asked rig to the preset's version). */
export function cutRigsOf(stage: BattleStage, cam: CameraPort, runner: CombatantId, real: (asked: string) => string = (r) => r): string[] {
  const have = cam.rigNames;
  const foe = (['enemy', 'action', 'idle'] as const).find((n) => have.includes(n));
  if (!foe) return [];
  const runs = stage.actor(runner);
  const others = partySubjects(stage, FFX2_PARTY_MIN).filter((s) => s.actor !== runs);
  const out: string[] = [];
  for (const name of [foe, 'action', 'idle']) {
    if (!have.includes(name)) continue;
    const fits = name === 'idle' || !cam.frame || cam.frame(name, 0, others)?.fits !== false;
    const asked = real(name);
    if (fits && !out.includes(asked)) out.push(asked);
    if (name === 'idle') break;
  }
  return out;
}
