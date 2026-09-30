/**
 * Status display O1: **the looks that live in the painting itself** — a hue or a darkening
 * (`PaintedActor.setTint`, the actor's own public control), Zombie's held green glow and
 * Pointless's slow flash (the painted planes' flash cells, the approved base frame's recipe in
 * `docs/concepts/status-display-0929/options/src/capture.mjs`), and FFX-2 Stop's frozen figure.
 *
 * Game case (AGENTS.md rule 14): the looks are `statusLooks.ts`'s per-game table. FFX: Zombie
 * green body + glow, Berserk red hue, Curse brown hue. FFX-2: Curse darkened, Stop frozen,
 * Pointless flashing slowly. Nothing else changes the painting.
 *
 * Presentation only (rule 1): reads the state; writes only the figures' look. The freeze is a
 * time scale on the figure's own `update`, lifted for the whole of any action that names the
 * figure (`hold`), on KO, removal and the result, so a stopped figure can never stall a beat the
 * presenter is waiting on.
 */

import type { BattleState, CombatantId, StatusId } from '../../battle/common/types.ts';
import { figureLookOf, type FigureLook, type StatusGame } from './statusLooks.ts';
import { wearsLooks } from './statusMarks.ts';

type Cell<T> = { value: T };
type ColourCell = Cell<{ set(c: number): unknown }>;

/** The figure surface this needs; `PaintedActor` has all of it. */
export interface TintFigure {
  setTint(colour: number | string): void;
  update(dt: number): void;
  traverse(fn: (o: unknown) => void): void;
}

export interface TintField {
  actor(id: CombatantId): TintFigure | undefined;
}

/** The composed painting look for one combatant. Pure. */
export interface PaintLook {
  tint: number | null;
  glow: FigureLook['glow'] | null;
  freeze: boolean;
  pulse: boolean;
}

/** Tint priority: the first status in this order with a tint wins (one multiply at a time). */
const TINT_ORDER: readonly StatusId[] = ['zombie', 'berserk', 'curse'];

export function paintLookOf(game: StatusGame, statuses: Partial<Record<string, unknown>>): PaintLook {
  const has = (s: string): boolean => statuses[s] !== undefined && statuses[s] !== null;
  let tint: number | null = null;
  for (const s of TINT_ORDER) {
    const t = has(s) ? figureLookOf(game, s)?.tint : undefined;
    if (t !== undefined) {
      tint = t;
      break;
    }
  }
  let glow: FigureLook['glow'] | null = null;
  let freeze = false;
  let pulse = false;
  for (const s of Object.keys(statuses)) {
    if (!has(s)) continue;
    const look = figureLookOf(game, s as StatusId);
    if (!look) continue;
    glow = glow ?? look.glow ?? null;
    freeze = freeze || look.freeze === true;
    pulse = pulse || look.pulse === true;
  }
  return { tint, glow, freeze, pulse };
}

const NONE: PaintLook = { tint: null, glow: null, freeze: false, pulse: false };
const keyOf = (l: PaintLook): string => `${l.tint ?? '-'}|${l.glow ? l.glow.colour : '-'}|${l.freeze}|${l.pulse}`;

/** The flash cells of a figure's painted planes (shared objects, so one set is enough). */
function flashCellsOf(fig: TintFigure): { amount: Cell<number>; colour: ColourCell; cut: Cell<number> } | null {
  let out: { amount: Cell<number>; colour: ColourCell; cut: Cell<number> } | null = null;
  fig.traverse((o) => {
    if (out) return;
    const u = (o as { material?: { uniforms?: Record<string, unknown> } }).material?.uniforms;
    if (u && 'flashAmount' in u && 'flashColor' in u && 'flashFloorCut' in u) {
      out = { amount: u['flashAmount'] as Cell<number>, colour: u['flashColor'] as ColourCell, cut: u['flashFloorCut'] as Cell<number> };
    }
  });
  return out;
}

interface Applied {
  fig: TintFigure;
  look: PaintLook;
  key: string;
  cells: ReturnType<typeof flashCellsOf>;
  update: TintFigure['update'];
  /** The wrapper this module put on the figure (removed on release). */
  wrapper: TintFigure['update'] | null;
  /** The figure's own `update` when it was an own property (a prototype method needs no restore). */
  own: TintFigure['update'] | null;
  /** Seconds left in which the freeze is lifted (an action or an event names the figure). */
  heldFor: number;
  phase: number;
}

