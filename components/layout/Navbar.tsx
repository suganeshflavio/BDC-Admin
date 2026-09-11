'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import {
  LogOut,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onAddNewSong: () => void;
  activeTab: string;
}

export default function Navbar({ onOpenSettings, onAddNewSong }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-sky-100/90 bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        {/* Left: Brand Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-lime-400 p-0.5 shadow-md shadow-sky-500/15">
            <div className="w-full h-full bg-white rounded-[10px] p-1 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
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
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                பரமனின் கீதங்கள்
              </h1>
              <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Bethesda Deliverance Church
            </p>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Song Button */}
          <button
            onClick={onAddNewSong}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-sm shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Song</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-lime-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-sky-500/20">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                  <span>{user?.name || 'Admin'}</span>
                  <ShieldCheck className="w-3 h-3 text-sky-600" />
                </div>
                <div className="text-[10px] text-slate-500 leading-none">{user?.email || 'admin@example.com'}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout(true)}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
