/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, Search, SlidersHorizontal, MoreVertical, 
  Trash2, Eye, Award, Sparkles, FileText, DollarSign, Church, HelpCircle
} from 'lucide-react';
import { Wedding, WeddingStatus } from '../types';

interface WeddingsListViewProps {
  weddings: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onDeleteWedding: (id: string) => void;
}

export default function WeddingsListView({ weddings, onSelectWedding, onDeleteWedding }: WeddingsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Quick Overview states
  const totalThisMonthCount = weddings.filter(w => w.date.includes('-06-')).length; // June Overview

  // Filter weddings
  const filteredWeddings = weddings.filter((w) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      w.brideName.toLowerCase().includes(query) || 
      w.groomName.toLowerCase().includes(query) || 
      w.location.toLowerCase().includes(query);
    
    const matchesFilter = statusFilter === 'All' || w.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Featured wedding - find first Confirmed wedding
  const featuredWedding = weddings.find(w => w.status === 'Confirmed' && (w.groomName === 'Ion' || w.groomName === 'Andrei')) || weddings[0];

  const statusColors = {
    'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-350',
    'Pending Deposit': 'bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-350',
    'Signed': 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-355',
    'Final Prep': 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-355',
    'Pending Edit': 'bg-indigo-100 text-indigo-850 dark:bg-indigo-950/40 dark:text-indigo-350'
  };

  const toggleActionsMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMenuId === id) {
      setActiveMenuId(null);
    } else {
      setActiveMenuId(id);
    }
  };

  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-headline font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-block mb-1">
            Studio Portfolio
          </p>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface dark:text-white">
            Scheduled Weddings
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">
            You have {weddings.length} upcoming events currently recorded in your local workspace.
          </p>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search couples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-outline-variant rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-outline-variant text-xs font-semibold px-4 py-2 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-8"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending Deposit">Pending Deposit</option>
              <option value="Signed">Signed</option>
              <option value="Final Prep">Final Prep</option>
              <option value="Pending Edit">Pending Edit</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="space-y-6">
        {statusFilter === 'All' && searchQuery === '' && featuredWedding && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bento Part 1: Featured Card */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.02)] border border-zinc-100 dark:border-zinc-850 overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-6 h-52 md:h-full relative overflow-hidden bg-zinc-100 min-h-[220px]">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKeIBeSOC4XnNjBkg-NkiJUPpRd8uHVINByNzvOh3fM3UyC0nx3k8XhepJ5aNYxzj3BbFTBq2QOu-Kb1iOIMq5spobxYJ1T0X2BTN30jDCGlc7N_4iDg2MUpYGjfiXdpk1t4SGNWEIO0VcYMnZDzrvHc0jOPjdRKNxkKxrX9HSVuwEO-lmLrsaHx6JmAMvjdZFXbZHniotYEWFhmxscRbMp315m-34FiS1BMD6rBb0daRSxfV4EouH1ebPXos-FPHvCvdaozpywEqS"
                    alt="Lush botanical garden wedding banquet"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white font-headline text-[10px] font-bold tracking-wider px-3 py-1 rounded-full shadow-sm uppercase">
                      Upcoming Next
                    </span>
                  </div>
                </div>
                
                <div className="md:col-span-6 p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-headline font-extrabold text-on-surface dark:text-zinc-100 leading-tight">
                        {featuredWedding.brideName} &amp; {featuredWedding.groomName}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[featuredWedding.status]}`}>
                        {featuredWedding.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 text-on-surface-variant dark:text-zinc-400">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold">{featuredWedding.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold">{featuredWedding.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>Coverage starting at {featuredWedding.time}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectWedding(featuredWedding)}
                    className="mt-6 w-full bg-primary hover:bg-primary/95 text-white font-button text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    View Wedding Board
                  </button>
                </div>
              </div>
            </div>

            {/* Bento Part 2: Sidebar Mini stats and actions */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* June overview card */}
              <div className="bg-primary text-white p-6 rounded-2xl relative overflow-hidden flex-1 shadow-md">
                <div className="relative z-10 space-y-2">
                  <Sparkles className="w-8 h-8 opacity-40 animate-pulse" />
                  <h4 className="font-headline font-extrabold text-lg">June Overview</h4>
                  <p className="text-xs text-white/85 leading-relaxed">
                    <strong>{totalThisMonthCount} Weddings</strong> scheduled this month.<br />3 gallery photo deliveries pending edits.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-32 bg-[linear-gradient(135deg,_transparent_40%,_rgba(255,255,255,0.06))] pointer-events-none rounded-r-2xl"></div>
              </div>

              {/* Quick actions box */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-6 rounded-2xl flex-1 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
                <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant dark:text-zinc-400 mb-4 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg inline-block">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => alert('Opening digital contract draft directory')}
                    className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:border-primary/40 rounded-xl gap-1.5 transition-all text-center select-none"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-350">Contracts</span>
                  </button>
                  <button 
                    onClick={() => alert('Accessing secure invoicing tracker')}
                    className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 hover:border-primary/40 rounded-xl gap-1.5 transition-all text-center select-none"
                  >
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-350">Invoices</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWeddings.map((wedding) => {
            const hasChurch = wedding.services.includes('Civil Ceremony');
            const totalBookedCount = wedding.services.length;

            return (
              <div 
                key={wedding.id}
                onClick={() => onSelectWedding(wedding)}
                className="bg-white dark:bg-zinc-900 border border-zinc-105 dark:border-zinc-800 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative group cursor-pointer"
              >
                {/* Status and Icon */}
                <div className="flex justify-between items-start mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {hasChurch ? <Church className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColors[wedding.status]}`}>
                    {wedding.status}
                  </span>
                </div>

                <h3 className="text-base font-headline font-extrabold text-on-surface dark:text-zinc-100 mb-1 group-hover:text-primary dark:group-hover:text-white transition-colors">
                  {wedding.brideName} &amp; {wedding.groomName}
                </h3>

                <div className="space-y-1.5 text-on-surface-variant dark:text-zinc-400 mb-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> {wedding.date}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary cursor-pointer shrink-0" /> 
                    <span className="truncate">{wedding.location}</span>
                  </p>
                </div>

                {/* Card Footer Tag */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
                  <span className="text-[10px] font-headline font-bold uppercase text-primary dark:text-zinc-200 tracking-wide">
                    {wedding.notes || `${totalBookedCount} Booked Services`}
                  </span>
                  
                  {/* Edit menu anchor toggle */}
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleActionsMenu(wedding.id, e)}
                      className="p-1.5 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800/70 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === wedding.id && (
                      <div className="absolute right-0 bottom-8 z-50 bg-white dark:bg-zinc-800 w-36 border border-zinc-150 dark:border-zinc-700 rounded-lg shadow-lg py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectWedding(wedding);
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Board
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to completely remove the metadata and booking details for ${wedding.brideName} & ${wedding.groomName}?`)) {
                              onDeleteWedding(wedding.id);
                            }
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-error font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
