/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Calendar as CalendarIcon, Award, Settings as SettingsIcon,
  Bell, Plus, Heart, Check, Sun, Moon, LogOut, AlertCircle, Info
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Wedding, GoogleCalendarEvent } from './types';
import { INITIAL_WEDDINGS, INITIAL_GOOGLE_EVENTS } from './data';
import { supabase } from './lib/supabase';
import {
  signInWithGoogle, getStoredGoogleToken, storeGoogleTokens, clearGoogleTokens, tryRefreshGoogleToken
} from './lib/googleAuth';
import {
  GoogleAuthError, GoogleEventInput, isLocalOnlyEvent,
  listGoogleCalendarEvents, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent
} from './lib/googleCalendar';

import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import WeddingsListView from './components/WeddingsListView';
import NewWeddingFormView from './components/NewWeddingFormView';
import WeddingBoardModal from './components/WeddingBoardModal';
import SettingsView from './components/SettingsView';

// Demo data gets fresh per-user ids so two accounts never collide on the same primary key.
// Demo google events use the local-only prefix so sync reconciliation leaves them alone.
const buildDemoWeddings = (): Wedding[] =>
  INITIAL_WEDDINGS.map(w => ({ ...w, id: `w-${crypto.randomUUID()}` }));
const buildDemoGoogleEvents = (): GoogleCalendarEvent[] =>
  INITIAL_GOOGLE_EVENTS.map(g => ({ ...g, id: `g-custom-${crypto.randomUUID()}` }));

// How a wedding booking appears on the user's Google Calendar
const weddingToEventInput = (w: Wedding): GoogleEventInput => ({
  title: `💍 Wedding — ${w.brideName} & ${w.groomName}`,
  date: w.date,
  time: w.time || '12:00',
  durationHours: 8,
  location: w.location,
  description: `Lumina Studio booking • Services: ${w.services.join(', ')}${w.notes ? `\nNotes: ${w.notes}` : ''}`,
});

