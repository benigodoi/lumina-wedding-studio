import React, { useState } from 'react';
import { Heart, Sparkles, AlertCircle, Loader } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { signInWithGoogle } from '../lib/googleAuth';

const isNative = Capacitor.isNativePlatform();

export default function AuthView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const errMsg = await signInWithGoogle();
    if (errMsg) {
      setError(errMsg);
      setIsLoading(false);
      return;
    }
    // On web, Supabase redirects the page; on native the Custom Tab is now open
    if (isNative) setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary dark:text-white tracking-tight">
            Lumina Studio
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Wedding management for modern photographers
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-8 space-y-5">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface dark:text-zinc-100">
              Welcome back
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Sign in to access your studio dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-98 transition-all font-semibold text-sm text-on-surface dark:text-zinc-100 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
            By signing in, you grant access to your Google Calendar for event sync.
            Your data is private and secured per account.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-8 text-[11px] text-zinc-400">
          <Sparkles className="w-3 h-3" />
          <span>Lumina Wedding Studio · Secure multi-user sync</span>
        </div>

      </div>
    </div>
  );
}
