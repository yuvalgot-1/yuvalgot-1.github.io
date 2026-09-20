import { supabase } from './supabase.js';

// route id -> { avg, count }
export async function fetchRatingStats() {
  const { data, error } = await supabase.from('route_rating_totals').select('route_id, rating_count, rating_sum');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [
    r.route_id,
    { avg: Math.round((r.rating_sum / r.rating_count) * 10) / 10, count: r.rating_count },
  ]));
}

// route id -> the signed-in user's own rating (the table only lets you read your own rows)
export async function fetchMyRatings() {
  const { data, error } = await supabase.from('route_ratings').select('route_id, rating');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.route_id, r.rating]));
}

export async function rateRoute(routeId, rating) {
  const { error } = await supabase
    .from('route_ratings')
    .upsert({ route_id: routeId, rating, updated_at: new Date().toISOString() }, { onConflict: 'user_id,route_id' });
  if (error) throw error;
}
