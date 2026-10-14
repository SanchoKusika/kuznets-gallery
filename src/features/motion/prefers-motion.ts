const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Animations are on unless the visitor asked for reduced motion (prototype `motionOK()`). */
export function prefersMotion() {
  return !matchMedia(REDUCED_MOTION).matches;
}

/**
 * Runs in <head> before first paint: `html[data-motion]` keeps server-rendered blocks hidden
 * until <Reveal> starts animating them, so they don't flash before the animation.
 */
export const MOTION_INIT_SCRIPT = `(function(){try{if(!matchMedia("${REDUCED_MOTION}").matches)document.documentElement.setAttribute("data-motion","")}catch(e){}})()`;
