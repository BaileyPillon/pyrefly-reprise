/**
 * THE FFX-2 AUTO CAMERA, PER STAGE (release 69, `booth-leblanc`; Bailey 2026-10-30: the booth treatment for every listed chapter, Leblanc first; FFX-2 only). Pure: no `three`, no DOM.
 *
 * `data/procam/proShots.ts` (GENERATED, `tools/procam/gen-pro-shots.mjs`) holds the real FFX-2 auto camera as the real-motion lane laid it on Chapter IV's Bevelle stage: four ranked candidates, each as an ABSOLUTE
 * eye position `focus + fitM * direction(azimuth, elevation)`, the azimuth counted from the stage's home azimuth (the direction of the resting rig's eye from the group's focus) and held inside the real 35 degree
 * corridor of the plate's front. The follower (`ProFollower`) only ever uses a candidate as the OFFSET `eye - focus` from the live centroid, so a second stage needs exactly two numbers of its own: the focus the
 * group stands round and the home azimuth. {@link retargetAutoCamera} rebuilds the four candidates from the same `azDeg`, `elDeg` and `fitM` the lane decoded, about the new stage's focus and home azimuth, so each
 * candidate keeps its angle from that plate's own front (Bevelle's reproduce to the lane's three decimals: `tests/unit/booth-leblanc-rows.test.ts`).
 *
 * What is OURS and not the lane's: the ranking and `fitM` were scored by the real game for the Bevelle group (three girls and a six-unit dragon); a narrower group stands nearer than 12 m in the real fit, so
 * the candidates here sit a little farther than the real score would put them. The follower blends them with the resting rig by {@link ProFollower.FOLLOW_BLEND} and never crops anyone (`ProFit`), so
 * the cost is a frame slightly looser than the real camera's, not a wrong one. Re-scoring them for each stage needs the lane's `shots.json` and the real fit rule (a job for the lane, not this file).
 */
import { PRO_AUTO_CAMERA } from '../../data/procam/proShots.ts';
import type { ProAutoCamera, V3 } from './ProTypes.ts';

/** What a stage supplies: the point the group stands round (the centroid of its figures at 0.9 of their heights, as the follower takes it) and the home azimuth, degrees (the resting rig's eye seen from that point; 0 = straight down the +z axis). */
export interface AutoStage {
  readonly focus: V3;
  readonly homeAzimuthDeg: number;
}

const r3 = (n: number): number => Math.round(n * 1000) / 1000;

/** The auto camera's four candidates rebuilt about another stage: same angles and distances, that stage's focus and home azimuth. */
export function retargetAutoCamera(base: ProAutoCamera, stage: AutoStage): ProAutoCamera {
  const rad = Math.PI / 180;
  return {
    ...base,
    focus: stage.focus,
    homeAzimuthDeg: stage.homeAzimuthDeg,
    cands: base.cands.map((c) => {
      const az = (stage.homeAzimuthDeg + c.azDeg) * rad;
      const el = c.elDeg * rad;
      const eye: V3 = [
        r3(stage.focus[0] + c.fitM * Math.cos(el) * Math.sin(az)),
        r3(stage.focus[1] + c.fitM * Math.sin(el)),
        r3(stage.focus[2] + c.fitM * Math.cos(el) * Math.cos(az)),
      ];
      return { ...c, eye };
    }),
  };
}

/**
 * The stages that carry their own auto camera, by CHAPTER id (the director knows the chapter, not the scene). A chapter with no row plays Bevelle's, as Chapter IV always has.
 *
 * `ffx2-leblanc` (Chapter VI, the Chateau's last room): the focus is the Act III group's centroid, each figure at 0.9 of its height: the girls at the scene's party slots (`leblanc-last-room.ts` PARTY_SLOTS:
 * (-2.05, 1.45), (-1.3, 0.1), (-0.9, -1.5), 1.68 tall) and the trio at `LEBLANC_ENEMY_SPOTS` (Ormi (2.55, -3.2), Logos (1.26, -5.0), Leblanc (2.21, -6.8), `LEBLANC_FIGURE_HEIGHTS` 1.935, 2.119, 1.763)
 * = (0.295, 1.628, -2.49); the home azimuth is the idle rig's eye (0, 2.8, 9.4) seen from it: atan2(-0.295, 11.89) = -1.42 degrees. Acts I and II stand three and two foes in the same room, so the
 * centroid moves a little and the follower's own `d = live focus - this focus` carries it.
 */
export const AUTO_STAGES: Readonly<Record<string, AutoStage>> = Object.freeze({
  'ffx2-leblanc': { focus: [0.295, 1.628, -2.49], homeAzimuthDeg: -1.42 },
});

/** The auto camera for a chapter: its stage's retargeted candidates, else the generated Bevelle camera. */
export function autoCameraFor(chapterId: string | undefined): ProAutoCamera {
  if (chapterId === undefined || !Object.prototype.hasOwnProperty.call(AUTO_STAGES, chapterId)) return PRO_AUTO_CAMERA;
  return retargetAutoCamera(PRO_AUTO_CAMERA, AUTO_STAGES[chapterId]!);
}
