import RouteCard from './RouteCard.jsx';

export default function SavedScreen({ routes, saved, onOpen, onToggleSave, onOpenProfile }) {
  return (
    <div className="feed">
      <div className="feed__title-row">
        <span className="feed__title">מסלולים שמורים</span>
        <span className="feed__count">{routes.length} מסלולים</span>
      </div>

      {routes.map((r, i) => (
        <RouteCard key={r.id} priority={i === 0} route={r} saved={!!saved[r.id]} onOpen={onOpen} onToggleSave={onToggleSave} onOpenProfile={onOpenProfile} />
      ))}

      {routes.length === 0 && (
        <div className="feed__empty">
          עוד לא שמרתם מסלולים.<br />לחצו על ♡ בכרטיס מסלול כדי לשמור אותו לכאן.
        </div>
      )}
    </div>
  );
}
