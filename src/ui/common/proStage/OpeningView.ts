/**
 * THE OVERDRIVE OPENING, THE DRAWING (lane "pro-staging"; the plan is `engine/pro/staging/OpeningPlan.ts`): the small name set at the caster's side and the glint along his blade, in the TOP layer. The light change (the arena
 * lightening toward ivory around the lit caster, the HUD sinking) is drawn by the layer on the held breath's canvas (`ProStageLayer.update` asks for {@link OpeningView.light}), so there is one wash and one set of windows.
 * FFX only: an Overdrive is FFX's. The FFX-2 Change's pearl plate is CSS on the HUD's own flourish (`proStage.css`, `data-pst-open`), toggled here for as long as the flourish plays.
 */
import { CHANGE_OPEN_MS, OD_OPEN_HOLD_MS, emptyOd, odFrame, type OdFrame, type OdMarks } from '../../../engine/pro/staging/OpeningPlan.ts';
import type { OpeningCue } from '../../../engine/pro/staging/StagingPort.ts';
import type { ProStageOptions } from './ProStageLayer.ts';

export class OpeningView {
  private marks: OdMarks = emptyOd();
  private actor: string | null = null;
  private readonly block: HTMLElement;
  private readonly who: HTMLElement;
  private readonly title: HTMLElement;
  private readonly glintEl: HTMLElement;
  private now = 0;
  private changeUntil = 0;
  /** This frame's opening, or null when none is on. */
  frame: OdFrame | null = null;

  constructor(
    host: HTMLElement,
    private readonly o: ProStageOptions,
  ) {
    const doc = host.ownerDocument;
    this.block = doc.createElement('div');
    this.block.className = 'pst__od';
    this.who = doc.createElement('div');
    this.who.className = 'pst__od-who';
    this.title = doc.createElement('div');
    this.title.className = 'pst__od-name';
    const rule = doc.createElement('div');
    rule.className = 'pst__od-rule';
    this.block.append(this.who, this.title, rule);
    this.glintEl = doc.createElement('div');
    this.glintEl.className = 'pst__glint';
    host.append(this.block, this.glintEl);
  }

  cue(c: OpeningCue): void {
    if (c.kind === 'change') {
      // FFX-2: the HUD's own flourish plays; its name plate is restyled to a readable pearl one while this flag is up
      this.o.root.dataset['pstOpen'] = '';
      this.changeUntil = this.now + CHANGE_OPEN_MS;
      return;
    }
    this.actor = c.actor;
    this.marks = { at: this.now, holdMs: OD_OPEN_HOLD_MS * c.scale, tame: c.tame };
    this.who.textContent = `${this.o.nameOf?.(c.actor) ?? ''} · Overdrive`.replace(/^ · /, '');
    this.title.textContent = c.name;
  }

  /** REDUCE FLASHES is on for the opening in play: its pop is ivory, never white. */
  get tame(): boolean {
    return this.marks.tame;
  }

  /** The caster's rectangle now, for the layer's windows. */
  get actorId(): string | null {
    return this.frame?.alive ? this.actor : null;
  }

  update(now: number): void {
    this.now = now;
    if (this.changeUntil > 0 && now >= this.changeUntil) {
      delete this.o.root.dataset['pstOpen'];
      this.changeUntil = 0;
    }
    if (this.marks.at === null) {
      this.frame = null;
      return;
    }
    const f = odFrame(now, this.marks);
    this.frame = f;
    if (!f.alive) {
      this.marks = emptyOd();
      this.actor = null;
      this.block.style.opacity = '0';
      this.glintEl.style.opacity = '0';
      this.frame = null;
      return;
    }
    // the small name sits where the command menu was (the left of the frame, the menu is closed and the HUD sunk): beside the caster it would stand on his neighbours in the party's formation
    this.block.style.opacity = f.name.toFixed(3);
    this.block.style.transform = `translateY(${((1 - f.name) * 8).toFixed(1)}px)`;
    const r = this.actor ? this.o.rectOf(this.actor) : null;
    if (!r) return;
    if (f.glint >= 0) {
      const x = r.x + r.w * (-0.1 + 1.2 * f.glint);
      this.glintEl.style.cssText = `opacity:${Math.sin(Math.PI * f.glint).toFixed(3)};width:${(r.w * 0.75).toFixed(0)}px;transform:translate(${x.toFixed(0)}px, ${(r.y + r.h * 0.58).toFixed(0)}px) rotate(-32deg);`;
    } else {
      this.glintEl.style.opacity = '0';
    }
  }

  clear(): void {
    this.marks = emptyOd();
    this.actor = null;
    this.frame = null;
    this.block.style.opacity = '0';
    this.glintEl.style.opacity = '0';
    delete this.o.root.dataset['pstOpen'];
    this.changeUntil = 0;
  }

  dispose(): void {
    this.block.remove();
    this.glintEl.remove();
    delete this.o.root.dataset['pstOpen'];
  }
}
