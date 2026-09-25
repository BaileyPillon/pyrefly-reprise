/**
 * FFX-2's half of the phone battle HUD, option B "compact rail" (Bailey,
 * 2026-09-25; `src/ui/common/phoneBattle.ts` has the shared half and the
 * sources). Game case: **FFX-2 only** — no turn-order list (FFX-2 has none,
 * `research/ffx-vs-ffx2-presentation.md` §4.2 and §9 row 3): the boss gauge
 * takes the rail and each girl's ATB rides on her chip; pink accent.
 */

import './phone-hud.css';
import { installPhoneBattle, textOf, type PhoneBattle, type PhoneBattleText } from '../common/phoneBattle.ts';

/** What the FFX-2 chrome prints, read from the FFX-2 HUD's own DOM. */
export function readFfx2Phone(hud: HTMLElement): PhoneBattleText {
  const live = hud.querySelector<HTMLElement>('.ffx-targeting .ffx-target[data-target-id]:not(.ffx-target--dim)');
  const targeting = !!hud.querySelector('.ffx-targeting [data-target-id]');
  const id = (live?.dataset['targetId'] ?? '').replace(/"/g, '');
  const ally = !!live && !live.classList.contains('ffx-target--enemy');
  const row = id ? hud.querySelector<HTMLElement>(`.ig-stat[data-actor-id="${id}"]`) : null;
  const face = row?.querySelector<HTMLImageElement>('.ffx2stat__face-img:not([data-face-body])') ?? null;
  const all = textOf(hud, '.ffx-targeting .ffx-target__all span');
  const target = all || textOf(hud, '.ffx2-tplate__name') || textOf(hud, '.ffx-targeting .ffx-target__plate .ffx-target__name');
  const hp = row ? textOf(row, '.ig-stat__value:not(.ig-stat__value--mp)').replace(/\s*\/\s*/, ' / ') : '';
  return {
    actor: textOf(hud, '.ig-stat--acting .ig-stat__name'),
    help: textOf(hud, '.ffx2-cmd-info__desc'),
    command: textOf(hud, '.ffx2hud__command .ig-cmd--selected .ffx2cmd__label') || textOf(hud, '.ffx2-cmd-info__label'),
    target,
    targetHp: hp ? `HP ${hp}` : '',
    targetFace: face?.getAttribute('src') ?? '',
    targeting,
    ally: targeting && ally,
    sensor: false,
  };
}

/** The phone layout on a mounted FFX-2 battle HUD (`.ffx2hud`). */
export function installFfx2PhoneHud(hud: HTMLElement): PhoneBattle {
  return installPhoneBattle(hud, 'ffx2', readFfx2Phone);
}
