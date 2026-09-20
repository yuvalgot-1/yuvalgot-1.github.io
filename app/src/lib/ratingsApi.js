import { supabase } from './supabase.js';

// route id -> { avg, count }
export async function fetchRatingStats() {
  const { data, error } = await supabase.from('route_rating_stats').select('route_id, rating_avg, rating_count');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.route_id, { avg: r.rating_avg, count: r.rating_count }]));
}

// route id -> the signed-in user's own rating
export async function fetchMyRatings() {
  const { data, error } = await supabase.rpc('my_ratings');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.route_id, r.rating]));
}

export async function rateRoute(routeId, rating) {
  const { error } = await supabase.rpc('rate_route', { p_route_id: routeId, p_rating: rating });
  if (error) throw error;
}
