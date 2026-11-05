/**
 * The Legacy page and the Legacy stone search share one view transition
 * (client request, November 2026). Start a Legacy navigates forward with the
 * "legacy-forward" type: the Legacy page lifts away, the search rises in, and
 * the Legacy photograph settles into the search heading. The links back to
 * the Legacy page carry "legacy-back" and play it in reverse. Any other
 * navigation has no type and no animation. The keyframes are in globals.css.
 */

export const LEGACY_PHOTO = "/media/photos/sb-4117.webp";
export const LEGACY_PHOTO_ALT = "Three stone emerald cut ring resting in a green flower bud";
/** The shared name of the photograph on both pages. */
export const LEGACY_PHOTO_VT = "legacy-photo";
export const LEGACY_SEARCH = "/legacy/stones";

const BY_TYPE = { "legacy-forward": "legacy-forward", "legacy-back": "legacy-back", default: "none" };

/** Props for the ViewTransition around each page's content. */
export const LEGACY_VT = { enter: BY_TYPE, exit: BY_TYPE, default: "none" };
