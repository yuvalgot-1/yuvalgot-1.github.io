import { useEffect, useState } from 'react';
import { press } from '../utils/a11y.js';

const STAR_LABELS = ['גרוע', 'לא משהו', 'סביר', 'טוב', 'מעולה'];

// Five tappable stars and a send button. Only signed-in visitors can rate; everyone else is pointed to the account tab.
export default function RatePanel({ signedIn, isOwner, myRating, onRate, onOpenAccount }) {
  const [picked, setPicked] = useState(myRating);
  const [sending, setSending] = useState(false);

  useEffect(() => { setPicked(myRating); }, [myRating]);

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

  const changed = picked > 0 && picked !== myRating;

  async function send() {
    if (!changed || sending) return;
    setSending(true);
    await onRate(picked);
    setSending(false);
  }

  let hint;
  if (changed) hint = `בחרתם ${picked} מתוך 5 (${STAR_LABELS[picked - 1]}). לחצו על "שליחת דירוג" כדי לשמור.`;
  else if (myRating) hint = `דירגתם ${myRating} מתוך 5. אפשר לבחור כוכב אחר ולשלוח שוב.`;
  else hint = 'בחרו כוכבים, מ־1 (גרוע) עד 5 (מעולה), ואז שלחו.';

  return (
    <div className="rate-panel">
      <span className="rate-panel__title">{myRating ? 'הדירוג שלך' : 'איך היה המסלול?'}</span>
      <div className="rate-panel__stars" role="group" aria-label="דירוג המסלול">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={'rate-panel__star' + (n <= picked ? ' rate-panel__star--on' : '')}
            aria-label={`${n} כוכבים, ${STAR_LABELS[n - 1]}`}
            aria-pressed={n === picked}
            onClick={() => setPicked(n)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rate-panel__hint" aria-live="polite">{hint}</span>
      <button type="button" className="btn-primary rate-panel__send" disabled={!changed || sending} onClick={send}>
        {sending ? 'שולח...' : myRating && !changed ? 'הדירוג נשמר ✓' : 'שליחת דירוג'}
      </button>
    </div>
  );
}
