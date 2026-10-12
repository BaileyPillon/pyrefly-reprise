/**
 * Trema, Chapter XIII link 2 (Cloister 100 of the Via Infinito). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI-FFX2-b (2026-10-10): the game's own script**, `m295` (the story fight) and `m328` (the Fiend Arena), which
 * decide identically (`research/re-ffx2-ai-fallen-trema.md` section 7, rows T1 to T5), read in our own words. The first build was
 * SinirothX's dump (research `ffx2-trema.md` 4.2) with a story table of his own; both versions now run the one decision tree.
 *
 * ## The action entry, in the order the script tests (7.1)
 *
 * | # | Condition | Action |
 * |---|---|---|
 * | 1 | HP < max/6 (integer division, 166,666) and the Ultima flag is 0 | flag 1; Ultima on all the party; end |
 * | 2 | HP < max/4 (249,999) and the Meteor counter <= 1 | counter 2; Meteor on all the party; end |
 * | 3 | HP < max/2 (499,999) and the Meteor counter = 0 | counter 1; Meteor on all the party; end |
 * | 4 | else `random() mod 2` = 0 | **three commands in this one poll**, each with its own uniform girl: Dying Star, Falling Leaf, Thundering Wave (12/24) |
 * | 5 | else `random() mod 2` = 0 | a uniform girl, then `random() mod 3`: 0 Waning Moon, 1 Beguiling Mire, 2 Choking Mist (2/24 each) |
 * | 6 | else `random() mod 3` = 0 | Flare on a uniform girl (2/24) |
 * | 7 | else | Demi on all the party (4/24) |
 *
 * All the tests are strict "below" on the current HP; the flags start at 0 and are never cleared. HP can pass several lines
 * between two polls: at 249,998 or less with no Meteor cast yet the quarter row sets the counter to 2, so **one** Meteor is cast
 * and the half-HP Meteor is skipped for good (T2). The chain is **queued in one poll** (T3): the second and third link start
 * back to back as each finishes, and no HP row can fall between them, because the rows are only read at a poll, which comes after
 * the Thundering Wave's recovery. The queue is kept in his AI memory; the targets are rolled when it is made.
 *
 * ## What stays as the owner decided
 *
 * - **The MP gate (TR4 = b, D-146; T4).** The script never reads MP, and with Spellspring the costs are 0, so draining his MP
 *   would change nothing in the game. Bailey kept the reading that a rolled spell he cannot afford fails (Demi 10, Flare 54,
 *   Ultima 90; Meteor needs none) and wrote it into the guide; it stays and is listed for him.
 * - His Meteor callouts are the story's (`trema-meteor-1` and `-2`, by the number of Meteors **cast**, so the one Meteor of a skipped
 *   half line is the first), and `trema-ultima`.
 *
 * **Timers** (kept in their current units; for the W4 merge): after the chain Trema recovers 120 = 9,302 units (98 steps, 3.27 s);
 * after the three-hit fists 80 = 6,201 (66 steps, 2.20 s); Dying Star and Falling Leaf recover in 0; Flare and Ultima charge 7,751
 * (82 steps), Demi 6,201 (66), Meteor charge 9,302 (98) and recovery 7,751 (82). None of them is a script rule.
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { maxHpDiv, pickGirl, scriptModCtx } from './script-rolls.ts';

/** AI memory: the Ultima flag (0/1), the Meteor counter (0, 1, 2), the Meteors cast so far (callouts), the queued chain links. */
const ULTIMA = 'tremaUltima';
const METEOR = 'tremaMeteor';
const METEORS_CAST = 'tremaMeteorsCast';
const QUEUE = 'tremaQueue';

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

/** The MP the AI needs for a spell (the ability's own cost; Spellspring does not waive this check, TR4 = b). */
export function tremaCanAfford(ctx: AiContext, id: string): boolean {
  return ctx.self.mp >= (ctx.ability(id)?.mpCost ?? 0);
}

