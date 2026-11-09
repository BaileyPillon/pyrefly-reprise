/**
 * Special Dress Up: the girl puts on her Special, the other two leave the field, and she fights as three parts; and the way the form ends (FFX-2 only; **behind the `specialDressUp` switch, OFF by
 * default**, so no chapter as built reaches any of this). Rules and sources: `research/re-ffx2-special-dresspheres.md` sections 2 and 6.
 *
 * - **The main body is the girl.** The game's form puts the Special's job id into the girl's own record (`re-ffx2-dressphere.md` section 2.6), so the unit keeps her id, slot, gauge and statuses;
 *   her stats are rebuilt for the Special's growth row with her grid's node count, her pools keep their ratio (`kernel/spherechange.ts#poolsAfterChange`), her accessories stop working (set aside and
 *   given back), her Ribbon wards replace her own, and she gets Auto-Life once (the community's rule, two sources; the row reads no kept status).
 * - **The pods are two more party units** (the children records `3 + 2 * girl + k`, slots 3 to 8): own HP, own menu, own gauge. Their pools start full (unsourced, the driver's call).
 * - **The other two girls are out of the field** (`removed`, the flag Eject uses, plus `aiMemory.sdspParked`): no gauge, not targetable, their clocks stopped; `state.activeIds` names the three parts.
 * - **The walk starts over** (the kernel's mode 1: every node and gate mark is cleared, her place stays), so a second Special needs a whole new walk.
 * - **The form ends** when the girl chooses to leave (the kernel's mode 2: she is dressed in the dress she stood on; nothing else on the grid changes) or when the main body is knocked out while a pod
 *   stands (the girl comes back knocked out in her old dress, the pods go, the others return). All three parts down is a defeat, as the game's evaluation reads the three active slots.
 */

import type { BattleState, StatusId } from '../../common/types.ts';
import { poolsAfterChange } from '../kernel/spherechange.ts';
import { newGauge, completeCommand } from '../atb-engine.ts';
import { baseRequired } from '../gauges.ts';
import { ATB_BASE_VALUE } from '../constants.ts';
import { applyStatus, removeStatus } from '../statuses.ts';
import { withPoolStatuses } from '../kit.ts';
import { refreshDerivedStats, type SpherechangeDeps } from '../spherechange.ts';
import type { Emit, Ffx2Unit, GarmentGridRegistry } from '../internal.ts';
import { GIRL_INDEX, specialOfGirl, type FormDef, type PartDef } from './forms.ts';
import { POD_SCALE_NODES, passiveRows, ribbonWards, specialPartStats } from './stats.ts';

/** What the engine needs to put a form on or take it off. */
export interface FormHost {
  readonly units: Ffx2Unit[];
  readonly state: BattleState;
  readonly grids: GarmentGridRegistry;
  readonly emit: Emit;
}

/** What a unit remembers of the form (kept on the unit as `sdsp`; plain data, so a cloned state carries it). */
export interface SpecialRecord {
  readonly special: FormDef['id'];
  readonly role: 'main' | 'pod';
  readonly owner: string;
  /** Main only: the dress to return to, the accessories and wards put aside. */
  returnTo?: string;
  accessories?: string[];
  immunities?: Ffx2Unit['immunities'];
  /** Main only: the other girls who stand out of the field, and the two pods' ids. */
  parked?: string[];
  podIds?: [string, string];
}

export type SpecialUnit = Ffx2Unit & { sdsp?: SpecialRecord };

/** The switch, as the battle's flag. */
export const specialOn = (state: Pick<BattleState, 'flags'>): boolean => state.flags['specialDressUp'] === true;

/** The form a girl is in, or undefined. */
export const recordOf = (unit: Ffx2Unit): SpecialRecord | undefined => (unit as SpecialUnit).sdsp;

/** Is this girl wearing her Special right now (main body)? */
export const inForm = (unit: Ffx2Unit): boolean => recordOf(unit)?.role === 'main';

const girlsOf = (units: readonly Ffx2Unit[]): Ffx2Unit[] => units.filter((u) => u.side === 'party' && GIRL_INDEX[u.id] !== undefined);

