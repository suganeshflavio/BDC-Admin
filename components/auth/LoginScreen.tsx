'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Lock, Mail, ShieldAlert, Sparkles, Server, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getApiBaseUrl, isDemoModeEnabled } from '@/lib/api';

interface LoginScreenProps {
  onOpenSettings?: () => void;
}

export default function LoginScreen({ onOpenSettings }: LoginScreenProps) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please verify your credentials.');
      }
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('');
    setPassword('');
    setErrorMessage(null);
  };

  const isDemo = typeof window !== 'undefined' && isDemoModeEnabled();
  const currentBaseUrl = typeof window !== 'undefined' ? getApiBaseUrl() : 'http://192.168.1.64:3099/api/v1';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-[#070b14]">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in duration-500">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-2xl shadow-indigo-950/60 mb-3 group hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#0d1322] rounded-[22px] p-2 flex items-center justify-center overflow-hidden">
              <Image
                src="/icon.png"
                alt="Bethesda Deliverance Church Emblem"
                width={96}
                height={96}
                className="w-full h-full object-contain filter drop-shadow-md"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            பரமனின் கீதங்கள்
          </h1>
          <p className="text-sm text-indigo-200/80 font-medium mt-1">
            Bethesda Deliverance Church — Admin Portal
          </p>
          {/* <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Admin API Integration v1.0
          </div> */}
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 relative">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Admin Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your authorized admin credentials to manage songs, notifications, and church information.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Fill Button */}
            {/* <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-indigo-300 border border-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fill Sample Admin Credentials ()
            </button> */}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Connection Footer */}
          {/* <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 truncate max-w-[210px]">
              <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{currentBaseUrl}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 shrink-0 ml-2"
              >
                API Settings
              </button>
            )}
          </div> */}
        </div>

        {/* PDF Spec notice */}
        {/* <p className="text-center text-[11px] text-slate-500 mt-4 leading-relaxed">
          Authorization: Bearer &lt;jwt&gt; required for all <code className="text-slate-400">/admin/*</code> routes.
          {isDemo && <span className="text-amber-400/90 ml-1">(Demo Mode Active)</span>}
        </p> */}
      </div>
    </div>
  );
}