/** Cast `id`, or pass the turn with a line when his MP has been drained below its cost (TR4 = b). */
function cast(ctx: AiContext, id: string, targets: string[]): Command | null {
  if (tremaCanAfford(ctx, id)) return use(id, targets);
  const name = ctx.ability(id)?.name ?? id;
  ctx.emit({ type: 'message', text: `Trema lacks the MP for ${name}.`, kind: 'system' });
  return null;
}

/** How many HP rows have fired so far (Ultima flag plus Meteors cast), 0 to 3. */
export function tremaTriggersFired(unit: AiContext['self']): number {
  return mem(unit, ULTIMA) + mem(unit, METEORS_CAST);
}

/** The Meteor row: the story's callout names the Meteor by how many have been cast. */
function meteor(ctx: AiContext, counter: number): Command | null {
  const self = ctx.self;
  setMem(self, METEOR, counter);
  const cast1 = mem(self, METEORS_CAST) + 1;
  setMem(self, METEORS_CAST, cast1);
  ctx.emit({ type: 'script-trigger', name: `trema-meteor-${cast1}`, payload: { who: self.id } });
  return use('trema-meteor', []);
}

/** Queue the second and third link with their own targets, then play the first. */
function startChain(ctx: AiContext): Command {
  const first = pickGirl(ctx);
  const second = pickGirl(ctx);
  const third = pickGirl(ctx);
  setMem(ctx.self, QUEUE, `trema-falling-leaf:${second[0] ?? ''}|trema-thundering-wave:${third[0] ?? ''}`);
  return use('trema-dying-star', first);
}

/** The next queued link, or nothing when the chain is over. */
function nextLink(ctx: AiContext): Command | null {
  const queue = ctx.self.aiMemory?.[QUEUE];
  if (typeof queue !== 'string' || queue === '') return null;
  const [head, ...rest] = queue.split('|');
  setMem(ctx.self, QUEUE, rest.join('|'));
  const [id, target] = (head ?? '').split(':');
  if (!id) return null;
  return use(id, target ? [target] : []);
}

/** Trema's script for one version. The two versions decide alike; the Fiend Arena's Beguiling Mire is its own row (power 5). */
export function makeTremaScript(id: string, mireId: string): AiScript {
  return {
    id,
    decide(ctx) {
      const self = ctx.self;
      const link = nextLink(ctx);
      if (link) return link; // the chain's later links start before any row is read
      const hp = self.hp;
      if (hp < maxHpDiv(self, 6) && mem(self, ULTIMA) === 0) {
        setMem(self, ULTIMA, 1);
        ctx.emit({ type: 'script-trigger', name: 'trema-ultima', payload: { who: self.id } });
        return cast(ctx, 'trema-ultima', []);
      }
      const counter = mem(self, METEOR);
      if (hp < maxHpDiv(self, 4) && counter <= 1) return meteor(ctx, 2);
      if (hp < maxHpDiv(self, 2) && counter === 0) return meteor(ctx, 1);
      if (scriptModCtx(ctx, 2) === 0) return startChain(ctx);
      if (scriptModCtx(ctx, 2) === 0) {
        const girl = pickGirl(ctx);
        const pick = scriptModCtx(ctx, 3);
        return use(pick === 0 ? 'trema-waning-moon' : pick === 1 ? mireId : 'trema-choking-mist', girl);
      }
      if (scriptModCtx(ctx, 3) === 0) return cast(ctx, 'trema-flare', pickGirl(ctx));
      return cast(ctx, 'trema-demi', []);
    },
  };
}

export const tremaScript: AiScript = makeTremaScript('trema', 'trema-beguiling-mire');
/**
 * Fiend Arena Trema (option 2, OFF). The script is the story's (`m328` decides as `m295`); only its Beguiling Mire row
 * differs in our data (`trema-arena-beguiling-mire`, power 5).
 */
export const tremaArenaScript: AiScript = makeTremaScript('trema-arena', 'trema-arena-beguiling-mire');
