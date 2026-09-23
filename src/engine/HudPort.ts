import type { AtbSnapshot, AvailableCommand, BattleEvent, BattleState, Command, CombatantId, MinigameKind, MinigameResult, TurnPreview } from '../battle/common/types.ts';
import type { AccentKind } from './TargetHighlight.ts';

/**
 * What the painted field can tell the HUD, and be told, about the target the
 * player is choosing.
 *
 * This is the seam Bailey's Chapter 3 criticism runs along. The HUD owns the
 * marks that carry meaning in words — the bracket, the name plate with its
 * letter tag, the help bar — and the field owns the two that carry it in light
 * — the accent pool under the figure and the quiet dim on everyone else. They
 * have to agree on one selection, and the HUD may not import `three`, so they
 * meet here.
 *
 * `PaintedStage` implements every method; `BattleScreen` hands the port over.
 */
export interface TargetingPort {
  /**
   * The combatant's painted silhouette on screen, in CSS pixels — the tight
   * alpha box, not the padded PNG. What a bracket is scaled to.
   */
  rect(id: CombatantId): { x: number; y: number; w: number; h: number } | null;
  /**
   * Light these ids on the field and dim everyone else; `null` restores it.
   * Called on every arrow press, and on confirm and cancel.
   */
  select(sel: { ids: CombatantId[]; mode: 'single' | 'all'; accent: AccentKind } | null): void;
  /**
   * Fade whatever is still covering this id, for the case the spread formation
   * genuinely cannot clear — Vegnagun's parts, which touch because they are
   * one machine. `null` restores every actor's alpha.
   */
  xray(id: CombatantId | null): void;
  /** How much of this combatant is visible right now, 0..1. */
  visibility(id: CombatantId): number;
  /**
   * HUD rectangles that cover the field, so a fiend hidden behind the command
   * stack counts as hidden. The HUD publishes; the field reads.
   */
  setPanels(panels: ReadonlyArray<{ x: number; y: number; w: number; h: number }>): void;
}

export interface HudPort {
  mount(root: HTMLElement): void;
  unmount(): void;
  /** Re-render from engine state. `preview` is predictTurnOrder() (FFX) or gaugeSnapshot() (FFX-2). */
  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void;
  /**
   * Re-render **only the status rows** from a state the presenter has projected
   * to the event it is playing right now. Called once per visible event, inside
   * a burst, between the ordinary `sync` calls that bracket it.
   *
   * Optional and additive: a HUD that does not implement it simply keeps the
   * old behaviour, which is what every mock screen and test double wants.
   *
   * Why it is separate from {@link sync}: `sync` also rebuilds the turn
   * forecast, the strategy guide, the advisor and the enemy-intent slab, and
   * the intent prediction deep-clones the whole board two dozen times. That is
   * affordable once per playback step and not once per hit. This call must stay
   * cheap enough to make on every damage numeral.
   *
   * Exists because the party row used to be 2.1–4.5 s behind the engine — a
   * KO'd Yuna drawn alive at 711/1500 for 2145 ms (critic round 03 #9). See
   * `BattlePresenterVitals.ts` for the projection and why it is not simply
   * `engine.state()`.
   */
  syncVitals?(state: BattleState): void;
  /**
   * Re-render **only the ATB gauges** from a fresh snapshot.
   *
   * Optional and additive, and **FFX-2 only in practice**: it exists for the
   * Active pump (`BattlePresenterActive.ts`), which advances the FFX-2 clock
   * at 20 Hz while a command menu is open and needs the bars to move with it.
   * FFX is CTB, has no clock to run under a menu, and implements nothing here.
   *
   * Must stay as cheap as {@link syncVitals} and for the same reason: `sync`
   * rebuilds the guide, the advisor and the enemy-intent slab, and the intent
   * prediction deep-clones the board two dozen times. At 20 Hz that is a
   * frame-rate defect dressed as a feature.
   */
  syncGauges?(snapshot: AtbSnapshot): void;
  /** Open the command menu; resolves the chosen command. previewRank re-renders the CTB list for the highlighted command. */
  chooseCommand(actorId: CombatantId, commands: AvailableCommand[], previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot): Promise<Command>;
  /**
   * Tear down an open command menu from outside, because its owner can no
   * longer answer it — KO'd, Stopped, Slept, Petrified, chain-locked or
   * Berserked while it was up, or the battle ended under her.
   *
   * Optional and additive, and again **FFX-2 only in practice**: only Active
   * lets anything happen to the owner while her menu is open. The promise from
   * {@link chooseCommand} is abandoned, never resolved — the implementation's
   * job is to release the keyboard claim and clear the DOM, or Esc belongs to
   * a menu that is no longer on screen.
   */
  closeCommandMenu?(): void;
  /**
   * Which Config ATB mode the fight is in right now, for the HUD's mode chip
   * (`research/ffx2-combat-core.md` §1.5 and §8, "Mode indicator": the words
   * "Active mode" / "Wait mode", upper right).
   *
   * Optional and additive, **FFX-2 only**: the presenter calls it when an
   * FFX-2 menu opens and whenever the pause's X-2 BATTLE row flips the mode
   * under an open menu. FFX's CTB has no such setting and implements nothing.
   * Without it the chip could only guess, and guessed wrong once Wait became
   * the default (D-029; the verifier's ch. 4 seed 3 capture).
   */
  setAtbMode?(mode: 'wait' | 'active'): void;
  /** Called for every event before the presenter animates it; may show a transient (telegraph banner, chain popup) but must resolve within ~600 ms. */
  onEvent(event: BattleEvent): Promise<void> | void;
  openMinigame(kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult>;
  setVisible(visible: boolean): void;
  /**
   * The presenter supplies projected screen positions for cursors and damage
   * numbers, in CSS pixels. `anchor` picks the point on the figure: the
   * default `'head'` for cursors, `'chest'` for damage numerals.
   */
  setProjector(
    project: (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null,
  ): void;
  /**
   * The targeting surface the painted field offers the HUD.
   *
   * Optional and additive: a HUD mock screen with no 3D field behind it simply
   * never receives one, and its target cursor falls back to a fixed box.
   * Everything a real battle needs to answer *"which enemy is being
   * selected?"* goes through here — see {@link TargetingPort}.
   */
  setTargetingPort?(port: TargetingPort): void;
  /**
   * Optional per-frame tick from the battle screen, in seconds. A HUD that
   * animates anything itself (FFX's damage numerals) uses this so its motion
   * freezes with the rest of the game when the loop is stopped for a capture.
   */
  update?(dt: number): void;
}
