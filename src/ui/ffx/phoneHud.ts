/**
 * FFX's half of the phone battle HUD, option B "compact rail" (Bailey,
 * 2026-09-25; `src/ui/common/phoneBattle.ts` has the shared half and the
 * sources). Game case: **FFX only** — the CTB order on the rail, the Sensor
 * card as the target card, the Overdrive bar on every chip.
 */

import './phone-hud.css';
import './phone-hud-parts.css';
import { installPhoneBattle, readGroup, textOf, type PhoneBattle, type PhoneBattleText } from '../common/phoneBattle.ts';
import type { PhoneField } from '../common/phoneFraming.ts';

/** The live target: the one bracket the cursor has not dimmed. */
function liveTarget(hud: HTMLElement): HTMLElement | null {
  return hud.querySelector<HTMLElement>('.ffx-targeting .ffx-target[data-target-id]:not(.ffx-target--dim)');
}

/** What the FFX chrome prints, read from the FFX HUD's own DOM. */
export function readFfxPhone(hud: HTMLElement): PhoneBattleText {
  const live = liveTarget(hud);
  const group = readGroup(hud);
  const targeting = group.on || !!hud.querySelector('.ffx-targeting [data-target-id]');
  const id = live?.dataset['targetId'] ?? '';
  const ally = group.on ? group.ally : !!live && !live.classList.contains('ffx-target--enemy');
  const all = textOf(hud, '.ffx-targeting .ffx-target__all span');
  const plate = textOf(hud, '.ffx-targeting .ffx-target__plate .ffx-target__name');
  const esc = id.replace(/"/g, '');
  const row = id ? hud.querySelector<HTMLElement>(`.ig-stat[data-actor="${esc}"]`) : null;
  const tile = id ? hud.querySelector<HTMLImageElement>(`.ig-ctb__row[data-actor="${esc}"] img`) : null;
  const face = row?.querySelector<HTMLImageElement>('.ig-stat__face img') ?? tile;
  const sensorEl = hud.querySelector<HTMLElement>('.ffx-sensor');
  const sensorName = sensorEl && !sensorEl.hidden ? textOf(sensorEl, '.ffx-sensor__name') : '';
  const target = group.on ? group.name : all || plate;
  let targetHp = '';
  if (row) targetHp = `HP ${textOf(row, '.ig-stat__value:not(.ig-stat__value--mp)').replace(/\s*\/\s*/, ' / ')}`;
  else if (sensorName && sensorName === target) targetHp = textOf(sensorEl!, '.ffx-sensor__hp').replace(/^HP\s*/, 'HP ');
  const info = hud.querySelector<HTMLElement>('.ffx-cmd-info');
  return {
    actor: textOf(hud, '.ig-stat--acting .ig-stat__name'),
    help: info && !info.hidden ? textOf(info, '[data-role="text"]') : '',
    command: textOf(hud, '.ffx-cmd-area .ig-cmd--selected .ffx-cmd__label'),
    target,
    targetHp,
    targetFace: face?.getAttribute('src') ?? '',
    targeting,
    ally: targeting && ally,
    sensor: !!sensorName && sensorName === target && !ally,
    group: group.on,
  };
}

/** The phone layout on a mounted FFX battle HUD (`.ffxhud`). */
export function installFfxPhoneHud(hud: HTMLElement, field?: PhoneField): PhoneBattle {
  // FFX's command window pages by its cursor (six rows at a time): a drag on it steps the cursor.
  return installPhoneBattle(hud, 'ffx', readFfxPhone, { field, dragList: '.ffx-cmd-area' });
}
