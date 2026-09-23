/**
 * **The Evrae scene's harness battle: the real engine, the real HUD, the order
 * widget and the range director, on one screen, before the chapter is registered.**
 *
 * Game case: FFX only [AGENTS.md rule 14].
 *
 * Debug only (`evrae-airship-debug.ts` starts it on its `battle` beat). It is
 * how this track proves the loop the real battle will run once the integrator
 * wires it (handoff §6): the player issues an order through
 * `AirshipOrderWidget` (option A, the guide track's file, keyboard driven) ->
 * the engine queues it -> Cid flies it on his next turn -> the state's
 * `airship.range` flips -> {@link AirshipRangeDirector.sync} re-stages the deck
 * (option C). Nothing here is a presenter: turns resolve on a real clock, one
 * engine step every {@link STEP_MS}, with no action animation, and every party
 * turn that is not an order is a Defend.
 *
 * The engine is set up exactly as `tests/unit/chapters/evrae-engine.test.ts`
 * sets it up: the Fahrenheit build, the `evrae-airship` group, seed 1.
 */

import type { BattleState, Command, Decision, FFXBattleEngine, TurnPreview } from '../battle/common/types.ts';
import { AIRSHIP_ORDER, CID_ID, ORDER_OWNERS } from '../battle/ffx/ai/evrae-rules.ts';
import { FFXContentRegistry, createFFXEngine } from '../battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../data/ffx/index.ts';
import { fahrenheitBuild } from '../data/ffx/builds/fahrenheit.ts';
import { AirshipOrderWidget } from '../ui/ffx/AirshipOrderWidget.ts';
import { FFXBattleHud } from '../ui/ffx/FFXBattleHud.ts';
import type { AirshipRangeDirector } from './evrae-airship-director.ts';
import { airshipOrderOf, airshipRangeOf, missilesLeftOf } from './evrae-airship-range.ts';

/** One engine step per this many ms while nobody is being asked for input. */
const STEP_MS = 650;

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

export interface HarnessReport {
  range: string | null;
  order: string | null;
  missilesLeft: number;
  waitingOn: string | null;
  widgetOpen: boolean;
  turn: number;
  log: number;
  lastMessages: string[];
}

export class EvraeHarnessBattle {
  readonly engine: FFXBattleEngine;
  readonly hud = new FFXBattleHud();
  readonly widget = new AirshipOrderWidget();
  private stepLeft = STEP_MS / 1000;
  private pending: PlayerInput | null = null;
  private widgetOpen = false;
  private disposed = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly director: AirshipRangeDirector,
    project: (id: string) => { x: number; y: number } | null,
    seed = 1,
  ) {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    const group = ENEMY_GROUPS_BY_ID['evrae-airship'];
    if (!group) throw new Error('evrae-airship is missing from the data layer');
    this.engine = createFFXEngine({ content, autoResolveMinigames: true });
    this.engine.init({
      game: 'ffx',
      party: fahrenheitBuild,
      enemies: group,
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    });
    this.hud.mount(root);
    this.hud.setVisible(true);
    this.hud.setProjector((id) => project(id));
    // Where the cascade stands: the widget is option A's "rows in the cascade".
    const area = root.querySelector<HTMLElement>('.ffx-cmd-area') ?? root.querySelector<HTMLElement>('.ffxhud__stage');
    (area ?? root).appendChild(this.widget.el);
    this.director.sync(this.state());
    this.sync();
  }

  state(): BattleState {
    return this.engine.state();
  }

  private preview(): TurnPreview[] {
    return this.engine.predictTurnOrder(8);
  }

  /** HUD + CTB + the ORDER chip on Cid's tile + the deck. */
  private sync(): void {
    const st = this.state();
    this.hud.sync(st, this.preview());
    this.director.sync(st);
    const order = st.flags[AIRSHIP_ORDER];
    const cidRow = this.root.querySelector<HTMLElement>(`.ig-ctb__row[data-actor="${CID_ID}"]`);
    if (cidRow && (order === 'far' || order === 'near')) {
      cidRow.insertAdjacentHTML(
        'afterbegin',
        AirshipOrderWidget.orderChipHtml(order === 'far' ? 'pull-back' : 'close-in'),
      );
    }
  }

  /** Real-clock stepping. The widget, when open, holds the clock. */
  update(dt: number): void {
    if (this.disposed || this.widgetOpen || this.state().result) return;
    this.stepLeft -= dt;
    if (this.stepLeft > 0) return;
    this.stepLeft = STEP_MS / 1000;
    this.step();
  }

  private step(): void {
    const d = this.pending ?? this.engine.nextDecision();
    this.pending = null;
    if (d.kind === 'battle-over') return;
    if (d.kind === 'player-input') {
      // An order owner is asked only while no order is standing; with one
      // standing, the harness defends so Cid's turn can come round and fly it.
      if (ORDER_OWNERS.includes(d.actorId) && airshipOrderOf(this.state()) === null) {
        this.pending = d;
        this.sync();
        this.openWidget(d);
        return;
      }
      this.engine.submit({ kind: 'defend', targets: [] });
    }
    this.sync();
  }

  private openWidget(d: PlayerInput): void {
    const range = airshipRangeOf(this.state());
    if (!range || !AirshipOrderWidget.applies(range)) return;
    this.widgetOpen = true;
    void this.widget.open(d.commands, range, missilesLeftOf(this.state())).then((cmd: Command) => {
      this.widgetOpen = false;
      this.pending = null;
      if (this.disposed) return;
      this.engine.submit(cmd);
      this.sync();
      this.stepLeft = STEP_MS / 1000;
    });
  }

  /** Skip ahead (no input) until an order owner is asked, then open the widget. */
  runToOrder(maxSteps = 60): boolean {
    for (let i = 0; i < maxSteps && !this.widgetOpen && !this.state().result; i++) this.step();
    return this.widgetOpen;
  }

  report(): HarnessReport {
    const st = this.state();
    const msgs = st.log.filter((e) => e.type === 'message').slice(-4) as Array<{ text: string }>;
    return {
      range: airshipRangeOf(st),
      order: airshipOrderOf(st),
      missilesLeft: missilesLeftOf(st),
      waitingOn: this.pending?.actorId ?? null,
      widgetOpen: this.widgetOpen,
      turn: st.turn,
      log: st.log.length,
      lastMessages: msgs.map((m) => m.text),
    };
  }

  dispose(): void {
    this.disposed = true;
    this.widget.dispose();
    this.widget.el.remove();
    this.hud.unmount();
  }
}
