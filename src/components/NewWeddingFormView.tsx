/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, MapPin, Award, CheckCircle2, ShieldAlert, FileText, 
  Upload, Sparkles, DollarSign, Camera, Video, Church, BookOpen, AlertCircle
} from 'lucide-react';
import { Wedding, WeddingStatus } from '../types';
import { SERVICE_PRICES } from '../data';

interface NewWeddingFormViewProps {
  initialDate?: string;
  onAddWedding: (wedding: Wedding) => void;
  onCancel: () => void;
}

export default function NewWeddingFormView({ initialDate = '', onAddWedding, onCancel }: NewWeddingFormViewProps) {
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Selected packages
  const [photography, setPhotography] = useState(false);
  const [cinematography, setCinematography] = useState(false);
  const [civilCeremony, setCivilCeremony] = useState(false);
  const [weddingAlbum, setWeddingAlbum] = useState(false);

  // Financial values
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [remainingPaid, setRemainingPaid] = useState<number>(0);

  // Attachment mock
  const [contractFile, setContractFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  // Dynamic pricing calculation
  let estimatedTotal = 0;
  if (photography) estimatedTotal += SERVICE_PRICES['Photography'];
  if (cinematography) estimatedTotal += SERVICE_PRICES['Cinematography'];
  if (civilCeremony) estimatedTotal += SERVICE_PRICES['Civil Ceremony'];
  if (weddingAlbum) estimatedTotal += SERVICE_PRICES['Wedding Album'];

  // Automatically update the remaining amount based on payments
  useEffect(() => {
    setRemainingPaid(Math.max(0, estimatedTotal - advancePaid));
  }, [estimatedTotal, advancePaid]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0].name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setContractFile(e.dataTransfer.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groomName.trim() || !brideName.trim() || !date || !location.trim()) {
      alert('Please fill out all mandatory general details (Groom, Bride, Date, and Venue).');
      return;
    }

    const servicesList: ('Photography' | 'Cinematography' | 'Civil Ceremony' | 'Wedding Album')[] = [];
    if (photography) servicesList.push('Photography');
    if (cinematography) servicesList.push('Cinematography');
    if (civilCeremony) servicesList.push('Civil Ceremony');
    if (weddingAlbum) servicesList.push('Wedding Album');

    if (servicesList.length === 0) {
      alert('Please select at least one Package or Service for this wedding.');
      return;
    }

    const newWedding: Wedding = {
      id: `w-${Date.now()}`,
      groomName: groomName.trim(),
      brideName: brideName.trim(),
      date,
      time,
      location: location.trim(),
      status: advancePaid > 0 ? 'Confirmed' : 'Pending Deposit',
      services: servicesList,
      advancePaid,
      remaining: remainingPaid,
      notes: notes.trim() || undefined,
      email: email.trim() || undefined,
      timeline: [
        { time: '14:00', activity: 'Photographer Arrival & Venue scouting' },
        { time: '15:30', activity: 'Preparation shoot detail snaps' },
        { time: '17:30', activity: 'Ceremony Union begins!' }
      ]
    };

    onAddWedding(newWedding);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* Title block */}
      <div className="lg:col-span-12">
        <h2 className="text-2xl font-headline font-extrabold text-on-surface dark:text-white">
          New Wedding Entry
        </h2>
        <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">
          Populate contract booking and coordination details for this celebratory couples day portfolio.
        </p>
      </div>

      {/* Main Column 1: General details & Packages */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Card 1: General Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-805 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <User className="text-primary w-5 h-5" />
            <h3 className="font-headline font-bold text-on-surface dark:text-zinc-200 text-base">
              General Reference Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Groom Name *
              </label>
              <input 
                type="text"
                required
                placeholder="e.g. Ion Smith"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Bride Name *
              </label>
              <input 
                type="text"
                required
                placeholder="e.g. Maria Popescu"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Wedding Date *
              </label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Preferred Event Start Time
              </label>
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Location / Venue Address *
              </label>
              <div className="relative">
                <MapPin className="text-zinc-400 w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. Palatul Mogoșoaia, Bucharest"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-9 pr-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                Client Coordinates Email
              </label>
              <input 
                type="email"
                placeholder="e.g. couple@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface-container-low dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 focus:outline-none transition-colors text-sm text-on-surface dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Services / Checkboxes */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-805 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Camera className="text-primary w-5 h-5" />
            <h3 className="font-headline font-bold text-on-surface dark:text-zinc-200 text-base">
              Packages &amp; Services Block
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Box 1 */}
            <label 
              className={`group relative flex items-center p-4 rounded-xl border cursor-pointer select-none transition-all ${
                photography 
                  ? 'border-primary bg-primary/5' 
                  : 'border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:border-zinc-300'
              }`}
            >
              <input 
                type="checkbox"
                checked={photography}
                onChange={(e) => setPhotography(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary mr-3 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface dark:text-zinc-100">Photography Package</span>
                <span className="text-[10px] text-zinc-400">Full day coverage + High resolution prints (${SERVICE_PRICES['Photography']})</span>
              </div>
              <Camera className="absolute right-4 text-primary opacity-20 group-hover:opacity-105 transition-opacity w-5 h-5" />
            </label>

            {/* Box 2 */}
            <label 
              className={`group relative flex items-center p-4 rounded-xl border cursor-pointer select-none transition-all ${
                cinematography 
                  ? 'border-primary bg-primary/5' 
                  : 'border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905/40 hover:border-zinc-300'
              }`}
            >
              <input 
                type="checkbox"
                checked={cinematography}
                onChange={(e) => setCinematography(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary mr-3 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface dark:text-zinc-100">Cinematography Package</span>
                <span className="text-[10px] text-zinc-400">4K Cinematic video + drone coverage (${SERVICE_PRICES['Cinematography']})</span>
              </div>
              <Video className="absolute right-4 text-primary opacity-20 group-hover:opacity-105 transition-opacity w-5 h-5" />
            </label>

            {/* Box 3 */}
            <label 
              className={`group relative flex items-center p-4 rounded-xl border cursor-pointer select-none transition-all ${
                civilCeremony 
                  ? 'border-primary bg-primary/5' 
                  : 'border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905/40 hover:border-zinc-300'
              }`}
            >
              <input 
                type="checkbox"
                checked={civilCeremony}
                onChange={(e) => setCivilCeremony(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary mr-3 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface dark:text-zinc-100">Civil Ceremony Union</span>
                <span className="text-[10px] text-zinc-400">Separate registry date coverage (${SERVICE_PRICES['Civil Ceremony']})</span>
              </div>
              <Church className="absolute right-4 text-primary opacity-20 group-hover:opacity-105 transition-opacity w-5 h-5" />
            </label>

            {/* Box 4 */}
            <label 
              className={`group relative flex items-center p-4 rounded-xl border cursor-pointer select-none transition-all ${
                weddingAlbum} ` + (weddingAlbum ? 'border-primary bg-primary/5' : 'border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905/40 hover:border-zinc-300')}
            >
              <input 
                type="checkbox"
                checked={weddingAlbum}
                onChange={(e) => setWeddingAlbum(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary mr-3 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-on-surface dark:text-zinc-100">Premium Leather Wedding Album</span>
                <span className="text-[10px] text-zinc-400">Premium hardback linen prints (${SERVICE_PRICES['Wedding Album']})</span>
              </div>
              <BookOpen className="absolute right-4 text-primary opacity-20 group-hover:opacity-105 transition-opacity w-5 h-5" />
            </label>
          </div>
        </div>

        {/* Section 3: Document Uploads & Pay fields */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-105 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-bold text-sm text-on-surface dark:text-zinc-100">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-base">
              Documents &amp; Payments
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-headline font-bold text-on-surface-variant dark:text-zinc-400 tracking-wider">
                Digital Wedding Contract Upload
              </label>

              {/* Drag drop slot */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative group ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary hover:bg-zinc-50 dark:hover:bg-zinc-800/20'
                }`}
              >
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
                <Upload className="text-zinc-400 group-hover:text-primary transition-colors w-8 h-8" />
                <span className="text-xs font-semibold text-on-surface dark:text-zinc-100">
                  {contractFile ? `File attached: ${contractFile}` : 'Click to select or drag and drop wedding agreement'}
                </span>
                <span className="text-[9px] text-zinc-400">PDF, DOC files up to 10MB</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                  Advance Paid ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0.00"
                    value={advancePaid === 0 ? '' : advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full bg-surface-container-low dark:bg-zinc-850 border border-outline-variant rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                  Remaining Estimate Balance ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="number" 
                    disabled
                    placeholder="0.00"
                    value={remainingPaid}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-outline-variant rounded-xl pl-8 pr-4 py-3 text-sm text-zinc-500 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Timeline Notes prompt section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-105 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-3">
          <label className="text-[10px] font-headline font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
            Special Coordination Notes / Custom AI Prompt Rules
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
            placeholder="e.g. Drone photography at high altitudes, requested sunset outdoor forest shoot, 2nd photographer leaves early, custom timelines rules etc."
          ></textarea>
        </div>

      </div>

      {/* Sidebar: Booking preview & checks */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Card: Booking preview */}
        <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h4 className="font-headline font-extrabold text-lg">Booking Preview</h4>
            
            <div className="space-y-2 text-white/90">
              <div className="flex justify-between text-sm items-center">
                <span>Calculated Estimated Total</span>
                <span className="text-xl font-headline font-black">${estimatedTotal.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/20"></div>
              <div className="flex items-center gap-2 pt-1">
                <ShieldAlert className="w-4 h-4 shrink-0 text-white/80" />
                <p className="text-[10px] italic leading-tight text-white/85">
                  Client contract details are locked and securely compiled to Lumina Studio records.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-24 bg-[linear-gradient(135deg,_transparent_30%,_rgba(255,255,255,0.06))] pointer-events-none rounded-r-2xl"></div>
        </div>

        {/* Card: timeline check */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-805 shadow-[0px_4px_20px_rgba(0,0,0,0.02)]">
          <h4 className="font-headline text-xs font-bold text-on-surface-variant dark:text-zinc-350 uppercase mb-4 tracking-wider">
            Timeline Conflict Check
          </h4>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 shrink-0">
              <CheckCircle2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-on-surface dark:text-zinc-100">
                No Calendar Conflicts Detected
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Target date is fully vacant in your synced Google Calendar schedules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="lg:col-span-12 border-t border-zinc-150 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-end gap-3.5">
        <button 
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 font-button text-xs font-bold border border-outline-variant hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg text-on-surface dark:text-zinc-100 cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="w-full sm:w-auto px-8 py-2.5 font-button text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-lg shadow-md cursor-pointer text-center"
        >
          Finalize Wedding Booking
        </button>
      </div>

    </form>
  );
}
