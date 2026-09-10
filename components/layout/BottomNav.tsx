'use client';

import React from 'react';
import { LayoutDashboard, Music, Bell, Building2, Users } from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  songsCount?: number;
  notificationsCount?: number;
  usersCount?: number;
}

export default function BottomNav({
  activeTab,
  onSelectTab,
  songsCount = 0,
  notificationsCount = 0,
  usersCount = 0,
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
      id: 'users' as NavTab,
      label: 'Users',
      icon: Users,
      badge: usersCount > 0 ? usersCount : undefined,
    },
    {
      id: 'about' as NavTab,
      label: 'Church',
      icon: Building2,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-indigo-500 to-amber-400 rounded-full" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white min-w-[16px] text-center border border-[#090d16]">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-white font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
