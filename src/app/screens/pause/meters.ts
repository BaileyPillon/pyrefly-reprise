/**
 * The two columns of hairline meters, as data.
 *
 * Bailey approved these meters on 21 Sep 2026 (README question 3 of
 * `docs/concepts/pause-until-dawn/`, answered *"yes"*): **BATTLE STATS** —
 * seven rows, both games — and **IN THIS FIGHT**, which is the game-aware half.
 *
 * ## Game-aware (AGENTS.md rule 14)
 *
 * | row | FFX | FFX-2 | why |
 * |---|---|---|---|
 * | the seven stat rows | yes | yes | both engines carry str/mag/def/mdef/agi on `StatBlock` |
 * | Overdrive gauge, Overdrive mode | yes | **no** | Overdrive is FFX's limit system; X-2 has none [ffx-combat-core §5.1] |
 * | statuses with their remaining duration | yes | **no** | the `battle-254` duration model that makes REST OF BATTLE true is FFX's [ffx-combat-core §4.1] |
 * | Turn order, "Nth of N" | yes | **no** | CTB has a queue to be Nth in; ATB has a clock [ffx2-combat-core §1.1] |
 * | ATB gauge, Active/Wait, Chain, Dressphere, Garment Grid, gates | **no** | yes | all six are X-2's own systems [ffx2-combat-core §1.1-1.5, §3, §4.1] |
 *
 * Each direction is asserted both ways by `tests/unit/pause-remake-meters.test.ts`:
 * an FFX member prints no ATB row and an FFX-2 member prints no Overdrive row.
 *
 * ## Nothing here invents a number
 *
 * Every value is read off the live `BattleState`. Two rows the mockup drew are
 * deliberately **not** built:
 *
 * - The dim bar extension for what an FFX-2 Garment Grid and accessories add.
 *   `Combatant.stats` is documented as the *effective* block, modifiers already
 *   applied, and no base block is on the state — so the size of the bonus
 *   cannot be read, only guessed. AGENTS.md rule 6.
 * - FFX weapon and armour names, and Sphere Level. Bailey named no home for
 *   them; this agent's guess is the CHAPTER tab (`targets.json`
 *   `reaction.inferred`), and that is where they are, not here.
 *
 * Pure: no DOM, no `three`, no engine import. Everything is `data -> rows`.
 */

import type {
  AnyCombatant,
  BattleState,
  GameId,
  StatusId,
  TurnPreview,
} from '../../../battle/common/types.ts';
import { FFX_STATUSES, type FFXStatusDef } from '../../../data/ffx/statuses/index.ts';

/**
 * The status catalog, widened to a string lookup.
 *
 * `FFX_STATUSES` is keyed by `FFXStatusId`; a `StatusInstance.id` is the wider
 * `StatusId` (either game's), so the key may genuinely be absent and the
 * lookup has to admit `undefined` rather than lie about it.
 */
const STATUS_DEFS: Readonly<Record<string, FFXStatusDef | undefined>> = FFX_STATUSES;

/** One meter row. `fill === null` is a word row: a label and a value, no bar. */
export interface MeterRow {
  /** Row key, for tests and for the DOM. */
  id: string;
  /** Left-hand tracked caps label. */
  k: string;
  /** Right-hand value, already worded. */
  v: string;
  /** The part of `v` that is the dim denominator (`/2420`), if any. */
  quiet?: string;
  /** 0..1 fill, or null for a word row. */
  fill: number | null;
  /** 0..1 party-average tick, or null. */
  mark?: number | null;
}

/** A whole column. */
export interface MeterColumn {
  id: 'stats' | 'fight';
  heading: string;
  rows: MeterRow[];
}

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/** The active party members, in field order, skipping any id with no record. */
export function activeMembers(state: Readonly<BattleState> | null): AnyCombatant[] {
  if (!state) return [];
  return state.activeIds.map((id) => state.combatants[id]).filter((c): c is AnyCombatant => !!c);
}

/**
 * BATTLE STATS — both games.
 *
 * HP and MP fill current/max and are the only rows that print a slash. The
 * five real stats fill against **the best of the three on the field**, with the
 * tick at their average, which is the reading the mockup's bars carry: a bar is
 * "how this member compares with the two standing beside her", not a percentage
 * of some cap the game never states.
 */
