/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, Calendar, MapPin, Clock, DollarSign, Sparkles, 
  Mail, ClipboardList, CheckCircle2, ChevronRight, Copy, Check 
} from 'lucide-react';
import { Wedding } from '../types';
import { SERVICE_PRICES } from '../data';

interface WeddingBoardModalProps {
  wedding: Wedding;
  onClose: () => void;
  onUpdateWedding: (updated: Wedding) => void;
}

export default function WeddingBoardModal({ wedding, onClose, onUpdateWedding }: WeddingBoardModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'ai'>('details');
  const [aiAction, setAiAction] = useState<'timeline' | 'email'>('timeline');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [newActivityTime, setNewActivityTime] = useState('12:00');

  // Calculate estimated prices dynamically
  const totalCost = wedding.services.reduce((sum, service) => sum + (SERVICE_PRICES[service] || 0), 0);
  const remainingCost = Math.max(0, totalCost - wedding.advancePaid);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    const updatedTimeline = [...(wedding.timeline || [])];
    updatedTimeline.push({
      time: newActivityTime,
      activity: newActivity.trim(),
    });

    // Sort timeline by time
    updatedTimeline.sort((a, b) => a.time.localeCompare(b.time));

    onUpdateWedding({
      ...wedding,
      timeline: updatedTimeline,
    });
    setNewActivity('');
  };

  const handleDeleteActivity = (index: number) => {
    const updatedTimeline = [...(wedding.timeline || [])];
    updatedTimeline.splice(index, 1);
    onUpdateWedding({
      ...wedding,
      timeline: updatedTimeline,
    });
  };

  const generateWithAi = async (type: 'timeline' | 'email') => {
    setAiLoading(true);
    setAiAction(type);
    setAiResponse('');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/gemini/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: type,
          groomName: wedding.groomName,
          brideName: wedding.brideName,
          date: wedding.date,
          location: wedding.location,
          services: wedding.services,
          notes: wedding.notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAiResponse(data.text);
      } else {
        setAiResponse(`Failed: ${data.error || 'Unknown server response'}`);
      }
    } catch (err: any) {
      setAiResponse(`Connection Error: ${err.message || 'Error executing AI model proxy request'}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="wedding-board-modal">
      <div 
        className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-zinc-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-primary dark:text-white/80 font-headline uppercase tracking-wider font-semibold">Lumina Wedding Board</p>
              <h3 className="font-headline text-xl text-on-surface dark:text-zinc-100 font-bold">
                {wedding.brideName} &amp; {wedding.groomName}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 font-button text-sm border-b-2 transition-all font-semibold ${
              activeTab === 'details' 
                ? 'border-primary text-primary dark:text-white' 
                : 'border-transparent text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100'
            }`}
          >
            Booking &amp; Documents
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 font-button text-sm border-b-2 transition-all font-semibold ${
              activeTab === 'timeline' 
                ? 'border-primary text-primary dark:text-white' 
                : 'border-transparent text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100'
            }`}
          >
            Wedding Day Timeline
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-4 font-button text-sm border-b-2 flex items-center gap-2 transition-all font-semibold ${
              activeTab === 'ai' 
                ? 'border-primary text-secondary-container dark:text-white bg-primary-container/[0.04] px-4 rounded-t-lg' 
                : 'border-transparent text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-t-lg'
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            Lumina Assistant AI
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: General Info */}
              <div className="space-y-4">
                <div className="bg-surface-container-low dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-headline font-bold text-sm text-on-surface dark:text-zinc-200 mb-4 uppercase tracking-wider">
                    General Reference
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{wedding.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">Starts at {wedding.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{wedding.location}</span>
                    </div>
                    {wedding.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                          {wedding.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-container-low dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-headline font-bold text-sm text-on-surface dark:text-zinc-200 mb-2 uppercase tracking-wider">
                    Client Direct Notes
                  </h4>
                  <p className="text-sm text-on-surface-variant dark:text-zinc-300 italic">
                    "{wedding.notes || 'No custom requests provided for this couple'}"
                  </p>
                </div>
              </div>

              {/* Right Column: Services & Payments */}
              <div className="space-y-4">
                <div className="bg-surface-container-low dark:bg-zinc-800/40 p-5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <h4 className="font-headline font-bold text-sm text-on-surface dark:text-zinc-200 mb-4 uppercase tracking-wider">
                    Booked Packages
                  </h4>
                  <div className="space-y-2">
                    {wedding.services.map((service) => (
                      <div key={service} className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-500" />
                          {service}
                        </span>
                        <span className="text-sm font-bold text-on-surface dark:text-zinc-200">
                          ${SERVICE_PRICES[service] || 0}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-200 dark:border-zinc-700 font-bold text-sm">
                      <span>Total Booked</span>
                      <span className="text-primary">${totalCost}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary text-on-primary p-5 rounded-xl relative overflow-hidden">
                  <h4 className="font-headline font-bold text-sm text-white/95 uppercase tracking-wider mb-3">
                    Finance Recap
                  </h4>
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">Advance Paid</span>
                      <span className="font-bold">${wedding.advancePaid}</span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-white/25 font-bold">
                      <span>Remaining Balance</span>
                      <span>${remainingCost}</span>
                    </div>
                  </div>
                  {/* Backdrop graphic */}
                  <div className="absolute right-0 bottom-0 top-0 w-24 bg-[linear-gradient(135deg,_transparent_30%,_rgba(255,255,255,0.06))] pointer-events-none rounded-r-xl"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm font-medium">
                  {wedding.timeline?.length || 0} event milestones scheduled for the day
                </div>
              </div>

              {/* Timeline Flow */}
              <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-6">
                {wedding.timeline && wedding.timeline.length > 0 ? (
                  wedding.timeline.map((item, index) => (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-zinc-900 shadow-sm"></div>
                      <div className="flex items-start gap-4 justify-between bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-lg hover:border-primary/40 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-primary font-mono">{item.time}</p>
                          <p className="text-sm text-on-surface dark:text-zinc-200 font-medium">{item.activity}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(index)}
                          className="text-xs text-error hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant dark:text-zinc-400 py-4 italic">
                    No custom timeline populated. Use the "Lumina Assistant AI" tab to instantly generate one using Gemini!
                  </p>
                )}
              </div>

              {/* Add Activity Form */}
              <form onSubmit={handleAddActivity} className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl space-y-3">
                <h5 className="text-xs font-headline font-semibold uppercase tracking-wider text-on-surface-variant dark:text-zinc-300">
                  Add Milestone Timeline Event
                </h5>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="time"
                    value={newActivityTime}
                    onChange={(e) => setNewActivityTime(e.target.value)}
                    className="bg-white dark:bg-zinc-900 border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="e.g., Couple First Dance / Cake Cutting"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-primary-container/[0.04] p-5 rounded-2xl border border-primary/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h4 className="font-headline font-bold text-sm text-on-primary-fixed-variant">
                    Lumina Smart Assistant
                  </h4>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-zinc-300">
                  Our server-side coordinator operates on <strong>Gemini 3.5 Flash</strong>. It analyzes booked packages, wedding dates, and locations to construct beautiful, tailored client responses in a single click.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => generateWithAi('timeline')}
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Generate Wedding Timeline Proposal
                  </button>
                  <button
                    onClick={() => generateWithAi('email')}
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-secondary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    Compose Premium Welcoming Email
                  </button>
                </div>
              </div>

              {/* Response Section */}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium animate-pulse">Lumina Assistant is planning and composing your proposal details...</p>
                </div>
              )}

              {aiResponse && !aiLoading && (
                <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-100 dark:bg-zinc-800">
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-600 dark:text-zinc-400">
                      GENERATED PROPOSAL ({aiAction.toUpperCase()})
                    </span>
                    <button
                      onClick={() => copyToClipboard(aiResponse)}
                      className="text-xs flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Text
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-5 text-sm leading-relaxed prose dark:prose-invert max-w-none break-words max-h-[400px] overflow-y-auto font-sans text-on-surface dark:text-zinc-100 whitespace-pre-line bg-white dark:bg-zinc-900">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
