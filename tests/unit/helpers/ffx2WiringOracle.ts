/**
 * The oracle and the engine runner for `parity-ffx2-engine-wiring.test.ts`.
 *
 * `oracleRun` plays one generated situation the way the GAME does, straight through the kernels in
 * `src/battle/ffx2/kernel/`, with every kernel input built from the situation's own game-terms fields. It imports
 * nothing from `src/battle/ffx2/adapt/` and nothing from the engine's resolver: the order of a record (hit
 * determination once, then a strike per hit event per target in ascending slot order), the inputs, the application of a
 * result and the bookkeeping between strikes are written out here again. `engineRun` runs the same situation through
 * `resolveAbility` and reads the units back by the same independent route.
 *
 * **Game case: FFX-2 only.**
 */

import type { AbilityDef, ElementId, StatusId } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import type { Ffx2Unit } from '../../../src/battle/ffx2/internal.ts';
import { rollCritical } from '../../../src/battle/ffx2/kernel/crit.ts';
import { HitResult, determineHits } from '../../../src/battle/ffx2/kernel/hit.ts';
import { computeClassDamage } from '../../../src/battle/ffx2/kernel/pipeline.ts';
import type { PipelineCommand, PipelineInput } from '../../../src/battle/ffx2/kernel/pipeline-types.ts';
import { settleDamage } from '../../../src/battle/ffx2/kernel/settle.ts';
import { applyHpDamage } from '../../../src/battle/ffx2/kernel/apply.ts';
import { elementLadder } from '../../../src/battle/ffx2/kernel/element.ts';
import { SHATTER_SET_BITS, rollCommandStatuses, rollShatter } from '../../../src/battle/ffx2/kernel/status.ts';
import { initialStatusResult, type StatusResult } from '../../../src/battle/ffx2/kernel/statusTypes.ts';
import { bribeReward, stealGil, stealItem } from '../../../src/battle/ffx2/kernel/steal.ts';
import { BRIBE_ITEM, ELEMENT_BITS, G1, G2, STAGE, ScriptedRng, bribeCountOf, engineUnit, type SideSpec, type Situation } from './ffx2WiringRig.ts';

/** What a run leaves behind, read the same way from the engine and from the oracle. */
export interface Run {
  /** The `max` of every draw, in order. */
  asked: number[];
  tokens: string[];
  ends: Array<{ hp: number; mp: number; dead: boolean; removed: boolean; g1: number; g2: number[]; chain: number }>;
  user: { hp: number; mp: number };
  flags: Record<string, number>;
}

const table = (sparse: Readonly<Record<number, number>> | undefined): number[] => {
  const out = new Array<number>(24).fill(0);
  for (const [i, v] of Object.entries(sparse ?? {})) out[Number(i)] = v;
  return out;
};
const ZEROS = new Array<number>(24).fill(0);
const baseOf = (side: 'party' | 'enemy'): number => (side === 'party' ? 0 : 15);
const targetSideOf = (sit: Situation): 'party' | 'enemy' => sit.targetSide;

/** Which g1 / g2 slots are comparable (the ones the engine has a status for). */
const G1_MASK = G1.reduce((m, s, i) => (s === null ? m : (m | (1 << i)) >>> 0), 0);

// ---------------------------------------------------------------------------------------------------------------
// the game
// ---------------------------------------------------------------------------------------------------------------

interface OState {
  spec: SideSpec;
  hp: number;
  mp: number;
  maxHp: number;
  g1: number;
  g2: number[];
  chain: number;
  window: boolean;
  dead: boolean;
  removed: boolean;
  stolenFrom: boolean;
  pilfered: boolean;
  accumulated: number;
  /** The Bribe threshold the hit determination stored on the target (`Chr+0x680`). */
  threshold: number;
}

function stateOf(spec: SideSpec): OState {
  return {
    spec, hp: spec.hp, mp: spec.mp, maxHp: spec.maxHp, g1: spec.g1, g2: [...spec.g2], chain: spec.chain,
    window: spec.chain > 0, dead: spec.dead, removed: false, stolenFrom: false, pilfered: false, accumulated: 0, threshold: 0,
  };
}

