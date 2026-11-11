'use client';

import React, { Suspense, FormEvent, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertTriangle, ArrowRight, RefreshCw, Lock } from 'lucide-react';
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

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!password.trim()) { setError('Password is required'); return; }

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
        const retryAfter = Number(data?.retryAfter) || parseInt(res.headers.get('Retry-After') || '60', 10) || 60;
        setLockoutSeconds(retryAfter);
        setError(`Too many login attempts. Locked out for ${retryAfter} seconds.`);
        return;
      }

      if (!res.ok) {
        setError(data?.error || 'Invalid password. Please try again.');
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } catch {
      setError('Network connection failed. Please ensure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] space-y-6">
      {/* Brand */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
          <BrandLogo size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white">Developer Portal</h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Travingat internal infrastructure dashboard
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-6 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-zinc-400 flex items-center justify-between">
              <span>Admin Password</span>
              <span className="text-[10px] text-zinc-600 font-mono">shared session</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                disabled={submitting || lockoutSeconds > 0}
                className="w-full pl-4 pr-10 py-2.5 text-[13px] bg-zinc-950/80 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-colors disabled:opacity-50 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Error / lockout */}
          {lockoutSeconds > 0 ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3 text-[12px] text-amber-400 flex items-start gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Too many attempts — wait{' '}
                <strong className="font-mono text-amber-200">{lockoutSeconds}s</strong> before retrying.
              </span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/8 p-3 text-[12px] text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || lockoutSeconds > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[13px] font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-2.5 h-2.5" />
            HTTPOnly cookie session
          </span>
          <span className="font-mono">devportal.travingat.com</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 w-full min-h-screen bg-[#0e0e0e] flex items-center justify-center p-6">
      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(90,69,249,0.12) 0%, transparent 70%)',
        }}
      />
      <Suspense
        fallback={
          <div className="text-zinc-600 text-[13px] animate-pulse">Loading...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
