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
import BannerManager from '@/components/banners/BannerManager';
import UserManager from '@/components/users/UserManager';
import AboutUsManager from '@/components/about/AboutUsManager';
import ApiConfigModal from '@/components/settings/ApiConfigModal';

export default function Home() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openCreateSong, setOpenCreateSong] = useState(false);
  const [openCreateBanner, setOpenCreateBanner] = useState(false);

  // Loading state while restoring JWT session
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-lime-50/40 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute w-80 h-80 bg-sky-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute w-64 h-64 bg-lime-400/20 rounded-full blur-[100px] pointer-events-none -bottom-10" />

        <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-300">
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-lime-400 p-0.5 shadow-2xl shadow-sky-500/20 animate-pulse">
            <div className="w-full h-full bg-white rounded-[22px] p-2 flex items-center justify-center overflow-hidden">
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
            <div className="absolute -inset-1.5 rounded-3xl border-2 border-sky-300/40 border-t-lime-500 animate-spin" />
          </div>

          <h2 className="text-slate-900 font-bold text-base sm:text-lg mt-5 tracking-tight">
            பரமனின் கீதங்கள்
          </h2>
          <p className="text-xs text-sky-700 mt-1 font-medium tracking-wide">
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50/70 via-slate-50 to-lime-50/20 text-slate-900 selection:bg-sky-500/20 selection:text-sky-900">
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

          {activeTab === 'banners' && (
            <BannerManager
              initialOpenCreate={openCreateBanner}
              onOpenCreateHandled={() => setOpenCreateBanner(false)}
            />
          )}

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
