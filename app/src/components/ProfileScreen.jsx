import RouteCard from './RouteCard.jsx';

export default function ProfileScreen({ name, routes, saved, onOpen, onToggleSave, onBack }) {
  return (
    <div className="feed">
      <div className="profile-head">
        <button className="profile-head__back" onClick={onBack} aria-label="חזרה">›</button>
        <span className="profile-head__avatar">{name.slice(0, 1)}</span>
        <div className="profile-head__text">
          <span className="profile-head__name">{name}</span>
          <span className="profile-head__count">{routes.length} מסלולים</span>
        </div>
      </div>

      {routes.map((r, i) => (
        <RouteCard key={r.id} priority={i === 0} route={r} saved={!!saved[r.id]} onOpen={onOpen} onToggleSave={onToggleSave} />
      ))}

      {routes.length === 0 && <div className="feed__empty">עוד אין מסלולים מפורסמים.</div>}
    </div>
  );
}
