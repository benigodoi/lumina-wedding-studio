/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, DollarSign, Bell, Shield, Sliders, ToggleRight, 
  RotateCcw, Sparkles, Check, Globe, HelpCircle, Mail
} from 'lucide-react';
import { SERVICE_PRICES } from '../data';

interface SettingsViewProps {
  studioName: string;
  onUpdateStudioName: (name: string) => void;
  onResetData: () => void;
}

export default function SettingsView({ studioName, onUpdateStudioName, onResetData }: SettingsViewProps) {
  const [editingName, setEditingName] = useState(studioName);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Custom Prices Mock
  const [photoPrice, setPhotoPrice] = useState(SERVICE_PRICES['Photography']);
  const [cinePrice, setCinePrice] = useState(SERVICE_PRICES['Cinematography']);
  const [civilPrice, setCivilPrice] = useState(SERVICE_PRICES['Civil Ceremony']);
  const [albumPrice, setAlbumPrice] = useState(SERVICE_PRICES['Wedding Album']);

  // Toggles
  const [notifSound, setNotifSound] = useState(true);
  const [syncOnOpen, setSyncOnOpen] = useState(true);
  const [aiAdvancedMode, setAiAdvancedMode] = useState(true);

  const handleUpdateStudio = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudioName(editingName.trim());
    
    // Core package price updater
    SERVICE_PRICES['Photography'] = photoPrice;
    SERVICE_PRICES['Cinematography'] = cinePrice;
    SERVICE_PRICES['Civil Ceremony'] = civilPrice;
    SERVICE_PRICES['Wedding Album'] = albumPrice;

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you absolutely sure you want to reset all newly added weddings, prices, schedules, and custom names back to default system seeds? This is irreversible.')) {
      onResetData();
      setEditingName('Lumina Wedding Studio');
      setPhotoPrice(1500);
      setCinePrice(2000);
      setCivilPrice(600);
      setAlbumPrice(400);
      alert('Workspace reset successfully to defaults!');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-headline font-extrabold text-on-surface dark:text-white">
          Studio Configurations
        </h2>
        <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">
          Edit global studio configurations, dynamic packaging prices, and notification flags.
        </p>
      </div>

      {/* Appearance card removed — toggle is in the top-right header */}

      <form onSubmit={handleUpdateStudio} className="space-y-6">
        {/* Studio profile info card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-bold text-sm text-on-surface dark:text-zinc-100">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-base">Studio Identity</h3>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-headline font-bold text-on-surface-variant dark:text-zinc-400">
              Active Studio Brand Name
            </label>
            <input 
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
              placeholder="e.g. Lumina Wedding Studio"
            />
          </div>
        </div>

        {/* Dynamic Package Prices Editor */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-bold text-sm text-on-surface dark:text-zinc-100">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-base">Bookables Base Rates ($)</h3>
          </div>
          
          <p className="text-xs text-on-surface-variant dark:text-zinc-400">
            These rates feed directly into the general New Wedding Entry dynamic price calculator in real time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-headline font-bold text-on-surface-variant dark:text-zinc-400">
                Photography Base Fee ($)
              </label>
              <input 
                type="number"
                value={photoPrice}
                onChange={(e) => setPhotoPrice(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-headline font-bold text-on-surface-variant dark:text-zinc-400">
                Cinematography Base Fee ($)
              </label>
              <input 
                type="number"
                value={cinePrice}
                onChange={(e) => setCinePrice(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-headline font-bold text-on-surface-variant dark:text-zinc-400">
                Civil Ceremony Union Fee ($)
              </label>
              <input 
                type="number"
                value={civilPrice}
                onChange={(e) => setCivilPrice(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-headline font-bold text-on-surface-variant dark:text-zinc-400">
                Linen hardback Print Album Fee ($)
              </label>
              <input 
                type="number"
                value={albumPrice}
                onChange={(e) => setAlbumPrice(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-800 border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm focus:outline-none text-on-surface dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Toggles preferences */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-bold text-sm text-on-surface dark:text-zinc-100">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-base">Preferences</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-zinc-100">Enable Coordination Notification Sounds</p>
                <p className="text-xs text-on-surface-variant dark:text-zinc-450">Alert for timeline entries and booking reminders</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifSound}
                onChange={(e) => setNotifSound(e.target.checked)}
                className="w-10 h-5 bg-zinc-200 checked:bg-primary rounded-full appearance-none relative cursor-pointer before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-zinc-100">Active Background Google Sync on Open</p>
                <p className="text-xs text-on-surface-variant dark:text-zinc-450">Triggers an automatic refresh cycle once the application mounts</p>
              </div>
              <input 
                type="checkbox" 
                checked={syncOnOpen}
                onChange={(e) => setSyncOnOpen(e.target.checked)}
                className="w-10 h-5 bg-zinc-200 checked:bg-primary rounded-full appearance-none relative cursor-pointer before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold dark:text-zinc-100">Lumina Assistant AI Proactive Suggestion Mode</p>
                <p className="text-xs text-on-surface-variant dark:text-zinc-450">Enables high fidelity coordinator proposal models</p>
              </div>
              <input 
                type="checkbox" 
                checked={aiAdvancedMode}
                onChange={(e) => setAiAdvancedMode(e.target.checked)}
                className="w-10 h-5 bg-zinc-200 checked:bg-primary rounded-full appearance-none relative cursor-pointer before:content-[''] before:absolute before:w-5 before:h-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-150 dark:border-zinc-800">
          <button 
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-error cursor-pointer bg-white dark:bg-zinc-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Application Workspace
          </button>
          
          <button 
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer justify-center"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              'Save Configuration settings'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
