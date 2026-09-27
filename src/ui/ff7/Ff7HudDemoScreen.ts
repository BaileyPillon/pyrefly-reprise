/**
 * The FF7 HUD harness (FF7 only; development builds only): the real
 * `Ff7BattleHud` over a placeholder scene, driven by the deterministic
 * `Ff7HudFixture` because the FF7 engine does not exist yet. Registered as
 * `ff7-hud-demo` in `main.ts` behind `import.meta.env.DEV`, so a production
 * build never offers it and the hidden experiment stays hidden.
 *
 * The loop, with real keys or taps at every menu: the hint's three lines;
 * Cloud's window (Attack, Magic, Item); whatever is chosen plays its fixture
 * events; anything hostile brings the Tail Laser, which fills Cloud's Limit;
 * his TIME bar refills; the window opens again with **Limit** in slot 1;
 * after the Limit the fixture starts over.
 *
 * The scene is sheet furniture, not HUD: grey placeholder boxes with dashed
 * "PLACEHOLDER" labels, as on the A+ target.
 */

import { Screen } from '../../app/Screen.ts';
import type { Command, CombatantId } from '../../battle/common/types.ts';
import { Ff7BattleHud } from './Ff7BattleHud.ts';
import { Ff7HudFixture, HINT_LINES } from './ff7HudFixture.ts';

/** Placeholder figures: centre x, feet y and size as fractions of the screen. */
const FIGURES: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  'guard-scorpion': { x: 0.36, y: 0.66, w: 0.26, h: 0.3, label: 'PLACEHOLDER · GUARD SCORPION' },
  cloud: { x: 0.63, y: 0.68, w: 0.05, h: 0.2, label: 'PLACEHOLDER · CLOUD' },
  barret: { x: 0.72, y: 0.68, w: 0.06, h: 0.21, label: 'PLACEHOLDER · BARRET' },
};
const PHONE_FIGURES: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  'guard-scorpion': { x: 0.3, y: 0.46, w: 0.5, h: 0.2, label: 'PLACEHOLDER · GUARD SCORPION' },
  cloud: { x: 0.7, y: 0.5, w: 0.11, h: 0.14, label: 'PLACEHOLDER · CLOUD' },
  barret: { x: 0.87, y: 0.52, w: 0.12, h: 0.15, label: 'PLACEHOLDER · BARRET' },
};

const STYLE = `
.ff7demo-scene{position:absolute;inset:0;background:radial-gradient(ellipse at 45% 40%,#23493f 0%,#12261f 55%,#07110d 100%)}
.ff7demo-fig{position:absolute;border-radius:40% 40% 8% 8%;background:linear-gradient(#3a4a46,#1a2421);box-shadow:inset 0 0 0 2px rgba(160,200,190,.25)}
.ff7demo-label{position:absolute;white-space:nowrap;font:700 11px 'Chakra Petch',sans-serif;letter-spacing:.14em;color:rgba(244,241,232,.75);
  background:rgba(0,0,0,.55);border:1px dashed rgba(244,241,232,.5);padding:3px 7px;transform:translate(-50%,-100%)}
.ff7demo-chip{position:absolute;right:14px;top:16%;font:700 11px 'Chakra Petch',sans-serif;letter-spacing:.14em;color:rgba(244,241,232,.72);background:rgba(0,0,0,.5);padding:4px 8px}
@media (max-width:599px){.ff7demo-label{font-size:8px;letter-spacing:.08em;padding:2px 4px}.ff7demo-chip{font-size:8px;right:8px;top:14%}}
`;

export class Ff7HudDemoScreen extends Screen {
  readonly name = 'ff7-hud-demo';
  private readonly fixture = new Ff7HudFixture();
  private hud: Ff7BattleHud | null = null;
  private waits: Array<{ left: number; done: () => void }> = [];
  private filling = false;
  private running = true;
  private lastCommand: Command | null = null;
  private turns = 0;
  private readonly figureEls = new Map<string, HTMLElement>();

