/**
 * Vegnagun — Tail (link 1), Leg and the three Nodes (link 2)
 * [research/re-ffx2-ai-bahamut-vegnagun.md sections 3 and 4; re-parity AI lane FFX-2 a]. **FFX-2 only.**
 * The decision tables of the game's own scripts (`m282`, `m283`, `m284` to `m286`), in our words.
 *
 * A voice line is a poll that issues a no-action turn here (the game queues a speak command with a recovery of its own):
 * the Farplane voices speak from the AI as turns that consume an ATB slot.
 *
 * **Tail.** Poll 1 a voice (Braska). Then, once: Noli Me Tangere on the party (it also runs a target search it ignores, which
 * draws when two or more girls stand). Below a quarter of his HP and after that opening sweep: a second Noli Me Tangere
 * (once, rows T1), then one voice poll (Jecht), then Tail Beam. Everything else is Tail Beam on a girl by the near-weighted
 * search (T2). The half-HP sweep the old text promised cannot fire in the script (its test sits inside the quarter branch).
 *
 * **Leg.** Every poll first adds 1 to a voice counter; polls 2, 4, 5, 7, 10, 11, 12, 17 and 20 are voice lines. Any other poll
 * adds 1 to a turn counter: the fourth is Vita Brevis (counter back to 0), the others roll `random() % 4`: 0 Break (25 %),
 * 1 Berserk (25 %), 2 or 3 Slow (50 %) on a girl who lacks it by the near-weighted search, or Absorb on any living girl by the
 * same search when none lacks it (rows L1, L2; the old text's Break fallback was an inference and is the script's now).
 *
 * **Nodes A, B and C** start in three colours, red, green, yellow (N2), and each Node counts polls: the poll that makes its
 * counter 5 changes its colour and issues nothing; every damaging hit a Node takes adds 1 to the counter (a hit that deals no
 * HP does not). Red is Null Physical: Dies Irae on the party (50 %) or a Missile at one girl (50 %), uniform. Green: Regen,
 * Shell or Protect on the Leg (20 % each), Cura on the Leg (40 %) (N3). Yellow: Flare at one girl, Firaga, Waterga, Thundaga
 * or Blizzaga on the party (20 % each); yellow is Null Magic. In the game the poll that only changes the colour is followed by
 * the next poll one logic step later, so here the same turn goes on to act in the new colour (rows N1).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { speakTurn } from './idle.ts';
import { lacking, scriptMod, searchNear, searchUniform, spendSearchDraw, SCENES } from './script-rolls.ts';

function girlsOf(ctx: AiContext): Ffx2Unit[] {
  return ctx.party();
}

// ---------------------------------------------------------------------------
// Tail
// ---------------------------------------------------------------------------

function noli(ctx: AiContext): Command {
  spendSearchDraw(ctx.rng, girlsOf(ctx).length); // the ignored search of the script
  return { kind: 'ability', id: 'noli-me-tangere', targets: [] };
}

export const vegnagunTailScript: AiScript = {
  id: 'vegnagun-tail',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    if (mem(self, 'voice') === 0) {
      setMem(self, 'voice', 1);
      ctx.emit({ type: 'script-trigger', name: 'farplane-voice-braska', payload: { who: self.id } });
      return speakTurn(self);
    }
    if (mem(self, 'sweep') === 0) {
      setMem(self, 'sweep', 1);
      return noli(ctx);
    }
    if (self.hp < Math.floor(self.stats.maxHp / 4)) {
      if (mem(self, 'sweep') <= 2) {
        setMem(self, 'sweep', 3);
        return noli(ctx);
      }
      if (mem(self, 'voice') === 1) {
        setMem(self, 'voice', 2);
        ctx.emit({ type: 'script-trigger', name: 'vegnagun-tail-quarter', payload: { who: self.id } });
        return speakTurn(self);
      }
    }
    const target = searchNear(ctx.rng, girlsOf(ctx), SCENES.tail);
    return target ? { kind: 'ability', id: 'tail-beam', targets: [target.id] } : null;
  },
};

// ---------------------------------------------------------------------------
// Leg
// ---------------------------------------------------------------------------

/** The polls of the Leg that are voice lines: Jecht, Jecht, Auron, Braska, Jecht, Braska, Auron, Auron, Braska. */
const LEG_VOICE_POLLS: ReadonlyMap<number, string> = new Map([
  [2, 'jecht'], [4, 'jecht'], [5, 'auron'], [7, 'braska'], [10, 'jecht'], [11, 'braska'], [12, 'auron'], [17, 'auron'], [20, 'braska'],
]);

/** The three status moves of `random() % 4` (0, 1, then 2 and 3 together), with the status each prefers a girl to lack. */
const LEG_MOVES = [
  { id: 'leg-break', status: 'petrify' },
  { id: 'leg-berserk', status: 'berserk' },
  { id: 'leg-slow', status: 'slow' },
] as const;

