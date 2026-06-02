/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, Calendar as CalendarIcon, Award, Settings as SettingsIcon, 
  Bell, Plus, Heart, Sparkles, Check, ChevronRight, Sun, Moon, LogOut
} from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import { Wedding, GoogleCalendarEvent } from './types';
import { INITIAL_WEDDINGS, INITIAL_GOOGLE_EVENTS } from './data';
import { supabase } from './lib/supabase';

import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import WeddingsListView from './components/WeddingsListView';
import NewWeddingFormView from './components/NewWeddingFormView';
import WeddingBoardModal from './components/WeddingBoardModal';
import SettingsView from './components/SettingsView';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const [selectedTab, setSelectedTab] = useState<'home' | 'calendar' | 'weddings' | 'settings' | 'new-wedding'>('home');
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);
  const [studioName, setStudioName] = useState('Lumina Wedding Studio');
  const [preselectedFormDate, setPreselectedFormDate] = useState('');
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  // Google Calendar Shared States
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [syncActive, setSyncActive] = useState(true);
  const [syncEmail, setSyncEmail] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    () => localStorage.getItem('lumina_google_token')
  );
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
      // provider_token is available right after OAuth redirect
      if (data.session?.provider_token) {
        setGoogleAccessToken(data.session.provider_token);
        localStorage.setItem('lumina_google_token', data.session.provider_token);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
        localStorage.setItem('lumina_google_token', session.provider_token);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase when session is available
  useEffect(() => {
    if (!session) return;

    const userId = session.user.id;
    // Pre-fill syncEmail from Google OAuth provider data
    const googleIdentity = session.user.identities?.find(i => i.provider === 'google');
    const email = session.user.email ?? '';
    setSyncEmail(email);

    // Load weddings
    supabase
      .from('weddings')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) { console.error('weddings fetch:', error); return; }
        setWeddings(data && data.length > 0 ? data as Wedding[] : INITIAL_WEDDINGS);
      });

    // Load google events
    supabase
      .from('google_events')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) { console.error('google_events fetch:', error); return; }
        setGoogleEvents(data && data.length > 0 ? data as GoogleCalendarEvent[] : INITIAL_GOOGLE_EVENTS);
      });

    // Load preferences
    supabase
      .from('user_preferences')
      .select('studio_name, sync_active')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.studio_name) setStudioName(data.studio_name);
          if (data.sync_active != null) setSyncActive(data.sync_active);
        }
      });
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
    await supabase.from('weddings').upsert(
      updatedList.map(w => ({ ...w, user_id: userId })),
      { onConflict: 'id' }
    );
  };

  const syncGoogleEventsToSupabase = async (updatedEvents: GoogleCalendarEvent[]) => {
    setGoogleEvents(updatedEvents);
    if (!userId) return;
    await supabase.from('google_events').upsert(
      updatedEvents.map(e => ({ ...e, user_id: userId })),
      { onConflict: 'id' }
    );
  };

  const upsertPreference = async (patch: Record<string, unknown>) => {
    if (!userId) return;
    await supabase.from('user_preferences').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
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
  };

  const handleToggleDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('lumina_dark_mode', String(dark)); // preference stays local
  };

  const handleSignOut = async () => {
    localStorage.removeItem('lumina_google_token');
    setGoogleAccessToken(null);
    await supabase.auth.signOut();
  };

  const handleAddGoogleEvent = (event: GoogleCalendarEvent) => {
    const updated = [event, ...googleEvents];
    syncGoogleEventsToSupabase(updated);
  };

  const handleDeleteGoogleEvent = (id: string) => {
    const updated = googleEvents.filter(e => e.id !== id);
    syncGoogleEventsToSupabase(updated);
    if (userId) supabase.from('google_events').delete().eq('id', id).eq('user_id', userId);
  };

  const handleTriggerSyncRefresh = async () => {
    if (!googleAccessToken) {
      // Token lost after page refresh — need user to re-authenticate
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: window.location.origin,
          queryParams: { prompt: 'consent', access_type: 'offline' },
        },
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch next 50 events from the user's primary Google Calendar
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (res.status === 401) {
        // Token expired — clear it and ask user to reconnect
        localStorage.removeItem('lumina_google_token');
        setGoogleAccessToken(null);
        setIsSyncing(false);
        return;
      }

      if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);

      const data = await res.json();
      const fetched: GoogleCalendarEvent[] = (data.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.summary ?? '(No title)',
        date: (item.start?.date ?? item.start?.dateTime ?? '').slice(0, 10),
        time: item.start?.dateTime
          ? new Date(item.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'All Day',
        duration: item.end?.dateTime && item.start?.dateTime
          ? `${Math.round((new Date(item.end.dateTime).getTime() - new Date(item.start.dateTime).getTime()) / 60000)} min`
          : 'All Day',
        description: item.description ?? '',
        calendarName: 'Primary',
      }));

      await syncGoogleEventsToSupabase(fetched);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Calendar sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddWedding = (wedding: Wedding) => {
    const updated = [wedding, ...weddings];
    syncToSupabase(updated);
    setSelectedTab('weddings');
    setPreselectedFormDate('');
    setShowNotificationAlert(true);
    setTimeout(() => setShowNotificationAlert(false), 4500);
  };

  const handleDeleteWedding = (id: string) => {
    const updated = weddings.filter((w) => w.id !== id);
    syncToSupabase(updated);
    if (userId) supabase.from('weddings').delete().eq('id', id).eq('user_id', userId);
  };

  const handleUpdateWedding = (updatedWedding: Wedding) => {
    const updated = weddings.map((w) => w.id === updatedWedding.id ? updatedWedding : w);
    syncToSupabase(updated);
    setSelectedWedding(updatedWedding);
  };

  const handleResetData = () => {
    if (!userId) return;
    supabase.from('weddings').delete().eq('user_id', userId);
    supabase.from('google_events').delete().eq('user_id', userId);
    supabase.from('user_preferences').delete().eq('user_id', userId);
    localStorage.removeItem('lumina_dark_mode');
    setWeddings(INITIAL_WEDDINGS);
    setGoogleEvents(INITIAL_GOOGLE_EVENTS);
    setSyncActive(true);
    setStudioName('Lumina Wedding Studio');
  };

  const handleNavigateToNewWithDate = (date: string) => {
    setPreselectedFormDate(date);
    setSelectedTab('new-wedding');
  };

  // Auth guard
  if (session === undefined) {
    // Still loading session — show nothing to avoid flash
    return <div className="min-h-screen bg-slate-50 dark:bg-zinc-950" />;
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
              className="p-2 rounded-full border border-zinc-150 dark:border-zinc-800 text-primary dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full border border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-red-500 dark:hover:text-red-400 active:scale-95 transition-all cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                alert('Opening system notifications panel. Everything is perfectly synchronized.');
              }}
              className="p-2 rounded-full border border-zinc-150 dark:border-zinc-800 text-primary dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all text-center relative cursor-pointer font-semibold"
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

      {/* Sticky popup notification box */}
      {showNotificationAlert && (
        <div className="fixed bottom-24 left-6 z-100 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-xl max-w-sm flex items-start gap-3 animate-slide-up bg-opacity-95 backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface dark:text-zinc-100 leading-tight">Wedding Saved Successfully</p>
            <p className="text-xs text-zinc-400 mt-1">
              Check out the weddings tab to access customer board details or call the Smart Assistant!
            </p>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar Shell */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-6 pb-safe bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shadow-[0px_-4px_20px_rgba(0,0,0,0.02)] z-40 rounded-t-2xl max-w-[1440px] mx-auto left-1/2 -smart-translate-x-1/2 sm:w-[500px] sm:rounded-2xl sm:bottom-4 sm:border sm:shadow-lg lg:w-[600px] -translate-x-1/2">
        
        {/* Tab 1: Home */}
        <button 
          onClick={() => setSelectedTab('home')}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all duration-150 cursor-pointer ${
            selectedTab === 'home' 
              ? 'bg-primary/20 text-primary dark:text-white font-bold scale-105 shadow-sm' 
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300'
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
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300'
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
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300'
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
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-300'
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
