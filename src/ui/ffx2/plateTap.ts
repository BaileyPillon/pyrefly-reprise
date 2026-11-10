/**
 * The plates of a Special form as tap targets while a target is being aimed (step D1 of the Special look; FFX-2 only in what is seen).
 *
 * The figure's own rectangle cannot tell the main and its two parts apart, so each plate in the party list (`[data-form-role]`, a row that exists only in a form) takes a tap. ONE
 * delegated `click` listener sits on the list; the command menu hands it a handler while a target cursor is live and takes it away again. With no handler a click does nothing: the
 * handler is the gate.
 *
 * Nothing here writes to the DOM, ever: no class, no attribute, no style. The menu sets the handler at every build in every FFX-2 fight, so a write would have changed the existing
 * markup with the switch OFF. The plates are tappable through CSS keyed on `[data-form-role]` alone.
 */

import type { CombatantId } from '../../battle/common/types.ts';

export class PlateTaps {
  private handler: ((id: CombatantId) => void) | null = null;
  private list: HTMLElement | null = null;
  private readonly onClick = (e: Event): void => {
    const plate = (e.target as Element | null)?.closest?.('[data-form-role]') as HTMLElement | null;
    const id = plate?.dataset['actorId'];
    if (id) this.handler?.(id);
  };

  /** One delegated click listener on the party list. */
  bind(list: HTMLElement): void {
    this.list?.removeEventListener('click', this.onClick);
    this.list = list;
    list.addEventListener('click', this.onClick);
  }

  /** The menu's handler while a target cursor is live, or `null`. Stores it and writes nothing. */
  set(handler: ((id: CombatantId) => void) | null): void {
    this.handler = handler;
  }

  dispose(): void {
    this.list?.removeEventListener('click', this.onClick);
    this.list = null;
    this.handler = null;
  }
}