/** Play the situation through the kernels. */
export function oracleRun(sit: Situation): Run {
  const asked: number[] = [];
  const tokens: string[] = [];
  const flags: Record<string, number> = {};
  let cursor = 0;
  const raw = (max: number): number => {
    asked.push(max);
    return sit.raws[cursor++ % sit.raws.length] as number;
  };
  // A command that is several game rows of which the script picks one (Russian Roulette): one draw, before anything else.
  let row = sit.def.ffx2Record!;
  const variants = row.pickOne;
  if (variants !== undefined && variants.length > 1) row = variants[raw(variants.length - 1) % variants.length] as typeof row;

  // The row, with AGENTS.md rule 5 (magic never rolls) applied: a magical row the game rolls is held at formula 0.
  let misc = row.flagsMisc;
  if ((row.flagsDamage & 3) === 2 && ((misc >> 3) & 7) !== 0 && sit.def.canMiss !== true) misc &= ~0x38;
  // A script that aims "at a random target" picks one target per hit from stream 5, whatever its row says (adapt/command.ts).
  if (sit.def.targeting === 'random-enemy' || sit.def.targeting === 'random-ally') misc |= 0x4000;
  const accF = (misc >> 3) & 7;
  const cmd: PipelineCommand = {
    id: row.id, category: row.category, flagsTarget: row.flagsTarget, flagsMisc: misc, flagsDamage: row.flagsDamage,
    damageClass: row.damageClass, formula: row.formula, power: row.power, element: row.element, speciesKiller: row.killer,
  };
  const userId = baseOf(sit.userSide);
  const tBase = baseOf(targetSideOf(sit));
  const sameSide = targetSideOf(sit) === sit.userSide;
  const ids = sit.targets.map((_, i) => tBase + i + (sameSide ? 1 : 0));
  const user = sit.user;
  const ustate = { hp: user.hp, mp: Math.max(0, user.mp - sit.def.mpCost) }; // the cast is paid before the first hit
  const states = sit.targets.map(stateOf);
  const live = sit.targets.map((_, i) => i);
  const allTargets = sit.userSide === 'party' && (row.flagsTarget & 0x80) !== 0 && sit.def.targeting.startsWith('all');

  // A Bribe spends the gil it offers, hit or miss, from the party's wallet when there is one.
  if (sit.wallet !== undefined) flags['gil'] = (misc & 0x4000000) !== 0 && sit.gilSpent > 0 ? Math.max(0, sit.wallet - sit.gilSpent) : sit.wallet;

  // --- hit determination, once, targets in ascending slot order ----------------------------------------------
  const hitMax = accF === 1 || accF === 2 ? 100 : accF >= 3 && accF <= 5 ? 127 : accF === 6 ? 255 : 1023;
  const determined = determineHits(
    { id: userId, level: user.level, luck: user.luck, acc: user.acc, accStage: user.g2[STAGE.acc] as number, luckStage: user.g2[STAGE.luck] as number, darkness: (user.g1 & 0x10) !== 0 },
    { id: row.id, formula: accF, darknessApplies: (misc & 0x40) !== 0, accuracy: row.accuracy, power: row.power, hits: row.hits, physicalOnly: (row.flagsDamage & 3) === 1, randomTargets: (misc & 0x4000) !== 0 },
    { repeatCount: 0, repeatLimit: 3, amount: sit.gilSpent, hitsOverride: sit.hitsOverride },
    live.map((i) => {
      const s = states[i] as OState;
      const t = sit.targets[i] as SideSpec;
      return {
        id: ids[i] as number, level: t.level, luck: t.luck, eva: t.eva, evaStage: t.g2[STAGE.eva] as number, luckStage: t.g2[STAGE.luck] as number,
        asleep: (s.g1 & 4) !== 0, petrified: (s.g1 & 2) !== 0, stopped: (s.g2[6] as number) !== 0, evadesPhysical: false,
        inHitReaction: s.window, aided: false, maxHp: s.maxHp, accumulated: s.accumulated,
        bribeImmune: (t.special & 0x200) !== 0, resistEject: t.resist1[10] as number, resistDeath: t.resist1[0] as number,
        resistPetrify: t.resist1[1] as number, resistSextic: sit.targetSide === 'enemy' ? t.zantetsu : 0,
      };
    }),
    (stream) => (stream === 5 ? raw(live.length - 1) : raw(hitMax)),
  );
  determined.targets.forEach((r, i) => {
    if (r.bribe) {
      (states[i] as OState).accumulated = r.bribe.accumulated;
      (states[i] as OState).threshold = r.bribe.threshold;
    }
  });

  // --- the strikes: one per hit event per target with hits left ---------------------------------------------
  const planned = determined.perTargetHits;
  const done = live.map(() => 0);
  const rounds = planned.reduce((m, n) => Math.max(m, n), 0);
  const heal = (amount: number, cause: string): void => {
    const gained = Math.min(user.maxHp, ustate.hp + amount) - ustate.hp;
    ustate.hp += gained;
    if (gained > 0) tokens.push(`heal:u:${gained}:${cause}`);
  };

  for (let round = 0; round < rounds; round++) {
    live.forEach((i) => {
      const n = planned[i] as number;
      const res = determined.targets[i];
      if (n === 0 || res === undefined || (done[i] as number) >= n) return;
      if (res.result !== HitResult.Hit) {
        done[i] = n;
        tokens.push(`miss:${i}:${res.result === HitResult.NoEffect ? 'immune' : 'evaded'}`);
        return;
      }
      done[i] = (done[i] as number) + 1;
      strike(i);
    });
  }

  function strike(i: number): void {
    const st = states[i] as OState;
    const t = st.spec;
    // Only a monster carries a steal table and gil (`rewards`); a girl has none.
    const hold = sit.targetSide === 'enemy' ? t.steal : { byte: 0, commonCount: 1, rareCount: 0, gil: 0 };
    const tid = ids[i] as number;
    // The counter the hit reads: the running one while the target reacts; a Stopped or Petrified target has it cleared (shouldResetChain).
    const before = st.window && (st.g2[6] as number) === 0 && (st.g1 & 2) === 0 ? st.chain : 0;
    const input: PipelineInput = {
      cmd,
      attacker: {
        id: userId, hp: ustate.hp, maxHp: user.maxHp, mp: ustate.mp, maxMp: user.maxMp, str: user.str, strStage: user.g2[STAGE.str] as number,
        mag: user.mag, magStage: user.g2[STAGE.mag] as number, level: user.level, status1: user.g1, autoAbilities650: 0,
        // Break Damage Limit (bit 0): a girl's gate or accessory, or the cast's authored flag standing in for a monster's word
        // (the monster rows give no such word and a dozen rows lack the cap bit the FAQs' claims need; research note section 9).
        autoAbilities652: user.breakLimit || sit.def.flags.includes('always-break-damage-limit') ? 1 : 0, weaponElement: 0,
      },
      target: {
        id: tid, hp: st.hp, maxHp: st.maxHp, mp: st.mp, maxMp: t.maxMp, def: t.def, defStage: st.g2[STAGE.def] as number, mdef: t.mdef,
        mdefStage: st.g2[STAGE.mdef] as number, status1: st.g1,
        affinities: { absorb: t.absorb, nullify: t.nullMask, half: t.half, weak: t.weak },
        shell: st.g2[0] as number, protect: st.g2[1] as number, immunePhysical: st.g2[15] as number, immuneMagical: st.g2[16] as number,
        invincible: st.g2[17] as number, special: t.special, species: sit.targetSide === 'enemy' ? t.species : 0, chain: before,
        inBattle: st.removed ? 0 : 1, dead: st.dead ? 1 : 0, flag5ac: 0, atb: { current: 0, max: 0 },
      },
      amount: sit.gilSpent, allTargets, preview: false, backAttack: false,
      records: { attackerF40: 0, attackerF44: 0, targetF44: 0 },
    };
    const classes = computeClassDamage(input, {
      draw: () => raw(31),
      rollCrit: () =>
        rollCritical(
          { canCrit: true, fixedChance: (row.flagsDamage & 8) !== 0, critByte: row.critByte, attackerSlot: userId, attackerLuck: user.luck, attackerLuckStage: user.g2[STAGE.luck] as number, targetLuck: t.luck, targetLuckStage: st.g2[STAGE.luck] as number, alwaysCritical: (user.g1 & 0x8000) !== 0 },
          0,
          () => raw(99),
        ).critical,
    });
    if (!classes.gate) {
      if ((misc & 0x40000) !== 0 && !st.dead) tokens.push(`miss:${i}:wrong-state`);
      return;
    }
    // statuses, shatter, bribe
    const chance1 = table(row.status1), chance2 = table(row.status2);
    const any = chance1.some((c) => c !== 0) || chance2.some((c) => c !== 0);
    let result: StatusResult | undefined;
    let log: Array<{ immune: boolean; applied: boolean; removed: boolean }> = [];
    let zeroAtb = false;
    if (any) {
      const r = rollCommandStatuses(
        { id: userId, level: user.level, weaponChance1: ZEROS, weaponChance2: ZEROS, weaponAmount2: ZEROS },
        { id: tid, level: t.level, status1: st.g1, resist1: t.resist1, resist2: t.resist2, protectMask: 0, actionState: 0, activeBytes: st.g2, layerB: ZEROS, layerD: ZEROS },
        { chance1, chance2, amount2: table(row.statusTime), cleanse: (row.flagsDamage & 0x20) !== 0, usesWeapon: (misc & 0x10000) !== 0 },
        initialStatusResult({ appliedSet: st.g1, counters: st.g2, secondarySet: 0, secondaryBytes: ZEROS }, (misc & 0x800) !== 0, false),
        () => raw(100),
      );
      result = r.result; log = r.log; zeroAtb = r.zeroAtbDelta;
    }
    const shatter = rollShatter((st.g1 & 2) !== 0, row.shatter, userId, () => raw(100));
    if (shatter.shattered) {
      const base = result ?? initialStatusResult({ appliedSet: st.g1, counters: st.g2, secondarySet: 0, secondaryBytes: ZEROS }, false, false);
      result = { ...base, statusSet: (base.statusSet | SHATTER_SET_BITS) >>> 0 };
    }
    if ((misc & 0x4000000) !== 0) {
      // The monster's first bribe slot holds the item (the second is empty); the threshold is the one the hit determination just stored.
      const have = sit.targetSide === 'enemy' ? bribeCountOf(t) : 0;
      let tenStream = 0; // stream 10 is asked twice: the factor (% 11), then the dither (& 1)
      const reward = bribeReward(
        { bribeCommand: true, slots: [{ item: have > 0 ? 1 : 0, quantity: have }, { item: 0, quantity: 0 }], threshold: st.threshold },
        (s) => raw(s === 11 ? 255 : tenStream++ === 0 ? 10 : 1),
      );
      if (reward.itemId !== 0 && reward.quantity > 0) {
        const key = `inventory:${BRIBE_ITEM}`;
        flags[key] = (flags[key] ?? 0) + reward.quantity;
      }
    }
    const set = result?.statusSet ?? st.g1;
    const settled = settleDamage(classes, input, { hasteSlowFailed: zeroAtb, resultHasDeath: (set & 1) !== 0, resultHasPetrify: (set & 2) !== 0, shattered: shatter.shattered });
    const hp = settled.hp;

    // --- apply -----------------------------------------------------------------------------------------------
    const wasDead = st.dead;
    if ((settled.flags & 1) !== 0) {
      const immune = (row.damageClass & 1) !== 0 && (settled.surviving & 1) === 0 && settled.blocked > 0;
      if (immune) tokens.push(`miss:${i}:immune`);
      else {
        if (hp > 0) tokens.push(`chain:${i}:${before}`);
        if (!wasDead) tokens.push(`dmg:${i}:${hp}:${classes.critical}:${label(row.element, t)}:${Math.abs(hp) >= settled.cap}`);
        const applied = applyHpDamage({ hp: st.hp, maxHp: st.maxHp, chain: before, bestChain: 0, taken: 0 }, hp);
        if (hp > 0) { st.chain = applied.chain; st.window = true; }
        st.hp = applied.hp;
        if (hp !== 0 && st.hp <= 0 && !st.dead) kill(i);
        else if (st.dead && st.hp > 0) st.dead = false; // a heal on a KO'd unit brings it back (revive event below)
        if ((misc & 0x100) !== 0 && hp > 0) heal(hp, 'drain');
      }
    }
    if ((settled.flags & 2) !== 0 && settled.mp !== 0) {
      const mpBefore = st.mp;
      st.mp = Math.max(0, Math.min(t.maxMp, mpBefore - settled.mp));
      const moved = mpBefore - st.mp;
      if (moved > 0) {
        tokens.push(`mpd:${i}:${moved}`);
        if ((misc & 0x100) !== 0) { const g = Math.min(user.maxMp, ustate.mp + moved) - ustate.mp; ustate.mp += g; if (g > 0) tokens.push(`mph:u:${g}`); }
      } else if (moved < 0) tokens.push(`mph:${i}:${-moved}`);
    }
    if (result !== undefined) applyBuffers(i, result);
    // the engine's own statuses without a slot in the tables (Delay, Action-cancel): one landing draw each
    for (const app of sit.def.statusEffects) {
      const known = G1.includes(app.status) || G2.some((ids2) => ids2.includes(app.status));
      if (!known && Math.round(app.chance) > 0) raw(100);
    }
    if (wasDead && !st.dead && st.hp > 0) { tokens.push(`revive:${i}`); st.g1 &= ~1; }
    if (any && row.power === 0 && log.some((l) => l.immune) && !log.some((l) => l.applied || l.removed)) tokens.push(`miss:${i}:immune`);
    if ((misc & 0x200) !== 0) {
      const r = stealItem(
        { stealCommand: true, commandId: row.id, chance: st.stolenFrom || hold.byte === 0 ? 0 : hold.byte, commonItem: hold.byte > 0 ? 1 : 0, commonQuantity: hold.byte > 0 ? Math.max(1, hold.commonCount) : 0, rareItem: hold.byte > 0 && hold.rareCount > 0 ? 1 : 0, rareQuantity: hold.byte > 0 ? Math.max(1, hold.rareCount) : 0 },
        (s) => raw(s === 10 ? 254 : 255),
      );
      if (r.success && hold.byte > 0) {
        st.stolenFrom = true;
        const key = `inventory:${r.rare ? 'x2-item-ether' : 'x2-item-potion'}`;
        flags[key] = (flags[key] ?? 0) + Math.max(1, r.quantity);
      }
    }
    if ((row.flagsDamage & 0x100) !== 0) {
      const r = stealGil({ stealsGil: true, chance: st.pilfered ? 0 : 255, gil: hold.gil }, (() => { let k = 0; return () => raw(k++ === 0 ? 254 : 100); })());
      if (r.success) { st.pilfered = true; flags['stolenGil'] = (flags['stolenGil'] ?? 0) + r.amount; }
    }
  }

  /** The target dies: the chain breaks and the KO is reported (the engine's `applyHpDelta`). */
  function kill(i: number): void {
    const st = states[i] as OState;
    st.dead = true;
    st.hp = 0;
    st.g1 |= 1; // the KO status
    if (st.chain > 0 || st.window) tokens.push(`chain:${i}:0`);
    st.chain = 0;
    st.window = false;
    tokens.push(`ko:${i}`);
  }

  /** Bring the target's statuses to what the result buffer holds (the engine reconciles the same way). */
  function applyBuffers(i: number, r: StatusResult): void {
    const st = states[i] as OState;
    const prevG1 = st.g1;
    const prevStop = st.g2[6] as number;
    const next = r.statusSet >>> 0;
    st.g1 = next & G1_MASK;
    st.g2 = [...r.counters];
    if ((next & 1) !== 0 && (prevG1 & 1) === 0 && !st.dead) kill(i);
    if ((next & 0x400) !== 0 && (prevG1 & 0x400) === 0) st.removed = true;
    // the engine's own rule, which the game's code does not have (`statuses.ts applyStatus`, left for W4): Stop wipes Sleep, Confusion and Berserk
    if (prevStop === 0 && (st.g2[6] as number) !== 0) st.g1 &= ~(0x4 | 0x40 | 0x80);
  }

  const ends = states.map((s) => ({
    hp: s.hp, mp: s.mp, dead: s.dead, removed: s.removed, g1: s.g1 & G1_MASK,
    g2: s.g2.map((v, k) => (k >= STAGE.str && k <= STAGE.luck ? ((v << 24) >> 24) : (v << 24) >> 24 > 0 ? 1 : 0)),
    chain: s.window ? s.chain : 0,
  }));
  return { asked, tokens, ends, user: ustate, flags };
}