/** How long any event naming a stopped figure lifts its freeze, s: covers a hit reaction or a KO fall. */
const THAW_S = 2.5;
/** Pointless: one slow white flash every this many seconds, to this amount. */
const PULSE_PERIOD_S = 1.8;
const PULSE_PEAK = 0.34;

export class StatusFigureTint {
  private readonly applied = new Map<CombatantId, Applied>();
  private wanted = new Map<CombatantId, PaintLook>();
  private acting = new Set<CombatantId>();

  constructor(private readonly game: StatusGame, private readonly field: () => TintField | null) {}

  sync(state: BattleState): void {
    const next = new Map<CombatantId, PaintLook>();
    for (const [id, c] of Object.entries(state.combatants)) {
      if (!wearsLooks(c, state.result)) continue;
      const look = paintLookOf(this.game, c.statuses);
      if (look.tint !== null || look.glow || look.freeze || look.pulse) next.set(id, look);
    }
    this.wanted = next;
    this.reconcile();
  }

  /** An event names this figure: a stopped one thaws for {@link THAW_S}; a KO drops its look. */
  touch(id: CombatantId, ko = false): void {
    const a = this.applied.get(id);
    if (a) a.heldFor = THAW_S;
    if (ko) {
      this.wanted.delete(id);
      this.reconcile();
    }
  }

  /** An action is on screen: its actor and targets move freely until it ends. */
  setActing(ids: readonly CombatantId[] | null): void {
    this.acting = new Set(ids ?? []);
  }

  update(dt: number): void {
    this.reconcile();
    for (const a of this.applied.values()) {
      a.heldFor = Math.max(0, a.heldFor - dt);
      a.phase += dt;
      const cells = a.cells;
      if (!cells) continue;
      let hold = 0;
      let colour = 0xffffff;
      let cut = 0;
      if (a.look.glow) {
        hold = a.look.glow.amount;
        colour = a.look.glow.colour;
        cut = a.look.glow.floorCut;
      } else if (a.look.pulse) {
        hold = PULSE_PEAK * (0.5 - 0.5 * Math.cos((a.phase / PULSE_PERIOD_S) * Math.PI * 2));
      }
      // A hit's own flash is brighter and wins; the held look takes back over as it fades.
      if (hold > 0 && cells.amount.value <= hold + 1e-3) {
        cells.colour.value.set(colour);
        cells.cut.value = cut;
        cells.amount.value = hold;
      }
    }
  }

  /** Ids with a painting look, and its key (tests, the debug snapshot). */
  snapshot(): Record<CombatantId, string> {
    const out: Record<CombatantId, string> = {};
    for (const [id, a] of this.applied) out[id] = a.key;
    return out;
  }

  dispose(): void {
    this.wanted.clear();
    this.reconcile();
  }

  private reconcile(): void {
    const field = this.field();
    for (const [id, a] of [...this.applied]) {
      const fig = field?.actor(id);
      if (fig === a.fig && this.wanted.has(id)) continue;
      this.release(a);
      this.applied.delete(id);
    }
    if (!field) return;
    for (const [id, look] of this.wanted) {
      const fig = field.actor(id);
      if (!fig) continue;
      let a = this.applied.get(id);
      if (!a) {
        const own = Object.prototype.hasOwnProperty.call(fig, 'update') ? fig.update : null;
        a = { fig, look: NONE, key: keyOf(NONE), cells: flashCellsOf(fig), update: fig.update.bind(fig), wrapper: null, own, heldFor: 0, phase: 0 };
        this.applied.set(id, a);
        const entry = a;
        // The freeze: the figure's own clock stands still while Stop holds it, except inside an
        // action that names it (or just after an event did), so no presenter beat can wait on it.
        entry.wrapper = (dt: number): void => entry.update(this.frozen(id, entry) ? 0 : dt);
        fig.update = entry.wrapper;
      }
      const key = keyOf(look);
      if (a.key === key) continue;
      a.fig.setTint(look.tint ?? 0xffffff);
      if (a.look.glow && !look.glow && a.cells) a.cells.amount.value = 0;
      a.look = look;
      a.key = key;
    }
  }

  private frozen(id: CombatantId, a: Applied): boolean {
    return a.look.freeze && a.heldFor <= 0 && !this.acting.has(id);
  }

  private release(a: Applied): void {
    // Back to the prototype's own method, unless something wrapped it after us.
    if (a.wrapper && a.fig.update === a.wrapper) {
      if (a.own) a.fig.update = a.own;
      else delete (a.fig as { update?: unknown }).update;
    }
    a.fig.setTint(0xffffff);
    if ((a.look.glow || a.look.pulse) && a.cells) a.cells.amount.value = 0;
  }
}
