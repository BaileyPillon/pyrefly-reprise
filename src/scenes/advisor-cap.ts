/**
 * The move-advisor card's cap for the FFX-2 rooms whose fiends were brought forward to their real size (r3942-stage, FFX-2 only; the same mechanism as Chapter
 * VI's, `scenes/leblanc-staging.ts` `LEBLANC_ADVISOR_CAP` (46), Bailey's "Option 3: bosses forward", with a milder number).
 *
 * A fiend that stands beside the girls at its real height has its feet on the screen's lower third, where the move-advisor card hangs: at its full height the card's top is
 * y 588 at 1600x900 (a long recommendation, a downed girl), at its usual two lines y 705, and the nearest feet of Chapters XI, XIII and XV reach y 620 to 690. `SceneStaging.advisorCap`
 * (`scenes/types.ts`) is the scene's own cap on the card, in HUD grid px (the 640x360 stage the FFX-2 chrome is laid out on): 52 grid px is 130 px at 1600x900, the card's top then
 * stands at y 705 (its usual two-line place) and its `N HIDE MOVES` tab above it, under every foot, and the card prints fewer lines when its text is long (it keeps
 * the head line, the move and its target; `MoveAdvisor.fitCard`). Chapter VI's 46 (y 742) was needed there for feet at y 723; at 46 the card's placement moved left and its tab
 * lay on Rikku's feet in these rooms (4 percent of her box), at 52 it keeps the place it has at its usual size. It is a cap that only tightens: the stylesheet's own is 104.
 *
 * Named by Chapter XI's Road to the Farplane (`road-to-the-farplane.ts`), Chapter XIII's Cloister (`cloister-100.ts`) and Chapter XV's Den of Woe (`den-of-woe.ts`), and by no
 * other scene but Chapter VI's room: every other chapter's card is exactly as it was.
 */
export const FORWARD_FIEND_ADVISOR_CAP = 52;
