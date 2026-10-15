/**
 * **The Evrae fight's shot table** (FFX only; the hidden Fayth chapter's website camera, `../../../engine/ffxcam/tableDirector.ts`).
 *
 * Derived by replaying FFX's battle-camera programs for the Evrae fight from Bailey's own copy, simplified to keyframes and clamped (variant B); not the game's scripts.
 *
 * It holds numbers only: poses and the curves between them (`./shotTypes.ts`), keyed by the beat, the ability, the acting slot, the target, the airship's range and the branch the programs drew.
 * No instruction, no condition, no script: `tests/unit/ffxcam-table-data.test.ts` pins that. How it was made, and what is a fit, is `research/ffx-battle-camera-evrae.md`.
 *
 * - Written by `tools/ffxcam-table-build.mjs` from a recording (`tools/ffxcam-record.mjs`) on Bailey's PC; do not edit by hand.
 * - Variant B: every pose was clamped to an eye azimuth within 35 degrees of the near default view's and to the look direction's pitch band the painted sky plate covers (`../../../engine/ffxcam/variant.ts`).
 * - Fitted within 0.5 FFX units (eye and look-at), 0.3 degrees (roll, field of view, view direction) of the clamped path; branch weights are how many of 96 seeds of the camera's dice drew the branch.
 */

import { EVRAE_SHOTS_1 } from './evrae-shots-1.ts';
import type { EvraeShotTable } from './shotTypes.ts';

