'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import {
  LogOut,
  ShieldCheck,
  Plus,
  Settings,
  Bell,
  Users,
  Building2,
  X,
  ChevronRight,
  Server,
  LayoutDashboard,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  onOpenSettings: () => void;
  onAddNewSong: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  notificationsCount?: number;
  usersCount?: number;
}

export default function Navbar({
  onOpenSettings,
  onAddNewSong,
  activeTab,
  onSelectTab,
  notificationsCount = 0,
  usersCount = 0,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-sky-100/90 bg-white/85 backdrop-blur-xl shadow-sm">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6">
          {/* Left: Brand Icon & Title (clickable to return to Dashboard) */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group transition-transform active:scale-95"
            title="Bethesda Deliverance Church - Home"
          >
            <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-400 to-lime-400 p-0.5 shadow-md shadow-sky-500/15 group-hover:shadow-sky-500/30 transition-all">
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
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">
                  BDC Family
                </h1>
                <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Bethesda Deliverance Church
              </p>
            </div>
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add Song Button (hidden on small mobile screens) */}
            <button
              onClick={onAddNewSong}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-sm shadow-sky-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Song</span>
            </button>

            {/* Desktop User Profile Pill & Logout (hidden on mobile screen) */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-lime-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-sky-500/20">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                    <span>{user?.name || 'Admin'}</span>
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-none">{user?.email || 'admin@example.com'}</div>
                </div>
              </div>

              {/* Desktop Logout Button */}
              <button
                onClick={() => logout(true)}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Icon Button - Prominent in mobile header & accessible on desktop */}
            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 border border-sky-200/80 transition-all active:scale-95 shadow-xs"
              title="Settings & Admin Menu"
              aria-label="Settings and Admin Menu"
            >
              <Settings className="w-5 h-5 transition-transform duration-300 hover:rotate-45" />
              {(notificationsCount > 0 || usersCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-lime-500 rounded-full border-2 border-white shadow-xs" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Settings & Admin Menu Slide-over Drawer */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSettingsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
            <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col border-l border-sky-100 animate-in slide-in-from-right duration-300 ease-out">

              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50/70 via-white to-lime-50/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shadow-xs">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Settings & Admin</h2>
                    <p className="text-[11px] text-slate-500">Bethesda Deliverance Church</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close settings drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* 1. User Details Card */}
                <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-50 via-sky-50/50 to-lime-50/40 border border-sky-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-400 to-lime-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-sky-500/20 shrink-0">
                      {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {user?.name || 'Administrator'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user?.email || 'admin@bethesda.org'}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-sky-700 border border-sky-200 shadow-xs">
                        <ShieldCheck className="w-3 h-3 text-sky-600" />
                        <span>Administrator</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside User Details */}
                  <div className="pt-2 border-t border-sky-200/60 flex flex-col gap-2">
                    {/* <button
                      onClick={() => {
                        setIsSettingsDrawerOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-xs font-semibold border border-sky-100 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Server className="w-4 h-4 text-sky-600" />
                        <span>API Configuration</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button> */}

                    <button
                      onClick={() => {
                        setIsSettingsDrawerOpen(false);
                        logout(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                    </button>
                  </div>
                </div>

                {/* 2. Admin Features & Navigation */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Administration
                  </div>

                  {/* Alerts (Notifications) */}
                  <button
                    onClick={() => {
                      onSelectTab('notifications');
                      setIsSettingsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      activeTab === 'notifications'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent shadow-md shadow-sky-500/20'
                        : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200/80 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          activeTab === 'notifications' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-600'
                        }`}
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold ${activeTab === 'notifications' ? 'text-white' : 'text-slate-900'}`}>
                          Alerts & Notifications
                        </div>
                        <div className={`text-[11px] ${activeTab === 'notifications' ? 'text-sky-100' : 'text-slate-500'}`}>
                          Worship broadcast links & push alerts
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {notificationsCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          activeTab === 'notifications' ? 'bg-lime-400 text-slate-950' : 'bg-lime-100 text-lime-800'
                        }`}>
                          {notificationsCount}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </button>

                  {/* Admin Users */}
                  <button
                    onClick={() => {
                      onSelectTab('users');
                      setIsSettingsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      activeTab === 'users'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent shadow-md shadow-sky-500/20'
                        : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200/80 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold ${activeTab === 'users' ? 'text-white' : 'text-slate-900'}`}>
                          Admin Users
                        </div>
                        <div className={`text-[11px] ${activeTab === 'users' ? 'text-sky-100' : 'text-slate-500'}`}>
                          Account access & permissions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {usersCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          activeTab === 'users' ? 'bg-lime-400 text-slate-950' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {usersCount}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </button>

                  {/* Church (About Church) */}
                  <button
                    onClick={() => {
                      onSelectTab('about');
                      setIsSettingsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      activeTab === 'about'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent shadow-md shadow-sky-500/20'
                        : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200/80 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          activeTab === 'about' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold ${activeTab === 'about' ? 'text-white' : 'text-slate-900'}`}>
                          About Church
                        </div>
                        <div className={`text-[11px] ${activeTab === 'about' ? 'text-sky-100' : 'text-slate-500'}`}>
                          Ministry & contact info
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'about' ? 'text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* Dashboard Overview */}
                  <button
                    onClick={() => {
                      onSelectTab('dashboard');
                      setIsSettingsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent shadow-md shadow-sky-500/20'
                        : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200/80 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={`text-xs font-bold ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-900'}`}>
                          Dashboard Overview
                        </div>
                        <div className={`text-[11px] ${activeTab === 'dashboard' ? 'text-sky-100' : 'text-slate-500'}`}>
                          Summary & main metrics
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                  Bethesda Deliverance Church Admin Portal
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
