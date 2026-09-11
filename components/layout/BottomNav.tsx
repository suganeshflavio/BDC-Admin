'use client';

import React from 'react';
import { LayoutDashboard, Music, Bell, Building2, Image as ImageIcon } from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  songsCount?: number;
  notificationsCount?: number;
  bannersCount?: number;
  usersCount?: number;
}

export default function BottomNav({
  activeTab,
  onSelectTab,
  songsCount = 0,
  notificationsCount = 0,
  bannersCount = 0,
}: BottomNavProps) {
  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'songs' as NavTab,
      label: 'Songs',
      icon: Music,
      badge: songsCount > 0 ? songsCount : undefined,
    },
    {
      id: 'notifications' as NavTab,
      label: 'Alerts',
      icon: Bell,
      badge: notificationsCount > 0 ? notificationsCount : undefined,
    },
    {
      id: 'banners' as NavTab,
      label: 'Banners',
      icon: ImageIcon,
      badge: bannersCount > 0 ? bannersCount : undefined,
    },
    {
      id: 'about' as NavTab,
      label: 'Church',
      icon: Building2,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-sky-100 pb-safe shadow-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive ? 'text-sky-600' : 'text-slate-400 hover:text-sky-600'
              }`}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-sky-500 to-lime-500 rounded-full shadow-sm shadow-sky-500/30" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-sky-600' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-lime-400 text-slate-950 min-w-[16px] text-center border border-white shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-slate-900 font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
