/**
 * The FF7 battle HUD (FF7 only): Bailey's option A, made "EVEN more faithful"
 * (Bailey, 2026-09-27), built to `docs/plans/ff7-hud-faithful-a-spec.md` and
 * the A+ target `docs/concepts/ff7-hud-2026-09-27/a-plus/`.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** It imports no FFX or FFX-2 HUD
 * module and changes no shared token; its CSS is scoped under `.ff7hud`. The
 * one shared piece it uses is the Esc claim (`ui/ffx/cancelClaim.ts`), so Esc
 * in a submenu backs out instead of opening the pause, as in every other HUD.
 *
 * What it draws: the band (names window + status window over FF7's black
 * strip), the command window with the finger and its Magic, Item and Limit
 * windows, the finger on a target, the top message window (messages and the
 * SELECT help), damage numerals and the ready triangle. What it never draws
 * (spec §8): a coach, an advisor, a strategy guide, a turn list, a bracket, a
 * banner, an enemy window.
 *
 * Numbers come from the engine through `sync` / `syncVitals` / `syncGauges` /
 * `onEvent`; the HUD holds none of its own (rule 6).
 */

import './ff7-hud.css';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  ItemId,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { Ff7Combatant } from '../../battle/common/types-ff7.ts';
import type { HudPort, TargetingPort } from '../../engine/HudPort.ts';
import { Ff7CommandMenu } from './Ff7CommandMenu.ts';
import { ff7Geometry, type Ff7Geometry } from './ff7Geometry.ts';
import { Ff7HelpLine } from './Ff7HelpLine.ts';
import { partyRows, snapshotOf, withGauges, withLimit, type Ff7RowView, type LimitNote } from './ff7HudModel.ts';
import { Ff7Marks, type Projector } from './ff7Marks.ts';
import { highlighted, type Ff7MenuState } from './ff7MenuModel.ts';
import { namesWindowHtml, stripHtml, statusWindowHtml, type BlinkPhase } from './Ff7PartyRows.ts';
import { LIMIT_BLINK_MS, LIMIT_STEP_MS } from './ff7Tokens.ts';

export interface Ff7HudOptions {
  /** Items in the bag, for the Item list's counts (the engine owns the inventory). */
  itemCount?: (id: ItemId) => number | undefined;
  /** Fixed size, for tests and captures; otherwise the mount root's box (or the window). */
  size?: () => { w: number; h: number };
}

function layer(name: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = `ff7-layer ff7-layer--${name}`;
  return el;
}

export class Ff7BattleHud implements HudPort {
  readonly root: HTMLDivElement = document.createElement('div');
  private readonly bandLayer = layer('band');
  private readonly marksLayer = layer('marks');
  private readonly menuLayer = layer('menu');
  private readonly msgLayer = layer('message');
  private readonly menu: Ff7CommandMenu;
  private readonly line: Ff7HelpLine;
  private readonly marks: Ff7Marks;
  private host: HTMLElement | null = null;
  private geo: Ff7Geometry | null = null;
  private state: BattleState | null = null;
  private rows: Ff7RowView[] = [];
  private gauges: AtbSnapshot | null = null;
  private readonly limits = new Map<CombatantId, LimitNote>();
  private projector: Projector | null = null;
  private targeting: TargetingPort | null = null;
  private actor: CombatantId | null = null;
  private clockMs = 0;
  private blink: BlinkPhase = 0;
  private limitPhase = 0;
  private atbMode: 'wait' | 'active' = 'wait';
  private readonly onResize = (): void => this.relayout();

  constructor(private readonly opts: Ff7HudOptions = {}) {
    this.root.className = 'ff7hud';
    this.root.dataset['game'] = 'ff7';
    this.root.append(this.bandLayer, this.marksLayer, this.menuLayer, this.msgLayer);
    const geometry = (): Ff7Geometry => this.geometry();
    this.line = new Ff7HelpLine(this.msgLayer, geometry);
    this.marks = new Ff7Marks(this.marksLayer, geometry, () => this.projector);
    this.menu = new Ff7CommandMenu({
      layer: this.menuLayer,
      geometry,
      context: () => ({
        actorMp: this.actorFighter()?.mp ?? 0,
        limitLevel: this.actorFighter()?.ff7?.limit?.level ?? 1,
        limitPhase: this.limitPhase,
        ...(opts.itemCount ? { itemCount: opts.itemCount } : {}),
      }),
      targetRect: (id) => this.targeting?.rect(id) ?? null,
      targetPoint: (id) => this.projector?.(id, 'chest') ?? null,
      onChange: (st) => this.menuChanged(st),
    });
  }

  // ------------------------------------------------------------------ port

  mount(root: HTMLElement): void {
    this.host = root;
    root.appendChild(this.root);
    window.addEventListener('resize', this.onResize);
    this.relayout();
  }

  unmount(): void {
    window.removeEventListener('resize', this.onResize);
    this.menu.destroy();
    this.line.clear();
    this.marks.clear();
    this.root.remove();
    this.host = null;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    this.state = state;
    this.gauges = snapshotOf(preview) ?? this.gauges;
    this.limits.clear(); // the engine's own gauge is current again
    this.rows = partyRows(state, this.gauges, this.limits);
    this.renderBand();
  }

  syncVitals(state: BattleState): void {
    this.state = state;
    this.rows = partyRows(state, this.gauges, this.limits);
    this.renderBand();
  }

