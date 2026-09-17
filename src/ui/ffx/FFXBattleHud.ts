import './ffx-hud.css';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../battle/common/types.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { installInkGoldStyles } from '../inkgold/index.ts';
import { CommandMenu } from './CommandMenu.ts';
import { CtbList } from './CtbList.ts';
import { DamageNumbers, type Projector } from './DamageNumbers.ts';
import { openMinigame as dispatchMinigame } from './minigames/index.ts';
import { PartyStatusWindow } from './PartyStatusWindow.ts';
import { SensorPanel } from './SensorPanel.ts';
import { TelegraphBanner } from './TelegraphBanner.ts';
import { TriggerPrompt } from './TriggerPrompt.ts';

/**
 * The real FFX battle HUD: CTB queue, command stack, party status, telegraph
 * banner, sensor panel and damage numerals, composed from the shared Ink &
 * Gold presentation layer (`src/ui/inkgold/`, Direction A approved
 * 2026-09-15) instead of the retired blue-glass FFX window chrome. Still
 * authored on the 640x360 grid and letterbox-scaled like `HudMock` (which
 * stays as a static art-direction reference per its own header comment, and
 * predates this restyle).
 */
export class FFXBattleHud implements HudPort {
  readonly el: HTMLElement;
  private readonly stage: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly bannerEl: HTMLElement;
  private readonly infoEl: HTMLElement;

  private readonly ctbList = new CtbList();
  private readonly partyStatus = new PartyStatusWindow();
  private readonly commandMenu = new CommandMenu();
  private readonly telegraph = new TelegraphBanner();
  private readonly sensorPanel = new SensorPanel();
  private readonly damageNumbers = new DamageNumbers();
  private readonly triggerPrompt = new TriggerPrompt();

  private lastState: BattleState | null = null;
  /** Whoever's `turn-start`/`action-start` fired most recently, for the message banner's name slab. `message` events carry no actor of their own. */
  private currentActorId: CombatantId | null = null;
  private mounted = false;
  private readonly onResize = (): void => this.layout();

