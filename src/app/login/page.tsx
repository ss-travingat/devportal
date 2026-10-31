'use client';

import React, { Suspense, FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        const retryAfter =
          Number(data?.retryAfter) ||
          parseInt(res.headers.get('Retry-After') || '60', 10) ||
          60;
        setLockoutSeconds(retryAfter);
        setError(`Too many login attempts. Locked out for ${retryAfter} seconds.`);
        return;
      }

      if (!res.ok) {
        setError(data?.error || 'Invalid password. Please try again.');
        return;
      }

      // Navigate to destination and refresh route cache
      router.push(nextUrl);
      router.refresh();
    } catch {
      setError('Network connection failed. Please ensure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-8 shadow-2xl space-y-6">
      {/* Brand Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <BrandLogo size={24} className="text-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 block">
              Travingat Internal
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Developer Portal
            </h1>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed pt-2">
          Shared administrator session with Travingat Control. Enter your admin password to proceed.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Admin Password</span>
            <span className="text-[10px] font-mono text-zinc-500">Shared Session</span>
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password..."
              disabled={submitting || lockoutSeconds > 0}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#141416] border border-zinc-700/80 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 focus:bg-[#1a1a1d] transition-colors disabled:opacity-50 font-mono"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Lockout notice */}
        {lockoutSeconds > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Too many failed attempts</p>
              <p className="text-[11px] mt-0.5 text-amber-400/90">
                Login locked out temporarily. Please wait{' '}
                <strong className="font-mono text-white">{lockoutSeconds}s</strong> before retrying.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || lockoutSeconds > 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying session...</span>
            </>
          ) : (
            <>
              <span>Sign In to Devportal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5 font-mono text-[10px]">
          <Lock className="w-3 h-3 text-zinc-400" />
          HTTPOnly Cookie Session
        </span>
        <span className="font-mono text-[10px]">travingat.com</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 w-full min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4 selection:bg-zinc-700 selection:text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-8 text-center text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
            <span>Loading login screen...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
