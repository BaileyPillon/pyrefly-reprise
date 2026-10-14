/**
 * The automatic-status layer of a girl, applied to her statuses (re-parity X2-D; **FFX-2 only**).
 *
 * Her Auto-abilities keep statuses on for good (Auto-Shell, Auto-Regen, Kijo's Soul, Spellspring ...) and her SOS abilities keep
 * theirs on while her HP state is 1, under a third (SOS Protect, SOS Critical, SOS Haste ...). The game holds them in a layer of
 * their own, apart from what a command inflicts: a Dispel cannot take them and no clock wears them off. The kernel
 * (`kernel/sos-layer.ts`) decides what the layer holds for her HP state; this module makes the engine's statuses match.
 *
 * A status the layer put on carries `sourceAbilityId: 'auto-layer'`, so it can be taken away again when the layer lets go of it and
 * only then; a status she already had by a command is left to its own clock. The layer's statuses are listed on `unit.autoStatuses`,
 * which the status kernels already read as "held by a permanent source" (`adapt/words.ts`).
 *
 * When the layer is refreshed: at the start (forced, silent), after every result applied to her (the SOS check), after a dress
 * change (forced), and after a Poison or Regen payout. See `docs/handoff/re-parity-rc7-x2auto.md`.
 */

import type { StatusId, StatusInstance } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import type { Emit, Ffx2Unit } from './internal.ts';
import { buildAutoLayer, effectiveStatuses, layerChr } from './adapt/auto-layer.ts';
import { modDraw } from './adapt/draws.ts';
import { assignSlots } from './atb-engine.ts';
import { automaticStatusCopy, sosCheck, type Ffx2AutoCopyResult } from './kernel/sos-layer.ts';
import { FFX2_STATUS_ROM, startPhase } from './kernel/status-timers-set.ts';

/** The `sourceAbilityId` of a status the layer put on. */
export const AUTO_LAYER_OWNER = 'auto-layer';

/** What the layer needs to change a unit: where to say it and the draws the game takes when Poison or Regen appears. */
export interface LayerHost {
  emit: Emit;
  rng: BattleRng;
}

/** Is the status one the layer would put on, but the game's status recompute clears (Slow while Haste is in effect and nothing is Stopped)? */
function blocked(unit: Ffx2Unit, status: StatusId, desired: readonly StatusId[]): boolean {
  return status === 'slow' && unit.statuses.stop === undefined && (desired.includes('haste') || unit.statuses.haste !== undefined);
}

/** `MsSetStatus` gives a Poison or Regen that appears in the effective word a random phase of its payout period (one draw, Poison first). */
function startAccumulator(host: LayerHost, unit: Ffx2Unit, status: 'poison' | 'regen'): void {
  const phase = startPhase(modDraw(host.rng, FFX2_STATUS_ROM.poisonTime / 4 + 1), unit.gauge.slot, FFX2_STATUS_ROM.poisonTime);
  if (status === 'poison') unit.gauge.poisonAcc = phase;
  else unit.gauge.regenAcc = phase;
}

/**
 * Take off every status the layer put on that it no longer holds, a status carried in from the last link of a chain included (those
 * carry their `auto-layer` mark). A status she has by a command is not the layer's to take.
 */
function releaseStale(host: LayerHost, unit: Ffx2Unit, desired: readonly StatusId[], silent: boolean): void {
  for (const [key, instance] of Object.entries(unit.statuses) as Array<[StatusId, StatusInstance | undefined]>) {
    if (instance?.sourceAbilityId !== AUTO_LAYER_OWNER || desired.includes(key)) continue;
    delete unit.statuses[key];
    if (!silent) host.emit({ type: 'status-remove', targetId: unit.id, status: key, reason: unit.alive ? 'expired' : 'ko' });
  }
}

/**
 * Make the unit's statuses match the effective layer. Statuses the layer lets go of leave (only the ones it put on); statuses it holds
 * are put on, with no clock, unless a command already inflicted them. `silent` is the battle's start: nothing is announced.
 */
