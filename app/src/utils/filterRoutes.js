// Routes saved before the Galilee was split into upper and lower still say 'גליל':
// show them under both until they are edited.
const LEGACY_AREAS = { 'גליל': ['גליל עליון', 'גליל תחתון'] };

function inArea(routeArea, area) {
  return routeArea.includes(area) || !!LEGACY_AREAS[routeArea]?.includes(area);
}

export function filterRoutes(routes, { query = '', collection = 'all', area = 'all', stopCat = 'all' }) {
  const q = query.trim().toLowerCase();
  return routes.filter((r) => {
    if (!r.published) return false;
    const hay = (r.title + ' ' + r.area + ' ' + r.stops.map((x) => x.name).join(' ')).toLowerCase();
    return (
      (!q || hay.includes(q)) &&
      (collection === 'all' || r.collections.includes(collection)) &&
      (area === 'all' || inArea(r.area, area)) &&
      (stopCat === 'all' || r.stops.some((x) => x.cat === stopCat))
    );
  });
}

export function hasActiveFilters({ query = '', collection = 'all', area = 'all', stopCat = 'all' }) {
  return !!query.trim() || collection !== 'all' || area !== 'all' || stopCat !== 'all';
}