export function battleStatsRows(c: AnyCombatant, party: readonly AnyCombatant[]): MeterRow[] {
  const peers = party.length ? party : [c];
  const best = (pick: (m: AnyCombatant) => number): number =>
    Math.max(1, ...peers.map(pick));
  const avg = (pick: (m: AnyCombatant) => number): number =>
    peers.reduce((n, m) => n + pick(m), 0) / peers.length;

  const stat = (id: string, k: string, pick: (m: AnyCombatant) => number): MeterRow => {
    const top = best(pick);
    return { id, k, v: String(pick(c)), fill: clamp01(pick(c) / top), mark: clamp01(avg(pick) / top) };
  };

  return [
    {
      id: 'hp',
      k: 'HP',
      v: String(c.hp),
      quiet: `/${c.stats.maxHp}`,
      fill: clamp01(c.hp / Math.max(1, c.stats.maxHp)),
    },
    {
      id: 'mp',
      k: 'MP',
      v: String(c.mp),
      quiet: `/${c.stats.maxMp}`,
      fill: clamp01(c.mp / Math.max(1, c.stats.maxMp)),
    },
    stat('str', 'Strength', (m) => m.stats.str),
    stat('mag', 'Magic', (m) => m.stats.mag),
    stat('def', 'Defence', (m) => m.stats.def),
    stat('mdef', 'Magic Def', (m) => m.stats.mdef),
    stat('agi', 'Agility', (m) => m.stats.agi),
  ];
}

/**
 * How long an FFX status really has left.
 *
 * The brief asked for "statuses with remaining duration". Most of this
 * engine's FFX statuses do not have one: Zombie, Haste, Slow, Shell, Protect,
 * Reflect, Berserk, Confuse, Curse, Provoke, Poison, Petrify and Scan are
 * `battle-254` — they last the rest of the fight, and a turn counter beside
 * them would be a lie. So the row prints **what the model actually is**
 * (`src/data/ffx/statuses/core.ts`), which is the only way this screen can
 * answer the brief without inventing a number.
 *
 * Exported so the wording can be pinned per model without mounting anything.
 */
export function statusDurationLabel(
  id: StatusId,
  inst: { turnsRemaining: number | null; charges: number | null; stacks: number; permanent: boolean },
): string {
  if (inst.permanent || inst.turnsRemaining === 255) return 'Permanent';
  const model = STATUS_DEFS[id]?.durationModel;
  const turns = inst.turnsRemaining;
  if (model === 'charges' || (model === undefined && inst.charges !== null)) {
    const n = inst.charges ?? 1;
    return n === 1 ? '1 charge' : `${n} charges`;
  }
  if (model === 'until-next-turn') return 'Until next turn';
  if (model === 'until-consumed') return 'Until used';
  if (model === 'dynamic') return 'While it holds';
  if (model === 'instant') return 'Until cured';
  if (turns === 254) return 'Rest of battle';
  if (typeof turns === 'number' && turns >= 0) {
    if (model === 'counter') return turns === 1 ? '1 turn left' : `${turns} turns left`;
    return turns === 1 ? '1 turn' : `${turns} turns`;
  }
  return 'Rest of battle';
}

/** The status label as the row prints it, with a stack count when it has one. */
function statusKey(id: StatusId, stacks: number): string {
  const name = STATUS_DEFS[id]?.name ?? id.replace(/-/g, ' ');
  return stacks > 1 ? `${name} ×${stacks}` : name;
}

function ffxFightRows(c: AnyCombatant, turnOrder: readonly TurnPreview[] | null): MeterRow[] {
  const rows: MeterRow[] = [];
  const od = 'overdrive' in c ? c.overdrive : undefined;
  if (od) {
    const gauge = clamp01(od.gauge / 100);
    rows.push({ id: 'overdrive', k: 'Overdrive', v: `${Math.round(od.gauge)}`, quiet: '%', fill: gauge });
    rows.push({ id: 'od-mode', k: 'Mode', v: od.mode.replace(/-/g, ' '), fill: null });
  }
  for (const [id, inst] of Object.entries(c.statuses)) {
    if (!inst || id === 'ko') continue;
    rows.push({
      id: `status-${id}`,
      k: statusKey(id as StatusId, inst.stacks),
      v: statusDurationLabel(id as StatusId, inst),
      fill: null,
    });
  }
  const turn = turnOrderRow(c, turnOrder ?? []);
  if (turn) rows.push(turn);
  return rows;
}

