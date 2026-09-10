'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import LoginScreen from '@/components/auth/LoginScreen';
import Navbar from '@/components/layout/Navbar';
import Sidebar, { NavTab } from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import SongManager from '@/components/songs/SongManager';
import NotificationManager from '@/components/notifications/NotificationManager';
import UserManager from '@/components/users/UserManager';
import AboutUsManager from '@/components/about/AboutUsManager';
import ApiConfigModal from '@/components/settings/ApiConfigModal';

export default function Home() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openCreateSong, setOpenCreateSong] = useState(false);

  // Loading state while restoring JWT session
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070b14] relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute w-80 h-80 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -bottom-10" />

        <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-300">
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-2xl shadow-indigo-950/70 animate-pulse">
            <div className="w-full h-full bg-[#0d1322] rounded-[22px] p-2 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Bethesda Deliverance Church Emblem"
                width={96}
                height={96}
                className="w-full h-full object-contain filter drop-shadow-md"
                priority
              />
            </div>
            {/* Spinning decorative orbit */}
            <div className="absolute -inset-1.5 rounded-3xl border-2 border-indigo-500/30 border-t-emerald-400/80 animate-spin" />
          </div>

          <h2 className="text-white font-bold text-base sm:text-lg mt-5 tracking-tight">
            பரமனின் கீதங்கள்
          </h2>
          <p className="text-xs text-indigo-200/70 mt-1 font-medium tracking-wide">
            Connecting to Bethesda Church Portal...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated as admin -> show Login Screen
  if (!isAuthenticated || !isAdmin) {
    return (
      <>
        <LoginScreen onOpenSettings={() => setIsSettingsOpen(true)} />
        <ApiConfigModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddNewSong={() => {
          setActiveTab('songs');
          setOpenCreateSong(true);
        }}
        activeTab={activeTab}
      />

      {/* Main Shell */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Dynamic Content Page Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              onNavigate={setActiveTab}
              onAddNewSong={() => {
                setActiveTab('songs');
                setOpenCreateSong(true);
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {activeTab === 'songs' && (
            <SongManager
              initialOpenCreate={openCreateSong}
              onOpenCreateHandled={() => setOpenCreateSong(false)}
            />
          )}

          {activeTab === 'notifications' && <NotificationManager />}

          {activeTab === 'users' && <UserManager />}

          {activeTab === 'about' && <AboutUsManager />}
        </main>
      </div>

      {/* Mobile & App Webview Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* API Configuration & Environment Modal */}
      <ApiConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
