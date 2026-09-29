import { describe, it, expect, vi, beforeEach } from 'vitest';

// A stand-in for the Supabase client: every query builder call is recorded and the
// last step of a chain resolves to whatever the test put in `result`.
const calls = [];
let result = { data: null, error: null };

function builder(table) {
  const b = {};
  for (const m of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'order']) {
    b[m] = (...args) => { calls.push({ table, m, args }); return b; };
  }
  b.maybeSingle = () => Promise.resolve(result);
  b.then = (res, rej) => Promise.resolve(result).then(res, rej);
  return b;
}

const auth = { signOut: vi.fn(() => Promise.resolve({})) };
const rpc = vi.fn(() => Promise.resolve(result));

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: (t) => builder(t), rpc: (...a) => rpc(...a), auth },
}));

const { fetchRatingStats, fetchMyRatings, rateRoute } = await import('../src/lib/ratingsApi.js');
const { addSavedRoutes, removeSavedRoute, fetchCreatorName, deleteMyAccount } = await import('../src/lib/accountApi.js');
const { insertRoute, updateRoute, deleteRoute } = await import('../src/lib/routesApi.js');

beforeEach(() => {
  calls.length = 0;
  result = { data: null, error: null };
  rpc.mockClear();
  auth.signOut.mockClear();
});

describe('ratings', () => {
  it('turns totals into a rounded average and a count per route', async () => {
    result = { data: [{ route_id: 'a', rating_count: 3, rating_sum: 13 }], error: null };
    expect(await fetchRatingStats()).toEqual({ a: { avg: 4.3, count: 3 } });
  });

  it('maps my ratings by route', async () => {
    result = { data: [{ route_id: 'a', rating: 5 }, { route_id: 'b', rating: 2 }], error: null };
    expect(await fetchMyRatings()).toEqual({ a: 5, b: 2 });
  });

  it('saves a rating as one row per user and route', async () => {
    await rateRoute('u1', 'r1', 4);
    const call = calls.find((c) => c.m === 'upsert');
    expect(call.table).toBe('route_ratings');
    expect(call.args[0]).toMatchObject({ user_id: 'u1', route_id: 'r1', rating: 4 });
    expect(call.args[1]).toEqual({ onConflict: 'user_id,route_id' });
  });

  it('throws when the server rejects the rating', async () => {
    result = { data: null, error: new Error('nope') };
    await expect(rateRoute('u1', 'r1', 4)).rejects.toThrow('nope');
  });
});

describe('saved routes', () => {
  it('does nothing when there is nothing to save', async () => {
    await addSavedRoutes([]);
    expect(calls).toHaveLength(0);
  });

  it('upserts saved routes without overwriting duplicates', async () => {
    await addSavedRoutes(['a', 'b']);
    const call = calls.find((c) => c.m === 'upsert');
    expect(call.args[0]).toEqual([{ route_id: 'a' }, { route_id: 'b' }]);
    expect(call.args[1]).toMatchObject({ ignoreDuplicates: true });
  });

  it('removes only the given route', async () => {
    await removeSavedRoute('a');
    expect(calls.find((c) => c.m === 'eq').args).toEqual(['route_id', 'a']);
  });
});

describe('creator check', () => {
  it('returns the name for a creator and null for anyone else', async () => {
    result = { data: { name: 'yuval' }, error: null };
    expect(await fetchCreatorName()).toBe('yuval');
    result = { data: null, error: null };
    expect(await fetchCreatorName()).toBeNull();
  });
});

describe('account deletion', () => {
  it('deletes on the server, then clears the session locally only', async () => {
    await deleteMyAccount();
    expect(rpc).toHaveBeenCalledWith('delete_my_account');
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('keeps the session and throws if the server refuses (e.g. creator accounts)', async () => {
    result = { data: null, error: new Error('creator') };
    await expect(deleteMyAccount()).rejects.toThrow('creator');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('publishing routes', () => {
  it('inserts, updates and deletes against the routes table', async () => {
    await insertRoute({ id: 'x', title: 't' });
    await updateRoute('x', { published: true });
    await deleteRoute('x');
    expect(calls.filter((c) => c.table === 'routes').map((c) => c.m)).toEqual(['insert', 'update', 'eq', 'delete', 'eq']);
    expect(calls.filter((c) => c.m === 'eq').every((c) => c.args[0] === 'id' && c.args[1] === 'x')).toBe(true);
  });

  it('surfaces a failed publish so the app can show an error', async () => {
    result = { data: null, error: new Error('rls') };
    await expect(insertRoute({ id: 'x' })).rejects.toThrow('rls');
    await expect(updateRoute('x', {})).rejects.toThrow('rls');
    await expect(deleteRoute('x')).rejects.toThrow('rls');
  });
});
