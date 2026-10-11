/**
 * The three shades of the Den of Woe (Chapter XV): Baralai, Gippal, Nooj. **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI lane C (2026-10-10): the scripts are the game's own** (`m176`, `m177`, `m258`, read in
 * `research/re-ffx2-ai-leblanc-den-ixion.md` sections 4.2 to 4.4, rows D1 to D12 of section 8). The earlier build
 * followed `research/ffx2-gippal-den-of-woe.md` §4.1–§4.3; where they differ, the script wins and the difference is in
 * `docs/handoff/re-parity-ai-ffx2-c.md`. What the rewrite changed:
 *
 * - **"Below a third" is `HP < max / 3` in integer arithmetic** (D8): Gippal turns at 4,932 and Baralai at 4,072, one
 *   HP earlier than `3 x HP < max`. Lightfall's "2,999 or less" and Nooj's cycle were already the script's (D11).
 * - **Baralai's low-HP move is an extra command, not a replacement** (D1, D2). Every poll below a third he rolls 25%
 *   (`random() % 4 = 0`); on a hit he queues Regen (Absorb on the highest-MP girl below 60 MP; Not-So-Mighty Guard only
 *   if he has *Reflect*, which nothing gives him) and the same poll **also** queues the poll's normal command: the Drill
 *   Shot when the burst counter is 8 or more, else the next step of his cycle. The second command is kept in his AI
 *   memory and returned at his next poll (the engine runs one command a turn on this base; the game runs the batch
 *   without a gap and takes the recovery from the last record: a timing row for W4).
 * - **His burst counter counts results** (D3): +1 for every result another character applies to him (each landing
 *   strike, one for a miss or a no-effect result), never his own Regen tick (`AiScript.onResults`). At 8 the next poll
 *   is the **Drill Shot on the attacker of the latest result**, which can be himself when a Regen tick came last (D4):
 *   a Drill Shot at himself does nothing, because he is immune to percentage damage. The poll that fires it takes no
 *   cycle step.
 * - **Triple Attack is three Chain Attacks at fixed girls** (D5): strike 1 Yuna (else Paine, else Rikku), strike 2 Rikku
 *   (else Paine, else Yuna), strike 3 Paine (else Yuna, else Rikku); with one girl left the step is a plain Attack.
 * - **Looming Glacier** takes the highest-MP girl among those not in Stop (D6); **Absorb** is HP and MP class (D7, the
 *   command row).
 * - **Gippal's low-HP Attack** goes to the girl with the lowest current HP (D9). Targets that are `searchr` in the game
 *   (closeness and facing) are uniform here (D10: no positions), as are the ties of a highest or lowest pick.
 *
 * Every random value is `random() % n` of a 16-bit draw and every search follows `script-rolls.ts`.
 * `research/ffx2-gippal-den-of-woe.md`'s GP11 a (+1 per party action that damages him) is superseded by D3.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { extremeId, girls, pickId, scriptMod } from './script-rolls.ts';

/** Drill Shot's count (m176.src:126). */
export const DRILL_SHOT_AT = 8;
/** Lightfall's line, "HP below 3,000" (m258.src:96). */
export const LIGHTFALL_AT_OR_BELOW = 2999;
/** Baralai's Regen / Absorb switch: Absorb below this much MP (m176.src:100-124). */
export const BARALAI_ABSORB_BELOW_MP = 60;
/** Baralai's step 5: Absorb below this much MP, else Silence (m176.src:226-239). */
export const BARALAI_SILENCE_FROM_MP = 20;

export const GIPPAL_CYCLE = [
  'x2-den-gippal-grinder', 'x2-den-gippal-attack', 'x2-den-gippal-grinder', 'x2-den-gippal-attack',
  'x2-den-gippal-bullseye',
] as const;
export const NOOJ_CYCLE = [
  'x2-den-nooj-attack', 'x2-den-nooj-attack', 'x2-den-nooj-rippling-chroma', 'x2-den-nooj-attack',
  'x2-den-nooj-greedy-aura',
] as const;

/** Memory keys, one namespace per script. */
export const MEM = {
  cycle: 'cycle',
  hits: 'hits',
  lastAttacker: 'lastAttacker',
  lightfall: 'lightfallFired',
  countCalled: 'countSevenCalled',
  queued: 'queuedCommand',
} as const;

/** The `script-trigger` name emitted once, the first time Baralai's count reaches 7 (GP15). */
export const BARALAI_COUNT_SEVEN = 'baralai-count-seven';

