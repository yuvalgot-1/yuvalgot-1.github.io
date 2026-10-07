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

export const SORTS = [
  { id: 'new', label: 'חדשים' },
  { id: 'rating', label: 'דירוג גבוה' },
  { id: 'featured', label: 'בחירת העורכים' },
];

const byNewest = (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''));

// Unrated routes go last when sorting by rating; ties fall back to the newest.
export function sortRoutes(routes, sort = 'new') {
  const list = [...routes];
  if (sort === 'rating') {
    return list.sort((a, b) =>
      (b.rating_avg ?? -1) - (a.rating_avg ?? -1) || (b.rating_count || 0) - (a.rating_count || 0) || byNewest(a, b));
  }
  if (sort === 'featured') {
    return list.sort((a, b) => Number(!!b.is_featured) - Number(!!a.is_featured) || byNewest(a, b));
  }
  return list.sort(byNewest);
}