/**
 * TURN ORDER — both halves of "Nth of N" on one scale, and a row for every
 * member who is on the field.
 *
 * The first version counted two different things. The numerator was the index
 * of the member's next **tile** in the depth-10 forecast (0..9); the
 * denominator was `new Set(turnOrder.map(t => t.actorId)).size`, the distinct
 * **actors** in it. A live chapter-1 forecast is ten tiles held by four
 * actors — `[kimahri, kimahri, seymour-flux, mortiorchis, tidus, tidus,
 * kimahri, seymour-flux, mortiorchis, tidus]` — so Tidus printed
 * *"Turn order 5th of 4"*, and a run three turns in printed *"8th of 5"*.
 * Worse, `findIndex` answering -1 dropped the row entirely: Yuna, who is slow
 * enough that her next turn is past the tenth tile, was alive on the field
 * with the screen silently refusing to answer a question it had just asked.
 *
 * Both halves now count **actors, in the order their next turn comes up**, so
 * the ordinal can never exceed the count. A member past the end of the
 * forecast is told so in words: the forecast genuinely does not know where she
 * lands, and a number would be an invention (AGENTS.md rule 6). A member who
 * is down is not in the queue at all, and says that instead.
 *
 * FFX only, like the rest of `ffxFightRows` — CTB has a queue to be Nth in
 * [ffx2-combat-core §1.1; AGENTS.md rule 14].
 */
export function turnOrderRow(
  c: AnyCombatant,
  turnOrder: readonly TurnPreview[],
): MeterRow | null {
  if (turnOrder.length === 0) return null;
  const queue: string[] = [];
  for (const t of turnOrder) if (!queue.includes(t.actorId)) queue.push(t.actorId);
  const at = queue.indexOf(c.id);
  const v =
    at >= 0
      ? `${ordinal(at + 1)} of ${queue.length}`
      : c.hp <= 0
        ? 'Out of the queue'
        : `After ${queue.length} others`;
  return { id: 'turn-order', k: 'Turn order', v, fill: null };
}

function ffx2FightRows(c: AnyCombatant, mode: 'active' | 'wait'): MeterRow[] {
  const rows: MeterRow[] = [];
  if (!('atb' in c)) return rows;
  const atb = c.atb;
  const gauge = atb.required > 0 ? atb.ticks / atb.required : clamp01(atb.gauge / 100);
  rows.push({ id: 'atb', k: 'ATB', v: `${Math.round(clamp01(gauge) * 100)}`, quiet: '%', fill: clamp01(gauge) });
  rows.push({ id: 'atb-mode', k: 'Mode', v: mode === 'wait' ? 'Wait' : 'Active', fill: null });
  rows.push({ id: 'chain', k: 'Chain', v: `×${c.chainCount}`, fill: null });
  const dress = 'dresspheres' in c ? c.dresspheres : undefined;
  if (dress) {
    rows.push({ id: 'dressphere', k: 'Dressphere', v: dress.current.replace(/-/g, ' '), fill: null });
    const grid = dress.garmentGrid;
    if (grid) {
      rows.push({ id: 'grid', k: 'Garment grid', v: grid.id.replace(/-/g, ' '), fill: null });
      rows.push({
        id: 'gates',
        k: 'Gates',
        v: `${grid.passedGates.length} of 4 passed`,
        fill: null,
      });
    }
  }
  return rows;
}

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** IN THIS FIGHT — the game-aware column. */
export function inThisFightRows(
  c: AnyCombatant,
  game: GameId,
  opts: { turnOrder?: readonly TurnPreview[] | null; atbMode?: 'active' | 'wait' } = {},
): MeterRow[] {
  return game === 'ffx2'
    ? ffx2FightRows(c, opts.atbMode ?? 'active')
    : ffxFightRows(c, opts.turnOrder ?? null);
}

/** Both columns for one member. */
export function memberColumns(
  c: AnyCombatant,
  state: Readonly<BattleState> | null,
  game: GameId,
  opts: { turnOrder?: readonly TurnPreview[] | null; atbMode?: 'active' | 'wait' } = {},
): MeterColumn[] {
  return [
    { id: 'stats', heading: 'Battle stats', rows: battleStatsRows(c, activeMembers(state)) },
    { id: 'fight', heading: 'In this fight', rows: inThisFightRows(c, game, opts) },
  ];
}
