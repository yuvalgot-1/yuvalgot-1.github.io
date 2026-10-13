import { describe, expect, it } from 'vitest';
import { placeBubble, scrollTargetFor } from '../src/utils/tourPlacement.js';

describe('placeBubble', () => {
  it('goes below the element when it fits', () => {
    expect(placeBubble({ top: 20, bottom: 140 }, 700, 180)).toEqual({ top: 152, side: 'below' });
  });

  it('goes above when there is no room below', () => {
    expect(placeBubble({ top: 400, bottom: 600 }, 700, 180)).toEqual({ top: 208, side: 'above' });
  });

  it('pins to the bottom of the screen when the element fills it', () => {
    expect(placeBubble({ top: 16, bottom: 650 }, 667, 180)).toEqual({ top: 475, side: 'over' });
  });
});

describe('scrollTargetFor', () => {
  it('brings the element near the top of the screen', () => {
    expect(scrollTargetFor({ top: 300, bottom: 600 }, 100, 667)).toBe(384);
  });

  it('stays put when the element is already high on the screen', () => {
    expect(scrollTargetFor({ top: 60, bottom: 250 }, 0, 667)).toBe(0);
  });

  it('never scrolls above the top of the page', () => {
    expect(scrollTargetFor({ top: -5, bottom: 400 }, 0, 667)).toBe(0);
  });
});
