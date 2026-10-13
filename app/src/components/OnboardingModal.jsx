import { useEffect } from 'react';
import { press } from '../utils/a11y.js';

export default function OnboardingModal({ onAccept, onOpenTerms }) {
  // keep the page behind the window from scrolling while it is open
  useEffect(() => {
    const { style } = document.documentElement;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => { style.overflow = previous; };
  }, []);

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <span className="onboarding-title" id="onboarding-title">ברוכים הבאים למיטיבי לסת 🚶</span>
        <span className="onboarding-text">
          מסלולי טיול שלמים, מהטבע ועד הארוחה, שנכתבו על ידי מטיילים אמיתיים.
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center' }}>
          השימוש באתר מותנה בהסכמה ל
          <span className="link-action" {...press(onOpenTerms)}>תנאי השימוש והפרטיות</span>.
          בלחיצה על "מסכימ/ה, בואו נתחיל" אתם מאשרים שקראתם ומסכימים להם.
        </span>
        <div className="publish-btn" style={{ background: 'var(--bg-header)' }} {...press(onAccept)}>
          מסכימ/ה, בואו נתחיל
        </div>
      </div>
    </div>
  );
}