/** The unit of a pod: a party unit with its own slot (`3 + 2 * girl + k`), gauge and menu. */
function buildPod(girl: Ffx2Unit, form: FormDef, pod: PartDef, k: 0 | 1, nodes: number): Ffx2Unit {
  const slot = 3 + 2 * (GIRL_INDEX[girl.id] as number) + k;
  const learned = learnedFor(girl, pod);
  const stats = specialPartStats(pod.job, girl.level, nodes, passiveRows(learned, pod.id));
  const unit: SpecialUnit = {
    id: pod.id,
    name: pod.name,
    side: 'party',
    spriteKey: pod.id,
    ...(girl.portraitKey !== undefined ? { portraitKey: girl.portraitKey } : {}),
    stats,
    hp: stats.maxHp,
    mp: stats.maxMp,
    statuses: {},
    affinities: {},
    immunities: ribbonWards(),
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot,
    flags: {},
    level: girl.level,
    dresspheres: {
      current: pod.id,
      owned: [],
      garmentGrid: { id: girl.dresspheres?.garmentGrid.id ?? '', nodePosition: girl.dresspheres?.garmentGrid.nodePosition ?? 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: { [pod.id]: { learned: [...learned], ap: 0 } },
      special: { id: form.id, parts: { main: girl.id, podLeft: form.pods[0].id, podRight: form.pods[1].id }, gridNodeCount: nodes },
    },
    atb: { ticks: 0, required: baseRequired(stats.agi), gauge: 0, charging: null, recovery: 0 },
    gauge: newGauge(slot),
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
    sdspOwnerId: girl.id,
    sdsp: { special: form.id, role: 'pod', owner: girl.id },
  };
  return unit;
}

/** What the part has learned: the list the build names for it (the girl's own entry under the Special's id, or under a pod's id), else the commands the game lists from the start. */
function learnedFor(girl: Ffx2Unit, part: PartDef): readonly string[] {
  const named = girl.dresspheres?.abilitiesLearned?.[part.id]?.learned;
  return named !== undefined && named.length > 0 ? named : part.freeIds;
}

/** Statuses the Ribbon wards that she carries come off (the game's sweep after a rebuild: everything but Death and Eject). */
function sweepWarded(girl: Ffx2Unit, emit: Emit): void {
  for (const key of Object.keys(girl.statuses) as StatusId[]) {
    if (key === 'ko' || key === 'eject' || (girl.immunities[key] ?? 0) < 255) continue;
    if (removeStatus(girl, key)) emit({ type: 'status-remove', targetId: girl.id, status: key, reason: 'cured' });
  }
}

/** Rebuild the main body's stats for the Special, the pools following the ratio rule. */
function dressMain(girl: Ffx2Unit, form: FormDef, nodes: number): void {
  const learned = learnedFor(girl, form.main);
  if (girl.dresspheres !== undefined) girl.dresspheres.abilitiesLearned[form.id] = { learned: [...learned], ap: girl.dresspheres.abilitiesLearned[form.id]?.ap ?? 0 };
  const stats = specialPartStats(form.main.job, girl.level, nodes, passiveRows(learned, form.id));
  const after = poolsAfterChange({ hp: girl.hp, mp: girl.mp, maxHp: girl.stats.maxHp, maxMp: girl.stats.maxMp }, stats.maxHp, stats.maxMp);
  girl.stats = withPoolStatuses(stats, girl.statuses, undefined);
  girl.hp = girl.alive ? Math.max(1, Math.min(girl.stats.maxHp, after.hp)) : 0;
  girl.mp = Math.min(girl.stats.maxMp, after.mp);
  girl.atb.required = baseRequired(girl.stats.agi);
}

/**
 * Put the girl into her Special. The caller has checked everything (`availability.ts#specialOffer`). Emits the `spherechange` event with `special` (the portrait's cue); the caller spends her turn.
 */
export function enterSpecialForm(host: FormHost, girl: Ffx2Unit): boolean {
  const form = specialOfGirl(girl.id);
  const sphere = girl.dresspheres;
  if (form === undefined || sphere === undefined || recordOf(girl) !== undefined) return false;
  const grid = host.grids.get(sphere.garmentGrid.id);
  const nodes = Math.max(2, Math.min(6, grid?.nodes ?? 6));
  const from = sphere.current;
  host.emit({ type: 'spherechange', who: girl.id, from, to: form.id, gatesCrossed: [], special: form.id }); // the portrait's cue (`engine/BigMoves.ts#dressUpMoveOf`)

  const record: SpecialRecord = {
    special: form.id,
    role: 'main',
    owner: girl.id,
    returnTo: from,
    accessories: [...girl.accessories],
    immunities: { ...girl.immunities },
    podIds: [form.pods[0].id, form.pods[1].id],
    parked: [],
  };
  (girl as SpecialUnit).sdsp = record;

  // 1. the main body: the Special's job on her own record
  sphere.current = form.id;
  sphere.special = { id: form.id, parts: { main: girl.id, podLeft: form.pods[0].id, podRight: form.pods[1].id }, gridNodeCount: nodes };
  sphere.garmentGrid.passedGates = []; // mode 1: every node and gate mark is cleared, her place stays
  sphere.garmentGrid.wornThisBattle = [];
  girl.accessories = []; // they stop working; given back when the form ends
  girl.immunities = ribbonWards();
  girl.aiMemory = { ...(girl.aiMemory ?? {}), waitDown: 0, bdl: false };
  girl.sdspGridNodeCount = nodes;
  dressMain(girl, form, nodes);
  sweepWarded(girl, host.emit);
  const life = applyStatus(girl, { status: 'auto-life', chance: 255, duration: 0 }, girl.id);
  if (life !== null) host.emit({ type: 'status-add', targetId: girl.id, sourceId: girl.id, status: 'auto-life', instance: life });

  // 2. the pods
  const pods: Ffx2Unit[] = [];
  form.pods.forEach((def, k) => {
    const fresh = buildPod(girl, form, def, k as 0 | 1, POD_SCALE_NODES);
    const old = host.state.combatants[def.id] as Ffx2Unit | undefined;
    const idx = old === undefined ? -1 : host.units.indexOf(old);
    if (idx >= 0) host.units[idx] = fresh;
    else host.units.push(fresh);
    host.state.combatants[def.id] = fresh;
    applyStatus(fresh, { status: 'auto-life', chance: 255, duration: 0 }, girl.id);
    completeCommand(fresh, ATB_BASE_VALUE, host.units); // a pod waits one standard bar, as the girl does after her change
    pods.push(fresh);
  });
  girl.sdspPartIds = [girl.id, ...pods.map((p) => p.id)];
  pods.forEach((p) => {
    p.sdspPartIds = girl.sdspPartIds as string[];
  });

  // 3. the other two girls leave the field
  for (const other of girlsOf(host.units)) {
    if (other === girl) continue;
    other.removed = true;
    other.aiMemory = { ...(other.aiMemory ?? {}), sdspParked: true };
    record.parked?.push(other.id);
  }
  host.state.activeIds = [girl.id, ...pods.map((p) => p.id)];
  return true;
}

/** Bring the other girls back and send the pods away; the main body's own dress is the caller's (leave or knocked out). */
function standDown(host: FormHost, girl: Ffx2Unit, record: SpecialRecord): void {
  for (const id of record.parked ?? []) {
    const other = host.state.combatants[id] as Ffx2Unit | undefined;
    if (other === undefined) continue;
    other.removed = false;
    if (other.aiMemory !== undefined) delete other.aiMemory['sdspParked'];
  }
  for (const id of record.podIds ?? []) {
    const pod = host.state.combatants[id] as Ffx2Unit | undefined;
    if (pod === undefined) continue;
    pod.removed = true;
    pod.aiMemory = { ...(pod.aiMemory ?? {}), sdspDormant: true };
    pod.statuses = {};
    pod.atb.charging = null;
    pod.pendingCommand = null;
  }
  delete (girl as SpecialUnit).sdsp;
  delete girl.sdspPartIds;
  delete girl.sdspGridNodeCount;
  if (girl.dresspheres !== undefined) delete girl.dresspheres.special;
  host.state.activeIds = girlsOf(host.units).sort((a, b) => a.slot - b.slot).map((u) => u.id);
}

/** Give the girl back her dress and her kit. `deps` is the spherechange's: the stats are rebuilt for the dress by the ordinary refresh. */
function undress(girl: Ffx2Unit, record: SpecialRecord, deps: SpherechangeDeps): string {
  const to = record.returnTo ?? girl.dresspheres?.current ?? '';
  if (girl.dresspheres !== undefined) girl.dresspheres.current = to;
  girl.accessories = [...(record.accessories ?? [])];
  girl.immunities = { ...(record.immunities ?? {}) };
  refreshDerivedStats(girl, deps);
  return to;
}

/**
 * The girl chooses to leave her Special (the kernel's mode 2): she is dressed in the dress she stood on, the pods go, the others return. Emits a `spherechange` back.
 */
export function leaveSpecialForm(host: FormHost, girl: Ffx2Unit, deps: SpherechangeDeps): boolean {
  const record = recordOf(girl);
  if (record === undefined || record.role !== 'main') return false;
  const from = girl.dresspheres?.current ?? record.special;
  standDown(host, girl, record);
  const to = undress(girl, record, deps);
  host.emit({ type: 'spherechange', who: girl.id, from, to, gatesCrossed: [] });
  return true;
}

/**
 * The form is over because the main body fell while a pod still stands (called by the engine after every action and logic step). The girl is in her old dress, knocked out, the pods are gone,
 * the other girls are back. If all three parts are down nothing is done: the battle-end evaluation reads that as a defeat.
 */
export function settleForms(host: FormHost, deps: SpherechangeDeps): void {
  for (const girl of host.units) {
    const record = recordOf(girl);
    if (record === undefined || record.role !== 'main' || girl.alive) continue;
    const pods = (record.podIds ?? []).map((id) => host.state.combatants[id] as Ffx2Unit | undefined);
    if (!pods.some((p) => p !== undefined && p.alive)) continue;
    const from = girl.dresspheres?.current ?? record.special;
    standDown(host, girl, record);
    const to = undress(girl, record, deps);
    girl.hp = 0;
    host.emit({ type: 'spherechange', who: girl.id, from, to, gatesCrossed: [] });
    host.emit({ type: 'message', text: `${girl.name}'s ${specialOfGirl(girl.id)?.name ?? 'Special'} ends`, kind: 'system' });
  }
}