/** The affinity label of a hit, from the ladder (a re-read of the element kernel). */
function label(element: number, t: SideSpec): string {
  const outcome = elementLadder({ absorb: t.absorb, nullify: t.nullMask, half: t.half, weak: t.weak }, element, 100).outcome;
  return outcome === 'weak' ? 'weak' : outcome === 'half' ? 'resist' : outcome === 'null' ? 'immune' : outcome === 'absorb' ? 'absorb' : 'normal';
}

// ---------------------------------------------------------------------------------------------------------------
// the engine
// ---------------------------------------------------------------------------------------------------------------

function readUnit(unit: Ffx2Unit): Run['ends'][number] {
  let g1 = 0;
  G1.forEach((status, i) => { if (status !== null && unit.statuses[status] !== undefined) g1 |= 1 << i; });
  const g2 = G2.map((ids, i) => {
    if (ids.length === 0) return 0;
    if (i >= STAGE.str && i <= STAGE.luck) return (unit.statuses[ids[0] as StatusId]?.stacks ?? 0) - (unit.statuses[ids[1] as StatusId]?.stacks ?? 0);
    return unit.statuses[ids[0] as StatusId] !== undefined ? 1 : 0;
  });
  return { hp: unit.hp, mp: unit.mp, dead: !unit.alive, removed: unit.removed, g1: g1 >>> 0, g2, chain: unit.chainWindowTicks > 0 ? unit.chainCount : 0 };
}