function reconcile(host: LayerHost, unit: Ffx2Unit, silent: boolean): void {
  const layer = unit.autoLayer;
  if (layer === undefined) return;
  const desired = effectiveStatuses(layer.eff, layer.effCnt);
  releaseStale(host, unit, desired, silent);
  const held: StatusId[] = [];
  for (const status of desired) {
    if (blocked(unit, status, desired)) continue;
    if (unit.statuses[status] === undefined) {
      if (status === 'haste' && unit.statuses.slow !== undefined) {
        delete unit.statuses.slow; // Haste in effect clears Slow in the status recompute
        if (!silent) host.emit({ type: 'status-remove', targetId: unit.id, status: 'slow', reason: 'overwritten' });
      }
      const instance = {
        id: status,
        turnsRemaining: null,
        ticksRemaining: null,
        charges: null,
        stacks: 0,
        permanent: true,
        sourceId: unit.id,
        sourceAbilityId: AUTO_LAYER_OWNER,
      };
      unit.statuses[status] = instance;
      if (status === 'poison' || status === 'regen') startAccumulator(host, unit, status);
      if (!silent) host.emit({ type: 'status-add', targetId: unit.id, sourceId: unit.id, status, instance });
    }
    held.push(status);
  }
  unit.autoStatuses = held;
}

function apply(host: LayerHost, unit: Ffx2Unit, result: Ffx2AutoCopyResult, silent: boolean): void {
  const layer = unit.autoLayer;
  if (layer === undefined) return;
  layer.eff = result.eff;
  layer.effCnt = result.effCnt;
  layer.hpPrev = result.hpPrev;
  reconcile(host, unit, silent);
}

/**
 * The battle's start, for every girl: build her layer from what she wears and holds, then the forced copy (silent). A girl who holds no
 * auto-ability row gets no layer and nothing about her changes. Slots are given first, because a Poison or Regen that appears takes
 * its phase from the unit's own stream.
 */
export function initAutoLayers(units: readonly Ffx2Unit[], rng: BattleRng): void {
  assignSlots(units);
  const host: LayerHost = { emit: () => undefined, rng };
  for (const unit of units) {
    const layer = buildAutoLayer(unit);
    if (layer === null) {
      delete unit.autoLayer;
      if (unit.side === 'party') releaseStale(host, unit, [], true); // she holds no row now: what the layer put on in the last link goes
      continue;
    }
    unit.autoLayer = layer;
    apply(host, unit, automaticStatusCopy(layerChr(unit, layer), true), true);
  }
}

/** The forced copy (a rebuild: the dress changed, so her list did): her layer is built again from what she wears now. */
export function rebuildAutoLayer(host: LayerHost, unit: Ffx2Unit): void {
  const layer = buildAutoLayer(unit);
  if (layer === null) {
    if (unit.autoLayer === undefined) return;
    unit.autoLayer = { ...unit.autoLayer, rows: [], words: [0, 0, 0], kept: 0, keptCnt: new Array<number>(24).fill(0), sos: 0, sosCnt: new Array<number>(24).fill(0), flag: 0 };
  } else {
    layer.eff = unit.autoLayer?.eff ?? 0;
    layer.effCnt = unit.autoLayer?.effCnt ?? layer.effCnt;
    layer.hpPrev = unit.autoLayer?.hpPrev ?? 0;
    unit.autoLayer = layer;
  }
  const current = unit.autoLayer;
  if (current === undefined) return;
  apply(host, unit, automaticStatusCopy(layerChr(unit, current), true), false);
}

/**
 * The SOS check (`0x006362e0`), run after every result applied to the unit: with the SOS flag set and the HP state changed since the
 * layer was last made, the layer is refreshed. Returns whether it was.
 */
export function checkAutoLayer(host: LayerHost, unit: Ffx2Unit): boolean {
  const layer = unit.autoLayer;
  if (layer === undefined || layer.flag === 0) return false;
  const result = sosCheck(layerChr(unit, layer), false);
  if (!result.recompute) return false;
  apply(host, unit, result, false);
  return true;
}

/**
 * A Slow or Haste ran out (or was overwritten) while the layer holds the other: the status recompute would show it again. Puts back
 * whatever the layer holds that is missing and not cleared by the recompute.
 */
export function reassertAutoLayer(host: LayerHost, unit: Ffx2Unit): void {
  if (unit.autoLayer === undefined) return;
  reconcile(host, unit, false);
}
