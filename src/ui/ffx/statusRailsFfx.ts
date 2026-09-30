/**
 * Status display O3 for **FFX** (Bailey's pick, 2026-09-29): the guard rail for the mistake that
 * started the round — a Hi-Potion aimed at the Zombie Kimahri ("Hi potion killed kimahri instead
 * of healing", Bailey's friend, Chapter I).
 *
 * While a restorative (or a revival) is aimed at a living Zombie ally, three marks say what it will
 * do, as in the approved `docs/concepts/status-display-0929/options/o3-ffx-*.jpg`:
 *  - a red forecast beside the figure: "HI-POTION ON A ZOMBIE  −1000 KO";
 *  - the help slab turns into a red warning: "Kimahri is a Zombie. A Hi-Potion hurts him for 1000,
 *    and he has 840 HP left: it would KO him.";
 *  - the item row carries "✕ HURTS".
 * (The fourth mark, the ZOMBIE tag on the target's name plate, is the plate's own note,
 * `zombieTargetNote.ts` drawn as a tag by `targetCursorParts.ts` `noteHtml`.)
 *
 * **Every number is the engine's own** (AGENTS.md rules 3 and 6): `simulateFFXCommand`, the
 * engine's real resolve path on a copy of this exact board (fb-0929-hipotion), never a number made
 * up here. The rule itself is FFX's: "All HP-restoring effects damage instead. Life/Full-Life/
 * Phoenix Down/Mega Phoenix instantly kill a living Zombie" (`research/ffx-combat-core.md` §4.2).
 * **FFX only**: FFX-2 has no Zombie (`FFX2StatusId`). Presentation only (rule 1): the preview runs
 * on a clone; nothing here writes the engine's state.
 */

import type { AvailableCommand, BattleState, Command, CombatantId } from '../../battle/common/types.ts';
import { simulateFFXCommand } from '../../battle/ffx/simulate.ts';
import { escapeHtml, pronounsOf } from '../common/statusWords.ts';

export interface ZombieForecast {
  id: CombatantId;
  name: string;
  /** HP the command takes off (the engine's own amount), 0 for an outright KO by a revival. */
  amount: number;
  kills: boolean;
  hp: number;
}

/** Is this combatant a living Zombie on the party's side? */
export function isLivingZombieAlly(c: BattleState['combatants'][string] | undefined): boolean {
  return !!c && c.side !== 'enemy' && c.alive && !c.removed && !!(c.statuses as Record<string, unknown>)['zombie'];
}

/**
 * What `cmd` from `actorId` would do to every living Zombie ally in `targets`, when it hurts: the
 * engine's preview (`roll: 'mid'`). Empty when no target is a Zombie, or the command does it no harm.
 */
export function zombieForecasts(
  state: BattleState | null,
  actorId: CombatantId | null,
  cmd: AvailableCommand | null,
  targets: readonly CombatantId[],
): ZombieForecast[] {
  if (!state || state.game !== 'ffx' || !actorId || !cmd || targets.length === 0) return [];
  const zombies = targets.filter((id) => isLivingZombieAlly(state.combatants[id]));
  if (zombies.length === 0) return [];
  let out: ReturnType<typeof simulateFFXCommand> = null;
  try {
    out = simulateFFXCommand(state, actorId, { ...cmd.command, targets: [...targets] } as Command, { roll: 'mid' });
  } catch {
    out = null;
  }
  if (!out || out.rejected) return [];
  const result: ZombieForecast[] = [];
  for (const id of zombies) {
    const c = state.combatants[id]!;
    // The blow's own amount (a Hi-Potion's 1000 even past the HP it finds), else the HP it took.
    let dealt = 0;
    for (const e of out.events) if (e.type === 'damage' && e.targetId === id && e.amount > 0) dealt += e.amount;
    const amount = Math.max(dealt, out.hpDelta[id] ?? 0);
    const kills = out.kills.includes(id);
    if (amount <= 0 && !kills) continue;
    result.push({ id, name: c.name, amount, kills, hp: c.hp });
  }
  return result;
}

/** "A Hi-Potion", "An X-Potion", "An Elixir". */
function withArticle(label: string): string {
  return `${/^[AEIOU]/i.test(label) ? 'An' : 'A'} ${label}`;
}

/** The red help-slab warning (desktop) or the phone card's shorter one. Pure. */
export function zombieWarningHtml(f: ZombieForecast, cmd: AvailableCommand, phone = false): string {
  const p = pronounsOf(f.id);
  const n = escapeHtml(f.name);
  const what = withArticle(escapeHtml(cmd.label));
  const about = cmd.category === 'item' ? '' : 'about ';
  const lead = `<b>${n} is a Zombie.</b>`;
  if (f.amount <= 0) return `${lead} ${what} would KO ${p.them} outright.`;
  if (f.kills) {
    return phone
      ? `${lead} ${what} hurts ${p.them} for ${about}${f.amount}; at ${f.hp} HP it would KO ${p.them}.`
      : `${lead} ${what} hurts ${p.them} for ${about}${f.amount}, and ${p.they} has ${f.hp} HP left: it would KO ${p.them}.`;
  }
  return `${lead} ${what} hurts ${p.them} for ${about}${f.amount} instead of healing.`;
}

/** The forecast over the figure: caption, the number, KO. Pure. */
export function forecastHtml(f: ZombieForecast, cmd: AvailableCommand, phone = false): string {
  const caption = phone ? escapeHtml(cmd.label.toUpperCase()) : `${escapeHtml(cmd.label.toUpperCase())} ON A ZOMBIE`;
  const num = f.amount > 0 ? `−${f.amount}` : '';
  const ko = f.kills ? `<em>KO</em>` : '';
  return `<small>${caption}</small><span class="stfore__n">${num}</span>${num ? ' ' : ''}${ko}`;
}

