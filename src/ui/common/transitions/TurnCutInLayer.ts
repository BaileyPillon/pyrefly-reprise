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
 * Case: **both games**; FFX-2 slams in from the right with its pink accent
 * (the spec's "Not mocked yet: cut-ins from the right").
 */

import { showTurnCutIn } from '../../inkgold/cutin.ts';
import { manifestKnowsAssetNow } from '../../../engine/ArtManifest.ts';
import { artUrl } from '../../../engine/PaintedArt.ts';

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
const CONFIRM_KEYS = new Set(['Enter', ' ', 'z', 'Z']);

/** The tall portrait: FFX-2's own likeness first, then the shared one. */
function portraitFor(actorId: string, game: 'ffx' | 'ffx2'): string {
  const ids = game === 'ffx2' ? [`${actorId}-x2`, actorId] : [actorId];
  for (const id of ids) {
    const url = artUrl(`art/portraits/${id}.png`);
    if (manifestKnowsAssetNow(url) !== false) return url;
  }
  return artUrl(`art/portraits/${actorId}.png`);
}

/** Show the cut-in inside `host`; resolves once it has left the screen. */
export async function playTurnCutIn(host: HTMLElement, req: TurnCutInRequest): Promise<void> {
  const doc = host.ownerDocument;
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
  void veil.getBoundingClientRect();
  veil.style.opacity = '1';

  const handle = showTurnCutIn(frame, {
    name: req.name,
    portraitUrl: portraitFor(req.actorId, req.game),
    ctbLabel: req.label,
    side: req.side,
  });

  await new Promise<void>((resolve) => {
    const win = doc.defaultView ?? window;
    const done = (): void => {
      win.clearTimeout(timer);
      win.removeEventListener('keydown', onKey, true);
      resolve();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (CONFIRM_KEYS.has(e.key)) done();
    };
    // 180 ms entrance (cutin.ts SLAM_MS) plus the hold.
    const timer = win.setTimeout(done, 180 + Math.max(0, req.holdMs));
    win.addEventListener('keydown', onKey, true);
  });
  veil.style.opacity = '0';
  await handle.dismiss();
  layer.remove();
}
