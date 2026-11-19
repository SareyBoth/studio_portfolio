'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const safeNext = nextPath && nextPath.startsWith('/dashboard') ? nextPath : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Sign in failed. Please check your credentials.');
        return;
      }

      router.replace(safeNext);
      router.refresh();
    } catch {
      setError('Network error while signing in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-[#14151a] border border-white/15 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#d7ff3f] tracking-widest block mb-1">
              {'// STUDIO ADMIN ACCESS'}
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Sign In</h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#d7ff3f]/10 border border-[#d7ff3f]/30 flex items-center justify-center text-[#d7ff3f]">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-500/10 border border-red-500/40 px-4 py-3 text-xs font-mono text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2"
            >
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="current-password"
                className="block text-xs font-mono text-zinc-400 uppercase tracking-wider"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide password' : 'Show password'}</span>
              </button>
            </div>
            <input
              id="current-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              enterKeyHint="done"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl bg-[#0b0b0d] border border-white/10 focus:border-[#d7ff3f] text-sm text-white outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-[#d7ff3f] hover:brightness-110 active:scale-[0.99] text-black font-mono font-bold text-sm transition-all cursor-pointer disabled:opacity-50 mt-1"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-[#d7ff3f] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 3D Studio</span>
          </Link>
          <span>Single-Owner Auth</span>
        </div>
      </div>
    </div>
  );
}
