'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import {
  Music,
  LogOut,
  Settings,
  Server,
  Sparkles,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { isDemoModeEnabled, getApiBaseUrl } from '@/lib/api';

interface NavbarProps {
  onOpenSettings: () => void;
  onAddNewSong: () => void;
  activeTab: string;
}

export default function Navbar({ onOpenSettings, onAddNewSong }: NavbarProps) {
  const { user, logout } = useAuth();
  const isDemo = typeof window !== 'undefined' && isDemoModeEnabled();
  const currentBaseUrl = typeof window !== 'undefined' ? getApiBaseUrl() : 'http://192.168.1.64:3099/api/v1';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        {/* Left: Brand Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-emerald-400 p-0.5 shadow-md shadow-indigo-950/40">
            <div className="w-full h-full bg-[#0d1322] rounded-[10px] p-1 flex items-center justify-center overflow-hidden">
              <Image
                src="/icon.png"
                alt="Bethesda Deliverance Church Emblem"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                பரமனின் கீதங்கள்
              </h1>
              <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Bethesda Deliverance Church
            </p>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection Status Pill */}
          {/* <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-300 transition-colors shadow-sm"
            title="Configure API Connection"
          >
            {isDemo ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 hidden md:inline">Demo Mode</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 md:hidden" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="hidden md:inline truncate max-w-[130px]">{currentBaseUrl.replace(/^https?:\/\//, '')}</span>
                <Server className="w-3.5 h-3.5 text-emerald-400 md:hidden" />
              </>
            )}
          </button> */}

          {/* Quick Add Song Button */}
          <button
            onClick={onAddNewSong}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Song</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2 py-1 px-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                  <span>{user?.name || 'Admin'}</span>
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                </div>
                <div className="text-[10px] text-slate-400 leading-none">{user?.email || 'admin@example.com'}</div>
              </div>
            </div>

            {/* API Settings Icon Button */}
            {/* <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button> */}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
