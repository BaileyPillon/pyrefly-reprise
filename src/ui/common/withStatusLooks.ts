/**
 * Status display O3 "Originals + guard rails" (Bailey, 2026-09-29: "I'll go with all of your
 * recommendations please"; `docs/concepts/status-display-0929/`), **both games**: the tap that puts
 * the figure layer and the guard rails on a battle HUD, the shape of `withOmnisGlow` — it wraps the
 * HUD's `sync`, `syncVitals`, `onEvent`, `chooseCommand`, `setProjector`, `setTargetingPort`,
 * `setActing`, `setVisible`, `update` and `unmount`, reads what they carry, and never changes it.
 *
 * - O1, on the figures: `statusMarks.ts` (bubbles, Z's, stars, smoke, halo, orbs, the Silence
 *   bubble, the Darkness cloud, Protect's shield on a physical hit) and `statusFigureTint.ts` (the
 *   hues, Zombie's glow, Stop's freeze, Pointless's slow flash), each game's own table.
 * - O3: the one-line message (`statusMessageLine.ts`), the guide card's cure hint
 *   (`statusHintCard.ts`), the aimed target's icons and red tags (`statusTargetTags.ts`), and, FFX
 *   only, the Zombie forecast (`ui/ffx/statusRailsFfx.ts`).
 * - O2's icon rows are the HUDs' own rows (`PartyStatusWindow`, `CtbList`, `PartyRows`,
 *   `BossGauges`), drawn with `statusIcons.ts`.
 *
 * Rule 1: presentation only. The HUD and the presenter are untouched by this tap; the engine is
 * read (state, events, a preview on a clone) and never written.
 */

import './status-o3.css';
import type {
  AbilityId, AtbSnapshot, AvailableCommand, BattleEvent, BattleState, Command, CombatantId, TurnPreview,
} from '../../battle/common/types.ts';
import type { ActingSignal, HudPort, TargetingPort } from '../../engine/HudPort.ts';
import { StatusMarks, type MarkField, type Point, type Rect } from './statusMarks.ts';
import { StatusFigureTint, type TintFigure } from './statusFigureTint.ts';
import { StatusMessageLine, lineTop, type Box } from './statusMessageLine.ts';
import { StatusHintCard, partyHints } from './statusHintCard.ts';
import { StatusTargetTags } from './statusTargetTags.ts';
import { figureLookOf, type StatusGame } from './statusLooks.ts';
import { FfxStatusRails } from '../ffx/statusRailsFfx.ts';

/** What the painted field offers: `PaintedStage` has all of it. */
export interface StatusField {
  actor(id: CombatantId): (TintFigure & { readonly alpha?: number; visible?: boolean }) | undefined;
  project?(id: CombatantId, anchor?: 'head' | 'chest' | 'feet'): Point | null;
  projectRect?(id: CombatantId): Rect | null;
}

/** Is an ability physical (Protect's shield shows on a physical hit only)? From the chapter's rows. */
export type PhysicalOf = (id: AbilityId) => boolean;

/** Per game: the message line's top on the 640x360 grid (the mockups' 74 and 112 px at 1600x900). */
const MSG_TOP: Record<StatusGame, number> = { ffx: 29.6, ffx2: 44.8 };
/** Top-centre chrome the line keeps under, never over. */
const MSG_AVOID: Record<StatusGame, string> = {
  ffx: '.ffx-tplate:not([hidden]), .ffx-telegraph--visible, .ffx-helpbar:not([hidden]), .ig-banner:not([hidden])',
  ffx2: '.ffx2-tplate:not([hidden]), .ffx2-aplate:not([hidden]), .ffx2hud__telegraph:not([hidden]), .ffx2-cmd-info:not([hidden])',
};

/**
 * The HUD's big boxes (the stage, the HUD root, the battle root) move with the window only; reading
 * them every frame forced a layout mid-frame. Each is re-read four times a second, or on a resize.
 */
class RectCache {
  private readonly map = new WeakMap<Element, { r: DOMRect; at: number; size: string }>();
  of(el: Element): DOMRect {
    const now = performance.now();
    const size = `${innerWidth}x${innerHeight}`;
    const hit = this.map.get(el);
    if (hit && now - hit.at < 250 && hit.size === size) return hit.r;
    const r = el.getBoundingClientRect();
    this.map.set(el, { r, at: now, size });
    return r;
  }
}

/** Phone: what the FFX line sits under (the turn strip and the enemy's intent card). */
const PHONE_TOP: Record<StatusGame, string> = { ffx: '.ig-ctb, .eint__panel', ffx2: '' };

export interface StatusLooksApi {
  readonly marks: StatusMarks;
  readonly tint: StatusFigureTint;
  readonly message: StatusMessageLine;
  readonly hint: StatusHintCard;
  readonly rails: FfxStatusRails | null;
  /** The ids the player is aiming at right now (tests, captures). */
  aimed(): readonly CombatantId[];
}

