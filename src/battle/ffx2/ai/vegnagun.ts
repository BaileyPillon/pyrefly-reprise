/**
 * Vegnagun — Tail (battle 1), Leg + Nodes (battle 2)
 * [ffx2-vegnagun-shuyin §5.1, §5.2, §3.2].
 *
 * Flavour turns are preserved as real turns: the Farplane voices (Braska,
 * Auron, Jecht, Shuyin) speak from the AI as **no-action turns that consume an
 * ATB slot**, which is why the Leg's 26-step table is mostly flavour and why
 * stalling reads as pacing rather than as dead air.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';

function randomPartyId(ctx: AiContext): string[] {
  const party = ctx.party();
  return party.length > 0 ? [ctx.rng.pick(party).id] : [];
}

/** Advance and return this unit's 0-based step counter. */
function step(unit: Ffx2Unit, key = 'step'): number {
  const value = mem(unit, key);
  setMem(unit, key, value + 1);
  return value;
}

// ---------------------------------------------------------------------------
// Tail — the simplest boss in the chain, and a good tutorial for ATB pacing.
// ---------------------------------------------------------------------------

/**
 * ```
 * 1. [Braska encouragement] - Tail does nothing
 * 2. Noli Me Tangere
 * 3. Tail Beam
 * 4. goto 3                 // loops Tail Beam forever
 * hpTrigger (once): hp < maxHp/4 -> Noli Me Tangere + [Jecht flavour]
 * ```
 */
export const vegnagunTailScript: AiScript = {
  id: 'vegnagun-tail',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;

    // The one HP trigger, fired at most once. §5.1
    if (!mem(self, 'hpTriggerFired') && self.hp < self.stats.maxHp / 4) {
      setMem(self, 'hpTriggerFired', 1);
      ctx.emit({ type: 'script-trigger', name: 'vegnagun-tail-quarter', payload: { who: self.id } });
      return { kind: 'ability', id: 'noli-me-tangere', targets: [] };
    }

    const s = step(self);
    if (s === 0) {
      ctx.emit({ type: 'script-trigger', name: 'farplane-voice-braska', payload: { who: self.id } });
      return null;
    }
    if (s === 1) return { kind: 'ability', id: 'noli-me-tangere', targets: [] };
    return { kind: 'ability', id: 'tail-beam', targets: randomPartyId(ctx) };
  },
};

// ---------------------------------------------------------------------------
// Leg — a 26-step fixed table with a three-way weighted Action1.
// ---------------------------------------------------------------------------

/**
 * `Action1` — one in three each: Berserk, Break (Petrify) or Slow, each
 * preferring a target that does not already have it. If every target already
 * has the rolled status the Leg falls back to Absorb. §5.2
 */
function legAction1(ctx: AiContext): Command {
  const party = ctx.party();
  const choice = ctx.rng.int(0, 2);
  const table = [
    { id: 'leg-berserk', status: 'berserk' as const },
    { id: 'leg-break', status: 'petrify' as const },
    { id: 'leg-slow', status: 'slow' as const },
  ];
  const picked = table[choice] ?? table[0];
  if (!picked) return { kind: 'ability', id: 'leg-absorb', targets: randomPartyId(ctx) };
  const eligible = party.filter((p) => !p.statuses[picked.status]);
  if (eligible.length === 0) {
    return { kind: 'ability', id: 'leg-absorb', targets: randomPartyId(ctx) };
  }
  return { kind: 'ability', id: picked.id, targets: [ctx.rng.pick(eligible).id] };
}

/**
 * The 26-step table, transcribed. `1` = Action1, `V` = Vita Brevis, `.` =
 * flavour. Step 25 jumps back to 21, so the steady state is Vita Brevis every
 * fourth turn. §5.2
 */
const LEG_TABLE = '1.1..1.V1...11V1.11.V111'.split('');
const LEG_LOOP_FROM = 20; // 0-based index of step 21

export const vegnagunLegScript: AiScript = {
  id: 'vegnagun-leg',

  decide(ctx: AiContext): Command | null {
    let s = step(ctx.self);
    if (s >= LEG_TABLE.length) {
      s = LEG_LOOP_FROM + ((s - LEG_LOOP_FROM) % (LEG_TABLE.length - LEG_LOOP_FROM));
    }
    const action = LEG_TABLE[s];
    if (action === 'V') return { kind: 'ability', id: 'vita-brevis', targets: [] };
    if (action === '1') return legAction1(ctx);
    ctx.emit({ type: 'script-trigger', name: 'farplane-voice', payload: { who: ctx.self.id } });
    return null;
  },
};

// ---------------------------------------------------------------------------
// Nodes — an independent colour machine on their own ATB. §3.2
// ---------------------------------------------------------------------------

const COLOURS = ['red', 'green', 'yellow'] as const;
type NodeColour = (typeof COLOURS)[number];

/** Current colour, and the auto-statuses it grants. §3.2 */
export function nodeColour(unit: Ffx2Unit): NodeColour {
  const index = mem(unit, 'colour') % COLOURS.length;
  return COLOURS[index] ?? 'red';
}

/**
 * `actionCount` rises on the Node's own resolved turn **and** on being hit by
 * any attack; at 4 it rolls over and the colour advances RED -> GREEN ->
 * YELLOW -> RED. §3.2
 */
export function bumpNodeCounter(unit: Ffx2Unit): boolean {
  const next = mem(unit, 'actionCount') + 1;
  if (next < 4) {
    setMem(unit, 'actionCount', next);
    return false;
  }
  setMem(unit, 'actionCount', 0);
  setMem(unit, 'colour', mem(unit, 'colour') + 1);
  return true;
}

/** Red = Null Physical, Yellow = Null Magic. Applied as real statuses. §3.2 */
export function syncNodeImmunity(unit: Ffx2Unit): void {
  const colour = nodeColour(unit);
  delete unit.statuses['null-physical'];
  delete unit.statuses['null-magic'];
  const id = colour === 'red' ? 'null-physical' : colour === 'yellow' ? 'null-magic' : null;
  if (!id) return;
  unit.statuses[id] = {
    id,
    turnsRemaining: null,
    ticksRemaining: null,
    charges: null,
    stacks: 0,
    permanent: true,
  };
}

export const vegnagunNodeScript: AiScript = {
  id: 'vegnagun-node',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    const colour = nodeColour(self);
    bumpNodeCounter(self);
    syncNodeImmunity(self);

    // The Leg is what the green Nodes heal and buff — never themselves. §3.2
    const leg = ctx.allies().find((u) => u.id === 'vegnagun-leg');

    if (colour === 'red') {
      return ctx.rng.int(0, 1) === 0
        ? { kind: 'ability', id: 'missile', targets: randomPartyId(ctx) }
        : { kind: 'ability', id: 'dies-irae', targets: [] };
    }
    if (colour === 'green') {
      if (!leg) return null;
      const id = ctx.rng.pick(['cura', 'node-regen', 'node-shell', 'node-protect']);
      return { kind: 'ability', id, targets: [leg.id] };
    }
    const id = ctx.rng.pick(['firaga', 'blizzaga', 'thundaga', 'waterga', 'flare']);
    return { kind: 'ability', id, targets: id === 'flare' ? randomPartyId(ctx) : [] };
  },

  onDamaged(ctx: AiContext): void {
    // Being hit by any attack advances the colour machine too. §3.2
    bumpNodeCounter(ctx.self);
    syncNodeImmunity(ctx.self);
  },
};
