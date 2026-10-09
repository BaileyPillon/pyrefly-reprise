/**
 * The affinity LABEL of a hit: which of weak / normal / resist / immune / absorb the damage event and the intent
 * panel print (re-parity W1; **FFX only**).
 *
 * The number is the kernel's (`kernel/element.ts`, `elementMod`); this is the word for it, read off the same
 * four byte masks by the same ladder, so the label and the damage cannot disagree (a test replays random masks
 * through both). The ladder, from `research/re-ffx-damage.md` section 5: any element bit the target is weak to
 * wins ("weak"); else a bit with none of null, resist, absorb is neutral ("normal"); else a resisted bit
 * ("resist"); else a nulled bit ("immune"); else every bit is absorbed ("absorb").
 */

import type { Affinity, ElementId, FFXCombatant } from '../../common/types.ts';
import type { ElementAffinity } from '../kernel/element.ts';
import { affinityMasks, elementMask } from './words.ts';

/** The label for a command element byte against a target's four masks. */
export function affinityLabel(element: number, masks: ElementAffinity): Affinity {
  const elem = element & 0xff;
  if (elem === 0) return 'normal';
  const absorb = masks.absorb & 0xff;
  const nul = masks.null & 0xff;
  const resist = masks.resist & 0xff;
  const weak = masks.weak & 0xff;
  if ((elem & weak) !== 0) return 'weak';

  let neutral = false;
  let resisted = false;
  let nulled = false;
  let absorbed = false;
  for (let bit = 1; bit <= 0x80; bit <<= 1) {
    if ((elem & bit) === 0) continue;
    const a = (absorb & bit) !== 0;
    const n = (nul & bit) !== 0;
    const r = (resist & bit) !== 0;
    if (!n && !r && !a) neutral = true;
    if (r && !n && !a) resisted = true;
    if (n && !a) nulled = true;
    if (a) absorbed = true;
  }
  if (neutral) return 'normal';
  if (resisted) return 'resist';
  if (nulled) return 'immune';
  if (absorbed) return 'absorb';
  return 'normal';
}

/** The label for a list of elements against a target: what the intent panel prints for one target. */
export function affinityOf(target: FFXCombatant, elements: readonly ElementId[]): Affinity {
  return affinityLabel(elementMask(elements), affinityMasks(target));
}
