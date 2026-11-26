/**
 * Motion presets (DESIGN.md §6). Import these; never inline spring numbers.
 * Under `MotionConfig reducedMotion="user"` every transition falls back to `fadeQuick`.
 */
export const tactilePress = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const; // tiles, chips, nodes
export const stageSlide = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const; // screen-to-screen, progress bar
export const feedbackSheet = { type: "spring", stiffness: 400, damping: 36, mass: 0.9 } as const; // verdict sheet, popovers
export const fadeQuick = { duration: 0.16, ease: "easeOut" } as const; // reduced-motion fallback
