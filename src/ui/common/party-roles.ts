/**
 * The one-word archetype shown on a party slot in the prep screen, as drawn in
 * the approved "Ink & Gold" board (`docs/screenshots/mockups/A-party-prep.jpg`).
 *
 * Presentation copy, not battle data: it tells the player at a glance what a
 * member is *for* in the three she is about to field, which the stat sheet only
 * says in numbers. FFX-2 needs no map — a girl's job there is literally her
 * current dressphere, so `PartyPrepScreen` reads that instead.
 *
 * Distinct from `speaker-roles.ts`, which says who someone is to Spira
 * ("Guardian", "Maester") in the dialogue box. This is what they do in a fight.
 */
export const PARTY_ROLES: Record<string, string> = {
  tidus: 'Warrior',
  yuna: 'Summoner',
  auron: 'Sentinel',
  wakka: 'Ranger',
  lulu: 'Black Mage',
  kimahri: 'Stoic',
  rikku: 'Thief',
};

/** The archetype for a member id, or `undefined` to show no tag. */
export function partyRole(id: string): string | undefined {
  return PARTY_ROLES[id];
}
