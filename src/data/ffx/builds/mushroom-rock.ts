/**
 * PLACEHOLDER-GUI: scaffold only. The party and Seymour's guest row for Mushroom Rock Road; replaced by the real build from the research and
 * the reverse-engineering note. Today it is Macalania's party with Auron lent as a stand-in guest, so the chapter compiles and plays.
 */
import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { macalaniaBuild } from './macalania.ts';

function build(): FFXPartyBuild {
  const b = structuredClone(macalaniaBuild);
  b.activeSlots = ['tidus', 'yuna', 'auron'];
  b.reserve = b.reserve.filter((id) => id !== 'auron');
  const auron = b.members.find((m) => m.id === 'auron');
  if (auron) auron.guest = { control: 'ai' };
  return b;
}

export const mushroomRockBuild: FFXPartyBuild = build();
export default mushroomRockBuild;
