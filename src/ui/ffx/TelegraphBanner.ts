/**
 * Enemy telegraph banner. The single widget that serves every scripted boss
 * wind-up: Mortiorchis's Auto-Attack Mode / Ready To Annihilate, Yunalesca's
 * Mega Death, BFA's Ultimate Jecht Shot, Vegnagun's cannon charge. The
 * banner itself is transient; the persistent state lives on the CTB row's
 * charge pip (`CtbList`, driven by `TurnPreview.chargeStage`).
 *
 * Not part of Ink & Gold's mocked component set (no telegraph screen was
 * mocked) -- composed locally from its ink/paper/serif tokens as a skewed
 * ink slab, the one place in this HUD that keeps amber/red warning colours
 * instead of gold: reusing the "ready" accent for "the boss is about to
 * wipe the party" would contradict the accent's own meaning everywhere else.
 */
export class TelegraphBanner {
  readonly el: HTMLElement;
  /** A screen-edge frame that persists at stage 2 until the attack resolves. */
  readonly borderEl: HTMLElement;
  private hideTimer = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx-telegraph';
    this.el.innerHTML = `
      <div class="ffx-telegraph__content">
        <div class="ffx-telegraph__actor" data-role="actor"></div>
        <div class="ffx-telegraph__state" data-role="state"></div>
      </div>
    `;
    this.borderEl = document.createElement('div');
    this.borderEl.className = 'ffx-screen-border';
  }

  /** Shows the banner for `holdMs`, then slides it back out. */
  show(actorName: string, stateText: string, stage: 1 | 2, holdMs = 1400): void {
    window.clearTimeout(this.hideTimer);
    this.el.querySelector('[data-role="actor"]')!.textContent = actorName.toUpperCase();
    this.el.querySelector('[data-role="state"]')!.textContent = stateText.toUpperCase();
    this.el.classList.remove('ffx-telegraph--stage-1', 'ffx-telegraph--stage-2');
    this.el.classList.add(`ffx-telegraph--stage-${stage}`, 'ffx-telegraph--visible');
    this.borderEl.classList.toggle('ffx-screen-border--visible', stage === 2);
    this.hideTimer = window.setTimeout(() => {
      this.el.classList.remove('ffx-telegraph--visible');
    }, holdMs);
  }

  /** Clears the persistent screen border once the charged attack resolves. */
  clearBorder(): void {
    this.borderEl.classList.remove('ffx-screen-border--visible');
  }

  dispose(): void {
    window.clearTimeout(this.hideTimer);
  }
}
