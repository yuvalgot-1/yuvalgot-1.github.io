import RouteCard from './RouteCard.jsx';
import { press } from '../utils/a11y.js';

export default function FeedScreen({ title, count, routes, saved, onOpen, onToggleSave, onOpenProfile, empty, onReset }) {
  return (
    <div className="feed">
      <div className="feed__title-row">
        <span className="feed__title">{title}</span>
        <span className="feed__count">{count} מסלולים</span>
      </div>

      <div className="human-note">
        <span className="human-note__icon" aria-hidden="true">✓</span>
        <span>כל המסלולים נכתבו על ידי מטיילים אמיתיים ולא על ידי בינה מלאכותית</span>
      </div>

      {routes.map((r) => (
        <RouteCard key={r.id} route={r} saved={!!saved[r.id]} onOpen={onOpen} onToggleSave={onToggleSave} onOpenProfile={onOpenProfile} />
      ))}

      {empty && (
        <div className="feed__empty">
          לא מצאנו מסלול כזה.<br />נסו שם של מקום, אזור או "עם ילדים".
          {onReset && (<><br /><span className="link-action" {...press(onReset)}>נקה את כל הסינונים</span></>)}
        </div>
      )}
    </div>
  );
}
