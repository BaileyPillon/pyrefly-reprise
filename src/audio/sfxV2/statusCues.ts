/**
 * The recorded set's cue for a status landing (D-302), the first status of an action; later ones in
 * the same action play the quiet `status-applied` bell (`battleVoice.ts`).
 *
 * The set's proposal (its README, "status-add") names haste, protect, shell, regen, reflect, the four
 * Nuls, Auto-Life, poison, sleep, silence, slow and stop; every other positive status takes
 * `buff-generic`, every other negative one `debuff-generic` (each resolves to its FFX-2 twin in an
 * FFX-2 chapter). Positive or negative is read from the status's own effect as the type comments in
 * `src/battle/common/types.ts` describe it; presentation only, no game data.
 * Additions: Defend / Guard / Sentinel (FFX's guarding stances) take the set's `guard` clank; KO,
 * Eject and SOS "Critical" (automatic under half HP) take the bell, because their own beats play their own sound.
 *
 * A `Record` over every status id of both games, so a new status fails the type check until it is
 * classified here.
 */

import type { StatusId } from '../../battle/common/types.ts';

const BUFF = 'buff-generic';
const DEBUFF = 'debuff-generic';
const BELL = 'status-applied';

export const STATUS_CUES: Readonly<Record<StatusId, string>> = {
  // Named by the set.
  haste: 'haste',
  slow: 'slow',
  protect: 'protect',
  shell: 'shell',
  reflect: 'shell',
  regen: BUFF,
  nulblaze: BUFF,
  nulfrost: BUFF,
  nulshock: BUFF,
  nultide: BUFF,
  'auto-life': BUFF,
  poison: 'poison',
  sleep: 'sleep',
  silence: 'silence',
  stop: 'stop',
  // Guarding stances (FFX).
  defend: 'guard',
  guard: 'guard',
  sentinel: 'guard',
  // Other positives.
  shield: BUFF,
  boost: BUFF,
  cheer: BUFF,
  focus: BUFF,
  aim: BUFF,
  reflex: BUFF,
  luck: BUFF,
  'max-hp-x2': BUFF,
  'max-mp-x2': BUFF,
  'mp-cost-zero': BUFF,
  'damage-9999': BUFF,
  'guaranteed-critical': BUFF,
  'overdrive-x2': BUFF,
  'overdrive-x1_5': BUFF,
  invincible: BUFF,
  'null-magic': 'shell',
  'null-physical': 'protect',
  spellspring: BUFF,
  'str-up': BUFF,
  'mag-up': BUFF,
  'def-up': BUFF,
  'mdef-up': BUFF,
  'accu-up': BUFF,
  'eva-up': BUFF,
  'luck-up': BUFF,
  scan: BELL,
  // Negatives.
  zombie: DEBUFF,
  petrify: DEBUFF,
  darkness: DEBUFF,
  berserk: DEBUFF,
  confuse: DEBUFF,
  doom: DEBUFF,
  curse: DEBUFF,
  provoke: DEBUFF,
  threaten: DEBUFF,
  'power-break': DEBUFF,
  'magic-break': DEBUFF,
  'armor-break': DEBUFF,
  'mental-break': DEBUFF,
  jinx: DEBUFF,
  itchy: DEBUFF,
  pointless: DEBUFF,
  'delay-effect': DEBUFF,
  'action-cancel': DEBUFF,
  shattering: DEBUFF,
  'str-down': DEBUFF,
  'mag-down': DEBUFF,
  'def-down': DEBUFF,
  'mdef-down': DEBUFF,
  'accu-down': DEBUFF,
  'eva-down': DEBUFF,
  'luck-down': DEBUFF,
  // Their own beats play their own sound.
  ko: BELL,
  eject: BELL,
  critical: BELL,
};
