import ImageSlot from './ImageSlot.jsx';
import { getCategory } from '../data/routes.js';
import { googleMapsUrl, wazeUrl, routeDirectionsUrl } from '../utils/maps.js';
import { stopImagePath } from '../utils/url.js';
import { press } from '../utils/a11y.js';
import RatePanel from './RatePanel.jsx';

export default function RouteDetailScreen({ route, saved, onToggleSave, onOpenProfile, onBack, onShare, editable, signedIn, isOwner, myRating, onRate, onOpenAccount, onCoverUploaded, onStopImageUploaded }) {
  const facts = [
    { value: route.duration.split(' · ')[1] || route.duration, label: 'משך המסלול' },
    { value: route.stops.length, label: 'תחנות' },
    ...(route.rating_count ? [{ value: '★ ' + route.rating_avg.toFixed(1), label: `דירוג (${route.rating_count})` }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="detail-cover">
        <ImageSlot
          id={'cover-' + route.id}
          placeholder={'תמונת שער · ' + route.area}
          editable={editable}
          known={!!route.has_cover}
          onUploaded={onCoverUploaded}
        />
        <div className="detail-cover__scrim" />
        <button className="detail-cover__back" onClick={onBack}>›</button>
        <div className="detail-cover__text">
          <span className="detail-cover__area">{route.area}</span>
          <span className="detail-cover__title">{route.title}</span>
        </div>
      </div>

      <div className="detail-facts">
        {facts.map((f, i) => (
          <div className="detail-facts__item" key={i}>
            <span className="detail-facts__value">{f.value}</span>
            <span className="detail-facts__label">{f.label}</span>
          </div>
        ))}
      </div>

      <div className="detail-content">
        <div className="detail-author" {...press(() => onOpenProfile(route.owner_id))}>
          <span className="route-card__initials">{route.author.slice(0, 1)}</span>
          <span>מאת <b>{route.author}</b> · כל המסלולים ›</span>
        </div>
        {route.blurb && <p className="detail-blurb">{route.blurb}</p>}

        <a className="route-nav" href={routeDirectionsUrl(route)} target="_blank" rel="noopener noreferrer">
          <span className="route-nav__title">פתיחת כל המסלול בגוגל מפות ↗</span>
          <span className="route-nav__sub">נסיעה דרך {route.stops.length} התחנות לפי הסדר</span>
        </a>

        <div className="timeline">
          <span className="timeline__title">המסלול, תחנה אחר תחנה</span>
          {route.stops.map((s, i) => (
            <div className="timeline__row" key={i}>
              <div className="timeline__rail">
                <div className="timeline__dot">{i + 1}</div>
                <div className="timeline__line" />
              </div>
              <div className="timeline__body">
                <div className="stop-card">
                  <div className="stop-card__photo">
                    <ImageSlot
                      id={stopImagePath(route.id, s, i)}
                      placeholder={s.name}
                      editable={editable}
                      known={!!s.image}
                      onUploaded={() => onStopImageUploaded(i)}
                    />
                    <div className="stop-card__tag" style={{ background: getCategory(s.cat).color }}>
                      {getCategory(s.cat).label}
                    </div>
                  </div>
                  <div className="stop-card__body">
                    <span className="stop-card__name">{s.name}</span>
                    <div className="stop-card__tags">
                      <span className="stop-card__spend">⏱ {s.spend}</span>
                      {s.hours && <span className="stop-card__hours">{s.hours}</span>}
                      {s.difficulty && <span className="stop-card__hours">רמת קושי: {s.difficulty}</span>}
                      {s.price && <span className="stop-card__hours">{s.price}</span>}
                      {s.accessible && <span className="stop-card__hours">♿ נגיש</span>}
                    </div>
                    {s.note && <p className="stop-card__note">{s.note}</p>}
                    <div className="stop-card__nav">
                      <a className="stop-card__map-link" href={googleMapsUrl(s, route.area)} target="_blank" rel="noopener noreferrer">
                        גוגל מפות ↗
                      </a>
                      <a className="stop-card__map-link" href={wazeUrl(s, route.area)} target="_blank" rel="noopener noreferrer">
                        Waze ↗
                      </a>
                    </div>
                  </div>
                </div>
                {i < route.stops.length - 1 && s.travel && (
                  <div className="timeline__travel">
                    <span style={{ fontSize: 13 }}>↓</span>
                    <span>{s.travel}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <RatePanel signedIn={signedIn} isOwner={isOwner} myRating={myRating} onRate={onRate} onOpenAccount={onOpenAccount} />

        <div className="detail-actions">
          <div className="btn-primary" {...press(() => onToggleSave(route.id))}>
            {saved ? 'נשמר ✓' : 'שמירת המסלול'}
          </div>
          <div className="btn-secondary" {...press(() => onShare(route))}>שיתוף</div>
        </div>
      </div>
    </div>
  );
}
