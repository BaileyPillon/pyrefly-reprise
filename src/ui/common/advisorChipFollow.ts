/**
 * The advisor's `N HIDE MOVES` chip goes where the card goes (critic round 13
 * PR-0130).
 *
 * The card has two writers of its `hidden` flag: `MoveAdvisor.applyVisible`
 * (the player's N) and the FFX HUD's safe-zone solver
 * (`FFXBattleHud.placeAdvisor`), which folds the card when an open panel, the
 * enemy-move read-out after E most of all, leaves it no band. The chip used to
 * stay up in the second case, alone in the middle of the screen and still
 * saying HIDE over a card that was not there. Now, while the advisor is **on**,
 * the chip is down whenever the card is; while it is **off**, the chip is the
 * player's way back and stays up.
 *
 * Watched with a `MutationObserver` on the card's `hidden` attribute rather
 * than polled from the advisor's own tick, because the HUD writes the flag
 * after that tick in the same frame; an observer's callback runs before the
 * frame is painted, so the chip never stands alone for a frame.
 *
 * **Game case: both** (shared component). FFX-2's HUD never hides the card
 * while the advisor is on, so nothing changes there.
 */

export function followCard(card: HTMLElement, chip: HTMLElement, advisorOn: () => boolean): () => void {
  const apply = (): void => {
    const down = advisorOn() && card.hidden;
    if (chip.hidden !== down) chip.hidden = down;
  };
  apply();
  if (typeof MutationObserver === 'undefined') return apply;
  const observer = new MutationObserver(apply);
  observer.observe(card, { attributes: true, attributeFilter: ['hidden'] });
  return apply;
}