interface Toast {
  title: string;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [selectedTab, setSelectedTab] = useState<'home' | 'calendar' | 'weddings' | 'settings' | 'new-wedding'>('home');
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);
  const [studioName, setStudioName] = useState('Lumina Wedding Studio');
  const [preselectedFormDate, setPreselectedFormDate] = useState('');

  // Lightweight toast notifications (replaces blocking alert() calls)
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = (next: Toast) => {
    setToast(next);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  };

  // Google Calendar Shared States
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [syncActive, setSyncActive] = useState(true);
  const [syncEmail, setSyncEmail] = useState('');
  const syncEmailTimer = useRef<number | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(getStoredGoogleToken);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('lumina_dark_mode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  // Auth: listen for session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.provider_token) {
        setGoogleAccessToken(data.session.provider_token);
        storeGoogleTokens(data.session.provider_token, data.session.provider_refresh_token);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
        storeGoogleTokens(session.provider_token, session.provider_refresh_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Native deep link handler — must live here (top level) so it's always registered
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapApp.addListener('appUrlOpen', async ({ url }) => {
      console.log('[Auth] appUrlOpen received:', url);
      if (!url.includes('login-callback')) return;
      try {
        // Supabase returns tokens in the hash fragment (implicit flow)
        const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const provider_token = params.get('provider_token');
        const provider_refresh_token = params.get('provider_refresh_token');

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            console.error('[Auth] setSession error:', error.message);
          } else {
            console.log('[Auth] Session set, user:', data.session?.user?.email);
            const token = provider_token ?? data.session?.provider_token;
            if (token) {
              setGoogleAccessToken(token);
              storeGoogleTokens(token, provider_refresh_token ?? data.session?.provider_refresh_token);
            }
          }
        } else {
          // Fallback: PKCE code flow
          const code = params.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) console.error('[Auth] exchangeCodeForSession error:', error.message);
            else if (data.session?.provider_token) {
              setGoogleAccessToken(data.session.provider_token);
              storeGoogleTokens(data.session.provider_token, data.session.provider_refresh_token);
            }
          }
        }
      } catch (e) {
        console.error('[Auth] Deep link handling error:', e);
      } finally {
        await Browser.close().catch(() => {});
      }
    });
    return () => { listenerPromise.then(l => l.remove()); };
  }, []);

  // Load user data from Supabase when session is available
  useEffect(() => {
    if (!session) return;

    const userId = session.user.id;
    setSyncEmail(session.user.email ?? '');

    const loadData = async () => {
      const [weddingsRes, eventsRes] = await Promise.all([
        supabase.from('weddings').select('*').eq('user_id', userId),
        supabase.from('google_events').select('*').eq('user_id', userId),
      ]);

      if (weddingsRes.error) console.error('weddings fetch:', weddingsRes.error);
      if (eventsRes.error) console.error('google_events fetch:', eventsRes.error);

      const dbWeddings = (weddingsRes.data ?? []) as Wedding[];
      const dbEvents = (eventsRes.data ?? []) as GoogleCalendarEvent[];

      // Seed demo data into the DB exactly once per account (first sign-in on this
      // device with an empty account). An emptied account stays empty afterwards.
      const seededKey = `lumina_seeded_${userId}`;
      const isFirstLogin = !weddingsRes.error && !eventsRes.error
        && dbWeddings.length === 0 && dbEvents.length === 0
        && !localStorage.getItem(seededKey);

      if (isFirstLogin) {
        const demoWeddings = buildDemoWeddings();
        const demoEvents = buildDemoGoogleEvents();
        const [wErr, gErr] = await Promise.all([
          supabase.from('weddings').insert(demoWeddings.map(w => ({ ...w, user_id: userId }))),
          supabase.from('google_events').insert(demoEvents.map(e => ({ ...e, user_id: userId }))),
        ]);
        if (wErr.error) console.error('demo weddings seed:', wErr.error);
        if (gErr.error) console.error('demo google_events seed:', gErr.error);
        setWeddings(demoWeddings);
        setGoogleEvents(demoEvents);
      } else {
        setWeddings(dbWeddings);
        setGoogleEvents(dbEvents);
      }
      localStorage.setItem(seededKey, '1');

      // select('*') so an optional column (e.g. sync_email) missing from the
      // schema doesn't break loading the rest of the preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (prefs) {
        if (prefs.studio_name) setStudioName(prefs.studio_name);
        if (prefs.sync_active != null) setSyncActive(prefs.sync_active);
        if (prefs.sync_email) setSyncEmail(prefs.sync_email);
      }
    };

    loadData().catch(err => console.error('initial data load failed:', err));
  }, [session]);

  // Keep .dark class on <html> in sync with state
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const userId = session?.user.id;

  // Supabase write helpers
  const syncToSupabase = async (updatedList: Wedding[]) => {
    setWeddings(updatedList);
    if (!userId) return;
    // Upsert full list — simple approach for now
    const { error } = await supabase.from('weddings').upsert(
      updatedList.map(w => ({ ...w, user_id: userId })),
      { onConflict: 'id' }
    );
    if (error) console.error('weddings upsert failed:', error);
  };

  const syncGoogleEventsToSupabase = async (updatedEvents: GoogleCalendarEvent[]) => {
    setGoogleEvents(updatedEvents);
    if (!userId) return;
    const { error } = await supabase.from('google_events').upsert(
      updatedEvents.map(e => ({ ...e, user_id: userId })),
      { onConflict: 'id' }
    );
    if (error) console.error('google_events upsert failed:', error);
  };

  const upsertPreference = async (patch: Record<string, unknown>) => {
    if (!userId) return;
    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
    if (error) console.error('user_preferences upsert failed:', error);
  };

  const handleUpdateStudioName = (name: string) => {
    setStudioName(name);
    upsertPreference({ studio_name: name });
  };

  const handleToggleSyncActive = (active: boolean) => {
    setSyncActive(active);
    upsertPreference({ sync_active: active });
  };

  const handleUpdateSyncEmail = (email: string) => {
    setSyncEmail(email);
    // Persist after the user stops typing (column: user_preferences.sync_email)
    window.clearTimeout(syncEmailTimer.current);
    syncEmailTimer.current = window.setTimeout(() => upsertPreference({ sync_email: email }), 800);
  };

  const handleToggleDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('lumina_dark_mode', String(dark)); // preference stays local
  };

  const handleSignOut = async () => {
    clearGoogleTokens();
    setGoogleAccessToken(null);
    await supabase.auth.signOut();
  };

  // Token unusable and refresh failed (revoked, or granted under the old
  // read-only scope). Clearing it makes the sync button start a fresh consent flow.
  const handleGoogleAuthExpired = () => {
    clearGoogleTokens();
    setGoogleAccessToken(null);
    showToast({
      tone: 'error',
      title: 'Google Calendar Disconnected',
      message: 'Access expired or is missing write permission. Press "Re-trigger Active Sync" on the Calendar tab to reconnect.',
    });
  };

  // Runs a Google API call, transparently refreshing the access token once
  // when Google rejects it (tokens expire after ~1 hour).
  const runGoogleApi = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    if (!googleAccessToken) throw new GoogleAuthError('Google account not connected');
    try {
      return await fn(googleAccessToken);
    } catch (err) {
      if (!(err instanceof GoogleAuthError)) throw err;
      const refreshed = await tryRefreshGoogleToken();
      if (!refreshed) throw err;
      setGoogleAccessToken(refreshed);
      return fn(refreshed);
    }
  };

  const handleAddGoogleEvent = async (event: GoogleCalendarEvent) => {
    let saved = event;
    let authExpired = false;
    try {
      const googleId = await runGoogleApi(token => createGoogleCalendarEvent(token, {
        title: event.title,
        date: event.date,
        time: event.time,
        description: event.description,
      }));
      saved = { ...event, id: googleId };
    } catch (err) {
      // Keep the block locally either way so the user's input isn't lost
      if (err instanceof GoogleAuthError) authExpired = true;
      else console.error('Google event create failed, saving locally only:', err);
    }
    await syncGoogleEventsToSupabase([saved, ...googleEvents]);
    if (authExpired) handleGoogleAuthExpired();
    else if (saved.id !== event.id) {
      showToast({ tone: 'success', title: 'Date Blocked on Google', message: `"${event.title}" was added to your Google Calendar.` });
    }
  };

  const handleDeleteGoogleEvent = async (id: string) => {
    // Events that exist on Google must be deleted there first,
    // otherwise the next sync just re-imports them.
    if (!isLocalOnlyEvent(id)) {
      try {
        await runGoogleApi(token => deleteGoogleCalendarEvent(token, id));
      } catch (err) {
        if (err instanceof GoogleAuthError) {
          handleGoogleAuthExpired();
        } else {
          console.error('Google event delete failed:', err);
          showToast({ tone: 'error', title: 'Delete Failed', message: 'Could not delete this event from Google Calendar. Please try again.' });
        }
        return;
      }
    }

    setGoogleEvents(prev => prev.filter(e => e.id !== id));
    if (userId) {
      const { error } = await supabase.from('google_events').delete().eq('id', id).eq('user_id', userId);
      if (error) console.error('google_events delete failed:', error);
    }
  };

  const handleTriggerSyncRefresh = async () => {
    if (!googleAccessToken) {
      // Token lost or never granted — run the (native-safe) consent flow
      const errMsg = await signInWithGoogle();
      if (errMsg) console.error('Google sign-in failed:', errMsg);
      return;
    }

    setIsSyncing(true);
    try {
      const fetched = await runGoogleApi(token => listGoogleCalendarEvents(token));
      // Wedding bookings we pushed to Google come back in the feed —
      // hide them so each wedding isn't shown twice on the calendar
      const weddingEventIds = new Set(weddings.map(w => w.googleEventId).filter(Boolean));
      const external = fetched.filter(e => !weddingEventIds.has(e.id));
      // Keep manual local-only blocks; everything else mirrors Google
      const localBlocks = googleEvents.filter(e => isLocalOnlyEvent(e.id));
      const merged = [...external, ...localBlocks];
      setGoogleEvents(merged);

      if (userId) {
        // Drop synced rows that no longer exist on Google, then mirror the fresh list
        const { error: delError } = await supabase
          .from('google_events')
          .delete()
          .eq('user_id', userId)
          .not('id', 'like', 'g-custom-%');
        if (delError) console.error('google_events reconcile delete failed:', delError);

        const { error: upError } = await supabase.from('google_events').upsert(
          merged.map(e => ({ ...e, user_id: userId })),
          { onConflict: 'id' }
        );
        if (upError) console.error('google_events upsert failed:', upError);
      }

      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      if (err instanceof GoogleAuthError) handleGoogleAuthExpired();
      else console.error('Calendar sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddWedding = async (wedding: Wedding) => {
    // Push the booking to Google Calendar; never block the local save on it
    let saved = wedding;
    try {
      const googleId = await runGoogleApi(token => createGoogleCalendarEvent(token, weddingToEventInput(wedding)));
      saved = { ...wedding, googleEventId: googleId };
    } catch (err) {
      if (err instanceof GoogleAuthError) console.warn('Google not connected — wedding saved locally only');
      else console.error('Could not create wedding on Google Calendar:', err);
    }

    syncToSupabase([saved, ...weddings]);
    setSelectedTab('weddings');
    setPreselectedFormDate('');
    showToast({
      tone: 'success',
      title: 'Wedding Saved Successfully',
      message: saved.googleEventId
        ? 'The booking was also added to your Google Calendar. Open the weddings tab for board details.'
        : 'Saved to your studio workspace. Connect Google on the Calendar tab to mirror bookings there too.',
    });
  };

  const handleDeleteWedding = async (id: string) => {
    const target = weddings.find(w => w.id === id);
    setWeddings(prev => prev.filter((w) => w.id !== id));

    // Best effort: also remove the mirrored Google Calendar event
    if (target?.googleEventId) {
      try {
        await runGoogleApi(token => deleteGoogleCalendarEvent(token, target.googleEventId!));
      } catch (err) {
        console.error('Google wedding event delete failed:', err);
      }
    }

    if (!userId) return;
    const { error } = await supabase.from('weddings').delete().eq('id', id).eq('user_id', userId);
    if (error) console.error('weddings delete failed:', error);
  };

  const handleUpdateWedding = async (updatedWedding: Wedding) => {
    const previous = weddings.find(w => w.id === updatedWedding.id);
    syncToSupabase(weddings.map((w) => w.id === updatedWedding.id ? updatedWedding : w));
    setSelectedWedding(updatedWedding);

    // Only ping Google when something it displays actually changed
    const googleVisibleChange = previous && (
      previous.date !== updatedWedding.date ||
      previous.time !== updatedWedding.time ||
      previous.location !== updatedWedding.location ||
      previous.brideName !== updatedWedding.brideName ||
      previous.groomName !== updatedWedding.groomName
    );
    if (updatedWedding.googleEventId && googleVisibleChange) {
      try {
        await runGoogleApi(token => updateGoogleCalendarEvent(token, updatedWedding.googleEventId!, weddingToEventInput(updatedWedding)));
      } catch (err) {
        console.error('Google wedding event update failed:', err);
      }
    }
  };

  const handleResetData = async () => {
    if (!userId) return;
    const results = await Promise.all([
      supabase.from('weddings').delete().eq('user_id', userId),
      supabase.from('google_events').delete().eq('user_id', userId),
      supabase.from('user_preferences').delete().eq('user_id', userId),
    ]);
    results.forEach(({ error }) => { if (error) console.error('reset delete failed:', error); });
    localStorage.removeItem('lumina_dark_mode');

    // Re-seed fresh demo data (in the DB too, so it survives a refresh)
    const demoWeddings = buildDemoWeddings();
    const demoEvents = buildDemoGoogleEvents();
    const [wRes, gRes] = await Promise.all([
      supabase.from('weddings').insert(demoWeddings.map(w => ({ ...w, user_id: userId }))),
      supabase.from('google_events').insert(demoEvents.map(e => ({ ...e, user_id: userId }))),
    ]);
    if (wRes.error) console.error('demo weddings seed:', wRes.error);
    if (gRes.error) console.error('demo google_events seed:', gRes.error);

    setWeddings(demoWeddings);
    setGoogleEvents(demoEvents);
    setSyncActive(true);
    setStudioName('Lumina Wedding Studio');
  };

  const handleNavigateToNewWithDate = (date: string) => {
    setPreselectedFormDate(date);
    setSelectedTab('new-wedding');
  };

  // Auth guard
  if (session === undefined) {
    // Still resolving the stored session — show a branded splash instead of a blank flash
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg animate-pulse">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session === null) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-on-background dark:text-zinc-100 flex flex-col selection:bg-primary/20">
      
      {/* TopAppBar Shell */}
      <header className="fixed top-0 left-0 w-full z-45 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] h-16">
        <div className="flex items-center justify-between px-6 h-full w-full max-w-[1440px] mx-auto">
          
          <div className="flex items-center gap-3">
            {/* User avatar from Google OAuth */}
            <div 
              onClick={() => setSelectedTab('settings')}
              className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 active:scale-95 cursor-pointer bg-zinc-50 shrink-0"
            >
              {session.user.user_metadata?.avatar_url ? (
                <img 
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  src={session.user.user_metadata.avatar_url}
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {(session.user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <h1 
              onClick={() => setSelectedTab('home')}
              className="font-headline text-lg sm:text-xl font-extrabold text-primary dark:text-white select-none cursor-pointer tracking-tight"
            >
              {studioName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleDarkMode(!isDarkMode)}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-primary dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-red-500 dark:hover:text-red-400 active:scale-95 transition-all cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = weddings.filter(w => w.date >= today).length;
                showToast({
                  tone: 'info',
                  title: 'Studio Status',
                  message: `${upcoming} upcoming ${upcoming === 1 ? 'wedding' : 'weddings'} on the books${lastSyncedAt ? ` • Google feed synced at ${lastSyncedAt}` : ' • Google feed not synced yet this session'}.`,
                });
              }}
              className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-primary dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all text-center relative cursor-pointer font-semibold"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-zinc-950"></span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Layout Frame */}
      <main className="flex-1 pt-24 pb-28 px-6 max-w-[1440px] mx-auto w-full">
        <div className="animate-fade-in duration-200">
          
          {selectedTab === 'home' && (
            <DashboardView 
              weddings={weddings} 
              syncActive={syncActive}
              syncEmail={syncEmail}
              isSyncing={isSyncing}
              googleEvents={googleEvents}
              lastSyncedAt={lastSyncedAt}
              onSync={handleTriggerSyncRefresh}
              onSelectWedding={setSelectedWedding}
              onNavigateToTab={setSelectedTab}
            />
          )}

          {selectedTab === 'calendar' && (
            <CalendarView 
              weddings={weddings} 
              googleEvents={googleEvents}
              syncActive={syncActive}
              syncEmail={syncEmail}
              isSyncing={isSyncing}
              onSelectWedding={setSelectedWedding}
              onNavigateToNewWithDate={handleNavigateToNewWithDate}
              onToggleSyncActive={handleToggleSyncActive}
              onUpdateSyncEmail={handleUpdateSyncEmail}
              onSync={handleTriggerSyncRefresh}
              onAddGoogleEvent={handleAddGoogleEvent}
              onDeleteGoogleEvent={handleDeleteGoogleEvent}
            />
          )}

          {selectedTab === 'weddings' && (
            <WeddingsListView 
              weddings={weddings} 
              onSelectWedding={setSelectedWedding}
              onDeleteWedding={handleDeleteWedding}
            />
          )}

          {selectedTab === 'new-wedding' && (
            <NewWeddingFormView
              initialDate={preselectedFormDate}
              weddings={weddings}
              googleEvents={googleEvents}
              onAddWedding={handleAddWedding}
              onCancel={() => setSelectedTab('weddings')}
            />
          )}

          {selectedTab === 'settings' && (
            <SettingsView 
              studioName={studioName}
              onUpdateStudioName={handleUpdateStudioName}
              onResetData={handleResetData}
            />
          )}

        </div>
      </main>

      {/* Floating Action Button (FAB) and notifications prompt */}
      {selectedTab !== 'new-wedding' && (
        <button 
          onClick={() => setSelectedTab('new-wedding')}
          className="fixed right-6 bottom-24 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center z-50 hover:scale-105 active:scale-90 transition-transform cursor-pointer group hover:bg-primary-container"
        >
          <Plus className="w-7 h-7" />
          <span className="absolute right-16 bg-zinc-900 border border-zinc-800 text-white px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase">
            Add New Wedding
          </span>
        </button>
      )}

      {/* Sticky toast notification box */}
      {toast && (
        <div className="fixed bottom-24 left-6 z-100 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl max-w-sm flex items-start gap-3 animate-slide-up backdrop-blur-md">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            toast.tone === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              : toast.tone === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                : 'bg-primary/10 text-primary dark:text-zinc-200'
          }`}>
            {toast.tone === 'success' ? <Check className="w-4 h-4" /> : toast.tone === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface dark:text-zinc-100 leading-tight">{toast.title}</p>
            <p className="text-xs text-zinc-400 mt-1">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-200 text-xs font-bold cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Nav Bar Shell */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-6 pb-safe bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shadow-[0px_-4px_20px_rgba(0,0,0,0.02)] z-40 rounded-t-2xl max-w-[1440px] mx-auto left-1/2 sm:w-[500px] sm:rounded-2xl sm:bottom-4 sm:border sm:shadow-lg lg:w-[600px] -translate-x-1/2">
        
        {/* Tab 1: Home */}
        <button 
          onClick={() => setSelectedTab('home')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
            selectedTab === 'home' 
              ? 'bg-primary/20 text-primary dark:text-white font-bold scale-105 shadow-sm' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-headline font-semibold tracking-wide mt-1">Home</span>
        </button>

        {/* Tab 2: Calendar */}
        <button 
          onClick={() => setSelectedTab('calendar')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
            selectedTab === 'calendar' 
              ? 'bg-primary/20 text-primary dark:text-white font-bold scale-105 shadow-sm' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-headline font-semibold tracking-wide mt-1">Calendar</span>
        </button>

        {/* Tab 3: Weddings */}
        <button 
          onClick={() => setSelectedTab('weddings')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
            selectedTab === 'weddings' 
              ? 'bg-primary/20 text-primary dark:text-white font-bold scale-105 shadow-sm' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Award className="w-5 h-5" />
          <span className="text-[10px] font-headline font-semibold tracking-wide mt-1">Weddings</span>
        </button>

        {/* Tab 4: Settings */}
        <button 
          onClick={() => setSelectedTab('settings')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
            selectedTab === 'settings' 
              ? 'bg-primary/20 text-primary dark:text-white font-bold scale-105 shadow-sm' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] font-headline font-semibold tracking-wide mt-1">Settings</span>
        </button>

      </nav>

      {/* Wedding Board Modal Details Flyout */}
      {selectedWedding && (
        <WeddingBoardModal 
          wedding={selectedWedding}
          onClose={() => setSelectedWedding(null)}
          onUpdateWedding={handleUpdateWedding}
        />
      )}

    </div>
  );
}
