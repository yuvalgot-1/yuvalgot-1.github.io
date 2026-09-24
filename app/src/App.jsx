import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorageState } from './hooks/useLocalStorageState.js';
import { supabase } from './lib/supabase.js';
import { stopImagePath } from './utils/url.js';
import { fetchRoutes, insertRoute, updateRoute, deleteRoute } from './lib/routesApi.js';
import { fetchCreatorName, fetchSavedIds, addSavedRoutes, removeSavedRoute } from './lib/accountApi.js';
import { fetchRatingStats, fetchMyRatings, rateRoute } from './lib/ratingsApi.js';
import { COLLECTIONS } from './data/routes.js';
import { filterRoutes, hasActiveFilters } from './utils/filterRoutes.js';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import FeedScreen from './components/FeedScreen.jsx';
import SavedScreen from './components/SavedScreen.jsx';
import RouteDetailScreen from './components/RouteDetailScreen.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import AccountScreen from './components/AccountScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import InstallScreen from './components/InstallScreen.jsx';
import RecoveryScreen from './components/RecoveryScreen.jsx';
import GuideScreen from './components/GuideScreen.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';

// rarely-used screens are loaded on demand to keep the first page load small
const MyRoutesScreen = lazy(() => import('./components/MyRoutesScreen.jsx'));
const BuilderScreen = lazy(() => import('./components/BuilderScreen.jsx'));
const TermsScreen = lazy(() => import('./components/TermsScreen.jsx'));

const ROUTE_HASH = /^#\/route\/(.+)$/;

// Read before Supabase clears the address: did the visitor arrive from a password-reset email?
const OPENED_FOR_RECOVERY = window.location.hash.includes('type=recovery');
const LINK_EXPIRED = /error_code=(otp_expired|access_denied)/.test(window.location.hash);

