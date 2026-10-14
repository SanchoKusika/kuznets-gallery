/** Animations are on unless the visitor asked for reduced motion (prototype `motionOK()`). */
export function prefersMotion() {
  return !matchMedia("(prefers-reduced-motion: reduce)").matches;
}