  override enter(): void {
    const style = document.createElement('style');
    style.textContent = STYLE;
    const scene = document.createElement('div');
    scene.className = 'ff7demo-scene';
    this.root.append(style, scene);
    const phone = window.innerWidth < 600 && window.innerHeight > window.innerWidth;
    for (const [id, f] of Object.entries(phone ? PHONE_FIGURES : FIGURES)) {
      const fig = document.createElement('div');
      fig.className = 'ff7demo-fig';
      fig.dataset['figure'] = id;
      Object.assign(fig.style, { left: `${(f.x - f.w / 2) * 100}%`, top: `${(f.y - f.h) * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` });
      const label = document.createElement('div');
      label.className = 'ff7demo-label';
      label.textContent = f.label;
      // Under the feet, so the ready triangle over the head and the finger stay clear of the furniture.
      Object.assign(label.style, { left: `${f.x * 100}%`, top: `${(f.y + 0.035 + (id === 'barret' ? 0.03 : 0)) * 100}%` });
      if (f.x > 0.8) label.style.transform = 'translate(-88%, 0)'; // keep a right-hand label on screen
      scene.append(fig, label);
      this.figureEls.set(id, fig);
    }
    const chip = document.createElement('div');
    chip.className = 'ff7demo-chip';
    chip.textContent = 'HUD BUILD · FF7 ONLY · PLACEHOLDER SCENE AND FIGURES · CURRENT HP ARE PLACEHOLDERS';
    scene.append(chip);

    const hud = new Ff7BattleHud({ itemCount: (id) => this.fixture.items[id] });
    this.hud = hud;
    hud.mount(this.root);
    hud.setProjector((id, anchor) => this.point(id, anchor ?? 'head'));
    hud.setTargetingPort({
      rect: (id) => this.rect(id),
      select: () => {},
      xray: () => {},
      visibility: () => 1,
      setPanels: () => {},
    });
    void this.run();
  }

  override exit(): void {
    this.running = false;
    this.hud?.unmount();
    this.hud = null;
  }

  override update(dt: number): void {
    this.hud?.update(dt);
    if (this.filling && this.hud) {
      this.fixture.tick(dt);
      this.hud.syncGauges(this.fixture.gauges());
    }
    for (const w of this.waits) w.left -= dt;
    const due = this.waits.filter((w) => w.left <= 0);
    this.waits = this.waits.filter((w) => w.left > 0);
    for (const w of due) w.done();
  }

  override snapshot(): Record<string, unknown> {
    const view = this.hud?.inspect();
    return { lastCommand: this.lastCommand, turns: this.turns, message: view?.message ?? null, menu: view?.menu?.view ?? null, ready: view?.ready ?? null, mode: view?.geometry.mode };
  }

  private wait(seconds: number): Promise<void> {
    return new Promise((done) => this.waits.push({ left: seconds, done }));
  }

  private rect(id: CombatantId): { x: number; y: number; w: number; h: number } | null {
    const el = this.figureEls.get(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const o = this.root.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
  }

  private point(id: CombatantId, anchor: 'head' | 'chest' | 'feet'): { x: number; y: number } | null {
    const r = this.rect(id);
    if (!r) return null;
    const y = anchor === 'head' ? r.y : anchor === 'chest' ? r.y + r.h * 0.35 : r.y + r.h;
    return { x: r.x + r.w / 2, y };
  }

  private async run(): Promise<void> {
    const hud = this.hud;
    if (!hud) return;
    hud.sync(this.fixture.state(), this.fixture.gauges());
    for (const text of HINT_LINES) hud.onEvent({ seq: -1, type: 'message', text, kind: 'story' });
    await this.wait(1.35); // the first hint line, then the window opens under the second
    while (this.running && this.hud) {
      hud.sync(this.fixture.state(), this.fixture.gauges());
      const cmd = await hud.chooseCommand('cloud', this.fixture.commands('cloud'));
      if (!this.running) return;
      this.lastCommand = cmd;
      this.turns++;
      const wasLimit = cmd.kind === 'limit';
      for (const e of this.fixture.respond('cloud', cmd)) {
        hud.onEvent(e);
        if (e.type === 'damage') hud.syncVitals(this.fixture.state());
        if (e.type === 'action-end') await this.wait(0.9);
      }
      hud.sync(this.fixture.state(), this.fixture.gauges());
      this.filling = true;
      while (this.running && (this.fixture.fighters['cloud']?.time ?? 1) < 1) await this.wait(0.1);
      this.filling = false;
      if (wasLimit) {
        await this.wait(0.6);
        this.fixture.reset();
      }
    }
  }
}