  syncGauges(snapshot: AtbSnapshot): void {
    this.gauges = snapshot;
    this.rows = withGauges(this.rows, snapshot);
    this.renderBand();
  }

  chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
    this.actor = actorId;
    this.marks.setReady(actorId);
    return this.menu.open(commands).then((cmd) => {
      this.marks.setReady(null);
      this.actor = null;
      return cmd;
    });
  }

  closeCommandMenu(): void {
    this.menu.close();
    this.marks.setReady(null);
    this.actor = null;
  }

  /** FF7 has no mode label on screen [spec §3.7]: the TIME bars stopping is the only sign. Kept for the Wait hooks. */
  setAtbMode(mode: 'wait' | 'active'): void {
    this.atbMode = mode;
  }

  onMenuLevel(listener: (level: 'top' | 'deep') => void): () => void {
    return this.menu.onLevel(listener);
  }

  onEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'message':
        this.line.say(event.text);
        break;
      case 'action-start':
        // The ability's name in the top window [spec §5.9: enemy actions; party spells and Limits, our estimate].
        if (event.abilityName && event.command.kind !== 'attack') this.line.say(event.abilityName, true);
        break;
      case 'damage':
        if (event.amount !== 0) this.marks.add(event.targetId, String(Math.abs(event.amount)), event.amount < 0, event.hitIndex);
        break;
      case 'heal':
        this.marks.add(event.targetId, String(event.amount), true);
        break;
      case 'miss':
        this.marks.add(event.targetId, 'Miss', false);
        break;
      case 'limit-gauge': {
        const note = { value: event.value, ready: event.ready };
        this.limits.set(event.actorId, note);
        this.rows = withLimit(this.rows, event.actorId, note);
        this.renderBand();
        break;
      }
      default:
        break;
    }
  }

  openMinigame(kind: MinigameKind, _params: Record<string, unknown>): Promise<MinigameResult> {
    return Promise.reject(new Error(`FF7 has no timed-input minigame (asked for ${kind})`));
  }

  setVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  setProjector(project: Projector): void {
    this.projector = project;
    this.marks.render();
  }

  setTargetingPort(port: TargetingPort): void {
    this.targeting = port;
  }

  update(dt: number): void {
    this.line.update(dt);
    this.marks.update(dt);
    this.clockMs += dt * 1000;
    const blink = (Math.floor(this.clockMs / LIMIT_BLINK_MS) % 2) as BlinkPhase;
    if (blink !== this.blink) {
      this.blink = blink;
      if (this.rows.some((r) => r.limitReady)) this.renderBand();
    }
    const phase = Math.floor(this.clockMs / LIMIT_STEP_MS);
    if (phase !== this.limitPhase) {
      this.limitPhase = phase;
      if (this.menu.state?.slots[0]?.label === 'Limit') this.menu.render();
    }
  }

  // --------------------------------------------------------------- helpers

  /** For tests and the harness: what the HUD shows now. */
  inspect(): { rows: Ff7RowView[]; message: string | null; menu: Ff7MenuState | null; ready: CombatantId | null; atbMode: 'wait' | 'active'; geometry: Ff7Geometry } {
    return { rows: this.rows, message: this.line.shown, menu: this.menu.state, ready: this.marks.readyId, atbMode: this.atbMode, geometry: this.geometry() };
  }

  /** The command menu, for tests and the harness to press keys without a keyboard. */
  get commandMenu(): Ff7CommandMenu {
    return this.menu;
  }

  private geometry(): Ff7Geometry {
    if (!this.geo) this.geo = ff7Geometry(...this.size());
    return this.geo;
  }

  private size(): [number, number] {
    const fixed = this.opts.size?.();
    if (fixed) return [fixed.w, fixed.h];
    const w = this.host?.clientWidth || window.innerWidth || 1600;
    const h = this.host?.clientHeight || window.innerHeight || 900;
    return [w, h];
  }

  private relayout(): void {
    this.geo = ff7Geometry(...this.size());
    this.root.dataset['mode'] = this.geo.mode;
    this.renderBand();
    this.menu.render();
    this.line.render(true);
    this.marks.render();
  }

  private renderBand(): void {
    if (!this.host && !this.opts.size) return;
    const g = this.geometry();
    this.bandLayer.innerHTML = stripHtml(g) + namesWindowHtml(g, this.rows) + statusWindowHtml(g, this.rows, this.blink);
  }

  private actorFighter(): Ff7Combatant | null {
    const c = this.actor && this.state ? this.state.combatants[this.actor] : undefined;
    return c && 'ff7' in c ? (c as Ff7Combatant) : null;
  }

  /** SELECT's help: the highlighted command's description, or the aimed target's name [spec §3.5]. */
  private menuChanged(st: Ff7MenuState | null): void {
    if (!st || !st.help) {
      this.line.setHelp(null);
      return;
    }
    if (st.view === 'target') {
      const names = (st.targetAll ? st.targets : [st.targets[st.targetIdx]]).flatMap((id) => {
        const c = id && this.state ? this.state.combatants[id] : undefined;
        return c ? [c.name] : [];
      });
      this.line.setHelp(names.join(', ') || null);
      return;
    }
    const row = highlighted(st);
    const slot = st.view === 'top' ? st.slots[st.topIdx] : null;
    this.line.setHelp(row?.help ?? row?.label ?? slot?.label ?? null);
  }
}