export function withStatusLooks<T extends HudPort>(hud: T, game: StatusGame, field: () => StatusField | null, physicalOf?: PhysicalOf): T {
  const marks = new StatusMarks(game);
  const tint = new StatusFigureTint(game, field);
  const message = new StatusMessageLine(game);
  const hint = new StatusHintCard(game);
  const tags = new StatusTargetTags(game);
  const rails = game === 'ffx' ? new FfxStatusRails() : null;

  let hudEl: HTMLElement | null = null;
  let rootEl: HTMLElement | null = null;
  let state: BattleState | null = null;
  let project: ((id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => Point | null) | null = null;
  let aimed: CombatantId[] = [];
  let decision: { actorId: CombatantId; highlighted: AvailableCommand | null } | null = null;
  let action: { physical: boolean } | null = null;
  let visible = true;
  let lastScale = '';
  let placedText = '';
  let placedAt = 0;
  const rects = new RectCache();

  const markField: MarkField = {
    head: (id) => field()?.project?.(id, 'head') ?? project?.(id, 'head') ?? null,
    chest: (id) => field()?.project?.(id, 'chest') ?? project?.(id, 'chest') ?? null,
    rect: (id) => field()?.projectRect?.(id) ?? null,
    alpha: (id) => {
      const a = field()?.actor(id);
      if (!a) return 0;
      if (a.visible === false) return 0;
      return typeof a.alpha === 'number' ? a.alpha : 1;
    },
  };
  const phone = (): boolean => typeof document !== 'undefined' && !!document.documentElement.dataset['phoneBattle'];
  const reconcile = (s: BattleState): void => {
    state = s;
    marks.sync(s);
    tint.sync(s);
  };

  const { sync, syncVitals, onEvent, chooseCommand, setProjector, setTargetingPort, setActing, setVisible, update, mount, unmount } = hud;

  hud.mount = (root: HTMLElement): void => {
    mount.call(hud, root);
    hudEl = root.querySelector<HTMLElement>(':scope > [data-role$="hud"]');
    // Under the HUD's panels, over the painted field.
    if (hudEl) root.insertBefore(marks.el, hudEl);
    else root.appendChild(marks.el);
    // The message line rides over everything on the field, the target reticle included.
    rootEl = root;
    root.appendChild(message.el);
  };
  hud.sync = (s: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    sync.call(hud, s, preview);
    reconcile(s);
    if (s.result) message.clear();
  };
  if (syncVitals) {
    hud.syncVitals = (s: BattleState): void => {
      syncVitals.call(hud, s);
      reconcile(s);
    };
  }
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    const out = onEvent.call(hud, event);
    look(event);
    return out;
  };
  hud.chooseCommand = async (actorId, commands, previewRank): Promise<Command> => {
    const d = { actorId, highlighted: null as AvailableCommand | null };
    decision = d;
    const wrapped = (cmd: AvailableCommand | null): TurnPreview[] | AtbSnapshot => {
      if (decision === d && (cmd || aimed.length === 0)) d.highlighted = cmd;
      return previewRank(cmd);
    };
    try {
      return await chooseCommand.call(hud, actorId, commands, wrapped);
    } finally {
      if (decision === d) decision = null;
      aimed = [];
      rails?.clear();
    }
  };
  hud.setProjector = (p): void => {
    project = p;
    setProjector.call(hud, p);
  };
  if (setTargetingPort) {
    hud.setTargetingPort = (port: TargetingPort): void => {
      // Every call goes straight through; `select` is only overheard (who is being aimed at).
      const tapped: TargetingPort = {
        rect: (id) => port.rect(id),
        select: (sel): void => {
          aimed = sel ? [...sel.ids] : [];
          port.select(sel);
        },
        xray: (id) => port.xray(id),
        visibility: (id) => port.visibility(id),
        setPanels: (panels) => port.setPanels(panels),
        ...(port.keyFeatures ? { keyFeatures: () => port.keyFeatures!() } : {}),
      };
      setTargetingPort.call(hud, tapped);
    };
  }
  hud.setActing = (signal: ActingSignal): void => {
    if (signal.phase === 'action-start') tint.setActing([signal.actorId, ...signal.targets]);
    else tint.setActing(null);
    setActing?.call(hud, signal);
  };
  hud.setVisible = (v: boolean): void => {
    visible = v;
    marks.setShown(v);
    if (!v) message.clear();
    setVisible.call(hud, v);
  };
  hud.update = (dt: number): void => {
    update?.call(hud, dt);
    tint.update(dt);
    marks.update(dt, markField);
    message.update(dt);
    frame();
  };
  hud.unmount = (): void => {
    marks.dispose();
    tint.dispose();
    message.clear();
    message.el.remove();
    hint.dispose();
    tags.clear(hudEl);
    rails?.dispose();
    unmount.call(hud);
    hudEl = null;
    rootEl = null;
  };

  function look(event: BattleEvent): void {
    message.onEvent(event, state);
    switch (event.type) {
      case 'action-start': {
        const id = event.abilityId ?? (event.command as { id?: AbilityId }).id;
        action = { physical: event.command.kind === 'attack' || (!!id && physicalOf?.(id) === true) };
        tint.setActing([event.actorId, ...event.targets]);
        return;
      }
      case 'action-end':
        action = null;
        tint.setActing(null);
        return;
      case 'damage': {
        tint.touch(event.targetId);
        const c = state?.combatants[event.targetId];
        // Protect: "a blue magical shield appears" when a physical hit lands (both games, §2/§3).
        if (event.amount > 0 && action?.physical && c?.statuses['protect'] && figureLookOf(game, 'protect')?.shieldOnPhysicalHit) {
          marks.shield(event.targetId);
        }
        return;
      }
      case 'ko':
        tint.touch(event.targetId, true);
        return;
      case 'status-add':
      case 'status-remove':
      case 'miss':
      case 'heal':
        tint.touch(event.targetId);
        return;
      default:
        return;
    }
  }

  function frame(): void {
    const el = hudEl;
    if (!el || !visible) return;
    const isPhone = phone();
    const stage = el.querySelector<HTMLElement>(game === 'ffx' ? '.ffxhud__stage' : '.ffx2hud__stage');
    // Viewport-px pieces (the line, the forecast, the phone tags) scale with the stage: 1 at 1600x900.
    // Reads first, writes after, and a write only when the value changed (no layout thrash per frame).
    const stageRect = stage ? rects.of(stage) : null;
    const scale = (isPhone ? 0.72 : Math.max(0.5, (stageRect?.width ?? 1600) / 1600)).toFixed(3);
    if (scale !== lastScale) {
      lastScale = scale;
      el.style.setProperty('--st-scale', scale);
      message.el.style.setProperty('--st-scale', scale);
    }
    // The guide card's cure hint, while a decision is open.
    hint.update(partyHints(game, state), decision !== null, isPhone ? el : stage, el.querySelector<HTMLElement>('.sgd'), isPhone);
    // The aimed target's icons and tags; FFX's Zombie forecast.
    tags.update(el, state, decision ? aimed : []);
    if (rails) {
      rails.aim(state, decision?.actorId ?? null, decision?.highlighted ?? null, decision ? aimed : []);
      rails.update(el, (id) => field()?.projectRect?.(id) ?? null, isPhone, rects.of(el));
    }
    placeMessage(el, stageRect, isPhone);
  }

  function placeMessage(el: HTMLElement, s: DOMRect | null, isPhone: boolean): void {
    if (message.el.hidden || !s) return;
    // Re-place when the line changes, then five times a second (the panels it keeps under move
    // rarely); every frame cost two forced layouts.
    const now = performance.now();
    if (message.text === placedText && now - placedAt < 200) return;
    placedText = message.text;
    placedAt = now;
    const host = rects.of(rootEl ?? el);
    const hud = rects.of(el);
    const scale = s.width / 640 || 1;
    const w = message.el.offsetWidth;
    const h = message.el.offsetHeight;
    let left = s.left + s.width / 2 - w / 2;
    let top: number;
    if (isPhone) {
      left = hud.left + hud.width / 2 - w / 2;
      // The approved phone frames: FFX under the top rail and its intent card, FFX-2 over the cards.
      const intent = game === 'ffx' ? [...el.querySelectorAll<HTMLElement>(PHONE_TOP[game])].map((b) => b.getBoundingClientRect()).filter((b) => b.height > 0) : [];
      const cards = el.querySelector<HTMLElement>('.ig-stat-list')?.getBoundingClientRect();
      if (intent.length) top = Math.max(...intent.map((b) => b.bottom)) + 6;
      else {
        // Over the cards and over any chip parked on them (FFX-2's WAIT chip), never on it.
        const floor = [cards, el.querySelector<HTMLElement>('.ffx2-atbmode:not([hidden])')?.getBoundingClientRect()]
          .filter((b): b is DOMRect => !!b && b.height > 0).map((b) => b.top);
        top = floor.length ? Math.min(...floor) - h - 8 : hud.top + hud.height * 0.5;
      }
    } else {
      const avoid: Box[] = [...el.querySelectorAll<HTMLElement>(MSG_AVOID[game])].map((b) => b.getBoundingClientRect());
      top = lineTop(s.top + MSG_TOP[game] * scale, left, left + w, h, avoid, 4 * scale);
    }
    const l = `${(left - host.left).toFixed(1)}px`;
    const t = `${(top - host.top).toFixed(1)}px`;
    if (message.el.style.left !== l) message.el.style.left = l;
    if (message.el.style.top !== t) message.el.style.top = t;
  }

  const api: StatusLooksApi = { marks, tint, message, hint, rails, aimed: () => aimed };
  (hud as T & { statusLooks?: StatusLooksApi }).statusLooks = api;
  return hud;
}
