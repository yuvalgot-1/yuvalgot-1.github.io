import { supabase } from './supabase.js';

// The creators table only lets a creator read their own row, so a row here
// means "this logged-in account is an allowed creator".
export async function fetchCreatorName() {
  const { data, error } = await supabase.from('creators').select('name').maybeSingle();
  if (error) throw error;
  return data ? data.name : null;
}

export async function fetchSavedIds() {
  const { data, error } = await supabase.from('saved_routes').select('route_id');
  if (error) throw error;
  return data.map((row) => row.route_id);
}

export async function addSavedRoutes(routeIds) {
  if (routeIds.length === 0) return;
  const { error } = await supabase
    .from('saved_routes')
    .upsert(routeIds.map((route_id) => ({ route_id })), { onConflict: 'user_id,route_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeSavedRoute(routeId) {
  const { error } = await supabase.from('saved_routes').delete().eq('route_id', routeId);
  if (error) throw error;
}

// Links in auth emails send people back to the site root.
function siteUrl() {
  return window.location.origin + window.location.pathname;
}

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo: siteUrl() } });
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function resendConfirmation(email) {
  return supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: siteUrl() } });
}

export async function requestPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() });
}

// Deletes the signed-in visitor's account with its saved routes and ratings.
// The server refuses creator accounts (error hint 'creator').
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  // the session no longer exists on the server, so only clear it locally
  await supabase.auth.signOut({ scope: 'local' });
}

export async function updatePassword(password) {
  return supabase.auth.updateUser({ password });
}