type RectOf = (id: CombatantId) => { x: number; y: number; w: number; h: number } | null;

/** Draws the forecasts, the red slab and the HURTS tag from the aim, per frame. FFX only. */
export class FfxStatusRails {
  private readonly layer: HTMLElement;
  private readonly fore = new Map<CombatantId, HTMLElement>();
  private key = '';
  private forecasts: ZombieForecast[] = [];
  private cmd: AvailableCommand | null = null;
  /** The slab, the HURTS tag or a forecast was drawn last frame (so the next one clears them). */
  private drawn = false;

  constructor() {
    this.layer = document.createElement('div');
    this.layer.className = 'stfore-layer';
    this.layer.dataset['role'] = 'status-forecast';
  }

  /** Recompute when the aim, the command or the board changed. Cheap otherwise. */
  aim(state: BattleState | null, actorId: CombatantId | null, cmd: AvailableCommand | null, targets: readonly CombatantId[]): void {
    const key = `${actorId}|${cmd?.command.kind}:${(cmd?.command as { id?: string } | undefined)?.id ?? cmd?.label}|${targets.join(',')}|${state?.turn}|${targets.map((t) => state?.combatants[t]?.hp).join(',')}`;
    if (key === this.key) return;
    this.key = key;
    this.cmd = cmd;
    this.forecasts = zombieForecasts(state, actorId, cmd, targets);
  }

  /** The forecasts up now (tests, the debug snapshot). */
  get current(): readonly ZombieForecast[] {
    return this.forecasts;
  }

  update(hud: HTMLElement | null, rectOf: RectOf, phone: boolean, hudRect?: DOMRect): void {
    if (!hud) return;
    if (this.layer.parentElement !== hud) hud.appendChild(this.layer);
    const cmd = this.cmd;
    // Nothing up and nothing drawn: no reads, no writes this frame.
    if ((!cmd || this.forecasts.length === 0) && this.fore.size === 0 && !this.drawn) return;
    this.drawn = !!cmd && this.forecasts.length > 0;
    const live = new Set<CombatantId>();
    const host = hudRect ?? hud.getBoundingClientRect();
    for (const f of cmd ? this.forecasts : []) {
      const r = rectOf(f.id);
      if (!r) continue;
      live.add(f.id);
      let el = this.fore.get(f.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'stfore';
        el.dataset['actor'] = f.id;
        this.layer.appendChild(el);
        this.fore.set(f.id, el);
      }
      const html = forecastHtml(f, cmd!, phone);
      if (el.dataset['html'] !== html) {
        el.dataset['html'] = html;
        el.innerHTML = html;
      }
      el.classList.toggle('stfore--phone', phone);
      const left = `${(r.x + r.w + (phone ? 2 : 6) - host.left).toFixed(1)}px`;
      const top = `${(r.y + r.h * (phone ? 0.12 : 0.27) - host.top).toFixed(1)}px`;
      if (el.style.left !== left) el.style.left = left;
      if (el.style.top !== top) el.style.top = top;
    }
    for (const [id, el] of [...this.fore]) {
      if (live.has(id)) continue;
      el.remove();
      this.fore.delete(id);
    }
    this.slab(hud, phone);
    this.hurts(hud);
  }

  /** The help slab as a red warning while a forecast is up. */
  private slab(hud: HTMLElement, phone: boolean): void {
    const info = hud.querySelector<HTMLElement>('.ffx-cmd-info');
    const f = this.forecasts[0];
    const html = f && this.cmd ? zombieWarningHtml(f, this.cmd, phone) : '';
    // Phone: the confirm button wears the red rim while it would hurt (the approved phone frame).
    hud.querySelector<HTMLElement>('.phud-target__go')?.classList.toggle('stwarn-go', html !== '');
    for (const el of [info, hud.querySelector<HTMLElement>('.phud-card')]) {
      if (!el) continue;
      let warn = el.querySelector<HTMLElement>(':scope > .stwarn');
      el.classList.toggle('stwarn-on', html !== '');
      if (!html) {
        warn?.remove();
        continue;
      }
      if (!warn) {
        warn = document.createElement('div');
        warn.className = 'stwarn';
        el.appendChild(warn);
      }
      if (warn.dataset['html'] !== html) {
        warn.dataset['html'] = html;
        warn.innerHTML = html;
      }
    }
  }

  /** "✕ HURTS" on the highlighted row while its forecast is up. */
  private hurts(hud: HTMLElement): void {
    const on = this.forecasts.length > 0 && this.cmd !== null;
    const row = on ? hud.querySelector<HTMLElement>('.ffx-cmd-area .ig-cmd--selected') : null;
    for (const tag of hud.querySelectorAll<HTMLElement>('.sthurts')) if (tag.parentElement !== row) tag.remove();
    if (row && !row.querySelector('.sthurts')) row.insertAdjacentHTML('beforeend', '<span class="sthurts"><span><i>✕</i>HURTS</span></span>');
  }

  clear(): void {
    this.forecasts = [];
    for (const el of document.querySelectorAll('.stwarn-go')) el.classList.remove('stwarn-go');
    this.key = '';
    this.cmd = null;
  }

  dispose(): void {
    this.clear();
    for (const el of this.fore.values()) el.remove();
    this.fore.clear();
    this.layer.remove();
  }
}