/** Play the situation through the engine's resolver. */
export function engineRun(sit: Situation): Run {
  const rng = new ScriptedRng(sit.raws);
  const user = engineUnit(sit.user, 'u', sit.userSide, 0);
  const sameSide = sit.targetSide === sit.userSide;
  const targets = sit.targets.map((t, i) => engineUnit(t, `t${i}`, sit.targetSide, i + (sameSide ? 1 : 0)));
  const units = [user, ...targets];
  const events: Array<Record<string, unknown>> = [];
  const state = { flags: {} as Record<string, number | string | boolean> };
  if (sit.wallet !== undefined) state.flags['gil'] = sit.wallet;
  resolveAbility(
    {
      units,
      abilities: { get: () => undefined },
      rng,
      emit: (e) => events.push(e as unknown as Record<string, unknown>),
      breaksDamageLimit: () => sit.user.breakLimit,
      state: state as never,
    },
    user,
    sit.def,
    sit.targetSide === 'enemy' && sit.def.targeting.startsWith('single') ? [targets[0]!.id] : targets.map((t) => t.id),
    { ...(sit.hitsOverride > 0 ? { hitsOverride: sit.hitsOverride } : {}), gilSpent: sit.gilSpent },
  );
  const idx = (id: unknown): string => (id === 'u' ? 'u' : String(id).slice(1));
  const tokens: string[] = [];
  for (const e of events) {
    const t = idx(e['targetId']);
    switch (e['type']) {
      case 'miss': tokens.push(`miss:${t}:${e['reason']}`); break;
      case 'damage': tokens.push(`dmg:${t}:${e['amount']}:${e['crit']}:${e['affinity'] ?? ''}:${e['capped'] === true}`); break;
      case 'chain': tokens.push(`chain:${t}:${e['count']}`); break;
      case 'mp-damage': tokens.push(`mpd:${t}:${e['amount']}`); break;
      case 'mp-heal': tokens.push(`mph:${t}:${e['amount']}`); break;
      case 'heal': tokens.push(`heal:${t}:${e['amount']}:${e['cause']}`); break;
      case 'revive': tokens.push(`revive:${t}`); break;
      case 'ko': tokens.push(`ko:${t}`); break;
      default: break;
    }
  }
  const flags: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.flags)) if (typeof v === 'number') flags[k] = v;
  return { asked: rng.asked, tokens, ends: targets.map(readUnit), user: { hp: user.hp, mp: user.mp }, flags };
}

export type { AbilityDef, ElementId };
export { ELEMENT_BITS };
