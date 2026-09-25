/**
 * Chapter XIII (FFX-2), **option 4's line of play**: NightMare185's Strategy 3 (GameFAQs FAQ 27609,
 * `[single source]`; research `ffx2-trema.md` §12.3) with the `'nightmare-kit'` build. An input to a
 * measurement, never game data. **FFX-2 only.**
 *
 * - **Paragon (normal):** "When the battle begins, use Megalixirs to heal even though you have full
 *   health. After the first Genesis, another Megalixir, then 2 girls use REGULAR ATTACKS ... Repeat
 *   healing with 1 Girl with the Megalixir and 2 girls attacking." Never Darkness. "If Itchy lands on
 *   everyone", all three spherechange (here each Itchy girl changes out and back).
 * - **Trema:** his Strategy 2 items: Twin or Three Stars, Chocobo Wings, Soul Spring, "then two
 *   Darkness and one Mega-Potion a turn".
 *
 * The healer is Rikku (the source names no girl). A Megalixir replaces the Mega-Potion on Trema when
 * two girls are below half (our reading of "heal constantly").
 */

import type { Command } from '../../../src/battle/common/types.ts';
import type { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { boss, girls, itchyChange, use, type Input, type LineOptions } from './tremaLines.ts';

const HEALER = 'rikku';

function genesisSeen(engine: FFX2Engine): boolean {
  return engine.state().log.some((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'paragon-genesis');
}

function attack(d: Input, foeId: string): Command | null {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack');
  return row ? ({ ...row.command, targets: [foeId] } as Command) : null;
}

/** One girl's turn on NightMare185's line. */
export function nightmareTurn(d: Input, engine: FFX2Engine, line: LineOptions): Command | null {
  const party = girls(engine);
  const self = party.find((u) => u.id === d.actorId);
  const foe = boss(engine);
  if (!self || !foe) return null;
  const change = itchyChange(d, self, 'dark-knight', line);
  if (change) return change;
  if (self.statuses['itchy']) return { kind: 'defend', targets: [] };
  const living = party.filter((u) => u.alive);
  const healer = self.id === HEALER || !party.some((u) => u.id === HEALER && u.alive);

  if (foe.id !== 'trema') {
    if (healer || !genesisSeen(engine)) return use(d, 'item', 'x2-megalixir', []) ?? attack(d, foe.id);
    return attack(d, foe.id);
  }

  if (healer) {
    if (living.some((u) => !u.statuses['spellspring'])) {
      const stars = use(d, 'item', 'x2-three-stars', []);
      if (stars) return stars;
    }
    if (living.some((u) => !u.statuses['haste'])) {
      const wing = use(d, 'item', 'x2-chocobo-wing', []);
      if (wing) return wing;
    }
    if (line.drainBelow > 0 && foe.mp >= line.drainBelow) {
      const soul = use(d, 'item', 'x2-soul-spring', [foe.id]);
      if (soul) return soul;
    }
    const low = living.filter((u) => u.hp < u.stats.maxHp * 0.5).length >= 2;
    return (low ? use(d, 'item', 'x2-megalixir', []) : null) ?? use(d, 'item', 'x2-mega-potion', [])
      ?? use(d, 'item', 'x2-megalixir', []) ?? attack(d, foe.id);
  }
  return use(d, 'ability', 'x2-dark-knight-darkness', []) ?? attack(d, foe.id);
}
