import RouteCard from './RouteCard.jsx';
import { press } from '../utils/a11y.js';
import { SORTS } from '../utils/filterRoutes.js';

export default function FeedScreen({ title, count, routes, sort, onSort, saved, onOpen, onToggleSave, onOpenProfile, empty, onReset }) {
  return (
    <div className="feed">
      <div className="feed__title-row">
        <span className="feed__title">{title}</span>
        <span className="feed__count">{count} מסלולים</span>
      </div>

      {count > 1 && (
        <div className="feed__sort" role="group" aria-label="מיון">
          <span className="feed__sort-label">מיון:</span>
          {SORTS.map((o) => (
            <div
              key={o.id}
              className={'small-chip' + (sort === o.id ? ' small-chip--active' : '')}
              aria-pressed={sort === o.id}
              {...press(() => onSort(o.id))}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}

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
