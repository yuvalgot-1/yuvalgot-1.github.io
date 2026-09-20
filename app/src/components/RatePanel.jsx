import { press } from '../utils/a11y.js';

const STAR_LABELS = ['גרוע', 'לא משהו', 'סביר', 'טוב', 'מעולה'];

// Five tappable stars. Only signed-in visitors can rate; everyone else is pointed to the account tab.
export default function RatePanel({ signedIn, isOwner, myRating, onRate, onOpenAccount }) {
  if (isOwner) return null;

  if (!signedIn) {
    return (
      <div className="rate-panel">
        <span className="rate-panel__title">איך היה המסלול?</span>
        <span className="rate-panel__hint">
          כדי לדרג צריך חשבון חינמי. <span className="link-action" {...press(onOpenAccount)}>התחברות או הרשמה</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rate-panel">
      <span className="rate-panel__title">{myRating ? 'הדירוג שלך' : 'איך היה המסלול?'}</span>
      <div className="rate-panel__stars" role="group" aria-label="דירוג המסלול">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={'rate-panel__star' + (n <= myRating ? ' rate-panel__star--on' : '')}
            aria-label={`${n} כוכבים, ${STAR_LABELS[n - 1]}`}
            aria-pressed={n === myRating}
            onClick={() => onRate(n)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rate-panel__hint">
        {myRating ? `דירגתם ${myRating} מתוך 5. לחיצה על כוכב אחר משנה את הדירוג.` : 'לחצו על כוכב, מ־1 (גרוע) עד 5 (מעולה).'}
      </span>
    </div>
  );
}
