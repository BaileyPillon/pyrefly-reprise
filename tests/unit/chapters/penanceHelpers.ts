/** Small lookups for the Penance chapter's tests (FFX only). */
import type { AbilityDef } from '../../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';

/** An ability row by id, or a thrown error naming it. */
export function dark(id: string): AbilityDef {
  const a = ALL_ABILITIES.find((x) => x.id === id);
  if (!a) throw new Error(`no ability '${id}'`);
  return a;
}
