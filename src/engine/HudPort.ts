import type { AtbSnapshot, AvailableCommand, BattleEvent, BattleState, Command, CombatantId, MinigameKind, MinigameResult, TurnPreview } from '../battle/common/types.ts';
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
   * Optional per-frame tick from the battle screen, in seconds. A HUD that
   * animates anything itself (FFX's damage numerals) uses this so its motion
   * freezes with the rest of the game when the loop is stopped for a capture.
   */
  update?(dt: number): void;
}
