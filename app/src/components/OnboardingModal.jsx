import { press } from '../utils/a11y.js';

export default function OnboardingModal({ onDismiss, onOpenTerms }) {
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <span className="onboarding-title">ברוכים הבאים ל־מיטיבי לסת 👋</span>
        <ul className="onboarding-list">
          <li>כאן תמצאו מסלולי טיול שלמים — מהטבע ועד לארוחה, לא רק נקודה על המפה.</li>
          <li>כל המסלולים נכתבו על ידי מטיילים אמיתיים ולא על ידי בינה מלאכותית.</li>
          <li>חפשו לפי אזור, קטגוריה או חיפוש חופשי.</li>
          <li>לחצו ♡ כדי לשמור מסלול למסך "שמורים" — השמירות נשמרות במכשיר הזה, ועם חשבון גם בכל המכשירים שלכם.</li>
        </ul>
        <span style={{ fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center' }}>
          בלחיצה על "מסכימ/ה, בואו נתחיל" אתם מאשרים שקראתם ומסכימים ל
          <span className="link-action" {...press(onOpenTerms)}>תנאי השימוש</span>.
          ללא הסכמה לא ניתן להשתמש באתר.
        </span>
        <div className="publish-btn" style={{ background: 'var(--bg-header)' }} {...press(onDismiss)}>
          מסכימ/ה, בואו נתחיל
        </div>
      </div>
    </div>
  );
}
