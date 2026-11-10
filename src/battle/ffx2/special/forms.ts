/**
 * The three Special dresspheres as the engine knows them: which girl wears which, the job ids of the nine parts, each part's ladder of commands, and the dressphere registry that lists them
 * (Floral Fallal, Machina Maw and Full Throttle; **FFX-2 only**, behind the `specialDressUp` switch, OFF by default).
 *
 * Sourced from the game's own tables (`research/re-ffx2-special-dresspheres.md` sections 2 and 3): the three main jobs are the girls' (exe 0x0061dd70, `kernel/spherechange.ts#FFX2_SPECIAL_JOB_OF_GIRL`:
 * 0x500f Yuna, 0x5012 Rikku, 0x5015 Paine), each followed by its two pods (`kernel/dressphere-stats.ts#isSpecialJob`); the ladders are `data/ffx2/dresspheres/special/*` (the nine parts' sixteen
 * (prerequisite, ability) pairs from `kernel/job.bin`). The part ids and names are ours: the data's `partIds` (`ids.ts#SpecialDresspherePartId`).
 */

import { SPECIAL_DRESSPHERES } from '../../../data/ffx2/dresspheres/special/index.ts';
import type { SpecialDressphereId } from '../../../data/ffx2/ids.ts';
import type { DressphereDef, DressphereRegistry } from '../internal.ts';
import { FFX2_SPECIAL_JOB_OF_GIRL } from '../kernel/spherechange.ts';

export type SpecialId = SpecialDressphereId;

/** The girl each Special belongs to: Floral Fallal is Yuna's, Machina Maw Rikku's, Full Throttle Paine's (`kernel/dressphere-stats.ts#girlJob`; `research/ffx2-combat-core.md` section 3.15). */
export const GIRL_SPECIAL: Readonly<Record<string, SpecialId>> = { yuna: 'floral-fallal', rikku: 'machina-maw', paine: 'full-throttle' };

/** The girl's index in the game's save records (the pods are the children `3 + 2 * girl + k`, `re-ffx2-dressphere.md` section 2.6). */
export const GIRL_INDEX: Readonly<Record<string, number>> = { yuna: 0, rikku: 1, paine: 2 };

export interface PartDef {
  /** Also the dressphere id the part wears: the Special's own id for the main body. */
  readonly id: string;
  readonly name: string;
  /** The game's job id (`0x500f` and up). */
  readonly job: number;
  readonly role: 'main' | 'pod';
  /** The command abilities of this part's ladder, in the game's order. */
  readonly abilityIds: readonly string[];
  /** The ones the game lists from the start (the pairs with no prerequisite): what a part knows before it has learned anything. */
  readonly freeIds: readonly string[];
}

export interface FormDef {
  readonly id: SpecialId;
  readonly name: string;
  readonly girl: string;
  readonly main: PartDef;
  /** In the game's job order (`k` = 0, 1): the child records `3 + 2 * girl + k`. */
  readonly pods: readonly [PartDef, PartDef];
}

/** The pods' display names, in the job order of the data's `podA` and `podB` (`research/re-ffx2-special-dresspheres.md` section 3). */
const POD_NAMES: Readonly<Record<SpecialId, readonly [string, string]>> = {
  'floral-fallal': ['Right Pistil', 'Left Pistil'],
  'machina-maw': ['Smasher-R', 'Crusher-L'],
  'full-throttle': ['Dextral Wing', 'Sinistral Wing'],
};

const girlOf = (id: SpecialId): string => Object.keys(GIRL_SPECIAL).find((g) => GIRL_SPECIAL[g] === id) as string;

