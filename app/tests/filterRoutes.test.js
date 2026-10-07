import { describe, it, expect } from 'vitest';
import { filterRoutes, hasActiveFilters, sortRoutes } from '../src/utils/filterRoutes.js';

const routes = [
  { id: 'a', published: true, title: 'בוקר בכנרת', area: 'גליל תחתון', collections: ['day', 'water'], stops: [{ name: 'חוף דוגית', cat: 'nature' }, { name: 'מסעדת ארבל', cat: 'food' }] },
  { id: 'b', published: true, title: 'יער בן שמן', area: 'מרכז', collections: ['kids'], stops: [{ name: 'חניון המעגלים', cat: 'nature' }, { name: 'פיצה בשוהם', cat: 'food' }] },
  { id: 'c', published: false, title: 'טיוטה בגליל', area: 'גליל', collections: ['day'], stops: [{ name: 'קפה', cat: 'cafe' }] },
];
const ids = (list) => list.map((r) => r.id);

describe('filterRoutes', () => {
  it('returns only published routes when no filter is set', () => {
    expect(ids(filterRoutes(routes, {}))).toEqual(['a', 'b']);
  });

  it('never returns drafts, even when they match the search', () => {
    expect(filterRoutes(routes, { query: 'טיוטה' })).toEqual([]);
  });

  it('searches title, area and stop names', () => {
    expect(ids(filterRoutes(routes, { query: 'כנרת' }))).toEqual(['a']);
    expect(ids(filterRoutes(routes, { query: 'מרכז' }))).toEqual(['b']);
    expect(ids(filterRoutes(routes, { query: 'פיצה' }))).toEqual(['b']);
  });

  it('ignores surrounding spaces in the query', () => {
    expect(ids(filterRoutes(routes, { query: '  כנרת ' }))).toEqual(['a']);
  });

  it('shows routes with the old area name under both Galilee filters', () => {
    const old = [{ ...routes[2], id: 'old', published: true }];
    expect(ids(filterRoutes(old, { area: 'גליל עליון' }))).toEqual(['old']);
    expect(ids(filterRoutes(old, { area: 'גליל תחתון' }))).toEqual(['old']);
    expect(filterRoutes(old, { area: 'גולן' })).toEqual([]);
  });

  it('filters by collection, area and stop type', () => {
    expect(ids(filterRoutes(routes, { collection: 'kids' }))).toEqual(['b']);
    expect(ids(filterRoutes(routes, { area: 'גליל' }))).toEqual(['a']);
    expect(ids(filterRoutes(routes, { stopCat: 'food' }))).toEqual(['a', 'b']);
    expect(filterRoutes(routes, { stopCat: 'cafe' })).toEqual([]);
  });

  it('combines filters', () => {
    expect(ids(filterRoutes(routes, { collection: 'water', stopCat: 'food', area: 'גליל' }))).toEqual(['a']);
    expect(filterRoutes(routes, { collection: 'kids', area: 'גליל' })).toEqual([]);
  });
});

describe('hasActiveFilters', () => {
  it('is false by default and for a blank query', () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ query: '   ' })).toBe(false);
  });

  it('is true when any filter is set', () => {
    expect(hasActiveFilters({ query: 'x' })).toBe(true);
    expect(hasActiveFilters({ collection: 'day' })).toBe(true);
    expect(hasActiveFilters({ area: 'מרכז' })).toBe(true);
    expect(hasActiveFilters({ stopCat: 'view' })).toBe(true);
  });
});

describe('sortRoutes', () => {
  const list = [
    { id: 'old', created_at: '2026-01-01', rating_avg: 4.5, rating_count: 2 },
    { id: 'new', created_at: '2026-09-01', rating_avg: null, rating_count: 0 },
    { id: 'mid', created_at: '2026-05-01', rating_avg: 4.5, rating_count: 9, is_featured: true },
  ];
  const ids = (rs) => rs.map((r) => r.id);

  it('puts the newest first by default', () => {
    expect(ids(sortRoutes(list))).toEqual(['new', 'mid', 'old']);
  });

  it('sorts by rating, more ratings breaking ties, unrated last', () => {
    expect(ids(sortRoutes(list, 'rating'))).toEqual(['mid', 'old', 'new']);
  });

  it("puts editors' picks first, then the newest", () => {
    expect(ids(sortRoutes(list, 'featured'))).toEqual(['mid', 'new', 'old']);
  });

  it('does not change the input array', () => {
    sortRoutes(list, 'rating');
    expect(ids(list)).toEqual(['old', 'new', 'mid']);
  });
});
