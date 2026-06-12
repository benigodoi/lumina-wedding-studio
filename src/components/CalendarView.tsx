/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Landmark, CheckCircle, Mail, MapPin,
  RefreshCw, ToggleLeft, ToggleRight, Plus, Trash2, Loader2, AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';
import { Wedding, GoogleCalendarEvent } from '../types';

interface CalendarViewProps {
  weddings: Wedding[];
  googleEvents: GoogleCalendarEvent[];
  syncActive: boolean;
  syncEmail: string;
  isSyncing: boolean;
  onSelectWedding: (wedding: Wedding) => void;
  onNavigateToNewWithDate: (date: string) => void;
  onToggleSyncActive: (active: boolean) => void;
  onUpdateSyncEmail: (email: string) => void;
  onSync: () => void;
  onAddGoogleEvent: (event: GoogleCalendarEvent) => void;
  onDeleteGoogleEvent: (id: string) => void;
}



export default function CalendarView({ 
  weddings, 
  googleEvents,
  syncActive,
  syncEmail,
  isSyncing,
  onSelectWedding, 
  onNavigateToNewWithDate,
  onToggleSyncActive,
  onUpdateSyncEmail,
  onSync,
  onAddGoogleEvent,
  onDeleteGoogleEvent
}: CalendarViewProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDayFocus, setSelectedDayFocus] = useState<string | null>(null);

  // Dynamically computed calendar values
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const startOffset = (firstDayOfWeek + 6) % 7; // Convert to Mon=0 … Sun=6
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const previousDates = Array.from({ length: startOffset }, (_, i) => prevMonthLastDay - startOffset + 1 + i);
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Custom Google Block Form States
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockTime, setNewBlockTime] = useState('10:00');
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockCategory, setNewBlockCategory] = useState('Primary Studio Feed');

  // Selected Google Event detail view state
  const [focusedGoogleEvent, setFocusedGoogleEvent] = useState<GoogleCalendarEvent | null>(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const buildDateStr = (dayNum: number) => {
    const paddedMonth = String(currentMonth + 1).padStart(2, '0');
    return `${currentYear}-${paddedMonth}-${String(dayNum).padStart(2, '0')}`;
  };

  // Filter local weddings for the day
  const getWeddingsOnDay = (dayNum: number): Wedding[] => {
    const dateStr = buildDateStr(dayNum);
    return weddings.filter(w => w.date === dateStr);
  };

  // Filter Google calendar events for the day
  const getGoogleEventsOnDay = (dayNum: number): GoogleCalendarEvent[] => {
    if (!syncActive) return [];
    const dateStr = buildDateStr(dayNum);
    return googleEvents.filter(e => e.date === dateStr);
  };

  // Quick helper to handle block creation
  const handleCreateBlockoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim() || !newBlockDate) {
      alert('Please fill out a Title and Date to block Google Calendar schedules.');
      return;
    }

    const uniqueId = `g-custom-${Date.now()}`;
    const blockEvent: GoogleCalendarEvent = {
      id: uniqueId,
      title: newBlockTitle.trim(),
      date: newBlockDate,
      time: newBlockTime,
      duration: '2 hours',
      description: 'Manually logged external blocking commitment.',
      calendarName: newBlockCategory
    };

    onAddGoogleEvent(blockEvent);
    setNewBlockTitle('');
    // Clear selected focus
    setSelectedDayFocus(null);
  };

  const handleSelectDayForPrepopulation = (dateStr: string) => {
    setSelectedDayFocus(dateStr);
    setNewBlockDate(dateStr);
  };

  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      
      {/* Central Left Side: Single Consolidated Month Calendar Grid */}
      <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
        
        {/* Calendar Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-headline font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-block mb-1.5">
                Consolidated Operations Calendar
              </p>
              <h2 className="text-2xl font-headline font-extrabold text-on-surface dark:text-zinc-100 flex items-center gap-2">
                {monthName}
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
                Displaying brand wedding bookings and external Google Calendar commits synchronously.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* Prev / Next Buttons */}
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 transition-colors"
                title="Previous Month"
                id="cal-prev-month-button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 transition-colors"
                title="Next Month"
                id="cal-next-month-button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week Day Labels */}
          <div className="grid grid-cols-7 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            {dayHeaders.map((hdr) => (
              <div key={hdr} className="text-center font-headline text-[10px] sm:text-xs font-black text-on-surface-variant dark:text-zinc-400 py-2.5 tracking-wider">
                {hdr}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Previous Month Faded Cells */}
            {previousDates.map((pDay) => (
              <div 
                key={`prev-${pDay}`}
                className="h-28 border border-transparent p-2 text-zinc-300 dark:text-zinc-700 font-headline text-[11px] select-none"
              >
                {pDay}
              </div>
            ))}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayWeddings = getWeddingsOnDay(dayNum);
              const dayGoogleEvents = getGoogleEventsOnDay(dayNum);
              
              const hasWedding = dayWeddings.length > 0;
              const hasGoogle = dayGoogleEvents.length > 0;

              const dayDateStr = buildDateStr(dayNum);
              const isFocused = selectedDayFocus === dayDateStr;

              return (
                <div 
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectDayForPrepopulation(dayDateStr)}
                  className={`group h-28 border rounded-xl p-2 flex flex-col justify-between hover:border-primary/50 cursor-pointer transition-all relative ${
                    isFocused 
                      ? 'ring-2 ring-primary border-primary bg-zinc-50/50 dark:bg-zinc-800/10' 
                      : hasWedding 
                        ? 'border-primary/30 bg-primary/[0.02] dark:bg-primary/[0.01]'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                  id={`day-cell-${dayDateStr}`}
                >
                  {/* Day Number Header */}
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className={`${hasWedding ? 'text-primary dark:text-white' : hasGoogle ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {dayNum}
                    </span>
                    
                    {/* Tiny dots indicator */}
                    <div className="flex gap-1">
                      {hasWedding && <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Lumina Wedding Booking"></span>}
                      {hasGoogle && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Google Sync Commit"></span>}
                    </div>
                  </div>

                  {/* Combined Calendar Events Area */}
                  <div className="space-y-1 overflow-y-auto max-h-[70px] no-scrollbar select-none">
                    
                    {/* 1. Local Wedding Events */}
                    {dayWeddings.map((w) => (
                      <div 
                        key={w.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWedding(w);
                        }}
                        className="bg-primary hover:brightness-105 text-white font-headline text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate shadow-sm transition-transform active:scale-95"
                        title={`Wedding: ${w.brideName} & ${w.groomName}`}
                      >
                        💍 {w.brideName} &amp; {w.groomName}
                      </div>
                    ))}

                    {/* 2. Synced Google Calendar Events */}
                    {dayGoogleEvents.map((g) => (
                      <div 
                        key={g.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedGoogleEvent(g);
                        }}
                        className="bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 border-l-2 border-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 font-headline text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded truncate transition-colors"
                        title={`Google Block: ${g.title}`}
                      >
                        🗓️ {g.title}
                      </div>
                    ))}
                    
                    {/* Visual spacer signifier */}
                    {!hasWedding && !hasGoogle && (
                      <span className="text-[9px] text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity font-bold block text-right mt-auto">
                        + Select
                      </span>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Legend Indicator footer */}
        <div className="mt-6 flex flex-wrap items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-on-surface-variant dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-primary"></span>
            <span>Lumina Studio Bookings (Teal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500"></span>
            <span>Google Synced Commits (Amber)</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-zinc-400 italic font-semibold">
            <span>💡 Click empty space to focus blockouts generator</span>
          </div>
        </div>

      </div>

      {/* Central Right Side: Integrated Google Calendar Admin Deck */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Google Sync Link Connection Deck */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-headline font-extrabold text-on-surface dark:text-zinc-100">
              Google Sync Console
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400">
              Control the live connection feed, emails, and automatic calendar imports.
            </p>
          </div>

          {/* Sync Switch Row */}
          <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${syncActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`}></span>
              <div className="flex flex-col">
                <span className="text-xs font-bold">Google Calendar Sync</span>
                <span className="text-[10px] text-zinc-400">{syncActive ? 'Feed Linked' : 'Feed Suspended'}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => onToggleSyncActive(!syncActive)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 rounded-lg transition-colors"
              title="Toggle Google Calendar sync connection"
              id="google-sync-toggle"
            >
              {syncActive ? (
                <ToggleRight className="w-8 h-8 text-primary" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-zinc-300" />
              )}
            </button>
          </div>

          {/* Sync Address Target */}
          <div className="space-y-2">
            <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
              Active Authorized Google Feed Account
            </label>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-outline-variant rounded-xl p-1.5 pr-2.5">
              <input 
                type="email" 
                value={syncEmail}
                onChange={(e) => onUpdateSyncEmail(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none px-2 py-1.5 flex-1 select-all"
                placeholder="e.g. your-studio@gmail.com"
                id="google-sync-email-input"
              />
              <span className={`text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 ${syncActive ? 'text-primary' : 'text-zinc-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" /> {syncActive ? 'LINKED' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Sync action button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing || !syncActive}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
            id="google-sync-refresh-button"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synchronizing Feed...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Re-trigger Active Sync
              </>
            )}
          </button>
        </section>

        {/* Sync Day Schedule Blockout Generator */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-headline font-extrabold text-on-surface dark:text-zinc-100 inline-flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-primary" /> Log Google Busy Block
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400">
              Block external non-wedding events, team holidays, or gear calibrations directly.
            </p>
          </div>

          <form onSubmit={handleCreateBlockoutSubmit} className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-400">
                Block Title / Reason *
              </label>
              <input 
                type="text"
                required
                placeholder="e.g. Private Portrait Session"
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none text-on-surface dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                id="block-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-400">
                  Target Date *
                </label>
                <input 
                  type="date"
                  required
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs font-bold text-center text-on-surface dark:text-zinc-100 dark:[color-scheme:dark]"
                  id="block-date"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-400">
                  Time
                </label>
                <input 
                  type="time"
                  value={newBlockTime}
                  onChange={(e) => setNewBlockTime(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs font-bold text-center text-on-surface dark:text-zinc-100 dark:[color-scheme:dark]"
                  id="block-time"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-400">
                Target Google Calendar Sub-Feed
              </label>
              <select
                value={newBlockCategory}
                onChange={(e) => setNewBlockCategory(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 text-xs font-bold px-3 py-2.5 rounded-xl text-on-surface dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer focus:border-primary"
                id="block-category"
              >
                <option value="Primary Studio Feed">Primary Studio Feed 👤</option>
                <option value="Equipment Upkeeps">Equipment Upkeeps ⚙️</option>
                <option value="Studio Rentals">Studio Rentals 📸</option>
                <option value="Internal Feed">Internal Staff Feed 🤝</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              id="submit-blockout-button"
            >
              <Plus className="w-4 h-4" /> Block Out Date on Google
            </button>
          </form>
        </section>

        {/* Current Active Synced Google Blocks List */}
        <section className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-headline text-xs font-bold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider">
              Google Blocks This Feed ({googleEvents.length})
            </h4>
            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">
              Synced Blocks
            </span>
          </div>

          <div className="space-y-2 max-h-[190px] overflow-y-auto no-scrollbar">
            {googleEvents.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">No synchronized external blocking slots found.</p>
            ) : (
              googleEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800/70 rounded-xl"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold truncate text-on-surface dark:text-zinc-100">
                      {event.title}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-medium">
                      {event.date} at {event.time} • <span className="text-amber-600 font-semibold">{event.calendarName}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteGoogleEvent(event.id)}
                    className="p-1 px-2 text-[10px] text-error hover:bg-error/10 rounded-lg font-bold flex items-center gap-1 transition-colors"
                    title="Delete synced busy blockout"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Focus Google Event Detail Modal Overlay */}
      {focusedGoogleEvent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative space-y-4">
            
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Google Synced Event</p>
                <h3 className="font-headline font-extrabold text-lg text-on-surface dark:text-zinc-100 leading-tight truncate">
                  {focusedGoogleEvent.title}
                </h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-on-surface-variant dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="font-bold">Date: {focusedGoogleEvent.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-500" />
                <span>Time Block: {focusedGoogleEvent.time}</span>
              </div>
              {focusedGoogleEvent.duration && (
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-500" />
                  <span>Duration: {focusedGoogleEvent.duration}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>Google Account Feed: <span className="font-mono">{syncEmail}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Calendar Group: <span className="font-bold text-amber-600">{focusedGoogleEvent.calendarName}</span></span>
              </div>
            </div>

            {focusedGoogleEvent.description && (
              <p className="text-xs text-zinc-400 italic">
                &ldquo;{focusedGoogleEvent.description}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove this synchronized Google busy blockout from your calendar view?`)) {
                    onDeleteGoogleEvent(focusedGoogleEvent.id);
                    setFocusedGoogleEvent(null);
                  }
                }}
                className="py-2 px-3 text-xs text-error hover:bg-error/10 font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Block
              </button>
              
              <button
                type="button"
                onClick={() => setFocusedGoogleEvent(null)}
                className="py-2 px-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold rounded-xl text-xs transition-colors"
              >
                Acknowledged
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
