/**
 * FF7's results and Game Over screen (FF7 only; D-244 C1 and G1, accepted by
 * Bailey on 2026-09-27: "I'll go with all of your recommendations").
 *
 * Victory: step 1 (EXP and AP), confirm, step 2 (Gil and Items), confirm, then
 * back to the board. Defeat: GAME OVER on black (the camera's pan up over the
 * fallen party has played in the battle, `BattleScreenFf7Motion.defeat`), then
 * RETRY / CHAPTER SELECT. The windows are `ui/ff7/ff7ResultsHtml.ts`; this
 * screen owns the timing and the input. It replaces the house results panel
 * for FF7 only (`BattleScreenExperiment.ts` routes an FF7 chapter here); it
 * reads and writes nothing: the flow records attempts and clears in the
 * experiments store, never the main save. Silent (music stays null).
 *
 * Named `'results'` like the house panel, so the flow, the debug API and the
 * e2e find it the same way.
 */

import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import type { BattleResult, CombatantId } from '../../battle/common/types.ts';
import type { Ff7PartyBuild } from '../../battle/common/types-ff7.ts';
import type { ResultsChoice } from '../../ui/common/resultsPage.ts';
import { FF7_EQUIPMENT } from '../../data/ff7/equipment.ts';
import { FF7_ITEMS } from '../../data/ff7/items.ts';
import { FF7_MATERIA } from '../../data/ff7/materia.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { GAME_OVER_ACTIONS, gameOverHtml, resFrame, stepOneHtml, stepTwoHtml, type Ff7ResultsView } from '../../ui/ff7/ff7ResultsHtml.ts';
import '../../ui/ff7/ff7-hud.css';
import '../../ui/ff7/ff7-hud-look.css';
import '../../ui/ff7/ff7-results.css';

/** How long the EXP counts in, and Game Over's fade before its menu, ms. Our estimate. */
export const FF7_COUNT_IN_MS = 900;
export const FF7_GAME_OVER_FADE_MS = 900;

/** Each member's head in their idle painting (fractions: left, top, size of the width). Measured on the Film idles. */
const HEADS: Readonly<Record<string, { x: number; y: number; w: number }>> = {
  cloud: { x: 0.14, y: 0.0, w: 0.4 },
  barret: { x: 0.2, y: 0.0, w: 0.42 },
};

function itemRow(id: string, count: number, build: Ff7PartyBuild): { name: string; count: number; line: string } {
  const eq = FF7_EQUIPMENT[id];
  if (eq) {
    // The member whose weapon it can replace: the same reach (the Assault Gun is Barret's, Long Range).
    const who = build.members.find((m) => eq.kind === 'weapon' && (m.weapon.longRange === true) === (eq.longRange === true));
    const bits = [eq.kind === 'weapon' ? `Att ${eq.att}` : '', eq.longRange ? 'Long Range' : ''].filter(Boolean).join(', ');
    return { name: eq.name, count, line: `(${who ? `${who.name}: ` : ''}${bits})` };
  }
  const it = (FF7_ITEMS as Record<string, { name?: string } | undefined>)[id];
  return { name: it?.name ?? id, count, line: '' };
}

/**
 * The windows' numbers, from the engine's result and the party build. `standing` is who was on their feet at the
 * end (`ff7Standing`): a KO'd member gets 0 EXP (core §11). Without it every member gets the award.
 */
export function ff7ResultsView(result: BattleResult, build: Ff7PartyBuild, standing?: readonly CombatantId[]): Ff7ResultsView {
  return {
    exp: result.exp,
    ap: result.ap,
    gil: result.gil,
    items: result.drops.map((d) => itemRow(d.itemId, d.count, build)),
    members: build.activeSlots.flatMap((id) => {
      const m = build.members.find((x) => x.id === id);
      if (!m) return [];
      const materia = [...m.materia.weapon, ...m.materia.armour].flatMap((x) => (x ? [FF7_MATERIA[x.id as keyof typeof FF7_MATERIA]?.name ?? x.id] : []));
      return [{
        id,
        name: m.name,
        level: m.base.level,
        exp: !standing || standing.includes(id) ? result.exp : 0,
        ap: result.ap,
        materia,
        portrait: { url: artUrl(`art/characters/${m.spriteKey}/idle.png`), ...(HEADS[id] ?? { x: 0.2, y: 0, w: 0.5 }) },
      }];
    }),
  };
}

