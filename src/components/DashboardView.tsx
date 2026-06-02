/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, Award, Grid, RefreshCw, CheckCircle2, Clapperboard, 
  MapPin, Clock, ExternalLink, CalendarDays, Sliders, ToggleLeft, ToggleRight, Loader2, Sparkles,
  ChevronRight, Compass, ShieldCheck, HelpCircle
} from 'lucide-react';
import { Wedding, GoogleCalendarEvent } from '../types';

interface DashboardViewProps {
  weddings: Wedding[];
  syncActive: boolean;
  syncEmail: string;
  isSyncing: boolean;
  googleEvents: GoogleCalendarEvent[];
  lastSyncedAt: string | null;
  onSync: () => void;
  onSelectWedding: (wedding: Wedding) => void;
  onNavigateToTab: (tabName: 'weddings' | 'calendar' | 'new-wedding') => void;
}

export default function DashboardView({ 
  weddings, 
  syncActive,
  syncEmail,
  isSyncing,
  googleEvents,
  lastSyncedAt,
  onSync,
  onSelectWedding, 
  onNavigateToTab 
}: DashboardViewProps) {
  
  // Derive stats dynamically from our local storage list
  const today = new Date().toISOString().split('T')[0];
  const totalBookingsCount = weddings.length;
  const upcomingCount = weddings.filter(w => w.date >= today).length;

  // Next 3 upcoming bookings sorted by nearest date
  const upcomingWeddings = [...weddings]
    .filter(w => w.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const statusColors = {
    'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Pending Deposit': 'bg-orange-100 text-orange-850 dark:bg-orange-950/30 dark:text-orange-400',
    'Signed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Final Prep': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'Pending Edit': 'bg-indigo-100 text-indigo-805 dark:bg-indigo-900/30 dark:text-indigo-400'
  };

  return (
    <div className="space-y-6">
      
      {/* Quick Dashboard Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-zinc-400 dark:text-zinc-500 font-headline text-xs font-bold uppercase tracking-wider">
              Total Studio Bookings
            </p>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface dark:text-white">
              {totalBookingsCount}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-zinc-400 dark:text-zinc-500 font-headline text-xs font-bold uppercase tracking-wider">
              Upcoming Shoots
            </p>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface dark:text-white">
              {upcomingCount}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Next 3 Scheduled Shoots */}
        <section className="lg:col-span-5 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-headline font-extrabold text-on-surface dark:text-zinc-100">
                  Next 3 Scheduled Shoots
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-zinc-400">Essential shoot preparation tasks</p>
              </div>
              <button 
                onClick={() => onNavigateToTab('weddings')}
                className="p-1.5 text-zinc-405 hover:text-primary transition-colors cursor-pointer"
                title="View Full List"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingWeddings.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-400">No upcoming shoots scheduled.</p>
                  <button onClick={() => onNavigateToTab('new-wedding')} className="mt-2 text-xs text-primary font-bold hover:underline cursor-pointer">Add a new wedding →</button>
                </div>
              ) : upcomingWeddings.map((wedding) => (
                <div 
                  key={wedding.id}
                  onClick={() => onSelectWedding(wedding)}
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/45 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:border-primary/45 hover:shadow-sm cursor-pointer transition-all duration-250 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[10px] font-headline font-black text-primary dark:text-zinc-300 tracking-wider uppercase">
                        {new Date(wedding.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h4 className="font-headline font-bold text-base text-on-surface dark:text-zinc-100 group-hover:text-primary dark:group-hover:text-white transition-colors">
                        {wedding.brideName} &amp; {wedding.groomName}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${statusColors[wedding.status]}`}>
                      {wedding.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant dark:text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-primary dark:text-zinc-450 shrink-0" />
                    <span className="truncate">{wedding.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigateToTab('new-wedding')}
            className="mt-6 w-full py-2.5 border border-primary dark:border-zinc-700 text-primary dark:text-white hover:bg-primary/[0.04] dark:hover:bg-zinc-800 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center"
          >
            Create New Wedding Entry
          </button>
        </section>

        {/* Right Column: Google Calendar Unified Sync Dashboard Status */}
        <section className="lg:col-span-7 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div id="google-calendar-sync-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[9px] font-headline font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5">
                  Universal Sync Engine
                </span>
                <h3 className="text-xl font-headline font-extrabold text-on-surface dark:text-zinc-100">
                  Google Calendar Feed
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1 flex items-center gap-1.5 font-semibold">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${syncActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}></span>
                  {syncActive ? 'Linked • Active Cloud Listener' : 'Connection Link Paused'}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <button 
                  onClick={onSync}
                  disabled={isSyncing || !syncActive}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary dark:text-zinc-200 font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer disabled:opacity-40 transition-colors"
                >
                  {isSyncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync Now
                </button>
                {lastSyncedAt && (
                  <p className="text-[9px] text-zinc-400 font-medium">Last synced {lastSyncedAt}</p>
                )}
              </div>
            </div>

            {/* Live Google Events Feed */}
            <div className="relative bg-slate-50 dark:bg-zinc-800/20 rounded-2xl border border-zinc-150 dark:border-zinc-800 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-amber-500 to-primary"></div>

              {!syncActive ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-on-surface dark:text-zinc-200 mb-1">Sync Link Inactive</p>
                  <p className="text-xs text-zinc-400">Enable Google Sync on the Calendar tab to overlay external blockouts.</p>
                </div>
              ) : googleEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-on-surface dark:text-zinc-200 mb-1">No External Blocks Found</p>
                  <p className="text-xs text-zinc-400">Trigger a sync or add blocks from the Calendar tab.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[270px] overflow-y-auto no-scrollbar">
                  {[...googleEvents]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(event => (
                      <div key={event.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface dark:text-zinc-100 truncate">{event.title}</p>
                          <p className="text-[10px] text-zinc-400">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.time}
                          </p>
                        </div>
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full shrink-0 max-w-[70px] truncate">
                          {event.calendarName?.split(' ')[0]}
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('calendar')}
            className="w-full mt-6 bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Open Unified Calendar &amp; Manage Sync Settings
          </button>
        </section>

      </div>
    </div>
  );
}