export const EVRAE_SHOTS: EvraeShotTable = {
  format: 'echoes-evrae-shots/1',
  shots: {
  ...EVRAE_SHOTS_1,
  },
  routes: {
  r001: {
    'f**': [['', 96]],
    'n**': [['a001', 96]],
  },
  r002: {
    '*0*': [['a017', 46], ['a035', 50]],
    '*1*': [['a011', 46], ['a029', 50]],
    '*2*': [['a005', 46], ['a023', 50]],
  },
  r003: {
    '*0*': [['a018', 46], ['a036', 50]],
    '*1*': [['a011', 46], ['a029', 50]],
    '*2*': [['a004', 46], ['a022', 50]],
  },
  r004: {
    '*0*': [['a019', 46], ['a037', 50]],
    '*1*': [['a013', 46], ['a031', 50]],
    '*2*': [['a007', 46], ['a025', 50]],
  },
  r005: {
    'f**': [['a002', 96]],
    'n**': [['a003', 96]],
  },
  r006: {
    '*0*': [['a021', 46], ['a038', 50]],
    '*1*': [['a015', 46], ['a032', 50]],
    '*2*': [['a008', 46], ['a026', 50]],
  },
  r007: {
    '*0*': [['a043', 26], ['a047', 32], ['a050', 38]],
    '*1*': [['a043', 26], ['a047', 32], ['a049', 38]],
    '*2*': [['a043', 26], ['a047', 32], ['a048', 38]],
    'f**': [['', 96]],
  },
  r008: {
    '*0*': [['a018', 46], ['a036', 50]],
    '*1*': [['a012', 46], ['a030', 50]],
    '*2*': [['a006', 46], ['a024', 50]],
  },
  r009: {
    '***': [['a042', 96]],
  },
  r010: {
    '***': [['a041', 96]],
  },
  r011: {
    '***': [['a040', 96]],
  },
  r012: {
    'f**': [['', 96]],
    'n**': [['a002', 96]],
  },
  r013: {
    'f0*': [['a064', 46], ['a067', 50]],
    'f1*': [['a066', 46], ['a069', 50]],
    'f2*': [['a072', 46], ['a073', 50]],
    'n0*': [['a055', 46], ['a061', 50]],
    'n1*': [['a053', 46], ['a059', 50]],
    'n2*': [['a051', 46], ['a057', 50]],
  },
  r014: {
    '*0*': [['a020', 46], ['a039', 50]],
    '*1*': [['a014', 46], ['a033', 50]],
    '*2*': [['a009', 46], ['a027', 50]],
  },
  r015: {
    'f0*': [['a063', 46], ['a068', 50]],
    'f1*': [['a065', 46], ['a070', 50]],
    'f2*': [['a071', 46], ['a074', 50]],
    'n0*': [['a056', 46], ['a062', 50]],
    'n1*': [['a054', 46], ['a060', 50]],
    'n2*': [['a052', 46], ['a058', 50]],
  },
  r016: {
    '*0*': [['a016', 46], ['a034', 50]],
    '*1*': [['a010', 46], ['a028', 50]],
    '*2*': [['a004', 46], ['a022', 50]],
  },
  r017: {
    'f**': [['', 96]],
    'n**': [['a044', 26], ['a045', 38], ['a046', 32]],
  },
  },
  rows: {
  '@attack.monster': { open: 'r001' },
  '@attack.party': { open: 'r001' },
  aim: { open: 'r002' },
  'al-bhed-potion': { open: 'r003' },
  antidote: { open: 'r003' },
  'armor-break': { open: 'r004', launch: 'r005' },
  'banishing-blade': { open: 'r004' },
  bio: { open: 'r006', launch: 'r007' },
  blizzara: { open: 'r006', launch: 'r007' },
  blizzard: { open: 'r006', launch: 'r007' },
  cheer: { open: 'r008' },
  'dark-attack': { open: 'r002', launch: 'r005' },
  'dark-buster': { open: 'r002', launch: 'r005' },
  'delay-attack': { open: 'r008', launch: 'r005' },
  'dragon-fang': { open: 'r004' },
  'echo-screen': { open: 'r003' },
  'element-reels': { open: 'r002' },
  ether: { open: 'r003' },
  'evrae-haste': { launch: 'r005' },
  'evrae-inhale': { open: 'r009' },
  'evrae-out-of-breath-range': { launch: 'r005' },
  'evrae-photon-spray': { launch: 'r010' },
  'evrae-poison-breath': { launch: 'r011' },
  'evrae-stone-gaze': { launch: 'r005' },
  'evrae-swooping-scythe': { open: 'r012' },
  'eye-drops': { open: 'r003' },
  fira: { open: 'r006', launch: 'r007' },
  fire: { open: 'r006', launch: 'r007' },
  focus: { open: 'r006' },
  grenade: { open: 'r003', launch: 'r013' },
  haste: { open: 'r008' },
  'hi-potion': { open: 'r003' },
  jump: { open: 'r014' },
  lancet: { open: 'r014', launch: 'r015' },
  'magic-break': { open: 'r004', launch: 'r005' },
  'mental-break': { open: 'r004', launch: 'r005' },
  'phoenix-down': { open: 'r003' },
  potion: { open: 'r003' },
  'power-break': { open: 'r004', launch: 'r005' },
  provoke: { open: 'r008' },
  reflect: { open: 'r016' },
  remedy: { open: 'r003' },
  scan: { open: 'r006' },
  'shooting-star': { open: 'r004' },
  'silence-attack': { open: 'r002', launch: 'r005' },
  'sleep-attack': { open: 'r002', launch: 'r005' },
  'slice-and-dice': { open: 'r008' },
  slow: { open: 'r008', launch: 'r017' },
  soft: { open: 'r003' },
  'spiral-cut': { open: 'r008' },
  'stone-breath': { open: 'r014' },
  threaten: { open: 'r004' },
  thundara: { open: 'r006', launch: 'r007' },
  thunder: { open: 'r006', launch: 'r007' },
  use: { open: 'r016' },
  water: { open: 'r006', launch: 'r007' },
  watera: { open: 'r006', launch: 'r007' },
  },
  views: { near: 'd002', far: 'd001' },
  scenes: { pullBack: [['c001', 96]], moveIn: [['c002', 96]] },
  victory: { n: [['v001', 61], ['v002', 35]], f: [['v001', 61], ['v002', 35]] },
  defeat: {
    n0: [['x003', 96]],
    f0: [['x003', 96]],
    n1: [['x002', 96]],
    f1: [['x002', 96]],
    n2: [['x001', 96]],
    f2: [['x001', 96]],
  },
};
