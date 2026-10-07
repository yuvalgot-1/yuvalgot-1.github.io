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
        <ul className="onboarding-list">
          <li>כאן תמצאו מסלולי טיול שלמים — מהטבע ועד לארוחה, לא רק נקודה על המפה.</li>
          <li>כל המסלולים נכתבו על ידי מטיילים אמיתיים ולא על ידי בינה מלאכותית.</li>
          <li>חפשו לפי אזור, קטגוריה או חיפוש חופשי.</li>
          <li>לחצו ♡ כדי לשמור מסלול למסך "שמורים" — השמירות נשמרות במכשיר הזה, ועם חשבון גם בכל המכשירים שלכם.</li>
        </ul>
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