function legStatusMove(ctx: AiContext): Command | null {
  const roll = scriptMod(ctx.rng, 4);
  const move = LEG_MOVES[Math.min(roll, 2)] ?? LEG_MOVES[2];
  const girls = girlsOf(ctx);
  const target = searchNear(ctx.rng, lacking(girls, move.status), SCENES.leg);
  if (target) return { kind: 'ability', id: move.id, targets: [target.id] };
  const any = searchNear(ctx.rng, girls, SCENES.leg);
  return any ? { kind: 'ability', id: 'leg-absorb', targets: [any.id] } : null;
}

export const vegnagunLegScript: AiScript = {
  id: 'vegnagun-leg',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    const poll = mem(self, 'voice') + 1;
    setMem(self, 'voice', poll);
    const speaker = LEG_VOICE_POLLS.get(poll);
    if (speaker !== undefined) {
      ctx.emit({ type: 'script-trigger', name: 'farplane-voice', payload: { who: self.id, speaker, poll } });
      return speakTurn(self);
    }
    const turn = mem(self, 'turn') + 1;
    if (turn >= 4) {
      setMem(self, 'turn', 0);
      return { kind: 'ability', id: 'vita-brevis', targets: [] };
    }
    setMem(self, 'turn', turn);
    return legStatusMove(ctx);
  },
};

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

const COLOURS = ['red', 'green', 'yellow'] as const;
type NodeColour = (typeof COLOURS)[number];

/** Polls (and damaging hits) that change a Node's colour. m284.src:63-92 */
const COLOUR_CHANGE_AT = 5;

/** A Node's starting colour: A red, B green, C yellow (N2). */
function startColour(unit: Ffx2Unit): number {
  return unit.id.endsWith('-b') ? 1 : unit.id.endsWith('-c') ? 2 : 0;
}

/** Current colour; a Node that has never acted starts in its own colour. */
export function nodeColour(unit: Ffx2Unit): NodeColour {
  const index = (unit.aiMemory?.['colour'] === undefined ? startColour(unit) : mem(unit, 'colour')) % COLOURS.length;
  return COLOURS[index] ?? 'red';
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

/** A Node that has not yet acted or been hit takes its own starting colour. */
function ensureStarted(unit: Ffx2Unit): void {
  if (unit.aiMemory?.['colour'] !== undefined) return;
  setMem(unit, 'colour', startColour(unit));
  syncNodeImmunity(unit);
}

function nodeMove(ctx: AiContext): Command | null {
  const colour = nodeColour(ctx.self);
  if (colour === 'red') {
    if (scriptMod(ctx.rng, 2) === 0) return { kind: 'ability', id: 'dies-irae', targets: [] };
    const target = searchUniform(ctx.rng, girlsOf(ctx));
    return target ? { kind: 'ability', id: 'missile', targets: [target.id] } : null;
  }
  if (colour === 'green') {
    const roll = scriptMod(ctx.rng, 5);
    const leg = ctx.allies().find((u) => u.id === 'vegnagun-leg');
    if (!leg) return null; // the Leg is what the green Nodes heal and buff, never themselves
    const id = roll === 0 ? 'node-regen' : roll === 1 ? 'node-shell' : roll === 2 ? 'node-protect' : 'cura';
    return { kind: 'ability', id, targets: [leg.id] };
  }
  const roll = scriptMod(ctx.rng, 5);
  if (roll === 0) {
    const target = searchUniform(ctx.rng, girlsOf(ctx));
    return target ? { kind: 'ability', id: 'flare', targets: [target.id] } : null;
  }
  return { kind: 'ability', id: (['firaga', 'waterga', 'thundaga', 'blizzaga'] as const)[roll - 1] ?? 'blizzaga', targets: [] };
}

export const vegnagunNodeScript: AiScript = {
  id: 'vegnagun-node',

  decide(ctx: AiContext): Command | null {
    const self = ctx.self;
    ensureStarted(self);
    let polls = mem(self, 'colourCount') + 1;
    if (polls >= COLOUR_CHANGE_AT) {
      // This poll changes the colour and issues nothing; the next one acts in the new colour (counter 0, then 1).
      setMem(self, 'colour', (mem(self, 'colour') + 1) % COLOURS.length);
      syncNodeImmunity(self);
      polls = 1;
    }
    setMem(self, 'colourCount', polls);
    return nodeMove(ctx);
  },

  /** Every separate HP-damaging result a Node takes adds 1 to its colour counter (poison and Regen ticks are not hits). */
  onDamaged(ctx: AiContext, _sourceId, _amount: number, hits = 1): void {
    ensureStarted(ctx.self);
    setMem(ctx.self, 'colourCount', mem(ctx.self, 'colourCount') + hits);
  },
};
