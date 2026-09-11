'use client';

import React from 'react';
import {
  LayoutDashboard,
  Music,
  Bell,
  Building2,
  ChevronRight,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'songs' | 'notifications' | 'about' | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  songsCount?: number;
  notificationsCount?: number;
  usersCount?: number;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  songsCount = 0,
  notificationsCount = 0,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      id: 'songs' as NavTab,
      label: 'Songs Management',
      icon: Music,
      badge: songsCount > 0 ? songsCount : undefined,
      description: 'Lyrics, verses & details',
    },
    {
      id: 'notifications' as NavTab,
      label: 'Notifications',
      icon: Bell,
      badge: notificationsCount > 0 ? notificationsCount : undefined,
      description: 'Worship links & alerts',
    },
    {
      id: 'about' as NavTab,
      label: 'About Church',
      icon: Building2,
      description: 'Ministry & contact info',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-sky-100/90 bg-white/70 backdrop-blur-md p-4 min-h-[calc(100vh-4rem)]">
      {/* Navigation Group */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Admin Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <div className={`leading-snug truncate font-semibold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {item.label}
                  </div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-lime-400 text-slate-950 shadow-sm'
                        : 'bg-sky-100 text-sky-700 group-hover:bg-sky-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