/** `HP < max / 3` in integer arithmetic (m176.src:100, m177.src:97). */
export function belowThird(unit: Ffx2Unit): boolean {
  return unit.hp < Math.floor(unit.stats.maxHp / 3);
}

function use(id: string, targets: string[] = []): Command {
  return { kind: 'ability', id, targets };
}

/**
 * Gippal [m177.src:61-195]. Two regimes on `HP < max / 3`; one cycle counter that only the cycle branch touches.
 *
 * ```
 * below a third, one draw % 5:  4 -> % 3: Flash Bomb | Hush Grenade | Potion Plus   0 -> Bullseye (party)
 *                               1 -> Grinder (uniform girl)   2 -> Attack on the lowest-HP girl   3 -> Mortar (party)
 * otherwise:  % 16 = 0 -> % 2: Flash Bomb | Hush Grenade (the cycle does not advance)
 *             else the cycle: Grinder, Attack, Grinder, Attack, Bullseye (counter back to 0 after the fifth)
 * ```
 */
export const shadeGippalScript: AiScript = {
  id: 'shade-gippal',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    if (belowThird(self)) {
      switch (scriptMod(ctx.rng, 5)) {
        case 4: {
          const k = scriptMod(ctx.rng, 3);
          return use(k === 0 ? 'x2-den-gippal-flash-bomb' : k === 1 ? 'x2-den-gippal-hush-grenade' : 'x2-den-gippal-potion-plus');
        }
        case 0:
          return use('x2-den-gippal-bullseye');
        case 1:
          return use('x2-den-gippal-grinder', pickId(ctx.rng, party));
        case 2:
          return use('x2-den-gippal-attack', extremeId(ctx.rng, party, (u) => u.hp, 'min'));
        default:
          return use('x2-den-gippal-mortar');
      }
    }
    if (scriptMod(ctx.rng, 16) === 0) {
      return use(scriptMod(ctx.rng, 2) === 0 ? 'x2-den-gippal-flash-bomb' : 'x2-den-gippal-hush-grenade');
    }
    const step = mem(self, MEM.cycle);
    setMem(self, MEM.cycle, (step + 1) % GIPPAL_CYCLE.length);
    const id = GIPPAL_CYCLE[step % GIPPAL_CYCLE.length]!;
    return use(id, id === 'x2-den-gippal-bullseye' ? [] : pickId(ctx.rng, party));
  },
};

// ---------------------------------------------------------------------------
// Baralai [m176.src:64-253]
// ---------------------------------------------------------------------------

/** The girl in formation slot `slot`, or undefined. */
function inSlot(party: readonly Ffx2Unit[], slot: number): Ffx2Unit | undefined {
  return party.find((u) => u.slot === slot);
}

/** The first of the slots that has a living girl: the Triple Attack's fall-back order (m176.src:161-218). */
function firstLiving(party: readonly Ffx2Unit[], order: readonly number[]): string {
  for (const slot of order) {
    const unit = inSlot(party, slot);
    if (unit !== undefined) return unit.id;
  }
  return party[0]!.id;
}

/** The three Chain Attacks' girls, strike by strike: Yuna, Rikku, Paine, each falling back as the script does. */
export function tripleAttackTargets(party: readonly Ffx2Unit[]): string[] {
  return [firstLiving(party, [0, 2, 1]), firstLiving(party, [1, 2, 0]), firstLiving(party, [2, 0, 1])];
}

/** Keep the poll's second command for the next poll (the engine runs one command a turn on this base). */
function queue(unit: Ffx2Unit, command: Command): void {
  if (command.kind !== 'ability') return;
  setMem(unit, MEM.queued, `${command.id}|${command.targets.join(',')}`);
}

function takeQueued(unit: Ffx2Unit): Command | null {
  const raw = unit.aiMemory?.[MEM.queued];
  if (typeof raw !== 'string' || raw === '') return null;
  setMem(unit, MEM.queued, '');
  const [id, targets] = raw.split('|') as [string, string | undefined];
  return use(id, targets ? targets.split(',') : []);
}

/** The low-HP move (m176.src:100-124): Guard only with Reflect, else Absorb below 60 MP, else Regen. */
function lowHpMove(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const self = ctx.self;
  if (self.statuses.reflect) return use('x2-den-baralai-not-so-mighty-guard');
  if (self.mp < BARALAI_ABSORB_BELOW_MP) return use('x2-den-baralai-absorb', extremeId(ctx.rng, party, (u) => u.mp, 'max'));
  return use('x2-den-baralai-regen');
}