function formOf(id: SpecialId): FormDef {
  const data = SPECIAL_DRESSPHERES[id];
  const girl = girlOf(id);
  const job = FFX2_SPECIAL_JOB_OF_GIRL[GIRL_INDEX[girl] as number] as number;
  const ids = (entries: ReadonlyArray<{ abilityId: string }>): string[] => entries.map((e) => e.abilityId);
  const free = (entries: ReadonlyArray<{ abilityId: string; free?: boolean }>): string[] => entries.filter((e) => e.free === true).map((e) => e.abilityId);
  const pod = (k: 0 | 1): PartDef => ({
    id: k === 0 ? data.partIds.podA : data.partIds.podB,
    name: (POD_NAMES[id] as readonly [string, string])[k],
    job: job + 1 + k,
    role: 'pod',
    abilityIds: ids(k === 0 ? data.abilities.podA : data.abilities.podB),
    freeIds: free(k === 0 ? data.abilities.podA : data.abilities.podB),
  });
  return { id, name: data.name, girl, main: { id, name: data.name, job, role: 'main', abilityIds: ids(data.abilities.main), freeIds: free(data.abilities.main) }, pods: [pod(0), pod(1)] };
}

export const FORMS: Readonly<Record<SpecialId, FormDef>> = {
  'floral-fallal': formOf('floral-fallal'),
  'machina-maw': formOf('machina-maw'),
  'full-throttle': formOf('full-throttle'),
};

/**
 * A part with everything learned: its whole ladder and its two HP passives (Double HP, Triple HP). The key-item passives (Break HP Limit, Break Damage Limit) are not here: the engine models no key items.
 * A build or a test hands this to a girl whose Special is mastered (the Farplane Cup's Lv 99 party is an estimate of that; no shipped build names a Special's list).
 */
export function masteredLearned(form: FormDef): Record<string, { learned: string[]; ap: number }> {
  const out: Record<string, { learned: string[]; ap: number }> = {};
  for (const part of [form.main, ...form.pods]) out[part.id] = { learned: [...part.abilityIds, `x2-${part.id}-double-hp`, `x2-${part.id}-triple-hp`], ap: 0 };
  return out;
}

/** Every part by the dressphere id it wears. */
const PART_BY_DRESS = new Map<string, { form: FormDef; part: PartDef }>();
for (const form of Object.values(FORMS)) {
  PART_BY_DRESS.set(form.main.id, { form, part: form.main });
  for (const pod of form.pods) PART_BY_DRESS.set(pod.id, { form, part: pod });
}

/** The Special and the part a dressphere id is, or `undefined` for an ordinary dressphere. */
export function partOfDress(dressphere: string | undefined): { form: FormDef; part: PartDef } | undefined {
  return dressphere === undefined ? undefined : PART_BY_DRESS.get(dressphere);
}

/** The Special a girl may wear, or `undefined` for a unit that is not one of the three girls. */
export function specialOfGirl(girlId: string): FormDef | undefined {
  const id = GIRL_SPECIAL[girlId];
  return id === undefined ? undefined : FORMS[id];
}

/** True for the ids of the three Specials (not their pods). */
export function isSpecialDress(dressphere: string | undefined): boolean {
  const hit = partOfDress(dressphere);
  return hit !== undefined && hit.part.role === 'main';
}

/** The Special part the pod's id belongs to; the pod ids are `FormDef.pods[k].id`. */
export const POD_IDS: ReadonlySet<string> = new Set(Object.values(FORMS).flatMap((f) => f.pods.map((p) => p.id)));

function defOf(part: PartDef, base: DressphereRegistry): DressphereDef {
  const known = base.get(part.id);
  return {
    id: part.id,
    name: part.name,
    abilityIds: [...part.abilityIds],
    // A pod's plain attack is a command of its own ladder (a Stigma, a Howitzer), not the generic Attack row; a main body has the generic one (`adapt/attack-records.ts` gives it the Special's own Attack row).
    hasAttack: part.role === 'main',
    longRange: known?.longRange ?? false,
    attackHits: 1,
  };
}

/**
 * A registry that also lists the Specials and their pods (the engine's `init` wraps the registry it was given in this one when the switch is on; with it off the registry is the caller's, untouched).
 * Everything else, and the stat function, is the base registry's.
 */
export function withSpecialForms(base: DressphereRegistry): DressphereRegistry {
  const extra = new Map<string, DressphereDef>();
  for (const { part } of PART_BY_DRESS.values()) extra.set(part.id, defOf(part, base));
  return { get: (id) => extra.get(id) ?? base.get(id), stats: base.stats };
}
