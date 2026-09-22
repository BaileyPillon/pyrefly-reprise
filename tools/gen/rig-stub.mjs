#!/usr/bin/env node
/**
 * Materialises the living-portrait v2 stand-in rig as a JSON file, for
 * review or for pointing a copy of the runtime at a fixed snapshot. The
 * runtime itself (`docs/concepts/pause-until-dawn/prototype-v2/src/rig.ts`)
 * does NOT need this file to exist — it builds the same stand-in in memory
 * whenever `art/rig.json` is missing (a plain 404 is the normal state until
 * the art agent delivers the real one).
 *
 * Usage: node tools/gen/rig-stub.mjs > docs/concepts/pause-until-dawn/prototype-v2/art/rig.stand-in.json
 */

const RIG_CONSTANTS = {
  spring: { tau: 0.14, neutralReturnTau: 0.6 },
  yaw: { maxDeg: 35 },
  blink: {
    closeS: 0.05,
    holdMinS: 0.017,
    holdMaxS: 0.05,
    openS: 0.066,
    fullMeanIntervalS: 4.9,
    fullMinIntervalS: 2.5,
    fullMaxIntervalS: 8,
    halfDurationS: 0.2,
    halfApertureMin: 0.5,
    halfApertureMax: 0.6,
  },
  sway: {
    bandHzMin: 0.13,
    bandHzMax: 0.34,
    headAmpPctHeadWidthMin: 1.5,
    headAmpPctHeadWidthMax: 3,
    chestAmpPctIpd: 3,
    chestPhaseLagFraction: 1 / 3,
  },
  expression: { onsetMs: 400, decayS: 2.8, eventMeanIntervalS: 4, browAmplitudeFraction: 0.4 },
  image: { grainPctMin: 0.3, grainPctMax: 0.5, relightLevels: 5 },
  reducedMotion: { tau: 0.25 },
  hurt: { swayRateMultiplier: 1.6, gazeTighten: 0.7, browRateMultiplier: 1.6 },
};

const rig = {
  character: 'yuna-x2',
  canvas: { width: 832, height: 1216 },
  bodyFile: 'keys/frontal.png',
  headBox: { x: 0.1, y: 0.06, w: 0.8, h: 0.56 },
  keys: [{ id: 'frontal', yawDeg: 0, file: 'keys/frontal.png' }],
  patches: {
    eyes: {
      box: [248, 345, 517, 125],
      pad: 24,
      feather: 8,
      states: { open: { file: null }, half: { file: 'patches/eyes/half.png' }, closed: { file: 'patches/eyes/closed.png' } },
    },
    mouth: {
      box: [300, 585, 320, 105],
      pad: 24,
      feather: 8,
      states: {
        neutral: { file: null },
        parted: { file: 'patches/mouth/parted.png' },
        smile: { file: 'patches/mouth/smile.png' },
        pressed: { file: 'patches/mouth/pressed.png' },
      },
    },
    brows: { box: [260, 300, 500, 65], pad: 16, feather: 8, states: { neutral: { file: null }, raised: { file: null }, drawn: { file: null } } },
  },
  constants: RIG_CONSTANTS,
  standIn: true,
  note:
    'Stand-in only — see docs/concepts/pause-until-dawn/prototype-v2/README.md. ' +
    'headBox is hand-eyeballed, not measured; keys has only the frontal plate.',
};

process.stdout.write(JSON.stringify(rig, null, 2) + '\n');
