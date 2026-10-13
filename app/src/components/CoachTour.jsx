import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { placeBubble, scrollTargetFor } from '../utils/tourPlacement.js';

// Each step highlights a real element on the feed. A step whose element is not on the
// screen (for example, no routes match) is left out.
const STEPS = [
  {
    selector: '[data-tour="search"]',
    title: 'לאן יוצאים היום?',
    text: 'חפשו מקום או אזור, או סננו לפי אזור, סוג תחנה וסוג טיול.',
  },
  {
    selector: '.feed .route-card',
    title: 'מסלול שלם, מהטבע ועד הארוחה',
    text: 'לחצו על כרטיס כדי לראות את כל התחנות לפי הסדר. ♡ שומר את המסלול בלשונית "שמורים".',
  },
  {
    selector: '.feed .human-note',
    title: 'נכתב על ידי מטיילים',
    text: 'כל מסלול נכתב על ידי אנשים שהיו שם, לא על ידי בינה מלאכותית.',
  },
];

const PAD = 8;

// Resolves once the page stops moving after a smooth scroll (or straight away if it never moved).
function whenScrollSettles() {
  return new Promise((resolve) => {
    let last = window.scrollY;
    let still = 0;
    let frames = 0;
    const tick = () => {
      frames += 1;
      still = window.scrollY === last ? still + 1 : 0;
      last = window.scrollY;
      if (still >= 4 || frames > 60) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export default function CoachTour({ onDone }) {
  // read once the feed is on the page: the tour can mount in the same render that opens the feed
  const [steps, setSteps] = useState(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [bubbleTop, setBubbleTop] = useState(null);
  // false while moving between steps: the ring and bubble fade out, the page scrolls,
  // then both are placed once and fade back in, so nothing chases the scroll
  const [shown, setShown] = useState(false);
  const bubbleRef = useRef(null);
  const nextRef = useRef(null);
  const step = steps?.[index];
  const last = !!steps && index === steps.length - 1;

  const measure = useCallback(() => {
    const el = step && document.querySelector(step.selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const box = {
      top: Math.max(0, r.top - PAD),
      bottom: Math.min(window.innerHeight, r.bottom + PAD),
      left: r.left - PAD,
      width: r.width + PAD * 2,
    };
    setRect(box);
    const height = bubbleRef.current ? bubbleRef.current.offsetHeight : 180;
    setBubbleTop(placeBubble(box, window.innerHeight, height).top);
  }, [step]);

  useLayoutEffect(() => {
    setSteps(STEPS.filter((s) => document.querySelector(s.selector)));
  }, []);

  useEffect(() => {
    if (steps && steps.length === 0) onDone();
  }, [steps, onDone]);

  // bring the step's element into view, wait for the page to settle, then show the step
  useEffect(() => {
    const el = step && document.querySelector(step.selector);
    if (!el) return;
    let cancelled = false;
    setShown(false);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const top = scrollTargetFor(el.getBoundingClientRect(), window.scrollY, window.innerHeight);
    if (top !== window.scrollY) window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    whenScrollSettles().then(() => {
      if (cancelled) return;
      measure();
      setShown(true);
    });
    return () => { cancelled = true; };
  }, [step, measure]);

  // after a step is shown, follow the element if the visitor scrolls or turns the phone
  useEffect(() => {
    if (!shown) return;
    let frame = 0;
    const onChange = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    window.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [shown, measure]);

  // the bubble's height is only known after it renders; place it again once it is
  useLayoutEffect(() => { if (shown) measure(); }, [shown, measure]);

  useEffect(() => { if (shown) nextRef.current?.focus({ preventScroll: true }); }, [shown]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  if (!step) return null;

  return (
    <div className={'tour' + (shown ? ' tour--shown' : '')} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
      <div className="tour__dim" />
      {rect && (
        <div
          className="tour__spotlight"
          style={{
            transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
            width: rect.width,
            height: rect.bottom - rect.top,
          }}
        />
      )}
      <div className="tour__bubble" ref={bubbleRef} style={{ top: bubbleTop ?? '50%' }}>
        <span className="tour__count">{index + 1} מתוך {steps.length}</span>
        <span className="tour__title" id="tour-title">{step.title}</span>
        <span className="tour__text" id="tour-text">{step.text}</span>
        <div className="tour__actions">
          <button type="button" className="tour__next" ref={nextRef} onClick={() => (last ? onDone() : setIndex(index + 1))}>
            {last ? 'יאללה, לטייל' : 'הבא'}
          </button>
          {!last && (
            <button type="button" className="tour__skip" onClick={onDone}>דלג</button>
          )}
        </div>
      </div>
    </div>
  );
}