/** The Drill Shot (m176.src:126-138): the attacker of the latest result, whoever it was, else a living girl. */
function drillShot(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const self = ctx.self;
  setMem(self, MEM.hits, 0);
  const last = self.aiMemory?.[MEM.lastAttacker];
  if (last === self.id) return use('x2-den-baralai-drill-shot', [self.id]);
  const target = party.find((u) => u.id === last);
  return use('x2-den-baralai-drill-shot', target ? [target.id] : pickId(ctx.rng, party));
}

/** The cycle (m176.src:140-242): the counter gains 1, then by value 1 to 5; 5 sends it back to 0. */
function cycleMove(ctx: AiContext, party: readonly Ffx2Unit[]): Command {
  const self = ctx.self;
  const counter = mem(self, MEM.cycle) + 1;
  setMem(self, MEM.cycle, counter >= 5 ? 0 : counter);
  switch (counter) {
    case 1:
      return use('x2-den-baralai-attack', pickId(ctx.rng, party));
    case 2:
      return use('x2-den-baralai-glint');
    case 3:
      return party.length === 1 ? use('x2-den-baralai-attack', [party[0]!.id]) : use('x2-den-baralai-triple-attack', tripleAttackTargets(party));
    case 4:
      return use('x2-den-baralai-looming-glacier', extremeId(ctx.rng, party.filter((u) => !u.statuses.stop), (u) => u.mp, 'max'));
    default:
      return self.mp < BARALAI_SILENCE_FROM_MP
        ? use('x2-den-baralai-absorb', extremeId(ctx.rng, party, (u) => u.mp, 'max'))
        : use('x2-den-baralai-silence');
  }
}

/**
 * Baralai [m176]: each poll, in the script's order. (1) Below a third and `random() % 4 = 0`: queue the low-HP move and
 * go on. (2) Burst counter 8 or more: the Drill Shot, no cycle step. (3) Else the next step of the five-step cycle. The
 * second command of a two-command poll is returned at the next poll.
 */
export const shadeBaralaiScript: AiScript = {
  id: 'shade-baralai',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    const queued = takeQueued(self);
    if (queued !== null) return queued;

    const first = belowThird(self) && scriptMod(ctx.rng, 4) === 0 ? lowHpMove(ctx, party) : null;
    const second = mem(self, MEM.hits) >= DRILL_SHOT_AT ? drillShot(ctx, party) : cycleMove(ctx, party);
    if (first === null) return second;
    queue(self, second);
    return first;
  },
  /** The reaction entry: +1 per result applied to him by another character; the latest attacker is the Drill Shot's. */
  onResults(ctx, report) {
    const n = mem(ctx.self, MEM.hits) + report.count;
    setMem(ctx.self, MEM.hits, n);
    if (report.lastAttackerId !== undefined) setMem(ctx.self, MEM.lastAttacker, report.lastAttackerId);
    if (n >= DRILL_SHOT_AT - 1 && !mem(ctx.self, MEM.countCalled)) {
      setMem(ctx.self, MEM.countCalled, 1);
      ctx.emit({ type: 'script-trigger', name: BARALAI_COUNT_SEVEN, payload: { who: ctx.self.id } });
    }
  },
  /** A Regen tick is applied with himself as the attacker: it does not count, but it becomes the latest attacker. */
  onRegen(ctx) {
    setMem(ctx.self, MEM.lastAttacker, ctx.self.id);
  },
};

/**
 * Nooj [m258.src:60-185]: below 3,000 HP, once, Lightfall (the cycle does not advance); otherwise the cycle Attack,
 * Attack, Rippling Chroma on one girl, Attack, Greedy Aura on the party. Every target is a uniform pick.
 */
export const shadeNoojScript: AiScript = {
  id: 'shade-nooj',
  decide(ctx) {
    const party = girls(ctx);
    if (party.length === 0) return null;
    const self = ctx.self;
    if (!mem(self, MEM.lightfall) && self.hp <= LIGHTFALL_AT_OR_BELOW) {
      setMem(self, MEM.lightfall, 1);
      return use('x2-den-nooj-lightfall');
    }
    const step = mem(self, MEM.cycle);
    setMem(self, MEM.cycle, (step + 1) % NOOJ_CYCLE.length);
    const id = NOOJ_CYCLE[step % NOOJ_CYCLE.length]!;
    return use(id, id === 'x2-den-nooj-greedy-aura' ? [] : pickId(ctx.rng, party));
  },
};

export const denOfWoeScripts: readonly AiScript[] = [shadeBaralaiScript, shadeGippalScript, shadeNoojScript];
