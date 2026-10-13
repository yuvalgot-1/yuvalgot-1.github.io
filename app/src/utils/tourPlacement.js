// Where the tour bubble goes for a highlighted element: below it when there is room,
// otherwise above it, otherwise pinned to the bottom of the screen (over the element).
export function placeBubble(target, viewportHeight, bubbleHeight, gap = 12) {
  const below = target.bottom + gap;
  if (below + bubbleHeight <= viewportHeight - gap) return { top: below, side: 'below' };
  const above = target.top - gap - bubbleHeight;
  if (above >= gap) return { top: above, side: 'above' };
  return { top: Math.max(gap, viewportHeight - gap - bubbleHeight), side: 'over' };
}

// How far to scroll the page so the element sits near the top of the screen,
// leaving the rest of the screen for the bubble. Stays put when it already does.
export function scrollTargetFor(target, scrollY, viewportHeight, offset = 16) {
  if (target.top >= 0 && target.bottom <= viewportHeight * 0.55) return scrollY;
  return Math.max(0, Math.round(scrollY + target.top - offset));
}