const DEFAULT_DRAFT = {
  editingId: null,
  title: '',
  area: 'שרון',
  duration: '',
  collections: [],
  stops: [
    { name: 'בריכת המעיין', cat: 'nature', spend: 'שעה', travel: '10 דק׳ נסיעה', hours: '', note: '' },
    { name: 'קפה בשוק', cat: 'cafe', spend: '40 דק׳', travel: '', hours: '', note: '' },
  ],
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // undefined = still checking, null = signed in but not an allowed creator
  const [creatorName, setCreatorName] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [recovering, setRecovering] = useState(OPENED_FOR_RECOVERY);

  const [baseRoutes, setBaseRoutes] = useState([]);
  const [ratingStats, setRatingStats] = useState({});
  const [myRatings, setMyRatings] = useState({});
  const [routesLoading, setRoutesLoading] = useState(true);
  const [routesError, setRoutesError] = useState(null);

  const [saved, setSaved] = useLocalStorageState('saved', {});
  const [mode, setMode] = useLocalStorageState('mode', 'public');
  const [draft, setDraft] = useLocalStorageState('draft', DEFAULT_DRAFT);
  const [onboardingSeen, setOnboardingSeen] = useLocalStorageState('onboardingSeen', false);

  const [screen, setScreen] = useState('feed');
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [stopCat, setStopCat] = useState('all');
  const [justPublished, setJustPublished] = useState(false);
  const [toast, setToast] = useState('');

  const isCreator = mode === 'creator';
  const creatorReady = isCreator && !!session && !!creatorName;
  const userId = session?.user?.id ?? null;
  const installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) { setCreatorName(null); setSyncedUser(null); return; }
    let cancelled = false;
    setCreatorName(undefined);
    // Right after the app opens (or resumes) the request can fail or come back empty
    // before the session/network is ready, so retry a few times before deciding
    // the account is not an allowed creator.
    (async () => {
      let name = null;
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        try {
          name = await fetchCreatorName();
        } catch {
          name = null;
        }
        if (name) break;
      }
      if (!cancelled) setCreatorName(name);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!LINK_EXPIRED) return;
    setToast('הקישור במייל פג תוקף. בקשו קישור חדש.');
    setTimeout(() => setToast(''), 3500);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const loadRoutes = useCallback(async () => {
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const data = await fetchRoutes();
      setBaseRoutes(data);
    } catch (e) {
      setRoutesError(e.message || 'שגיאה בטעינת המסלולים');
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) loadRoutes();
  }, [authLoading, session, loadRoutes]);

  // ratings are an extra: if they fail to load, routes still work without them
  const loadRatings = useCallback(() => {
    fetchRatingStats().then(setRatingStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading) loadRatings();
  }, [authLoading, loadRatings]);

  useEffect(() => {
    if (!userId) { setMyRatings({}); return; }
    let cancelled = false;
    fetchMyRatings().then((r) => { if (!cancelled) setMyRatings(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  const routes = useMemo(
    () => baseRoutes.map((r) => ({ ...r, rating_avg: ratingStats[r.id]?.avg ?? null, rating_count: ratingStats[r.id]?.count ?? 0 })),
    [baseRoutes, ratingStats],
  );

  // signed-in visitors: merge this device's saved routes into the account, then use the account's list
  const [syncedUser, setSyncedUser] = useState(null);
  useEffect(() => {
    if (!userId || routesLoading || syncedUser === userId) return;
    setSyncedUser(userId);
    (async () => {
      try {
        const known = new Set(routes.map((r) => r.id));
        const remote = await fetchSavedIds();
        const localIds = Object.keys(saved).filter((id) => saved[id] && known.has(id));
        await addSavedRoutes(localIds.filter((id) => !remote.includes(id)));
        setSaved(Object.fromEntries([...new Set([...remote, ...localIds])].map((id) => [id, true])));
      } catch {
        // saving still works on this device even if syncing fails
      }
    })();
  }, [userId, routesLoading, syncedUser, routes, saved, setSaved]);

  // open a shared link (#/route/<id>) once routes have loaded
  const [linkHandled, setLinkHandled] = useState(false);
  useEffect(() => {
    if (routesLoading || linkHandled) return;
    setLinkHandled(true);
    const match = ROUTE_HASH.exec(window.location.hash);
    if (!match) return;
    const id = decodeURIComponent(match[1]);
    if (routes.some((r) => r.id === id)) {
      setOpenId(id);
      setScreen('detail');
    }
  }, [routesLoading, linkHandled, routes]);

  function toggleMode() {
    const next = isCreator ? 'public' : 'creator';
    setMode(next);
    setScreen(next === 'creator' ? 'mine' : 'feed');
  }

  function cancelLogin() {
    setMode('public');
    setScreen('feed');
  }

  async function signOut() {
    await supabase.auth.signOut();
    // the saved list belongs to the account - don't leave it on a shared device
    setSaved({});
  }

  async function logout() {
    await signOut();
    setMode('public');
    setScreen('feed');
  }

  // the server already removed the account and its saved routes and ratings
  function accountDeleted() {
    setSaved({});
    loadRatings();
    setToast('החשבון נמחק');
    setTimeout(() => setToast(''), 2400);
  }

  function openProfile(ownerId) {
    setProfileId(ownerId);
    setScreen('profile');
  }

  async function runInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function openRoute(id) {
    setOpenId(id);
    setScreen('detail');
    window.history.replaceState(null, '', '#/route/' + encodeURIComponent(id));
  }

  function clearRouteHash() {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function navigate(id) {
    clearRouteHash();
    if (id === 'saved') { setScreen('saved'); return; }
    setScreen(id);
  }

  function openTerms() {
    setScreen('terms');
  }

  function toggleSave(id) {
    const nowSaved = !saved[id];
    setSaved((s) => ({ ...s, [id]: nowSaved }));
    if (userId) {
      (nowSaved ? addSavedRoutes([id]) : removeSavedRoute(id)).catch(() => {
        setToast('השמירה בחשבון נכשלה');
        setTimeout(() => setToast(''), 1800);
      });
    }
  }

  async function rate(routeId, rating) {
    try {
      await rateRoute(userId, routeId, rating);
      setMyRatings((m) => ({ ...m, [routeId]: rating }));
      loadRatings();
      setToast('תודה! הדירוג נשמר');
    } catch (err) {
      console.error('rating failed', err);
      setToast('שמירת הדירוג נכשלה');
    }
    setTimeout(() => setToast(''), 1800);
  }

  async function togglePublish(id) {
    const route = routes.find((r) => r.id === id);
    if (!route) return;
    try {
      await updateRoute(id, { published: !route.published });
      await loadRoutes();
    } catch {
      setToast('העדכון נכשל');
      setTimeout(() => setToast(''), 1800);
    }
  }

  async function deleteRouteHandler(id) {
    const route = routes.find((r) => r.id === id);
    if (!route) return;
    const ok = window.confirm(`למחוק לצמיתות את "${route.title}"? לא ניתן לשחזר את זה.`);
    if (!ok) return;
    try {
      await deleteRoute(id);
    } catch {
      setToast('המחיקה נכשלה');
      setTimeout(() => setToast(''), 1800);
      return;
    }
    try {
      const imagePaths = ['cover-' + id, ...route.stops.map((s, i) => stopImagePath(id, s, i))];
      await supabase.storage.from('route-images').remove(imagePaths);
    } catch {
      // route is already deleted - leftover images are harmless
    }
    await loadRoutes();
  }

  async function markCoverUploaded(id) {
    try {
      await updateRoute(id, { has_cover: true });
      await loadRoutes();
    } catch {
      // the image itself already uploaded fine - the flag is just an optimization
    }
  }

  async function markStopImageUploaded(routeId, stopIndex) {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    const stops = route.stops.map((s, i) => (i === stopIndex ? { ...s, image: true } : s));
    try {
      await updateRoute(routeId, { stops });
      await loadRoutes();
    } catch {
      // the image itself already uploaded fine - the flag is just an optimization
    }
  }

  function toggleDraftCollection(id) {
    setDraft((d) => ({
      ...d,
      collections: d.collections.includes(id)
        ? d.collections.filter((c) => c !== id)
        : [...d.collections, id],
    }));
  }

  function addDraftStop(stop) {
    setDraft((d) => ({ ...d, stops: [...d.stops, stop] }));
  }

  function removeDraftStop(index) {
    const removed = draft.stops[index];
    if (removed?.draftImage) {
      supabase.storage.from('route-images').remove(['draft-stop-' + removed.draftImage]).catch(() => {});
    }
    setDraft((d) => ({ ...d, stops: d.stops.filter((_, i) => i !== index) }));
  }

  function moveDraftStop(index, dir) {
    setDraft((d) => {
      const target = index + dir;
      if (target < 0 || target >= d.stops.length) return d;
      const stops = [...d.stops];
      [stops[index], stops[target]] = [stops[target], stops[index]];
      return { ...d, stops };
    });
  }

  function startEdit(route) {
    setDraft({
      editingId: route.id,
      title: route.title,
      area: route.area,
      duration: route.duration === 'לא צוין' ? '' : route.duration,
      collections: route.collections,
      stops: route.stops.map((s, i) => (s.image && !s.imgId ? { ...s, legacyPath: 'stop-' + route.id + '-' + i } : s)),
    });
    setScreen('build');
  }

  function cancelEdit() {
    setDraft(DEFAULT_DRAFT);
    setScreen('mine');
  }

  async function publishDraft() {
    if (draft.stops.length < 2) return;
    const isEdit = !!draft.editingId;
    const routeId = isEdit ? draft.editingId : 'custom-' + Date.now();
    const bucket = supabase.storage.from('route-images');
    const stops = await Promise.all(draft.stops.map(async (stop) => {
      const { draftImage, legacyPath, ...rest } = stop;
      const imgId = draftImage || (legacyPath && Date.now() + '-' + Math.random().toString(36).slice(2, 8));
      if (!imgId) return rest;
      const { error } = await bucket.move(draftImage ? 'draft-stop-' + draftImage : legacyPath, 'stop-img-' + imgId);
      return error ? { ...rest, image: false } : { ...rest, image: true, imgId };
    }));
    const routeFields = {
      title: draft.title.trim() || 'מסלול ללא שם',
      area: draft.area,
      duration: draft.duration.trim() || 'לא צוין',
      collections: draft.collections,
      stops,
    };
    try {
      if (isEdit) {
        await updateRoute(draft.editingId, routeFields);
      } else {
        const id = routeId;
        await insertRoute({ id, blurb: '', published: true, author: creatorName, ...routeFields });
        const { error: moveError } = await supabase.storage.from('route-images').move('draft-cover', 'cover-' + id);
        if (!moveError) {
          await updateRoute(id, { has_cover: true });
        }
      }
    } catch {
      setToast(isEdit ? 'השמירה נכשלה' : 'הפרסום נכשל');
      setTimeout(() => setToast(''), 1800);
      return;
    }
    await loadRoutes();
    setDraft(DEFAULT_DRAFT);
    setJustPublished(true);
    setTimeout(() => {
      setJustPublished(false);
      setScreen('mine');
    }, 900);
  }

  async function shareRoute(route) {
    const url = window.location.origin + window.location.pathname + '#/route/' + encodeURIComponent(route.id);
    const text = `${route.title}\n${route.area}\n` + route.stops.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: route.title, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        setToast('הקישור הועתק ללוח');
        setTimeout(() => setToast(''), 1800);
      }
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  }

  const q = query.trim();
  const visibleRoutes = useMemo(() => routes.filter((r) => r.published), [routes]);
  const filters = { query, collection, area: areaFilter, stopCat };
  const matched = useMemo(
    () => filterRoutes(routes, { query, collection, area: areaFilter, stopCat }),
    [routes, query, collection, areaFilter, stopCat],
  );

  const hasFilters = hasActiveFilters(filters);
  function resetFilters() {
    setQuery('');
    setCollection('all');
    setAreaFilter('all');
    setStopCat('all');
  }

  const feedTitle = q
    ? 'תוצאות חיפוש'
    : (collection === 'all' ? 'כל המסלולים' : COLLECTIONS.find((c) => c.id === collection).label);

  const openRouteData = routes.find((r) => r.id === openId);
  const savedRoutes = routes.filter((r) => saved[r.id]);
  const profileRoutes = visibleRoutes.filter((r) => r.owner_id === profileId);
  const profileName = profileRoutes[0]?.author || '';

  if (authLoading || (routesLoading && routes.length === 0 && !routesError)) {
    return (
      <div className="app-shell-outer">
        <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <span style={{ color: 'var(--text-muted)' }}>טוען מסלולים...</span>
        </div>
      </div>
    );
  }

  if (routesError) {
    return (
      <div className="app-shell-outer">
        <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
          <span style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '0 24px' }}>
            לא הצלחנו לטעון את המסלולים. בדקו את החיבור לאינטרנט.
          </span>
          <span className="link-action" onClick={loadRoutes}>נסה שוב</span>
        </div>
      </div>
    );
  }

  if (recovering) {
    return (
      <div className="app-shell-outer">
        <div className="app-shell">
          <RecoveryScreen
            onDone={() => {
              setRecovering(false);
              setScreen('account');
              setToast('הסיסמה נשמרה');
              setTimeout(() => setToast(''), 2500);
            }}
            onCancel={() => setRecovering(false)}
          />
          {toast && <div className="toast">{toast}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-outer">
      <div className="app-shell">
        <Header
          mode={mode}
          onToggleMode={toggleMode}
          showSearch={screen === 'feed'}
          query={query}
          onQuery={setQuery}
          collection={collection}
          onCollection={setCollection}
          areaFilter={areaFilter}
          onAreaFilter={setAreaFilter}
          stopCat={stopCat}
          onStopCat={setStopCat}
          hasFilters={hasFilters}
          onReset={resetFilters}
          signedIn={!!session}
          accountActive={screen === 'account'}
          onOpenAccount={() => navigate('account')}
        />

        <div className="app-body">
          <Suspense fallback={null}>
          {screen === 'feed' && (
            <FeedScreen
              title={feedTitle}
              count={matched.length}
              routes={matched}
              saved={saved}
              onOpen={openRoute}
              onToggleSave={toggleSave}
              onOpenProfile={openProfile}
              empty={matched.length === 0}
              onReset={hasFilters ? resetFilters : null}
            />
          )}

          {screen === 'terms' && <TermsScreen onBack={() => setScreen('feed')} />}

          {screen === 'guide' && (
            <GuideScreen onBack={() => setScreen('feed')} onOpenInstall={() => setScreen('install')} />
          )}

          {screen === 'install' && (
            <InstallScreen
              onBack={() => setScreen('feed')}
              installPrompt={installPrompt}
              onInstall={runInstall}
              installed={installed}
            />
          )}

          {screen === 'account' && (
            <AccountScreen
              session={session}
              isCreator={!!creatorName}
              creatorMode={isCreator}
              onSignOut={isCreator ? logout : signOut}
              onAccountDeleted={accountDeleted}
              onOpenInstall={() => setScreen('install')}
              onSwitchToCreator={() => { setMode('creator'); setScreen('mine'); }}
              onSwitchToPublic={() => { setMode('public'); setScreen('feed'); }}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              name={profileName}
              routes={profileRoutes}
              saved={saved}
              onOpen={openRoute}
              onToggleSave={toggleSave}
              onBack={() => setScreen('feed')}
            />
          )}

          {screen === 'saved' && (
            <SavedScreen routes={savedRoutes} saved={saved} onOpen={openRoute} onToggleSave={toggleSave} onOpenProfile={openProfile} />
          )}

          {screen === 'detail' && openRouteData && (
            <RouteDetailScreen
              route={openRouteData}
              saved={!!saved[openRouteData.id]}
              onToggleSave={toggleSave}
              onOpenProfile={openProfile}
              onBack={() => { clearRouteHash(); setScreen('feed'); }}
              onShare={shareRoute}
              editable={creatorReady}
              signedIn={!!session}
              isOwner={!!userId && openRouteData.owner_id === userId}
              myRating={myRatings[openRouteData.id] || 0}
              onRate={(n) => rate(openRouteData.id, n)}
              onOpenAccount={() => navigate('account')}
              onCoverUploaded={() => markCoverUploaded(openRouteData.id)}
              onStopImageUploaded={(i) => markStopImageUploaded(openRouteData.id, i)}
            />
          )}

          {screen === 'mine' && (
            creatorReady ? (
              <MyRoutesScreen
                routes={routes}
                onTogglePublish={togglePublish}
                onEdit={startEdit}
                onDelete={deleteRouteHandler}
                onLogout={logout}
                onCoverUploaded={markCoverUploaded}
              />
            ) : (
              <LoginScreen onCancel={cancelLogin} signedInAs={session?.user?.email} checking={creatorName === undefined} onSignOut={logout} />
            )
          )}

          {screen === 'build' && (
            creatorReady ? (
              <BuilderScreen
                draft={draft}
                onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
                onAreaChange={(area) => setDraft((d) => ({ ...d, area }))}
                onDurationChange={(duration) => setDraft((d) => ({ ...d, duration }))}
                onToggleCollection={toggleDraftCollection}
                onAddStop={addDraftStop}
                onRemoveStop={removeDraftStop}
                onMoveStop={moveDraftStop}
                onPublish={publishDraft}
                onCancelEdit={cancelEdit}
                onCoverUploaded={() => markCoverUploaded(draft.editingId)}
                justPublished={justPublished}
              />
            ) : (
              <LoginScreen onCancel={cancelLogin} signedInAs={session?.user?.email} checking={creatorName === undefined} onSignOut={logout} />
            )
          )}
          </Suspense>
        </div>

        <BottomNav mode={mode} screen={screen} onNavigate={navigate} />

        {toast && <div className="toast">{toast}</div>}

        {!isCreator && !onboardingSeen && screen !== 'terms' && (
          <OnboardingModal
            onDismiss={() => setOnboardingSeen(true)}
            onOpenTerms={openTerms}
          />
        )}
      </div>
    </div>
  );
}
