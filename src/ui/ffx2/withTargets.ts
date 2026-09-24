/**
 * Fill a chosen FFX-2 command's `targets`. Split out of `CommandMenu.ts` so
 * that file stays within the 400-line house rule's growth limit (it is over
 * already and must not grow; DEV.md "House rules").
 */
import type { Command, CombatantId } from '../../battle/common/types.ts';

/** Every variant of {@link Command} carries a `targets` array; fill it in without an `as any`. */
export function withTargets(command: Command, targets: CombatantId[]): Command {
  switch (command.kind) {
    case 'attack':
    case 'ability':
    case 'item':
    case 'overdrive':
    case 'trigger':
      return { ...command, targets };
    case 'summon':
    case 'dismiss':
    case 'switch':
    case 'spherechange':
    case 'escape':
    case 'defend':
      return { ...command, targets: [] };
  }
}
