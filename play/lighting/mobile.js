// Single source of truth for mobile detection inside the play module.
// Used by lighting (shadow-map size + count) and post-fx (bloom resolution,
// grain on/off). Mirrors the existing CSS heuristic
// (@media (hover: none) and (pointer: coarse)).
export function isMobile() {
  if (typeof window === 'undefined') return false;
  // Coarse pointer / no hover ⇒ touch device
  if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    return true;
  }
  // UA fallback
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

// Pixel ratio capped tighter on mobile; full DPR on desktop is already
// capped to 2 by setupRenderer.
export function effectivePixelRatio() {
  const dpr = window.devicePixelRatio || 1;
  return isMobile() ? Math.min(1.25, dpr) : Math.min(2, dpr);
}
