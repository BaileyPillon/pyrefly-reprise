/**
 * Ormi in the three rooms of Chateau Leblanc (Chapter VI, Acts I to III). **FFX-2 only** [AGENTS.md rule 14].
 *
 * **Re-parity AI lane C (2026-10-10): the scripts are the game's own** (`m243`, `m244`, `m245`, read in
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 3.3, rows O1 to O7 of section 8). One counter (`mf_turn`) counts
 * the polls that reach it. Each poll, in this order:
 *
 * 1. **Act III only**: below a quarter of his HP (`HP < max / 4`, so 335 or less of 1,344) and `random() % 4 = 0`:
 *    **Concussive Blast** on the party, and the poll ends (the counter is not advanced). Acts I and II have no such
 *    branch and their lists do not carry the move (O1).
 * 2. The counter gains 1.
 * 3. While another enemy stands (Act I: Fem-Goon or Dr. Goon; Act II: Logos; Act III: Leblanc or Logos): counter 1 to 3
 *    is an **Attack** on a girl, counter 4 sends the counter back to 0 and is **Supercollider** on the girl farthest
 *    from him (O3, O5).
 * 4. Alone: `random() % 4`: 0 **Huggles** on the girl with the highest current **MP** (Acts I and II) or **HP**
 *    (Act III) (O2), 1 Supercollider on the farthest girl, 2 or 3 an Attack.
 *
 * Held as they were, and listed in `docs/handoff/re-parity-ai-ffx2-c.md`: the **farthest girl** is the back of the
 * formation, the highest slot (owner decision D-018/q3, 2026-09-21: the engine has no positions; O3), and the Attack
 * target, which the game weights by closeness and facing, is a uniform pick (O4). Acts I and II flee when they fall and
 * Act III's HP-to-1 hook belongs to the No Love Lost window (O7, `leblanc-syndicate.ts`).
 */

import type { Command } from '../../common/types.ts';
import type { AiContext, AiScript, Ffx2Unit } from '../internal.ts';
import { mem, setMem } from '../internal.ts';
import { extremeId, girls, pickId, scriptMod } from './script-rolls.ts';

/** Memory key: the script's `mf_turn`. */
export const ORMI_TURN = 'ormiTurn';

/**
 * Ormi's Supercollider targets the character **furthest away** (one `searchr` on ground distance, `max`), a
 * positional rule; the engine has no positions. **Owner-approved stand-in, 2026-09-21 (D-018/q3):** the highest `slot`,
 * the back of the formation. One extreme in the game draws nothing, and the stand-in draws nothing.
 */
export const SUPERCOLLIDER_TARGETS_BACK_OF_FORMATION = true;

function backOfFormation(ctx: AiContext): string[] {
  const party = girls(ctx);
  let furthest: Ffx2Unit | undefined;
  for (const unit of party) if (furthest === undefined || unit.slot > furthest.slot) furthest = unit;
  return furthest === undefined ? [] : [furthest.id];
}

/** Which room, and so which allies the script looks for and which stat Huggles reads. */
interface OrmiRoom {
  id: string;
  /** The enemy ids whose presence keeps him on the Attack, Attack, Attack, Supercollider cycle. */
  allies: readonly string[];
  /** Act III's Concussive Blast branch. */
  blast: boolean;
  /** What Huggles maximises: MP in Acts I and II, HP in Act III. */
  hugglesKey: (unit: Ffx2Unit) => number;
}

function use(id: string, targets: string[]): Command {
  return { kind: 'ability', id, targets };
}

function ormiScriptFor(room: OrmiRoom): AiScript {
  return {
    id: room.id,
    decide(ctx) {
      const self = ctx.self;
      const party = girls(ctx);
      if (party.length === 0) return null;
      if (room.blast && self.hp < Math.floor(self.stats.maxHp / 4) && scriptMod(ctx.rng, 4) === 0) {
        return use('x2-ormi-concussive-blast', []);
      }
      const turn = mem(self, ORMI_TURN) + 1;
      setMem(self, ORMI_TURN, turn);
      const standing = ctx.allies().some((u) => room.allies.includes(u.id));
      if (standing) {
        if (turn <= 3) return use('x2-ormi-shield-bash', pickId(ctx.rng, party));
        setMem(self, ORMI_TURN, 0);
        return use('x2-ormi-supercollider', backOfFormation(ctx));
      }
      switch (scriptMod(ctx.rng, 4)) {
        case 0:
          return use('x2-ormi-huggles', extremeId(ctx.rng, party, room.hugglesKey, 'max'));
        case 1:
          return use('x2-ormi-supercollider', backOfFormation(ctx));
        default:
          return use('x2-ormi-shield-bash', pickId(ctx.rng, party));
      }
    },
  };
}

const byMp = (u: Ffx2Unit): number => u.mp;
const byHp = (u: Ffx2Unit): number => u.hp;

/** Act I, the entrance (`m243`): Fem-Goon (slot 2) and Dr. Goon (slot 3) stand beside him. */
export const ormiActIScript: AiScript = ormiScriptFor({ id: 'ffx2-leblanc-ormi-act1', allies: ['fem-goon', 'dr-goon'], blast: false, hugglesKey: byMp });
/** Act II, Logos' room (`m244`): Logos (slot 2). */
export const ormiActIIScript: AiScript = ormiScriptFor({ id: 'ffx2-leblanc-ormi-act2', allies: ['logos-room'], blast: false, hugglesKey: byMp });
/** Act III, the Last Room (`m245`): Leblanc (slot 3) and Logos (slot 2). */
export const ormiScript: AiScript = ormiScriptFor({ id: 'ffx2-leblanc-ormi', allies: ['leblanc', 'logos'], blast: true, hugglesKey: byHp });
