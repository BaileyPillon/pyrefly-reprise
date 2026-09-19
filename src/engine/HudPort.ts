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
  /** Open the command menu; resolves the chosen command. previewRank re-renders the CTB list for the highlighted command. */
  chooseCommand(actorId: CombatantId, commands: AvailableCommand[], previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot): Promise<Command>;
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