  constructor() {
    installInkGoldStyles();

    this.el = document.createElement('div');
    this.el.className = 'ffxhud ig';
    this.el.dataset['role'] = 'ffx-battle-hud';

    this.stage = document.createElement('div');
    this.stage.className = 'ffxhud__stage';
    this.overlay = document.createElement('div');
    this.overlay.className = 'ffxhud__overlay';

    this.bannerEl = document.createElement('div');
    this.bannerEl.className = 'ig-banner';
    this.bannerEl.hidden = true;
    this.bannerEl.innerHTML = `
      <span class="ig-banner__name" data-role="name"></span>
      <span class="ig-banner__chip" data-role="chip"></span>
    `;

    // Command stack, its breadcrumb (shown one level down, e.g. "MAGIC") and
    // the selected row's description all anchor together bottom-up, so the
    // description and breadcrumb float above the stack regardless of how
    // many rows it currently holds (`column-reverse`: the first DOM child —
    // the stack — sits at the anchored bottom edge).
    const cmdArea = document.createElement('div');
    cmdArea.className = 'ffx-cmd-area';
    this.infoEl = document.createElement('div');
    this.infoEl.className = 'ig-cutin__info ffx-cmd-info';
    this.infoEl.hidden = true;
    this.infoEl.innerHTML = `<div class="ig-cutin__info-desc" data-role="text"></div>`;
    cmdArea.append(this.commandMenu.stackEl, this.infoEl, this.commandMenu.breadcrumbEl);

    this.stage.append(
      this.bannerEl,
      this.ctbList.el,
      cmdArea,
      this.triggerPrompt.el,
      this.partyStatus.el,
      this.sensorPanel.el,
      this.telegraph.el,
      this.telegraph.borderEl,
    );
    this.overlay.append(this.commandMenu.targetCursor.el, this.damageNumbers.el);

    // A CTB tile doubles as a click target while aiming: routes through the
    // same confirm path as the reticle and Enter, and is a no-op — returns
    // `false`, nothing happens — outside targeting or for a non-candidate id.
    this.ctbList.el.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-actor]');
      const id = row?.dataset['actor'];
      if (id) this.commandMenu.tryConfirmTargetById(id);
    });

    const surface = document.createElement('div');
    surface.className = 'ig-surface';
    surface.innerHTML = '<div class="ig-surface__grain"></div><div class="ig-surface__vignette"></div>';

    this.el.append(this.stage, this.overlay, surface);
  }

  // -------------------------------------------------------------- HudPort

  mount(root: HTMLElement): void {
    if (this.mounted) return;
    root.appendChild(this.el);
    this.mounted = true;
    this.layout();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('resize', this.onResize);
    this.damageNumbers.clear();
    this.telegraph.dispose();
    this.el.remove();
    this.mounted = false;
  }

  sync(state: BattleState, preview: TurnPreview[] | AtbSnapshot): void {
    this.lastState = state;
    if (Array.isArray(preview)) this.ctbList.render(preview, state.combatants);
    const actingId = state.log.length ? findLastActorId(state.log) : null;
    this.partyStatus.render(state.activeIds, state.combatants, actingId);
  }

  async chooseCommand(
    actorId: CombatantId,
    commands: AvailableCommand[],
    previewRank: (cmd: AvailableCommand | null) => TurnPreview[] | AtbSnapshot,
  ): Promise<Command> {
    const combatants = this.lastState?.combatants ?? {};
    const wrapped = (cmd: AvailableCommand | null): TurnPreview[] | AtbSnapshot => {
      const result = previewRank(cmd);
      if (Array.isArray(result) && this.lastState) this.ctbList.render(result, this.lastState.combatants);
      return result;
    };

    const triggerOnly = commands.length > 0 && commands.every((c) => c.command.kind === 'trigger');
    if (triggerOnly) return this.triggerPrompt.open(commands, combatants);

    return this.commandMenu.open({ actorId, commands, previewRank: wrapped, combatants, setHelp: (t) => this.setHelp(t) });
  }

  onEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'action-start':
        this.currentActorId = event.actorId;
        // An action resolving means the decision has been made — by the
        // player, or by a strategy that raced the menu's promise and won
        // (`BattlePresenter.chooseCommand`). Either way the command stack and
        // its help line must not sit over the action.
        this.commandMenu.suspend();
        return;
      case 'turn-start':
        this.currentActorId = event.actorId;
        return;
      case 'message':
        this.setMessage(event.text);
        return;
      case 'charge':
        this.telegraph.show(this.nameOf(event.enemyId), event.name, event.stage);
        return;
      case 'sensor': {
        const target = this.lastState?.combatants[event.targetId];
        if (target) this.sensorPanel.show(target);
        return;
      }
      case 'damage':
      case 'heal':
      case 'miss':
      case 'mp-damage':
      case 'mp-heal':
        this.damageNumbers.spawn(event);
        return;
      case 'action-end':
        this.telegraph.clearBorder();
        return;
      default:
        return;
    }
  }

  openMinigame(kind: MinigameKind, params: Record<string, unknown>): Promise<MinigameResult> {
    // Mounted into the scaled 640x360 stage (not `this.el`, the raw
    // viewport-sized root) so `.ig-minigame`'s spec pixel geometry lands at
    // the same scale as the rest of the HUD instead of rendering pinned to
    // the real top-left corner.
    return dispatchMinigame(this.stage, kind, params);
  }

  setVisible(visible: boolean): void {
    this.el.hidden = !visible;
    if (visible) this.layout();
  }

  /** Frame tick from `BattleScreen`, forwarded to the only thing here that animates itself. */
  update(dt: number): void {
    this.damageNumbers.update(dt);
  }

  setProjector(project: Projector): void {
    const p: Projector = project;
    this.commandMenu.setProjector(p);
    this.damageNumbers.setProjector(p);
    this.damageNumbers.setSideResolver((id) => {
      const side = this.lastState?.combatants[id]?.side;
      return side === 'party' || side === 'enemy' || side === 'aeon' ? side : null;
    });
  }

  // ------------------------------------------------------------------ misc

  /**
   * `.ig-banner`: the acting character's name in serif italic (tracked from
   * `turn-start`/`action-start`, never parsed out of the message text — a
   * `message` event carries only `text` and `kind`, and its text is free-form
   * per `AbilityDef.messageTemplate` (`"<user> uses <ability>"` for an
   * ability, but "Critical hit!", "Mix failed!" and other system/story
   * copy lead with neither a name nor even necessarily a space). The full
   * text always goes in the chip; the one cosmetic step is trimming an exact
   * `"<name> "` prefix when the text happens to restate the tracked actor's
   * name, so "Tidus uses Cure" doesn't read "Tidus / Tidus uses Cure".
   */
  private setMessage(text: string): void {
    const nameEl = this.bannerEl.querySelector<HTMLElement>('[data-role="name"]')!;
    const chipEl = this.bannerEl.querySelector<HTMLElement>('[data-role="chip"]')!;
    const name = this.currentActorId ? this.nameOf(this.currentActorId) : '';
    const chipText = name && text.startsWith(`${name} `) ? text.slice(name.length + 1) : text;
    nameEl.textContent = name;
    nameEl.hidden = !name;
    chipEl.textContent = chipText;
    chipEl.hidden = chipText.length === 0;
    this.bannerEl.hidden = false;
  }

  /** `.ig-cutin__info`: the highlighted command's help/description text. */
  private setHelp(text: string): void {
    this.infoEl.hidden = !text;
    if (text) this.infoEl.querySelector('[data-role="text"]')!.textContent = text;
  }

  private nameOf(id: CombatantId): string {
    return this.lastState?.combatants[id]?.name ?? id;
  }

  /** Letterbox the 640x360 grid into whatever the viewport is, exactly as `HudMock`. */
  private layout(): void {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const scale = Math.min(w / 640, h / 360);
    const x = (w - 640 * scale) / 2;
    const y = (h - 360 * scale) / 2;
    this.stage.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }
}

function findLastActorId(log: BattleState['log']): CombatantId | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (e.type === 'turn-start' || e.type === 'action-start') return e.actorId;
  }
  return null;
}
