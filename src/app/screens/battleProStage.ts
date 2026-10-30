/**
 * Mounting the PRO STAGING layer in a battle screen (lane "pro-staging"; the switch, the four pieces and the game case are in `engine/pro/staging/StagingSwitch.ts`). Kept out of `BattleScreen.ts` (which is far
 * over its line budget) so the screen's edits are three lines: it is built once as the field is staged, ticked from the screen's `update`, handed to the presenter as `deps.staging` and disposed with the screen.
 *
 * Only in a demo chapter (Chapter I, Chapter IV) and only when the address turns it on (`?staging=pro`, or `?pack=demo` without `?staging=today`; the playtest switchboard can also flip it, so a build that has the
 * board mounts it with the switch at today's and the presenter's cues stay no-ops until it is flipped). Everywhere else: nothing is built, nothing is drawn, no element is added.
 */
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { isTreatedChapter, demoGameOf } from '../../engine/motion/DemoGate.ts';
import { stagingMode } from '../../engine/pro/staging/StagingSwitch.ts';
import { ProStageLayer } from '../../ui/common/proStage/ProStageLayer.ts';
import { switchboardWanted } from '../demo/switchboard.ts';

export function attachProStage(o: { root: HTMLElement; chapterId: string; stage: PaintedStage; nameOf?: (id: string) => string | undefined }): ProStageLayer | null {
  if (!isTreatedChapter(o.chapterId)) return null;
  const search = typeof location === 'undefined' ? '' : (location.search ?? '');
  if (stagingMode() !== 'pro' && !switchboardWanted(search)) return null;
  return new ProStageLayer({
    root: o.root,
    game: demoGameOf(o.chapterId),
    rectOf: (id) => {
      const r = o.stage.projectRect(id);
      return r ? { x: r.x, y: r.y, w: r.w, h: r.h } : null;
    },
    pointOf: (id, anchor) => o.stage.project(id, anchor),
    ...(o.nameOf ? { nameOf: o.nameOf } : {}),
  });
}
