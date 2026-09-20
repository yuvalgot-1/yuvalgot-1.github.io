import ImageSlot from './ImageSlot.jsx';
import { CATEGORIES, COLLECTIONS, getCategory } from '../data/routes.js';
import { press } from '../utils/a11y.js';
import RatingSummary from './RatingSummary.jsx';

function categoryCounts(stops) {
  const counts = {};
  for (const s of stops) counts[s.cat] = (counts[s.cat] || 0) + 1;
  return Object.keys(CATEGORIES).filter((c) => counts[c]).map((c) => ({ cat: c, count: counts[c] }));
}

export default function RouteCard({ route, saved, onOpen, onToggleSave, onOpenProfile }) {
  return (
    <div className="route-card" {...press(() => onOpen(route.id))}>
      <div className="route-card__cover">
        <ImageSlot id={'cover-' + route.id} placeholder={'תמונת שער · ' + route.area} known={!!route.has_cover} />
        <div className="route-card__scrim" />
        <RatingSummary className="rating-summary--badge" avg={route.rating_avg} count={route.rating_count} />
        <div className="route-card__cover-text">
          <span className="route-card__title">{route.title}</span>
          <span className="route-card__chain">{route.stops.map((s) => s.name).join(' ← ')}</span>
        </div>
      </div>
      <div className="route-card__tags">
        {categoryCounts(route.stops).map(({ cat, count }) => (
          <span className="route-card__tag" key={cat} style={{ color: getCategory(cat).color, borderColor: getCategory(cat).color }}>
            {getCategory(cat).icon} {getCategory(cat).label}{count > 1 ? ' ×' + count : ''}
          </span>
        ))}
        {route.collections.filter((c) => COLLECTIONS.some((x) => x.id === c)).map((c) => (
          <span className="route-card__tag route-card__tag--plain" key={c}>
            {COLLECTIONS.find((x) => x.id === c).label}
          </span>
        ))}
      </div>
      <div className="route-card__meta">
        <div className="route-card__facts">
          <span>{route.duration}</span>
          <span className="route-card__facts-sep">•</span>
          <span>{route.stops.length} תחנות</span>
        </div>
        <div className="route-card__right">
          <div
            className={'route-card__author' + (onOpenProfile ? ' route-card__author--link' : '')}
            {...press(onOpenProfile ? (e) => { e.stopPropagation(); onOpenProfile(route.owner_id); } : undefined)}
          >
            <span className="route-card__initials">{route.author.slice(0, 1)}</span>
            <span>{route.author}</span>
          </div>
          <div
            className={'save-btn' + (saved ? ' save-btn--active' : '')}
            {...press((e) => { e.stopPropagation(); onToggleSave(route.id); })}
          >
            <span className="save-btn__icon">{saved ? '♥' : '♡'}</span>
            <span>{saved ? 'שמור' : 'שמירה'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