export interface Ff7ResultsOptions {
  outcome: 'victory' | 'defeat' | string;
  result: BattleResult | null;
  build: Ff7PartyBuild;
  /** Who stood at the end (a KO'd member earns 0 EXP). */
  standing?: readonly CombatantId[];
  onChoice?: (choice: ResultsChoice) => void;
}

export class Ff7ResultsScreen extends Screen {
  readonly name = 'results';
  readonly done: Promise<ResultsChoice>;
  private resolve!: (c: ResultsChoice) => void;
  private layer: HTMLElement | null = null;
  private step: 1 | 2 | 'over' = 1;
  private ms = 0;
  private idx = 0;
  private picked = false;
  private readonly view: Ff7ResultsView | null;

  constructor(private readonly opts: Ff7ResultsOptions) {
    super();
    this.done = new Promise((r) => (this.resolve = r));
    this.view = opts.outcome === 'victory' && opts.result ? ff7ResultsView(opts.result, opts.build, opts.standing) : null;
    if (!this.view) this.step = 'over';
  }

  override enter(): void {
    const el = document.createElement('div');
    el.className = 'ff7hud ff7res';
    el.dataset['step'] = String(this.step);
    this.root.appendChild(el);
    this.layer = el;
    this.draw();
  }

  override exit(): void {
    this.layer?.remove();
    this.layer = null;
  }

  override update(dt: number): void {
    if (this.picked) return;
    const before = this.ms;
    this.ms += dt * 1000;
    const limit = this.step === 'over' ? FF7_GAME_OVER_FADE_MS : this.step === 1 ? FF7_COUNT_IN_MS : 0;
    if (before < limit) this.draw();
  }

  override handleInput(input: InputSnapshot): void {
    if (this.picked) return;
    if (this.step === 'over') {
      if (this.ms < FF7_GAME_OVER_FADE_MS * 0.6) return;
      const delta = (input.consume('down') || input.consume('right') ? 1 : 0) - (input.consume('up') || input.consume('left') ? 1 : 0);
      if (delta) {
        this.idx = (this.idx + delta + GAME_OVER_ACTIONS.length) % GAME_OVER_ACTIONS.length;
        this.draw();
      }
      for (const a of GAME_OVER_ACTIONS) if (input.actions.includes(`results:${a.choice}`)) return this.pick(a.choice);
      if (input.consume('confirm')) return this.pick(GAME_OVER_ACTIONS[this.idx]!.choice);
      if (input.consume('cancel')) this.pick('chapter-select');
      return;
    }
    if (input.consume('confirm') || input.actions.includes('results:continue')) {
      if (this.step === 1) {
        this.step = 2;
        this.ms = 0;
        this.draw();
      } else this.pick('continue');
    }
  }

  private pick(choice: ResultsChoice): void {
    if (this.picked) return;
    this.picked = true;
    this.opts.onChoice?.(choice);
    this.resolve(choice);
  }

  private draw(): void {
    const el = this.layer;
    if (!el) return;
    const f = resFrame(window.innerWidth || 1600, window.innerHeight || 900);
    el.dataset['step'] = String(this.step);
    if (this.step === 'over') {
      const u = Math.min(1, this.ms / FF7_GAME_OVER_FADE_MS);
      el.innerHTML = gameOverHtml(f, u >= 0.6, this.idx, Math.min(1, u * 1.6));
    } else if (this.view) {
      el.innerHTML = this.step === 1 ? stepOneHtml(this.view, f, Math.min(1, this.ms / FF7_COUNT_IN_MS)) : stepTwoHtml(this.view, f);
    }
  }

  override snapshot(): Record<string, unknown> {
    return { ff7: true, step: this.step, cursor: GAME_OVER_ACTIONS[this.idx]?.choice ?? null, picked: this.picked };
  }
}
