/**
 * The DOM half of the turn cut-in (PR-0005): mounts `ui/inkgold/cutin.ts`'s
 * approved slab over the field, holds it, takes it away.
 *
 * `showTurnCutIn` is authored on the HUD's 640x360 logical grid (tokens.css,
 * "AUTHORING CONVENTION"), so this layer builds that frame itself and
 * letterbox-scales it onto the host exactly as the HUD does
 * (`scale = min(w/640, h/360)`). The spec's *"backdrop dimmed to .55"* is the
 * veil under it (the 7 px blur is left out: a full-frame backdrop-filter over
 * the WebGL canvas costs frames on the phones this ships to).
 *
 * The presenter (`engine/TurnCutIn.ts`) awaits {@link playTurnCutIn} before it
 * opens the command menu, so the slab is gone before any menu row exists.
 * A Confirm press (Enter, Space or Z, the game's confirm keys) ends the hold
 * early; the key is not swallowed, and no menu is open yet to receive it.
 *
 * Case: **both games**; FFX-2 takes its pink accent (`.ig--ffx2`). Both slam
 * in from the left, as the one approved picture does (see `engine/TurnCutIn.ts`).
 *
 * PR-0005 option B (FFX only, `docs/concepts/layout/pr-0005-ffx/README.md`,
 * Bailey's D-042): this layer is a child of `MomentOverlay`'s `.pf-mom`
 * (`transitions.css`, `z-index: 36`), so for as long as it is mounted here it
 * covers the FFX command cascade the HUD draws underneath
 * (`ffx-hud.css`'s `.ffxhud__stage` has no `z-index` of its own). Rather than
 * raise the whole stage above every other moment `.pf-mom` ever shows — the
 * fix `targetChipClear.ts` rejected for the same reason, a real regression to
 * everything else the stage draws — this toggles a modifier class on the FFX
 * HUD root (`data-role="ffx-battle-hud"`, `FFXBattleHud.ts`) for exactly the
 * cut-in's own lifetime, so `ffx-hud.css` can promote just the stage, and
 * only while nothing else competes for that space (the cut-in never plays
 * alongside a reveal, Overdrive or telegraph moment).
 */

import { showTurnCutIn } from '../../inkgold/cutin.ts';
import { manifestKnowsAssetNow } from '../../../engine/ArtManifest.ts';
import { artUrl } from '../../../engine/PaintedArt.ts';
import { confirmPress } from './confirmPress.ts';

export interface TurnCutInRequest {
  actorId: string;
  name: string;
  game: 'ffx' | 'ffx2';
  label: string;
  side: 'left' | 'right';
  holdMs: number;
}

const FRAME_W = 640;
const FRAME_H = 360;

/** The tall portrait: FFX-2's own likeness first, then the shared one. */
function portraitFor(actorId: string, game: 'ffx' | 'ffx2'): string {
  const ids = game === 'ffx2' ? [`${actorId}-x2`, actorId] : [actorId];
  for (const id of ids) {
    const url = artUrl(`art/portraits/${id}.png`);
    if (manifestKnowsAssetNow(url) !== false) return url;
  }
  return artUrl(`art/portraits/${actorId}.png`);
}

/** The FFX HUD's cut-in-below modifier — see the file header, PR-0005 B. */
const FFX_HUD_CUTIN_BELOW = 'ffxhud--cutin-below';

/** Show the cut-in inside `host`; resolves once it has left the screen. */
export async function playTurnCutIn(host: HTMLElement, req: TurnCutInRequest): Promise<void> {
  const doc = host.ownerDocument;
  // FFX only (PR-0005 B): the FFX-2 command menu is a different, unbuilt
  // mockup (`docs/concepts/layout/pr-0005-ffx/README.md`), so there is
  // nothing here to un-cover for `game === 'ffx2'`.
  const hudEl =
    req.game === 'ffx'
      ? (host.parentElement?.querySelector<HTMLElement>('[data-role="ffx-battle-hud"]') ?? null)
      : null;
  const layer = doc.createElement('div');
  layer.className = 'pf-cutin';
  layer.dataset['role'] = 'turn-cut-in';
  layer.dataset['actor'] = req.actorId;
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

  const veil = doc.createElement('div');
  veil.style.cssText =
    'position:absolute;inset:0;background:rgba(11,10,18,0.55);opacity:0;transition:opacity 140ms ease-out;';
  const frame = doc.createElement('div');
  frame.className = req.game === 'ffx2' ? 'ig ig--ffx2' : 'ig';
  const w = host.clientWidth || FRAME_W;
  const h = host.clientHeight || FRAME_H;
  const k = Math.min(w / FRAME_W, h / FRAME_H);
  frame.style.cssText =
    `position:absolute;left:${(w - FRAME_W * k) / 2}px;top:${(h - FRAME_H * k) / 2}px;` +
    `width:${FRAME_W}px;height:${FRAME_H}px;transform:scale(${k});transform-origin:0 0;`;
  layer.append(veil, frame);
  host.appendChild(layer);
  hudEl?.classList.add(FFX_HUD_CUTIN_BELOW);
  void veil.getBoundingClientRect();
  veil.style.opacity = '1';

  try {
    const handle = showTurnCutIn(frame, {
      name: req.name,
      portraitUrl: portraitFor(req.actorId, req.game),
      ctbLabel: req.label,
      side: req.side,
    });

    // 180 ms entrance (cutin.ts SLAM_MS) plus the hold, or a Confirm press.
    const win = doc.defaultView ?? window;
    const press = confirmPress(win);
    let timer = 0;
    await Promise.race([press.pressed, new Promise<void>((r) => (timer = win.setTimeout(r, 180 + Math.max(0, req.holdMs))))]);
    win.clearTimeout(timer);
    press.dispose();
    veil.style.opacity = '0';
    await handle.dismiss();
    layer.remove();
  } finally {
    hudEl?.classList.remove(FFX_HUD_CUTIN_BELOW);
  }
}
