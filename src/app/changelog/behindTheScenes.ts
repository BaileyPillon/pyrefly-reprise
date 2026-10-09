/**
 * THE BEHIND THE SCENES SWITCH, and the two words on it that are still Bailey's to settle.
 *
 * Bailey, 2026-10-08: "Also include a behind the screens button of how the game was made but I need to approve of it
 * before it is public facing and is actually included in the game." Then, to the options and the recommendations:
 * "I'll go with all your recommendations". So the page is BUILT (`src/app/behindTheScenes/`) and this switch keeps it
 * OFF. While `BTS_LIVE` is `false`:
 *
 *  - the title screen's hint row has no BEHIND THE SCENES entry, no T key and no page: nothing about it is in the
 *    markup (`titleMarkup.ts`), and the key and the action are guarded by this constant (`TitleScreen.ts`);
 *  - the page's code is only ever reached through one dynamic `import()` behind `if (BTS_LIVE)` (`titleInfo.ts`), so a
 *    build with the switch off leaves the page, its words and its pictures out of the bundle altogether
 *    (`tests/unit/behind-the-scenes-off.test.ts` bundles the title's integration and proves it);
 *  - the in-game Credits do not name the AI tools yet: that change is prepared (`creditsData.ts`, `creditGroups`) and
 *    comes in at the same moment, by this same constant, so the page and the credits that back it go public together.
 *
 * There is no URL parameter, no debug call and no setting that turns it on. The only way is to edit the line below,
 * which also fails `tests/unit/behind-the-scenes-off.test.ts` until that test is changed on purpose, in the same
 * commit as Bailey's approval. Same pattern as `ONBOARDING_LIVE` (`ui/coach/coachState.ts`) and `TITLE_CAST_ON`
 * (`frontend/titleMarkup.ts`).
 *
 * Game case: both games. The page is about the whole project, and the title is the front door of FFX and FFX-2 alike.
 */

/** Off until Bailey approves the finished page. Flip it, and the test that pins it, in the commit that records his yes. */
export const BTS_LIVE = false;

/**
 * What the entry, the page's heading and the credits line call it.
 *
 * Still undecided: Bailey wrote "behind the screens"; the drafts said "Screens", and "Scenes" is the film phrase. The
 * recommendation was left open and he did not pick (decisions item 31). It is one constant so that settling it is one
 * edit: the entry, the page and its header all read it, and nothing else spells the name.
 */
export const BTS_TITLE = 'Behind the Scenes';

/** The key that opens the page from the title, the way L opens the changelog (`KeyboardEvent.code`). */
export const BTS_KEY = 'KeyT';

/** The letter printed beside the entry for that key. */
export const BTS_KEY_LABEL = 'T';
